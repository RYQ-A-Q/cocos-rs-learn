import { instantiate, Node, NodePool, Prefab, warn } from 'cc';

/** 包装 NodePool 的对象池条目 */
class PoolEntry {
    pool: NodePool;
    prefab: Prefab;
    lastUseTime: number = Date.now();

    constructor(prefab: Prefab) {
        this.prefab = prefab;
        this.pool = new NodePool();
    }

    /** 获取一个对象（如果池中没有则实例化一个） */
    get(): Node {
        this.lastUseTime = Date.now();
        const poolItem = this.pool.size() > 0 ? this.pool.get() : instantiate(this.prefab);
        poolItem.active = true;
        return poolItem;
    }

    /** 回收一个对象到池中 */
    put(node: Node) {
        this.lastUseTime = Date.now();
        this.pool.put(node);
    }

    /** 当前池中剩余对象数量 */
    size(): number {
        return this.pool.size();
    }

    /**
     * 缩减池中对象数量
     * @param keepHalf 是否保留一半（默认保留一半）
     */
    shrink(keepHalf: boolean = true) {
        const removeCount = keepHalf ? Math.floor(this.pool.size() / 2) : this.pool.size();
        for (let i = 0; i < removeCount; i++) {
            const node = this.pool.get();
            node.destroy();
        }
    }

    /** 清空池中所有对象 */
    clear() {
        this.pool.clear();
    }
}

/** 对象池管理器（单例） */
class PoolsMgr {
    private static readonly _instance = new PoolsMgr();
    public static get instance() { return this._instance }
    private _pools: Map<string, PoolEntry> = new Map();

    private constructor() { }

    /**
     * 预加载指定数量的对象到池中
     * @param key 池名称
     * @param prefab 对应的预制体
     * @param count 预加载数量（默认5）
     */
    preload(key: string, prefab: Prefab, count: number =5) {
        if (this._pools.has(key)) {
            warn(`[PoolsMgr] 对象池 ${key} 已存在，跳过预加载`);
            return;
        }
        const entry = new PoolEntry(prefab);
        for (let i = 0; i < count; i++) {
            entry.pool.put(instantiate(prefab));
        }
        this._pools.set(key, entry);
    }

    /**
     * 获取一个对象实例
     * @param key 池名称
     * @param prefab 可选，当池不存在时用此预制体初始化
     * @returns 返回对象实例或 null
     */
    get(key: string, prefab?: Prefab): Node | null {
        let entry = this._pools.get(key);
        if (!entry) {
            if (!prefab) {
                warn(`[PoolsMgr] 池 ${key} 不存在，且未提供 prefab`);
                return null;
            }
            entry = new PoolEntry(prefab);
            this._pools.set(key, entry);
        }
        return entry.get();
    }

    /**
     * 回收一个对象到指定池中
     * @param key 池名称
     * @param node 要回收的对象
     */
    put(key: string, node: Node) {
        const entry = this._pools.get(key);
        if (entry) {
            node.removeFromParent()
            node.active = false;
            entry.put(node);
        } else {
            node.destroy();
        }
    }

    /**
     * 判断是否存在某对象池
     * @param key 池名称
     * @returns 是否存在
     */
    has(key: string): boolean {
        return this._pools.has(key);
    }
    /**
     * 判断某对象池长度
     * @param key 池名称
     * @returns -1则不存在对象池，否则返回对象池长度
     */
    poolLength(key: string): number {
        return this._pools.get(key)?.size() ?? -1;
    }

    /**
     * 清空指定池或全部池
     * @param key 可选，指定池名称；不传则清空所有池
     */
    clear(key?: string) {
        if (key) {
            const entry = this._pools.get(key);
            entry?.clear();
            this._pools.delete(key);
        } else {
            this._pools.forEach(entry => entry.clear());
            this._pools.clear();
        }
    }
}

export const poolsMgr = PoolsMgr.instance;
