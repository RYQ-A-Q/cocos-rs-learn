import { _decorator, Component, Node, tween, Vec3, UITransform } from "cc";
const { ccclass, property } = _decorator;

@ccclass("TweenAniFlyToTarget")
export class TweenAniFlyToTarget extends Component {

    @property({ type: Node, displayName: "目标节点" })
    targetNode: Node | null = null;

    @property({ displayName: "动画时长" })
    duration: number = 0.8;

    @property({ displayName: "抛物线高度" })
    arcHeight: number = 200;

    @property({ displayName: "目标缩放" })
    targetScale: number = 0.2;

    @property({ displayName: "随机范围X" })
    randomOffsetRange: number = 200;

    @property({ displayName: "结束隐藏" })
    disableOnComplete: boolean = true;

    onEnable() {
        this.play();
    }

    play() {
        if (!this.targetNode) return;

        const start = this.node.position.clone();
        const worldTarget = this.targetNode.getWorldPosition();
        const end = new Vec3();
        this.node.parent!.getComponent(UITransform)?.convertToNodeSpaceAR(worldTarget, end);

        const offset = Math.random() * this.randomOffsetRange - this.randomOffsetRange / 2;

        const control = new Vec3(
            (start.x + end.x) / 2 + offset,
            Math.max(start.y, end.y) + this.arcHeight,
            0
        );

        let tObj = { t: 0 };

        tween(tObj)
            .to(this.duration, { t: 1 }, {
                easing: "quadOut",
                onUpdate: () => {
                    const t = tObj.t;
                    const x = (1 - t) * (1 - t) * start.x + 2 * (1 - t) * t * control.x + t * t * end.x;
                    const y = (1 - t) * (1 - t) * start.y + 2 * (1 - t) * t * control.y + t * t * end.y;
                    this.node.setPosition(x, y);

                    const scaleV = 1 + (this.targetScale - 1) * t;
                    this.node.setScale(scaleV, scaleV, scaleV);
                }
            })
            .call(() => {
                if (!this.node?.isValid) { return }
                if (this.disableOnComplete) this.node.active = false;
            })
            .start();
    }
}
