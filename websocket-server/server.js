/**
 * WebSocket 服务器示例（Node.js）
 * 
 * 使用方法：
 * 1. 进入 websocket-server 目录: cd websocket-server
 * 2. 安装依赖: npm install
 * 3. 运行: node server.js
 * 
 * 注意：这是一个简单的示例服务器，生产环境需要使用更完善的方案
 */

const WebSocket = require('ws');
const http = require('http');
const { v4: uuidv4 } = require('uuid');

// 创建 HTTP 服务器
const PORT = process.env.PORT || 5679;
const server = http.createServer();

console.log(`WebSocket 服务器已启动，监听端口 ${PORT}`);

// 创建游戏 WebSocket 服务器，指定路径 /game
const gameWss = new WebSocket.Server({ 
    server: server,
    path: '/game'
});

// 存储所有连接的用户
const users = new Map();

gameWss.on('connection', (ws) => {
    console.log('新客户端连接到 /game');
    
    let currentUser = null;

    // 发送连接成功消息
    sendToClient(ws, {
        type: 'connect',
        timestamp: Date.now()
    });

    // 处理接收到的消息
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message.toString());
            console.log('收到消息:', data);

            // 根据消息类型处理
            switch (data.type) {
                case 'heartbeat':
                    handleHeartbeat(ws, data);
                    break;
                
                case 'login':
                    currentUser = handleLogin(ws, data);
                    break;
                
                case 'click_update':
                    handleClickUpdate(ws, data, currentUser);
                    break;
                
                default:
                    console.log('未知消息类型:', data.type);
            }
        } catch (error) {
            console.error('消息解析错误:', error);
            sendToClient(ws, {
                type: 'error',
                code: 400,
                message: '无效的消息格式',
                timestamp: Date.now()
            });
        }
    });

    // 处理断开连接
    ws.on('close', () => {
        console.log('客户端断开连接');
        if (currentUser) {
            users.delete(currentUser.id);
            broadcastUserList();
        }
    });

    // 处理错误
    ws.on('error', (error) => {
        console.error('WebSocket 错误:', error);
    });
});

// TODO: 未来可以添加聊天 WebSocket 服务器
// const chatWss = new WebSocket.Server({ 
//     server: server,
//     path: '/chat'
// });
// chatWss.on('connection', (ws) => {
//     console.log('新客户端连接到 /chat');
//     // 聊天逻辑...
// });

/**
 * 处理心跳
 */
function handleHeartbeat(ws, data) {
    sendToClient(ws, {
        type: 'heartbeat_ack',
        timestamp: Date.now(),
        requestId: data.requestId
    });
}

/**
 * 处理登录
 */
function handleLogin(ws, data) {
    const userData = data.data;
    
    // 创建或更新用户
    const user = {
        id: userData.id || uuidv4(),
        name: userData.name || '匿名用户',
        money: userData.money || 0
    };

    users.set(user.id, user);
    currentUser = user;

    console.log(`用户登录: ${user.name} (${user.id})`);

    // 发送登录成功响应
    sendToClient(ws, {
        type: 'login_response',
        success: true,
        message: '登录成功',
        data: user,
        timestamp: Date.now(),
        requestId: data.requestId
    });

    // 广播用户列表给所有客户端
    broadcastUserList();

    return user;
}

/**
 * 处理点击更新
 */
function handleClickUpdate(ws, data, currentUser) {
    if (!currentUser) {
        sendToClient(ws, {
            type: 'error',
            code: 401,
            message: '未登录',
            timestamp: Date.now(),
            requestId: data.requestId
        });
        return;
    }

    const updateData = data.data;
    
    // 验证用户 ID
    if (updateData.userId !== currentUser.id) {
        sendToClient(ws, {
            type: 'error',
            code: 403,
            message: '无权修改其他用户数据',
            timestamp: Date.now(),
            requestId: data.requestId
        });
        return;
    }

    // 更新用户的 money
    currentUser.money = updateData.money;
    users.set(currentUser.id, currentUser);

    console.log(`用户 ${currentUser.name} 的 money 更新为: ${currentUser.money}`);

    // 发送更新成功响应
    sendToClient(ws, {
        type: 'click_update_response',
        success: true,
        data: {
            userId: currentUser.id,
            money: currentUser.money
        },
        timestamp: Date.now(),
        requestId: data.requestId
    });

    // 广播更新后的用户列表
    broadcastUserList();
}

/**
 * 广播用户列表给所有客户端
 */
function broadcastUserList() {
    const userList = Array.from(users.values());
    
    const syncMessage = {
        type: 'sync_data',
        data: {
            users: userList
        },
        timestamp: Date.now()
    };

    gameWss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(syncMessage));
        }
    });

    console.log('广播用户列表:', userList.length, '个用户');
}

/**
 * 发送消息给指定客户端
 */
function sendToClient(ws, message) {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
    }
}

// 启动 HTTP 服务器
server.listen(PORT, () => {
    console.log('\n========================================');
    console.log('WebSocket 服务器示例已启动');
    console.log(`游戏服务地址: ws://localhost:${PORT}/game`);
    console.log('按 Ctrl+C 停止服务器');
    console.log('========================================\n');
});
