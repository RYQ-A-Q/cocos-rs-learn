import { _decorator, Component, Node } from 'cc';
import { NodeUtils } from '../../RS/core/utils/NodeUtils';
import { Vec3 } from 'cc';
import { tween } from 'cc';
const { ccclass, property } = _decorator;
const WIDTH = 700
const HEIGHT = 850

@ccclass('PopMotionCurve')
export class PopMotionCurve extends Component {
    @property(Node)
    private nodeContainer: Node
    @property(Node)
    private startNode: Node

    @property
    private jumpHeight: number = 300
    @property
    private duration: number = 0.8
    @property
    private bezierSteps: number = 30 // 贝塞尔曲线步数

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
        this.flyParabolaBezier(start, end, this.jumpHeight, this.duration);
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
        
        // 计算与Y轴正方向的夹角（弧度）
        let angle = Math.atan2(dx, dy);
        // 转换为角度
        return angle * 180 / Math.PI;
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

        // 计算角度
        const angle = this.calculateAngle(startPos, endPos);
        
        // 获取贝塞尔控制点（使用三次贝塞尔曲线）
        const { p0, p1, p2, p3 } = this.getBezierControlPoints(startPos, endPos, jumpHeight);
        
        // 存储轨迹点用于调试（可选）
        const trajectoryPoints: Vec3[] = [];
        for (let i = 0; i <= this.bezierSteps; i++) {
            const t = i / this.bezierSteps;
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
                        target.setRotationFromEuler(0, 0, -dirAngle * 0.2);
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
     * 使用二次贝塞尔曲线的简化版本
     */
    private flyParabolaQuadratic(
        startPos: Vec3,
        endPos: Vec3,
        jumpHeight: number = 300,
        duration: number = 0.8,
        delay: number = 0,
        onComplete?: () => void
    ) {
        const item = this.getNewItem();
        item.active = true;
        item.setPosition(startPos);

        // 计算顶点（控制点）
        const midPos = new Vec3(
            (startPos.x + endPos.x) / 2,
            Math.max(startPos.y, endPos.y) + jumpHeight,
            (startPos.z + endPos.z) / 2
        );

        const angle = this.calculateAngle(startPos, endPos);

        tween(item)
            .delay(delay)
            .to(duration, { position: endPos }, {
                easing: 'linear',
                onUpdate: (target: Node, ratio: number) => {
                    // 使用二次贝塞尔曲线
                    const pos = this.quadraticBezier(ratio, startPos, midPos, endPos);
                    target.setPosition(pos);
                    
                    // 动态旋转
                    if (ratio < 1) {
                        const nextRatio = Math.min(ratio + 0.01, 1);
                        const nextPos = this.quadraticBezier(nextRatio, startPos, midPos, endPos);
                        const dirAngle = this.calculateAngle(pos, nextPos);
                        target.setRotationFromEuler(0, 0, -dirAngle * 0.2);
                    }
                }
            })
            .call(() => {
                item.setRotationFromEuler(0, 0, 0);
                item.active = false;
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
}