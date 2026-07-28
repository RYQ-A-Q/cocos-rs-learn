import { _decorator, Component, Node } from 'cc';
import { NodeUtils } from '../../RS/core/utils/NodeUtils';
import { Vec3 } from 'cc';
import { tween } from 'cc';
import { UIOpacity } from 'cc';
import { Tween } from 'cc';
import { NumberUtils } from '../../RS/core/utils/NumberUtils';
const { ccclass, property } = _decorator;
const WIDTH = 700
const HEIGHT = 850

@ccclass('PopMotionCurve')
export class PopMotionCurve extends Component {
    @property(Node)
    private nodeContainer: Node
    @property(Node)
    private startNode: Node

    private circleNodes: Node[] = [] // 记录当前转圈的节点
    private nodeAniMap: Map<Node, Tween<Node>> = new Map()

    start() {

    }

    update(deltaTime: number) {

    }

    /**获取一个新的节点 */
    private getNewItem() {
        let tNode = NodeUtils.getOrCloneInactiveChild(this.nodeContainer)
        tNode.parent = this.nodeContainer
        tNode.setPosition(0, 0, 0)
        return tNode
    }

    /**播放抛物线动画 */
    private playParabola() {
        const start = new Vec3(-250, 250, 0);
        const end = new Vec3(200, 0, 0);

        // 使用贝塞尔曲线抛物线
        this.flyParabolaBezier(start, end, 300, 0.8);
    }
    /**播放圆形动画 */
    private playCircle() {
        // // 1. 转1圈
        // this.flyCircle(
        //     new Vec3(0, 0, 0),  // 圆心
        //     200,                 // 半径
        //     1,                   // 1圈
        //     1,                   // 每圈1秒
        //     true,                // 顺时针
        //     0,                   // 从右侧开始
        //     0,                   // 无延迟
        //     () => console.log('完成')
        // );

        // // 2. 转3圈
        // this.flyCircle(
        //     new Vec3(100, 100, 0),
        //     150,
        //     3,    // 3圈
        //     0.5,  // 每圈0.5秒
        //     false // 逆时针
        // );

        // // 3. 无限循环（关键：rotations = -1）
        // this.flyCircle(
        //     new Vec3(0, 0, 0),
        //     200,
        //     -1,   // -1表示无限循环
        //     1,    // 每圈1秒
        //     true, // 顺时针
        //     0     // 从右侧开始
        // );

        // // 4. 从45度开始无限旋转
        // this.flyCircle(
        //     new Vec3(0, 0, 0),
        //     200,
        //     -1,
        //     0.8,
        //     true,
        //     Math.PI / 4 // 从45度开始
        // );

        // 5. 延迟1秒后无限旋转
        this.flyCircle(
            this.getNewItem(),
            new Vec3(0, 0, 0),
            100,
            -1,
            1,
            true,
            0,
        );
    }
    private playCircle2() {
        this.moreCircleAni();
    }
    /**播放导弹动画 */
    private playMissile() {
        // 创建导弹并发射
        const missile = this.getNewItem();
        missile.setPosition(-200, 0, 0);

        // 飞向目标位置 (300, -300)，飞行时间0.5秒，弧线高度450
        this.missileAction(missile, new Vec3(300, -300, 0), 0.5, 450, () => {
            console.log('导弹命中目标！');
        });
    }
    private playScattering() {
        // 创建5颗子弹并发射
        const bullets: Node[] = [];
        for (let i = 0; i < 5; i++) {
            const bullet = this.getNewItem();
            bullet.setPosition(0, -300, 0);
            bullets.push(bullet);
        }

        this.scattering(bullets, NumberUtils.degToRad(90), NumberUtils.degToRad(60));
    }

    /**
     * 多节点转圈动画（均匀分布）
     * 新增节点时会重新计算所有节点的位置，使它们均匀分布
     */
    private moreCircleAni() {
        const item = this.getNewItem();
        item.active = true;

        // 将新节点加入数组
        this.circleNodes.push(item);

        // 停止所有节点的旧动画
        this.circleNodes.forEach(node => {
            if (this.nodeAniMap.has(node)) {
                this.nodeAniMap.get(node)?.stop();
                this.nodeAniMap.delete(node);
            }
        });

        // 获取均匀分布的角度（弧度）
        const angles = this.getAnglesRad(this.circleNodes.length);
        console.log('转刀数量:', angles.length)
        // 为每个节点设置新位置并启动动画
        this.circleNodes.forEach((node, index) => {
            const centerPos = new Vec3(0, 0, 0);
            const radius = 150;
            const startAngle = angles[index];

            // 计算新位置
            const newX = centerPos.x + radius * Math.cos(startAngle);
            const newY = centerPos.y + radius * Math.sin(startAngle);
            const newPos = new Vec3(newX, newY, centerPos.z);

            // 计算目标旋转角度（切线方向）
            const clockwise = true;
            const tangentAngle = startAngle + (clockwise ? -Math.PI / 2 : Math.PI / 2);
            const targetRotation = tangentAngle * 180 / Math.PI;

            // 同时平滑过渡到新位置和方向
            const tweenPos = tween(node).to(0.3, { position: newPos }, { easing: 'quadOut' });
            const tweenRot = tween(node).to(0.3, { angle: targetRotation }, { easing: 'quadOut' });

            tweenPos.parallel(tweenRot)
                .call(() => {
                    this.flyCircle(
                        node,
                        centerPos,
                        radius,
                        -1,
                        1,
                        clockwise,
                        startAngle,
                    );
                })
                .start();
        });
    }

    /**
     * 均分角度（返回弧度）
     * @param count 数量
     * @returns 角度数组（弧度）
     */
    private getAnglesRad(count: number): number[] {
        if (count <= 0) return [];
        if (count === 1) return [0];

        const angles: number[] = [];
        const step = (2 * Math.PI) / count;

        for (let i = 0; i < count; i++) {
            angles.push(i * step);
        }

        return angles;
    }

    /**
     * 计算两点之间的角度（度）
     * @param from 起始点
     * @param to 终点
     * @returns 角度值：向上为0，顺时针负，逆时针正
     */
    private calculateAngle(from: Vec3, to: Vec3): number {
        const dx = to.x - from.x;
        const dy = to.y - from.y;

        // 计算与X轴正方向的夹角（弧度），向右为0度，逆时针为正
        let angle = Math.atan2(dy, dx);
        // 转换为角度
        return angle * 180 / Math.PI;
    }

    /**
     * 将角度归一化到 [-π, π] 范围（弧度）
     * 防止角度无限累加导致精度下降
     */
    private normalizeAngle(angle: number): number {
        angle = angle % (2 * Math.PI);
        if (angle > Math.PI) {
            angle -= 2 * Math.PI;
        } else if (angle < -Math.PI) {
            angle += 2 * Math.PI;
        }
        return angle;
    }

    /**
     * 二次贝塞尔曲线计算
     * @param t 0-1之间的插值
     * @param p0 起点
     * @param p1 控制点（顶点）
     * @param p2 终点
     * @returns 曲线上的点
     */
    private quadraticBezier(t: number, p0: Vec3, p1: Vec3, p2: Vec3): Vec3 {
        const u = 1 - t;
        const x = u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x;
        const y = u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y;
        const z = u * u * p0.z + 2 * u * t * p1.z + t * t * p2.z;
        return new Vec3(x, y, z);
    }

    /**
     * 三次贝塞尔曲线计算
     * @param t 0-1之间的插值
     * @param p0 起点
     * @param p1 控制点1
     * @param p2 控制点2
     * @param p3 终点
     * @returns 曲线上的点
     */
    private cubicBezier(t: number, p0: Vec3, p1: Vec3, p2: Vec3, p3: Vec3): Vec3 {
        const u = 1 - t;
        const x = u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x;
        const y = u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y;
        const z = u * u * u * p0.z + 3 * u * u * t * p1.z + 3 * u * t * t * p2.z + t * t * t * p3.z;
        return new Vec3(x, y, z);
    }

    /**
     * 获取贝塞尔曲线的控制点（优化抛物线形状）
     */
    private getBezierControlPoints(startPos: Vec3, endPos: Vec3, jumpHeight: number): { p0: Vec3, p1: Vec3, p2: Vec3, p3: Vec3 } {
        // 起点
        const p0 = startPos.clone();
        // 终点
        const p3 = endPos.clone();

        // 计算中点和方向
        const midX = (startPos.x + endPos.x) / 2;
        const midY = Math.max(startPos.y, endPos.y) + jumpHeight;

        // 计算水平距离
        const dx = endPos.x - startPos.x;
        const dy = endPos.y - startPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // 控制点1：靠近起点，稍微抬高
        const t1 = 0.3;
        const p1 = new Vec3(
            startPos.x + dx * t1,
            startPos.y + dy * t1 + jumpHeight * 0.4,
            (startPos.z + endPos.z) / 2
        );

        // 控制点2：靠近终点，稍微抬高
        const t2 = 0.7;
        const p2 = new Vec3(
            startPos.x + dx * t2,
            startPos.y + dy * t2 + jumpHeight * 0.4,
            (startPos.z + endPos.z) / 2
        );

        return { p0, p1, p2, p3 };
    }

    /**
     * 使用贝塞尔曲线的抛物线动画（主要方法）
     */
    private flyParabolaBezier(
        startPos: Vec3,
        endPos: Vec3,
        jumpHeight: number = 300,
        duration: number = 0.8,
        delay: number = 0,
        onComplete?: () => void
    ) {
        // 获取节点
        const item = this.getNewItem();
        item.active = true;
        item.setPosition(startPos);
        let uiop = item.getComponent(UIOpacity);
        uiop.opacity = 0;
        tween(uiop)
            .to(0.05, { opacity: 255 })
            .start();
        // 计算角度
        const angle = this.calculateAngle(startPos, endPos);

        // 获取贝塞尔控制点（使用三次贝塞尔曲线）
        const { p0, p1, p2, p3 } = this.getBezierControlPoints(startPos, endPos, jumpHeight);

        // 存储轨迹点用于调试（可选）
        const trajectoryPoints: Vec3[] = [];
        for (let i = 0; i <= 30; i++) {
            const t = i / 30;
            const point = this.cubicBezier(t, p0, p1, p2, p3);
            trajectoryPoints.push(point);
        }

        // 使用Tween驱动贝塞尔曲线
        let progress = 0;

        tween(item)
            .delay(delay)
            .to(duration, { position: endPos }, {
                easing: 'linear',
                onUpdate: (target: Node, ratio: number) => {
                    // 使用三次贝塞尔曲线计算位置
                    const pos = this.cubicBezier(ratio, p0, p1, p2, p3);
                    target.setPosition(pos);

                    // 动态计算旋转角度（根据运动方向）
                    if (ratio < 1) {
                        const nextRatio = Math.min(ratio + 0.01, 1);
                        const nextPos = this.cubicBezier(nextRatio, p0, p1, p2, p3);
                        const dirAngle = this.calculateAngle(pos, nextPos);
                        // 让节点朝向运动方向
                        target.setRotationFromEuler(0, 0, dirAngle - 90);
                    }
                }
            })
            .call(() => {
                // 恢复初始状态
                item.setRotationFromEuler(0, 0, 0);
                item.active = false;
                if (onComplete) onComplete();
            })
            .start();
    }

    /**
     * 散弹枪发射动画（持续加速，无速度上限）
     * @param nodes 要发射的节点数组
     * @param baseAngle 基础发射角度（弧度，0为向右，逆时针为正）
     * @param spreadAngle 扩散角度范围（弧度，总扩散角度）
     * @param initialSpeed 初始速度
     * @param gravity 重力系数
     * @param duration 动画持续时间
     * @param acceleration 加速度（持续加速，无上限）
     */
    private scattering(
        nodes: Node[],
        baseAngle: number = 0,
        spreadAngle: number = NumberUtils.degToRad(30), // 30度扩散
        initialSpeed: number = 800, // 初始速度
        gravity: number = 0,
        duration: number = 1,
        acceleration: number = 2000 // 持续加速度，无速度上限
    ) {
        const count = nodes.length;

        // 计算每个子弹的发射角度
        const angles: number[] = [];
        if (count === 1) {
            angles.push(baseAngle);
        } else {
            const startAngle = baseAngle - spreadAngle / 2;
            const step = spreadAngle / (count - 1);
            for (let i = 0; i < count; i++) {
                // 添加少量随机偏移使效果更自然
                const randomOffset = (Math.random() - 0.5) * 0.1;
                angles.push(startAngle + step * i + randomOffset);
            }
        }

        nodes.forEach((node, index) => {
            node.active = true;
            let uiop = node.getComponent(UIOpacity);
            uiop.opacity = 0;
            tween(uiop)
                .to(0.05, { opacity: 255 })
                .start();
            const startPos = node.position.clone();
            const angle = angles[index];

            // 计算方向向量
            const dirX = Math.cos(angle);
            const dirY = Math.sin(angle);

            // 计算总位移（持续加速 + 重力）
            const totalDx = initialSpeed * dirX * duration + 0.5 * acceleration * dirX * duration * duration;
            const totalDy = initialSpeed * dirY * duration + 0.5 * acceleration * dirY * duration * duration - 0.5 * gravity * duration * duration;

            const endPos = new Vec3(
                startPos.x + totalDx,
                startPos.y + totalDy,
                startPos.z
            );

            let elapsed = 0;

            tween(node)
                .to(duration, { position: endPos }, {
                    easing: 'linear',
                    onUpdate: (target: Node, ratio: number) => {
                        elapsed = ratio * duration;

                        // 计算当前速度（持续加速，无上限）
                        const currentSpeed = initialSpeed + acceleration * elapsed;

                        // 计算当前位置（持续加速 + 重力）
                        const vx = dirX * currentSpeed;
                        const vy = dirY * currentSpeed;
                        const x = startPos.x + initialSpeed * dirX * elapsed + 0.5 * acceleration * dirX * elapsed * elapsed;
                        const y = startPos.y + initialSpeed * dirY * elapsed + 0.5 * acceleration * dirY * elapsed * elapsed - 0.5 * gravity * elapsed * elapsed;

                        target.setPosition(x, y, startPos.z);

                        // 计算旋转角度（朝向运动方向）
                        const vyCurrent = vy - gravity * elapsed;
                        const dirAngle = Math.atan2(vyCurrent, vx) * 180 / Math.PI;
                        target.setRotationFromEuler(0, 0, dirAngle - 90);
                    }
                })
                .call(() => {
                    node.active = false;
                })
                .start();
        });
    }

    /**
     * 导弹飞向目标动画
     * @param node 导弹节点
     * @param targetPos 目标位置
     * @param flightTime 飞行时间（秒）
     * @param arcHeight 弧线高度（正值向上弯曲，负值向下弯曲）
     * @param onComplete 完成回调
     */
    private missileAction(
        node: Node,
        targetPos: Vec3,
        flightTime: number = 1,
        arcHeight: number = 100,
        onComplete?: () => void
    ) {
        node.active = true;
        const startPos = node.position.clone();
        let uiop = node.getComponent(UIOpacity);
        uiop.opacity = 0;
        tween(uiop)
            .to(0.05, { opacity: 255 })
            .start();
        // 计算方向和距离
        const dx = targetPos.x - startPos.x;
        const dy = targetPos.y - startPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // 计算贝塞尔曲线控制点，创建弧线轨迹
        const midX = (startPos.x + targetPos.x) / 2;
        const midY = (startPos.y + targetPos.y) / 2;
        const controlPos = new Vec3(midX, midY + arcHeight, (startPos.z + targetPos.z) / 2);

        // 计算初始角度（朝向目标）
        const startAngle = Math.atan2(dy, dx) * 180 / Math.PI;
        node.setRotationFromEuler(0, 0, startAngle - 90);

        tween(node)
            .to(flightTime, { position: targetPos }, {
                easing: 'quadIn', // 先慢后快，模拟加速
                onUpdate: (target: Node, ratio: number) => {
                    // 使用二次贝塞尔曲线计算当前位置
                    const u = 1 - ratio;
                    const x = u * u * startPos.x + 2 * u * ratio * controlPos.x + ratio * ratio * targetPos.x;
                    const y = u * u * startPos.y + 2 * u * ratio * controlPos.y + ratio * ratio * targetPos.y;
                    const z = u * u * startPos.z + 2 * u * ratio * controlPos.z + ratio * ratio * targetPos.z;

                    target.setPosition(x, y, z);

                    // 计算下一个位置用于旋转
                    const nextRatio = Math.min(ratio + 0.02, 1);
                    const nextU = 1 - nextRatio;
                    const nextX = nextU * nextU * startPos.x + 2 * nextU * nextRatio * controlPos.x + nextRatio * nextRatio * targetPos.x;
                    const nextY = nextU * nextU * startPos.y + 2 * nextU * nextRatio * controlPos.y + nextRatio * nextRatio * targetPos.y;

                    // 计算朝向角度
                    const dirAngle = Math.atan2(nextY - y, nextX - x) * 180 / Math.PI;
                    target.setRotationFromEuler(0, 0, dirAngle - 90);
                }
            })
            .call(() => {
                node.active = false;
                if (onComplete) onComplete();
            })
            .start();
    }

    /**
     * 多点贝塞尔曲线（通过多个控制点）
     */
    private multiPointBezier(t: number, points: Vec3[]): Vec3 {
        if (points.length === 0) return new Vec3(0, 0, 0);
        if (points.length === 1) return points[0].clone();

        const newPoints: Vec3[] = [];
        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[i];
            const p1 = points[i + 1];
            const x = (1 - t) * p0.x + t * p1.x;
            const y = (1 - t) * p0.y + t * p1.y;
            const z = (1 - t) * p0.z + t * p1.z;
            newPoints.push(new Vec3(x, y, z));
        }

        return this.multiPointBezier(t, newPoints);
    }

    /**
     * 自定义贝塞尔曲线路径
     */
    private flyParabolaCustom(
        startPos: Vec3,
        controlPoints: Vec3[],
        endPos: Vec3,
        duration: number = 0.8,
        delay: number = 0,
        onComplete?: () => void
    ) {
        const item = this.getNewItem();
        item.active = true;
        item.setPosition(startPos);

        // 构建完整的控制点数组
        const allPoints = [startPos, ...controlPoints, endPos];

        tween(item)
            .delay(delay)
            .to(duration, { position: endPos }, {
                easing: 'linear',
                onUpdate: (target: Node, ratio: number) => {
                    const pos = this.multiPointBezier(ratio, allPoints);
                    target.setPosition(pos);
                }
            })
            .call(() => {
                item.active = false;
                if (onComplete) onComplete();
            })
            .start();
    }
    /**
    * 圆形运动轨迹动画（支持单次和循环）
    * @param target 目标节点
    * @param centerPos 圆心位置
    * @param radius 半径
    * @param rotations 旋转圈数（-1表示无限循环）
    * @param duration 每圈持续时间（秒）
    * @param clockwise 是否顺时针
    * @param startAngle 起始角度（弧度）
    * @param delay 延迟时间（秒）
    * @param onComplete 完成回调（仅非循环时生效）
    */
    private flyCircle(
        target: Node,
        centerPos: Vec3,
        radius: number,
        rotations: number = 1,
        duration: number = 1,
        clockwise: boolean = true,
        startAngle: number = 0,
        delay: number = 0,
        onComplete?: () => void
    ) {
        const item = target
        item.active = true;
        let uiop = item.getComponent(UIOpacity);
        uiop.opacity = 0;
        tween(uiop)
            .to(0.05, { opacity: 255 })
            .start();
        // 计算起始位置
        const startX = centerPos.x + radius * Math.cos(startAngle);
        const startY = centerPos.y + radius * Math.sin(startAngle);
        item.setPosition(startX, startY, centerPos.z);

        const direction = clockwise ? -1 : 1;
        let currentAngle = startAngle;
        let isLooping = rotations === -1;
        let completedRotations = 0;

        // 单次动画
        const doOnce = () => {
            const totalAngle = rotations * 2 * Math.PI * direction;

            this.nodeAniMap.set(item, tween(item)
                .delay(delay)
                .to(duration * rotations, { position: centerPos }, {
                    easing: 'linear',
                    onUpdate: (target: Node, ratio: number) => {
                        const angle = startAngle + totalAngle * ratio;
                        const x = centerPos.x + radius * Math.cos(angle);
                        const y = centerPos.y + radius * Math.sin(angle);
                        target.setPosition(x, y, centerPos.z);

                        const tangentAngle = angle + (clockwise ? -Math.PI / 2 : Math.PI / 2);
                        target.setRotationFromEuler(0, 0, tangentAngle * 180 / Math.PI);
                    }
                })
                .call(() => {
                    item.active = false;
                    if (onComplete) onComplete();
                })
                .start())
        };

        // 循环动画
        const doLoop = () => {
            const doOneLoop = () => {
                this.nodeAniMap.set(item, tween(item)
                    .delay(delay)
                    .to(duration, { position: centerPos }, {
                        easing: 'linear',
                        onUpdate: (target: Node, ratio: number) => {
                            const angle = currentAngle + 2 * Math.PI * direction * ratio;
                            const x = centerPos.x + radius * Math.cos(angle);
                            const y = centerPos.y + radius * Math.sin(angle);
                            target.setPosition(x, y, centerPos.z);

                            const tangentAngle = angle + (clockwise ? -Math.PI / 2 : Math.PI / 2);
                            target.setRotationFromEuler(0, 0, tangentAngle * 180 / Math.PI);
                        }
                    })
                    .call(() => {
                        currentAngle += 2 * Math.PI * direction;
                        currentAngle = this.normalizeAngle(currentAngle);
                        completedRotations++;
                        doOneLoop(); // 继续下一圈
                    })
                    .start())
            };

            doOneLoop();
        };

        // 根据参数选择
        if (isLooping) {
            doLoop();
        } else {
            doOnce();
        }
    }
}