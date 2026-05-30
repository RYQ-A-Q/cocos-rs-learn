import { MessageType, WebSocketMessage, MessageUtils, IHeartbeatMessage, ILoginRequest, ILoginResponse, IClickUpdateRequest, IClickUpdateResponse, ISyncDataMessage, IErrorMessage } from './MessageProtocol';

/**
 * WebSocket 连接状态枚举
 */
export enum WebSocketState {
    CLOSED = 0,      // 未连接
    CONNECTING = 1,  // 连接中
    OPEN = 2,        // 已连接
    CLOSING = 3      // 关闭中
}

/**
 * WebSocket 管理器配置接口
 */
export interface IWebSocketConfig {
    url: string;                    // WebSocket 服务器地址
    reconnectInterval?: number;     // 重连间隔（毫秒），默认 3000
    maxReconnectAttempts?: number;  // 最大重连次数，默认 5
    heartbeatInterval?: number;     // 心跳间隔（毫秒），默认 5000
    timeout?: number;               // 连接超时时间（毫秒），默认 10000
}

/**
 * WebSocket 事件回调类型
 */
export type OnConnectCallback = () => void;
export type OnDisconnectCallback = (code: number, reason: string) => void;
export type OnMessageCallback = (message: WebSocketMessage) => void;
export type OnErrorCallback = (error: Event) => void;
export type OnReconnectCallback = (attempt: number) => void;

/**
 * WebSocket 管理器类
 * 负责管理 WebSocket 连接的建立、维护、重连等
 */
export class WebSocketManager {
    private ws: WebSocket | null = null;
    private config: IWebSocketConfig;
    private state: WebSocketState = WebSocketState.CLOSED;
    
    // 重连相关
    private reconnectAttempts: number = 0;
    private reconnectTimer: number | null = null;
    
    // 心跳相关
    private heartbeatTimer: number | null = null;
    private lastHeartbeatTime: number = 0;
    
    // 回调函数
    private onConnectCallback: OnConnectCallback | null = null;
    private onDisconnectCallback: OnDisconnectCallback | null = null;
    private onMessageCallback: OnMessageCallback | null = null;
    private onErrorCallback: OnErrorCallback | null = null;
    private onReconnectCallback: OnReconnectCallback | null = null;
    
    // 请求响应映射表（用于处理异步响应）
    private pendingRequests: Map<string, {
        resolve: (value: any) => void;
        reject: (reason: any) => void;
        timeout: ReturnType<typeof setTimeout>;
    }> = new Map();

    constructor(config: IWebSocketConfig) {
        this.config = {
            url: config.url,
            reconnectInterval: config.reconnectInterval || 3000,
            maxReconnectAttempts: config.maxReconnectAttempts || 5,
            heartbeatInterval: config.heartbeatInterval || 5000,
            timeout: config.timeout || 10000
        };
    }

    /**
     * 连接 WebSocket 服务器
     */
    connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.state === WebSocketState.OPEN || this.state === WebSocketState.CONNECTING) {
                console.warn('WebSocket 已经连接或正在连接中');
                resolve();
                return;
            }

            try {
                this.state = WebSocketState.CONNECTING;
                this.ws = new WebSocket(this.config.url);

                // 设置二进制数据类型
                this.ws.binaryType = 'arraybuffer';

                // 连接成功
                this.ws.onopen = (event) => {
                    console.log('WebSocket 连接成功');
                    this.state = WebSocketState.OPEN;
                    this.reconnectAttempts = 0;
                    
                    // 启动心跳
                    this.startHeartbeat();
                    
                    // 触发连接回调
                    if (this.onConnectCallback) {
                        this.onConnectCallback();
                    }
                    
                    resolve();
                };

                // 接收消息
                this.ws.onmessage = (event) => {
                    this.handleMessage(event.data);
                };

                // 连接关闭
                this.ws.onclose = (event) => {
                    console.log(`WebSocket 连接关闭: code=${event.code}, reason=${event.reason}`);
                    this.state = WebSocketState.CLOSED;
                    
                    // 停止心跳
                    this.stopHeartbeat();
                    
                    // 触发断开回调
                    if (this.onDisconnectCallback) {
                        this.onDisconnectCallback(event.code, event.reason);
                    }
                    
                    // 尝试重连
                    this.attemptReconnect();
                };

                // 连接错误
                this.ws.onerror = (error) => {
                    console.error('WebSocket 连接错误:', error);
                    this.state = WebSocketState.CLOSED;
                    
                    // 触发错误回调
                    if (this.onErrorCallback) {
                        this.onErrorCallback(error);
                    }
                    
                    reject(error);
                };

                // 连接超时处理
                setTimeout(() => {
                    if (this.state === WebSocketState.CONNECTING) {
                        console.error('WebSocket 连接超时');
                        this.ws?.close();
                        reject(new Error('连接超时'));
                    }
                }, this.config.timeout);

            } catch (error) {
                console.error('WebSocket 连接失败:', error);
                this.state = WebSocketState.CLOSED;
                reject(error);
            }
        });
    }

    /**
     * 发送消息
     */
    send(message: WebSocketMessage): Promise<any> {
        return new Promise((resolve, reject) => {
            if (this.state !== WebSocketState.OPEN || !this.ws) {
                reject(new Error('WebSocket 未连接'));
                return;
            }

            try {
                // 为需要响应的消息生成 requestId
                if (message.type !== MessageType.HEARTBEAT && message.type !== MessageType.HEARTBEAT_ACK) {
                    const requestId = MessageUtils.generateRequestId();
                    message.requestId = requestId;
                    
                    // 注册请求等待响应
                    this.pendingRequests.set(requestId, {
                        resolve,
                        reject,
                        timeout: setTimeout(() => {
                            this.pendingRequests.delete(requestId);
                            reject(new Error(`请求超时: ${message.type}`));
                        }, this.config.timeout)
                    });
                }

                const jsonString = MessageUtils.serialize(message);
                this.ws.send(jsonString);
                
                // 心跳消息不需要等待响应
                if (message.type === MessageType.HEARTBEAT || message.type === MessageType.HEARTBEAT_ACK) {
                    resolve(undefined);
                }
                
            } catch (error) {
                console.error('发送消息失败:', error);
                reject(error);
            }
        });
    }

    /**
     * 处理接收到的消息
     */
    private handleMessage(data: string) {
        const message = MessageUtils.deserialize(data);
        if (!message) {
            console.error('无效的消息格式');
            return;
        }

        console.log('收到消息:', message);

        // 检查是否有等待的响应
        if (message.requestId && this.pendingRequests.has(message.requestId)) {
            const request = this.pendingRequests.get(message.requestId);
            if (request) {
                clearTimeout(request.timeout);
                this.pendingRequests.delete(message.requestId);
                
                // 判断是否为错误消息
                if (message.type === MessageType.ERROR) {
                    const errorMsg = message as IErrorMessage;
                    request.reject(new Error(`${errorMsg.code}: ${errorMsg.message}`));
                } else {
                    request.resolve(message);
                }
            }
            return;
        }

        // 处理心跳响应
        if (message.type === MessageType.HEARTBEAT_ACK) {
            this.lastHeartbeatTime = Date.now();
            return;
        }

        // 触发消息回调
        if (this.onMessageCallback) {
            this.onMessageCallback(message);
        }
    }

    /**
     * 启动心跳
     */
    private startHeartbeat() {
        this.stopHeartbeat();
        
        // 使用 window.setInterval 确保返回 number 类型（浏览器环境）
        this.heartbeatTimer = window.setInterval(() => {
            if (this.state === WebSocketState.OPEN) {
                const heartbeatMsg: IHeartbeatMessage = {
                    type: MessageType.HEARTBEAT
                };
                this.send(heartbeatMsg).catch(err => {
                    console.error('发送心跳失败:', err);
                });
            }
        }, this.config.heartbeatInterval);
    }

    /**
     * 停止心跳
     */
    private stopHeartbeat() {
        if (this.heartbeatTimer) {
            window.clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }

    /**
     * 尝试重连
     */
    private attemptReconnect() {
        if (this.reconnectAttempts >= (this.config.maxReconnectAttempts || 5)) {
            console.error('达到最大重连次数，停止重连');
            return;
        }

        this.reconnectAttempts++;
        console.log(`准备第 ${this.reconnectAttempts} 次重连...`);

        // 触发重连回调
        if (this.onReconnectCallback) {
            this.onReconnectCallback(this.reconnectAttempts);
        }

        // 延迟后重连
        this.reconnectTimer = window.setTimeout(() => {
            this.connect().catch(err => {
                console.error('重连失败:', err);
            });
        }, this.config.reconnectInterval);
    }

    /**
     * 断开连接
     */
    disconnect() {
        // 清除重连定时器
        if (this.reconnectTimer) {
            window.clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        // 停止心跳
        this.stopHeartbeat();

        // 关闭 WebSocket
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }

        this.state = WebSocketState.CLOSED;
        this.reconnectAttempts = 0;

        // 清理所有待处理的请求
        this.pendingRequests.forEach((request) => {
            clearTimeout(request.timeout);
            request.reject(new Error('连接已关闭'));
        });
        this.pendingRequests.clear();
    }

    /**
     * 获取当前连接状态
     */
    getState(): WebSocketState {
        return this.state;
    }

    /**
     * 是否已连接
     */
    isConnected(): boolean {
        return this.state === WebSocketState.OPEN;
    }

    // ==================== 回调设置方法 ====================

    setOnConnect(callback: OnConnectCallback) {
        this.onConnectCallback = callback;
    }

    setOnDisconnect(callback: OnDisconnectCallback) {
        this.onDisconnectCallback = callback;
    }

    setOnMessage(callback: OnMessageCallback) {
        this.onMessageCallback = callback;
    }

    getOnMessage(): OnMessageCallback | null {
        return this.onMessageCallback;
    }

    setOnError(callback: OnErrorCallback) {
        this.onErrorCallback = callback;
    }

    setOnReconnect(callback: OnReconnectCallback) {
        this.onReconnectCallback = callback;
    }
}
