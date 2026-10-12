'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { convertPackage } = require('./src/convert');
const { importConverted, bindImportedMeshes } = require('./import-assets');

const MAX_INPUT = 512 * 1024 * 1024;
let latest = null;

function inputBuffer(input) {
  if (!input || typeof input.name !== 'string' || !input.name.toLowerCase().endsWith('.unitypackage')) {
    throw new Error('请选择 .unitypackage 文件');
  }
  if (input.path) {
    const file = path.resolve(input.path);
    if (fs.statSync(file).size > MAX_INPUT) throw new Error('文件超过 512 MB 限制');
    return fs.readFileSync(file);
  }
  if (typeof input.base64 === 'string') {
    if (input.base64.length > MAX_INPUT * 4 / 3 + 8) throw new Error('文件超过 512 MB 限制');
    return Buffer.from(input.base64, 'base64');
  }
  throw new Error('无法读取所选文件');
}

exports.methods = {
  openPanel() {
    Editor.Panel.open('unity-cocos-effect');
  },
  async convertPackage(input) {
    latest = null;
    const buffer = inputBuffer(input);
    const converted = await convertPackage(buffer, { assetsPath: input.assetsPath });
    const contentHash = crypto.createHash('sha256');
    for (const [entryName, content] of [...converted.entries].sort(([a], [b]) => a.localeCompare(b))) {
      contentHash.update(entryName).update('\0').update(content);
    }
    const digest = contentHash.digest('hex');
    latest = { converted, digest, name: input.name };
    return { report: converted.report, preview: converted.preview };
  },
  async importLatest() {
    if (!latest) throw new Error('请先转换资源包');
    const projectPath = Editor.Project?.path;
    if (!projectPath) throw new Error('无法获取当前 Cocos 项目路径');
    const result = importConverted({ ...latest, projectPath });
    try {
      await Editor.Message.request('asset-db', 'refresh-asset', result.dbUrl);
      result.meshes = await bindImportedMeshes(latest.converted, result.destination);
      if (result.meshes.bound) await Editor.Message.request('asset-db', 'refresh-asset', result.dbUrl);
    } catch (error) {
      result.refreshWarning = `资源已写入，资源管理器可能需要手动刷新：${error.message}`;
    }
    delete result.destination;
    return result;
  },
};

exports.load = function load() {};
exports.unload = function unload() { latest = null; };
