import { _decorator, Component, Node } from 'cc';
import { uiMgr } from '../RS/core/Managers/UIMgr';
import { UIPanelType } from '../RS/core/common/Constant';
const { ccclass, property } = _decorator;

@ccclass('OpenPopItem')
export class OpenPopItem extends Component {
    /**点击事件--打开各种弹窗
     * @param popName  窗口名
     */
    private openPopWindows(e: Event, popName: string) {
        switch (popName) {
            case "popDYPlatform":
                uiMgr.open('popDYPlatform', 'popDYPlatform', UIPanelType.normal, (node) => { }, 'UI-pop')
                break;
            default:
                uiMgr.showToast("功能异常")
        }
    }
}


