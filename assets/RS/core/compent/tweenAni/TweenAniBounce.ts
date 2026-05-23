import { _decorator, Component, Node, tween, Vec3 } from "cc";
const { ccclass, property } = _decorator;

/**
 * 弹簧弹跳动画：向上+向下弹，带回弹
 */
@ccclass("TweenAniBounce")
export class TweenAniBounce extends Component {

    @property({ tooltip: "是否循环播放" })
    loop: boolean = true;

    @property({ tooltip: "跳跃高度（正数为上方向）" })
    height: number = 25;

    @property({ tooltip: "一次完整弹跳的时长（秒）" })
    duration: number = 0.6;

    private _tween = null;

    onEnable() {
        this.playBounce();
    }

    onDisable() {
        this._tween?.stop();
        this._tween = null;
    }

    /** 播放弹跳动画 */
    playBounce() {
        const orig = this.node.position.clone();
        const up = new Vec3(orig.x, orig.y + this.height, orig.z);
        const down = orig;

        const single = tween(this.node)
            .to(this.duration * 0.4, { position: up }, { easing: "sineOut" })
            .to(this.duration * 0.6, { position: down }, { easing: "bounceOut" });

        if (this.loop) {
            this._tween = tween(this.node)
                .repeatForever(single)
                .start();
        } else {
            this._tween = single.start();
        }
    }
}
