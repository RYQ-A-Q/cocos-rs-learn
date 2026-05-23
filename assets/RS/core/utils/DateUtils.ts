export class DateUtils {
    /** 获取当前时间戳（毫秒） */
    static nowTimestamp(): number {
        return Date.now();
    }
    /** 获取当前星期（1-7，星期一为1，星期日为7） */
    static getCurWeek(): number {
        return this.getDateWeek(new Date())
    }
    /**获取指定日期的星期（1-7，星期一为1，星期日为7） */
    static getDateWeek(date: string | number | Date): number {
        const d = new Date(date);
        return d.getDay() === 0 ? 7 : d.getDay();
    }
    static getCurWeekMonday(): string {
        const week = DateUtils.getCurWeek();
        const today = new Date();
        return DateUtils.getOffsetDate(today, -(week - 1));
    }


    /** 获取当前秒级时间戳 */
    static nowSeconds(): number {
        return Math.floor(Date.now() / 1000);
    }

    /** 时间字符串（ISO 8601）转时间戳（毫秒） */
    static toTimestamp(dateStr: string): number {
        const t = Date.parse(dateStr);
        return isNaN(t) ? 0 : t;
    }

    /** 时间戳（毫秒）转 ISO 时间字符串 */
    static toISOString(timestamp: number): string {
        return new Date(timestamp).toISOString();
    }

    /** 时间戳（毫秒）转指定格式字符串，支持 yyyy/MM/dd HH:mm:ss */
    static format(timestamp: number, formatStr = 'yyyy-MM-dd HH:mm:ss'): string {
        const date = new Date(timestamp);
        const map: { [key: string]: string } = {
            yyyy: date.getFullYear().toString(),
            MM: (date.getMonth() + 1).toString().padStart(2, '0'),
            dd: date.getDate().toString().padStart(2, '0'),
            HH: date.getHours().toString().padStart(2, '0'),
            mm: date.getMinutes().toString().padStart(2, '0'),
            ss: date.getSeconds().toString().padStart(2, '0'),
        };
        let formatted = formatStr;
        for (const k in map) {
            formatted = formatted.replace(k, map[k]);
        }
        return formatted;
    }

    /** 获取当前日期字符串（默认 yyyy-MM-dd） */
    static getToday(formatStr = 'yyyy-MM-dd'): string {
        return this.format(Date.now(), formatStr);
    }
    /** 获取指定日期的偏移日期字符串（正负天数） */
    static getOffsetDate(baseDate: string | number | Date, offset: number, formatStr = 'yyyy-MM-dd'): string {
        const date = new Date(baseDate);
        date.setDate(date.getDate() + offset);
        return this.format(date.getTime(), formatStr);
    }
    /**
        * 判断某个日期是否在指定的两个日期之间（含边界）
        * @param target 目标日期（Date | string）
        * @param start 起始日期（Date | string）
        * @param end 结束日期（Date | string）
        * @returns boolean 是否在范围内
        */
    public static isBetween(target: Date | string, start: Date | string, end: Date | string): boolean {
        const t = (target instanceof Date) ? target.getTime() : new Date(target).getTime();
        const s = (start instanceof Date) ? start.getTime() : new Date(start).getTime();
        const e = (end instanceof Date) ? end.getTime() : new Date(end).getTime();

        if (isNaN(t) || isNaN(s) || isNaN(e)) {
            console.warn('DateUtils.isBetween 参数格式不正确');
            return false;
        }

        return t >= s && t <= e;
    }

    /** 秒数转 时分秒 格式字符串 */
    static secondsToHMS(seconds: number): string {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        let parts: string[] = [];
        if (h > 0) {
            parts.push(h.toString().padStart(2, '0'));
        }
        parts.push(m.toString().padStart(2, '0'));
        parts.push(s.toString().padStart(2, '0'));
        return parts.join(':');
    }

}
