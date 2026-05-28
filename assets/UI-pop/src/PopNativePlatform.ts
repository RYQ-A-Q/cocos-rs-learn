import { sys } from 'cc';
import { native } from 'cc';
import { _decorator, Component, Node } from 'cc';
import { uiMgr } from '../../RS/core/Managers/UIMgr';
const { ccclass, property } = _decorator;

@ccclass('PopNativePlatform')
export class PopNativePlatform extends Component {
    onLoad() {
        if (sys.platform != sys.Platform.ANDROID) {
            uiMgr.showToast("当前不是android环境")
            return
        }
        this.registerNativeListener();
    }

    update(deltaTime: number) {

    }
    private nativeTest() {
        console.log("开始测试震动")
        native.reflection.callStaticMethod(
            "com/cocos/game/TestBridge",      // 包名/类名
            "showToast",                       // 方法名
            "(Ljava/lang/String;I)V",         // 签名：String + int，返回 void
            "Hello from rs-Cocos!",              // message
            200                               // durationMs（震动毫秒）
        );
    }
    // 通知栏测试
    private testNotification() {
        native.reflection.callStaticMethod(
            "com/cocos/game/TestBridge",
            "showNotification",
            "(Ljava/lang/String;Ljava/lang/String;)V",
            "游戏通知",           // title
            "这是一条来自 rs-cocos-app 的测试消息"  // content
        );
    }


    /** ========== JS → Java ========== */

    screenshot() {
        native.bridge.sendToNative(JSON.stringify({
            action: 'screenshot'
        }));
    }

    location(highAccuracy = false) {
        native.bridge.sendToNative(JSON.stringify({
            action: 'location',
            highAccuracy
        }));
    }

    deviceInfo() {
        native.bridge.sendToNative(JSON.stringify({
            action: 'deviceInfo'
        }));
    }

    networkState() {
        native.bridge.sendToNative(JSON.stringify({
            action: 'networkState'
        }));
    }

    /** ========== Java → JS ========== */
    registerNativeListener() {
        native.bridge.onNative = (msg: string) => {
            let json: any;
            try {
                json = JSON.parse(msg);
            } catch {
                uiMgr.showText('Native Error', msg);
                return;
            }

            const action = json.action;
            const data = json.data;
            switch (action) {
                case 'screenshot':
                    uiMgr.showText('截屏结果', data);
                    break;
                case 'location':
                    uiMgr.showText('定位信息', this.format(data));
                    break;
                case 'deviceInfo':
                    uiMgr.showText('设备信息', this.format(data));
                    break;
                case 'networkState':
                    uiMgr.showText('网络状态', this.format(data));
                    break;
                default:
                    uiMgr.showText(action, data);
            }

            console.log('[Native]', action, data);
        };
    }

    format(obj: any): string {
        if (typeof obj === 'string') return obj;
        try {
            return JSON.stringify(JSON.parse(obj), null, 2);
        } catch {
            return String(obj);
        }
    }
}


