import { _decorator } from 'cc';
const { ccclass } = _decorator;

/**
 * 随机名称生成器
 * 格式：xxx的xx
 */
@ccclass('RandomNameUtils')
export class RandomNameUtils {

    // ==================== 形容词库 ====================
    /** 性格类形容词 */
    private static readonly PERSONALITY_ADJS: string[] = [
        "和善", "暴躁", "温柔", "凶猛", "可爱", "狡猾", "憨厚", "机灵",
        "呆萌", "优雅", "粗犷", "羞涩", "开朗", "忧郁", "活泼", "沉稳",
        "热情", "冷漠", "天真", "成熟", "迷糊", "精明", "懒散", "勤奋",
        "胆小", "勇敢", "自信", "自卑", "乐观", "悲观", "随和", "固执"
    ];

    /** 状态类形容词 */
    private static readonly STATE_ADJS: string[] = [
        "饥饿的", "困倦的", "兴奋的", "疲惫的", "快乐的", "悲伤的", "愤怒的", "平静的",
        "疯狂的", "理智的", "幸运的", "倒霉的", "神秘的", "普通的", "高贵的", "平凡的",
        "闪亮的", "暗淡的", "炽热的", "冰冷的", "湿润的", "干燥的", "柔软的", "坚硬的"
    ];

    /** 动作类形容词 */
    private static readonly ACTION_ADJS: string[] = [
        "奔跑的", "跳跃的", "飞翔的", "游泳的", "爬行的", "滚动的", "滑行的", "飘浮的",
        "歌唱的", "跳舞的", "微笑的", "哭泣的", "打盹的", "发呆的", "偷吃的", "捣乱的"
    ];

    /** 颜色类形容词 */
    private static readonly COLOR_ADJS: string[] = [
        "红色的", "蓝色的", "绿色的", "黄色的", "紫色的", "粉色的", "橙色的", "灰色的",
        "黑色的", "白色的", "金色的", "银色的", "彩色的", "透明的", "闪光的", "渐变的"
    ];

    /** 自然类形容词 */
    private static readonly NATURE_ADJS: string[] = [
        "闪电", "火焰", "冰霜", "雷霆", "疾风", "大地", "海洋", "天空",
        "森林", "沙漠", "冰川", "火山", "草原", "沼泽", "峡谷", "瀑布",
        "星辰", "月光", "日光", "云雾", "雨露", "雪花", "彩虹", "极光"
    ];

    /** 食物类形容词 */
    private static readonly FOOD_ADJS: string[] = [
        "甜蜜的", "酸酸的", "苦苦的", "辣辣的", "咸咸的", "香香的", "脆脆的", "软软的",
        "糯糯的", "弹弹的", "滑滑的", "冰冰的", "热热的", "鲜鲜的", "腥腥的", "臭臭的"
    ];

    /** 魔法奇幻类形容词 */
    private static readonly MAGIC_ADJS: string[] = [
        "魔法的", "神秘的", "古老的", "神圣的", "诅咒的", "祝福的", "幻影的", "永恒的",
        "虚空", "混沌", "秩序", "命运", "时间", "空间", "梦境", "现实"
    ];

    // ==================== 名词库 ====================
    /** 动物类名词 */
    private static readonly ANIMAL_NOUNS: string[] = [
        "兔子", "狐狸", "熊猫", "猫咪", "狗狗", "小鸟", "鱼儿", "松鼠",
        "刺猬", "仓鼠", "龙猫", "羊驼", "袋鼠", "考拉", "企鹅", "海豚",
        "鲸鱼", "鲨鱼", "章鱼", "螃蟹", "蝴蝶", "蜜蜂", "蚂蚁", "蜘蛛",
        "老虎", "狮子", "豹子", "狼", "熊", "鹿", "猴子", "大象"
    ];

    /** 植物类名词 */
    private static readonly PLANT_NOUNS: string[] = [
        "西瓜", "苹果", "香蕉", "橙子", "草莓", "葡萄", "桃子", "梨子",
        "樱桃", "芒果", "菠萝", "椰子", "石榴", "柚子", "柠檬", "蓝莓",
        "玫瑰", "向日葵", "蒲公英", "薰衣草", "樱花", "荷花", "菊花", "梅花",
        "蘑菇", "竹笋", "南瓜", "番茄", "黄瓜", "茄子", "辣椒", "土豆"
    ];

    /** 天体类名词 */
    private static readonly CELESTIAL_NOUNS: string[] = [
        "星星", "月亮", "太阳", "云朵", "彩虹", "雪花", "雨滴", "微风",
        "流星", "彗星", "银河", "宇宙", "地球", "火星", "木星", "土星",
        "黑洞", "白洞", "星云", "星座", "极星", "卫星", "光环", "陨石"
    ];

    /** 食物类名词 */
    private static readonly FOOD_NOUNS: string[] = [
        "糖果", "饼干", "蛋糕", "冰淇淋", "巧克力", "棉花糖", "布丁", "奶茶",
        "披萨", "汉堡", "薯条", "炸鸡", "寿司", "拉面", "饺子", "包子",
        "汤圆", "月饼", "粽子", "年糕", "麻薯", "蛋挞", "泡芙", "马卡龙"
    ];

    /** 职业类名词 */
    private static readonly PROFESSION_NOUNS: string[] = [
        "魔法师", "骑士", "弓箭手", "牧师", "战士", "盗贼", "吟游诗人", "炼金术士",
        "巫师", "术士", "德鲁伊", "萨满", "武僧", "圣骑士", "死亡骑士", "恶魔猎手",
        "工程师", "科学家", "艺术家", "音乐家", "厨师", "园丁", "裁缝", "铁匠"
    ];

    /** 奇幻生物类名词 */
    private static readonly FANTASY_NOUNS: string[] = [
        "精灵", "矮人", "兽人", "亡灵", "天使", "恶魔", "龙", "凤凰",
        "独角兽", "九尾狐", "美人鱼", "狮鹫", "飞马", "巨鹰", "树人", "石像鬼",
        "幽灵", "僵尸", "吸血鬼", "狼人", "妖精", "花仙子", "小恶魔", "小天使"
    ];

    /** 元素类名词 */
    private static readonly ELEMENT_NOUNS: string[] = [
        "火苗", "水珠", "土块", "风刃", "雷电", "冰晶", "光斑", "暗影",
        "岩浆", "蒸汽", "灰尘", "气泡", "火花", "霜花", "露珠", "沙粒"
    ];

    /** 日常物品类名词 */
    private static readonly OBJECT_NOUNS: string[] = [
        "抱枕", "毛毯", "茶杯", "书本", "画笔", "钢琴", "吉他", "相机",
        "时钟", "镜子", "灯笼", "风铃", "钥匙", "锁链", "宝石", "水晶"
    ];

    // ==================== 公共方法 ====================

    /**
     * 生成随机名字（基础版）
     * @returns 格式：形容词的名词
     */
    public static generate(): string {
        const allAdjs = this.getAllAdjectives();
        const allNouns = this.getAllNouns();
        const adj = allAdjs[Math.floor(Math.random() * allAdjs.length)];
        const noun = allNouns[Math.floor(Math.random() * allNouns.length)];
        return `${adj}${adj.endsWith('的') ? '' : '的'}${noun}`;
    }

    /**
     * 生成随机名字（指定类型）
     * @param type 类型：'personality' | 'state' | 'action' | 'color' | 'nature' | 'food' | 'magic'
     * @returns 指定类型的随机名字
     */
    public static generateByType(type: 'personality' | 'state' | 'action' | 'color' | 'nature' | 'food' | 'magic'): string {
        let adjs: string[];
        switch (type) {
            case 'personality': adjs = this.PERSONALITY_ADJS; break;
            case 'state': adjs = this.STATE_ADJS; break;
            case 'action': adjs = this.ACTION_ADJS; break;
            case 'color': adjs = this.COLOR_ADJS; break;
            case 'nature': adjs = this.NATURE_ADJS; break;
            case 'food': adjs = this.FOOD_ADJS; break;
            case 'magic': adjs = this.MAGIC_ADJS; break;
            default: adjs = this.getAllAdjectives();
        }

        const allNouns = this.getAllNouns();
        const adj = adjs[Math.floor(Math.random() * adjs.length)];
        const noun = allNouns[Math.floor(Math.random() * allNouns.length)];
        return `${adj}${adj.endsWith('的') ? '' : '的'}${noun}`;
    }

    /**
     * 生成随机名字（指定名词类型）
     * @param nounType 类型：'animal' | 'plant' | 'celestial' | 'food' | 'profession' | 'fantasy' | 'element' | 'object'
     * @returns 随机名字
     */
    public static generateByNounType(nounType: 'animal' | 'plant' | 'celestial' | 'food' | 'profession' | 'fantasy' | 'element' | 'object'): string {
        const allAdjs = this.getAllAdjectives();
        let nouns: string[];
        switch (nounType) {
            case 'animal': nouns = this.ANIMAL_NOUNS; break;
            case 'plant': nouns = this.PLANT_NOUNS; break;
            case 'celestial': nouns = this.CELESTIAL_NOUNS; break;
            case 'food': nouns = this.FOOD_NOUNS; break;
            case 'profession': nouns = this.PROFESSION_NOUNS; break;
            case 'fantasy': nouns = this.FANTASY_NOUNS; break;
            case 'element': nouns = this.ELEMENT_NOUNS; break;
            case 'object': nouns = this.OBJECT_NOUNS; break;
            default: nouns = this.getAllNouns();
        }

        const adj = allAdjs[Math.floor(Math.random() * allAdjs.length)];
        const noun = nouns[Math.floor(Math.random() * nouns.length)];
        return `${adj}${adj.endsWith('的') ? '' : '的'}${noun}`;
    }

    /**
     * 批量生成随机名字
     * @param count 生成数量
     * @param allowDuplicate 是否允许重复（默认false）
     * @returns 名字数组
     */
    public static generateBatch(count: number, allowDuplicate: boolean = false): string[] {
        const names: string[] = [];
        const usedNames = new Set<string>();

        for (let i = 0; i < count; i++) {
            let name: string;
            let attempts = 0;

            if (!allowDuplicate) {
                do {
                    name = this.generate();
                    attempts++;
                } while (usedNames.has(name) && attempts < 100);
                usedNames.add(name);
            } else {
                name = this.generate();
            }

            names.push(name);
        }

        return names;
    }

    /**
     * 根据种子生成名字（可复现随机）
     * @param seed 种子值
     * @returns 确定性的名字
     */
    public static generateWithSeed(seed: number): string {
        const allAdjs = this.getAllAdjectives();
        const allNouns = this.getAllNouns();

        const adjIndex = Math.floor(Math.abs(seed) % allAdjs.length);
        const nounIndex = Math.floor(Math.abs(Math.sin(seed) * 10000) % allNouns.length);

        const adj = allAdjs[adjIndex];
        const noun = allNouns[nounIndex];
        return `${adj}${adj.endsWith('的') ? '' : '的'}${noun}`;
    }

    /**
     * 生成可爱的名字（偏向小动物和甜食）
     * @returns 可爱风格的名字
     */
    public static generateCute(): string {
        const cuteAdjs = ["萌萌", "软软", "甜甜", "糯糯", "粉粉", "圆圆", "小小", "胖胖"];
        const cuteNouns = ["猫咪", "狗狗", "兔子", "仓鼠", "布丁", "棉花糖", "汤圆", "团子"];

        const adj = cuteAdjs[Math.floor(Math.random() * cuteAdjs.length)];
        const noun = cuteNouns[Math.floor(Math.random() * cuteNouns.length)];
        return `${adj}的${noun}`;
    }

    /**
     * 生成帅气的名字（偏向力量和战斗）
     * @returns 帅气风格的名字
     */
    public static generateCool(): string {
        const coolAdjs = ["暗夜", "烈焰", "冰霜", "雷霆", "疾风", "断罪", "审判", "永恒"];
        const coolNouns = ["骑士", "剑圣", "龙骑", "战神", "影刃", "魔导师", "毁灭者", "守护者"];

        const adj = coolAdjs[Math.floor(Math.random() * coolAdjs.length)];
        const noun = coolNouns[Math.floor(Math.random() * coolNouns.length)];
        return `${adj}${adj.endsWith('的') ? '' : '的'}${noun}`;
    }

    /**
     * 生成随机组合（形容词+名词的任意组合）
     * @returns 随机组合的名字
     */
    public static generateRandomStyle(): string {
        const styles = ['normal', 'cute', 'cool'] as const;
        const style = styles[Math.floor(Math.random() * styles.length)];

        switch (style) {
            case 'cute': return this.generateCute();
            case 'cool': return this.generateCool();
            default: return this.generate();
        }
    }

    /**
     * 获取所有形容词
     */
    private static getAllAdjectives(): string[] {
        return [
            ...this.PERSONALITY_ADJS,
            ...this.STATE_ADJS,
            ...this.ACTION_ADJS,
            ...this.COLOR_ADJS,
            ...this.NATURE_ADJS,
            ...this.FOOD_ADJS,
            ...this.MAGIC_ADJS
        ];
    }

    /**
     * 获取所有名词
     */
    private static getAllNouns(): string[] {
        return [
            ...this.ANIMAL_NOUNS,
            ...this.PLANT_NOUNS,
            ...this.CELESTIAL_NOUNS,
            ...this.FOOD_NOUNS,
            ...this.PROFESSION_NOUNS,
            ...this.FANTASY_NOUNS,
            ...this.ELEMENT_NOUNS,
            ...this.OBJECT_NOUNS
        ];
    }
}
