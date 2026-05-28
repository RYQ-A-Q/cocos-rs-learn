# Cocos RS Learn

一个基于 Cocos Creator 3.8.6 开发的 TypeScript 游戏框架学习项目，**核心聚焦于多平台小游戏（微信、抖音）的广告与平台功能集成**，提供一套平台功能开发解决方案示例。

## 🎮 功能演示

| 主界面 | 抖音平台功能 |
|--------|-------------|
| ![主界面](githubImg/home.jpg) | ![抖音平台功能](githubImg/dy.jpg) |

## 项目特性

- **🎯 多平台统一接口**：一套代码适配微信小游戏、抖音小游戏，通过统一接口调用平台能力
- **📱 完整的广告系统**：支持 Banner、激励视频、插屏广告、原生模板广告等多种广告形式
- **🔗 平台能力集成**：分享、登录、桌面快捷方式、侧边栏跳转等平台专属功能
- **🛠️ 完整的管理器系统**：UI、资源、事件、网络、存储、对象池等核心管理器
- **🔒 安全存储**：AES 加密的本地存储方案
- **📦 Bundle 资源管理**：基于 Cocos Creator 的 Bundle 资源管理系统
- **⚡ TypeScript 支持**：使用现代 TypeScript 语法，目标为 ES2022

## 技术栈

- **游戏引擎**：Cocos Creator 3.8.6
- **开发语言**：TypeScript
- **目标标准**：ES2022
- **主要依赖**：
  - `crypto-es`: 用于 AES 加密存储

---

## 🏆 核心：UI-pop 多平台功能演示模块

项目的核心展示模块位于 `assets/UI-pop/`，提供了直观的平台功能测试界面：

### UI-pop 模块结构

```
assets/UI-pop/
├── src/
│   ├── PopFuc.ts          # 功能列表面板（入口）
│   ├── PopDYPlatform.ts   # 抖音平台功能测试面板
│   └── PopNativePlatform.ts # Android原生功能测试面板
├── res/img/               # 界面资源图片
├── popFuc.prefab          # 功能列表预制体
├── popDYPlatform.prefab   # 抖音平台预制体
└── popNativePlatform.prefab # 原生平台预制体
```

### 功能面板说明

| 面板 | 功能 |
|------|------|
| **PopFuc** | 主入口面板，提供平台选择（抖音平台、安卓平台、功能列表） |
| **PopDYPlatform** | 抖音平台功能测试：登录、侧边栏、分享、Banner广告、激励广告、插屏广告、添加桌面 |
| **PopNativePlatform** | Android原生功能测试：消息、通知栏消息 |

### UI 组件

- `LoadingWait` - 加载等待组件
- `NormalMessage` - 普通消息弹窗
- `VerifyPanel` - 验证面板
- `NoticeMessagePanel` - 通知消息面板
- `TextMessage` - 文本消息
- `VList` - 虚拟列表组件
- `DesignResolutionAdapt` - 设计分辨率适配
- `ImgFixedSize` - 图片固定尺寸

### 动画效果组件

- `ScaleEffect` - 缩放效果
- `OpacityAnim` - 透明度动画
- `ProgressBarLerp` - 进度条动画
- `TweenAniBounce` - 弹跳动画
- `TweenAniFloat` - 漂浮动画
- `TweenAniShake` - 抖动动画
- `TweenAniHeartBeat` - 心跳动画
- 等等...

---

## 快速开始

### 安装

```bash
# 安装依赖
npm install
```

### 使用 Cocos Creator 打开项目

1. 启动 Cocos Creator 3.8.6
2. 选择 "打开项目"
3. 选择本项目目录

