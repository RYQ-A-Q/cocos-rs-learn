import { _decorator, Component, Node, tween, Vec3 } from "cc";
const { ccclass, property } = _decorator;

/**
 * 摇摆动画：左右随风轻微摆动，循环播放
 */
@ccclass("TweenAniSwing")
export class TweenAniSwing extends Component {

    @property({ tooltip: "是否循环播放" })
    loop: boolean = true;

    @property({ tooltip: "左右摆动幅度" })
    swingX: number = 15;

    @property({ tooltip: "一次左右摆动的时长" })
    duration: number = 1.2;

    private _tween = null;

    onEnable() {
        this.playSwing();
    }

    onDisable() {
        this._tween?.stop();
        this._tween = null;
    }

    /** 播放左右摇摆动画 */
    playSwing() {
        const orig = this.node.position.clone();
        const left = new Vec3(orig.x - this.swingX, orig.y, orig.z);
        const right = new Vec3(orig.x + this.swingX, orig.y, orig.z);

        const single = tween(this.node)
            .to(this.duration, { position: right }, { easing: "sineInOut" })
            .to(this.duration, { position: left }, { easing: "sineInOut" });

        if (this.loop) {
            this._tween = tween(this.node)
                .repeatForever(single)
                .start();
        } else {
            this._tween = single.start();
        }
    }
}
