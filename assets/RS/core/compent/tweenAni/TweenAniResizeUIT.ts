import { _decorator, Component, UITransform, tween, Tween, easing } from 'cc';
import { easeSysEnum } from '../../common/lib';
import { Enum } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('TweenAniResizeUIT')
export class TweenAniResizeUIT extends Component {

    @property({ tooltip: "是否自动在 onLoad 时启动" })
    autoStart: boolean = true;

    @property({ tooltip: "是否循环播放" })
    loop: boolean = false;

    @property({ tooltip: "动画时长" })
    duration: number = 0.4;

    // 宽度方向动画
    @property({ tooltip: "是否启用宽度动画" })
    useWidth: boolean = true;

    @property({ tooltip: "初始宽度" })
    startWidth: number = 0;

    @property({ tooltip: "目标宽度" })
    targetWidth: number = 200;

    // 高度方向动画
    @property({ tooltip: "是否启用高度动画" })
    useHeight: boolean = false;

    @property({ tooltip: "初始高度" })
    startHeight: number = 0;

    @property({ tooltip: "目标高度" })
    targetHeight: number = 200;
    @property({ type: Enum(easeSysEnum), displayName: "缓动效果" })
    easingType: easeSysEnum = easeSysEnum.linear;

    private _tween?: Tween<any>;

    onLoad() {
        if (this.autoStart) {
            this.play();
        }
    }
    protected onDisable(): void {
        this.stop();
    }

    /**
     * 启动动画
     */
    public play() {
        const ui = this.node.getComponent(UITransform);
        if (!ui) return console.warn("需要 UITransform 组件");

        // 设置初始值
        if (this.useWidth) ui.width = this.startWidth;
        if (this.useHeight) ui.height = this.startHeight;

        let tw = tween(ui).to(
            this.duration,
            {
                width: this.useWidth ? this.targetWidth : ui.width,
                height: this.useHeight ? this.targetHeight : ui.height,
            },
            { easing: this.easingType }
        ).call(() => {
            if (this.useWidth) ui.width = this.startWidth;
            if (this.useHeight) ui.height = this.startHeight;
        });

        if (this.loop) {
            tw = tw.repeatForever(
                tween(ui).to(this.duration, {
                    width: this.useWidth ? this.targetWidth : ui.width,
                    height: this.useHeight ? this.targetHeight : ui.height,
                }, { easing: this.easingType })
                    .call(() => {
                        if (this.useWidth) ui.width = this.startWidth;
                        if (this.useHeight) ui.height = this.startHeight;
                    })
            );
        }

        this._tween = tw.start();
    }

    /**
     * 停止动画
     */
    public stop() {
        if (this._tween) {
            this._tween.stop();
            this._tween = undefined;
        }
    }
}
