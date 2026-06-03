import { tween } from 'cc';
import { Vec2 } from 'cc';
import { Vec4 } from 'cc';
import { UITransform } from 'cc';
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
    @property(Sprite)
    private iceSnow: Sprite
    @property(Sprite)
    private topSprite: Sprite
    start() {
        this.play()
    }

    protected onDisable(): void {
        this.unscheduleAllCallbacks()
    }
    private play() {
        this.eddyAction()
        this.thawDieAction()
        this.iceSnowAction()
        this.windTransitionAction()
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
        if (!mt || !mt2) { return }

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
    private iceSnowAction() {

        const mt = this.iceSnow.getMaterialInstance(0);
        if (!mt) { return; }

        const data = {
            progress: 0,
            time: 0
        };

        const playTween = () => {

            data.progress = 0;

            mt.setProperty("meltProgress", 0);

            tween(data)
                .delay(0.5)
                .to(2, { progress: 1 }, { easing: "linear" })
                .delay(0.5)
                .call(() => {
                    this.scheduleOnce(() => {
                        if (!this.node?.isValid) { return; }
                        playTween();
                    }, 0.5);
                })
                .start();
        };

        playTween();

        this.schedule((dt) => {

            if (!this.node?.isValid) { return; }

            data.time += dt;

            mt.setProperty("meltProgress", data.progress);
            mt.setProperty("effectTime", data.time);

        }, 0);
    }
    
    private windTransitionAction() {

        const mt = this.topSprite.getMaterialInstance(0);
        if (!mt) { return; }

        const data = {
            progress: 0,
            time: 0
        };

        const playTween = () => {

            data.progress = 0;

            tween(data)
                .to(2, { progress: 1 }, { easing: "linear" })
                .delay(0.5)
                .call(() => {
                    this.scheduleOnce(() => {
                        if (!this.node?.isValid) { return; }
                        playTween();
                    }, 1);
                })
                .start();
        };

        playTween();

        this.schedule((dt) => {

            if (!this.node?.isValid) { return; }

            data.time += dt;

            mt.setProperty("transitionProgress", data.progress);
            mt.setProperty("effectTime", data.time);

        }, 0);
    }
}


