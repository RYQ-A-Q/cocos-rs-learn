'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

function uuid(seed) {
  const hex = crypto.createHash('sha256').update(seed).digest('hex').slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

function safeFolder(name) {
  return path.basename(name, path.extname(name))
    .replace(/[\\/:*?"<>|\x00-\x1f]/g, '_')
    .replace(/[. ]+$/g, '')
    .slice(0, 72) || 'UnityEffect';
}

function within(parent, child) {
  const relative = path.relative(parent, child);
  return relative === '' || (relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
}

function remapJson(value, ids) {
  if (typeof value === 'string') return ids.get(value) || value;
  if (Array.isArray(value)) return value.map(item => remapJson(item, ids));
  if (!value || typeof value !== 'object') return value;
  for (const [key, item] of Object.entries(value)) value[key] = remapJson(item, ids);
  return value;
}

function importConverted({ converted, digest, name, projectPath }) {
  if (!converted?.entries || !/^[a-f0-9]{64}$/.test(digest)) throw new Error('无有效的转换结果');
  const project = path.resolve(projectPath);
  const assets = path.join(project, 'assets');
  if (!fs.statSync(assets).isDirectory()) throw new Error('当前项目缺少 assets 目录');
  const effect = path.join(assets, 'Effect');
  const folder = `${safeFolder(name)}_${digest.slice(0, 8)}`;
  const destination = path.join(effect, folder);
  if (!within(assets, destination)) throw new Error('导入目标路径无效');
  if (fs.existsSync(destination)) throw new Error(`Effect/${folder} 已存在；为保护已有资源，本次未覆盖`);

  const ids = new Map();
  for (const [entryName, data] of converted.entries) {
    if (!entryName.endsWith('.meta')) continue;
    const meta = JSON.parse(data.toString('utf8'));
    if (meta.importer === 'directory') continue;
    const base = meta.uuid;
    if (!base) continue;
    const next = uuid(`${digest}:${base}`);
    ids.set(base, next);
    for (const child of Object.values(meta.subMetas || {})) {
      if (child.uuid?.startsWith(`${base}@`)) ids.set(child.uuid, `${next}${child.uuid.slice(base.length)}`);
    }
  }

  const tempRoot = path.join(project, 'temp');
  fs.mkdirSync(tempRoot, { recursive: true });
  const stage = fs.mkdtempSync(path.join(tempRoot, 'unity-cocos-effect-'));
  if (!within(tempRoot, stage)) throw new Error('暂存路径无效');
  try {
    for (const [entryName, content] of converted.entries) {
      if (entryName === 'UnityParticles.meta' || entryName === 'UnityParticles/README.txt' || !entryName.startsWith('UnityParticles/')) continue;
      const relative = entryName.slice('UnityParticles/'.length);
      if (relative.endsWith('.meta')) {
        const meta = JSON.parse(content.toString('utf8'));
        if (meta.importer === 'directory') continue;
      }
      const target = path.resolve(stage, relative);
      if (!within(stage, target) || target === stage) throw new Error(`资源路径无效：${entryName}`);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      let data = content;
      if (/\.(?:meta|prefab|mtl)$/.test(relative)) {
        const parsed = JSON.parse(content.toString('utf8'));
        data = Buffer.from(`${JSON.stringify(remapJson(parsed, ids), null, 2)}\n`);
      }
      fs.writeFileSync(target, data, { flag: 'wx' });
    }
    fs.mkdirSync(effect, { recursive: true });
    if (fs.existsSync(destination)) throw new Error(`Effect/${folder} 已存在；为保护已有资源，本次未覆盖`);
    if (!within(tempRoot, stage) || !within(assets, destination)) throw new Error('导入目标路径无效');
    fs.renameSync(stage, destination);
  } catch (error) {
    if (within(tempRoot, stage)) fs.rmSync(stage, { recursive: true, force: true });
    throw error;
  }
  const prefabNames = converted.report.prefabs.map(item => item.name);
  return {
    destination,
    folder: `Effect/${folder}`,
    dbUrl: `db://assets/Effect/${folder}`,
    prefabs: prefabNames.map(file => `db://assets/Effect/${folder}/${file}`),
    particleCount: prefabNames.reduce((sum, _, index) => sum + converted.report.prefabs[index].particleCount, 0),
  };
}

async function bindImportedMeshes(converted, destination) {
  const bindings = (converted.meshBindings || []).filter(item => item.model);
  if (!bindings.length) return { bound: 0, warnings: [] };
  const warnings = [];
  const models = new Map();
  for (const binding of bindings) {
    if (models.has(binding.model)) continue;
    const metaPath = path.join(destination, 'Models', `${binding.model}.meta`);
    let subMetas = [];
    for (let attempt = 0; attempt < 40; attempt++) {
      if (fs.existsSync(metaPath)) {
        try {
          const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
          subMetas = Object.values(meta.subMetas || {}).filter(item => item.importer === 'gltf-mesh' && item.uuid);
          if (subMetas.length) break;
        } catch (_) { /* Cocos may still be writing the meta file. */ }
      }
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    if (!subMetas.length) warnings.push(`${binding.model} 未生成 Mesh 子资源，请在 Cocos 中刷新资源后检查`);
    models.set(binding.model, subMetas);
  }
  const prefabs = new Map();
  let bound = 0;
  for (const binding of bindings) {
    const meshes = models.get(binding.model);
    if (!meshes?.length) continue;
    const stem = binding.model.replace(/_[a-f0-9]{8}\.(?:fbx|glb)$/i, '').toLowerCase();
    const mesh = meshes.find(item => String(item.name || '').toLowerCase().includes(stem)) || meshes[0];
    if (meshes.length > 1) warnings.push(`${binding.model} 含 ${meshes.length} 个 Mesh，已使用 ${mesh.name || mesh.uuid}；请核对对应子网格`);
    const file = path.join(destination, binding.prefab);
    if (!prefabs.has(file)) prefabs.set(file, JSON.parse(fs.readFileSync(file, 'utf8')));
    const renderer = prefabs.get(file)[binding.rendererIndex];
    if (renderer?.__type__ !== 'cc.ParticleSystemRenderer') { warnings.push(`${binding.name} 的 Mesh 绑定目标无效`); continue; }
    renderer._mesh = { __uuid__: mesh.uuid, __expectedType__: 'cc.Mesh' };
    renderer._renderMode = 4;
    bound++;
  }
  for (const [file, prefab] of prefabs) fs.writeFileSync(file, `${JSON.stringify(prefab, null, 2)}\n`);
  return { bound, warnings };
}

module.exports = { importConverted, bindImportedMeshes };
