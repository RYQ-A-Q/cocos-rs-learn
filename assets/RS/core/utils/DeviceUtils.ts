import { sys } from "cc";
import { DateUtils } from "./DateUtils";
import { RandomNameUtils } from "./RandomNameUtils";

export class DeviceUtils {
    private static _lastTime = 0;
    private static _counter = 0;
    /**获取设备ID */
    public static getDeviceId(): string {
        return this.getDeviceCreateUUID();
    }
    /**获取设备信息 */
    public static getDeviceInfo(firstLogin: number): any {
        return {
            deviceId: this.getDeviceCreateUUID(),
            type: sys.platform,
            browserType: sys?.browserType ?? "unknown",
            browserVersion: sys?.browserVersion ?? "unknown",
            //@ts-ignore
            os: sys.os ?? "unknown",
            osVersion: sys.osVersion,
            // @ts-ignore
            model: sys?.model ?? "unknown",
            firstLogin: firstLogin,
            lastLogin: DateUtils.nowTimestamp(),
        }
    }
    private static getDeviceCreateUUID(): string {
        const key = 'device_uuid';
        let uuid = sys.localStorage.getItem(key);
        if (!uuid) {
            uuid = `${Date.now()}-${Math.random().toString(16).substring(2, 10)}`;
            sys.localStorage.setItem(key, uuid);
        }
        return uuid;
    }
    /**获取平台信息 */
    public static getPlatformAccount(bindTime: number): any {
        return {
            platform: sys.platform,
            openId: this.getPlatOpenUUID(),
            nickname: RandomNameUtils.generate(),
            avatar: "@@local/avatar/avatarAnimal-3",//临时图像
            lastLogin: DateUtils.nowTimestamp(),
            bindTime: bindTime,
        }
    }
    private static getPlatOpenUUID(): string {
        const key = 'platOpen_uuid';
        let uuid = sys.localStorage.getItem(key);
        if (!uuid) {
            uuid = `${Date.now()}-${Math.random().toString(16).substring(2, 10)}`;
            sys.localStorage.setItem(key, uuid);
        }
        return uuid;
    }
    static async getIpLogin(deviceId: string): Promise<any> {
        let ip: any = await this.getPublicIP()
        return {
            ip,
            deviceId,
            loginTime: DateUtils.nowTimestamp(),
        }
    }
    static async getPublicIP() {
        const fallbackUrls = [
            'https://api.ipify.org',
            'https://api.ip.sb/ip',
            'https://ipapi.co/json/'
        ];

        for (let url of fallbackUrls) {
            try {
                const res = await fetch(url, { method: 'GET' });
                if (res.ok) {
                    const contentType = res.headers.get('content-type') || '';

                    if (contentType.includes('application/json')) {
                        const json = await res.json();
                        if (json.ip) {
                            console.log("通过第三方API获取IP成功:", url, json.ip);
                            return json.ip;
                        }
                    } else {
                        const text = await res.text();
                        const ip = text.trim();
                        if (ip.match(/^\d+\.\d+\.\d+\.\d+$/)) {
                            console.log("通过第三方API获取IP成功:", url, ip);
                            return ip;
                        }
                    }
                }
            } catch (err) {
                console.warn(`获取 IP 失败，接口 ${url} 出错:`, err);
            }
        }
        return 0;
    }
    static generateUUID(): string {
        try {
            if (typeof crypto !== 'undefined' && crypto?.randomUUID) {
                return crypto.randomUUID();
            }
        } catch (e) { }
        // 微信小游戏兜底
        const now = Date.now();
        if (now === this._lastTime) {
            this._counter++;
        } else {
            this._lastTime = now;
            this._counter = 0;
        }

        return (
            now.toString(16) +
            '-' +
            this._counter.toString(16).padStart(4, '0') +
            '-' +
            Math.floor(Math.random() * 0xfffff).toString(16)
        );
    }
}