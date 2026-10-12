'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { startPreview } = require('./preview');

const PACKAGE = 'unity-cocos-effect';

function filePayload(file) {
  if (file.path) return Promise.resolve({ name: file.name, path: file.path });
  if (file.size > 64 * 1024 * 1024) throw new Error('此编辑器无法直接读取文件路径；请选择小于 64 MB 的资源包');
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ name: file.name, base64: String(reader.result).split(',')[1] });
    reader.onerror = () => reject(reader.error || new Error('读取文件失败'));
    reader.readAsDataURL(file);
  });
}

module.exports = Editor.Panel.define({
  template: fs.readFileSync(path.join(__dirname, 'panel.html'), 'utf8'),
  style: fs.readFileSync(path.join(__dirname, 'panel.css'), 'utf8'),
  $: {
    input: '#package', assetsPath: '#assetsPath', convert: '#convert', status: '#status', result: '#result',
    prefabs: '#prefabs', particles: '#particles', materials: '#materials', textures: '#textures',
    canvas: '#canvas', particleSelect: '#particleSelect', replay: '#replay',
    warnings: '#warnings', import: '#import', importStatus: '#importStatus',
  },
  ready() {
    this.previewData = [];
    this.stopPreview = null;
    this.$.convert.addEventListener('click', async () => {
      const file = this.$.input.files?.[0];
      if (!file || !file.name.toLowerCase().endsWith('.unitypackage')) {
        this.$.status.textContent = '请选择 .unitypackage 文件';
        this.$.status.className = 'status error';
        return;
      }
      this.$.convert.disabled = true;
      this.$.import.disabled = true;
      this.$.result.hidden = true;
      this.$.status.className = 'status';
      this.$.status.textContent = '正在转换资源包…';
      try {
        const payload = await filePayload(file);
        payload.assetsPath = this.$.assetsPath.value.trim() || undefined;
        const data = await Editor.Message.request(PACKAGE, 'convert-package', payload);
        const report = data.report;
        this.previewData = data.preview;
        this.$.prefabs.textContent = String(report.prefabs.length);
        this.$.particles.textContent = String(report.prefabs.reduce((sum, p) => sum + p.particleCount, 0));
        this.$.materials.textContent = String(report.materials.length);
        this.$.textures.textContent = String(report.textures.length);
        this.$.warnings.replaceChildren();
        this.$.warnings.className = `warnings${report.warnings.length ? '' : ' ok'}`;
        if (report.warnings.length) for (const warning of report.warnings) {
          const line = document.createElement('div');
          line.textContent = `• ${warning}`;
          this.$.warnings.append(line);
        }
        else this.$.warnings.textContent = '暂无参数转换警告。';
        this.$.particleSelect.replaceChildren(
          new Option('全部粒子系统', 'all'),
          ...this.previewData.map((item, index) => new Option(item.name, String(index))),
        );
        this.$.result.hidden = false;
        this.$.import.disabled = false;
        this.$.importStatus.textContent = '';
        this.$.status.textContent = `转换完成：${report.prefabs.length} 个预制体，补齐 ${report.supplemented.length} 个包外资源。可先预览，再选择导入。`;
        this.playPreview();
      } catch (error) {
        this.$.status.textContent = error.message || String(error);
        this.$.status.className = 'status error';
      } finally {
        this.$.convert.disabled = false;
      }
    });
    this.$.import.addEventListener('click', async () => {
      this.$.import.disabled = true;
      this.$.importStatus.className = 'status';
      this.$.importStatus.textContent = '正在写入当前项目的 assets/Effect…';
      try {
        const result = await Editor.Message.request(PACKAGE, 'import-latest');
        this.$.importStatus.textContent = `已导入 ${result.folder}，共 ${result.prefabs.length} 个预制体，已绑定 ${result.meshes?.bound || 0} 个 Mesh。${result.meshes?.warnings?.join('；') || ''}${result.refreshWarning || ''}`;
      } catch (error) {
        this.$.importStatus.textContent = error.message || String(error);
        this.$.importStatus.className = 'status error';
        this.$.import.disabled = false;
      }
    });
    this.$.particleSelect.addEventListener('change', () => this.playPreview());
    this.$.replay.addEventListener('click', () => this.playPreview());
  },
  methods: {
    playPreview() {
      this.stopPreview?.();
      const selected = this.$.particleSelect.value;
      const sources = selected === 'all' ? this.previewData : [this.previewData[Number(selected)]].filter(Boolean);
      this.stopPreview = startPreview(this.$.canvas, sources);
    },
  },
  close() { this.stopPreview?.(); },
});
