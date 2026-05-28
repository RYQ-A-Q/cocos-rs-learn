import { _decorator, Component, Node } from 'cc';
import { adMgr } from '../../RS/core/Managers/AdMgr';
import { uiMgr } from '../../RS/core/Managers/UIMgr';
import { sys } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PopDYPlatform')
export class PopDYPlatform extends Component {
    start() {
        if (sys.platform != sys.Platform.BYTEDANCE_MINI_GAME) {
            uiMgr.showToast("当前不是抖音环境")
        }
    }

    update(deltaTime: number) {

    }
    /**
     * 抖音登录
     */
    private login() {
        if (adMgr.ad && adMgr.ad.login) {
            uiMgr.showToast("正在登录...");
            adMgr.ad.login((success: boolean, userInfo?: any, error?: string) => {
                if (success) {
                    uiMgr.showToast("登录成功！");
                    console.log("用户信息:", userInfo);

                    // 这里可以处理登录成功后的逻辑
                    // 例如：保存用户信息、更新UI等
                } else {
                    uiMgr.showToast(`登录失败: ${error}`);
                    console.error("登录失败:", error);
                }
            });
        } else {
            uiMgr.showToast("当前平台不支持登录");
        }
    }
    private rank() {

    }
    /**侧边栏 */
    private gotoLeftPanel() {
        adMgr.ad.navigateToScene((res: boolean) => {
            console.log(adMgr.ad?.onshowOp)
            console.log(res)
            // if (res) {
            if (adMgr.ad?.onshowOp?.scene == "021036") {//这里最好单独存储变量来二次检查入口场景，在开发模拟器中可能响应不正确
                uiMgr.showToast("侧边栏！")
            }
            // }
        })

    }
    /**添加快捷 */
    private addShortcut() {
        adMgr.ad.addShortcut((res: boolean) => {
            if (res) {
                console.log("添加 " + res)
            }
        })

    }

    private share() {
        adMgr.showShare()
    }
    /**
     * banner广告
     */
    private ad_showBanner() {
        adMgr.showBanner(2)
    }
    /**激励广告 */
    private ad_showRewardedVideo() {
        adMgr.showRewardedVideo((res) => {
            if (res == 1) {
                // 观看成功，发放奖励
                uiMgr.showToast("激励视频观看成功");
            } else if (res == 0) {
                // 中途退出
                uiMgr.showToast("激励视频中途中断");
            } else if (res == 2) {
                // 加载失败
                uiMgr.showToast("激励视频加载失败");
            }
        })
    }
    /**
     * 插屏广告
     */
    private ad_showInterstitialAd() {
        adMgr.showInterstitialAd(0); // 立即显示插屏广告
    }
}