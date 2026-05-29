import { Tween } from 'cc';
import { Vec3 } from 'cc';
import { tween } from 'cc';
import { Label } from 'cc';
import { _decorator, Component, Node } from 'cc';
import { IAcountItem } from './PopWebsocket';
import { storageMgr } from '../../RS/core/Managers/StorageMgr';
const { ccclass, property } = _decorator;

@ccclass('DuckCard')
export class DuckCard extends Component {
    @property({ type: Label })
    private nameLabel: Label
    @property({ type: Label })
    private clickLabel: Label
    @property({ type: Node })
    private duck: Node
    private clickAni: Tween<Node> = null
    ownerUser: IAcountItem
    start() {
    }

    update(deltaTime: number) {

    }
    init(ownerUser: IAcountItem) {
        this.ownerUser = ownerUser
        this.clickLabel.string = this.ownerUser.money + ""
        this.nameLabel.string = this.ownerUser.name
    }
    private click() {
        if (!this.ownerUser) {
            console.warn("没有绑定用户")
            return
        }
        this.ownerUser.money++
        this.clickLabel.string = this.ownerUser.money + ""
        if (this.clickAni && this.clickAni.running) {
            this.clickAni.stop()
        }
        if (this.clickAni) {
            this.clickAni.start()
        }
        this.clickAni = tween(this.duck)
            .to(0.1, { scale: new Vec3(1.2, 1.2, 1.2) }, { easing: "backInOut" })
            .to(0.1, { scale: new Vec3(1, 1, 1) }, { easing: "backInOut" })
            .start()
        storageMgr.set("rs-learn-user", this.ownerUser)
    }
}


