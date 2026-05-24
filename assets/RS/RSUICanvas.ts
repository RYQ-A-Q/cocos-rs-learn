import { director } from 'cc';
import { _decorator, Component, Node } from 'cc';
import { Default_Resources, RsSysEvent, Sys_EventCategory, UIPanelType } from './core/common/Constant';
import { eventMgr } from './core/Managers/EventMgr';
import { uiMgr } from './core/Managers/UIMgr';
import { storageMgr } from './core/Managers/StorageMgr';
import { AESStorageSecurity } from './core/common/AESStorageSecurity';
import { bundleMgr } from './core/Managers/BundleMgr';
const { ccclass, property } = _decorator;

@ccclass('RSUICanvas')
export class RSUICanvas extends Component {
    @property({ type: Node, displayName: "normal窗口挂载节点" })
    private normalPopPar: Node
    @property({ type: Node, displayName: "taost窗口挂载节点" })
    private taostPopPar: Node
    protected onLoad(): void {
        director.addPersistRootNode(this.node)
        storageMgr.init("rs", new AESStorageSecurity("AESSTORAGE20260520rs", "AESStorageSecurity123123123rs"));
        bundleMgr.getBundle(Default_Resources)
        uiMgr.init({
            [UIPanelType.normal]: this.normalPopPar,
            [UIPanelType.toast]: this.taostPopPar
        })
        this.register(true)
    }
    start() {

    }

    update(deltaTime: number) {

    }
    protected onDestroy(): void {
        this.register(false)
    }
    register(regis: boolean) {
        const ec = eventMgr.category(Sys_EventCategory)
        if (regis) {
        }


    }

}


