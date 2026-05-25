import { Director } from 'cc';
import { _decorator, Component, Camera, RenderTexture, SpriteFrame, view, director, Layers, sys, game, native } from 'cc';
import { uiMgr } from '../RS/core/Managers/UIMgr';
const { ccclass, property } = _decorator;

@ccclass('CaptureToWeb')
export class CaptureToWeb extends Component {

    @property(Camera)
    camera: Camera = null;

    // ==============================
    //  外部调用入口
    // ==============================
    public capture() {
        this.captureLayers([Layers.Enum.ALL]);
    }

    /**
     * 指定图层截图
     */
    public captureLayers(layerBits: number[]) {

        const size = view.getVisibleSize();

        const rt = new RenderTexture();
        rt.reset({
            width: size.width,
            height: size.height,
        });

        // 保存旧状态
        const oldMask = this.camera.visibility;

        // 组合 layer mask
        let mask = 0;
        for (const bit of layerBits) {
            mask |= bit;
        }

        this.camera.visibility = mask;
        this.camera.targetTexture = rt;

        director.once(Director.EVENT_AFTER_DRAW, () => {

            // 恢复
            this.camera.targetTexture = null;
            this.camera.visibility = oldMask;

            this.saveImage(rt);
        });
    }

    // ==============================
    // 核心保存分发
    // ==============================
    private saveImage(rt: RenderTexture) {

        const pixels = rt.readPixels(
            0,
            0,
            rt.width,
            rt.height
        );

        // Native最先处理
        if (sys.isNative) {

            this.saveNative(
                pixels,
                rt.width,
                rt.height
            );

            return;
        }

        // 小游戏平台
        if (sys.platform === sys.Platform.WECHAT_GAME) {

            this.saveWeChat(rt);
            return;
        }

        if (
            sys.platform ===
            sys.Platform.BYTEDANCE_MINI_GAME
        ) {

            this.saveTT(rt);
            return;
        }

        // 浏览器才转Base64
        if (sys.isBrowser) {

            const base64 =
                this.toPNGBase64(
                    pixels,
                    rt.width,
                    rt.height
                );

            this.saveH5(base64);
        }
    }

    // ==============================
    //  H5保存
    // ==============================
    private saveH5(base64: string) {
        const a = document.createElement("a");
        a.href = base64;
        a.download = `capture_${Date.now()}.png`;
        a.click();
    }

    // ==============================
    //  微信小游戏
    // ==============================
    private saveWeChat(rt: RenderTexture) {

        const wx = window['wx'];
        const canvas = game.canvas;

        if (!wx || !canvas) {
            console.warn("微信环境不可用");
            return;
        }

        const base64 = canvas.toDataURL("image/png");

        const fs = wx.getFileSystemManager();

        const filePath = `${wx.env.USER_DATA_PATH}/shot_${Date.now()}.png`;

        const buffer = this.base64ToUint8(base64);

        fs.writeFile({
            filePath,
            data: buffer.buffer,
            encoding: 'binary',
            success: () => {

                wx.saveImageToPhotosAlbum({
                    filePath,
                    success: () => {
                        console.log("保存成功");
                    },
                    fail: (err) => {
                        console.error("保存失败", err);
                    }
                });

            },
            fail: (err) => {
                console.error("写文件失败", err);
            }
        });
    }

    // ==============================
    // 抖音小游戏
    // ==============================
    private saveTT(rt: RenderTexture) {

        const canvas = game.canvas;

        if (!canvas) {
            console.warn("canvas 不存在");
            return;
        }

        const base64 = canvas.toDataURL("image/png");

        const tt = window['tt'];

        if (!tt || !tt.saveImageToPhotosAlbum) {
            console.warn("tt API 不可用，降级H5下载");
            this.saveH5(base64);
            return;
        }

        const fs = tt.getFileSystemManager?.();

        if (!fs) {
            console.warn("FileSystemManager 不支持");
            this.saveH5(base64);
            return;
        }

        const filePath = `${tt.env.USER_DATA_PATH}/capture_${Date.now()}.png`;

        const buffer = this.base64ToUint8(base64);

        fs.writeFile({
            filePath,
            data: buffer.buffer,
            encoding: 'binary',
            success: () => {
                tt.saveImageToPhotosAlbum({
                    filePath,
                    success: () => {
                        console.log("保存成功");
                    }
                });
            },
            fail: (err) => {
                console.error("写入失败", err);
            }
        });
    }

    // ==============================
    //Android / iOS
    // ==============================
    private saveNative(pixels: Uint8Array, width: number, height: number) {
        console.log("开始保存，计算中...")
        const fixedPixels = this.fixPixels(pixels, width, height);
        const dir = "/storage/emulated/0/Download/";
        const filePath = dir + `capture_${Date.now()}.png`;
        console.log("开始保存，保存中...")
        native.saveImageData(fixedPixels,width,height,filePath).then(() => {
            uiMgr.showToast("保存成功", 0.8, "success");
            console.log("保存成功:", filePath);
        }).catch(e => {
            uiMgr.showToast("保存失败", 0.8, "error");
            console.warn("保存失败", e);
        });
    }
    private fixPixels(pixels: Uint8Array, width: number, height: number): Uint8Array {
        const out = new Uint8Array(pixels.length);
        const rowBytes = width * 4;
        for (let y = 0; y < height; y++) {
            const srcStart = y * rowBytes;
            const dstStart = (height - 1 - y) * rowBytes;
    
            out.set(
                pixels.subarray(srcStart, srcStart + rowBytes),
                dstStart
            );
        }
    
        return out;
    }

    // ==============================
    // Base64 转 Uint8Array
    // ==============================
    private base64ToUint8(base64: string): Uint8Array {

        const arr = base64.split(',');
        const raw = window.atob(arr[1]);

        const uint8 = new Uint8Array(raw.length);

        for (let i = 0; i < raw.length; i++) {
            uint8[i] = raw.charCodeAt(i);
        }

        return uint8;
    }

    // ==============================
    // Pixels → Base64 PNG
    private toPNGBase64(pixels: Uint8Array, w: number, h: number): string {

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;

        const ctx = canvas.getContext("2d")!;
        const img = ctx.createImageData(w, h);

        const dst = img.data;

        let i = 0;

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {

                const srcIndex = (y * w + x) * 4;

                const dstIndex = ((h - 1 - y) * w + x) * 4;

                dst[dstIndex] = pixels[srcIndex];
                dst[dstIndex + 1] = pixels[srcIndex + 1];
                dst[dstIndex + 2] = pixels[srcIndex + 2];
                dst[dstIndex + 3] = pixels[srcIndex + 3];
            }
        }

        ctx.putImageData(img, 0, 0);

        return canvas.toDataURL("image/png");
    }
}