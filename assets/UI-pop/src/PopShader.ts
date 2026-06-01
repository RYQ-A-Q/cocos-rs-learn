import { tween } from 'cc';
import { Sprite } from 'cc';
import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PopShader')
export class PopShader extends Component {
    @property(Sprite)
    private eddy: Sprite
    @property(Sprite)
    private thawDie: Sprite
    @property(Sprite)
    private thawDie2: Sprite
    start() {
        this.play()
    }

    protected onDisable(): void {
        this.unscheduleAllCallbacks()
    }
    private play() {
        this.eddyAction()
        this.thawDieAction()
    }
    private eddyAction() {
        const mt = this.eddy.getMaterialInstance(0)
        if (!mt) { return }
        const vortexData = { strength: 0 }
        const playTween = () => {
            vortexData.strength = 0
            mt.setProperty("vortexStrength", 0)

            tween(vortexData)
                .to(0.5, { strength: 15 }, { easing: "linear" })
                .to(0.5, { strength: 50 }, { easing: "linear" })
                .call(() => {
                    this.scheduleOnce(() => {
                        if (!this.node?.isValid) { return }
                        playTween()
                    }, 1)
                })
                .start()
        }

        playTween()

        this.schedule(() => {
            if (!this.node?.isValid) { return }
            mt.setProperty("vortexStrength", vortexData.strength)
        }, 0)
    }
    private thawDieAction() {
        const mt = this.thawDie.getMaterialInstance(0)
        const mt2 = this.thawDie2.getMaterialInstance(0)
        if (!mt||!mt2) { return }
    
        const dissolveData = { value: 0 }
    
        const playTween = () => {
            dissolveData.value = 0
            mt.setProperty("dissolve", 0)
    
            tween(dissolveData)
                .to(1.5, { value: 1 }, { easing: "linear" })
                .call(() => {
                    this.scheduleOnce(() => {
                        if (!this.node?.isValid) { return }
                        playTween()
                    }, 0.3)
                })
                .start()
        }
    
        playTween()
    
        this.schedule(() => {
            if (!this.node?.isValid) { return }
            mt.setProperty("dissolve", dissolveData.value)
            mt2.setProperty("dissolve", dissolveData.value)
        }, 0)


    }
}


