import { _decorator, Component, Node, tween, Vec3 } from "cc";
const { ccclass, property } = _decorator;

/**
 * 漂浮动画：慢速上下移动，循环播放
 */
@ccclass("TweenAniFloat")
export class TweenAniFloat extends Component {

    @property({ tooltip: "是否循环播放" })
    loop: boolean = true;

    @property({ tooltip: "漂浮上下位移距离" })
    floatY: number = 15;

    @property({ tooltip: "一次上升或下降的时长" })
    duration: number = 1.2;

    private _tween = null;

    onEnable() {
        this.playFloat();
    }

    onDisable() {
        this._tween?.stop();
        this._tween = null;
    }

    /** 播放漂浮动画 */
    playFloat() {
        const orig = this.node.position.clone();
        const up = new Vec3(orig.x, orig.y + this.floatY, orig.z);
        const down = new Vec3(orig.x, orig.y - this.floatY, orig.z);

        const single = tween(this.node)
            .to(this.duration, { position: up }, { easing: "sineInOut" })
            .to(this.duration, { position: down }, { easing: "sineInOut" });

        if (this.loop) {
            this._tween = tween(this.node)
                .repeatForever(single)
                .start();
        } else {
            this._tween = single.start();
        }
    }
}
