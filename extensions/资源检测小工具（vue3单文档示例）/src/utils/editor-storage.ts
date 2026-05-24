import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { registENV } from "./utils";

export class EditorStorage {
    private static _storage: any = null;
    private static _isDirty = false;
    private static _isLoaded = false;
    private static storageFile = "";

    private static _load() {
        registENV();
        const dir = join(__PLUGIN_PATH__, "temp");
        if(!existsSync(dir)) {
            mkdirSync(dir);
        }
        this.storageFile = join(dir, "storage.json");

        if(this._isLoaded) {
            return;
        }

        if(existsSync(this.storageFile)) {
            this._storage = JSON.parse(readFileSync(this.storageFile, "utf-8"));
        } else {
            this._storage = {};
        }

        this._isLoaded = true;
    }

    private static _save() {
        if(!this._isDirty) {
            return;
        }

        writeFileSync(this.storageFile, JSON.stringify(this._storage, null, 4), "utf-8");
        this._isDirty = false;
    }

    private static getKey(key: string) {
        return key;
    }

    public static save() {
        this._save();
    }

    public static get<T>(key: string, defaultValue?: T): T {
        key = this.getKey(key);

        this._load();
        if(this._storage[key] === undefined) {
            return defaultValue as T;
        }

        return this._storage[key];
    }

    public static set(key: string, value: any, saveNow = true) {
        key = this.getKey(key);

        this._load();
        this._storage[key] = value;
        this._isDirty = true;

        if(saveNow) {
            this._save();
        }
    }  

    public static clear() {
        this._storage = {};
        this._save();
    }

    public static remove(key: string, saveNow = true) {
        key = this.getKey(key);

        this._load();
        delete this._storage[key];
        this._isDirty = true;

        if(saveNow) {
            this._save();
        }
    }

    public static has(key: string) {
        key = this.getKey(key);

        this._load();
        return this._storage[key] !== undefined;
    }
}