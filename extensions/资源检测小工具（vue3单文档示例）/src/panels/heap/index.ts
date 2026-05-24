import { createApp, App } from 'vue';

import { loadCSS, registENV } from '../../utils/utils';
registENV();

const panelDataMap = new WeakMap<any, App>();

import appTpl from './index.vue';
/**
 * @zh 如果希望兼容 3.3 之前的版本可以使用下方的代码
 * @en You can add the code below if you want compatibility with versions prior to 3.3
 */
// Editor.Panel.define = Editor.Panel.define || function(options: any) { return options }
module.exports = Editor.Panel.define({
    listeners: {
        show() { 
            
        },
        hide() { 
            
        },
    },
    template: `
    <div>
        <div id="app">
        </div>
    </div>
`,
    style: loadCSS([
        '@__ROOT__/static/style/default/index.css',
        "@__ROOT__/dist/assets/index.css",
    ]),
    $: {
        app: '#app',
    },
    methods: {
        
    },
    ready() {
        if (this.$.app) {
            const app = createApp(appTpl);
            app.config.compilerOptions.isCustomElement = (tag:string) => tag.startsWith('ui-');
            app.mount(this.$.app);
            panelDataMap.set(this, app);
        }
    },
    beforeClose() { },
    close() {
        const app = panelDataMap.get(this);
        if (app) {
            app.unmount();
        }
    },
});
