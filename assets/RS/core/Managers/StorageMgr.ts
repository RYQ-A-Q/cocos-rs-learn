import { sys, error, warn } from "cc";
import { DEV } from "cc/env";
import { IStorageEncryption } from "../common/lib";


class StorageMgr {
    private _id: string = "";
    private _prefix: string = "reLearn";
    private _security: IStorageEncryption | null = null;

    /** 是否启用加密 */
    private get encrypted(): boolean {
        return false//TODO 加密存储
    }

    /** 初始化：设置ID前缀和加密方式 */
    init(id: string, security: IStorageEncryption) {
        this._id = id;
        this._security = security;
    }

    /**获取存储的key前缀 */
    getPrefix(): string {
        return (this.encrypted ? this._security.encryptKey(this._prefix) : this._prefix)
    }
    /**获取指定key的存储key名 */
    getKeyName(str: string) {
        if (!this._security) { return str }
        return (this.encrypted ? this._security.encryptKey(str) : str)
    }
    getStoreKey(key: string): string {
        return `${this.getPrefix()}-${this.getKeyName(this._id)}-${this.getKeyName(key)}`;
    }
    /**直接根据key获取存储内容，不进行加解密操作 */
    getContent(key: string): any {
        return sys.localStorage.getItem(key)
    }
    /** 解密内容并按类型返回 */
    decryptContent<T = number | boolean | string | any>(
        content: any,
        type: 'string' | 'number' | 'boolean' | 'json' = 'string',
        defaultValue?: T
    ): T {
        if (!content) return defaultValue as T;

        let decrypted: any = content;
        if (this.encrypted && this._security) {
            try {
                decrypted = this._security.decrypt(content);
            } catch (e) {
                warn(`解密失败: ${e}`);
                return defaultValue as T;
            }
        }
        try {
            switch (type) {
                case 'number':
                    return (Number(decrypted) as unknown) as T;
                case 'boolean':
                    return ((decrypted === 'true') as unknown) as T;
                case 'json':
                    return (JSON.parse(decrypted) as T);
                default: // string
                    return (decrypted as unknown) as T;
            }
        } catch (e) {
            warn(`类型转换失败: ${e}`);
            return defaultValue as T;
        }
    }

    set(key: string, value: any, appPre: boolean = true): void {
        if (!key) {
            error("存储的 key 不能为空");
            return;
        }

        let storeKey = appPre ? this.getStoreKey(key) : key;
        if (value === null || value === undefined) {
            warn("值为空，自动移除该键值对");
            this.remove(key);
            return;
        }

        if (typeof value === "function") {
            error("不能存储 function 类型");
            return;
        }

        // 统一转换为字符串
        if (typeof value === "object") {
            try {
                value = JSON.stringify(value);
            } catch (e) {
                error(`对象序列化失败: ${e}`);
                return;
            }
        } else {
            value = String(value);
        }

        if (this.encrypted && this._security) {
            value = this._security.encrypt(value);
        }

        sys.localStorage.setItem(storeKey, value);
    }

    get(key: string, defaultValue: any = "", appPre: boolean = true): string {
        if (!key) {
            error("key不能为空");
            return null!;
        }

        let storeKey = appPre ? this.getStoreKey(key) : key;
        let str = sys.localStorage.getItem(storeKey);
        if (str && this.encrypted && this._security) {
            str = this._security.decrypt(str);
        }
        return str ?? defaultValue;
    }

    getNumber(key: string, defaultValue: number = 0, appPre: boolean = true): number {
        const str = this.get(key, defaultValue, appPre);
        return str === "0" ? 0 : parseInt(str) || defaultValue;
    }

    getBoolean(key: string, appPre: boolean = true): boolean {
        return this.get(key, false, appPre) === "true";
    }

    getJson<T = any>(key: string, defaultValue: T = {} as T, appPre: boolean = true): T {
        try {
            const str = this.get(key, null, appPre);
            if (str === null || str === undefined) {
                return defaultValue;
            }
            if (typeof str === 'object') {
                return str as T;
            }
            return (str && JSON.parse(str)) || defaultValue;
        } catch (e) {
            warn(`解析JSON失败: ${e}`);
            return defaultValue;
        }
    }
    /** 获取当前存储前缀下的所有 key（自动去除前缀） */
    getAllKeys(): string[] {
        const keys: string[] = [];

        for (let i = 0; i < sys.localStorage.length; i++) {
            let fullKey = sys.localStorage.key(i);
            if (!fullKey) continue;
            keys.push(fullKey);
        }
        return keys;
    }

    remove(key: string, appPre: boolean = true): void {
        if (!key) {
            error("key不能为空");
            return;
        }
        let storeKey = appPre ? this.getStoreKey(key) : key;
        sys.localStorage.removeItem(storeKey);
    }

    clear(): void {
        sys.localStorage.clear();
    }
}

export const storageMgr = new StorageMgr();
