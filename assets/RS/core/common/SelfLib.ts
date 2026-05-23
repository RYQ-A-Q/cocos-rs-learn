/**文本图片类数据结构 */
export interface ITextImgItem {
    img: { path: string, bundle?: string }
    postText: string
}

/**货币体系 */
export enum MainMoney {
    adTicket = "adTicket",
    duck = "duck",
    iceCream = "iceCream",
    redFlowers = "redFlowers",

}