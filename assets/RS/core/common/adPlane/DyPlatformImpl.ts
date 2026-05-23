import { IAdConfig, IAdPlatform } from "../lib";
import { sys } from "cc";
import { NOW_IN_TEST } from "../Constant";
import { eventMgr } from "../../Managers/EventMgr";

export class DyPlatformImpl implements IAdPlatform {
    private tt = window["tt"];
    private banner: any = null;
    private rewardVideo2: any = null;
    private custom1: any = null;
    private selfConfig: IAdConfig;
    /**tt.onShow 回调数据 */
    onshowOp: any
    private _keyboardCb?: (data: any) => void;
    private _innerKeyboardCb?: (data: any) => void;
    private shareTime: number = 0;
    private shareSuccCallBack: Function = null;
    private shareFailCallBack: Function = null;
    public constructor(config: IAdConfig) {
        if (!this.tt) {
            console.warn("非抖音平台");
            return;
        }
        this.selfConfig = config;
        this.init();
    }

    private init(): void {
        this.tt.onShow((op: any) => {
            console.log(`抖音平台`);
            console.log(op);
            this.onshowOp = op;
            eventMgr.category("dyPlatform").emit("onshow");
            this.onShow(op);
        });

        this.tt.showShareMenu({
            withShareTicket: true,
            menus: ['shareAppMessage', 'shareTimeline']
        });

        this.tt.onShareAppMessage(() => {
            return {
                // title: ShareConfig.title,
                // imageUrl: ShareConfig.imageUrl,
                // imageUrlId: ShareConfig.imageUrlId,
            };
        });
    }

    private onShow(res: any): void {
        if (this.shareTime <= 0) return;

        const duration: number = Date.now() - this.shareTime;
        this.shareTime = 0;

        if (duration >= 3000) {
            console.log(`抖音分享 --> 分享成功`);
            this.showToast("分享成功");
            this.shareSuccCallBack && this.shareSuccCallBack();
        } else {
            console.log(`抖音分享 --> 分享失败`);
            this.showToast("分享失败");
            this.shareFailCallBack && this.shareFailCallBack();
        }
    }

    private showToast(tip: string, icon: string = "none", duration: number = 1500): void {
        if (!this.tt) return;

        this.tt.showToast({
            "title": tip,
            "icon": icon,
            "duration": duration
        });
    }
    /**检查是否支持侧边栏 */
    public checkScene(cb: (ok: boolean) => void) {
        this.tt.checkScene({
            scene: "sidebar",
            success: (res) => {
                console.log(res);
                cb(!!res?.isExist);
            },
            fail: () => {
                cb(false);
            }
        });
    }
    /**自动跳转侧边栏 */
    public navigateToScene(cb: (ok: boolean) => void) {
        this.tt.navigateToScene({
            scene: "sidebar",
            success: (res) => {
                cb(!!res?.isExist);
            },
            fail: () => {
                cb(false);
            }
        });
    }
    /** 监听键盘完成 */
    public onKeyboardComplete(cb: (data: any) => void) {
        this._keyboardCb = cb;

        if (!this._innerKeyboardCb) {
            this._innerKeyboardCb = (data: any) => {
                if (NOW_IN_TEST) {
                    console.log("onKeyboardComplete", data);
                }
                this._keyboardCb?.(data);
            };
            this.tt.onKeyboardComplete(this._innerKeyboardCb);
        }
    }

    /** 取消监听键盘完成 */
    public offKeyboardComplete() {
        if (this._innerKeyboardCb) {
            this.tt.offKeyboardComplete(this._innerKeyboardCb);
            this._innerKeyboardCb = undefined;
            this._keyboardCb = undefined;
        }
    }
    public showBanner(style: number = 2): void {
        const id = this.selfConfig.bannerId?.[0];
        if (!this.tt || !id) return;

        if (this.banner != null) {
            this.banner.destroy();
            this.banner = null;
            return;
        }

        const winSize = this.tt.getSystemInfoSync();
        const targetBannerAdWidth = 300;

        const bannerAd = this.tt.createBannerAd({
            adUnitId: id,
            adIntervals: 30,
            style: {
                top: winSize.windowHeight,
                width: targetBannerAdWidth,
            }
        });

        bannerAd.style.left = (winSize.windowWidth - targetBannerAdWidth) / 2;

        bannerAd.onResize((size: any) => {
            bannerAd.style.top = winSize.windowHeight - size.height / 2 + 20;
            bannerAd.style.left = (winSize.windowWidth - size.width) / 2;
        });

        bannerAd.onLoad(() => {
            console.log('抖音banner广告加载成功');
            this.banner = bannerAd;
            bannerAd.show();
        });

        bannerAd.onError((err: any) => {
            console.log('抖音banner广告加载错误', err);
        });
    }

    public hideBanner(): void {
        if (this.banner != null) {
            this.banner.destroy();
            this.banner = null;
        }
    }

    public showRewardedVideo(callback?: Function): void {
        if (!this.tt) return;

        const videoCloseHandler = (res: any) => {
            if (res && res.isEnded) {
                console.log('抖音激励视频播放完成');
                callback && callback(1);
                rewardedVideoAd.offClose(videoCloseHandler);
            } else {
                console.log('抖音激励视频播放中途退出');
                rewardedVideoAd.offClose(videoCloseHandler);
                callback && callback(0);
            }
        };

        const id = this.selfConfig.videoId?.[0];
        if (!id) return;

        if (this.rewardVideo2 != null) {
            this.rewardVideo2.offClose(videoCloseHandler);
        }

        const rewardedVideoAd = this.tt.createRewardedVideoAd({
            adUnitId: id,
        });

        this.rewardVideo2 = rewardedVideoAd;

        rewardedVideoAd.load().then(() => {
            this.tt.showToast({
                title: "加载中，请稍后",
                icon: 'success',
                duration: 1500,
            });

            console.log('抖音激励视频广告加载成功');
            rewardedVideoAd.show().then(() => {
                rewardedVideoAd.onClose(videoCloseHandler);
            });
        });

        let showToastState = false;
        rewardedVideoAd.onError((err: any) => {
            console.log('抖音激励视频广告显示失败', err);
            if (!showToastState) {
                showToastState = true;
                this.tt.showToast({
                    title: "请稍后再试",
                    icon: 'fail',
                    duration: 1500,
                });
            }
            callback && callback(2);
        });
    }

    public showInterstitialAd(delay: number = 5): void {
        const id = this.selfConfig.intersitialId?.[0];
        if (!this.tt || !id) return;

        const interstitialAd = this.tt.createInterstitialAd({
            adUnitId: id,
        });

        if (interstitialAd) {
            interstitialAd.load().then(() => {
                console.log('抖音插屏广告加载成功');
            });

            interstitialAd.onClose((res: any) => {
                console.log('关闭抖音插屏广告', res);
            });

            interstitialAd.onError((err: any) => {
                console.log('抖音插屏广告加载失败', err);
            });

            setTimeout(() => {
                interstitialAd.show().catch((err: any) => {
                    console.log('抖音插屏广告展示失败', err);
                });
            }, delay * 1000);
        }
    }

    public showCustomAd(callback: Function): void {
        console.log('抖音showCustomAd暂未实现');
        callback(0);
    }

    public showCustomAd1(callback: Function): void {
        const id = this.selfConfig.customId1?.[0];
        if (!this.tt || !id) {
            callback(0);
            return;
        }

        const winSize = this.tt.getSystemInfoSync();
        const style = {
            width: 128,
            left: 64,
            top: 300,
            fixed: 0,
        };

        if (this.custom1) {
            this.custom1.show();
            return;
        }

        const CustomAd = this.tt.createBlockAd({
            adUnitId: id,
            orientation: 'vertical',
            size: 1,
            style: style
        });

        CustomAd.onLoad(() => {
            console.log('抖音原生模板广告加载成功');
            callback(1);
            CustomAd.show()
                .then(() => console.log('抖音原生模板广告显示成功'))
                .catch((err: any) => {
                    console.log("抖音原生模板广告显示失败", err);
                    callback(0);
                });
            this.custom1 = CustomAd;
        });

        CustomAd.onError((err: any) => {
            console.log('抖音原生模板广告加载失败：', err);
            callback(0);
        });
    }

    public hideCustomAd1(): void {
        if (this.custom1) {
            this.custom1.hide();
            this.custom1 = null;
        }
    }

    public showShare(queryString: string = '', callback?: Function): void {
        if (!this.tt || sys.platform !== sys.Platform.BYTEDANCE_MINI_GAME) {
            callback && callback(0);
            return;
        }

        console.log(`抖音分享 --> 拉起分享`);

        this.shareTime = Date.now();
        if (callback) {
            this.shareSuccCallBack = () => callback(1);
            this.shareFailCallBack = () => callback(0);
        }

        this.tt.shareAppMessage({
            // templateId:ShareConfig.templateId,
            // title: ShareConfig.title,
            // imageUrl: ShareConfig.imageUrl,
            // imageUrlId: ShareConfig.imageUrlId,
            query: queryString
        });
    }

    public getLaunchOption(): any {
        return this.tt?.getLaunchOptionsSync()?.query || {};
    }

    public getScene(): number {
        return this.tt?.getLaunchOptionsSync()?.scene || 0;
    }
}