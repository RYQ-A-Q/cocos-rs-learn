概述
VList 是一个高性能的虚拟列表组件，支持多种布局模式、滚动方式和分页功能。
# 事件
事件通过对列表所在节点进行注册和监听，示例如下：
``` typescript
var list:VList = this.getList();
list.node.on(VListEvent.OnLayout,this.onLayout,this);
list.node.off(VListEvent.OnScrolling,this.onScrolling,this);
```
* VListEvent.OnScrolling - 滚动和定位时触发
* VListEvent.OnLayout - 元素重新布局时触发
* VListEvent.OnResize - 该节点尺寸更改时触发
* VListEvent.OnTurnPage - 页面变更时触发（仅page模式下有效）
* VListEvent.OnFinishPage - 页面吸附完毕时触发（仅page模式下有效）
# 数据模型
## ILayoutInfo列表实时布局信息
* col:number - 运行时实际列数
* row:number - 运行时实际行数
* size:Size - 布局实际尺寸（即包括留白的列表项包围盒尺寸）
* boundSize:Size - 最小包围盒尺寸（即不包括留白的列表项包围盒尺寸）
* spaceX:number - 实际横向间隔
* spaceY:number - 实际纵向间隔
* num:number - 有效列表项数量（编辑器预览用，运行时可忽略此属性）
## 生命周期回调签名
type VCallback<T> = (info: IVListItemInfo<T>, renderItem?: IRenderItemInfo) => void
type VInitback<T> = (info: { get: ComCapture, getNode: NodeCapture, node: Node, list: VList<T>, parent: IVListItemInfo<any> }) => void
## IVListItemHooks列表项生命周期回调
### 回调字段
* onInstantiate?:VInitback - 当子项节点首次被实例化时调用
* onDestory?:VInitback - 当子项节点被清理时调用
* onData?:VCallback - 当子项触发刷新渲染时调用
* onShow?:VCallback - 当子项节点移入视口时调用
* onHide?:VCallback - 当子项节点移出视口时调用
* onUpdate?: (info: IVListItemInfo<T>, dt: number, renderItem?: IRenderItemInfo) => void; - 当子项显示时每帧调用
* onClick?:VCallback - 当子项节点被点击时调用
### 注意
1. 未开启循环时，定义VCallback回调函数时可以忽略renderItem?:IRenderItemInfo形参不接收，info:IVListItemInfo中的node就是正在操作的渲染项的node。
2. 开启循环时，各类回调的调用都是基于渲染项的变化，但仍可以只关注第一个形参info:IVListItemInfo，此形参中的node字段会及时在调用前更新为此次需要操作的渲染项的node。例如info.idx = 1的数据同时有两个渲染项a和b存在视口内，那么当滑动列表使第渲染项a消失时，仅调用一次onHide，此时形参中info的node指向a所渲染的node节点，形参中renderItem指向a所封装的渲染项信息。而对于onUpdate回调，由于渲染项a和b都存在于视口内，所以会调用两次onUpdate回调，第一次调用中形参中info的node指向a渲染的node，renderItem形参指向a的渲染项信息，而第二次调用中形参中info的node指向b渲染的node，renderItem形参指向b的渲染项信息。
3. 注意onInstantiate和onDestory的回调类型不是VCallback，是VInitback，不包含idx，data等数据信息，只用于预制体节点在构造和析构时的操作，禁止跟数据有任何直接联动
4. 触发onHide回调时，info中的node此时已不在视口内，处于已经被回收的状态，且该node对应的renderItem（即onHide回调的第二个参数）也已经不属于info，故node和renderItem当前为只读状态。
## IRenderItemInfo渲染项信息
* realIdx:number - 该渲染项实际的索引
* node: Node - 实际渲染的node（必不为空） 
* loopIdx: number - 循环轮数
* get: ComCapture - 通过key速查带有comPrefix的子组件
* getNode: NodeCapture - 通过key速查带有comPrefix的子节点
* isValid: boolean - 是否有效，当此渲染项从renderItems中移除，即不可见时时，将设置为false
* info: IVListItemInfo<T> - 当前渲染项所属的IVListItemInfo
## IVListItemInfo列表项核心信息
* idx:number - 当前列表项所在列表中的索引
* data:any - 当前列表项被分配的数据对象
* node:Node - 当前列表项引用的显示节点，当勾选isLoop后，该node始终保持为最近操作的渲染项节点
* isInLayout:boolean - 当前列表项是否参与布局，默认是，仅供外部修改，若设置为false，则保留当前状态，不再进行可见性检测和位置布局
* isVisible:boolean - 当前列表项是否可见
* get(key:string,ctor:new()=>Component):Component - 子组件速查句柄，通过key（带特殊前缀的节点全名）直接获取列表项渲染节点中对应的组件，仅在node不为空时可用
* getNode(key:string):Node - 子节点速查句柄，通过key（带特殊前缀的节点全名）直接获取列表项渲染节点的子节点
* call:(cb:VCallback, realIdx?: number):void - 安全对此列表项进行操作,如果指定 realIdx，则只对 realIdx指定的渲染项调用，否则对所有的渲染项调用
* list:VList - 当前列表项所处的列表组件
* parent:IVListItemInfo 当前列表作为子列表时，其在父列表中的列表项数据
* renderItems: IRenderItemInfo[] - 该数据在视口中的所有渲染项信息，当勾选isLoop后，一条数据项可能对应的多个节点的渲染信息，按照刷新顺序排序，越新的渲染项越靠后
# 属性
## 配置选项
* listType:EListType - 【只读】列表类型
* scrollDir:EScrollDir - 【只读】滚动方向
* itemPrefab:Prefab - 【只读】列表项预制体
* itemSize:Size - 【只读】列表项预制体原尺寸（要获取运行时实际的列表项尺寸请参考realItemSize）
* relativeList:Node[] - 【只读】关联列表节点数组
* allowScrollPage:boolean - 是否允许滑动翻页
* snapTime:number - （页面模式）页面的吸附时间
* turnSpeedThreshold:number - （页面模式）翻页速度阈值
* scrollThreshold:number - （页面模式）翻页滚动阈值
* fullPage:boolean - 【只读】（页面模式）是否单页铺满
* padding_top:number - 上边留白设定值（要获取运行时实际的留白数值请参考realPaddingTop）
* padding_left:number - 左边留白设定值（要获取运行时实际的留白数值请参考realPaddingLeft）
* padding_bottom:number - 底部留白设定值（要获取运行时实际的留白数值请参考realPaddingBottom）
* padding_right:number - 右边留白设定值（要获取运行时实际的留白数值请参考realPaddingRight）
* strech_hor:EStrechType - 水平伸展模式
* strech_ver:EStrechType - 垂直伸展模式
* space_x:number - 水平间距设定值（要获取运行时实际的间距请参考realSpaceX）
* space_y:number - 垂直间距设定值（要获取运行时实际的间距请参考realSpaceY）
* space_min_x:number - 列表项并排的水平最小间距（水平伸展模式为Expand时生效）
* space_min_y:number - 列表项并列的垂直最小间距（垂直伸展模式为Expand时生效）
* layoutDir:EDir - 列表项布局方向
* alignType_hor:EAlignType_Hor - 水平对齐（页面模式和水平滚动列表不生效）
* alignType_ver:EAlignType_Ver - 垂直对齐（页面模式和垂直滚动列表不生效）
* isAlignChild_hor:boolean - 最后一行是否应用水平对齐（水平对齐有效时生效）
* isAlignChild_ver:boolean - 最后一列是否应用垂直对齐（垂直对齐有效时生效）
* row:boolean - 行数设定值（垂直伸展模式为Fixed或ExpandFixed时生效，要获取运行时实际的行数请参考realRow）
* col:boolean - 列数设定值（水平伸展模式为Fixed或ExpandFixed时生效，要获取运行时实际的行数请参考realCol）
* flowSpeed - 循环流动速度
* flowResumeTime - 触摸滑动后恢复流速的时间
* flowWaitTime - 触摸滑动后暂停流动的时间
## 运行时构造信息
* layoutInfo:ILayoutInfo - 【只读】运行时实际的布局信息，包括行，列，尺寸，包围盒，间隔
* trans:UITransform - 【只读】列表自身的UITransform组件
* contentOffset:Vector2 - 【只读】content组件偏移（等同于content.position）
* realCol:number - 【只读】列表运行时实际列数
* realRow:number - 【只读】列表运行实际行数
* realItemSize:Size - 【只读】运行时实际的列表项尺寸
* realPaddingLeft - 【只读】列表实际左边留白
* realPaddingRight - 【只读】列表实际右边留白
* realPaddingTop - 【只读】列表实际上边留白
* realPaddingBottom - 【只读】列表实际底部留白
* contentNode:Node - 【只读】列表项父节点引用，即content节点
* viewNode:Node - 【只读】遮罩节点引用，即view节点
* recycleFolderNode:Node - 【只读】回收父节点引用
* scrollRectNode:Node - 【只读】滚动列表组件节点引用
## 运行时列表属性
* infos: IVListItemInfo[] - 【只读】获取当前列表项信息数组，对列表操作的关键数据对象
* datas: any[] - 【只读】获取当前列表数据数组，元素成员可在刷新前进行修改
* cb:IVListItemHooks - 列表项生命周期回调（更改只影响后续调用）
* pageCnt:number - 【只读】横向翻动或纵向翻动总数量，由列表项数量决定，仅适用于一维滚动页面列表，否则返回-1
* pageIdx:number - 【只读】当前页面索引，仅适用于一维页面列表，二维页面索引请参考getLocation()方法，要定位到页面索引请参考focus()和locate()方法
* curPageInfo:IVListItemInfo - 当前页面信息，仅适用于一维滚动页面列表


# 方法
## 生命周期
* init(itemCallback:IVListItemHooks):void - 初始化方法
* clearAll():void - 清空列表数据和回调以及注册信息
* clearList():void - 清空列表数据
## 坐标转换和布局信息
* lp2wp(lp:Vec3):Vec3 - 将content坐标系下的本地坐标lp转为世界坐标并返回
* wp2lp(wp:Vec3):Vec3 - 将世界坐标wp转为content坐标系下的本地坐标并返回
* idx2crd(idx:number):Vec2 - 将列表项索引idx转换为该列表项在布局中的二维坐标（左上为原点）并返回
* crd2idx(crd:Vec2):number - 将列表项在布局中的二维坐标crd转换为该列表项的索引并返回
* getVec():Vec2 - 返回当前列表中心聚焦的位置在整个布局中的偏移向量（以realItemSize.xy+layout.spaceXY为单位）
* getLocation():Vec2 - 返回当前列表中心所落在列表项在整个布局中的二维坐标
* getFocus():number - 返回当前列表中心所落在的列表项的索引
## 列表定位
* locate(crd:Vec2,time?:number,endCallback?:Function):void - 在time时间内定位并聚焦到布局坐标为crd的列表项，结束后调用endCallback，若time不传则立即完成操作
* focus(target:Location,time?:number,endCallback?:Function):void - 在time时间内定位并聚焦到索引或方位为target的列表项，结束后调用endCallback，若time不传则立即完成操作
> type Location = number | "Top" | "Bottom" | "Left" | "Right" | "Start" | "End";
* turnPrevious(time:number=0.4,isLoop:boolean = false):void - 在time时间内翻到上一页，若isLoop为true且当前为首页，则翻到最后一页
* turnNext(time:number=0.4,isLoop:boolean=false):void - 在time时间内翻到下一页，若isLoop为true且当前为最后一页，则翻到首页
* getRealIdxRangeInView():{startIdx:number,endIdx:number} - 获取在视口中可能出现的所有渲染项的realIdx，从startIdx开始，endIdx结束
## 检测
* getPosInfo(idx:number):Rect - 返回索引为idx的列表项在布局中的Rect信息（此方法与列表项可见性无关）
* isOutOfScroll():boolean - 返回列表滚动是否超出边界
* testItemIdxByLp(lp: Vec2):number - 测试并返回content坐标系下的lp坐标所落的渲染项的实际索引（不论渲染项的显隐状态都可用）
* testVisibleByIdx(realIdx:number):boolean - 测试索引为realIdx的渲染项位置是否在视口范围内（不论渲染项的显隐状态都可用）
## 数据操作和刷新
* sort(compare:(a:IVListItemInfo,b:IVListItemInfo)=>number):void - 对列表按照compare规则进行排序并刷新
* setData(data:T[],ignoreReset:boolean = false,parent:IVListItemInfo=null):void - 对列表传入data数据列表并立即执行渲染刷新，若ignoreReset为false则列表刷新后将滚动到一开始的位置，否则不滚动，若此列表的数据来自于父列表的子数据，则可以将所在的列表项数据传入parent
* addData(data:T,insertIdx:number|null=null):boolean - 安全地向列表中insertIdx位置插入数据data并刷新，若insertIdx为null则在列表末尾插入。如果返回false，则表示该插入和刷新操作需等待exePromise后完成，否则表示操作立即完成
* deleteIdx(idx:number):boolean - 安全地向列表中删除索引为idx的数据和列表项，如果返回false，则表示该操作需等待exePromise后完成，否则表示操作立即完成（此方法只用于删除单条数据，如果要从index数组中批量删除数据，请使用deleteIndices）
* deleteData(data:T):boolean - 安全地向列表中删除数据为data的列表项，如果返回false，则表示该操作需等待exePromise后完成，否则表示操作立即完成
* deleteIndices(infoIndices: number[]):boolean - 批量删除infoIndices索引数组所指向的所有数据和列表项，防止多次调用deleteIdx时导致索引错位的问题
* exePromise():Promise<void> - 返回等待所有操作执行完毕的promise（一帧延迟）
* refreshItem(idx:number,realIdx?: number):void - 刷新数据索引为infoIdx的所有渲染项，若指定realIdx，则只刷新realIdx对应的渲染项
* refreshList():void - 刷新列表
## 事件注册
* register(key:string,nodeEvent:string,func:VCallback,target?:any):void - 为列表中所有列表项速查名为key的子节点并注册事件{nodeEvent,func,target}，当key为""时为列表项渲染节点本身注册事件。该方法将保证事件触发时得到的实参数据与触发的列表项正确对应，注意VList不支持同一个节点同一个event注册多个回调
* unregister(key:string,nodeEvent):void - 为列表中所有列表项速查名为key的子节点并注销事件nodeEvent
* getChildByPath(node:Node,path:string):Node - 等同于node.getChildByPath(path)，但在分层模式中列表项结构被打散后依然可用