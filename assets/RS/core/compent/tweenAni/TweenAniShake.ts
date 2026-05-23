import { _decorator, Component, Tween, tween, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('TweenAniShake')
export class TweenAniShake extends Component {

    @property({ tooltip: "是否持续播放" })
    loop: boolean = true;

    @property({ tooltip: "抖动强度" })
    strength: number = 5;

    @property({ tooltip: "每次抖动持续时间" })
    duration: number = 0.05;

    private _tween?: Tween<any>;

    onEnable() {
        this.playShake();
    }

    onDisable() {
        this.stop();
    }

    /** 播放抖动动画 */
    playShake() {
        this.stop();

        const originPos = this.node.position.clone();

        const shakeSeq = tween(this.node)
            .to(this.duration, { position: new Vec3(originPos.x + this.strength, originPos.y, originPos.z) })
            .to(this.duration, { position: new Vec3(originPos.x - this.strength, originPos.y, originPos.z) })
            .to(this.duration, { position: new Vec3(originPos.x, originPos.y + this.strength, originPos.z) })
            .to(this.duration, { position: new Vec3(originPos.x, originPos.y - this.strength, originPos.z) })
            .to(this.duration, { position: originPos });

        if (this.loop) {
            this._tween = tween(this.node)
                .repeatForever(shakeSeq)
                .start();
        } else {
            this._tween = shakeSeq.start();
        }
    }

    /** 停止 */
    stop() {
        if (this._tween) {
            this._tween.stop();
            this._tween = undefined;
        }
    }
}
