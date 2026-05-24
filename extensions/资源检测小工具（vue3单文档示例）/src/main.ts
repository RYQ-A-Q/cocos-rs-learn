import { registENV } from "./utils/utils";

registENV();

/**
 * @en 
 * @zh 为扩展的主进程的注册方法
 */
export const methods: { [key: string]: (...any: any) => any } = {
    openPanel() {
        Editor.Panel.open(PackageJSON.name);
    },
    openHeapPanel() {
        Editor.Panel.open(PackageJSON.name + ".heap");
    },
    openBundlePanel() {
        Editor.Panel.open(PackageJSON.name + ".bundles");
    },
    openFguiPanel() {
        Editor.Panel.open(PackageJSON.name + ".fgui");
    },
};

/**
 * @en Hooks triggered after extension loading is complete
 * @zh 扩展加载完成后触发的钩子
 */
export function load() { }

/**
 * @en Hooks triggered after extension uninstallation is complete
 * @zh 扩展卸载完成后触发的钩子
 */
export function unload() { }

console.log(`[vite-plugin-vue3] loaded`);
