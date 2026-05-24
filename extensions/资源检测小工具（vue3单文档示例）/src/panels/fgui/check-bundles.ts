import { getAllFilesSync } from "../../utils/utils";
import * as fs from "fs";
import * as path from "path";/**
* 检测当前fgui包中引用的其他包资源
*/
import * as xml2js from "xml2js";

var packageIdMap = {};
var packageNameMap = {};
var resUsedMap = {};
var missResMap = {};
var allResIds = {};
var pathToUrlMap = {};
var allPackages: string[] = [];

function getPackageDir(fguiAssetDir, packageName) {
    return path.join(fguiAssetDir, packageName);
}

function getPackageName(url) {
    var pos1 = url.indexOf("//");
    if (pos1 == -1)
        return null;
    var pos2 = url.indexOf("/", pos1 + 2);
    if (pos2 == -1) {
        if (url.length > 13) {
            var pkgId = url.substr(5, 8);
            return packageIdMap[pkgId];
        }
    }

    return url.substr(pos1 + 2, pos2 - pos1 - 2);
}

async function until(condition) {
    if (condition()) {
        return true;
    } else {
        setTimeout(() => {
            until(condition);
        }, 10);
    }
}

async function collect(fguiAssetDir, packageName) {
    let pkgXml = path.join(getPackageDir(fguiAssetDir, packageName), "package.xml");
    let content = fs.readFileSync(pkgXml, "utf-8");
    let doc = await xml2js.parseStringPromise(content);
    let node: any = doc.packageDescription;
    let id = node.$.id;
    packageIdMap[id] = packageName;
    packageNameMap[packageName] = id;

    // let movieclips = findByType(doc, "//movieclip") as any[];
    // for(let node of movieclips) {
    //     let path = node.$.path;
    // }

    let nodes = doc.packageDescription.resources as any[];
    let allNodes = [];
    let keys = Object.keys(nodes[0]);
    for (let key of keys) {
        allNodes.push(...nodes[0][key]);
    }
    for (let n of allNodes) {
        let url = `ui://${id}${n.$.id}`;
        let path = n.$.path;

        let exported = n.$.exported ?? "false";
        let name = n.$.name ?? "";
        let ext = name?.split(".").pop();
        allResIds[url] = {
            pkg: packageName,
            exported: exported === "true",
            useCount: 0,
            path: path,
            name: name,
            ext: ext,
        };

        pathToUrlMap[path + name] = url;
    }
}


function onUseUrl(path, componentName, itemName, url, packageName, includesPackages) {
    let compUrl = pathToUrlMap[path];
    if (url.startsWith("ui://")) {
        let pkgName = getPackageName(url);
        if (!allPackages.includes(pkgName)) {
            console.log(`[${packageName}]引用了不存在的包[${pkgName}]`);
        }

        if (pkgName !== packageName) {
            if (!includesPackages[pkgName]) {
                includesPackages[pkgName] = [];
            }
            includesPackages[pkgName].push(`${componentName}:${itemName}->${url}`);
        }

        if (!resUsedMap[url]) {
            resUsedMap[url] = {};

            resUsedMap[url][pkgName] = [];
            resUsedMap[url][pkgName].push({
                url: url,
                pkg: pkgName,
                usePkg: "",
                component: "",
                item: "",
                compUrl: compUrl,
            });
        }
        if (!resUsedMap[url][packageName]) {
            resUsedMap[url][packageName] = [];
        }

        resUsedMap[url][packageName].push({
            url: url,
            pkg: pkgName,
            usePkg: packageName,
            component: componentName,
            item: itemName,
            compUrl: compUrl,
        });

        if (!allResIds[url]) {
            if (!missResMap[pkgName]) {
                missResMap[pkgName] = [];
            }
            missResMap[pkgName].push({
                url: url,
                usePkg: packageName,
                component: componentName,
                item: itemName,
            });
        } else {
            allResIds[url].useCount++;
        }
    }
}

// function findByType(doc, type) {
//     let nodes = xpath.find(doc, `//${type}`) as any[];
//     for(let node of nodes) {
//         node.name = type;
//     }
//     return nodes;
// }

function findByType(node, type) {
    let stack = [{node: node, key: null}];
    let nodes = [];

    while (stack.length > 0) {
        let {node, key} = stack.pop();
        if (!node) {
            continue;
        }

        let keys = Object.keys(node);
        for (let key of keys) {
            let item = node[key];
            let isObject = item && key !== "$" && key != "parent" && key != "name" && key != "children";
            if (isObject) {
                if (key === type) {
                    if(item instanceof Array) {
                        for(let i = 0; i < item.length; i++) {
                            if(typeof item[i] == "object") {
                                item[i].name = key;
                                item[i].parent = node;
                                nodes.push(item[i]);
                            }
                        }
                    }else if (typeof item == "object") {
                        item.name = key;
                        item.parent = node;
                        nodes.push(item);

                        if(item.displayList) {
                            for(let displayItem of item.displayList) {
                                stack.push({node: displayItem, key: displayItem.name});                            
                            }
                        }
                    }
                } else {
                    stack.push({node: item, key: key});
                }
            }
        }
    }

    return nodes;
}

async function check(fguiAssetDir, packageName, containClearOnPublishRes: boolean) {
    let packageDir = getPackageDir(fguiAssetDir, packageName);

    let files = getAllFilesSync(packageDir);
    let includesPackages = {};
    for (let file of files) {
        if (path.extname(file) === ".xml" && path.basename(file) !== "package.xml") {
            let relPath = path.relative(packageDir, file);
            let pathStrs = relPath.split(path.sep);
            relPath = "/" + pathStrs.join("/");

            let changed = false;
            let ext = path.extname(file);
            let componentName = path.basename(file, ext);
            let content = fs.readFileSync(file, "utf-8");
            let doc = await xml2js.parseStringPromise(content);
            let nodes = findByType(doc, "image") as any[];
            nodes.push(...findByType(doc, "loader"));
            nodes.push(...findByType(doc, "component"));
            nodes.push(...findByType(doc, "gearIcon"));
            nodes.push(...findByType(doc, "Button"));
            nodes.push(...findByType(doc, "Label"));
            nodes.push(...findByType(doc, "list"));
            nodes.push(...findByType(doc, "item"));
            nodes.push(...findByType(doc, "property"));
            for (let node of nodes) {
                let nodeName = node.name

                node.$ = node.$ || {};
                let itemName = node.$.name;                

                if (!containClearOnPublishRes && node.$) {
                    let clear = node.$.clearOnPublish || node.$.autoClearItems;
                    if(clear == undefined && node.parent && node.parent.$) {
                        if(nodeName == "gearIcon" || nodeName == "Button" || nodeName == "Label" || nodeName == "item" || nodeName == "property") {
                            clear = node.parent.$.clearOnPublish || node.parent.$.autoClearItems;
                        }
                    }

                    if (clear === "true") continue;
                }

                if (nodeName === "gearIcon") {
                    let urls = node.$.values;
                    if (!urls) continue;

                    let urlsArr = urls.split("|");
                    let defaultVal = node.$.default;
                    if (defaultVal && urlsArr.indexOf(defaultVal) === -1) {
                        urlsArr.push(defaultVal);
                    }

                    let parent = node.parent;
                    let parentItemName = parent.$.name;
                    for (let i = 0; i < urlsArr.length; i++) {
                        let url = urlsArr[i];
                        onUseUrl(relPath, componentName, `${parentItemName}:${nodeName}[${i}]`, url, packageName, includesPackages);
                    }
                } else if (nodeName === "Button" || nodeName === "Label") {
                    let url = node.$.icon;
                    if (!url) continue;

                    let parent = node.parent;
                    let parentItemName = parent.$.icon;
                    onUseUrl(relPath, componentName, parentItemName + ":" + nodeName, url, packageName, includesPackages);

                } else if (nodeName == "list") {
                    let url = node.$.defaultItem;
                    if (!url) continue;

                    onUseUrl(relPath, componentName, itemName, url, packageName, includesPackages);
                } else if (nodeName === "item") {
                    let url = node.$.url;
                    if (!url) {
                        url = node.$.icon;
                        if (!url) continue;
                    };

                    let parent = node.parent;
                    let parentItemName = parent.$.name;
                    onUseUrl(relPath, componentName, parentItemName + ":" + nodeName, url, packageName, includesPackages);

                } else if (nodeName == "property") {
                    let url = node.$.value;
                    if (!url) continue;

                    if (!url.startsWith("ui://")) continue;

                    let parent = node.parent;
                    let parentItemName = parent.$.name;
                    onUseUrl(relPath, componentName, parentItemName + ":" + nodeName, url, packageName, includesPackages);
                } else {
                    let url = node.$.url;
                    if (!url) {
                        url = node.$.src;
                        if (!url) continue;

                        let pkgValue = node.$.pkg ?? packageNameMap[packageName];
                        url = `ui://${pkgValue}${url}`;
                    }

                    if (!allResIds[url]) {
                        console.log(`remove miss url:`, url);
                    }

                    onUseUrl(relPath, componentName, itemName, url, packageName, includesPackages);
                }

                if (changed) {
                    let xmlData = doc.toString();
                    fs.writeFileSync(file, xmlData, "utf-8");
                }
            }
        }
    }
}

export async function getAllPackageInfo(fguiAssetDir: string, containClearOnPublishRes: boolean) {
    packageIdMap = {};
    packageNameMap = {};
    resUsedMap = {};
    missResMap = {};
    allResIds = {};
    allPackages = fs.readdirSync(fguiAssetDir);
    for (let index = 0; index < allPackages.length; index++) {
        const pkg = allPackages[index];
        await collect(fguiAssetDir, pkg);
    }
    
    for (let index = 0; index < allPackages.length; index++) {
        const pkg = allPackages[index];
        await check(fguiAssetDir, pkg, containClearOnPublishRes);
    }

    // 包中资源： 包名->资源uuid->资源名
    let packageRes: { [key: string]: { [key: string]: string } } = {};
    // 资源所在包： uuid->包名
    let resPackageMap: { [key: string]: string } = {};
    // 包使用的资源： 包名->资源uuid->预制体uuid
    let packageUsed: { [key: string]: { [key: string]: string } } = {};
    // 预制体使用的资源： 预制体uuid->资源uuid
    let prefabsUsed: { [key: string]: string[] } = {};
    // 资源被那个预制体使用： 资源uuid->预制体uuid
    let resUsed: { [key: string]: string[] } = {};

    for (let url in allResIds) {
        let res = allResIds[url];
        if (!packageRes[res.pkg]) {
            packageRes[res.pkg] = {};
        }
        packageRes[res.pkg][url] = res.name;
        resPackageMap[url] = res.pkg;
    }

    for (let url in resUsedMap) {
        let res = resUsedMap[url];
        for (let pkg in res) {
            if (!packageUsed[pkg]) {
                packageUsed[pkg] = {};
            }
            for(let item of res[pkg]) {
                packageUsed[pkg][item.url] = item.compUrl;
            }
        }
    }

    for (let url in resUsedMap) {
        let res = resUsedMap[url];
        for (let pkg in res) {
            for(let item of res[pkg]) {
                if (!prefabsUsed[item.compUrl]) {
                    prefabsUsed[item.compUrl] = [];
                }

                if(!prefabsUsed[item.compUrl].includes(item.url)) {
                    prefabsUsed[item.compUrl].push(item.url);

                    if (!resUsed[item.url]) {
                        resUsed[item.url] = [];
                    }
                    if(!resUsed[item.url].includes(item.compUrl)) {
                        resUsed[item.url].push(item.compUrl);
                    }
                }
            }
        }
    }   

    return {
        packageRes,
        resPackageMap,
        packageUsed,
        prefabsUsed,
        resUsed,
    };
}