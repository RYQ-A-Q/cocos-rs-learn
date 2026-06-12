import {
    _decorator,
    Component,
    Sprite,
    Vec2,
    Vec4
} from 'cc';

const { ccclass, property } = _decorator;

@ccclass('JellyController')
export class JellyController extends Component {

    @property(Sprite)
    sprite: Sprite = null!;

    private velocity = new Vec2();

    private displacement = new Vec2();

    private spring = 35;

    private damping = 0.85;

    private material: any = null;

    start() {

        this.material =this.sprite.getMaterialInstance(0);
        this.testHitCycle()
    }

    update(dt: number) {

        if (!this.material) {
            return;
        }

        //
        // 弹簧回复
        //

        this.velocity.x +=
            -this.displacement.x *
            this.spring *
            dt;

        this.velocity.y +=
            -this.displacement.y *
            this.spring *
            dt;

        //
        // 阻尼
        //

        this.velocity.multiplyScalar(this.damping);

        //
        // 积分
        //

        this.displacement.x +=
            this.velocity.x * dt;

        this.displacement.y +=
            this.velocity.y * dt;

        //
        // 写入Shader
        //

        this.material.setProperty(
            "jellyOffset",
            new Vec4(
                this.displacement.x,
                this.displacement.y,
                0,
                0
            )
        );

        this.material.setProperty(
            "jellyStrength",
            this.displacement.length()
        );
    }
    public testHitCycle(
        interval: number = 0.5,
        power: number = 40
    ) {
    
        let index = 0;
    
        const actions = [
            () => this.hitTop(power),
            () => this.hitBottom(power),
            () => this.hitLeft(power),
            () => this.hitRight(power),
        ];
    
        const run = () => {
    
            actions[index]();
    
            index++;
    
            if (index >= actions.length) {
                index = 0;
            }
        };
    
        run();
    
        this.schedule(run, interval);
    }
    /**
     * 从某个方向撞击
     */
    hit(dir: Vec2, power = 40) {

        dir = dir.clone().normalize();

        this.velocity.x += dir.x * power;

        this.velocity.y += dir.y * power;
    }

    hitTop(power = 40) {
        this.hit(new Vec2(0,-1), power);
    }

    hitBottom(power = 40) {
        this.hit(new Vec2(0,1), power);
    }

    hitLeft(power = 40) {
        this.hit(new Vec2(1,0), power);
    }

    hitRight(power = 40) {
        this.hit(new Vec2(-1,0), power);
    }
}