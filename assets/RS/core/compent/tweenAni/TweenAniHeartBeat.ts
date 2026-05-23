import { _decorator, Component, Node, tween, Vec3 } from "cc";
const { ccclass, property } = _decorator;

/**
 * 心跳动画：快速缩放脉冲
 * 激活即可播放，可选择是否循环播放
 */
@ccclass("TweenAniHeartBeat")
export class TweenAniHeartBeat extends Component {

    @property({ tooltip: "是否持续循环播放" })
    loop: boolean = true;

    @property({ tooltip: "缩放脉冲幅度，例如 1.1 = 放大10%" })
    scaleFactor: number = 1.15;

    @property({ tooltip: "单次心跳耗时（秒）" })
    duration: number = 0.35;

    @property({ tooltip: "心跳间隔（秒）" })
    interval: number = 0.2;

    private _tween = null;

    onEnable() {
        this.playHeartBeat();
    }

    onDisable() {
        if (this._tween) {
            this._tween.stop();
            this._tween = null;
        }
    }

    /** 播放心跳动画 */
    playHeartBeat() {
        const target = this.node;
        const orig = target.scale.clone();
        const big = new Vec3(orig.x * this.scaleFactor, orig.y * this.scaleFactor, orig.z);
        const small = new Vec3(orig.x * 0.9, orig.y * 0.9, orig.z);

        const singleBeat = tween(target)
            .to(this.duration * 0.25, { scale: small })
            .to(this.duration * 0.5, { scale: big })
            .to(this.duration * 0.25, { scale: orig })
            .delay(this.interval);

        if (this.loop) {
            this._tween = tween(target)
                .repeatForever(singleBeat)
                .start();
        } else {
            this._tween = singleBeat.start();
        }
    }
}
