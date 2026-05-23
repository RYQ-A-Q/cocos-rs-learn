/**

 * 解析器

 * 提供路径解析功能。

 */

export class Parser {

    /**
     * 解析资源路径并将其分解为包名和路径
     * @param resPath - 要解析的资源路径
     * @returns 返回包含 bundleName 和 path 的对象
     */

    public static path(resPath: string): { bundleName: string; path: string } {

        const [bundleName, ...pathParts] = resPath.split('/');

        return {
            bundleName,
            path: pathParts.join('/')
        };

    }

}