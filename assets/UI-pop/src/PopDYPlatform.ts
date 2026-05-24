import { _decorator, Component, Node } from 'cc';
import { adMgr } from '../../RS/core/Managers/AdMgr';
import { uiMgr } from '../../RS/core/Managers/UIMgr';
const { ccclass, property } = _decorator;

@ccclass('PopDYPlatform')
export class PopDYPlatform extends Component {
    start() {

    }

    update(deltaTime: number) {

    }
    private login() {

    }
    private rank() {

    }
    private share(){
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