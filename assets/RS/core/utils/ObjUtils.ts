/**
 * @description: 对象工具类
 */
export class ObjUtils {

    /**
     * 浅拷贝
     * 仅复制第一层属性，引用对象仍共享
     */
    static shallowClone<T>(target: T): T {
        if (target === null || typeof target !== 'object') {
            return target;
        }

        if (Array.isArray(target)) {
            return target.slice() as any;
        }

        if (target instanceof Map) {
            return new Map(target) as any;
        }

        if (target instanceof Set) {
            return new Set(target) as any;
        }

        return Object.assign(
            Object.create(Object.getPrototypeOf(target)),
            target
        );
    }

    /**
     * 深拷贝（完整克隆）
     * - 支持循环引用
     * - 保留原型链
     * - 支持 Map / Set / Date / RegExp
     */
    static deepClone<T>(target: T, cache = new WeakMap()): T {

        // 基本类型 & 函数
        if (target === null || typeof target !== 'object') {
            return target;
        }

        // 循环引用处理
        if (cache.has(target as any)) {
            return cache.get(target as any);
        }

        // Date
        if (target instanceof Date) {
            return new Date(target.getTime()) as any;
        }

        // RegExp
        if (target instanceof RegExp) {
            return new RegExp(target.source, target.flags) as any;
        }

        // Map
        if (target instanceof Map) {
            const result = new Map();
            cache.set(target as any, result);
            target.forEach((value, key) => {
                result.set(
                    ObjUtils.deepClone(key, cache),
                    ObjUtils.deepClone(value, cache)
                );
            });
            return result as any;
        }

        // Set
        if (target instanceof Set) {
            const result = new Set();
            cache.set(target as any, result);
            target.forEach(value => {
                result.add(ObjUtils.deepClone(value, cache));
            });
            return result as any;
        }

        // Array
        if (Array.isArray(target)) {
            const result: any[] = [];
            cache.set(target as any, result);
            target.forEach((item, index) => {
                result[index] = ObjUtils.deepClone(item, cache);
            });
            return result as any;
        }

        // Object / Class Instance
        const proto = Object.getPrototypeOf(target);
        const result = Object.create(proto);
        cache.set(target as any, result);

        Reflect.ownKeys(target).forEach(key => {
            const desc = Object.getOwnPropertyDescriptor(target, key);
            if (!desc) return;

            if ('value' in desc) {
                desc.value = ObjUtils.deepClone(desc.value, cache);
            }

            Object.defineProperty(result, key, desc);
        });

        return result;
    }
}
