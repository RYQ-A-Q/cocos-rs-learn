import { _decorator, Component, Node, tween, Vec3, Enum } from "cc";
const { ccclass, property } = _decorator;

export enum FlipDirection {
    LeftRight = 0,   // 绕 Y 轴
    UpDown = 1,      // 绕 X 轴
    Custom = 2,      // 自定义轴
}

@ccclass("TweenAniFlipToggle")
export class TweenAniFlipToggle extends Component {

    @property({ tooltip: "是否允许点击触发翻转" })
    clickToFlip: boolean = true;

    @property({ type: Enum(FlipDirection), tooltip: "翻转方向" })
    direction: FlipDirection = FlipDirection.LeftRight;

    @property({ tooltip: "自定义旋转轴（Custom 模式下生效）" })
    customAxis: Vec3 = new Vec3(0, 1, 0);

    @property({ tooltip: "翻转角度（默认 180 度）" })
    angle: number = 180;

    @property({ tooltip: "翻转时长（秒）" })
    duration: number = 0.25;

    private _isFlipped: boolean = false;
    private _origRot: Vec3 | null = null;
    private _flipRot: Vec3 | null = null;

    onLoad() {
        this._origRot = this.node.eulerAngles.clone();

        const axis = this._getFlipAxis();
        this._flipRot = new Vec3(
            this._origRot.x + axis.x * this.angle,
            this._origRot.y + axis.y * this.angle,
            this._origRot.z + axis.z * this.angle
        );

        if (this.clickToFlip) {
            this.node.on(Node.EventType.TOUCH_END, this.TweenAniToggle, this);
        }
    }

    onDisable() {
        this.node.off(Node.EventType.TOUCH_END, this.TweenAniToggle, this);
    }

    /**  切换翻转/恢复 */
    TweenAniToggle() {
        if (this._isFlipped) {
            this.TweenAniFlipBack();
        } else {
            this.TweenAniFlip();
        }
    }

    /**  执行翻转 */
    TweenAniFlip() {
        if (!this._flipRot) return;
        this._isFlipped = true;

        tween(this.node)
            .to(this.duration, { eulerAngles: this._flipRot })
            .start();
    }

    /**  恢复到原角度 */
    TweenAniFlipBack() {
        if (!this._origRot) return;
        this._isFlipped = false;

        tween(this.node)
            .to(this.duration, { eulerAngles: this._origRot })
            .start();
    }

    /** 内部：根据设置选择旋转轴 */
    private _getFlipAxis(): Vec3 {
        switch (this.direction) {
            case FlipDirection.LeftRight:
                return new Vec3(0, 1, 0); // Y 轴
            case FlipDirection.UpDown:
                return new Vec3(1, 0, 0); // X 轴
            case FlipDirection.Custom:
                return this.customAxis.clone();
        }
    }
}
