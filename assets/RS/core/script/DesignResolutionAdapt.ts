import { Enum } from 'cc';
import { _decorator, Component, view, screen, UITransform } from 'cc';
const { ccclass, property, executionOrder } = _decorator;

enum ScaleMode {
    FIT = 0,   // 取小，完整显示
    FILL = 1,  // 取大，铺满屏幕
}
/**
 * 设计分辨率等比缩放适配（默认 720×1280），仅根据屏幕可见区域计算 scale。
 * 不依赖 Widget、不计算子节点，只对当前节点做等比缩放（FIT / FILL）。
 * 仅用于整体结构固定的 UI 面板，搭配widge的单向固定（如靠左，置顶，置底）食用更佳
 */

@ccclass('DesignResolutionAdapt')
@executionOrder(-10)
export class DesignResolutionAdapt extends Component {

    @property({ displayName: "设计宽度" })
    canvasWidth: number = 720;

    @property({ displayName: "设计高度" })
    canvasHeight: number = 1280;

    @property({ type: Enum(ScaleMode), displayName: "缩放模式" })
    scaleMode: ScaleMode = ScaleMode.FIT;

    @property({ displayName: "是否打印调试信息" })
    debug: boolean = false;

    onLoad() {
        this.adapt();
        screen.on('window-resize', this.adapt, this);
    }

    onDestroy() {
        screen.off('window-resize', this.adapt, this);
    }

    private adapt() {
        const visible = view.getVisibleSize();
        const scaleX = visible.width / this.canvasWidth;
        const scaleY = visible.height / this.canvasHeight;

        let scale = 1;
        if (this.scaleMode === ScaleMode.FIT) {
            scale = Math.min(scaleX, scaleY);
        } else {
            scale = Math.max(scaleX, scaleY);
        }

        this.node.setScale(scale, scale);

        if (this.debug) {
            console.log(
                `${this.node.name}[DesignResolutionAdapt] ` +
                `visible=${visible.width.toFixed(1)}x${visible.height.toFixed(1)}, ` +
                `scale=${scale.toFixed(3)}`
            );
        }
    }
}
