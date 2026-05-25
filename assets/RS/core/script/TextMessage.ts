import { RichText } from 'cc';
import { Label } from 'cc';
import { _decorator, Component, Node } from 'cc';
import { ITextImgItem } from '../common/SelfLib';
import { NodeUtils } from '../utils/NodeUtils';
import { Sprite } from 'cc';
import { SpriteFrame } from 'cc';
import { ImageAsset } from 'cc';
import { Texture2D } from 'cc';
import { assetMgr } from '../Managers/AssetMgr';
import { EditBox } from 'cc';
const { ccclass, property } = _decorator;
const win = window as any;
@ccclass('TextMessage')
export class TextMessage extends Component {
    @property({ type: Label, displayName: "名称" })
    private nameLabel: Label
    @property({ type: RichText, displayName: "内容" })
    private contentLabel: RichText
    @property({ type: Node, displayName: "图内容父节点" })
    private textImgPar: Node
    @property({ type: EditBox, displayName: "输入复制" })
    private copyInput: EditBox

    display(name: string, content: string, textImgList?: ITextImgItem[]) {
        this.nameLabel.string = name
        this.contentLabel.string = content
        this.copyInput.string = name + "：" + content
        if (textImgList) {
            for (let i = 0; i < textImgList.length; i++) {
                const item = textImgList[i];
                const img = NodeUtils.getOrCloneInactiveChild(this.textImgPar)
                if (img) {
                    if (item.img.bundle) {
                        assetMgr.load(`${item.img.path}/spriteFrame`, SpriteFrame, item.img.bundle).then(res => {
                            if (res) {
                                if (this?.node?.isValid && img?.children?.[0]?.isValid) {
                                    img.children[0].getComponent(Sprite).spriteFrame = res

                                } else {
                                    res.decRef()
                                }
                            }
                        })
                    } else if (item.img.path.length > 1) {
                        assetMgr.loadRemote(item.img.path, ImageAsset).then(imageAsset => {
                            if (imageAsset && img?.children?.[0]?.isValid) {
                                const spriteFrame = new SpriteFrame();
                                const texture = new Texture2D();
                                texture.image = imageAsset;
                                spriteFrame.texture = texture;
                                img.children[0].getComponent(Sprite).spriteFrame = spriteFrame
                            }
                        })
                    }
                }
                img.children[1].getComponent(Label).string = item.postText
            }

        }
    }

}


