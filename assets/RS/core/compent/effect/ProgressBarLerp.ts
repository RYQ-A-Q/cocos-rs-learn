import { _decorator, Component, ProgressBar, Tween, tween, easing } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ProgressBarLerp')
export class ProgressBarLerp extends Component {
    @property({ type: ProgressBar, displayName: '进度条' })
    bar: ProgressBar = null;

    @property({ displayName: '默认时长(秒)' })
    defaultDuration = 0.5;

    /** 当前动画引用，便于打断 */
    private _tween?: Tween<{ v: number }>;
    protected onEnable(): void {
        if (!this.bar) {
            this.bar = this.getComponent(ProgressBar);
            if (!this.bar) {
                console.error('请设置进度条');
            }
        }
    }

    onDisable() {
        this._stopTween();
    }

    /** 立即设置（无动画） */
    setImmediate(value: number) {
        if (!this.bar) return;
        this._stopTween();
        this.bar.progress = this._clamp01(value);
    }

    /**
     * 动画到目标进度
     * @param value 0~1
     * @param duration 动画时长(秒)；不传用默认值
     * @param ease 缓动函数名，默认 'linear'
     */
    to(value: number, duration?: number, ease: keyof typeof easing = 'quartOut') {
        if (!this.bar) return;
        const target = this._clamp01(value);
        const from = this.bar.progress;
        if (Math.abs(target - from) < 1e-6) return;

        this._stopTween();

        // 用一个包装对象承载数值，onUpdate里写回 ProgressBar
        const holder = { v: from };
        this._tween = tween(holder)
            .to(duration ?? this.defaultDuration, { v: target }, {
                easing: ease,
                onUpdate: () => (this.bar.progress = holder.v),
            })
            .call(() => (this._tween = undefined))
            .start();
    }

    private _stopTween() {
        if (this._tween) {
            this._tween.stop();
            this._tween = undefined;
        }
    }

    private _clamp01(x: number) {
        return Math.max(0, Math.min(1, x));
    }
}
