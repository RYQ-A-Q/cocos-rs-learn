import { tween } from 'cc';
import { Vec3 } from 'cc';
import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('LogoPanel')
export class LogoPanel extends Component {
    @property(Node)
    logo: Node = null;
    @property([Node])//左右中
    swordLs: Node[] = []
    private swordLsPos: Vec3[] = [
        new Vec3(-60, 0, 0),
        new Vec3(60, 0, 0),
        new Vec3(0, 0, 0),
    ]
    start() {

    }

    update(deltaTime: number) {

    }
    private startAni() {

    }


}


