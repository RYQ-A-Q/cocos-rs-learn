import { _decorator, Component, Node, Label, Prefab, instantiate, Button } from 'cc';
import { storageMgr } from '../../RS/core/Managers/StorageMgr';
import { NumberUtils } from '../../RS/core/utils/NumberUtils';
import { RandomNameUtils } from '../../RS/core/utils/RandomNameUtils';
import { DuckCard } from './DuckCard';
import { WebSocketManager } from './WebSocketManager';
import { NetworkService } from './NetworkService';
import { IAcountItem, IRoomInfo } from './MessageProtocol';
import { EditBox } from 'cc';
import { NodeUtils } from '../../RS/core/utils/NodeUtils';

const { ccclass, property } = _decorator;

@ccclass('PopWebsocket')
export class PopWebsocket extends Component {
    private user: IAcountItem;
    private wsManager: WebSocketManager;
    private networkService: NetworkService;

    @property({ type: Node })
    private nodePar: Node;

    @property({ type: Prefab })
    private cardPrefab: Prefab;

    @property({ type: Label })
    private statusLabel: Label;

    @property({ type: Label })
    private roomInfoLabel: Label;

    @property({ type: Button })
    private joinRoomButton: Button;
    @property({ type: EditBox })
    private roomEdit: EditBox;

    public playerList: IAcountItem[] = [];
    private currentRoom: IRoomInfo | null = null;

    // WebSocket 服务器地址（示例地址，实际使用时需要替换为真实服务器）
    // 注意：端口必须与 websocket-server/server.js 中的 PORT 一致
    private readonly WS_URL = 'ws://127.0.0.1:5679/ws';

    private isConnected: boolean = false;

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
        console.log('用户点击加入房间');

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
        console.log('当前用户:', this.user);
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
            console.log('WebSocket 已连接');
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
            console.log(`WebSocket 已断开: code=${code}, reason=${reason}`);
            this.isConnected = false;
            this.updateStatus(`已断开 (${code})`);

            // 清空房间信息
            this.currentRoom = null;
            this.updateRoomInfoDisplay();

            // 重新显示加入按钮
            if (this.joinRoomButton) {
                this.joinRoomButton.interactable = true;
                this.joinRoomButton.node.active = true;
            }
        });

        // 接收消息
        this.wsManager.setOnMessage((message) => {
            console.log('收到消息:', message);
            // 这里可以处理其他类型的消息
        });

        // 错误处理
        this.wsManager.setOnError((error) => {
            console.error('WebSocket 错误:', error);
            this.updateStatus('连接错误');

            // 重新启用按钮
            if (this.joinRoomButton) {
                this.joinRoomButton.interactable = true;
            }
        });

        // 重连
        this.wsManager.setOnReconnect((attempt) => {
            console.log(`第 ${attempt} 次重连...`);
            this.updateStatus(`重连中 (${attempt})`);
        });

        // 监听数据同步
        this.networkService.onSyncData((users) => {
            console.log('收到玩家数据同步:', users);
            this.syncPlayerData(users);
        });

        // 监听房间状态更新
        this.networkService.onRoomUpdate((roomId, players, playerCount) => {
            console.log(`房间 ${roomId} 状态更新: ${playerCount} 人`);
            this.handleRoomUpdate(roomId, players, playerCount);
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
            console.log('登录成功:', userInfo);

            // 更新本地用户数据
            this.user = userInfo;
            storageMgr.set("rs-learn-user", this.user);

            // 开始加入房间流程
            this.startJoinRoomProcess();
        } catch (error) {
            console.error('登录失败:', error);
            this.updateStatus('登录失败');

            // 重新启用按钮
            if (this.joinRoomButton) {
                this.joinRoomButton.interactable = true;
            }
        }
    }

    /**
     * 开始加入房间流程
     */
    private async startJoinRoomProcess() {
        // 获取房间ID（从输入框或生成默认房间ID）
        let roomId = '';
        if (this.roomEdit && this.roomEdit.string.trim()) {
            roomId = this.roomEdit.string.trim();
        } else {
            // 如果没有输入房间号，使用默认房间
            roomId = 'default_room';
        }

        this.updateStatus(`正在加入房间: ${roomId}...`);

        try {
            const result = await this.networkService.joinRoom(roomId, this.user.id);

            // 保存当前房间信息
            this.currentRoom = result.room;

            // 显示房间信息
            this.updateRoomInfoDisplay();

            // 更新状态
            const actionText = result.isNewRoom ? '创建' : '加入';
            this.updateStatus(`${actionText}房间成功！`);

            // 显示卡片
            this.begin();
        } catch (error) {
            console.error('加入房间失败:', error);
            this.updateStatus('加入房间失败');

            // 重新启用按钮
            if (this.joinRoomButton) {
                this.joinRoomButton.interactable = true;
            }
        }
    }

    /**
     * 处理房间状态更新
     */
    private handleRoomUpdate(roomId: string, players: IAcountItem[], playerCount: number) {
        // 如果是当前房间，更新信息
        if (this.currentRoom && this.currentRoom.roomId === roomId) {
            this.currentRoom.players = players;
            this.playerList = players;

            // 刷新 UI
            this.refreshCards();

            // 更新房间信息显示
            this.updateRoomInfoDisplay();
        }
    }

    /**
     * 更新房间信息显示
     */
    private updateRoomInfoDisplay() {
        if (this.roomInfoLabel && this.currentRoom) {
            const playerCount = this.currentRoom.players.length;
            const maxPlayers = this.currentRoom.maxPlayers || '∞';
            this.roomInfoLabel.string = `房间: ${this.currentRoom.roomId}\n人数: ${playerCount}/${maxPlayers}`;
        } else if (this.roomInfoLabel) {
            this.roomInfoLabel.string = '未加入房间';
        }
    }

    /**
     * 同步玩家数据
     */
    private syncPlayerData(users: IAcountItem[]) {
        console.log('========== 收到数据同步 ==========');
        console.log('用户数量:', users.length);
        users.forEach((u, index) => {
            console.log(`  [${index}] ${u.name} (ID:${u.id}): money=${u.money}`);
        });
        
        // 更新玩家列表
        this.playerList = users;
        
        // 立即刷新 UI
        this.refreshCards();
    }

    /**
     * 刷新卡片显示（完全重建，确保数据准确）
     */
    private refreshCards() {
        console.log('========== 开始刷新卡片 ==========');
        
        if (!this.nodePar) {
            console.error('nodePar 为空，无法刷新卡片');
            return;
        }

        // 第一步：清除所有旧卡片
        console.log('清除旧卡片，当前子节点数:', this.nodePar.children.length);
        this.nodePar.removeAllChildren();
        
        // 第二步：为每个用户创建新卡片
        console.log('创建新卡片，用户数量:', this.playerList.length);
        this.playerList.forEach((userData, index) => {
            // 实例化预制体
            let newCard = instantiate(this.cardPrefab);
            
            // 获取组件并初始化
            let cardSC = newCard.getComponent(DuckCard);
            if (cardSC) {
                cardSC.init(userData, this.networkService);
                console.log(`  [${index}] 创建卡片: ${userData.name}, money=${userData.money}`);
            } else {
                console.error(`  [${index}] 无法获取 DuckCard 组件!`);
            }
            
            // 添加到父节点
            this.nodePar.addChild(newCard);
        });
        
        console.log('========== 卡片刷新完成，当前子节点数:', this.nodePar.children.length, '==========');
    }

    /**
     * 开始显示（初始加载）
     */
    private begin() {
        console.log('========== 开始初始化显示 ==========');
        console.log('当前用户:', this.user.name, 'ID:', this.user.id);
        
        // 注意：playerList 应该从服务器同步获取，不应该手动添加
        // 如果 playerList 为空，说明还没有收到服务器数据
        if (this.playerList.length === 0) {
            console.warn('playerList 为空，等待服务器同步数据...');
        } else {
            console.log('playerList 已有', this.playerList.length, '个用户');
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

        // 离开房间
        if (this.currentRoom && this.user && this.wsManager && this.isConnected) {
            this.networkService.leaveRoom(this.currentRoom.roomId, this.user.id).catch(err => {
                console.error('离开房间失败:', err);
            });
        }

        // 组件销毁时断开连接
        if (this.wsManager && this.isConnected) {
            this.wsManager.disconnect();
        }
    }
}

