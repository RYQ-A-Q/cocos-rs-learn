import { Tween } from 'cc';
import { Vec3 } from 'cc';
import { tween } from 'cc';
import { Label } from 'cc';
import { _decorator, Component, Node } from 'cc';
import { IAcountItem } from './MessageProtocol';
import { storageMgr } from '../../RS/core/Managers/StorageMgr';
import { NetworkService } from './NetworkService';

const { ccclass, property } = _decorator;

@ccclass('DuckCard')
export class DuckCard extends Component {
    @property({ type: Label })
    private nameLabel: Label;

    @property({ type: Label })
    private clickLabel: Label;

    @property({ type: Node })
    private duck: Node;
    @property({ type: Node })
    private btn: Node;

    private clickAni: Tween<Node> = null;
    private ownerUser: IAcountItem;
    private networkService: NetworkService;
    private isUpdating: boolean = false; // 防止重复请求
    private isInitialized: boolean = false; // 防止重复初始化

    start() {
        // 确保只初始化一次
        if (!this.isInitialized) {
            this.isInitialized = true;
        }
    }

    update(deltaTime: number) {
    }

    /**
     * 初始化卡片
     * @param ownerUser 用户数据
     * @param networkService 网络服务实例
     */
    init(ownerUser: IAcountItem, networkService?: NetworkService) {
        // 防止重复初始化
        if (this.isInitialized && this.ownerUser) {
            console.warn('DuckCard 已经初始化过');
            return;
        }

        // 验证必要属性
        if (!ownerUser) {
            console.error('DuckCard.init: ownerUser 不能为空');
            return;
        }

        if (!this.nameLabel || !this.clickLabel || !this.duck) {
            console.error('DuckCard.init: 必要的 UI 组件未绑定', {
                nameLabel: this.nameLabel,
                clickLabel: this.clickLabel,
                duck: this.duck
            });
            return;
        }

        this.ownerUser = ownerUser;
        this.networkService = networkService;
        this.isInitialized = true;
        let local = storageMgr.getJson("rs-learn-user");
        if (ownerUser.id != local?.id) {
            this.btn.active = false
        }

        this.clickLabel.string = this.ownerUser.money + "";
        this.nameLabel.string = this.ownerUser.name;
    }

    /**
     * 点击事件处理
     */
    private async click() {
        if (!this.ownerUser) {
            console.warn("没有绑定用户");
            return;
        }

        // 防止重复点击
        if (this.isUpdating) {
            return;
        }

        // 本地先更新（乐观更新）
        this.ownerUser.money++;
        this.clickLabel.string = this.ownerUser.money + "";

        // 播放动画
        this.playClickAnimation();

        // 保存到本地存储
        storageMgr.set("rs-learn-user", this.ownerUser);

        // 如果有网络服务，同步到服务器
        if (this.networkService) {
            try {
                this.isUpdating = true;

                // 发送更新请求到服务器
                const serverMoney = await this.networkService.updateClick(
                    this.ownerUser.id,
                    this.ownerUser.money
                );

                // 使用服务器返回的数据（处理可能的冲突）
                if (serverMoney !== this.ownerUser.money) {
                    console.log(`服务器数据不同步，本地: ${this.ownerUser.money}, 服务器: ${serverMoney}`);
                    this.ownerUser.money = serverMoney;
                    this.clickLabel.string = serverMoney + "";
                    storageMgr.set("rs-learn-user", this.ownerUser);
                }
            } catch (error) {
                console.error('同步失败:', error);
                // 同步失败时可以考虑回滚本地数据或重试
            } finally {
                this.isUpdating = false;
            }
        }
    }

    /**
     * 播放点击动画
     */
    private playClickAnimation() {
        if (!this.duck) {
            console.warn('DuckCard.playClickAnimation: duck 节点未绑定');
            return;
        }

        if (this.clickAni && this.clickAni.running) {
            this.clickAni.stop();
        }

        this.clickAni = tween(this.duck)
            .to(0.1, { scale: new Vec3(1.2, 1.2, 1.2) }, { easing: "backInOut" })
            .to(0.1, { scale: new Vec3(1, 1, 1) }, { easing: "backInOut" })
            .start();
    }

    /**
     * 从外部更新数据（用于接收服务器推送）
     */
    updateFromServer(userData: IAcountItem) {
        if (!this.isInitialized) {
            console.warn('DuckCard.updateFromServer: 卡片尚未初始化');
            return;
        }

        if (this.ownerUser && this.ownerUser.id === userData.id) {
            this.ownerUser = userData;
            if (this.clickLabel) {
                this.clickLabel.string = userData.money + "";
            }
            if (this.nameLabel) {
                this.nameLabel.string = userData.name;
            }
        }
    }
}

