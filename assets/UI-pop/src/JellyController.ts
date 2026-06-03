import { _decorator, Component, Sprite, Vec2, Vec4, tween, Material } from 'cc';
const { ccclass, property } = _decorator;

/** 单个力的数据 */
interface ForceData {
    pos: Vec2;   // 力作用点 (UV坐标 0~1)
    dir: Vec2;   // 力方向 (需归一化)
}

@ccclass('JellyController')
export class JellyController extends Component {

    @property(Sprite)
    softBody: Sprite = null!;

    private _material: Material | null = null;
    private _index = 0;
    private _maxForces = 8;

    start() {
        if (this.softBody) {
            this._material = this.softBody.getMaterialInstance(0);
        }
    }

    // ==================== 公共方法 ====================

    /**
     * 传入力数组，逐个应用力
     */
    applyForces(
        forces: ForceData[],
        interval: number = 0.6,
        riseTime: number = 0.12,
        fallTime: number = 0.35
    ) {
        if (!this._material) return;

        const mt = this._material;
        const state = { s: 0 };

        this.schedule(() => {
            for (let i = 0; i < this._maxForces; i++) {
                mt.setProperty(`forceStr${i}`, new Vec4(state.s, 0, 0, 0));
            }
        }, 0);

        const applyOne = () => {
            const i = this._index % this._maxForces;
            const f = forces[this._index % forces.length];
            state.s = 0;

            tween(state)
                .to(riseTime, { s: 1 })
                .to(fallTime, { s: 0 })
                .start();

            mt.setProperty(`forcePos${i}`, new Vec4(f.pos.x, f.pos.y, 0, 0));
            mt.setProperty(`forceDir${i}`, new Vec4(f.dir.x, f.dir.y, 0, 0));

            this.scheduleOnce(() => {
                mt.setProperty(`forceStr${i}`, new Vec4(state.s, 0, 0, 0));
            });

            mt.setProperty('forceCount', Math.min(this._maxForces, this._index + 1));

            this._index++;
        };

        applyOne();

        this.schedule(applyOne, interval);
    }

    /**
     * 停止所有力，重置
     */
    resetForces() {
        if (!this._material) return;

        this.unscheduleAllCallbacks();

        for (let i = 0; i < this._maxForces; i++) {
            this._material.setProperty(`forceStr${i}`, new Vec4(0, 0, 0, 0));
        }
        this._material.setProperty('forceCount', 0);
        this._index = 0;
    }

    /**
     * 设置刚度和阻尼参数
     */
    setPhysicsParams(stiffness: number = 12, damping: number = 0.88) {
        if (!this._material) return;
        this._material.setProperty('stiffness', stiffness);
        this._material.setProperty('damping', damping);
    }

    // ==================== 预定义力模式 ====================

    forceTop(): ForceData[] {
        return [{ pos: new Vec2(0.5, 1.0), dir: new Vec2(0, -1).normalize() }];
    }

    forceBottom(): ForceData[] {
        return [{ pos: new Vec2(0.5, 0.0), dir: new Vec2(0, 1).normalize() }];
    }

    forceLeft(): ForceData[] {
        return [{ pos: new Vec2(0.0, 0.5), dir: new Vec2(1, 0).normalize() }];
    }

    forceRight(): ForceData[] {
        return [{ pos: new Vec2(1.0, 0.5), dir: new Vec2(-1, 0).normalize() }];
    }

    forceTopBottom(): ForceData[] {
        return [
            { pos: new Vec2(0.5, 1.0), dir: new Vec2(0, -1).normalize() },
            { pos: new Vec2(0.5, 0.0), dir: new Vec2(0, 1).normalize() },
        ];
    }

    forceLeftRight(): ForceData[] {
        return [
            { pos: new Vec2(0.0, 0.5), dir: new Vec2(1, 0).normalize() },
            { pos: new Vec2(1.0, 0.5), dir: new Vec2(-1, 0).normalize() },
        ];
    }

    forceTopLeft_BottomRight(): ForceData[] {
        return [
            { pos: new Vec2(0.2, 0.8), dir: new Vec2(0.5, -1).normalize() },
            { pos: new Vec2(0.8, 0.2), dir: new Vec2(-0.5, 1).normalize() },
        ];
    }

    forceTopRight_BottomLeft(): ForceData[] {
        return [
            { pos: new Vec2(0.8, 0.8), dir: new Vec2(-0.5, -1).normalize() },
            { pos: new Vec2(0.2, 0.2), dir: new Vec2(0.5, 1).normalize() },
        ];
    }

    force4Directions(): ForceData[] {
        return [
            { pos: new Vec2(0.5, 1.0), dir: new Vec2(0, -1).normalize() },
            { pos: new Vec2(0.5, 0.0), dir: new Vec2(0, 1).normalize() },
            { pos: new Vec2(0.0, 0.5), dir: new Vec2(1, 0).normalize() },
            { pos: new Vec2(1.0, 0.5), dir: new Vec2(-1, 0).normalize() },
        ];
    }

    force6Directions(): ForceData[] {
        return [
            ...this.force4Directions(),
            ...this.forceTopLeft_BottomRight(),
        ];
    }

    force8Directions(): ForceData[] {
        return [
            { pos: new Vec2(0.5, 1.0), dir: new Vec2(0, -1).normalize() },
            { pos: new Vec2(0.5, 0.0), dir: new Vec2(0, 1).normalize() },
            { pos: new Vec2(0.0, 0.5), dir: new Vec2(1, 0).normalize() },
            { pos: new Vec2(1.0, 0.5), dir: new Vec2(-1, 0).normalize() },
            { pos: new Vec2(0.0, 1.0), dir: new Vec2(0.5, -1).normalize() },
            { pos: new Vec2(1.0, 1.0), dir: new Vec2(-0.5, -1).normalize() },
            { pos: new Vec2(0.0, 0.0), dir: new Vec2(0.5, 1).normalize() },
            { pos: new Vec2(1.0, 0.0), dir: new Vec2(-0.5, 1).normalize() },
        ];
    }

    // ==================== 便捷方法 ====================

    applyForceTop(interval: number = 0.6) {
        this.resetForces();
        this.applyForces(this.forceTop(), interval);
    }

    applyForceBottom(interval: number = 0.6) {
        this.resetForces();
        this.applyForces(this.forceBottom(), interval);
    }

    applyForceLeft(interval: number = 0.6) {
        this.resetForces();
        this.applyForces(this.forceLeft(), interval);
    }

    applyForceRight(interval: number = 0.6) {
        this.resetForces();
        this.applyForces(this.forceRight(), interval);
    }

    applyForce4Directions(interval: number = 0.6) {
        this.resetForces();
        this.applyForces(this.force4Directions(), interval);
    }

    applyForce6Directions(interval: number = 0.6) {
        this.resetForces();
        this.applyForces(this.force6Directions(), interval);
    }

    applyForce8Directions(interval: number = 0.6) {
        this.resetForces();
        this.applyForces(this.force8Directions(), interval);
    }

    // ==================== 测试方法：按顺序循环使用力 ====================

    /**
     * 测试方法：按顺序循环使用所有预定义力模式
     * 
     * 顺序：
     * 1. 上方单力
     * 2. 下方单力
     * 3. 左方单力
     * 4. 右方单力
     * 5. 上下双力
     * 6. 左右双力
     * 7. 四方向力
     * 8. 全八方位力
     * 
     * @param modeInterval   每种模式持续的时间（秒），默认 2.0
     * @param forceInterval  每个力之间的间隔（秒），默认 0.5
     * @param loop           是否循环播放，默认 true
     */
    testForceCycle(
        modeInterval: number = 2.0,
        forceInterval: number = 0.5,
        loop: boolean = true
    ) {
        this.resetForces();

        const modes: Array<{ name: string; forces: ForceData[] }> = [
            { name: '上方单力', forces: this.forceTop() },
            { name: '下方单力', forces: this.forceBottom() },
            { name: '左方单力', forces: this.forceLeft() },
            { name: '右方单力', forces: this.forceRight() },
            { name: '上下双力', forces: this.forceTopBottom() },
            { name: '左右双力', forces: this.forceLeftRight() },
            { name: '四方向力', forces: this.force4Directions() },
            { name: '全八方位力', forces: this.force8Directions() },
        ];

        let modeIndex = 0;

        const runMode = () => {
            // 停止当前
            this.unscheduleAllCallbacks();
            for (let i = 0; i < this._maxForces; i++) {
                this._material?.setProperty(`forceStr${i}`, new Vec4(0, 0, 0, 0));
            }
            this._material?.setProperty('forceCount', 0);
            this._index = 0;

            const mode = modes[modeIndex % modes.length];
            console.log(`[Jelly Test] 当前模式 ${modeIndex + 1}/${modes.length}: ${mode.name}`);

            // 应用当前模式
            this.applyForces(mode.forces, forceInterval);

            // 计时切换到下一个模式
            this.scheduleOnce(() => {
                modeIndex++;
                if (loop || modeIndex < modes.length) {
                    runMode();
                } else {
                    console.log('[Jelly Test] 测试完成');
                    this.resetForces();
                }
            }, modeInterval);
        };

        runMode();
    }

    /**
     * 测试方法：随机力模式
     * @param count         总共应用多少个力
     * @param interval      每个力之间的间隔（秒），默认 0.5
     * @param randomRange   力的位置随机范围 (0~1)，默认 0.8 表示力的作用点不会太靠边
     */
    testRandomForces(
        count: number = 20,
        interval: number = 0.5,
        randomRange: number = 0.8
    ) {
        this.resetForces();

        // 预定义方向池
        const dirs = [
            new Vec2(0, -1),     // 上
            new Vec2(0, 1),      // 下
            new Vec2(1, 0),      // 左
            new Vec2(-1, 0),     // 右
            new Vec2(0.5, -1),   // 左上
            new Vec2(-0.5, -1),  // 右上
            new Vec2(0.5, 1),    // 左下
            new Vec2(-0.5, 1),   // 右下
        ];

        const randomForces: ForceData[] = [];

        for (let j = 0; j < count; j++) {
            const margin = (1 - randomRange) / 2;
            randomForces.push({
                pos: new Vec2(
                    margin + Math.random() * randomRange,
                    margin + Math.random() * randomRange
                ),
                dir: dirs[Math.floor(Math.random() * dirs.length)].clone(),
            });
        }

        console.log(`[Jelly Test] 随机力模式：${count} 个力，间隔 ${interval}s`);
        this.applyForces(randomForces, interval);
    }

    /**
     * 测试方法：按顺序循环单力（上→下→左→右→上→...）
     * @param interval 每个力之间的间隔（秒），默认 0.5
     */
    testSingleForceCycle(interval: number = 0.5) {
        this.resetForces();

        const forces = [
            ...this.forceTop(),
            ...this.forceBottom(),
            ...this.forceLeft(),
            ...this.forceRight(),
        ];

        console.log('[Jelly Test] 单力循环：上→下→左→右');
        this.applyForces(forces, interval);
    }

    /**
     * 测试方法：复合力递进（1个力→2个力→4个力→8个力）
     * @param modeInterval 每种模式持续的时间（秒），默认 2.0
     * @param forceInterval 每个力之间的间隔（秒），默认 0.5
     */
    testProgressiveForces(
        modeInterval: number = 2.0,
        forceInterval: number = 0.5
    ) {
        this.resetForces();

        const modes: Array<{ name: string; forces: ForceData[] }> = [
            { name: '1个力', forces: [this.forceTop()[0]] },
            { name: '2个力', forces: this.forceTopBottom() },
            { name: '4个力', forces: this.force4Directions() },
            { name: '8个力', forces: this.force8Directions() },
        ];

        let modeIndex = 0;

        const runMode = () => {
            this.unscheduleAllCallbacks();
            for (let i = 0; i < this._maxForces; i++) {
                this._material?.setProperty(`forceStr${i}`, new Vec4(0, 0, 0, 0));
            }
            this._material?.setProperty('forceCount', 0);
            this._index = 0;

            const mode = modes[modeIndex];
            console.log(`[Jelly Test] 递进模式 ${modeIndex + 1}/${modes.length}: ${mode.name}`);

            this.applyForces(mode.forces, forceInterval);

            this.scheduleOnce(() => {
                modeIndex++;
                if (modeIndex < modes.length) {
                    runMode();
                } else {
                    console.log('[Jelly Test] 递进测试完成');
                    this.resetForces();
                }
            }, modeInterval);
        };

        runMode();
    }
}