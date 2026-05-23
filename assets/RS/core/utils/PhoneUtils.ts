export class PhoneUtils {
    // 简单的国际手机号正则（支持 +国家码 + 空格或无空格）
    private static internationalPhoneRegex = /^\+?[0-9]{7,15}$/;

    // 常见国家手机格式规则（可扩展）
    private static phonePatterns: { [country: string]: RegExp } = {
        // 中国大陆：1开头11位数字
        CN: /^1[3-9]\d{9}$/,
        // 美国和加拿大（北美编号计划）：10位数字
        US: /^\d{10}$/,
        CA: /^\d{10}$/,
        // 英国：+44 开头或 0 开头，然后10位
        UK: /^(\+44|0)7\d{9}$/,
        // 日本：+81 或 0 开头，10或11位
        JP: /^(\+81|0)\d{9,10}$/,
        // 韩国：+82 或 0 开头，9~11位
        KR: /^(\+82|0)(1\d{8,9})$/,
    };

    /**
     * 是否为合法的国际电话格式
     */
    static isValidInternationalPhone(phone: string): boolean {
        return this.internationalPhoneRegex.test(phone.trim());
    }

    /**
     * 是否为指定国家的手机号
     * @param phone 电话号码
     * @param country 国家代码，如 'CN', 'US', 'JP'
     */
    static isValidPhoneByCountry(phone: string, country: string): boolean {
        const pattern = this.phonePatterns[country.toUpperCase()];
        if (!pattern) return false;
        return pattern.test(phone.trim());
    }

    /**
     * 自动匹配国家（基础逻辑，真实应用应通过国家码前缀识别）
     */
    static guessPhoneCountry(phone: string): string {
        for (const country in this.phonePatterns) {
            if (this.phonePatterns[country].test(phone.trim())) {
                return country;
            }
        }
        return "??";
    }
}
