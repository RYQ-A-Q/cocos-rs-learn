import { sys } from "cc";
import { IAdConfig, IAdPlatform } from "../common/lib";
import { DyPlatformImpl } from "../common/adPlane/DyPlatformImpl";
import { WxPlatformImpl } from "../common/adPlane/WxPlatformImpl";
import { PREVIEW } from "cc/env";

const adConfigs: IAdConfig[] = [//TODO 这里需要和抖音/微信的appid想对应的各种广告id才能正常调用
    { platform: 'dy', id: 1, bannerId: ['xx'], intersitialId: ['xx'], videoId: ['xx'] },
    { platform: 'wx', id: 2, bannerId: [''], intersitialId: [''], videoId: [''] },
]
class AdMgr {
    /**广告是否可用,true为可用,可通过这个来判断整体广告图标 */
    ADSTATE: boolean = false;
    public static readonly instance: AdMgr = new AdMgr();
    ad: IAdPlatform | any
    private bannerOn: boolean = false;
    private customOn: boolean = false;
    private customOn1: boolean = false;
    private constructor() { }
    /**
        * 初始化广告管理器
        */
    public init(): void {
        this.ADSTATE = false
        const system = sys.platform;
        console.log("当前平台:", system);
        switch (system) {
            case sys.Platform.BYTEDANCE_MINI_GAME:
                this.ad = new DyPlatformImpl(adConfigs[0]);
                this.ADSTATE = true
                console.log("抖音平台广告已初始化");
                break;

            case sys.Platform.WECHAT_GAME:
                this.ad = new WxPlatformImpl(adConfigs[1]);
                this.ADSTATE = false
                console.log("微信平台广告已初始化");
                break;
            // case sys.Platform.ANDROID:
            //     this.ad = new AndroidPlatformImpl(adConfigs[2]);
            //     console.log("Android平台广告已初始化");
            //     break;

            default:
                console.warn("当前平台不支持广告或平台检测失败:", system);
                this.ad = null;
                break;
        }
        if (PREVIEW) {
            this.ADSTATE = true
        }
    }

    /**
     * 获取广告平台实例
     */
    public getAdPlatform(): IAdPlatform | null {
        return this.ad;
    }

    /**
     * 显示Banner广告
     * @param style 样式：1-右侧对齐，2-居中，其他-左侧对齐
     */
    public showBanner(style: number = 2): void {
        if (!this.ad) {
            console.warn("广告平台未初始化");
            return;
        }
        if (!this.bannerOn) {
            this.ad.showBanner(style);
            this.bannerOn = true;
            console.log("Banner广告已显示");
        }
    }

    /**
     * 隐藏Banner广告
     */
    public hideBanner(): void {
        if (!this.ad) {
            console.warn("广告平台未初始化");
            return;
        }
        if (this.bannerOn) {
            this.ad.hideBanner();
            this.bannerOn = false;
            console.log("Banner广告已隐藏");
        }
    }

    /**
     * 切换Banner广告显示状态
     */
    public toggleBanner(style: number = 2): void {
        if (this.bannerOn) {
            this.hideBanner();
        } else {
            this.showBanner(style);
        }
    }

    /**
     * 显示激励视频
     * @param callback 回调函数：1-成功，0-中途退出，2-加载失败
     */
    public showRewardedVideo(callback?: (result: number) => void): void {
        if (!this.ad) {
            console.warn("广告平台未初始化");
            callback && callback(2);
            return;
        }
        try {
            this.ad.showRewardedVideo(callback);
        } catch (error) {
            console.error("激励视频播放失败:", error);
            callback && callback(2);
        }
    }

    /**
     * 显示插屏广告
     * @param delay 延迟显示时间（秒）
     */
    public showInterstitialAd(delay: number = 0): void {
        if (!this.ad) {
            console.warn("广告平台未初始化");
            return;
        }

        console.log(`插屏广告将在${delay}秒后显示`);
        this.ad.showInterstitialAd(delay);
    }

    /**
     * 显示原生模板广告
     * @param callback 回调函数：1-成功，0-失败
     */
    public showCustomAd(callback: (result: number) => void): void {
        if (!this.ad) {
            console.warn("广告平台未初始化");
            callback(0);
            return;
        }
        if (!this.customOn) {
            this.ad.showCustomAd(callback);
            this.customOn = true;
        }
    }

    /**
     * 显示原生模板广告1
     * @param callback 回调函数：1-成功，0-失败
     */
    public showCustomAd1(callback: (result: number) => void): void {
        if (!this.ad) {
            console.warn("广告平台未初始化");
            callback(0);
            return;
        }
        if (!this.customOn1) {
            this.ad.showCustomAd1(callback);
            this.customOn1 = true;
        }
    }

    /**
     * 隐藏原生模板广告1
     */
    public hideCustomAd1(): void {
        if (!this.ad) {
            console.warn("广告平台未初始化");
            return;
        }
        if (this.customOn1) {
            this.ad.hideCustomAd1();
            this.customOn1 = false;
        }
    }

    /**
     * 显示分享
     * @param queryString 分享参数
     * @param callback 回调函数：1-成功，0-失败
     */
    public showShare(queryString: string = '', callback?: (result: number) => void): void {
        if (!this.ad) {
            console.warn("广告平台未初始化");
            callback && callback(0);
            return;
        }

        this.ad.showShare(queryString, callback);
    }

    /**
     * 获取启动参数
     */
    public getLaunchOption(): any {
        return this.ad?.getLaunchOption() || {};
    }

    /**
     * 获取场景值
     */
    public getScene(): number {
        return this.ad?.getScene() || 0;
    }

    /**
     * 关闭所有广告
     */
    public closeAllAd(): void {
        this.hideBanner();
        this.hideCustomAd1();
        console.log("所有广告已关闭");
    }

    /**
     * 获取当前平台类型
     */
    public getCurrentPlatform(): string {
        const system = sys.platform;
        switch (system) {
            case sys.Platform.BYTEDANCE_MINI_GAME:
                return 'dy';
            case sys.Platform.WECHAT_GAME:
                return 'wx';
            case sys.Platform.ANDROID:
                return 'android';
            default:
                return 'unknown';
        }
    }

    /**
     * 检查广告平台是否可用
     */
    public isAdAvailable(): boolean {
        return this.ad !== null;
    }

    /**
     * 获取广告状态
     */
    public getAdStatus(): {
        banner: boolean;
        custom: boolean;
        custom1: boolean;
        platform: string;
    } {
        return {
            banner: this.bannerOn,
            custom: this.customOn,
            custom1: this.customOn1,
            platform: this.getCurrentPlatform()
        };
    }
}
export const adMgr = AdMgr.instance;