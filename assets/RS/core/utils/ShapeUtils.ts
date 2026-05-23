import { Vec2, Vec3 } from 'cc';

export class ShapeUtils {

   /** 判断点是否在多边形内部，并且距离边缘至少minDistance */
    static isPointInPolygonWithMargin(point: Vec2, polygon: Vec2[], minDistance: number = 5): boolean {
        // 首先检查点是否在多边形内部
        if (!this.isPointInPolygon(point, polygon)) {
            return false;
        }
        
        // 然后检查点到所有边的最小距离
        return this.getDistanceToEdges(point, polygon) >= minDistance;
    }

    /** 计算点到多边形所有边的最小距离 */
    private static getDistanceToEdges(point: Vec2, polygon: Vec2[]): number {
        let minDistance = Infinity;
        const n = polygon.length;
        
        for (let i = 0; i < n; i++) {
            const p1 = polygon[i];
            const p2 = polygon[(i + 1) % n];
            const distance = this.pointToLineDistance(point, p1, p2);
            minDistance = Math.min(minDistance, distance);
        }
        
        return minDistance;
    }

    /** 计算点到线段的距离 */
    private static pointToLineDistance(point: Vec2, lineStart: Vec2, lineEnd: Vec2): number {
        const A = point.x - lineStart.x;
        const B = point.y - lineStart.y;
        const C = lineEnd.x - lineStart.x;
        const D = lineEnd.y - lineStart.y;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        
        let param = -1;
        if (lenSq !== 0) {
            param = dot / lenSq;
        }

        let xx, yy;

        if (param < 0) {
            xx = lineStart.x;
            yy = lineStart.y;
        } else if (param > 1) {
            xx = lineEnd.x;
            yy = lineEnd.y;
        } else {
            xx = lineStart.x + param * C;
            yy = lineStart.y + param * D;
        }

        const dx = point.x - xx;
        const dy = point.y - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /** 原始的点在多边形检查（保持不变） */
    static isPointInPolygon(point: Vec2, polygon: Vec2[], epsilon: number = 1e-8): boolean {
        let inside = false;
        const n = polygon.length;
        
        for (let i = 0, j = n - 1; i < n; j = i++) {
            const p1 = polygon[i];
            const p2 = polygon[j];
            
            // 检查点是否在顶点上
            if (Math.abs(point.x - p1.x) < epsilon && Math.abs(point.y - p1.y) < epsilon) {
                return true;
            }
            
            // 检查点是否在水平边上
            if (Math.abs(p1.y - p2.y) < epsilon && Math.abs(p1.y - point.y) < epsilon) {
                if (point.x >= Math.min(p1.x, p2.x) - epsilon && point.x <= Math.max(p1.x, p2.x) + epsilon) {
                    return true;
                }
            }
            
            // 标准的射线法检查
            const intersect = ((p1.y > point.y) !== (p2.y > point.y)) &&
                (point.x < (p2.x - p1.x) * (point.y - p1.y) / (p2.y - p1.y) + p1.x);
            if (intersect) inside = !inside;
        }
        
        return inside;
    }

    /** 随机点生成方法，支持距离边缘限制 */
    static getRandomPointInPolygon(polygon: Vec2[], minDistanceToEdge: number = 0): Vec3 {
        // 如果有距离限制，使用专门的方法
        if (minDistanceToEdge > 0) {
            return this.getRandomPointWithEdgeDistance(polygon, minDistanceToEdge);
        }
        
        // 原有的无限制方法
        const gridPoint = this.getRandomPointUsingGrid(polygon);
        if (gridPoint) {
            return gridPoint;
        }
        return this.getRandomPointInBoundingBox(polygon, 5000);
    }

    /** 生成距离边缘至少minDistance的随机点 */
    private static getRandomPointWithEdgeDistance(polygon: Vec2[], minDistance: number, maxAttempts: number = 1000): Vec3 {
        // 方法1：使用收缩的多边形边界框
        const shrunkBounds = this.getShrunkPolygonBounds(polygon, minDistance);
        if (shrunkBounds) {
            for (let attempt = 0; attempt < maxAttempts; attempt++) {
                const x = Math.random() * (shrunkBounds.maxX - shrunkBounds.minX) + shrunkBounds.minX;
                const y = Math.random() * (shrunkBounds.maxY - shrunkBounds.minY) + shrunkBounds.minY;
                const point = new Vec2(x, y);
                
                if (this.isPointInPolygonWithMargin(point, polygon, minDistance)) {
                    return new Vec3(x, y, 0);
                }
            }
        }
        
        // 方法2：回退到网格方法
        return this.getRandomPointWithEdgeDistanceUsingGrid(polygon, minDistance, maxAttempts);
    }

    /** 使用网格方法生成带边缘距离的点 */
    private static getRandomPointWithEdgeDistanceUsingGrid(polygon: Vec2[], minDistance: number, maxAttempts: number = 1000): Vec3 {
        const bounds = this.getPolygonBounds(polygon);
        if (!bounds) {
            return this.getPolygonCentroid(polygon);
        }
        
        const { minX, maxX, minY, maxY } = bounds;
        const gridSize = 20; // 使用较小的网格提高精度
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            // 在收缩的边界框内生成点
            const margin = minDistance * 2;
            const x = Math.random() * (maxX - minX - margin) + (minX + minDistance);
            const y = Math.random() * (maxY - minY - margin) + (minY + minDistance);
            const point = new Vec2(x, y);
            
            if (this.isPointInPolygonWithMargin(point, polygon, minDistance)) {
                return new Vec3(x, y, 0);
            }
        }
        
        // 如果多次尝试失败，放宽条件或返回中心点
        console.warn(`Failed to find point with edge distance ${minDistance} after ${maxAttempts} attempts`);
        return this.getPolygonCentroid(polygon);
    }

    /** 获取收缩后的多边形边界框 */
    private static getShrunkPolygonBounds(polygon: Vec2[], margin: number): { minX: number, maxX: number, minY: number, maxY: number } | null {
        const bounds = this.getPolygonBounds(polygon);
        if (!bounds) return null;
        
        const { minX, maxX, minY, maxY } = bounds;
        
        // 收缩边界框，但确保不反转
        const newMinX = minX + margin;
        const newMaxX = maxX - margin;
        const newMinY = minY + margin;
        const newMaxY = maxY - margin;
        
        if (newMinX >= newMaxX || newMinY >= newMaxY) {
            // 如果收缩后边界框无效，返回null
            return null;
        }
        
        return {
            minX: newMinX,
            maxX: newMaxX,
            minY: newMinY,
            maxY: newMaxY
        };
    }

    /** 使用网格划分方法生成随机点 */
    private static getRandomPointUsingGrid(polygon: Vec2[], gridSize: number = 50): Vec3 | null {
        // 计算边界框
        const bounds = this.getPolygonBounds(polygon);
        if (!bounds) return null;
        
        const { minX, maxX, minY, maxY } = bounds;
        
        // 创建网格
        const gridCells: Vec2[] = [];
        const cellWidth = (maxX - minX) / gridSize;
        const cellHeight = (maxY - minY) / gridSize;
        
        // 对每个网格单元的中心点进行测试
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                const x = minX + (i + 0.5) * cellWidth;
                const y = minY + (j + 0.5) * cellHeight;
                const point = new Vec2(x, y);
                
                if (this.isPointInPolygon(point, polygon)) {
                    gridCells.push(point);
                }
            }
        }
        
        // 如果找到有效的网格单元，随机选择一个
        if (gridCells.length > 0) {
            const randomCell = gridCells[Math.floor(Math.random() * gridCells.length)];
            // 在选定的网格单元内添加随机偏移
            const offsetX = (Math.random() - 0.5) * cellWidth * 0.8;
            const offsetY = (Math.random() - 0.5) * cellHeight * 0.8;
            return new Vec3(randomCell.x + offsetX, randomCell.y + offsetY, 0);
        }
        
        return null;
    }

    /** 改进的边界框方法 */
    private static getRandomPointInBoundingBox(polygon: Vec2[], maxAttempts: number = 5000): Vec3 {
        const bounds = this.getPolygonBounds(polygon);
        if (!bounds) {
            return this.getPolygonCentroid(polygon);
        }
        
        const { minX, maxX, minY, maxY } = bounds;
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const x = Math.random() * (maxX - minX) + minX;
            const y = Math.random() * (maxY - minY) + minY;
            const point = new Vec2(x, y);
            
            if (this.isPointInPolygonStrict(point, polygon)) {
                return new Vec3(x, y, 0);
            }
        }
        
        console.warn('Failed to find random point in polygon after', maxAttempts, 'attempts, returning centroid');
        return this.getPolygonCentroid(polygon);
    }

    /** 严格版本的点在多边形检查 */
    private static isPointInPolygonStrict(point: Vec2, polygon: Vec2[]): boolean {
        // 使用更小的epsilon进行严格检查
        return this.isPointInPolygon(point, polygon, 1e-10);
    }

    /** 计算多边形边界 */
    private static getPolygonBounds(polygon: Vec2[]): { minX: number, maxX: number, minY: number, maxY: number } | null {
        if (polygon.length === 0) return null;
        
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (const p of polygon) {
            minX = Math.min(minX, p.x);
            maxX = Math.max(maxX, p.x);
            minY = Math.min(minY, p.y);
            maxY = Math.max(maxY, p.y);
        }
        
        return { minX, maxX, minY, maxY };
    }

    /** 计算多边形中心点 */
    private static getPolygonCentroid(polygon: Vec2[]): Vec3 {
        let area = 0;
        let centroidX = 0;
        let centroidY = 0;
        const n = polygon.length;
        
        for (let i = 0, j = n - 1; i < n; j = i++) {
            const cross = polygon[i].x * polygon[j].y - polygon[j].x * polygon[i].y;
            area += cross;
            centroidX += (polygon[i].x + polygon[j].x) * cross;
            centroidY += (polygon[i].y + polygon[j].y) * cross;
        }
        
        area *= 0.5;
        
        // 避免除零
        if (Math.abs(area) < 1e-10) {
            // 如果面积太小，返回第一个点
            return new Vec3(polygon[0].x, polygon[0].y, 0);
        }
        
        const factor = 1 / (6 * area);
        centroidX *= factor;
        centroidY *= factor;
        
        return new Vec3(centroidX, centroidY, 0);
    }

    /** 调试方法：可视化验证点是否在多边形内 */
    static debugPointInPolygon(testPoint: Vec2, polygon: Vec2[]): boolean {
        const result = this.isPointInPolygon(testPoint, polygon);
        console.log(`Point (${testPoint.x}, ${testPoint.y}) is ${result ? 'INSIDE' : 'OUTSIDE'} polygon`);
        return result;
    }

    /** 生成多个测试点进行批量验证 */
    static validateRandomPoints(polygon: Vec2[], count: number = 10): Vec3[] {
        const points: Vec3[] = [];
        let validCount = 0;
        let attempts = 0;
        const maxAttempts = count * 100;
        
        while (validCount < count && attempts < maxAttempts) {
            const point = this.getRandomPointInPolygon(polygon);
            const vec2Point = new Vec2(point.x, point.y);
            
            if (this.isPointInPolygonStrict(vec2Point, polygon)) {
                points.push(point);
                validCount++;
            }
            attempts++;
        }
        
        return points;
    }
}