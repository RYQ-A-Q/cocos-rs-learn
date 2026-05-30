import { _decorator, Component, Node, Label, Prefab, instantiate, Button } from 'cc';
import { storageMgr } from '../../RS/core/Managers/StorageMgr';
import { NumberUtils } from '../../RS/core/utils/NumberUtils';
import { RandomNameUtils } from '../../RS/core/utils/RandomNameUtils';
import { DuckCard } from './DuckCard';
import { WebSocketManager } from './WebSocketManager';
import { NetworkService } from './NetworkService';
import { IAcountItem } from './MessageProtocol';

const { ccclass, property } = _decorator;

@ccclass('PopWebsocket')
export class PopWebsocket extends Component {
    private user: IAcountItem;
    private wsManager: WebSocketManager;
    private networkService: NetworkService;
    
    // 调试模式开关（生产环境设为 false）
    private readonly DEBUG_MODE = true;
    
    @property({ type: Node })
    private nodePar: Node;
    
    @property({ type: Prefab })
    private cardPrefab: Prefab;
    
    @property({ type: Label })
    private statusLabel: Label;
    
    @property({ type: Button })
    private joinRoomButton: Button;
    
    public playerList: IAcountItem[] = [];
    
    // WebSocket 服务器地址
    // 注意：端口必须与 websocket-server/server.js 中的 PORT 一致
    // /game 路径用于游戏相关功能（点击、金币等）
    private readonly WS_URL = 'ws://localhost:5679/game';
    
    private isConnected: boolean = false;

    /**
     * 调试日志输出
     */
    private debugLog(...args: any[]) {
        if (this.DEBUG_MODE) {
            console.log('[PopWebsocket]', ...args);
        }
    }

    start() {
        // 1. 加载本地用户数据
        this.loadLocalUser();
        
        // 2. 初始化 WebSocket（但不自动连接）
        this.initWebSocket();
        
        // 3. 显示"加入房间"按钮，等待用户点击
        this.updateStatus('点击按钮加入房间');
        if (this.joinRoomButton) {
            this.joinRoomButton.node.active = true;
            this.joinRoomButton.node.on(Button.EventType.CLICK, this.onJoinRoomClick, this);
        }
    }

    /**
     * 点击"加入房间"按钮
     */
    private async onJoinRoomClick() {
        this.debugLog('用户点击加入房间');
        
        // 禁用按钮防止重复点击
        if (this.joinRoomButton) {
            this.joinRoomButton.interactable = false;
        }
        
        // 开始连接
        await this.connectToServer();
    }

    /**
     * 加载本地用户数据
     */
    private loadLocalUser() {
        let local = storageMgr.getJson("rs-learn-user") as IAcountItem;
        if (local && Object.keys(local).length > 0) {
            this.user = local;
        } else {
            this.user = {
                id: NumberUtils.generateSerialCode(),
                name: RandomNameUtils.generate(),
                money: 0
            };
            storageMgr.set("rs-learn-user", this.user);
        }
        this.debugLog('当前用户:', this.user);
    }

    /**
     * 初始化 WebSocket 管理器
     */
    private initWebSocket() {
        // 创建 WebSocket 管理器
        this.wsManager = new WebSocketManager({
            url: this.WS_URL,
            reconnectInterval: 3000,
            maxReconnectAttempts: 5,
            heartbeatInterval: 5000,
            timeout: 10000
        });

        // 创建网络服务
        this.networkService = new NetworkService(this.wsManager);

        // 设置回调
        this.setupCallbacks(); 
    }

    /**
     * 设置 WebSocket 回调
     */
    private setupCallbacks() {
        // 连接成功
        this.wsManager.setOnConnect(() => {
            this.debugLog('WebSocket 已连接');
            this.isConnected = true;
            this.updateStatus('已连接');
            
            // 隐藏加入按钮
            if (this.joinRoomButton) {
                this.joinRoomButton.node.active = false;
            }
            
            // 自动登录
            this.autoLogin();
        });

        // 断开连接
        this.wsManager.setOnDisconnect((code, reason) => {
            this.debugLog(`WebSocket 已断开: code=${code}, reason=${reason}`);
            this.isConnected = false;
            this.updateStatus(`已断开 (${code})`);
            
            // 重新显示加入按钮
            if (this.joinRoomButton) {
                this.joinRoomButton.interactable = true;
                this.joinRoomButton.node.active = true;
            }
        });

        // 接收消息
        this.wsManager.setOnMessage((message) => {
            this.debugLog('收到消息:', message);
            // 这里可以处理其他类型的消息
        });

        // 错误处理
        this.wsManager.setOnError((error) => {
            console.error('[PopWebsocket] WebSocket 错误:', error);
            this.updateStatus('连接错误');
            
            // 重新启用按钮
            if (this.joinRoomButton) {
                this.joinRoomButton.interactable = true;
            }
        });

        // 重连
        this.wsManager.setOnReconnect((attempt) => {
            this.debugLog(`第 ${attempt} 次重连...`);
            this.updateStatus(`重连中 (${attempt})`);
        });

        // 监听数据同步
        this.networkService.onSyncData((users) => {
            this.debugLog('收到玩家数据同步:', users);
            this.syncPlayerData(users);
        });
    }

    /**
     * 连接到服务器
     */
    private async connectToServer() {
        this.updateStatus('连接中...');
        
        try {
            await this.wsManager.connect();
        } catch (error) {
            console.error('连接失败:', error);
            this.updateStatus('连接失败');
            
            // 重新启用按钮
            if (this.joinRoomButton) {
                this.joinRoomButton.interactable = true;
            }
        }
    }

    /**
     * 自动登录
     */
    private async autoLogin() {
        try {
            const userInfo = await this.networkService.login(this.user);
            this.debugLog('登录成功:', userInfo);
            
            // 更新本地用户数据
            this.user = userInfo;
            storageMgr.set("rs-learn-user", this.user);
            
            // 显示 UI
            this.begin();
        } catch (error) {
            console.error('[PopWebsocket] 登录失败:', error);
            this.updateStatus('登录失败');
            
            // 重新启用按钮
            if (this.joinRoomButton) {
                this.joinRoomButton.interactable = true;
            }
        }
    }

    /**
     * 同步玩家数据
     */
    private syncPlayerData(users: IAcountItem[]) {
        // 更新玩家列表
        this.playerList = users;
        
        // 刷新 UI
        this.refreshCards();
    }

    /**
     * 刷新卡片显示
     */
    private refreshCards() {
        // 清除旧卡片
        if (this.nodePar) {
            this.nodePar.removeAllChildren();
            
            // 创建新卡片
            this.playerList.forEach(element => {
                let newCard = instantiate(this.cardPrefab);
                let cardSC = newCard.getComponent(DuckCard);
                if (cardSC) {
                    cardSC.init(element, this.networkService);
                }
                this.nodePar.addChild(newCard);
            });
        }
    }

    /**
     * 开始显示（初始加载）
     */
    private begin() {
        // 添加当前用户到列表
        if (!this.playerList.find(u => u.id === this.user.id)) {
            this.playerList.push(this.user);
        }
        
        // 显示卡片
        this.refreshCards();
    }

    /**
     * 更新状态显示
     */
    private updateStatus(status: string) {
        if (this.statusLabel) {
            this.statusLabel.string = status;
        }
    }

    /**
     * 获取网络服务实例（供子组件使用）
     */
    getNetworkService(): NetworkService {
        return this.networkService;
    }

    /**
     * 获取当前用户
     */
    getCurrentUser(): IAcountItem {
        return this.user;
    }

    onDestroy() {
        // 移除按钮事件监听
        if (this.joinRoomButton) {
            this.joinRoomButton.node?.off(Button.EventType.CLICK, this.onJoinRoomClick, this);
        }
        
        // 组件销毁时断开连接
        if (this.wsManager && this.isConnected) {
            this.wsManager.disconnect();
        }
    }
}

