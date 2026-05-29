import { _decorator, Component, Node } from 'cc';
import { storageMgr } from '../../RS/core/Managers/StorageMgr';
import { NumberUtils } from '../../RS/core/utils/NumberUtils';
import { RandomNameUtils } from '../../RS/core/utils/RandomNameUtils';
import { Label } from 'cc';
import { Tween } from 'cc';
import { Prefab } from 'cc';
import { instantiate } from 'cc';
import { DuckCard } from './DuckCard';
const { ccclass, property } = _decorator;

export interface IAcountItem {
    id: string
    name: string
    money: number
}
@ccclass('PopWebsocket')
export class PopWebsocket extends Component {
    private user: IAcountItem
    @property({ type: Node })
    private nodePar: Node
    @property({ type: Prefab })
    private cardPrefab: Prefab
    public playerList: IAcountItem[] = []
    start() {
        let local = storageMgr.getJson("rs-learn-user") as IAcountItem
        if (local&&Object.keys(local).length>0) {
            this.user = local
        } else {
            this.user={
                    id: NumberUtils.generateSerialCode(),
                    name:  RandomNameUtils.generate(),
                    money: 0
            }
            storageMgr.set("rs-learn-user", this.user)
        }
        this.playerList.push(this.user)
        this.begin()
    }

    private begin() {
        this.playerList.forEach(element => {
            let newCard = instantiate(this.cardPrefab)
            let cardSC = newCard.getComponent(DuckCard)
            cardSC.init(element)
            this.nodePar.addChild(newCard)
        });

    }

}


