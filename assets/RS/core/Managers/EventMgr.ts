import { EventTarget } from 'cc';

/** 单一事件分类操作器 */
class EventCategory {
    constructor(private _target: EventTarget) {}

    on(event: string, callback: (...args: any[]) => void, target?: any): this {
        this._target.on(event, callback, target);
        return this;
    }

    once(event: string, callback: (...args: any[]) => void, target?: any): this {
        this._target.once(event, callback, target);
        return this;
    }

    off(event: string, callback?: (...args: any[]) => void, target?: any): this {
        this._target.off(event, callback, target);
        return this;
    }

    emit(event: string, ...args: any[]): this {
        this._target.emit(event, ...args);
        return this;
    }

    clear(): this {
        this._target.targetOff(this._target);
        return this;
    }
}

/** 事件管理器：支持分类管理 */
class EventMgr {
    private static _instance: EventMgr = new EventMgr();
    public static get instance(): EventMgr {
        return this._instance;
    }

    private _eventMap: Map<string, EventTarget> = new Map();

    private constructor() {}

    /** 获取某分类的事件操作器 */
    public category(name: string): EventCategory {
        if (!this._eventMap.has(name)) {
            this._eventMap.set(name, new EventTarget());
        }
        return new EventCategory(this._eventMap.get(name)!);
    }

    /** 清除所有分类的事件监听器 */
    public clearAll() {
        for (const target of this._eventMap.values()) {
            target.targetOff(target);
        }
        this._eventMap.clear();
    }
}

export const eventMgr = EventMgr.instance;
