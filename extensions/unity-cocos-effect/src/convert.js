'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const yazl = require('yazl');
const { readUnityPackage, parseUnityYaml } = require('./unitypackage');
const { cubeGlb } = require('./primitives');

const TEMPLATE_DIR = path.join(__dirname, '..', 'templates');
const PARTICLE_TEMPLATE = JSON.parse(fs.readFileSync(path.join(TEMPLATE_DIR, 'particle.prefab.json'), 'utf8'));
const MATERIAL_TEMPLATE = JSON.parse(fs.readFileSync(path.join(TEMPLATE_DIR, 'particle.mtl.json'), 'utf8'));
const IMAGE_META_TEMPLATE = JSON.parse(fs.readFileSync(path.join(TEMPLATE_DIR, 'image.meta.json'), 'utf8'));
const EFFECT_UUID = 'd1346436-ac96-4271-b863-1f4fdead95b0';

function uuid(seed) {
  const h = crypto.createHash('sha256').update(seed).digest('hex').slice(0, 32);
  return `${h.slice(0,8)}-${h.slice(8,12)}-4${h.slice(13,16)}-a${h.slice(17,20)}-${h.slice(20,32)}`;
}
function clone(x) { return JSON.parse(JSON.stringify(x)); }
function ref(id) { return { __id__: id }; }
function assetRef(id) { return { __uuid__: id }; }
function num(x, fallback = 0) { const n = Number(x); return Number.isFinite(n) ? n : fallback; }
function flag(x) { return x === true || x === 1; }
function safeName(x) { return String(x || 'Particle').replace(/[\\/:*?"<>|\x00-\x1f]/g, '_').slice(0, 90); }
function json(x) { return Buffer.from(`${JSON.stringify(x, null, 2)}\n`); }
function directoryMeta(id) { return { ver: '1.2.0', importer: 'directory', imported: true, uuid: id, files: [], subMetas: {}, userData: {} }; }
function fileMeta(importer, version, id, userData = {}) {
  return { ver: version, importer, imported: true, uuid: id, files: ['.json'], subMetas: {}, userData };
}
function color(v) {
  return { __type__: 'cc.Color', r: Math.round(Math.max(0, Math.min(1, num(v?.r, 1))) * 255), g: Math.round(Math.max(0, Math.min(1, num(v?.g, 1))) * 255), b: Math.round(Math.max(0, Math.min(1, num(v?.b, 1))) * 255), a: Math.round(Math.max(0, Math.min(1, num(v?.a, 1))) * 255) };
}
function vec(v, mirrorZ = false) { return { __type__: 'cc.Vec3', x: num(v?.x), y: num(v?.y), z: num(v?.z) * (mirrorZ ? -1 : 1) }; }
function curve(src, scale = 1) {
  const keys = src?.m_Curve || [];
  return { __type__: 'cc.RealCurve', _times: keys.map(k => num(k.time)), _values: keys.map(k => ({ __type__: 'cc.RealKeyframeValue', value: num(k.value), interpolationMode: 2, leftTangent: num(k.inSlope), rightTangent: num(k.outSlope), leftTangentWeight: num(k.inWeight), rightTangentWeight: num(k.outWeight), tangentWeightMode: num(k.weightedMode) })), preExtrapolation: 0, postExtrapolation: 0 };
}
function setCurve(out, src, scale = 1) {
  if (!src || typeof src !== 'object') return;
  const mode = num(src.minMaxState);
  out.mode = mode;
  out.multiplier = mode === 1 || mode === 2 ? num(src.scalar, 1) * scale : 1;
  delete out.spline; delete out.splineMin; delete out.splineMax;
  delete out.constantMin; delete out.constantMax;
  if (mode === 0) out.constant = num(src.scalar) * scale;
  else if (mode === 1) out.spline = curve(src.maxCurve);
  else if (mode === 2) { out.splineMin = curve(src.minCurve); out.splineMax = curve(src.maxCurve); }
  else if (mode === 3) { out.constantMin = num(src.minScalar) * scale; out.constantMax = num(src.scalar) * scale; }
  else { out.mode = 0; out.constant = num(src.scalar) * scale; }
}
function unityGradient(src) {
  const cCount = Math.max(0, Math.min(8, num(src?.m_NumColorKeys)));
  const aCount = Math.max(0, Math.min(8, num(src?.m_NumAlphaKeys)));
  return { __type__: 'cc.Gradient', mode: num(src?.m_Mode), colorKeys: Array.from({ length: cCount }, (_, i) => ({ __type__: 'cc.ColorKey', color: color(src[`key${i}`]), time: num(src[`ctime${i}`]) / 65535 })), alphaKeys: Array.from({ length: aCount }, (_, i) => ({ __type__: 'cc.AlphaKey', alpha: color(src[`key${i}`]).a, time: num(src[`atime${i}`]) / 65535 })) };
}
function setGradient(out, src) {
  if (!src) return;
  const mode = num(src.minMaxState);
  out._mode = mode;
  for (const k of ['gradient', 'gradientMin', 'gradientMax', 'colorMin', 'colorMax']) delete out[k];
  if (mode === 0) out.color = color(src.maxColor);
  else if (mode === 1 || mode === 4) out.gradient = unityGradient(src.maxGradient);
  else if (mode === 2) { out.colorMin = color(src.minColor); out.colorMax = color(src.maxColor); }
  else if (mode === 3) { out.gradientMin = unityGradient(src.minGradient); out.gradientMax = unityGradient(src.maxGradient); }
  else { out._mode = 0; out.color = color(src.maxColor); }
}
function findMapEntry(entries, key) { return entries?.map(x => x?.[key]).find(Boolean); }
function textureChoice(data) {
  const env = data.m_SavedProperties?.m_TexEnvs;
  for (const key of ['_MainTex', '_BaseMap', '_MatcapTex']) {
    const reference = findMapEntry(env, key)?.m_Texture;
    if (reference?.guid && String(reference.fileID) !== '0') return { guid: String(reference.guid).toLowerCase(), key };
  }
  return null;
}
function addMissingAssets(assets, suppliedPath) {
  let root = path.resolve(suppliedPath);
  if (!fs.existsSync(root)) throw new Error(`Unity Assets 目录不存在：${root}`);
  if (path.basename(root).toLowerCase() !== 'assets') root = path.join(root, 'Assets');
  if (!fs.statSync(root).isDirectory()) throw new Error('请选择 Unity 项目的 Assets 目录或项目根目录');
  const needed = new Set();
  for (const asset of assets.values()) {
    if (asset.extension === '.mat') {
      try {
        const data = parseUnityYaml(asset.content, asset.pathname).find(x => x.type === 'Material')?.data;
        const choice = data && textureChoice(data);
        if (choice && !assets.has(choice.guid)) needed.add(choice.guid);
      } catch (_) { /* Reported during normal conversion. */ }
    }
    if (asset.extension === '.prefab') {
      try {
        for (const obj of parseUnityYaml(asset.content, asset.pathname)) {
          if (obj.type !== 'ParticleSystemRenderer') continue;
          const guid = obj.data.m_Mesh?.guid;
          if (typeof guid === 'string' && /^[a-f0-9]{32}$/i.test(guid) && !assets.has(guid.toLowerCase())) needed.add(guid.toLowerCase());
        }
      } catch (_) { /* Reported during normal conversion. */ }
    }
  }
  if (!needed.size) return [];
  const added = [];
  const stack = [root];
  let examined = 0;
  while (stack.length && needed.size) {
    const dir = stack.pop();
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (++examined > 150000) throw new Error('Unity Assets 目录过大，已停止查找依赖');
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) { stack.push(full); continue; }
      if (!entry.isFile() || !entry.name.endsWith('.meta')) continue;
      const source = full.slice(0, -5);
      const ext = path.extname(source).toLowerCase();
      if (!['.png', '.jpg', '.jpeg', '.fbx'].includes(ext)) continue;
      const meta = fs.readFileSync(full, 'utf8');
      const guid = /^guid:\s*([a-f0-9]{32})\s*$/im.exec(meta)?.[1]?.toLowerCase();
      if (!guid || !needed.has(guid) || !fs.existsSync(source)) continue;
      const stat = fs.statSync(source);
      if (!stat.isFile() || stat.size > 128 * 1024 * 1024) continue;
      const pathname = `Assets/${path.relative(root, source).split(path.sep).join('/')}`;
      assets.set(guid, { guid, pathname, extension: ext, content: fs.readFileSync(source), meta: Buffer.from(meta), supplemental: true });
      added.push(pathname);
      needed.delete(guid);
    }
  }
  return added;
}
function transformIds(value, idMap) {
  if (Array.isArray(value)) { value.forEach(v => transformIds(v, idMap)); return; }
  if (!value || typeof value !== 'object') return;
  if (typeof value.__id__ === 'number') { value.__id__ = idMap.get(value.__id__) ?? value.__id__; return; }
  for (const v of Object.values(value)) transformIds(v, idMap);
}
function mapParticle(out, compId, source, renderer, materialUuid, textureUuid, warnings, name, meshBindings) {
  const ps = out[compId];
  const get = key => out[ps[key].__id__];
  const initial = source.InitialModule || {};
  ps.duration = Math.max(0.01, num(source.lengthInSec, 5));
  ps.loop = flag(source.looping);
  ps.simulationSpeed = num(source.simulationSpeed, 1);
  ps.playOnAwake = flag(source.playOnAwake);
  ps._prewarm = flag(source.prewarm);
  ps._capacity = Math.max(1, Math.floor(num(initial.maxNumParticles, 100)));
  ps._simulationSpace = num(source.moveWithTransform) === 1 ? 0 : 1;
  ps.startSize3D = flag(initial.size3D);
  ps.startRotation3D = flag(initial.rotation3D);
  setCurve(get('startLifetime'), initial.startLifetime);
  setCurve(get('startSpeed'), initial.startSpeed);
  setCurve(get('startSize'), initial.startSize);
  if (ps.startSize3D) { setCurve(get('startSizeY'), initial.startSizeY); setCurve(get('startSizeZ'), initial.startSizeZ); }
  setCurve(get('startRotationZ'), initial.startRotation);
  if (ps.startRotation3D) { setCurve(get('startRotationX'), initial.startRotationX); setCurve(get('startRotationY'), initial.startRotationY); }
  setCurve(get('startDelay'), source.startDelay);
  setCurve(get('gravityModifier'), initial.gravityModifier);
  setGradient(get('startColor'), initial.startColor);
  const emission = source.EmissionModule || {};
  setCurve(get('rateOverTime'), emission.enabled ? emission.rateOverTime : { minMaxState: 0, scalar: 0 });
  setCurve(get('rateOverDistance'), emission.enabled ? emission.rateOverDistance : { minMaxState: 0, scalar: 0 });
  for (const b of emission.m_Bursts || []) {
    if (!emission.enabled) break;
    const burst = { __type__: 'cc.Burst', _time: num(b.time), _repeatCount: Math.max(1, num(b.cycleCount, 1)), repeatInterval: Math.max(0.001, num(b.repeatInterval, 1)), count: { __type__: 'cc.CurveRange', mode: 0, constant: 0, multiplier: 1 } };
    setCurve(burst.count, b.countCurve);
    ps.bursts.push(burst);
  }
  const shapeSrc = source.ShapeModule || {};
  const shape = get('_shapeModule');
  shape._enable = flag(shapeSrc.enabled);
  if (shape._enable) {
    const type = num(shapeSrc.type);
    const shapeMap = { 0: 3, 1: 3, 2: 4, 3: 4, 4: 2, 5: 0, 9: 1, 10: 1, 11: 1, 12: 0, 13: 0 };
    if (shapeMap[type] === undefined) { shape._enable = false; warnings.push(`${name}: Unity Shape ${type} 暂不支持，已改为点发射`); }
    else {
      shape._shapeType = shape.shapeType = shapeMap[type];
      shape.emitFrom = [1,3,12].includes(type) ? 2 : ([10,11,13].includes(type) ? 1 : 3);
      shape.radius = Math.max(0, num(shapeSrc.radius?.value, 1));
      shape.radiusThickness = num(shapeSrc.radiusThickness, 1);
      shape.length = num(shapeSrc.length, 5);
      shape._angle = num(shapeSrc.angle, 25) * Math.PI / 180;
      shape._arc = num(shapeSrc.arc?.value, 360) * Math.PI / 180;
      shape._position = vec(shapeSrc.m_Position, true);
      shape._rotation = vec(shapeSrc.m_Rotation);
      shape._rotation.y += 180;
      shape._scale = vec(shapeSrc.m_Scale || { x:1,y:1,z:1 });
    }
  }
  const sizeSrc = source.SizeModule || {};
  const size = get('_sizeOvertimeModule');
  size._enable = flag(sizeSrc.enabled);
  size.separateAxes = flag(sizeSrc.separateAxes);
  if (size._enable) { setCurve(out[size.size.__id__], sizeSrc.curve); if (size.separateAxes) { setCurve(out[size.y.__id__], sizeSrc.y); setCurve(out[size.z.__id__], sizeSrc.z); } }
  const col = get('_colorOverLifetimeModule');
  col._enable = flag(source.ColorModule?.enabled);
  if (col._enable) setGradient(out[col.color.__id__], source.ColorModule.gradient);
  const vel = get('_velocityOvertimeModule');
  vel._enable = flag(source.VelocityModule?.enabled);
  if (vel._enable) { for (const axis of ['x','y','z']) setCurve(out[vel[axis].__id__], source.VelocityModule[axis], axis === 'z' ? -1 : 1); vel.space = flag(source.VelocityModule.inWorldSpace) ? 0 : 1; }
  const force = get('_forceOvertimeModule');
  force._enable = flag(source.ForceModule?.enabled);
  if (force._enable) { for (const axis of ['x','y','z']) setCurve(out[force[axis].__id__], source.ForceModule[axis], axis === 'z' ? -1 : 1); force.space = flag(source.ForceModule.inWorldSpace) ? 0 : 1; }
  const limit = get('_limitVelocityOvertimeModule');
  limit._enable = flag(source.ClampVelocityModule?.enabled);
  if (limit._enable) { setCurve(out[limit.limit.__id__], source.ClampVelocityModule.magnitude); limit.separateAxes = flag(source.ClampVelocityModule.separateAxis); limit.dampen = num(source.ClampVelocityModule.dampen, 1); if (limit.separateAxes) for (const axis of ['x','y','z']) setCurve(out[limit[`limit${axis.toUpperCase()}`].__id__], source.ClampVelocityModule[axis]); }
  const rot = get('_rotationOvertimeModule');
  rot._enable = flag(source.RotationModule?.enabled);
  if (rot._enable) { rot._separateAxes = flag(source.RotationModule.separateAxes); setCurve(out[rot.z.__id__], source.RotationModule.curve || source.RotationModule.z); if (rot._separateAxes) { setCurve(out[rot.x.__id__], source.RotationModule.x); setCurve(out[rot.y.__id__], source.RotationModule.y); } }
  const uvSrc = source.UVModule || {};
  const uv = get('_textureAnimationModule');
  uv._enable = flag(uvSrc.enabled);
  if (uv._enable) { uv._numTilesX = uv.numTilesX = Math.max(1, num(uvSrc.tilesX, 1)); uv._numTilesY = uv.numTilesY = Math.max(1, num(uvSrc.tilesY, 1)); uv.animation = num(uvSrc.animationType); uv.cycleCount = Math.max(1, num(uvSrc.cycles, 1)); uv.randomRow = flag(uvSrc.rowMode); uv.rowIndex = num(uvSrc.rowIndex); setCurve(out[uv.frameOverTime.__id__], uvSrc.frameOverTime); setCurve(out[uv.startFrame.__id__], uvSrc.startFrame); if (num(uvSrc.mode) !== 0) warnings.push(`${name}: UV 时间模式 ${uvSrc.mode} 可能与 Cocos 不一致`); }
  const render = get('renderer');
  const unityRenderMode = num(renderer?.m_RenderMode);
  render._renderMode = unityRenderMode === 4 ? 0 : Math.max(0, Math.min(4, unityRenderMode));
  render._velocityScale = num(renderer?.m_VelocityScale, 1);
  render._lengthScale = num(renderer?.m_LengthScale, 1);
  render._mainTexture = textureUuid ? assetRef(`${textureUuid}@6c48a`) : null;
  if (materialUuid) ps._materials = [assetRef(materialUuid)];
  if (flag(source.NoiseModule?.enabled)) warnings.push(`${name}: Noise 暂不支持`);
  for (const [key,label] of [['CollisionModule','Collision'],['SubModule','Sub Emitters'],['LightsModule','Lights'],['CustomDataModule','Custom Data'],['TriggerModule','Trigger'],['SizeBySpeedModule','Size By Speed'],['RotationBySpeedModule','Rotation By Speed'],['ColorBySpeedModule','Color By Speed'],['InheritVelocityModule','Inherit Velocity'],['ExternalForcesModule','External Forces']]) if (flag(source[key]?.enabled)) warnings.push(`${name}: ${label} 暂不支持`);
  const trailSrc = source.TrailModule || {};
  if (flag(trailSrc.enabled)) {
    const trail = get('_trailModule');
    trail._enable = true;
    trail.mode = 0;
    setCurve(out[trail.lifeTime.__id__], trailSrc.lifetime);
    trail._minParticleDistance = Math.max(0.001, num(trailSrc.minVertexDistance, 0.1));
    trail.existWithParticles = flag(trailSrc.dieWithParticles);
    trail.textureMode = 0;
    trail.widthFromParticle = flag(trailSrc.sizeAffectsWidth);
    setCurve(out[trail.widthRatio.__id__], trailSrc.widthOverTrail);
    trail.colorFromParticle = flag(trailSrc.inheritParticleColor);
    setGradient(out[trail.colorOverTrail.__id__], trailSrc.colorOverTrail);
    setGradient(out[trail.colorOvertime.__id__], trailSrc.colorOverLifetime);
    trail._space = flag(trailSrc.worldSpace) ? 0 : 1;
    if (num(trailSrc.mode) !== 0 || num(trailSrc.textureMode) !== 0 || num(trailSrc.ratio, 1) < 1) warnings.push(`${name}: Trails 已转换基础参数，发射比例/特殊模式无法等价`);
  }
  if (unityRenderMode === 4) {
    const mesh = renderer?.m_Mesh;
    meshBindings.push({ rendererIndex: out.indexOf(render), guid: typeof mesh?.guid === 'string' ? mesh.guid.toLowerCase() : null, fileID: String(mesh?.fileID || '0'), name });
  }
}
function makePrefab(asset, materialByGuid, textureByGuid, warnings, meshBindings) {
  const objects = parseUnityYaml(asset.content, asset.pathname);
  const gameObjects = objects.filter(x => x.type === 'GameObject');
  const transforms = objects.filter(x => x.type === 'Transform');
  const particles = objects.filter(x => x.type === 'ParticleSystem');
  const renderers = objects.filter(x => x.type === 'ParticleSystemRenderer');
  if (!particles.length) return null;
  const tByGo = new Map(transforms.map(x => [x.data.m_GameObject?.fileID, x]));
  const pByGo = new Map(particles.map(x => [x.data.m_GameObject?.fileID, x]));
  const rByGo = new Map(renderers.map(x => [x.data.m_GameObject?.fileID, x]));
  const tIdToGo = new Map(transforms.map(x => [x.fileId, x.data.m_GameObject?.fileID]));
  const prefabUuid = uuid(`prefab:${asset.guid}`);
  const rootGo = gameObjects.find(x => tByGo.get(x.fileId)?.data.m_Father?.fileID === '0') || gameObjects[0];
  const output = [clone(PARTICLE_TEMPLATE[0])];
  output[0]._name = safeName(path.basename(asset.pathname, '.prefab'));
  const nodeByGo = new Map();
  const compByGo = new Map();
  for (const go of gameObjects) {
    const part = pByGo.get(go.fileId);
    let node, compId;
    if (part) {
      const start = output.length;
      const map = new Map(Array.from({ length: 52 }, (_, i) => [i + 1, start + i]));
      for (let i = 1; i <= 52; i++) { const item = clone(PARTICLE_TEMPLATE[i]); transformIds(item, map); output.push(item); }
      node = start; compId = map.get(2);
      compByGo.set(go.fileId, compId);
      output[node]._prefab = ref(output.length);
      output.push({ __type__: 'cc.PrefabInfo', root: ref(0), asset: ref(0), fileId: uuid(`node:${asset.guid}:${go.fileId}`).replaceAll('-', '').slice(0, 22) });
    } else {
      node = output.length;
      const blank = clone(PARTICLE_TEMPLATE[1]);
      blank._components = []; blank._children = []; blank._prefab = ref(node + 1);
      output.push(blank);
      output.push({ __type__: 'cc.PrefabInfo', root: ref(0), asset: ref(0), fileId: uuid(`node:${asset.guid}:${go.fileId}`).replaceAll('-', '').slice(0, 22) });
    }
    nodeByGo.set(go.fileId, node);
    const n = output[node];
    const tr = tByGo.get(go.fileId)?.data;
    n._name = safeName(go.data.m_Name);
    n._active = flag(go.data.m_IsActive);
    n._lpos = vec(tr?.m_LocalPosition, true);
    const q = tr?.m_LocalRotation || { x:0,y:0,z:0,w:1 };
    n._lrot = { __type__: 'cc.Quat', x: -num(q.x), y: -num(q.y), z: num(q.z), w: num(q.w,1) };
    n._lscale = vec(tr?.m_LocalScale || { x:1,y:1,z:1 });
    n._euler = { __type__: 'cc.Vec3', x: 0, y: 0, z: 0 };
    n._children = [];
  }
  const rootNode = nodeByGo.get(rootGo.fileId);
  output[0].data = ref(rootNode);
  for (const go of gameObjects) {
    const node = nodeByGo.get(go.fileId);
    const t = tByGo.get(go.fileId)?.data;
    const parentGo = tIdToGo.get(t?.m_Father?.fileID);
    const parent = nodeByGo.get(parentGo);
    output[node]._parent = parent === undefined ? null : ref(parent);
    if (parent !== undefined) output[parent]._children.push(ref(node));
    const info = output[output[node]._prefab.__id__]; info.root = ref(rootNode);
    const p = pByGo.get(go.fileId);
    if (!p) continue;
    const component = output[compByGo.get(go.fileId)];
    output[component.__prefab.__id__].fileId = uuid(`component:${asset.guid}:${go.fileId}`).replaceAll('-', '').slice(0, 22);
    const renderer = rByGo.get(go.fileId)?.data;
    const unityMaterialGuid = renderer?.m_Materials?.[0]?.guid;
    const mat = materialByGuid.get(unityMaterialGuid);
    const textureGuid = mat?.textureGuid;
    const tex = textureByGuid.get(textureGuid);
    if (!mat) warnings.push(`${go.data.m_Name}: 材质未在包内找到`);
    mapParticle(output, compByGo.get(go.fileId), p.data, renderer, mat?.uuid, tex?.uuid, warnings, go.data.m_Name, meshBindings);
  }
  return { uuid: prefabUuid, data: output, name: output[0]._name, particleCount: particles.length };
}
async function zipEntries(entries) {
  const zip = new yazl.ZipFile();
  for (const [name, content] of entries) zip.addBuffer(content, name);
  zip.end();
  const chunks = [];
  for await (const chunk of zip.outputStream) chunks.push(chunk);
  return Buffer.concat(chunks);
}
async function convertPackage(buffer, options = {}) {
  const assets = await readUnityPackage(buffer);
  const supplemented = options.assetsPath ? addMissingAssets(assets, options.assetsPath) : [];
  const entries = new Map();
  const warnings = [];
  const textureByGuid = new Map();
  const materialByGuid = new Map();
  const root = 'UnityParticles';
  for (const folder of [root, `${root}/Textures`, `${root}/Materials`]) entries.set(`${folder}.meta`, json(directoryMeta(uuid(`dir:${folder}`))));
  for (const a of assets.values()) {
    if (a.extension !== '.png' && a.extension !== '.jpg' && a.extension !== '.jpeg') continue;
    const id = uuid(`texture:${a.guid}`), name = `${safeName(path.basename(a.pathname, a.extension))}_${a.guid.slice(0,8)}${a.extension}`;
    const meta = clone(IMAGE_META_TEMPLATE);
    meta.uuid = id; meta.subMetas['6c48a'].uuid = `${id}@6c48a`;
    meta.files[0] = a.extension;
    meta.subMetas['6c48a'].displayName = name.slice(0, -a.extension.length);
    meta.subMetas['6c48a'].userData.imageUuidOrDatabaseUri = id;
    meta.userData.redirect = `${id}@6c48a`;
    meta.userData.hasAlpha = true;
    entries.set(`${root}/Textures/${name}`, a.content);
    entries.set(`${root}/Textures/${name}.meta`, json(meta));
    textureByGuid.set(a.guid, { uuid: id, name, content: a.content });
  }
  for (const a of assets.values()) {
    if (a.extension !== '.mat') continue;
    let data;
    try { data = parseUnityYaml(a.content, a.pathname).find(x => x.type === 'Material')?.data; } catch (e) { warnings.push(`${a.pathname}: ${e.message}`); continue; }
    if (!data) continue;
    const texture = textureChoice(data);
    const textureGuid = texture?.guid;
    const tex = textureByGuid.get(textureGuid);
    const material = clone(MATERIAL_TEMPLATE);
    const id = uuid(`material:${a.guid}`);
    const name = `${safeName(data.m_Name || path.basename(a.pathname, '.mat'))}_${a.guid.slice(0,8)}.mtl`;
    const src = num(findMapEntry(data.m_SavedProperties?.m_Floats, '_SrcBlend'), 5);
    const dst = num(findMapEntry(data.m_SavedProperties?.m_Floats, '_DstBlend'), 1);
    material._effectAsset = { __uuid__: EFFECT_UUID, __expectedType__: 'cc.EffectAsset' };
    material._techIdx = dst === 1 && src === 5 ? 0 : 1;
    material._props = [{ ...(tex ? { mainTexture: assetRef(`${tex.uuid}@6c48a`) } : {}) }];
    const tint = findMapEntry(data.m_SavedProperties?.m_Colors, '_TintColor') || findMapEntry(data.m_SavedProperties?.m_Colors, '_Color') || findMapEntry(data.m_SavedProperties?.m_Colors, '_BaseColor');
    if (tint) material._props[0].tintColor = { __type__: 'cc.Color', ...color(tint) };
    materialByGuid.set(a.guid, { uuid: id, name, textureGuid, blend: material._techIdx === 0 ? 'add' : 'alpha' });
    entries.set(`${root}/Materials/${name}`, json(material));
    entries.set(`${root}/Materials/${name}.meta`, json(fileMeta('material', '1.0.21', id)));
    if (texture && !tex) warnings.push(`${a.pathname}: ${texture.key} 引用的贴图 GUID ${textureGuid} 不在资源包内`);
    if (texture?.key === '_MatcapTex') warnings.push(tex ? `${a.pathname}: Unity Matcap Shader 已使用 Matcap 贴图和颜色近似，Cocos 材质视觉效果需复核` : `${a.pathname}: Unity Matcap Shader 无法等价转换，且 Matcap 贴图缺失`);
  }
  const prefabs = [];
  const preview = [];
  const meshBindings = [];
  for (const a of assets.values()) {
    if (a.extension !== '.prefab') continue;
    try {
      const bindings = [];
      const p = makePrefab(a, materialByGuid, textureByGuid, warnings, bindings);
      if (!p) continue;
      const name = `${p.name}_${a.guid.slice(0,8)}.prefab`;
      entries.set(`${root}/${name}`, json(p.data));
      entries.set(`${root}/${name}.meta`, json(fileMeta('prefab', '1.1.50', p.uuid, { syncNodeName: p.name })));
      prefabs.push({ name, particleCount: p.particleCount, uuid: p.uuid });
      for (const binding of bindings) meshBindings.push({ ...binding, prefab: name });
      const objects = parseUnityYaml(a.content, a.pathname);
      const names = new Map(objects.filter(x => x.type === 'GameObject').map(x => [x.fileId, x.data.m_Name]));
      const renderers = new Map(objects.filter(x => x.type === 'ParticleSystemRenderer').map(x => [x.data.m_GameObject?.fileID, x.data]));
      for (const x of objects.filter(x => x.type === 'ParticleSystem')) {
        const d = x.data, initial = d.InitialModule || {}, em = d.EmissionModule || {};
        const goId = d.m_GameObject?.fileID, matGuid = renderers.get(goId)?.m_Materials?.[0]?.guid;
        const material = materialByGuid.get(matGuid), tex = textureByGuid.get(material?.textureGuid);
        const getScalar = (v, fallback=0) => v?.minMaxState === 3 ? (num(v.minScalar)+num(v.scalar))/2 : num(v?.scalar, fallback);
        preview.push({ name: names.get(goId) || 'Particle', prefab: p.name, duration: num(d.lengthInSec,5), loop: flag(d.looping), life: getScalar(initial.startLifetime,1), size: getScalar(initial.startSize,1), speed: getScalar(initial.startSpeed), count: (em.m_Bursts || []).reduce((sum,b)=>sum+getScalar(b.countCurve),0), rate: getScalar(em.rateOverTime), shape: flag(d.ShapeModule?.enabled) ? num(d.ShapeModule.type) : -1, color: color(initial.startColor?.maxColor), texture: tex ? `data:image/${tex.name.endsWith('.png')?'png':'jpeg'};base64,${tex.content.toString('base64')}` : null });
      }
    } catch (e) { warnings.push(`${a.pathname}: 转换失败：${e.message}`); }
  }
  if (!prefabs.length) throw new Error('包内没有可转换的 Force Text 粒子预制体');
  for (const binding of meshBindings) {
    if (binding.guid && assets.get(binding.guid)?.extension === '.fbx') {
      binding.model = `${safeName(path.basename(assets.get(binding.guid).pathname, '.fbx'))}_${binding.guid.slice(0,8)}.fbx`;
      warnings.push(`${binding.name}: FBX 已附带，导入 Cocos 后将绑定 Mesh`);
    } else if (binding.guid) warnings.push(`${binding.name}: Mesh GUID ${binding.guid} 不在资源包内，暂用面片显示`);
    else if (binding.fileID === '10202') {
      binding.model = 'UnityCube_builtin.glb';
      warnings.push(`${binding.name}: Unity 内置 Cube 已生成 GLB 替代模型`);
    } else warnings.push(`${binding.name}: Unity 内置 Mesh ${binding.fileID} 暂用面片显示`);
  }
  if (meshBindings.some(x => x.model)) {
    const folder = `${root}/Models`;
    entries.set(`${folder}.meta`, json(directoryMeta(uuid(`dir:${folder}`))));
    for (const binding of meshBindings.filter(x => x.model && x.guid)) entries.set(`${folder}/${binding.model}`, assets.get(binding.guid).content);
    if (meshBindings.some(x => x.model === 'UnityCube_builtin.glb')) entries.set(`${folder}/UnityCube_builtin.glb`, cubeGlb());
  }
  const report = { inputAssets: assets.size, supplemented, prefabs, materials: [...materialByGuid.values()].map(({name,blend})=>({name,blend})), textures: [...textureByGuid.values()].map(({name})=>name), warnings: [...new Set(warnings)] };
  entries.set(`${root}/README.txt`, Buffer.from('Unity 6 粒子转换结果，目标 Cocos Creator 3.8.7。请将 ZIP 解压到 Cocos 项目的 assets 目录。预制体、材质和贴图已通过 UUID 引用绑定。详情与限制见工具界面的报告。\n'));
  return { zip: await zipEntries(entries), report, preview, entries, meshBindings };
}
module.exports = { convertPackage, setCurve, setGradient };
