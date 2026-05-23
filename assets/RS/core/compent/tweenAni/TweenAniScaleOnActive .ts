import { _decorator, Component, Node, tween, Vec3 } from "cc";
import { easeSysEnum } from "../../common/lib";
import { Enum } from "cc";
const { ccclass, property } = _decorator;

@ccclass("TweenAniScaleOnActive ")
export class TweenAniScaleOnActive  extends Component {

    @property({ displayName: "激活时播放" })
    playOnEnable: boolean = true;

    @property({ displayName: "动画时间（秒）" })
    duration: number = 0.2;

    @property({ displayName: "是否从小变大（否则从大变小）" })
    fromSmallToBig: boolean = true;

    @property({ displayName: "起始缩放" })
    startScale: Vec3 = new Vec3(0, 0, 0);

    @property({ displayName: "结束缩放" })
    endScale: Vec3 = new Vec3(1, 1, 1);

    @property({ type: Enum(easeSysEnum), displayName: "缓动效果" })
    easingType: easeSysEnum = easeSysEnum.linear;
    private _tween: any = null;

    onEnable() {
        if (this.playOnEnable) {
            this.play();
        }
    }

    onDisable() {
        if (this._tween) {
            this._tween.stop();
            this._tween = null;
        }
    }

    /** 播放动画 */
    play() {
        if (this._tween) {
            this._tween.stop();
        }

        // 决定方向
        const from = this.fromSmallToBig ? this.startScale : this.endScale;
        const to = this.fromSmallToBig ? this.endScale : this.startScale;

        this.node.setScale(from);

        this._tween = tween(this.node)
            .to(this.duration, { scale: to }, {
                easing: this.easingType
            })
            .start();
    }
}