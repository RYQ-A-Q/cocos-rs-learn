import { Animation } from 'cc';
import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('DuckFeetEffect')
export class DuckFeetEffect extends Component {
    @property({ type: Animation })
    private selfAni: Animation
    protected onEnable(): void {
        this.selfAni.play()
    }
    private close() {
        this.node.active = false
    }
}


