import { sys } from 'cc';
import { native } from 'cc';
import { _decorator, Component, Node } from 'cc';
import { uiMgr } from '../../RS/core/Managers/UIMgr';
const { ccclass, property } = _decorator;

@ccclass('PopNativePlatform')
export class PopNativePlatform extends Component {
    start() {
        if (sys.platform != sys.Platform.ANDROID) {
            uiMgr.showToast("当前不是android环境")
        }
    }

    update(deltaTime: number) {

    }
    private jsbTest() {
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
}


