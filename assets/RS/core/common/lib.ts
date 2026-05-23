import { Asset } from "cc";

export interface IStorageEncryption {
    decrypt(str: string): string;
    encrypt(str: string): string;
    encryptKey(str: string): string;
}
export interface ISceneLoadRes {
    /**场景 */
    scene: {
        /**场景名称 */
        name: string,
        bundle: string,
        old: string,
        oldBundle: string,
    },
    /**资源 */
    res: {
        /**需要释放的 */
        release: {
            asset: { path: string }[],
            /**对象池节点名 */
            node: string[]
            /**包名 */
            bundles: string[]
        }
        /**加载 */
        load: {
            /**包名 */
            bundles: string[],
            /**需要加载的资源 */
            asset: { path: string, type: typeof Asset, bundle?: string }[],
            /**需要存对象池的节点 */
            nodes: { name: string, path: string, bundle: string, nums: number }[],
        }
    },
    /**其它一些参数 */
    else?: any

}
/** 缓动动画枚举 */
export enum easeSysEnum {
    linear = "linear",
    smooth = "smooth",
    fade = "fade",
    constant = "constant",

    quadIn = "quadIn",
    quadOut = "quadOut",
    quadInOut = "quadInOut",
    quadOutIn = "quadOutIn",

    cubicIn = "cubicIn",
    cubicOut = "cubicOut",
    cubicInOut = "cubicInOut",
    cubicOutIn = "cubicOutIn",

    quartIn = "quartIn",
    quartOut = "quartOut",
    quartInOut = "quartInOut",
    quartOutIn = "quartOutIn",

    quintIn = "quintIn",
    quintOut = "quintOut",
    quintInOut = "quintInOut",
    quintOutIn = "quintOutIn",

    sineIn = "sineIn",
    sineOut = "sineOut",
    sineInOut = "sineInOut",
    sineOutIn = "sineOutIn",

    expoIn = "expoIn",
    expoOut = "expoOut",
    expoInOut = "expoInOut",
    expoOutIn = "expoOutIn",

    circIn = "circIn",
    circOut = "circOut",
    circInOut = "circInOut",
    circOutIn = "circOutIn",

    elasticIn = "elasticIn",
    elasticOut = "elasticOut",
    elasticInOut = "elasticInOut",
    elasticOutIn = "elasticOutIn",

    backIn = "backIn",
    backOut = "backOut",
    backInOut = "backInOut",
    backOutIn = "backOutIn",

    bounceIn = "bounceIn",
    bounceOut = "bounceOut",
    bounceInOut = "bounceInOut",
    bounceOutIn = "bounceOutIn",
}
export interface IAdConfig {
    platform: 'dy' | 'wx' | 'android';
    id: number;
    /**banner广告id */
    bannerId: string[]
    /**插屏广告id */
    intersitialId: string[]
    /**激励视频广告id */
    videoId: string[]
    /**原生模板广告id1 */
    customId?: string[]
    /**原生模板广告id2 */
    customId1?: string[]
}
/**
 * 广告平台接口
 */
export interface IAdPlatform {
    // Banner广告
    showBanner(style?: number): void;
    hideBanner(): void;

    /**激励广告
    * @param callback 激励成功回调
    */
    showRewardedVideo(callback: Function): void;

    // 插屏广告
    showInterstitialAd(delay?: number): void;

    // 原生模板广告
    showCustomAd(callback: Function): void;
    showCustomAd1(callback: Function): void;
    hideCustomAd1(): void;

    // 分享
    showShare(queryString?: string, callback?: Function): void;
    getLaunchOption(): any;
    getScene(): number;
}