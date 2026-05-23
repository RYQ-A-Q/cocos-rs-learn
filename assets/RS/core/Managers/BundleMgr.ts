import { AssetManager, assetManager, warn } from "cc";
/**bundle管理器 */
class BundleMgr {
    public static readonly instance: BundleMgr = new BundleMgr();
    /** 存储已加载的分包 */
    private loadedBundles: { [key: string]: AssetManager.Bundle } = {};
    private constructor() { }
    /**检查是否已加载分包 */
    public hasBundle(nameOrUrl: string): boolean {
        return this.loadedBundles[nameOrUrl] !== undefined;
    }
    /**
     * 获取指定分包，如果未加载则进行加载
     * @param nameOrUrl - 分包名称或URL
     * @param onProgress - 进度回调函数，参数为当前进度（0 到 1）
     * @returns 加载完成后的 Promise，解析为 AssetManager.Bundle 或 null（如果加载失败）
     */
    public async getBundle(nameOrUrl: string, onProgress?: (progress: number) => void): Promise<AssetManager.Bundle | null> {
        // 检查分包是否已加载
        if (this.loadedBundles[nameOrUrl]) {
            return this.loadedBundles[nameOrUrl];
        }
        try {
            const bundle = await this.loadBundle(nameOrUrl);
            this.loadedBundles[nameOrUrl] = bundle;
            if (onProgress) {
                await this.loadAssetsWithProgress(bundle, onProgress);
            }
            return bundle;
        } catch (error) {
            console.warn(`分包 ${nameOrUrl} 加载失败: ${error.message}`);
            return null;
        }
    }

    /**
     * 加载指定分包
     * @param nameOrUrl - 分包名称或URL
     * @returns 加载完成后的 Promise，解析为 AssetManager.Bundle
     */
    private loadBundle(nameOrUrl: string): Promise<AssetManager.Bundle> {
        return new Promise((resolve, reject) => {
            assetManager.loadBundle(nameOrUrl, (err, bundle) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(bundle);
                }
            });
        });
    }
    /**
     * 加载分包中的所有资源并提供进度反馈
     * @param bundle - 已加载的分包
     * @param onProgress - 进度回调函数，参数为当前进度（0 到 1）
     * @returns 加载完成后的 Promise
     */
    private loadAssetsWithProgress(bundle: AssetManager.Bundle, onProgress: (progress: number) => void): Promise<void> {
        return new Promise((resolve, reject) => {
            // 获取分包内所有资源路径
            const assets = bundle.getDirWithPath('');
            const totalAssets = assets.length;
            let loadedAssets = 0;

            if (totalAssets === 0) {
                onProgress(1);
                resolve();
                return;
            }
            // 加载每个资源并更新进度
            assets.forEach((asset) => {
                bundle.load(asset.path, (err) => {
                    if (err) {
                        warn(`资源加载失败: ${asset.path}`, err)
                    }
                    loadedAssets++;
                    onProgress(loadedAssets / totalAssets);
                    if (loadedAssets === totalAssets) {
                        resolve();
                    }
                });
            });
        });
    }
    /**
     * 移除指定的分包，并释放其所有资源
     * @param nameOrUrl - 分包名称或URL
     */
    public removeBundle(nameOrUrl: string): void {
        const bundle = this.loadedBundles[nameOrUrl];
        if (bundle) {
            bundle.releaseAll();
            assetManager.removeBundle(bundle);
            delete this.loadedBundles[nameOrUrl];
        } else {
            console.warn(`尝试移除未加载的分包: ${nameOrUrl}`);
        }
    }
}

/** 分包管理器实例 */
export const bundleMgr = BundleMgr.instance;