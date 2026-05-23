import { Vec3 } from "cc";
export class NumberUtils {
    
    /**
     * 保留指定位小数
     * @param value 原始数字
     * @param decimals 要保留的小数位数，默认 2
     * @returns number
     */
    static toFixed(value: number, decimals: number = 2): number {
        const factor = Math.pow(10, decimals);
        return Math.round(value * factor) / factor;
    }
    /**
       * 将数值转换为带单位的简写（K / M / B / T 等）
       * @param value 数值
       * @param fixed 超过1k时使用 小数位数（默认保留 2 位）
       * @returns 例如：1234 -> "1.23K", 2500000 -> "2.5M"
       */
    static formatNumberUnit(value: number, fixed: number = 2): string {
        if (value === 0) return "0";
        const absValue = Math.abs(value);

        const units = ["", "K", "M", "B", "T", "Q"];
        const k = 1000;
        const i = Math.floor(Math.log10(absValue) / 3); // 每 3 位换单位

        if (i <= 0) {
            return value.toFixed(0);
        }

        const scaled = value / Math.pow(k, i);
        return scaled.toFixed(fixed) + units[i];
    }
    /** 返回值在[min, max]之间的整数*/
    static getRandomInt(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    /**返回值在[min, max]之间的浮点数 */
    static getRandomFloat(min: number, max: number): number {
        return Math.random() * (max - min) + min;
    }
    /**获取随机数组成员 @param array 目标数组*/
    static getRandomValueInArray(array: any[]): any {
        return array[Math.floor(Math.random() * array.length)];
    }
    /**
     * 统计数组中每个元素或对象的出现次数
     * @param array 输入的数组
     * @param keySelector 可选的函数，用于从数组元素中提取唯一标识符（适用于对象数组）
     * @returns 一个对象，键为唯一标识符，值为该元素或对象出现的次数
     */
    public static countOccurrences<T>(array: T[], keySelector?: (item: T) => string): Record<string, number> {
        const countMap: Record<string, number> = {};
        array.forEach(item => {
            let key: string;

            if (keySelector) {
                key = keySelector(item);
            } else {
                key = String(item);
            }
            if (countMap[key]) {
                countMap[key]++;
            } else {
                countMap[key] = 1;
            }
        });

        return countMap;
    }
    /**转换数值为100%计数  @param fixed 保留小数位数*/
    static decimalsToPercentage(decimals: number, fixed: number = 0): string {
        return (decimals * 100).toFixed(fixed) + "%";
    }
    /**
     * 根据权重数组进行加权随机
     * @param weights 权重数组，例如 [0.8, 0.2] 或 [10, 3, 7]
     * @returns 返回被选中的索引
     */
    static getWeightedRandomIndex(weights: number[]): number {
        if (!weights || weights.length === 0) return -1;

        const total = weights.reduce((a, b) => a + b, 0);
        const rand = Math.random() * total;

        let sum = 0;
        for (let i = 0; i < weights.length; i++) {
            sum += weights[i];
            if (rand < sum) return i;
        }

        return weights.length - 1; // 防止浮点误差
    }
    /**
     * 根据权重数组返回对应的值
     * @param items 值数组
     * @param weights 权重数组
     * @returns 返回随机选中的值
     */
    static getWeightedRandomValue<T>(items: T[], weights: number[]): T | null {
        if (!items || items.length === 0 || items.length !== weights.length) return null;
        const index = this.getWeightedRandomIndex(weights);
        return items[index];
    }
    /**获取一个边缘位置 */
    static getEdgePosition(activeSize: { w: number; h: number }): Vec3 {
        const { w, h } = activeSize;
        const edge = Math.floor(Math.random() * 4);
        let x = 0;
        let y = 0;

        switch (edge) {
            case 0: // 左边
                x = -w;
                y = NumberUtils.getRandomInt(-h, h);
                break;
            case 1: // 右边
                x = w;
                y = NumberUtils.getRandomInt(-h, h);
                break;
            case 2: // 上边
                x = NumberUtils.getRandomInt(-w, w);
                y = h;
                break;
            case 3: // 下边
                x = NumberUtils.getRandomInt(-w, w);
                y = -h;
                break;
        }
        return new Vec3(x, y, 0);
    }
    /**
 * 计算多维数组中的元素总数量
 * @param arr 任意维度的数组
 * @returns 元素总数
 */
    static countElements(arr: any[]): number {
        return arr.reduce((count, item) => {
            return count + (Array.isArray(item) ? this.countElements(item) : 1);
        }, 0);
    }
    /**
   * 从二维数组中按顺序索引取出具体元素
   * @param data 二维数组
   * @param index 一维序号（从 0 开始）
   * @returns 对应的元素
   */
    static getItemByFlatIndex<T>(data: T[][], index: number): T | null {
        if (!data || index < 0) return null;

        let count = 0;
        for (let i = 0; i < data.length; i++) {
            for (let j = 0; j < data[i].length; j++) {
                if (count === index) return data[i][j];
                count++;
            }
        }
        return null;
    }

    /**
     * 根据平面索引获取在二维数组中的行列坐标
     * @param data 二维数组
     * @param index 一维索引
     * @returns [row, col] or null
     */
    static get2DIndex<T>(data: T[][], index: number): [number, number] | null {
        if (!data || index < 0) return null;

        let count = 0;
        for (let i = 0; i < data.length; i++) {
            for (let j = 0; j < data[i].length; j++) {
                if (count === index) return [i, j];
                count++;
            }
        }
        return null;
    }

    /**
     * 将二维数组“摊平”为一维
     */
    static flatten2D<T>(data: T[][]): T[] {
        return data.reduce((acc, cur) => acc.concat(cur), []);
    }

    /**
     * 将一维数组按指定行长度重新分组为二维
     * @param arr 一维数组
     * @param rowLength 每行长度
     */
    static groupTo2D<T>(arr: T[], rowLength: number): T[][] {
        const result: T[][] = [];
        for (let i = 0; i < arr.length; i += rowLength) {
            result.push(arr.slice(i, i + rowLength));
        }
        return result;
    }
    /**
   * 根据二维索引 [row, col] 获取在“拍平数组”中的顺序序号
   * @param data 二维数组
   * @param row 行索引
   * @param col 列索引
   * @returns 一维索引（从 0 开始），非法则返回 -1
   */
    static getFlatIndex<T>(data: T[][], row: number, col: number): number {
        if (!data || row < 0 || col < 0) return -1;
        if (row >= data.length || col >= data[row].length) return -1;

        let index = 0;
        for (let i = 0; i < row; i++) {
            index += data[i].length;
        }
        index += col;
        return index;
    }
    /**洗牌算法 */
    public static shuffle<T>(arr: T[]) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }

    /**
   * 计算规则网格布局（左上角起始）
   * @param rows 行数
   * @param cols 列数
   * @param cellSize 单个格子的尺寸（宽高）
   * @param rowGap 行间距（上下间距）
   * @param colGap 列间距（左右间距）
   * @param startPos 第一个格子的左上角的坐标
   * @returns positions：每个格子的坐标二维数组（row, col）
   *          gridSize：整个网格占用的宽高
   */
    public static calcGridLayout(
        rows: number,
        cols: number,
        cellSize: { width: number; height: number },
        rowGap: number,
        colGap: number,
        startPos: { x: number; y: number }
    ): {
        positions: { x: number; y: number }[][];
        gridSize: { width: number; height: number };
    } {

        const positions: { x: number; y: number }[][] = [];

        for (let r = 0; r < rows; r++) {
            positions[r] = [];
            for (let c = 0; c < cols; c++) {
                const x = startPos.x + c * (cellSize.width + colGap);
                const y = startPos.y - r * (cellSize.height + rowGap);
                positions[r][c] = { x, y };
            }
        }

        const width =
            cols * cellSize.width +
            (cols - 1) * colGap;

        const height =
            rows * cellSize.height +
            (rows - 1) * rowGap;

        const gridSize = { width, height };

        return {
            positions,
            gridSize
        };
    }

    /**
 * 特殊坐标系：x是纵向，y是横向
 * - x增加：向下移动
 * - x减少：向上移动  
 * - y增加：向右移动
 * - y减少：向左移动
 */
    public static getDirectionFromPrevSpecial(
        prev: { x: number; y: number },
        next: { x: number; y: number }
    ): 'up' | 'down' | 'left' | 'right' | null {
        const dx = next.x - prev.x;
        const dy = next.y - prev.y;
        console.log('prev, next', prev, next)
        console.log('dx, dy', dx, dy);
        if (dx === 0 && dy === 0) {
            return null;
        }

        if (dx > 0 && dy === 0) {
            // x增加：向下移动（纵向向下）
            return 'down';
        } else if (dx < 0 && dy === 0) {
            // x减少：向上移动（纵向向上）
            return 'up';
        } else if (dx === 0 && dy > 0) {
            // y增加：向右移动（横向向右）
            return 'right';
        } else if (dx === 0 && dy < 0) {
            // y减少：向左移动（横向向左）
            return 'left';
        }

        // 对角移动
        if (Math.abs(dx) >= Math.abs(dy)) {
            return dx > 0 ? 'down' : 'up';
        } else {
            return dy > 0 ? 'right' : 'left';
        }
    }
    /**
 * 随机打乱 0~m 的整数序列，并返回前 n 个
 * @param m 最大值（不含）
 * @param n 取前 n 个
 */
    static getRandomSubset(m: number, n: number): number[] {
        const arr = Array.from({ length: m }, (_, i) => i);
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr.slice(0, n);
    }
    /**
     * 深度比较两个值，返回它们的差异数
     * @param a 任意值
     * @param b 任意值
     * @param path 当前路径（递归内部使用）
     * @param diffs 差异收集器（递归内部使用）
     */
    static deepDiff(
        a: any,
        b: any,
        path: string[] = [],
        diffs: string[] = []
    ): number {

        if (a === b) return 0;

        if (a === null || b === null || a === undefined || b === undefined) {
            if (a !== b) {
                diffs.push(this.formatPath(path));
                return 1;
            }
            return 0;
        }

        if (typeof a !== typeof b) {
            diffs.push(this.formatPath(path));
            return 1;
        }

        // Date
        if (a instanceof Date && b instanceof Date) {
            if (a.getTime() !== b.getTime()) {
                diffs.push(this.formatPath(path));
                return 1;
            }
            return 0;
        }

        // Array
        if (Array.isArray(a) && Array.isArray(b)) {
            let diffCount = 0;
            const maxLen = Math.max(a.length, b.length);
            for (let i = 0; i < maxLen; i++) {
                if (i >= a.length || i >= b.length) {
                    diffs.push(this.formatPath([...path, `${i}`]));
                    diffCount++;
                } else {
                    diffCount += this.deepDiff(a[i], b[i], [...path, `${i}`], diffs);
                }
            }
            return diffCount;
        }

        // Object
        if (typeof a === 'object' && typeof b === 'object') {
            let diffCount = 0;
            const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
            for (const key of keys) {
                if (!(key in a) || !(key in b)) {
                    diffs.push(this.formatPath([...path, key]));
                    diffCount++;
                } else {
                    diffCount += this.deepDiff(a[key], b[key], [...path, key], diffs);
                }
            }
            return diffCount;
        }

        // Primitive
        diffs.push(this.formatPath(path));
        return 1;
    }
    private static formatPath(path: string[]) {
        if (path.length === 0) return 'root';
        return path.reduce((acc, cur) => {
            return typeof cur === 'number'
                ? `${acc}[${cur}]`
                : `${acc}.${cur}`;
        }, 'root');
    }


    /**
     * 比较两个数组是否一致，并可返回差异数和差异路径
     * @param a 数组A
     * @param b 数组B
     * @param reportDiff 是否返回差异详情
     */
    static compareArraysDeep(a: any[], b: any[], reportDiff: boolean = false) {
        const diffs: string[] = [];
        const diffCount = this.deepDiff(a, b, [], diffs);
        const isEqual = diffCount === 0;
        if (reportDiff) {
            return { isEqual, diffCount, diffs };
        }
        return { isEqual };
    }
    /**
     * 格式化数值：如果没有小数部分则返回整数，否则保留指定位小数
     * @param value 要格式化的数值
     * @param decimalPlaces 小数位数（默认2位）
     * @returns 格式化后的数值（number类型）
     */
    static formatNumber(value: number, decimalPlaces: number = 1): number {
        // 处理非数值情况
        if (isNaN(value)) return 0;

        // 检查是否为整数（包括科学计数法表示的整数）
        if (Number.isInteger(value)) {
            return value;
        }

        // 有小数部分，保留指定位数
        const factor = Math.pow(10, decimalPlaces);
        return Math.round(value * factor) / factor;
    }
    /**生成随机序列码 */
    static generateSerialCode(): string {
        // 随机字符串函数
        function randomStr(length: number): string {
            const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
            let result = "";
            for (let i = 0; i < length; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return result;
        }
        // 当前日期
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, ""); // yyyyMMdd
        const randomSerialCode = randomStr(4) + "-" + dateStr + "-" + randomStr(4);
        console.log(`生成随机版本序列码：${randomSerialCode}`);
        return randomSerialCode
    }
}