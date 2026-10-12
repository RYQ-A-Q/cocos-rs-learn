import { Color, Label } from 'cc';
import { _decorator, Component, Node, tween, Tween, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('T')
export class T extends Component {
    @property(Label)
    tarLabel: Label

    num: number = 100

    /** 定时器累计时间 */
    private _timer: number = 0
    /** 是否正在播放动画 */
    private _isAnimating: boolean = false
    /** 保存的 tween 引用 */
    private _hitTween: Tween<Node> | null = null

    /** 命中色 / 恢复色 */
    private readonly HIT_COLOR = new Color(0xFF, 0x13, 0x13, 0xFF)
    private readonly NORMAL_COLOR = new Color(0xFF, 0xFF, 0xFF, 0xFF)

    start() {
        this.updateLabel()
    }

    update(deltaTime: number) {
        this._timer += deltaTime
        if (this._timer >= 1) {
            this._timer = 0
            this.reduceNum()
        }
    }

    playAni() {
        // 正在播放则先停掉，重新开始
        if (this._isAnimating && this._hitTween) {
            this._hitTween.stop()
        }

        this._isAnimating = true

        const node = this.tarLabel.node
        const label = this.tarLabel
        label.color = this.HIT_COLOR.clone()
        // 缩放 tween：放大 -> 缩小回原位
        const scaleTween = tween(node)
            .to(0.05, { scale: new Vec3(1.5, 1.5, 1) }, { easing: 'quadOut' })
            .to(0.08, { scale: new Vec3(1, 1, 1) }, { easing: 'quadIn' })

        // 颜色 tween：变红 -> 恢复白色
        const colorTween = tween(label)
            .to(0.13, { color: this.NORMAL_COLOR.clone() }, { easing: 'linear' })

        // 合并成一条 tween，同步播放
        this._hitTween = tween(node)
            .union() // 占位，实际用 parallel 更直观
            .then(scaleTween)
            .then(colorTween)
            .call(() => {
                this._isAnimating = false
                this._hitTween = null
            })
            .start()
    }

    /** 随机减少 1~3，并更新显示 + 播放动画 */
    private reduceNum() {
        const delta = Math.floor(Math.random() * 3) + 1 // 1~3
        this.num = Math.max(0, this.num - delta)
        this.updateLabel()
        this.playAni()
    }

    private updateLabel() {
        if (this.tarLabel) {
            this.tarLabel.string = this.num.toString()
        }
    }

    onDestroy() {
        if (this._hitTween) {
            this._hitTween.stop()
            this._hitTween = null
        }
    }
}