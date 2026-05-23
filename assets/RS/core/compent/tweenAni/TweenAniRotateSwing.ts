import { _decorator, Component, Node, tween } from "cc";
const { ccclass, property } = _decorator;

/**
 * 摇摆动画：通过旋转角度左右摆动，循环播放
 */
@ccclass("TweenAniRotateSwing")
export class TweenAniRotateSwing extends Component {

    @property({ tooltip: "是否循环播放" })
    loop: boolean = true;

    @property({ tooltip: "最大旋转角度（度数）" })
    swingAngle: number = 15;

    @property({ tooltip: "一次从左到右的时长" })
    duration: number = 1.2;

    private _tween = null;

    onEnable() {
        this.playRotateSwing();
    }

    onDisable() {
        this._tween?.stop();
        this._tween = null;
    }

    /** 播放旋转摇摆动画 */
    playRotateSwing() {
        const single = tween(this.node)
            .to(this.duration, { angle: this.swingAngle }, { easing: "sineInOut" })
            .to(this.duration, { angle: -this.swingAngle }, { easing: "sineInOut" })
            .to(this.duration, { angle: 0 }, { easing: "sineInOut" }); // 回到原始角度

        if (this.loop) {
            this._tween = tween(this.node)
                .repeatForever(single)
                .start();
        } else {
            this._tween = single.start();
        }
    }
}
