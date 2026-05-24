import { Sprite } from 'cc';
import { Color } from 'cc';
import { UIOpacity } from 'cc';
import { RichText } from 'cc';
import { _decorator, Component, Label, Node, Tween, tween, Vec3 } from 'cc';
import { poolsMgr } from '../Managers/PoolsMgr';
const { ccclass, property } = _decorator;

@ccclass('NormalMessage')
export class NormalMessage extends Component {
    @property(UIOpacity)
    private uiop: UIOpacity
    @property(RichText)
    private text: RichText
    @property(Sprite)
    private bg: Sprite
    private _stayDuration: number = 1;
    private _currentTween: Tween<Node> = null;
    /**
     * 显示消息
     * @param message 显示内容
     * @param duration 停留时间（秒），默认0.6
     */
    public show(message: string, duration: number = 0.6, type: "success" | "normal" | "warn" | "error" = "normal") {
        this.stopAni();
        switch (type) {
            case "normal":
                this.bg.color = new Color("000000E6")
                this.text.fontColor = new Color("FFFFFF")
                break;
            case "success":
                this.bg.color = new Color("FFF2ADE6")
                this.text.fontColor = new Color("FF7A00")
                break;
            case "warn":
                this.bg.color = new Color("FFF2ADE6")
                this.text.fontColor = new Color("FF3300")
                break;
            case "error":
                this.bg.color = new Color("FFBDBDE6")
                this.text.fontColor = new Color("FF170E")
                break;
        }
        this._stayDuration = duration;
        this.text.string = `<b>${message}</b>`;
        this.playShowAnim();
    }

    private playShowAnim() {
        if (this._currentTween) {
            this._currentTween.stop();
            this._currentTween = null;
        }
        this.uiop.opacity = 255
        this.node.active = true;
        this.node.scale = new Vec3(0, 0, 1); // 初始缩放为0
        this.node.setPosition(0, 0, 0); // 确保初始位置为原点

        this._currentTween = tween(this.node)
            .to(0.2, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' }) // 弹出效果
            .delay(this._stayDuration) // 停留
            .parallel(
                tween().to(0.3, { position: new Vec3(0, 100, 0) }, { easing: 'quadOut' }), // 同时上移
                tween(this.uiop).to(0.3, { opacity: 0 }, { easing: 'linear' })
            )
            .call(() => {
                this.unscheduleAllCallbacks();
                this._currentTween = null;
                this.node.active = false;
                this.node.setPosition(0, 0, 0); // 重置位置以便下次动画
                poolsMgr.put("normalToast", this.node);
            })
            .start();

    }
    /** 中断动画 */
    private stopAni() {
        if (this._currentTween) {
            this._currentTween.stop();
            this._currentTween = null;
        }
    }
}
