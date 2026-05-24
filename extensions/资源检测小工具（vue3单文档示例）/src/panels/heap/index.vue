<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import * as fs from 'fs'
var parser = require('heapsnapshot-parser');
import { BaseVirtualList } from '../../plugins/base-virtual-list';

const file = ref("")
const assets = ref([])
const slider = ref(null)
const content = ref(null)
const height = ref(100)
const filter = ref("")
const typeFilter = ref(0)
const checkProgress = ref(0)

const TypeOptions = ref([
    "All",
    "Texture",
    "SpriteFrame",
    "Prefab",
    "Audio",
    "JsonAsset",
    "TextAsset",
    "Buffer",
    "Particle",
    "Material",
    "Animation",
    "Font",
    "Effect",
    "Skeleton",
    "Scene",
]);

async function onCheckClick() {
    if (!file.value) {
        Editor.Dialog.warn('Please select a file first!');
        return;
    }

    calcSliderHeight()

    assets.value = []
    var snapshotFile = fs.readFileSync(file.value, { encoding: "utf-8" });
    var snapshot = parser.parse(snapshotFile);

    var nodes = [];
    for (var i = 0; i < snapshot.nodes.length; i++) {
        checkProgress.value = (i / snapshot.edges.length) * 5;

        var node = snapshot.nodes[i] as any;
        if (node.type === "object") {
            // 查找cc对象
            if (node.name === "Object") {
                nodes.push(node);
            }
        }
    }

    nodes = nodes.sort(function (a: any, b: any) {
        return b.self_size - a.self_size;
    });

    checkProgress.value = 0;
    var nodeToEdges: { [key: number]: any[] } = {};
    for (var i = 0; i < snapshot.edges.length; i++) {
        checkProgress.value = (i / snapshot.edges.length) * 65 + 5;

        var edge = snapshot.edges[i];
        if (!edge.toNode || edge.type == "weak" || edge.type == "shortcut") {
            continue;
        }
        if (!nodeToEdges[edge.toNode.id]) {
            nodeToEdges[edge.toNode.id] = [];
        }
        nodeToEdges[edge.toNode.id].push(edge);
    }

    for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i] as any;
        let assetManagerNode = findNodeByProperty(node, "assetManager");
        if (assetManagerNode) {
            let assetNode = findNodeByProperty(assetManagerNode, "assets");
            if (assetNode) {
                let assetMap = findNodeByProperty(assetNode, "_map");
                if (assetMap) {
                    let allAssetsNode = assetMap.references as any[];
                    let assetIds = {};
                    allAssetsNode.forEach(element => {
                        // if(element.name.indexOf("@") < 0) {
                        assetIds[element.name] = assetNode;
                        // }
                        // console.log(element.name);
                    });

                    let assetIdsArr = Object.keys(assetIds);
                    let dts = assetIdsArr.map(async (id) => {
                        let asset = await Editor.Message.request('asset-db', 'query-asset-info', id);
                        if (!asset) {
                            return null
                        }

                        return {
                            name: asset.displayName || asset.name,
                            uuid: asset.uuid,
                            file: asset.path,
                            type: asset.type,
                            // size: calcRetainedSize(nodeToEdges, assetIds[id]),
                        }
                    });
                    let assetsArr = await Promise.all(dts);
                    assets.value = assetsArr.filter((item) => {
                        return item != null
                    });
                }
            }
        }

        checkProgress.value = (i / nodes.length) * 30 + 70;
    }
}

function onTabChanged(value) {
    typeFilter.value = value;
}

const finalAssets = computed(() => {
    if (!filter.value && typeFilter.value == 0) {
        return assets.value;
    }

    let fstr = filter.value.toLowerCase();
    let type = TypeOptions.value[typeFilter.value];
    return assets.value.filter((item) => {
        if(typeFilter.value != 0 && item.type.toLowerCase().indexOf(type.toLowerCase()) < 0) {
            return false;
        }

        return item.name.toLowerCase().indexOf(fstr) >= 0 || item.uuid.toLowerCase().indexOf(fstr) >= 0
    });
});

function calcRetainedSize(nodeToEdges: { [key: number]: any[] }, node: any) {
    let size = 0;
    if (node) {
        let edges = nodeToEdges[node.id];
        if (edges) {
            edges.forEach((edge) => {
                size += edge.toNode.self_size;
            });
        }
    }
    return size;
}

function findNodeByProperty(node: any, property: string) {
    for (var i = 0; i < node.references.length; i++) {
        var ref = node.references[i];
        if (ref.type === "property" && ref.name == property) {
            return ref.toNode;
        }
    }
    return null;
}

function onMounted() {
    calcSliderHeight()
    document.onresize = () => {
        calcSliderHeight()
    }
}

async function onSelectFile() {
    const config: any = {};
    config.filters = [
        { name: 'HeapSnapshot', extensions: ['heapsnapshot'] },
    ];

    const data: any = await Editor.Dialog.select(config);
    if (data && data.filePaths && data.filePaths[0]) {
        file.value = data.filePaths[0]
    }
}

function calcSliderHeight() {
    height.value = document.body.clientHeight - content.value.clientHeight - 120
}

function onAssetClick(img: any) {
    Editor.Message.send('assets', 'twinkle', img.uuid);
}
</script>

<template>
    <div class="settings">
        <div class="content" ref="content">
            <div class="wrap">
                <ui-prop class="row">
                    <ui-label>Path</ui-label>
                    <ui-input v-model="file"></ui-input>
                    <ui-button @confirm="onSelectFile">Select</ui-button>
                </ui-prop>
                <ui-prop class="row">
                    <ui-button @confirm="onCheckClick">Check</ui-button>
                </ui-prop>
                <ui-progress :value="checkProgress"></ui-progress>
                <ui-input placeholder="search" v-model="filter"></ui-input>
            </div>
        </div>
        <ui-tab class="tab-menu" @change="onTabChanged($event.target.value)" :value="typeFilter">
            <ui-button v-for="k in TypeOptions">{{ k }}</ui-button>
        </ui-tab>
        <base-virtual-list :data="finalAssets" :height="height" ref="slider" class="slider" :itemHeight="30">
            <template #default="{ item }">
                <div @click="onAssetClick(item)" style="height:30px">
                    <ui-label class="selectable info-item">{{ item.name }}</ui-label>
                    <ui-label class="selectable info-item">{{ item.uuid }}</ui-label>
                    <ui-label class="selectable info-item">{{ item.type }}</ui-label>
                    <!-- <ui-label class="size info-item">{{ item.size }}</ui-label> -->
                </div>
            </template>
        </base-virtual-list>
    </div>
</template>

<style scoped>
/* 自动换行 */
.tab-menu {
    overflow: hidden;
    width: 100%;
    height: 30px;
    padding: 2px;
    margin-bottom: 20px;
    overflow: auto;
}

.tab-menu>.ui-button {
    float: left;
    width: 200px;
    padding: 2px;
    background: #FFFFFF;
    border-radius: 4px;
    /* 每5个一行，每个间隔(100%-卡片宽度*5)/4 */
    margin-right: calc(25% - 250px);
}

.wrap >.ui-button:nth-of-type(5n) {
    /* 每行第5个不需要列间隔 */
    margin-right: 0;
    /* 每行第5个设置行间隔=>不足5个即为最后一行，不需要行间隔 */
    margin-bottom: 20px;
}

.wrap >.ui-button:last-of-type {
    /* 最后1个不需要行间隔=>防止最后一行正好有5个 */
    margin-bottom: 0;
}
</style>