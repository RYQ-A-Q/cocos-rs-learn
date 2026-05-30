# WebSocket 案例说明

## 📁 文件结构

```
assets/UI-pop2/src/
├── MessageProtocol.ts      # 消息协议定义（消息类型、接口定义）
├── WebSocketManager.ts     # WebSocket 管理器（连接、重连、心跳）
├── NetworkService.ts       # 网络服务层（业务接口封装）
├── PopWebsocket.ts         # UI 控制器（集成 WebSocket 功能）
├── DuckCard.ts             # 卡片组件（支持数据同步）
└── WebSocketServerExample.js # Node.js 服务器示例代码
```

## 🎯 功能特性

### 1. **完整的 WebSocket 通信架构**
- ✅ 手动触发连接（类似"加入房间"操作）
- ✅ 自动连接和断线重连
- ✅ 心跳保活机制
- ✅ 请求-响应模式（Promise 化）
- ✅ 消息序列化/反序列化
- ✅ 错误处理和超时控制

### 2. **业务功能**
- ✅ 用户登录/注册
- ✅ 点击数同步到服务器
- ✅ 多玩家数据实时同步
- ✅ 本地数据持久化

### 3. **架构设计**
```
UI 层 (PopWebsocket, DuckCard)
    ↓
业务层 (NetworkService)
    ↓
网络层 (WebSocketManager)
    ↓
协议层 (MessageProtocol)
```

## 🚀 快速开始

### 步骤 1: 启动 WebSocket 服务器

**重要：WebSocket 服务器已移至项目根目录的 `websocket-server` 文件夹，不会在 Cocos Creator 编辑器中自动启动。**

#### 方法 1: 使用启动脚本（推荐 - Windows）

1. 打开文件资源管理器，进入项目根目录下的 `websocket-server` 文件夹
2. 双击运行 `start.bat`
3. 脚本会自动安装依赖并启动服务器

#### 方法 2: 命令行启动

```bash
# 1. 进入 websocket-server 目录（在项目根目录）
cd websocket-server

# 2. 安装依赖（首次运行需要）
npm install

# 3. 启动服务器
npm start
# 或
node server.js
```

服务器将在 `ws://localhost:5679` 启动。

**注意：**
- ⚠️ 服务器必须在运行游戏之前启动
- ⚠️ 保持服务器窗口开启，不要关闭
- ⚠️ 按 `Ctrl+C` 可以停止服务器

### 步骤 2: 配置 Cocos Creator

1. **在场景中创建以下节点结构：**
```
Canvas
├── StatusLabel (显示连接状态)
├── JoinRoomButton (加入房间按钮)
└── CardContainer (存放卡片的父节点)
```

2. **创建卡片预制体（Prefab）：**
   - 添加 `DuckCard` 组件（⚠️ 每个预制体只能添加一次）
   - 绑定 `nameLabel`、`clickLabel`、`duck` 节点
   - 为根节点添加点击事件，绑定到 `DuckCard.click` 方法

3. **在主节点上添加 `PopWebsocket` 组件：**
   - ⚠️ **重要：确保只添加一次 PopWebsocket 组件**
   - 绑定 `nodePar` 为 CardContainer
   - 绑定 `cardPrefab` 为卡片预制体
   - 绑定 `statusLabel` 为 StatusLabel
   - 绑定 `joinRoomButton` 为 JoinRoomButton

### 步骤 3: 修改服务器地址

在 `PopWebsocket.ts` 中修改 WebSocket 服务器地址：

```typescript
private readonly WS_URL = 'ws://your-server-address:8080/ws';
```

### 步骤 4: 使用流程

1. **启动场景** - 不会自动连接，显示"点击按钮加入房间"
2. **点击"加入房间"按钮** - 开始连接 WebSocket 服务器
3. **自动登录** - 连接成功后自动发送登录请求
4. **显示玩家列表** - 登录成功后显示所有在线玩家卡片
5. **交互** - 点击卡片增加金币，数据实时同步

## 📋 消息协议

### 消息类型

| 类型 | 说明 | 方向 |
|------|------|------|
| `connect` | 连接成功 | 服务器 → 客户端 |
| `heartbeat` | 心跳 | 客户端 → 服务器 |
| `heartbeat_ack` | 心跳响应 | 服务器 → 客户端 |
| `login` | 登录请求 | 客户端 → 服务器 |
| `login_response` | 登录响应 | 服务器 → 客户端 |
| `click_update` | 点击更新 | 客户端 → 服务器 |
| `click_update_response` | 点击更新响应 | 服务器 → 客户端 |
| `sync_data` | 数据同步 | 服务器 → 客户端 |
| `error` | 错误消息 | 双向 |

### 消息格式示例

**登录请求：**
```json
{
  "type": "login",
  "timestamp": 1234567890,
  "requestId": "req_xxx",
  "data": {
    "id": "user123",
    "name": "张三",
    "money": 0
  }
}
```

**登录响应：**
```json
{
  "type": "login_response",
  "timestamp": 1234567891,
  "requestId": "req_xxx",
  "success": true,
  "message": "登录成功",
  "data": {
    "id": "user123",
    "name": "张三",
    "money": 0
  }
}
```

**数据同步：**
```json
{
  "type": "sync_data",
  "timestamp": 1234567892,
  "data": {
    "users": [
      {
        "id": "user123",
        "name": "张三",
        "money": 10
      },
      {
        "id": "user456",
        "name": "李四",
        "money": 5
      }
    ]
  }
}
```

## 🔧 核心 API

### WebSocketManager

```typescript
// 创建实例
const manager = new WebSocketManager({
    url: 'ws://localhost:8080',
    reconnectInterval: 3000,
    maxReconnectAttempts: 5,
    heartbeatInterval: 5000,
    timeout: 10000
});

// 连接
await manager.connect();

// 发送消息
const response = await manager.send(message);

// 设置回调
manager.setOnConnect(() => { /* ... */ });
manager.setOnDisconnect((code, reason) => { /* ... */ });
manager.setOnMessage((message) => { /* ... */ });
manager.setOnError((error) => { /* ... */ });
manager.setOnReconnect((attempt) => { /* ... */ });

// 断开连接
manager.disconnect();
```

### NetworkService

```typescript
// 创建实例
const service = new NetworkService(manager);

// 登录
const user = await service.login(userData);

// 更新点击数
const money = await service.updateClick(userId, money);

// 监听数据同步
service.onSyncData((users) => {
    console.log('收到同步数据:', users);
});
```

## 💡 使用示例

### 在组件中使用

``typescript
import { _decorator, Component } from 'cc';
import { WebSocketManager } from './WebSocketManager';
import { NetworkService } from './NetworkService';

@ccclass('MyComponent')
export class MyComponent extends Component {
    private wsManager: WebSocketManager;
    private networkService: NetworkService;

    start() {
        // 初始化
        this.wsManager = new WebSocketManager({
            url: 'ws://localhost:8080'
        });
        
        this.networkService = new NetworkService(this.wsManager);
        
        // 连接并登录
        this.connectAndLogin();
    }

    async connectAndLogin() {
        try {
            await this.wsManager.connect();
            
            const user = await this.networkService.login({
                id: 'user123',
                name: '测试用户',
                money: 0
            });
            
            console.log('登录成功:', user);
        } catch (error) {
            console.error('失败:', error);
        }
    }

    onDestroy() {
        this.wsManager.disconnect();
    }
}
```

## 🎮 工作流程

1. **启动阶段**
   - 加载本地用户数据
   - 初始化 WebSocket 管理器
   - 连接到服务器

2. **登录阶段**
   - 自动发送登录请求
   - 接收登录响应
   - 显示用户卡片

3. **交互阶段**
   - 用户点击卡片
   - 本地立即更新（乐观更新）
   - 发送更新请求到服务器
   - 接收服务器确认
   - 广播给其他客户端

4. **同步阶段**
   - 服务器推送最新数据
   - 所有客户端同步更新
   - 保持数据一致性

## ⚠️ 注意事项

1. **服务器地址配置**
   - 开发环境：`ws://localhost:8080`
   - 生产环境：替换为真实服务器地址

2. **跨域问题**
   - 确保服务器允许跨域访问
   - Cocos Creator 打包后需要注意域名白名单

3. **重连机制**
   - 默认最多重连 5 次
   - 可根据需求调整重连策略

4. **性能优化**
   - 避免频繁发送小消息
   - 可以合并多个更新为一个请求
   - 使用节流/防抖处理高频操作

5. **错误处理**
   - 所有异步操作都需要 try-catch
   - 网络失败时提供友好的提示
   - 考虑离线模式的数据缓存

## 🔍 调试技巧

1. **查看控制台日志**
   - 连接状态变化
   - 收发消息内容
   - 错误信息

2. **使用浏览器开发者工具**
   - Network 面板查看 WebSocket 帧
   - Console 查看日志

3. **模拟网络问题**
   - 使用 Chrome DevTools 的 Network Throttling
   - 测试重连机制

## 📝 扩展建议

1. **添加更多业务接口**
   - 在 `NetworkService` 中添加新方法
   - 在 `MessageProtocol` 中定义新消息类型

2. **实现房间系统**
   - 添加加入/离开房间的消息
   - 房间内玩家数据隔离

3. **添加聊天功能**
   - 定义聊天消息协议
   - 实现消息收发

4. **安全性增强**
   - 添加 Token 认证
   - 消息加密
   - 防止作弊验证

## 🐛 常见问题

**Q: 连接失败怎么办？**
A: 检查服务器是否启动、地址是否正确、防火墙设置。

**Q: 消息发送失败？**
A: 确认连接状态为 OPEN，检查消息格式是否正确。

**Q: 如何测试多客户端？**
A: 打开多个浏览器窗口或标签页，同时连接服务器。

**Q: 数据不同步？**
A: 检查服务器是否正确广播，客户端是否正确处理 sync_data 消息。

## 📚 参考资料

- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [Cocos Creator 文档](https://docs.cocos.com/creator/manual/zh/)
- [ws 库文档](https://github.com/websockets/ws)

---

**祝你开发顺利！** 🎉
