import { Enum } from 'cc';
import { easing } from 'cc';
import { _decorator, Component, Node, Tween, tween, Vec3 } from 'cc';
import { easeSysEnum } from '../../common/lib';
const { ccclass, property } = _decorator;

@ccclass('ScaleEffect')
export class ScaleEffect extends Component {
    @property({ displayName: "延迟时间(秒)" })
    dealyTime: number = 0;
    @property({ displayName: "动画时间(秒)" })
    appearTime: number = 0.2;

    @property({ displayName: "初始缩放" })
    startScale: number = 0;

    @property({ displayName: "目标缩放" })
    targetScale: number = 1;
    @property({ type: Enum(easeSysEnum), displayName: "缓动效果" })
    ease: easeSysEnum = easeSysEnum.linear;

    private tweenCache: Tween<Node> | null = null;

    onLoad() {
        this.setAni();
    }

    protected onEnable(): void {
        if (this.tweenCache) {
            this.playAni()
        }
    }

    protected onDisable(): void {
        if (this.tweenCache) {
            this.tweenCache.stop();
        }
    }
    playAni() {
        this.setAni(this.ease)
        this.tweenCache.start();

    }
    private setAni(ease: keyof typeof easing = 'sineOut') {
        this.node.setScale(new Vec3(this.startScale, this.startScale, this.startScale));
        this.tweenCache = tween(this.node)
            .delay(this.dealyTime)
            .to(
                this.appearTime,
                { scale: new Vec3(this.targetScale, this.targetScale, this.targetScale) },
                { easing: ease }
            );
    }
}
