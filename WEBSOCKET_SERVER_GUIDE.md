# WebSocket 服务器快速启动指南

## 🎯 问题说明

之前 WebSocket 服务器在 Cocos Creator 编辑器中自动启动，导致：
- ❌ 每次保存代码都会重启服务器
- ❌ 端口占用错误（EADDRINUSE）
- ❌ 无法控制服务器启动时机

## ✅ 解决方案

已将 WebSocket 服务器移至独立的 `websocket-server` 目录，现在可以手动控制启动。

## 🚀 使用步骤

### 1️⃣ 启动 WebSocket 服务器

**Windows 用户：**
```
双击运行: websocket-server/start.bat
```

**所有用户：**
```bash
cd websocket-server
npm install    # 首次运行需要
npm start
```

看到以下提示表示服务器启动成功：
```
========================================
WebSocket 服务器示例已启动
游戏服务地址: ws://localhost:5679/game
按 Ctrl+C 停止服务器
========================================
```

### 2️⃣ 运行 Cocos Creator 游戏

1. 打开 Cocos Creator 3.8.6
2. 打开项目
3. 运行包含 WebSocket 功能的场景
4. 点击"加入房间"按钮连接服务器

### 3️⃣ 测试多客户端

1. 保持服务器运行
2. 在多个浏览器窗口或设备上运行游戏
3. 可以看到所有玩家的数据实时同步

## ⚙️ 配置说明

### 修改端口号

**服务器端：** 编辑 `websocket-server/server.js`
```javascript
const PORT = process.env.PORT || 5679; // 修改这里的数字
```

**客户端：** 编辑 `assets/UI-pop2/src/PopWebsocket.ts`
```typescript
private readonly WS_URL = 'ws://localhost:5679/game'; // 游戏服务路径
// 或
private readonly WS_URL = 'ws://localhost:5679/chat'; // 聊天服务路径（待实现）
```

### 多路径架构说明

当前服务器支持多个 WebSocket 路径：
- `/game` - 游戏相关功能（点击、金币同步、用户列表等）
- `/chat` - 聊天功能（预留，待实现）

这种设计允许：
1. 不同功能使用不同的 WebSocket 连接
2. 独立管理不同服务的生命周期
3. 更容易扩展新功能

## 📁 文件位置

```
项目根目录/
├── websocket-server/          ← WebSocket 服务器（独立）
│   ├── server.js             ← 服务器主文件
│   ├── package.json          ← Node.js 依赖
│   ├── start.bat             ← Windows 启动脚本
│   └── README.md             ← 详细说明
│
└── assets/UI-pop2/src/       ← Cocos 客户端代码
    ├── PopWebsocket.ts       ← UI 控制器
    ├── DuckCard.ts           ← 卡片组件
    ├── WebSocketManager.ts   ← WebSocket 管理器
    ├── NetworkService.ts     ← 网络服务层
    └── MessageProtocol.ts    ← 消息协议
```

## ❓ 常见问题

**Q: 提示 "EADDRINUSE: address already in use :::5679"？**
A: 说明端口已被占用，检查是否有其他服务器实例在运行，关闭后重新启动。

**Q: 客户端连接失败？**
A: 
1. 确认服务器正在运行（查看命令行窗口）
2. 检查端口号是否一致（服务器和客户端都要是 5679）
3. 查看防火墙设置

**Q: 如何在后台运行服务器？**
A: 
```bash
# Windows (使用 start)
start node websocket-server/server.js

# Linux/Mac (使用 &)
node websocket-server/server.js &

# 或使用 PM2（推荐生产环境）
npm install -g pm2
pm2 start websocket-server/server.js
```

**Q: 服务器日志在哪里查看？**
A: 直接在启动服务器的命令行窗口中查看。

## 🎉 完成！

现在你可以：
- ✅ 手动控制服务器启动和停止
- ✅ 避免编辑器自动重启服务器
- ✅ 解决端口占用问题
- ✅ 更好地调试和开发

---

**祝你开发顺利！** 🚀
