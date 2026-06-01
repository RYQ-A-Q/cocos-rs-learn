import { director } from 'cc';
import { Texture2D } from 'cc';
import { ImageAsset } from 'cc';
import { _decorator, Component, Node } from 'cc';
import { uiMgr } from '../../RS/core/Managers/UIMgr';
import { UIPanelType } from '../../RS/core/common/Constant';
const { ccclass, property } = _decorator;

@ccclass('PopFuc')
export class PopFuc extends Component {
    start() {
    }

    update(deltaTime: number) {

    }
    private openWebsocket() {
        uiMgr.open('popWebsocket', 'popWebsocket', UIPanelType.normal, (node) => { }, 'UI-pop2')
    }
    private openPhysics2D() {
        uiMgr.open('popPhysics2D', 'popPhysics2D', UIPanelType.normal, (node) => { }, 'UI-pop')
    }
    private openShader() {
        uiMgr.open('popShader', 'popShader', UIPanelType.normal, (node) => { }, 'UI-pop')
    }
    private openEffect() {
        uiMgr.open('popEffect', 'popEffect', UIPanelType.normal, (node) => { }, 'UI-pop3')
    }


}


