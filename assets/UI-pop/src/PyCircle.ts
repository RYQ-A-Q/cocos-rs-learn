import { _decorator, Component, Collider2D, Contact2DType, IPhysics2DContact, Vec2, Vec3, UITransform } from 'cc';
import { JellyController } from './JellyController';
const { ccclass, property } = _decorator;

@ccclass('PyCircle')
export class PyCircle extends Component {

    @property(Collider2D)
    coll: Collider2D = null!;

    @property(JellyController)
    jc: JellyController = null!;

    @property({ tooltip: '碰撞冷却时间（秒）' })
    cooldown: number = 0.1;

    private _lastContactTime: number = 0;

    start() {
        if (this.coll) {
            this.coll.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
        }
    }

    protected onDestroy(): void {
        if (this.coll) {
            this.coll.off(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
        }
    }

    private onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null) {
        if (!this.jc || !contact) return;

    }

    private worldToUV(worldPos: Vec2) {
        
    }
}