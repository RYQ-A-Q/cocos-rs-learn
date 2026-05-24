import { Vec3 } from 'cc';
import { tween } from 'cc';
import { _decorator, Component, Node } from 'cc';
import { eventMgr } from '../Managers/EventMgr';
const { ccclass, property } = _decorator;

@ccclass('LoadingWait')
export class LoadingWait extends Component {
    @property({ type: Node, displayName: "长时间关闭" })
    longTimeRes: Node
    @property({ type: Node, displayName: "老鼠" })
    private mouseNode: Node
    beginWait(longWaitTime: number) {
        if (!this.node?.isValid) {
            eventMgr.category("loadingWait").emit("beginWait")
            return
        }
        this.longTimeRes.active = false
        this.unschedule(this.waitAction)
        this.scheduleOnce(this.waitAction, longWaitTime)
        eventMgr.category("loadingWait").on("closeCurLoadingWait", this.closeEvent, this)
        eventMgr.category("loadingWait").emit("beginWait")
    }
    private waitAction() {
        this.longTimeRes.active = true
    }
    protected onEnable(): void {
        const children = this.mouseNode.children;
        if (!children || children.length === 0) return;

        const jumpHeight = 20; // 上跳的高度
        const jumpDuration = 0.2; // 每个节点上跳和回落的时间
        const delayBetween = 0.1; // 每个节点之间的间隔时间

        const playJump = (index: number) => {
            if (!this.node?.isValid || !children[index]?.isValid) return;

            const node = children[index];
            const startY = node.position.y;

            tween(node)
                .to(jumpDuration, { position: new Vec3(node.position.x, startY + jumpHeight, node.position.z) }, { easing: "quadOut" })
                .to(jumpDuration, { position: new Vec3(node.position.x, startY, node.position.z) }, { easing: "quadIn" })
                .call(() => {
                    if (node?.isValid) {
                        if (index === children.length - 1 && this.node?.isValid) {
                            this.scheduleOnce(() => playJump(0), delayBetween);
                        }
                    }
                })
                .start();
            // 下一个节点延迟执行
            if (index < children.length - 1) {
                this.scheduleOnce(() => playJump(index + 1), delayBetween);
            }
        };
        playJump(0);
    }
    private async closeEvent() {
        eventMgr.category("loadingWait").emit("curLoadingWaitHadclose")
        eventMgr.category("loadingWait").off("closeCurLoadingWait", this.closeEvent, this)
        this.unscheduleAllCallbacks()
        const { poolsMgr } = await import("../Managers/PoolsMgr")
        const { uiMgr } = await import("../Managers/UIMgr")
        if (poolsMgr.has(this.node.name)) {
            poolsMgr.put(this.node.name, this.node)
        } else if (uiMgr.has(this.node.name)) {
            uiMgr.close(this.node.name, false, this.node)
        } else {
            this.node.destroy()
        }
    }
}


