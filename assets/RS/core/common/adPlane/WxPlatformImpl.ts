import { IAdConfig, IAdPlatform } from "../lib";
import { sys } from "cc";

export class WxPlatformImpl implements IAdPlatform {
    private wx=window['wx']
    private bannerAd: any = null;
    private rewardedVideoAd: any = null;
    private interstitialAd: any = null;
    private customAd: any = null;
    private customAd1: any = null;
    private timeId: any = null;
    private shareTime: number = 0;
    private shareSuccCallBack: Function = null;
    private shareFailCallBack: Function = null;
    
    private selfConfig: IAdConfig;
    private windowWidth: number = 0;
    private windowHeight: number = 0;

    public constructor(config: IAdConfig) {
        if (!this.wx) {
            console.warn("非微信平台");
            return;
        }
        this.selfConfig = config;
        this.init();
    }

    private init(): void {
        if (!this.wx) return;

        // 获取系统信息
        const sysInfo = this.wx.getSystemInfoSync();
        this.windowWidth = sysInfo.windowWidth;
        this.windowHeight = sysInfo.windowHeight;

        // 显示分享菜单
        this.wx.showShareMenu({
            withShareTicket: true,
            menus: ['shareAppMessage', 'shareTimeline']
        });

        // 监听分享回调
        this.wx.onShow((res) => {
            console.log(`微信 --> 回到前台`, res);
            this.onShow(res);
        });

        this.wx.onHide(() => {
            console.log(`微信 --> 退到后台`);
        });

        // 预加载激励视频
        this.preloadRewardedVideo();
        // 初始化原生模板广告
        this.initCustomAd1();
    }

    private preloadRewardedVideo(): void {
        const id = this.selfConfig.videoId?.[0];
        if (!id) return;

        this.rewardedVideoAd = this.wx.createRewardedVideoAd({ adUnitId: id });
        this.rewardedVideoAd.load().catch((err: any) => {
            console.error('WxPlatform', '激励视频预加载失败:', err);
        });
    }

    private initCustomAd1(): void {
        const id = this.selfConfig.customId1?.[0];
        if (!id) return;

        const winSize = this.wx.getSystemInfoSync();
        const style = {
            width: winSize.screenWidth * 0.85,
            left: 0.08 * winSize.screenWidth,
            top: 105,
            fixed: 0,
        };

        const CustomAd = this.wx.createCustomAd({
            adUnitId: id,
            style: style
        });

        CustomAd.onLoad(() => {
            this.customAd1 = CustomAd;
        });

        CustomAd.onClose((res: any) => {
            console.log('关闭微信原生模板广告', res);
        });

        CustomAd.onError((err: any) => {
            console.log('微信原生模板广告加载失败：', err);
        });
    }

    // ============ Banner广告 ============
    public showBanner(style?: number): void {
        if (!this.wx) return;

        const id = this.selfConfig.bannerId?.[0];
        if (!id) return;

        // 如果已经存在，先销毁
        if (this.bannerAd) {
            this.bannerAd.destroy();
            this.bannerAd = null;
        }

        // 创建banner
        this.bannerAd = this.wx.createBannerAd({
            adUnitId: id,
            adIntervals: 60,
            style: {
                width: this.windowWidth,
                left: 0,
                top: 0
            }
        });

        if (!this.bannerAd) {
            console.error('WxPlatform', 'Banner创建失败');
            return;
        }

        this.bannerAd.onLoad(() => {
            console.log('微信banner广告加载成功');
        });

        // 调整banner位置到底部
        this.bannerAd.onResize(() => {
            this.bannerAd.style.top = this.windowHeight - this.bannerAd.style.realHeight;
        });

        this.bannerAd.onError((e: any) => {
          console.error('WxPlatform', 'Banner报错', e.errCode, e.errMsg);
        });

        this.bannerAd.show().then(() => {
           console.log('WxPlatform', 'Banner展示成功');
        }).catch((err: any) => {
          console.error('WxPlatform', 'Banner展示失败', err);
        });
    }

    public hideBanner(): void {
        if (this.bannerAd) {
            this.bannerAd.hide();
            console.log('WxPlatform', 'Banner隐藏成功');
        }
    }

    // ============ 激励视频 ============
    public showRewardedVideo(callback?: Function): void {
        if (!this.wx) {
            callback && callback(0);
            return;
        }

        const id = this.selfConfig.videoId?.[0];
        if (!id) {
            callback && callback(0);
            return;
        }

        // 创建新的激励视频广告实例
        const rewardedVideoAd = this.wx.createRewardedVideoAd({ adUnitId: id });

        // 错误处理
        rewardedVideoAd.onError((res: any) => {
          console.error('WxPlatform', '激励视频播放失败:', res.errMsg);
            this.showToast("视频拉取失败");
            callback && callback(2);
        });

        // 显示激励视频
        rewardedVideoAd.show().catch((err: any) => {
            // 如果显示失败，尝试重新加载再显示
            rewardedVideoAd.load().then(() => rewardedVideoAd.show());
        });

        // 关闭回调
        rewardedVideoAd.onClose((res: any) => {
            if (!rewardedVideoAd) return;
            
            if (res && res.isEnded || res === undefined) {
                // 正常播放结束，下发奖励
                console.log('微信激励视频播放完成');
                callback && callback(1);
            } else {
                // 播放中途退出，不下发奖励
                console.log('微信激励视频播放中途退出');
                this.showToast("中途退出，不下发奖励");
                callback && callback(0);
            }
        });
    }

    // ============ 插屏广告 ============
    public showInterstitialAd(delay: number = 0): void {
        if (!this.wx) return;

        const id = this.selfConfig.intersitialId?.[0];
        if (!id) return;

        const interstitialAd = this.wx.createInterstitialAd({
            adUnitId: id
        });

        interstitialAd.load().then(() => {
            console.log('WxPlatform', '插屏广告加载成功');
            
            setTimeout(() => {
                interstitialAd.show().then(() => {
                    console.log('WxPlatform', '插屏展示成功');
                }).catch((err: any) => {
                  console.error('WxPlatform', '插屏展示失败', err);
                });
            }, delay * 1000);
        }).catch((err: any) => {
          console.error('WxPlatform', '插屏加载失败', err);
        });

        interstitialAd.onClose((res: any) => {
            console.log('关闭微信插屏广告', res);
        });

        interstitialAd.onError((err: any) => {
            console.log('微信插屏广告加载失败', err);
        });
    }

    // ============ 原生模板广告 ============
    public showCustomAd(callback: Function): void {
        if (!this.wx) {
            callback(0);
            return;
        }

        if (this.timeId) {
            clearTimeout(this.timeId);
            this.timeId = null;
        }

        const id = this.selfConfig.customId?.[0];
        if (!id) {
            callback(0);
            return;
        }

        const winSize = this.wx.getSystemInfoSync();
        const style = {
            width: winSize.screenWidth / 1.5,
            left: (winSize.screenWidth - winSize.screenWidth / 1.5) / 0.4 - 15,
            top: 100,
            fixed: 0
        };

        if (this.customAd) {
            this.customAd.show();
            return;
        }

        const CustomAd = this.wx.createCustomAd({
            adUnitId: id,
            style: style
        });

        CustomAd.onLoad(() => {
            console.log('微信原生模板广告加载成功');
            callback(1);
            CustomAd.show()
                .then(() => console.log('微信原生模板广告显示成功'))
                .catch((err: any) => {
                    this.customAd = null;
                    this.timeId = setTimeout(() => this.showCustomAd(callback), 5 * 1000);
                    console.log("微信原生模板广告显示失败", err);
                    callback(0);
                });
            this.customAd = CustomAd;
        });

        CustomAd.onClose(() => {
            this.customAd = null;
            this.timeId = setTimeout(() => this.showCustomAd(callback), 5 * 1000);
            console.log('关闭微信原生模板广告');
        });

        CustomAd.onError((err: any) => {
            this.customAd = null;
            this.timeId = setTimeout(() => this.showCustomAd(callback), 5 * 1000);
            console.log('微信原生模板广告加载失败：', err);
            callback(0);
        });
    }

    public showCustomAd1(callback: Function): void {
        if (this.customAd1) {
            this.customAd1.show()
                .then(() => callback(1))
                .catch(() => callback(0));
        } else {
            callback(0);
        }
    }

    public hideCustomAd1(): void {
        if (this.customAd1) {
            this.customAd1.hide();
        }
    }

    // ============ 分享功能 ============
    public showShare(queryString: string = '', callback?: Function): void {
        if (!this.wx || sys.platform !== sys.Platform.WECHAT_GAME) {
            callback && callback(0);
            return;
        }

        console.log(`微信分享 --> 拉起分享`);

        this.shareTime = Date.now();
        if (callback) {
            this.shareSuccCallBack = () => callback(1);
            this.shareFailCallBack = () => callback(0);
        }

        // 执行分享
        this.wx.shareAppMessage({
            // title: ShareConfig.title,
            // imageUrlId: ShareConfig.imageUrlId,
            // imageUrl: ShareConfig.imageUrl,
            query: queryString
        });
    }

    private onShow(res: any): void {
        if (this.shareTime <= 0) return;
        
        const duration: number = Date.now() - this.shareTime;
        this.shareTime = 0;
        
        if (duration >= 3000) { // ShareSuccessDuration
            console.log(`微信分享 --> 分享成功`);
            this.showToast("分享成功");
            this.shareSuccCallBack && this.shareSuccCallBack();
        } else {
            console.log(`微信分享 --> 分享失败`);
            this.showToast("分享失败");
            this.shareFailCallBack && this.shareFailCallBack();
        }
        
    }

    // ============ 工具方法 ============
    private showToast(tip: string, icon: string = "none", duration: number = 1500): void {
        if (!this.wx) return;
        
        this.wx.showToast({
            "title": tip,
            "icon": icon,
            "duration": duration
        });
    }

    public getLaunchOption(): any {
        return this.wx?.getLaunchOptionsSync()?.query || {};
    }

    public getScene(): number {
        return this.wx?.getLaunchOptionsSync()?.scene || 0;
    }

}