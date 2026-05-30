/**
 * WebSocket 消息协议定义
 */

/**
 * 账户信息接口
 */
export interface IAcountItem {
    id: string;
    name: string;
    money: number;
}

/**
 * 房间信息接口
 */
export interface IRoomInfo {
    roomId: string;
    roomName?: string;
    maxPlayers?: number;
    players: IAcountItem[];
    createdAt?: number;
}

/**
 * 消息类型枚举
 */
export enum MessageType {
    // 系统消息
    CONNECT = 'connect',                    // 连接成功
    DISCONNECT = 'disconnect',              // 断开连接
    HEARTBEAT = 'heartbeat',                // 心跳
    HEARTBEAT_ACK = 'heartbeat_ack',        // 心跳响应
    
    // 业务消息
    LOGIN = 'login',                        // 登录
    LOGIN_RESPONSE = 'login_response',      // 登录响应
    CLICK_UPDATE = 'click_update',          // 点击更新
    CLICK_UPDATE_RESPONSE = 'click_update_response', // 点击更新响应
    SYNC_DATA = 'sync_data',                // 数据同步
    ERROR = 'error',                        // 错误消息
    
    // 房间相关消息
    JOIN_ROOM = 'join_room',                // 加入房间
    JOIN_ROOM_RESPONSE = 'join_room_response', // 加入房间响应
    LEAVE_ROOM = 'leave_room',              // 离开房间
    ROOM_UPDATE = 'room_update',            // 房间状态更新（服务器推送）
    
    // 自定义扩展消息（可根据需要添加）
    CUSTOM_EVENT = 'custom_event',          // 自定义事件
    NOTIFICATION = 'notification'           // 通知消息
}

/**
 * 基础消息接口
 */
export interface IMessage {
    type: MessageType;
    timestamp?: number;
    requestId?: string;
}

/**
 * 心跳消息
 */
export interface IHeartbeatMessage extends IMessage {
    type: MessageType.HEARTBEAT | MessageType.HEARTBEAT_ACK;
}

/**
 * 登录请求消息
 */
export interface ILoginRequest extends IMessage {
    type: MessageType.LOGIN;
    data: {
        id: string;
        name: string;
        money: number;
    };
}

/**
 * 登录响应消息
 */
export interface ILoginResponse extends IMessage {
    type: MessageType.LOGIN_RESPONSE;
    success: boolean;
    message?: string;
    data?: {
        id: string;
        name: string;
        money: number;
    };
}

/**
 * 点击更新请求消息
 */
export interface IClickUpdateRequest extends IMessage {
    type: MessageType.CLICK_UPDATE;
    data: {
        userId: string;
        money: number;
    };
}

/**
 * 点击更新响应消息
 */
export interface IClickUpdateResponse extends IMessage {
    type: MessageType.CLICK_UPDATE_RESPONSE;
    success: boolean;
    message?: string;
    data?: {
        userId: string;
        money: number;
    };
}

/**
 * 数据同步消息（服务器推送）
 */
export interface ISyncDataMessage extends IMessage {
    type: MessageType.SYNC_DATA;
    data: {
        users: Array<{
            id: string;
            name: string;
            money: number;
        }>;
    };
}

/**
 * 错误消息
 */
export interface IErrorMessage extends IMessage {
    type: MessageType.ERROR;
    code: number;
    message: string;
}

/**
 * 加入房间请求消息
 */
export interface IJoinRoomRequest extends IMessage {
    type: MessageType.JOIN_ROOM;
    data: {
        roomId: string;
        userId: string;
    };
}

/**
 * 加入房间响应消息
 */
export interface IJoinRoomResponse extends IMessage {
    type: MessageType.JOIN_ROOM_RESPONSE;
    success: boolean;
    message?: string;
    data?: {
        room: IRoomInfo;
        isNewRoom: boolean; // true表示创建了新房间，false表示加入了已有房间
    };
}

/**
 * 离开房间请求消息
 */
export interface ILeaveRoomRequest extends IMessage {
    type: MessageType.LEAVE_ROOM;
    data: {
        roomId: string;
        userId: string;
    };
}

/**
 * 房间状态更新消息（服务器推送）
 */
export interface IRoomUpdateMessage extends IMessage {
    type: MessageType.ROOM_UPDATE;
    data: {
        roomId: string;
        players: IAcountItem[];
        playerCount: number;
    };
}

/**
 * 所有消息类型的联合类型
 */
export type WebSocketMessage = 
    | IHeartbeatMessage
    | ILoginRequest
    | ILoginResponse
    | IClickUpdateRequest
    | IClickUpdateResponse
    | ISyncDataMessage
    | IErrorMessage
    | IJoinRoomRequest
    | IJoinRoomResponse
    | ILeaveRoomRequest
    | IRoomUpdateMessage;

/**
 * 消息工具类
 */
export class MessageUtils {
    /**
     * 将对象序列化为 JSON 字符串
     */
    static serialize(message: WebSocketMessage): string {
        return JSON.stringify({
            ...message,
            timestamp: message.timestamp || Date.now()
        });
    }

    /**
     * 将 JSON 字符串反序列化为消息对象
     */
    static deserialize(jsonString: string): WebSocketMessage | null {
        try {
            const message = JSON.parse(jsonString);
            if (message && message.type) {
                return message as WebSocketMessage;
            }
            return null;
        } catch (error) {
            console.error('消息反序列化失败:', error);
            return null;
        }
    }

    /**
     * 生成唯一请求 ID
     */
    static generateRequestId(): string {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
