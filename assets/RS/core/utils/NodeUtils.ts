import { Vec2 } from 'cc';
import { Vec3 } from 'cc';
import { Node, instantiate, UITransform, Rect } from 'cc';
/**节点工具类 */
export class NodeUtils {

    /**
     * 获取节点的子节点中首个未激活的节点（可指定从第几个开始），
     * 若不存在则克隆指定索引的节点，克隆节点初始为关闭状态，再激活并返回。
     * @param parent 父节点
     * @param startIndex 从第几个子节点开始检查（默认0,即第一个）
     * @param cloneIndex 若需克隆，则以该索引的节点为模板（默认0，即第一个）
     * @returns 返回找到或新建的节点
     */
    static getOrCloneInactiveChild(
        parent: Node,
        startIndex: number = 0,
        cloneIndex: number = 0
    ): Node {
        if (!parent || parent.children.length === 0) {
            console.warn('[NodeUtils] 父节点为空或没有子节点');
            return null!;
        }

        const children = parent.children;
        const len = children.length;

        // 遍历查找第一个未激活的子节点
        for (let i = startIndex; i < len; i++) {
            const child = children[i];
            if (!child.active) {
                child.active = true;
                return child;
            }
        }

        //  如果没有未激活的，则克隆指定索引的子节点
        const template = children[cloneIndex] ?? children[0];
        const newNode = instantiate(template);
        newNode.active = false;
        parent.addChild(newNode);
        newNode.active = true;
        return newNode;
    }

    /**
     * 判断两个节点是否相交（AABB）
     * @param uitA UITransformA
     * @param uitB UITransformB
     * @param forceWorld 是否强制使用世界坐标（默认自动判断）
     */
    static intersects(uitA: UITransform, uitB: UITransform, forceWorld: boolean = false): boolean {
        if (!uitA || !uitB) return false;

        const aBox = (!forceWorld && uitA.node.parent === uitB.node.parent)
            ? uitA.getBoundingBox()
            : uitA.getBoundingBoxToWorld();
        const bBox = (!forceWorld && uitA.node.parent === uitB.node.parent)
            ? uitB.getBoundingBox()
            : uitB.getBoundingBoxToWorld();
        return aBox.intersects(bBox);
    }

    /**
     * 判断节点A是否完全包含节点B
     * @param uitA UITransformA
     * @param uitB UITransformB
     * @param forceWorld 是否强制使用世界坐标
     */
    static containsRect(uitA: UITransform, uitB: UITransform, forceWorld: boolean = false): boolean {
        if (!uitA || !uitB) return false;

        const aBox = (!forceWorld && uitA.node.parent === uitB.node.parent)
            ? uitA.getBoundingBox()
            : uitA.getBoundingBoxToWorld();
        const bBox = (!forceWorld && uitA.node.parent === uitB.node.parent)
            ? uitB.getBoundingBox()
            : uitB.getBoundingBoxToWorld();

        return aBox.containsRect(bBox);
    }

    /**
     * 获取两个节点的相交矩形（如果没有交集返回 null）
     * @param uitA UITransformA
     * @param uitB UITransformB
     * @param forceWorld 是否强制使用世界坐标
     */
    static getIntersectionRect(uitA: UITransform, uitB: UITransform, forceWorld: boolean = false): Rect | null {
        if (!NodeUtils.intersects(uitA, uitB, forceWorld)) return null;

        const aBox = (!forceWorld && uitA.node.parent === uitB.node.parent)
            ? uitA.getBoundingBox()
            : uitA.getBoundingBoxToWorld();
        const bBox = (!forceWorld && uitA.node.parent === uitB.node.parent)
            ? uitB.getBoundingBox()
            : uitB.getBoundingBoxToWorld();

        const x1 = Math.max(aBox.x, bBox.x);
        const y1 = Math.max(aBox.y, bBox.y);
        const x2 = Math.min(aBox.x + aBox.width, bBox.x + bBox.width);
        const y2 = Math.min(aBox.y + aBox.height, bBox.y + bBox.height);

        return new Rect(x1, y1, x2 - x1, y2 - y1);
    }


    /**
       * 批量检测节点与节点列表的碰撞
       * @param uitA 单个节点
       * @param uitList UITransform数组
       * @param forceWorld 是否强制使用世界坐标
       * @param returnRect 是否返回交集矩形（默认 false）
       * @returns 返回与 uitA 相交的节点及索引，可选包含交集矩形
       */
    static getIntersectsWithListIndexed(
        uitA: UITransform,
        uitList: UITransform[],
        forceWorld: boolean = false,
        returnRect: boolean = false
    ): Array<{ nodeUit: UITransform; index: number } | { nodeUit: UITransform; index: number; rect: Rect }> {
        if (!uitA || !uitList || uitList.length === 0) return [];

        const results: Array<{ nodeUit: UITransform; index: number } | { nodeUit: UITransform; index: number; rect: Rect }> = [];

        uitList.forEach((uitB, idx) => {
            if (returnRect) {
                const intersectRect = NodeUtils.getIntersectionRect(uitA, uitB, forceWorld);
                if (intersectRect) {
                    results.push({ nodeUit: uitB, index: idx, rect: intersectRect });
                }
            } else {
                if (NodeUtils.intersects(uitA, uitB, forceWorld)) {
                    results.push({ nodeUit: uitB, index: idx });
                }
            }
        });
        return results;
    }
    /**
    * 检测某个点是否被 UITransform 列表中的节点包含
    * @param point 检测点
    * @param uitList UITransform 数组
    * @param forceWorld 是否强制使用世界坐标（默认 true）
    * @param returnRect 是否返回节点边框（默认 false）
    * @returns 返回包含该点的节点及索引，可选包含矩形信息
    */
    static getContainsPointFromList(
        point: Vec2,
        uitList: UITransform[],
        forceWorld: boolean = true,
        returnRect: boolean = false
    ): Array<{ nodeUit: UITransform; index: number } | { nodeUit: UITransform; index: number; rect: Rect }> {
        if (!point || !uitList || uitList.length === 0) return [];

        const results: Array<{ nodeUit: UITransform; index: number } | { nodeUit: UITransform; index: number; rect: Rect }> = [];

        uitList.forEach((uitB, idx) => {
            if (!uitB?.node?.isValid) return;

            // 获取对应坐标空间下的包围盒
            const rect = forceWorld
                ? uitB.getBoundingBoxToWorld()
                : uitB.getBoundingBox();
            if (rect.contains(point)) {
                if (returnRect) {
                    results.push({ nodeUit: uitB, index: idx, rect });
                } else {
                    results.push({ nodeUit: uitB, index: idx });
                }
            }
        });

        return results;
    }

}
