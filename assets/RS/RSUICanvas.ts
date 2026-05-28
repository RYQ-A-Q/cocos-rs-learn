import { director } from 'cc';
import { _decorator, Component, Node } from 'cc';
import { Default_Resources, RsSysEvent, Sys_EventCategory, UIPanelType } from './core/common/Constant';
import { eventMgr } from './core/Managers/EventMgr';
import { uiMgr } from './core/Managers/UIMgr';
import { storageMgr } from './core/Managers/StorageMgr';
import { AESStorageSecurity } from './core/common/AESStorageSecurity';
import { bundleMgr } from './core/Managers/BundleMgr';
import { adMgr } from './core/Managers/AdMgr';
import { poolsMgr } from './core/Managers/PoolsMgr';
import { Prefab } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('RSUICanvas')
export class RSUICanvas extends Component {
    @property({ type: Node, displayName: "normal窗口挂载节点" })
    private normalPopPar: Node
    @property({ type: Node, displayName: "taost窗口挂载节点" })
    private taostPopPar: Node
    @property({type:Prefab})
    private toasrTem: Prefab;
    protected onLoad(): void {//NOTICE 进行一些配置设置
        (window as any).nativeCallback = (msg: string) => {
            console.log('【Native 回调】', msg);
        };

        director.addPersistRootNode(this.node)
        storageMgr.init("rs", new AESStorageSecurity("AESSTORAGE20260520rs", "AESStorageSecurity123123123rs"));
        bundleMgr.getBundle(Default_Resources)
        adMgr.init()
        uiMgr.init({
            [UIPanelType.normal]: this.normalPopPar,
            [UIPanelType.toast]: this.taostPopPar
        })
        poolsMgr.preload("normalToast",this.toasrTem)
        this.register(true);

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


