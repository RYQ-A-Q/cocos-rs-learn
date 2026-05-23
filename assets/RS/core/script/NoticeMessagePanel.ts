import { Vec3 } from 'cc';
import { RichText } from 'cc';
import { Label } from 'cc';
import { _decorator, Component, Node } from 'cc';
import { MainMoney } from '../common/SelfLib';
const { ccclass, property } = _decorator;

@ccclass('NoticeMessagePanel')
export class NoticeMessagePanel extends Component {
    @property(Label)
    title: Label
    @property(Label)
    content: Label
    @property(RichText)
    contentRichText: RichText
    @property(Node)
    yesBtn: Node
    private callback: (isConfirmed: boolean) => void = null;
    /**已经回调标识 */
    hadCallback: boolean = false;
    private currentTween: any = null;
    /**
     * 初始化面板
     * @param title 标题文本
     * @param content 通知内容文本
     * @param callback 回调函数，参数为是否确认状态
     */
    init(title: string, content: string, callback: (isConfirmed: boolean) => void) {
        this.register(title, callback)
        this.content.string = content;
        this.content.node.active = true
        this.contentRichText.node.active = false
    }
   
    private register(title: string, callback: (isConfirmed: boolean) => void) {
        this.title.string = title;
        this.callback = callback;
        this.hadCallback = false
        this.yesBtn.off(Node.EventType.TOUCH_END, this.onYesClicked, this);
        this.yesBtn.on(Node.EventType.TOUCH_END, this.onYesClicked, this);
    }

    private onYesClicked() {
        if (this.callback) {
            this.callback(true);
            this.hadCallback = true
        }
        this.closePanel();
    }


    private closePanel() {
        this.node.active = false
        this.node.removeFromParent()
        if (this.currentTween) {
            this.currentTween.stop()
            this.currentTween = null
        }
    }
    protected onDisable(): void {
        if (!this.hadCallback) {
            this.callback(true)
        }
    }
}


