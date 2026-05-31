import { Contact2DType } from 'cc';
import { Collider2D } from 'cc';
import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PyCircle')
export class PyCircle extends Component {
    @property(Collider2D)
    coll: Collider2D
    start() {
        this.coll.on(Contact2DType.BEGIN_CONTACT, this.begin, this)
        this.coll.on(Contact2DType.BEGIN_CONTACT, this.end, this)
    }
    protected onDisable(): void {
        this.coll.off(Contact2DType.BEGIN_CONTACT, this.begin, this)
        this.coll.off(Contact2DType.BEGIN_CONTACT, this.end, this)
    }
    begin(selfCollider: Collider2D, otherCollider: Collider2D) {
    }
    end(selfCollider: Collider2D, otherCollider: Collider2D) {
    }
    update(deltaTime: number) {

    }
}


