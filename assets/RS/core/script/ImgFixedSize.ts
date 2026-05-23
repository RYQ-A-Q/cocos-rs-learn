import { UITransform } from 'cc';
import { CCInteger } from 'cc';
import { _decorator, Component, Node } from 'cc';
const { ccclass, property, menu } = _decorator;


/**
 * 图片适配大小
 */
@ccclass('ImgFixedSize')
export default class ImgFixedSize extends Component {
    @property({ type: UITransform, tooltip: "UI组件" })
    uiT: UITransform;

    @property({ type: CCInteger, tooltip: "固定尺寸" })
    public set fixedSize(value) {
        this._fixedSize = value;
        this.onSizeChanged();
    }

    public get fixedSize() {
        return this._fixedSize;
    }

    @property({ type: CCInteger, tooltip: "固定尺寸" })
    private _fixedSize: number = 1;

    onLoad() {
        this._fixedSize = this.fixedSize;
        this.node.on(Node.EventType.SIZE_CHANGED, this.onSizeChanged, this);
        this.onSizeChanged();
    }

    /**当尺寸变化时，重置node节点大小 */
    onSizeChanged() {
        var width = this.uiT.width;
        var height = this.uiT.height;
        var max = Math.max(width, height);
        this.node.setScale(this.fixedSize / max, this.fixedSize / max)
    }
}
