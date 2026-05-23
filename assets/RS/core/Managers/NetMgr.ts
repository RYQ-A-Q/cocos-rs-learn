/**网络管理 */
class NetMgr {
    public static readonly instance: NetMgr = new NetMgr();
    private constructor() { }

    /**
     * GET请求
     * @param url 请求地址
     * @param token JWT Token（可选）
     */
    public async get(url: string, token?: string): Promise<any> {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open("GET", url, true);
            
            // 如果有Token，添加Authorization头
            if (token) {
                xhr.setRequestHeader("Authorization", `Bearer ${token}`);
            }
            
            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4) {
                    if (xhr.status >= 200 && xhr.status < 400) {
                        try {
                            resolve(JSON.parse(xhr.responseText));
                        } catch (error) {
                            resolve(xhr.responseText);
                        }
                    } else {
                        reject(new Error(`HTTP GET Error: ${xhr.status}`));
                    }
                }
            };
            xhr.send();
        });
    }

    /**
     * POST请求
     * @param url 请求地址
     * @param data 请求数据
     * @param token JWT Token（可选）
     */
    public async post(url: string, data: any, token?: string): Promise<any> {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open("POST", url, true);
            xhr.setRequestHeader("Content-Type", "application/json");
            
            // 如果有Token，添加Authorization头
            if (token) {
                xhr.setRequestHeader("Authorization", `Bearer ${token}`);
            }
            
            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4) {
                    if (xhr.status >= 200 && xhr.status < 400) {
                        resolve(JSON.parse(xhr.responseText));
                    } else {
                        reject(new Error(`HTTP POST Error: ${xhr.status}`));
                    }
                }
            };
            xhr.send(JSON.stringify(data));
        });
    }
}

export const netMgr = NetMgr.instance;