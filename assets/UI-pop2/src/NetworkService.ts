import { WebSocketManager, WebSocketState } from './WebSocketManager';
import { 
    MessageType, 
    ILoginRequest, 
    ILoginResponse, 
    IClickUpdateRequest, 
    IClickUpdateResponse, 
    ISyncDataMessage,
    IJoinRoomRequest,
    IJoinRoomResponse,
    ILeaveRoomRequest,
    IRoomUpdateMessage,
    IRoomInfo,
    IAcountItem 
} from './MessageProtocol';

/**
 * 网络服务层
 * 封装业务相关的 WebSocket 接口调用
 */
export class NetworkService {
    private wsManager: WebSocketManager;
    
    constructor(wsManager: WebSocketManager) {
        this.wsManager = wsManager;
    }

    /**
     * 登录/注册
     */
    async login(user: IAcountItem): Promise<IAcountItem> {
        const request: ILoginRequest = {
            type: MessageType.LOGIN,
            data: user
        };

        try {
            const response = await this.wsManager.send(request) as ILoginResponse;
            
            if (response.success && response.data) {
                console.log('登录成功:', response.data);
                return response.data;
            } else {
                throw new Error(response.message || '登录失败');
            }
        } catch (error) {
            console.error('登录请求失败:', error);
            throw error;
        }
    }

    /**
     * 加入房间（有则加入，没有则创建）
     */
    async joinRoom(roomId: string, userId: string): Promise<{ room: IRoomInfo; isNewRoom: boolean }> {
        const request: IJoinRoomRequest = {
            type: MessageType.JOIN_ROOM,
            data: {
                roomId,
                userId
            }
        };

        try {
            const response = await this.wsManager.send(request) as IJoinRoomResponse;
            
            if (response.success && response.data) {
                console.log('加入房间成功:', response.data.room);
                return {
                    room: response.data.room,
                    isNewRoom: response.data.isNewRoom
                };
            } else {
                throw new Error(response.message || '加入房间失败');
            }
        } catch (error) {
            console.error('加入房间请求失败:', error);
            throw error;
        }
    }

    /**
     * 离开房间
     */
    async leaveRoom(roomId: string, userId: string): Promise<void> {
        const request: ILeaveRoomRequest = {
            type: MessageType.LEAVE_ROOM,
            data: {
                roomId,
                userId
            }
        };

        try {
            await this.wsManager.send(request);
            console.log('离开房间成功');
        } catch (error) {
            console.error('离开房间请求失败:', error);
            throw error;
        }
    }

    /**
     * 更新点击数（同步到服务器）
     */
    async updateClick(userId: string, money: number): Promise<number> {
        const request: IClickUpdateRequest = {
            type: MessageType.CLICK_UPDATE,
            data: {
                userId,
                money
            }
        };

        try {
            const response = await this.wsManager.send(request) as IClickUpdateResponse;
            
            if (response.success && response.data) {
                console.log('点击更新成功:', response.data.money);
                return response.data.money;
            } else {
                throw new Error(response.message || '更新失败');
            }
        } catch (error) {
            console.error('点击更新请求失败:', error);
            throw error;
        }
    }

    /**
     * 监听数据同步消息（服务器推送其他玩家数据）
     */
    onSyncData(callback: (users: IAcountItem[]) => void) {
        // 保存原有的回调
        const originalCallback = this.wsManager.getOnMessage();
        
        this.wsManager.setOnMessage((message) => {
            // 先执行原有回调
            if (originalCallback) {
                originalCallback(message);
            }
            
            // 再执行新的回调
            if (message.type === MessageType.SYNC_DATA) {
                const syncMsg = message as ISyncDataMessage;
                if (syncMsg.data && syncMsg.data.users) {
                    callback(syncMsg.data.users);
                }
            }
        });
    }

    /**
     * 监听房间状态更新消息（服务器推送）
     */
    onRoomUpdate(callback: (roomId: string, players: IAcountItem[], playerCount: number) => void) {
        // 保存原有的回调
        const originalCallback = this.wsManager.getOnMessage();
        
        this.wsManager.setOnMessage((message) => {
            // 先执行原有回调
            if (originalCallback) {
                originalCallback(message);
            }
            
            // 再执行新的回调
            if (message.type === MessageType.ROOM_UPDATE) {
                const roomMsg = message as IRoomUpdateMessage;
                if (roomMsg.data) {
                    callback(roomMsg.data.roomId, roomMsg.data.players, roomMsg.data.playerCount);
                }
            }
        });
    }

    /**
     * 获取 WebSocket 管理器实例
     */
    getManager(): WebSocketManager {
        return this.wsManager;
    }
}
