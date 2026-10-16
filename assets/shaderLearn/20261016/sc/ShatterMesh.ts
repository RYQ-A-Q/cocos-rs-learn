
import { _decorator, Component, MeshRenderer, Mesh, utils, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

type Point2 = { x: number; y: number };

@ccclass('ShatterMesh')
export class ShatterMesh extends Component {
    @property(MeshRenderer)
    meshRenderer: MeshRenderer | null = null;

    @property
    width = 300;

    @property
    height = 300;

    @property
    fragmentCount = 24;

    @property
    gap = 2;

    private mesh: Mesh | null = null;
    private positions: number[] = [];
    private uvs: number[] = [];
    private colors: number[] = [];
    private indices: number[] = [];

    start() {
        this.generateMesh();
    }

    private generateMesh() {
        const count = Math.max(4, Math.min(64, Math.floor(this.fragmentCount)));
        const sites: Point2[] = [];

        for (let i = 0; i < count; i++) {
            sites.push({ x: Math.random() * this.width, y: Math.random() * this.height });
        }

        this.positions = [];
        this.uvs = [];
        this.colors = [];
        this.indices = [];

        for (let i = 0; i < sites.length; i++) {
            const site = sites[i];
            let polygon: Point2[] = [
                { x: 0, y: 0 },
                { x: this.width, y: 0 },
                { x: this.width, y: this.height },
                { x: 0, y: this.height }
            ];

            for (let j = 0; j < sites.length; j++) {
                if (i === j) continue;
                polygon = this.clipPolygon(polygon, site, sites[j]);
                if (polygon.length < 3) break;
            }

            if (polygon.length < 3) continue;

            // 将多边形向内部收缩，产生真实透明间隙。
            const cx = polygon.reduce((sum, p) => sum + p.x, 0) / polygon.length;
            const cy = polygon.reduce((sum, p) => sum + p.y, 0) / polygon.length;
            const shrink = Math.max(0, this.gap);

            polygon = polygon.map(p => {
                const dx = p.x - cx;
                const dy = p.y - cy;
                const len = Math.sqrt(dx * dx + dy * dy);
                const inset = Math.min(shrink, len * 0.25);
                return {
                    x: cx + dx * (1 - inset / Math.max(len, 0.0001)),
                    y: cy + dy * (1 - inset / Math.max(len, 0.0001))
                };
            });

            // 每块碎片独立生成顶点，顶点颜色编码碎片中心和随机值。
            const base = this.positions.length / 3;
            const centerU = site.x / this.width;
            const centerV = site.y / this.height;
            const randomValue = Math.random();

            for (const p of polygon) {
                this.positions.push(p.x - this.width * 0.5, p.y - this.height * 0.5, 0);
                this.uvs.push(p.x / this.width, p.y / this.height);
                this.colors.push(centerU, centerV, randomValue, 1);
            }

            for (let k = 1; k < polygon.length - 1; k++) {
                this.indices.push(base, base + k, base + k + 1);
            }
        }

        const meshData = {
            positions: this.positions,
            uvs: this.uvs,
            colors: this.colors,
            indices: this.indices
        };

        this.mesh?.destroy();
        this.mesh = utils.createMesh(meshData as Parameters<typeof utils.createMesh>[0]);
        if (this.meshRenderer && this.mesh) {
            this.meshRenderer.mesh = this.mesh;
        }
    }

    private clipPolygon(poly: Point2[], a: Point2, b: Point2): Point2[] {
        if (poly.length === 0) return [];

        const mx = (a.x + b.x) * 0.5;
        const my = (a.y + b.y) * 0.5;
        const nx = b.x - a.x;
        const ny = b.y - a.y;

        const inside = (p: Point2) =>
            (p.x - mx) * nx + (p.y - my) * ny <= 0.0001;

        const intersect = (p1: Point2, p2: Point2): Point2 => {
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const denominator = dx * nx + dy * ny;
            if (Math.abs(denominator) < 0.000001) return p1;

            const t = ((mx - p1.x) * nx + (my - p1.y) * ny) / denominator;
            return { x: p1.x + dx * t, y: p1.y + dy * t };
        };

        const output: Point2[] = [];
        let previous = poly[poly.length - 1];

        for (const current of poly) {
            const currentInside = inside(current);
            const previousInside = inside(previous);

            if (currentInside) {
                if (!previousInside) output.push(intersect(previous, current));
                output.push(current);
            } else if (previousInside) {
                output.push(intersect(previous, current));
            }

            previous = current;
        }

        return output;
    }

    onDestroy() {
        this.mesh?.destroy();
        this.mesh = null;
    }
}
