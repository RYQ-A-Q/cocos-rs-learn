<script lang="ts" setup>
import { VueFlow } from '@vue-flow/core'

import { computed, ref, watch, onMounted, Ref, onUnmounted } from 'vue';
import * as fs from 'fs'
import { join } from 'path';

/* these are necessary styles for vue flow */
import '@vue-flow/core/dist/style.css';

/* this contains the default theme, these are optional styles */
import '@vue-flow/core/dist/theme-default.css';
import { getAllPackageInfo } from './check-bundles';
import { EditorStorage } from '../../utils/editor-storage';
let pkgInfo: any = null;

const vueFlow: Ref = ref(null)
const elements: Ref = ref([])
const currentStatus: Ref = ref({
    type: 1,
    pkg: "",
    targetPkg: "",
    uuid: "",
});
const resFilter: Ref = ref("")
const chOnlyShowFilter: Ref = ref(null)
const fguiAssetDir: Ref<string> = ref("")
const chContainClearOnPublish: Ref = ref(null)

let nodePosMap: any = {};
let _tempPos = { x: 0, y: 0 };

watch(resFilter, (val) => {
    refreshGraph();
});

onMounted(() => {
    fguiAssetDir.value = EditorStorage.get("fguiAssetDir", "");

    nodePosMap = EditorStorage.get("fguiNodePosMap") || {};
});

onUnmounted(() => {
    saveNodePos();
});

function getNodePos(type: number, id: string, defaultX = 0, defaultY = 0) {
    _tempPos.x = defaultX;
    _tempPos.y = defaultY;

    let nodePos = nodePosMap[type];
    if (!nodePos) {
        return _tempPos;
    }

    let pos = nodePos[id];
    if (!pos) {
        return _tempPos;
    }

    return pos;
}

function clearNodePos() {
    nodePosMap = {};
    EditorStorage.remove("fguiNodePosMap");
}

function onSavePosNode() {
    saveNodePos();
}

function onClearNodePos() {
    clearNodePos();
    refreshGraph();
}

watch(fguiAssetDir, (val) => {
    EditorStorage.set("fguiAssetDir", val, true);
});

function onOnlyShowFilterChanged() {
    refreshGraph();
}

function onClearOnPublishChanged() {
    collectData();
    refreshGraph();
}

function filterTest(name: string) {
    if (!resFilter.value) {
        return false;
    }

    if (name.toLocaleLowerCase().indexOf(resFilter.value.toLocaleLowerCase()) >= 0) {
        return true;
    }

    return false;
}

function needFilter() {
    if (!resFilter.value) {
        return false;
    }

    if(chOnlyShowFilter.value.value) {
        return true;
    }

    return false;
}

function showPackages(info: any) {
    let pkgs = Object.keys(info.packageRes);
    let pkgNode: any[] = [];
    let hasNode: any = {};
    let count = 0;
    for (let i = 0; i < pkgs.length; i++) {
        let pkg = pkgs[i];
        let className = "vue-flow__node-custom";
        if (filterTest(pkg)) {
            className = "vue-flow__node-active";
        }else if(needFilter()) {
            continue;
        }

        let y = 100 * (count % 10);
        let x = 200 * Math.floor(count / 10);

        let pos = getNodePos(1, pkg, x, y);
        x = pos.x;
        y = pos.y;

        let node = {
            id: pkg,
            label: pkg,
            position: { x, y },
            type: "pkg",
            class: className,
        }
        pkgNode.push(node);
        count++;

        // 找出依赖的包
        let usedRes = info.packageUsed[pkg];
        if (!usedRes) {
            continue;
        }
        let keys = Object.keys(usedRes);
        let pkgRes = info.packageRes[pkg];
        let internalNode = null;
        keys.forEach((uuid) => {
            if (!pkgRes[uuid]) {
                let targetPKG = info.resPackageMap[uuid];
                if (!targetPKG) {
                    // targetPKG = "internal";
                    // if(!internalNode) {
                    //     internalNode = {
                    //         id: targetPKG,
                    //         label: targetPKG,
                    //         position: { x: -200, y: -200 },
                    //     }
                    //     pkgNode.push(internalNode);
                    // }
                    return;
                } else if (targetPKG == pkg) {
                    return;
                }

                let connName = `${pkg}-${targetPKG}`;
                if (hasNode[connName]) {
                    return;
                }

                let edge = {
                    id: connName,
                    target: targetPKG,
                    source: pkg,
                    type: "use",
                }

                hasNode[connName] = true;
                pkgNode.push(edge);
            }
        });
    }

    elements.value = pkgNode;
}

function showPackageRes(info: any, pkgName: string) {
    let pkgNode: any[] = [];
    let res = info.packageRes[pkgName];
    if (!res) {
        return;
    }

    let x = 0;
    let y = 0;
    let pos = getNodePos(2, pkgName, x, y);
    x = pos.x;
    y = pos.y;

    let node = {
        id: pkgName,
        label: pkgName,
        position: { x, y },
        type: "pkg",
        class: "vue-flow__node-custom",
    };
    pkgNode.push(node);

    let resKeys = Object.keys(res);
    let count = 0;
    for (let j = 0; j < resKeys.length; j++) {
        let uuid = resKeys[j];
        let resName = res[uuid];
        let className = "";
        if (filterTest(resName)) {
            className = "vue-flow__node-res-active";
        }else if(needFilter()) {
            continue;
        }

        let y = 100 * (count % 10) + 100;
        let x = 200 * Math.floor(count / 10) + 100;
        pos = getNodePos(2, uuid, x, y);
        x = pos.x;
        y = pos.y;

        let resNode = {
            id: uuid,
            label: resName,
            position: { x, y },
            type: "res",
            class: className,
        }
        pkgNode.push(resNode);

        // let edge = {
        //     id: `${uuid}-${pkgName}`,
        //     target: uuid,
        //     source: pkgName,
        // }
        // pkgNode.push(edge);

        count++;
    }

    elements.value = pkgNode;
}

/**
 * 显示包之间的依赖关系
 * @param info 
 * @param pkgName 
 * @param targetPkgName 
 */
function showRelationPackage(info: any, pkgName: string, targetPkgName: string) {
    let pkgNode: any[] = [];
    let usedRes = info.packageUsed[pkgName];
    let pkgRes = info.packageRes[pkgName];

    let x = -300;
    let y = -200;
    let pos = getNodePos(4, pkgName, x, y);
    x = pos.x;
    y = pos.y;

    // source node
    let sourceNode = {
        id: pkgName,
        label: pkgName,
        position: { x,y },
        type: "pkg",
        class: "vue-flow__node-custom",
    }
    pkgNode.push(sourceNode);

    // 包使用的资源
    let resKeys = Object.keys(usedRes);
    let hasPkg: any = {};
    let hasNode: any = {};
    let count = 0;
    for (let i = 0; i < resKeys.length; i++) {
        let uuid = resKeys[i];
        // 如果是内部资源，不显示
        if (pkgRes[uuid]) {
            continue;
        }

        // 资源所在的包
        let tgtPkg = info.resPackageMap[uuid];
        if (!tgtPkg) {
            tgtPkg = "internal";
        }

        if (!hasPkg[tgtPkg]) {
            let x = Object.keys(hasPkg).length * 200 + 300;
            let y = -200;
            pos = getNodePos(4, tgtPkg, x, y);
            x = pos.x;
            y = pos.y;

            // target node
            let targetNode = {
                id: tgtPkg,
                label: tgtPkg,
                position: { x, y },
                type: "pkg",
                class: "vue-flow__node-custom",
            }
            pkgNode.push(targetNode);

            // edge
            let edge = {
                id: `${pkgName}-${targetPkgName}`,
                target: tgtPkg,
                source: pkgName,
            }
            pkgNode.push(edge);
            hasPkg[tgtPkg] = true;
        }

        let resName = getResName(uuid);// usedRes[uuid];
        let y = 100 * (count % 10);
        let x = 200 * Math.floor(count / 10) + 200;
        pos = getNodePos(4, uuid, x, y);
        x = pos.x;
        y = pos.y;

        let resNode = {
            id: uuid,
            label: resName,
            position: { x, y },
            type: "res",
        }
        pkgNode.push(resNode);

        let edge = {
            id: `${uuid}-${pkgName}`,
            target: uuid,
            source: tgtPkg,
            label: "",
            type: "use2",
        }
        pkgNode.push(edge);

        // 添加当前包的资源
        let nodeUuid = usedRes[uuid];
        if (!hasNode[nodeUuid]) {
            let resName = getResName(nodeUuid);
            let className = "";
            if (filterTest(resName)) {
                className = "vue-flow__node-res-active";
            }else if(needFilter()) {
                continue;
            }

            let y = 100 * (count % 10);
            let x = -200 * Math.floor(count / 10) - 200;
            pos = getNodePos(4, nodeUuid, x, y);
            x = pos.x;
            y = pos.y;

            let resNode = {
                id: nodeUuid,
                label: resName,
                position: { x, y },
                type: "res",
                class: className,
            }
            pkgNode.push(resNode);

            let edge = {
                id: `${pkgName}-${nodeUuid}`,
                target: nodeUuid,
                source: pkgName,
                label: "",
                type: "use2",
            }
            pkgNode.push(edge);

            edge = {
                id: `${nodeUuid}-${uuid}`,
                target: uuid,
                source: nodeUuid,
                label: "",
                type: "use2",
            }
            pkgNode.push(edge);

            hasNode[nodeUuid] = true;
        }

        count++;
    }

    elements.value = pkgNode;
}

function getResName(uuid: string) {
    let pkgName = pkgInfo.resPackageMap[uuid];
    let pkgRes = pkgInfo.packageRes[pkgName];
    if (!pkgRes) {
        return "";
    }
    let resName = pkgRes[uuid];
    return resName || "";
}

/**
 * 显示资源和包之间的依赖关系
 * @param info 
 * @param uuid 
 */
function showResReleationPkgs(info: any, uuid: string) {
    let pkgNode: any[] = [];
    let pkgName = info.resPackageMap[uuid];
    let pkgRes = info.packageRes[pkgName];
    let resName = pkgRes[uuid];
    
    let x = 0;
    let y = 0;
    let pos = getNodePos(3, uuid, x, y);
    x = pos.x;
    y = pos.y;

    let resNode = {
        id: uuid,
        label: resName,
        position: { x,y },
        type: "res",
        class: "vue-flow__node-res-center",
    }
    pkgNode.push(resNode);

    x = 0;
    y = -100;
    pos = getNodePos(3, pkgName, x, y);
    x = pos.x;
    y = pos.y;

    let sourceNode = {
        id: pkgName,
        label: pkgName,
        position: { x,y },
        type: "pkg",
        class: "vue-flow__node-custom",
    }
    pkgNode.push(sourceNode);

    let edge = {
        id: `${uuid}-${pkgName}`,
        target: uuid,
        source: pkgName,
        type: "use2",
    }
    pkgNode.push(edge);

    let allpkgs = Object.keys(info.packageRes);
    let count = 0;
    let pkgY = 0;
    for (let i = 0; i < allpkgs.length; i++) {
        let pkg = allpkgs[i];
        if (pkg == pkgName || !pkg) {
            continue;
        }

        let usedRes = info.packageUsed[pkg];
        if (!usedRes || !usedRes[uuid]) {
            continue;
        }

        let x = 200 * (count % 5) - 400;
        let y = Math.floor(count / 5) * 100 + 200;
        pos = getNodePos(3, pkg, x, y);
        x = pos.x;
        y = pos.y;

        let usedPkgNode = {
            id: pkg,
            label: pkg,
            position: { x, y },
            type: "pkg",
            class: "vue-flow__node-custom",
        };
        pkgNode.push(usedPkgNode);

        let edge = {
            id: `${pkgName}-${pkg}`,
            target: pkg,
            source: uuid,
        };
        pkgNode.push(edge);

        pkgY = y;
        count++;
    }

    let allUsedRes = info.prefabsUsed[uuid];
    if (allUsedRes) {
        let count = 0;
        for (let i = 0; i < allUsedRes.length; i++) {
            let usedUuid = allUsedRes[i];
            let resName = getResName(usedUuid);
            let className = "";
            if (filterTest(resName)) {
                className = "vue-flow__node-res-active";
            }else if(needFilter()) {
                continue;
            }

            let y = 100 * (count % 10);
            let x = 200 * Math.floor(count / 10) + 200;
            pos = getNodePos(3, usedUuid, x, y);
            x = pos.x;
            y = pos.y;

            let resNode = {
                id: usedUuid,
                label: resName,
                position: { x, y },
                type: "res",
                class: className,
            }
            pkgNode.push(resNode);

            let edge = {
                id: `${uuid}-${usedUuid}`,
                target: usedUuid,
                source: uuid,
                type: "use2",
            }
            pkgNode.push(edge);

            count++;
        }
    }

    let usedPrefabs = info.resUsed[uuid] as string[];
    if (usedPrefabs && usedPrefabs.length > 0) {
        let count = 0;
        for (let i = 0; i < usedPrefabs.length; i++) {
            let usedPrefab = usedPrefabs[i];
            let prefabName = getResName(usedPrefab);
            let className = "";
            if (filterTest(prefabName)) {
                className = "vue-flow__node-res-active";
            }else if(needFilter()) {
                continue;
            }

            let y = 100 * (count % 10) + 200 + pkgY;
            let x = -200 * Math.floor(count / 10) - 200;
            pos = getNodePos(3, usedPrefab, x, y);
            x = pos.x;
            y = pos.y;

            let resNode = {
                id: usedPrefab,
                label: prefabName,
                position: { x, y },
                type: "res",
                class: className,
            }
            pkgNode.push(resNode);

            let edge0 = {
                id: `${uuid}-${usedPrefab}`,
                target: uuid,
                source: usedPrefab,
                type: "use2",
                style: { "stroke":'#404040', "stroke-dasharray":"5,4"}, 
            }
            pkgNode.push(edge0);

            let containtPkg = info.resPackageMap[usedPrefab];
            let edge = {
                id: `${usedPrefab}-${pkgName}`,
                target: usedPrefab,
                source: containtPkg,
                type: "use2",
            }
            pkgNode.push(edge);

            count++;
        }
    }

    elements.value = pkgNode;
}

function saveNodePos() {
    if(currentStatus.value && currentStatus.value.type) {
        let nodePos = nodePosMap[currentStatus.value.type];
        if(!nodePos) {
            nodePos = {};
            nodePosMap[currentStatus.value.type] = nodePos;
        }

        let nodes = vueFlow.value?.nodes;
        if(nodes) {
            nodes.forEach((node: any) => {
                nodePos[node.id] ={x: node.position.x, y: node.position.y};
            });
        }

        EditorStorage.set("fguiNodePosMap", nodePosMap);
    }
}

function refreshGraph() {
    switch (currentStatus.value.type) {
        case 1:
            showPackages(pkgInfo);
            break;
        case 2:
            showPackageRes(pkgInfo, currentStatus.value.pkg);
            break;
        case 3:
            showResReleationPkgs(pkgInfo, currentStatus.value.uuid);
            break;
        case 4:
            showRelationPackage(pkgInfo, currentStatus.value.pkg, currentStatus.value.targetPkg);
            break;
        case 5:
            showResReleationPkgs(pkgInfo, currentStatus.value.uuid);
            break;
    }
    moveToCenter();
}

async function collectData() {
    let assetDir = fguiAssetDir.value.startsWith("project://") ? join(Editor.Project.path, fguiAssetDir.value.replace("project://", "")) : fguiAssetDir.value;
    if(!fs.existsSync(assetDir)) {
        Editor.Dialog.error("Can't find fgui assets path");
        return;
    }

    let info = await getAllPackageInfo(assetDir, chContainClearOnPublish.value.value);
    pkgInfo = info;

    saveNodePos();
    currentStatus.value = {
        type: 1,
        pkg: "",
        targetPkg: "",
        uuid: "",
    };
    refreshGraph();
    clearFilter();
}

function clearFilter() {
    resFilter.value = "";
}

function onHomeClick() {
    saveNodePos();
    currentStatus.value = {
        type: 1,
        pkg: "",
        targetPkg: "",
        uuid: "",
    };
    refreshGraph();
    clearFilter();
}

function onNodeClick(props: any) {
    if (!props.event.ctrlKey) {
        return;
    }

    const node = props.node;
    if (node.type == "res") {
        onAssetClick(node.id);
    }
}

function onNodeDClick(props: any) {
    const node = props.node;
    if (node.type == "pkg") {
        saveNodePos();
        currentStatus.value = {
            type: 2,
            pkg: node.id,
            targetPkg: "",
            uuid: "",
        };
        refreshGraph();
        clearFilter();
    } else if (node.type == "res") {
        saveNodePos();
        currentStatus.value = {
            type: 3,
            pkg: "",
            targetPkg: "",
            uuid: node.id,
        };
        refreshGraph();
        clearFilter();
    }
}

function onEdgeDClick(props: any) {
    const edge = props.edge;
    if (edge.type == "use") {
        saveNodePos();
        currentStatus.value = {
            type: 4,
            pkg: edge.source,
            targetPkg: edge.target,
            uuid: "",
        };
        refreshGraph();
        clearFilter();
    } else if (edge.type == "use2") {
        saveNodePos();
        currentStatus.value = {
            type: 5,
            pkg: "",
            targetPkg: "",
            uuid: edge.target,
        };
        refreshGraph();
        clearFilter();
    }
}

function onAssetClick(uuid: string) {
    // Editor.Message.send('assets', 'twinkle', uuid);
    Editor.Clipboard.write("text", uuid);
}

function moveToCenter() {
    vueFlow.value?.setCenter(0, 0);
}
</script>

<template>
    <ui-input v-model="fguiAssetDir" placeholder="fairygui assets path"></ui-input>
    <ui-button @click="collectData">Collect</ui-button>
    <ui-button @click="onHomeClick">Home</ui-button>
    <ui-button @click="onSavePosNode">Save Pos</ui-button>
    <ui-button @click="onClearNodePos">Reset Pos</ui-button>
    <div class="row"><ui-input v-model="resFilter" placeholder="search" style="width:80%"></ui-input><ui-checkbox ref="chOnlyShowFilter" @change="onOnlyShowFilterChanged">Only Show Filter</ui-checkbox></div>
    <ui-checkbox ref="chContainClearOnPublish" @change="onClearOnPublishChanged">Contains Clear On Publish Resource</ui-checkbox>
    <VueFlow ref="vueFlow" v-model="elements" @nodeClick="onNodeClick" @nodeDoubleClick="onNodeDClick"
        @edge-double-click="onEdgeDClick" />
</template>

<style scoped>
.full {
    width: 100%;
    height: 100%;
}

.row {
    display: flex;
}
</style>