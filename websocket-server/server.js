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
const { v4: uuidv4 } = require('uuid');

// 创建 WebSocket 服务器
const PORT = 5679
const wss = new WebSocket.Server({ port: PORT });

console.log(`WebSocket 服务器已启动，监听端口 ${PORT}`);

// 存储所有连接的用户
const users = new Map();

// 存储所有房间，key为roomId，value为房间信息
const rooms = new Map();

// 存储 WebSocket 连接与用户 ID 的映射关系
const wsToUserMap = new Map(); // ws -> userId
const userToWsMap = new Map(); // userId -> ws

wss.on('connection', (ws) => {
    console.log('新客户端连接');
    
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
                
                case 'join_room':
                    handleJoinRoom(ws, data, currentUser);
                    break;
                
                case 'leave_room':
                    handleLeaveRoom(ws, data, currentUser);
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
            // 从所有房间中移除该用户（leaveAllRooms 内部已经会广播房间更新）
            leaveAllRooms(currentUser.id);
            
            // 清理映射关系
            wsToUserMap.delete(ws);
            userToWsMap.delete(currentUser.id);
            
            users.delete(currentUser.id);
            
            // 注意：不再全局广播用户列表，因为用户数据已经通过房间广播同步
            // broadcastUserList();
        }
    });

    // 处理错误
    ws.on('error', (error) => {
        console.error('WebSocket 错误:', error);
    });
});

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
    
    // 建立 WebSocket 与用户的映射关系
    wsToUserMap.set(ws, user.id);
    userToWsMap.set(user.id, ws);

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

    // 注意：登录后不广播用户列表，等待加入房间后再同步
    // broadcastUserList();

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

    // 查找用户所在的房间，并只向该房间广播
    const userRoom = findUserRoom(currentUser.id);
    if (userRoom) {
        // 向房间内所有玩家广播更新后的用户列表
        broadcastRoomSyncData(userRoom);
    }
}

/**
 * 查找用户所在的房间
 */
function findUserRoom(userId) {
    for (const [roomId, room] of rooms.entries()) {
        if (room.players.find(p => p.id === userId)) {
            return room;
        }
    }
    return null;
}

/**
 * 向房间内所有玩家同步数据（类似 sync_data，但只限房间内）
 */
function broadcastRoomSyncData(room) {
    const syncMessage = {
        type: 'sync_data',
        data: {
            users: room.players
        },
        timestamp: Date.now()
    };

    // 只发送给房间内的玩家
    room.players.forEach(player => {
        const ws = userToWsMap.get(player.id);
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(syncMessage));
        }
    });

    console.log(`向房间 ${room.roomId} 同步数据: ${room.players.length} 人`);
}

/**
 * 处理加入房间
 */
function handleJoinRoom(ws, data, currentUser) {
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

    const { roomId } = data.data;
    let room = rooms.get(roomId);
    let isNewRoom = false;

    // 如果房间不存在，创建新房间
    if (!room) {
        room = {
            roomId: roomId,
            players: [],
            createdAt: Date.now(),
            maxPlayers: 10 // 默认最大人数
        };
        rooms.set(roomId, room);
        isNewRoom = true;
        console.log(`创建新房间: ${roomId}`);
    }

    // 检查用户是否已经在房间中
    const existingPlayerIndex = room.players.findIndex(p => p.id === currentUser.id);
    if (existingPlayerIndex !== -1) {
        // 更新用户信息
        room.players[existingPlayerIndex] = currentUser;
    } else {
        // 添加新用户到房间
        room.players.push(currentUser);
    }

    console.log(`用户 ${currentUser.name} ${isNewRoom ? '创建并加入' : '加入'}房间: ${roomId}, 当前人数: ${room.players.length}`);

    // 发送加入房间成功响应
    sendToClient(ws, {
        type: 'join_room_response',
        success: true,
        message: isNewRoom ? '房间创建成功' : '加入房间成功',
        data: {
            room: room,
            isNewRoom: isNewRoom
        },
        timestamp: Date.now(),
        requestId: data.requestId
    });

    // 广播房间状态更新给房间内所有玩家
    broadcastRoomUpdate(room);
}

/**
 * 处理离开房间
 */
function handleLeaveRoom(ws, data, currentUser) {
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

    const { roomId } = data.data;
    const room = rooms.get(roomId);

    if (!room) {
        sendToClient(ws, {
            type: 'error',
            code: 404,
            message: '房间不存在',
            timestamp: Date.now(),
            requestId: data.requestId
        });
        return;
    }

    // 从房间中移除用户
    const playerIndex = room.players.findIndex(p => p.id === currentUser.id);
    if (playerIndex !== -1) {
        room.players.splice(playerIndex, 1);
        console.log(`用户 ${currentUser.name} 离开房间: ${roomId}, 剩余人数: ${room.players.length}`);

        // 如果房间为空，删除房间
        if (room.players.length === 0) {
            rooms.delete(roomId);
            console.log(`房间 ${roomId} 已删除（空房间）`);
        } else {
            // 广播房间状态更新
            broadcastRoomUpdate(room);
        }
    }

    // 发送离开房间成功响应
    sendToClient(ws, {
        type: 'leave_room_response',
        success: true,
        message: '离开房间成功',
        timestamp: Date.now(),
        requestId: data.requestId
    });
}

/**
 * 从所有房间中移除用户
 */
function leaveAllRooms(userId) {
    rooms.forEach((room, roomId) => {
        const playerIndex = room.players.findIndex(p => p.id === userId);
        if (playerIndex !== -1) {
            room.players.splice(playerIndex, 1);
            console.log(`用户 ${userId} 从房间 ${roomId} 中移除`);

            // 如果房间为空，删除房间
            if (room.players.length === 0) {
                rooms.delete(roomId);
                console.log(`房间 ${roomId} 已删除（空房间）`);
            } else {
                // 广播房间状态更新
                broadcastRoomUpdate(room);
            }
        }
    });
}

/**
 * 广播房间状态更新给房间内所有玩家
 */
function broadcastRoomUpdate(room) {
    const roomUpdateMessage = {
        type: 'room_update',
        data: {
            roomId: room.roomId,
            players: room.players,
            playerCount: room.players.length
        },
        timestamp: Date.now()
    };

    // 只发送给房间内的玩家
    room.players.forEach(player => {
        const ws = userToWsMap.get(player.id);
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(roomUpdateMessage));
        }
    });

    console.log(`广播房间 ${room.roomId} 状态更新: ${room.players.length} 人`);
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

    // 发送给所有连接的客户端
    wss.clients.forEach((client) => {
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

console.log('\n========================================');
console.log('WebSocket 服务器示例已启动');
console.log(`服务器地址: ws://localhost:${PORT}`);
console.log('按 Ctrl+C 停止服务器');
console.log('========================================\n');
