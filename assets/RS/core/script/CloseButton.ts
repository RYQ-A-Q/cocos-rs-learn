import { Event } from 'cc';
import { _decorator, Component, Node } from 'cc';
import { uiMgr } from '../Managers/UIMgr';
import { poolsMgr } from '../Managers/PoolsMgr';
const { ccclass, property } = _decorator;

@ccclass('CloseButton')
export class CloseButton extends Component {
    @property({ displayName: "打印信息" })
    private isPrint: boolean = false
    @property({ type: Node, displayName: "关闭目标", tooltip: "不设置时关闭自身" })
    private target: Node
    protected onEnable(): void {
        this.node.on(Node.EventType.TOUCH_END, this.closeEvent, this)
    }
    protected onDisable(): void {
        this.node.off(Node.EventType.TOUCH_END, this.closeEvent, this)
    }
    closeEvent(event: Event) {
        if (event) {
            event.propagationStopped = true
        }
        if (!this.target) {
            this.target = this.node
        }
        this.target.active = false
        if (poolsMgr.has(this.target.name)) {
            poolsMgr.put(this.target.name, this.target)
            return
        }
        if (uiMgr.has(this.target.name)) {
            if (this.isPrint) {
                uiMgr.showToast("ui关闭" + this.target.name)
            }
            uiMgr.close(this.target.name, false, this.target)
        } else {
            if (this.isPrint) {
                uiMgr.showToast("销毁" + this.target.name)
            }
            this.target.destroy()
        }
    }
}


