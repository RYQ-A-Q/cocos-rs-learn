import { PhysicsSystem2D } from 'cc';
import { EPhysics2DDrawFlags } from 'cc';
import { Prefab } from 'cc';
import { _decorator, Component, Node } from 'cc';
import { uiMgr } from '../../RS/core/Managers/UIMgr';
import { EventTouch } from 'cc';
import { instantiate } from 'cc';
import { UITransform } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PopPhysics2D')
export class PopPhysics2D extends Component {
    @property(Prefab)
    private wallTemple: Prefab
    @property(Prefab)
    private wallTemple2: Prefab
    @property(Node)
    private wallPar: Node
    private wallParUIT: UITransform
    private openDraw: boolean = false
    start() {
        this.wallParUIT = this.wallPar.getComponent(UITransform)
        this.wallPar.on(Node.EventType.TOUCH_END, this.generateWall, this)

    }

    update(deltaTime: number) {

    }
    private generateWall(e: EventTouch) {
            let wall = instantiate(this.wallTemple)
            let vec = this.wallParUIT.convertToNodeSpaceAR(e.getUILocation().toVec3())
            vec.x +=  Math.random() * 20-20
            wall.setPosition(vec.clone())
            this.wallPar.addChild(wall)
            let wall2 = instantiate(this.wallTemple2)
            vec.x +=  Math.random() * 20-20
            vec.y +=  Math.random() * 20-20
            wall2.setPosition(vec.clone())
            this.wallPar.addChild(wall2)
            console.log("当前总数："+this.wallPar.children.length)
    }
    private switchPhysicsDraw() {
        this.openDraw = !this.openDraw
        if (!this.openDraw) {
            uiMgr.showToast("关闭物理绘制")
            PhysicsSystem2D.instance.debugDrawFlags = EPhysics2DDrawFlags.None;
        } else {
            uiMgr.showToast("开启物理绘制")
            PhysicsSystem2D.instance.debugDrawFlags = EPhysics2DDrawFlags.Aabb |
                EPhysics2DDrawFlags.Pair |
                EPhysics2DDrawFlags.CenterOfMass |
                EPhysics2DDrawFlags.Joint |
                EPhysics2DDrawFlags.Shape;
        }
    }
}


