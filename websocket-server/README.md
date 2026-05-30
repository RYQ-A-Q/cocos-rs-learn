# WebSocket 服务器

这是一个用于 Cocos Creator 项目的 WebSocket 服务器示例，支持多路径架构。

## 📁 目录结构

```
websocket-server/
├── server.js          # WebSocket 服务器主文件（支持多路径）
├── package.json       # Node.js 依赖配置
├── start.bat          # Windows 启动脚本
└── README.md          # 使用说明
```

## 🚀 快速开始

### 方法 1: 使用启动脚本（推荐）

双击运行 `start.bat`，脚本会自动：
1. 检查并安装依赖
2. 启动 WebSocket 服务器

### 方法 2: 手动启动

```bash
# 1. 进入目录
cd websocket-server

# 2. 安装依赖（首次运行）
npm install

# 3. 启动服务器
npm start
# 或
node server.js
```

## ⚙️ 配置

### 修改端口

默认端口为 `5679`，可以通过以下方式修改：

**方法 1:** 设置环境变量
```bash
# Windows
set PORT=8080 && node server.js

# Linux/Mac
PORT=8080 node server.js
```

**方法 2:** 修改 `server.js` 文件
```javascript
const PORT = process.env.PORT || 5679; // 修改这里的 5679
```

### 多路径架构

服务器支持多个 WebSocket 路径，用于不同的功能模块：

| 路径 | 用途 | 状态 |
|------|------|------|
| `/game` | 游戏功能（点击、金币、用户列表） | ✅ 已实现 |
| `/chat` | 聊天功能 | 🔜 待实现 |

**客户端连接示例：**
```typescript
// 游戏服务
private readonly GAME_WS_URL = 'ws://localhost:5679/game';

// 聊天服务（未来）
private readonly CHAT_WS_URL = 'ws://localhost:5679/chat';
```

### 修改 Cocos 客户端连接地址

在 `assets/UI-pop2/src/PopWebsocket.ts` 中修改：

```typescript
private readonly WS_URL = 'ws://localhost:5679/game';
// 如果修改了端口，这里也要相应修改
```

## 📋 功能特性

- ✅ 用户登录/注册
- ✅ 点击数同步
- ✅ 多玩家数据实时同步
- ✅ 心跳保活机制
- ✅ 自动广播用户列表
- ✅ 多路径支持（便于扩展）

## 🔧 消息协议

详见项目文档：`assets/UI-pop2/src/README_WebSocket.md`

## 📝 扩展指南

### 添加新的 WebSocket 路径

以添加聊天功能为例：

**1. 在 server.js 中添加：**
```javascript
// 创建聊天 WebSocket 服务器
const chatWss = new WebSocket.Server({ 
    server: server,
    path: '/chat'
});

chatWss.on('connection', (ws) => {
    console.log('新客户端连接到 /chat');
    
    ws.on('message', (message) => {
        const data = JSON.parse(message.toString());
        // 处理聊天消息
        console.log('收到聊天消息:', data);
    });
});
```

**2. 在客户端创建新的管理器：**
```typescript
// ChatManager.ts
export class ChatManager extends WebSocketManager {
    constructor() {
        super({
            url: 'ws://localhost:5679/chat',
            // ... 其他配置
        });
    }
}
```

## ⚠️ 注意事项

1. **不要将此目录放在 assets 下**
   - 此目录应位于项目根目录
   - Cocos Creator 不会加载此目录的文件

2. **先启动服务器，再运行游戏**
   - 确保服务器正在运行
   - 然后在 Cocos Creator 中运行场景

3. **端口占用问题**
   - 如果提示 "EADDRINUSE"，说明端口已被占用
   - 关闭之前的服务器实例
   - 或修改端口号

4. **路径匹配**
   - 客户端连接的路径必须与服务器配置的路径完全一致
   - `/game` ≠ `/Game` ≠ `/game/`

## 🐛 常见问题

**Q: 提示 "Cannot find module 'ws'"？**
A: 运行 `npm install` 安装依赖。

**Q: 客户端连接失败？**
A: 
1. 确认服务器已启动
2. 检查端口号和路径是否正确
3. 查看防火墙设置

**Q: 如何停止服务器？**
A: 在命令行窗口按 `Ctrl+C`。

**Q: 如何同时使用游戏和聊天功能？**
A: 
1. 创建两个 WebSocketManager 实例
2. 分别连接到 `/game` 和 `/chat`
3. 独立管理两个连接的生命周期

## 📝 开发建议

这是一个简单的示例服务器，生产环境建议：
- 使用数据库持久化数据
- 添加身份验证和授权
- 实现更完善的错误处理
- 添加日志系统
- 使用进程管理器（如 PM2）
- 考虑使用 Redis 进行房间管理

---

**祝你开发顺利！** 🎉
