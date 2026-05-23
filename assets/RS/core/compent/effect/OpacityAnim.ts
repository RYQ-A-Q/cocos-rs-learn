import { Enum } from 'cc';
import { easing, UIOpacity, Tween, tween, _decorator, Component, Node } from 'cc';
import { easeSysEnum } from '../../common/lib';
const { ccclass, property } = _decorator;

@ccclass('OpacityEffect')
export class OpacityEffect extends Component {
    @property({ displayName: "延迟时间(秒)" })
    dealyTime: number = 0;
    @property({ displayName: "动画时间(秒)" })
    appearTime: number = 0.5;

    @property({ displayName: "初始透明度 (0-255)" })
    startOpacity: number = 0;

    @property({ displayName: "目标透明度 (0-255)" })
    targetOpacity: number = 255;

    @property({ type: Enum(easeSysEnum), displayName: "缓动效果" })
    ease: easeSysEnum = easeSysEnum.sineInOut;

    private tweenCache: Tween<UIOpacity> | null = null;
    private uiOpacity: UIOpacity | null = null;

    onLoad() {
        this.uiOpacity = this.node.getComponent(UIOpacity) || this.node.addComponent(UIOpacity);
        this.setAni();
    }

    protected onEnable(): void {
        if (this.tweenCache) {
            this.playAni();
        }
    }

    protected onDisable(): void {
        if (this.tweenCache) {
            this.tweenCache.stop();
        }
    }

    playAni() {
        if (!this.uiOpacity) return;
        this.uiOpacity.opacity = this.startOpacity;
        this.setAni(this.ease);
        this.tweenCache?.start();
    }

    private setAni(ease: keyof typeof easing = 'sineOut') {
        if (!this.uiOpacity) return;
        this.tweenCache = tween(this.uiOpacity)
            .delay(this.dealyTime)
            .to(
                this.appearTime,
                { opacity: this.targetOpacity },
                { easing: ease }
            );
    }
}
