export const NOW_IN_TEST: boolean = true
export const Default_Resources="RS_sys"
export const Sys_EventCategory="rs_sys"
export enum UIPanelType {
    normal = "normal",
    toast="toast"
}
/**系统事件 */
export enum RsSysEvent {
    /**游戏数据更新 */
    USER_GAME_DATA_UPDATE = "USER_GAME_DATA_UPDATE",
    /**游戏数据保存 */
    USER_GAME_DATA_SAVE = "USER_GAME_DATA_SAVE",
    /**二次UI渲染响应 */
    UI_TWICE_REFRESH = "TWICE_UI_REFRESH",
    /**新增节点窗口 */
    UI_ADD_POP = "UI_ADD_POP"
}