# Unity 6 粒子转换扩展（Cocos Creator 3.8.7）

## 安装

将发布 ZIP 解压到 **Cocos 项目根目录**，确认文件位于：

```text
<项目>/extensions/unity-cocos-effect/package.json
```

重新打开项目，或在「扩展 → 扩展管理器」刷新扩展，并在「已安装扩展」中启用 `unity-cocos-effect`。扩展依赖已包含在 ZIP 中，无需运行 `npm install`。

## 使用

1. 在「扩展 → Unity → Cocos 粒子转换」打开面板。
2. 选择 Unity 6 导出的 `.unitypackage`，点击「转换资源包」。如果报告提示 GUID 依赖不在包内，可在「Unity 项目 Assets 路径」填入原 Unity 项目的 `Assets` 目录（或项目根目录），转换器会按 `.meta` GUID 补齐被引用的贴图和 FBX。Unity 资源建议使用 Force Text 序列化。
3. 查看转换报告和 Cocos 转换预览。面板中的 Canvas 预览用于快速检查大致形态，**不是 Cocos 引擎的实机渲染**。
4. 满意后点击「导入当前项目的 Effect 文件夹」。扩展会自动创建 `assets/Effect`，并把预制体、材质、贴图和模型导入到 `Effect/<包名>_<哈希>`。FBX 和内置 Cube 的替代 GLB 由 Cocos 导入后，扩展再绑定 Mesh 子资源；资源已存在时会拒绝覆盖。
5. 将导入的 `.prefab` 拖入 Cocos 场景，播放以检查最终效果。

## 转换范围

支持预制体节点层级、常见粒子发射与生命周期参数、部分 Shape、UV 图集动画、主贴图、粒子材质、常见混合模式、包内/补齐的 FBX Mesh、Unity 内置 Cube，以及 Trails 的基础参数。转换报告会列出未直接等价的功能。Rotation By Speed、Noise、Collision、Sub Emitters、Lights、Trigger、自定义 Shader 等仍可能需要在 Cocos 中调整。面板预览只作 2D 示意，请在编辑器场景中核对最终效果。

`破碎.unitypackage` 样本中实际缺少 `Img1.png` 和 `Diamond_big(1).fbx`；两者可从原 Unity 工程 `Assets` 路径按 GUID 补齐。该样本的 2 个 FBX、1 个 Cube GLB 已由 Cocos 3.8.7 资源数据库成功导入，5 个 Mesh 引用完成绑定；编辑器中最终视觉效果仍需对照 Unity 确认。

已使用 `特效.unitypackage` 在 Cocos Creator 3.8.7 独立测试项目验证：生成 1 个预制体、3 个粒子系统、3 个材质和 3 张贴图。更高版本的编辑器尚未逐版验证。
