import { Node, Prefab, instantiate, log, warn } from 'cc';
import { assetManager } from 'cc';
import { NormalMessage } from '../script/NormalMessage';
import { VerifyPanel } from '../script/VerifyPanel';
import { NoticeMessagePanel } from '../script/NoticeMessagePanel';
import { ITextImgItem, MainMoney } from '../common/SelfLib';
import { Default_Resources, UIPanelType } from '../common/Constant';
import { poolsMgr } from './PoolsMgr';
import { eventMgr } from './EventMgr';
import { bundleMgr } from './BundleMgr';
import { LoadingWait } from '../script/LoadingWait';
import { TextMessage } from '../script/TextMessage';
type UIMap = { [key: string]: { node: Node, prefab: Prefab }[] };
export class UIMgr {
    private static _instance: UIMgr = new UIMgr();
    private _panelRoots: Record<UIPanelType, Node> = {} as any;
    public static getInstance(): UIMgr {
        return this._instance;
    }

    private _uiCache: UIMap = {};
    private _uiRoot: Node;

    private constructor() { }

    /**初始化
     * @param uiRoot UI 根节点
     */
    init(panelRoots: Record<UIPanelType, Node>) {
        this._panelRoots = panelRoots;
    }

    /**
     * 打开 UI 窗口
     * @param name ui名称
     * @param path 路径
     * @param type 挂载容器类型
     * @param callback 加载完成回调，返回目标节点
     * @param bundleName 包名，如果不在rs的资源包内的话
     */
    public async open(name: string, path: string, type: UIPanelType = UIPanelType.normal, callback?: (node: Node) => void, bundleName: string = null): Promise<void> {
        if (!this._panelRoots[type]) {
            warn(`[UIMgr] 未找到指定的挂载容器：${type}`);
            return;
        }
        const cacheKey = name;
        // 检查对象池
        if (poolsMgr.has(cacheKey)) {
            let node = poolsMgr.get(cacheKey);
            node.active = true;
            this._panelRoots[type].addChild(node);
            this._panelRoots[type].active = true;
            this._uiCache[cacheKey] = this._uiCache[cacheKey] || [];
            this._uiCache[cacheKey].push({ node, prefab: null });
            callback?.(node);
            return;
        }

        // 检查缓存
        if (this._uiCache[cacheKey]) {
            for (let i = 0; i < this._uiCache[cacheKey].length; i++) {
                const cached = this._uiCache[cacheKey][i];
                if (!cached.node.parent) {
                    this._panelRoots[type].addChild(cached.node);
                    this._panelRoots[type].active = true;
                    cached.node.active = true;
                    callback?.(cached.node);
                    return;
                }
            }
        }

        // 加载 Prefab
        const loadPrefab = (bundle: any) => {
            bundle.load(path, Prefab, (err, prefab_res: Prefab) => {
                if (err || !prefab_res) {
                    warn(`[UIMgr] 加载 UI 失败：${name + path}`, err);
                    return;
                }
                const node_ins = instantiate(prefab_res);
                this._uiCache[cacheKey] = this._uiCache[cacheKey] || [];
                this._uiCache[cacheKey].push({ node: node_ins, prefab: prefab_res });
                this._panelRoots[type].addChild(node_ins);
                node_ins.active = true;
                this._panelRoots[type].active = true;
                eventMgr.category("loadingWait").emit("closeCurLoadingWait")
                callback?.(node_ins);
            });
        };
        if (name != "loading_wait" && type != UIPanelType.toast) {
            eventMgr.category("loadingWait").once("beginWait", async () => {
                if (bundleName != null) {
                    bundleMgr.getBundle(bundleName).then(bundle => {
                        loadPrefab(bundle);
                    });
                } else {
                    loadPrefab(await bundleMgr.getBundle(Default_Resources));
                }
            })
            this.showloading_wait()
        } else {
            if (bundleName != null) {
                bundleMgr.getBundle(bundleName).then(bundle => {
                    loadPrefab(bundle);
                });
            } else {
                loadPrefab(await bundleMgr.getBundle(Default_Resources));
            }
        }

    }

    /**
     * 关闭 UI
     * @param key 对应 UI 标识
     * @param destroyAll 是否销毁所有同类节点（默认 false）
     * @param targetNode 销毁目标节点
     */
    public close(key: string, destroyAll: boolean = false, targetNode: Node = null): void {
        const storeNodes = this._uiCache[key];
        if (!storeNodes) {
            targetNode.removeFromParent();
            targetNode.destroy()
            warn(`[UIMgr] 关闭失败，未找到 UI：${key}`);
            return;
        }
        if (targetNode != null) {
            const index = storeNodes.findIndex(item => item.node === targetNode);
            if (index !== -1) {
                const { node, prefab } = storeNodes[index];
                node.active = false;
                node.removeFromParent();
                if (!poolsMgr.has(key)) {
                    node.destroy();
                } else {
                    poolsMgr.put(key, node);
                }
                storeNodes.splice(index, 1);
            }
            if (storeNodes.length == 0) {
                delete this._uiCache[key];
            }
        }
        if (destroyAll) {
            // 如果需要销毁所有同类节点
            for (let i = 0; i < storeNodes.length; i++) {
                const { node, prefab } = storeNodes[i];
                node.active = false;
                node.removeFromParent();
                if (!poolsMgr.has(key)) {
                    node.destroy();
                    prefab?.decRef();
                } else {
                    poolsMgr.put(key, node);
                }
            }
            delete this._uiCache[key];
        }
    }

    /**
     * 获取已打开的 UI 节点
     */
    public get(key: string): Node[] {
        return this._uiCache[key]?.map(item => item.node) || [];
    }

    /**
     * 判断 UI 是否存在
     */
    public has(key: string): boolean {
        return !!this._uiCache[key] && this._uiCache[key].length > 0;
    }

    /**
     * 清除所有 UI 缓存
     * @param destroy 是否销毁节点（默认 true）
     * @param closeToast 是否关闭 Toast节点下的的激活 UI（默认 true）
     * @param onProgress 每处理一个节点时的回调：(current, total, key) => void
     */
    public clearAll(destroy: boolean = true, forceClose: boolean = true, onProgress?: (current: number, total: number, key: string) => void): void {
        const keys = Object.keys(this._uiCache);
        const total = keys.length;
        let current = 0;
        let allDestroyed = true;
        for (const key of keys) {
            const nodes = this._uiCache[key];
            if (nodes) {
                let hadRemain = false;
                for (let i = 0; i < nodes.length; i++) {
                    const { node, prefab } = nodes[i];
                    if (!forceClose && node.parent == this._panelRoots[UIPanelType.toast] && node.active) {
                        hadRemain = true
                        allDestroyed = false
                        continue
                    }
                    node.removeFromParent();
                    if (destroy) {
                        if (!poolsMgr.has(key)) {
                            node.destroy();
                            prefab?.decRef();
                        }
                    }
                }
                if (!hadRemain) {
                    delete this._uiCache[key];
                }
                current++;
                if (onProgress) {
                    onProgress(current, total, key);
                }
            }
        }
        if (destroy && allDestroyed) {
            this._uiCache = {};
        }
    }

    /**普通短信息
     * @param message 消息文本
     * @param duration 显示时长
     */
    public showToast(message: string, duration: number = 0.6, type: "success" | "normal" | "warn" | "error" = "normal") {
        this.open("normalToast", "prefab/ui/base/normalToast", UIPanelType.toast, (node) => {
            if (node) {
                node.getComponent(NormalMessage).show(message, duration, type)
            }
        })
    }
    /**普通长信息
     * @param name 标题
     * @param content 内容
     * @param textImgList 图片列表
     */
    public showText(name: string, content: string, textImgList?: ITextImgItem[]) {
        this.open("textMessage", "prefab/ui/base/textMessage", UIPanelType.toast, (node) => {
            if (node) {
                node.getComponent(TextMessage).display(name, content, textImgList)
            }
        })
    }


    /**等待弹窗
     * @param longWaitTime 长时间等待时间自主按钮关闭，默认10秒
     */
    public showloading_wait(longWaitTime: number = 10) {
        this.open("loading_wait", "prefab/ui/base/loading_wait", UIPanelType.normal, (node) => {
            if (node) {
                node.getComponent(LoadingWait).beginWait(longWaitTime)
                return node
            }
        })
    }

    /**普通确认面板
     * @param title 标题
     * @param content 内容
     * @param callback 回调函数，参数为是否确认 true为确认
     */
    public showVerifyPanel(title: string = "请确认", content: string = "确认吗", callback: (isConfirmed: boolean) => void = () => { }) {
        this.open("normalVerifyPanel", "prefab/ui/base/normalVerifyPanel", UIPanelType.normal, (node) => {
            if (node) {
                node.getComponent(VerifyPanel).init(title, content, callback)
            }
        })
    }
    /**确认面板(异步)
     * @param title 标题
     * @param content 内容
     * @param moneyMap 消耗的货币
     * @param callback 回调函数，参数为是否确认 true为确认
     */
    public showVerifyAsync(title: string, msg: string): Promise<boolean> {
        return new Promise((resolve) => {
            this.showVerifyPanel(title, msg, (isConfirmed: boolean) => {
                resolve(isConfirmed);
            });
        });
    }


    /**普通消息通知面板
     * @param content 内容
     * @param title 标题,默认“提示”
     * @param callback 回调函数，参数为是否确认 true为确认
     * @param moneyMap 消耗的货币,如果传入则默认使用货币的富文本面板
     */
    public showNorMalMessagePanel(content: string, title: string = "提示", callback: (isConfirmed: boolean) => void = () => { }) {
        this.open("noticeMessagePanel", "prefab/ui/base/noticeMessagePanel", UIPanelType.normal, (node) => {
            if (node) {
                node.getComponent(NoticeMessagePanel).init(title, content, callback)
            }
        })
    }


    /**开发者面板*/
    public showDeveloperPanel() {
        this.open("DeveloperPanel", "prefab/ui/pop/DeveloperPanel", UIPanelType.normal, (node) => {
        })
    }

}
export const uiMgr = UIMgr.getInstance()