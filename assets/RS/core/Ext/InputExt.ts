import { EventTouch, input, Input } from 'cc';
//@ts-ignore
if (!input["__$touchStartExtension$__"]) {
    input["__$touchStartExtension$__"] = true;
    input.on(Input.EventType.TOUCH_START, myGlobalTouchStartHandler1, input);
}

function myGlobalTouchStartHandler1(event: EventTouch) {
    //在这儿增加函数可在点击无按钮组件节点时执行
    // rs.audio.playEffect(AudioConfig.getUi(rs.enum.FileName_audioUi.btn_click))

}

