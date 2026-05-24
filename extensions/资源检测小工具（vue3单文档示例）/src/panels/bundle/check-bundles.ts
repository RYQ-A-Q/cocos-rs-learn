import { getAllFilesSync } from "../../utils/utils";
import * as fs from "fs";
import * as path from "path";

/**
 * 检查包中的预制体是否有使用其他包中的资源
 */
const packageDir = Editor.Project.path + "/assets";
const uuidReg = `(?<="__uuid__" ?: ?").*?(?=")`;

export function getAllPackageInfo() {
    let files = getAllFilesSync(packageDir);
    let packages: { name: string; path: string }[] = [];

    for (let i = 0; i < files.length; i++) {
        let file = files[i];
        if (file.endsWith(".meta")) {
            let stat = fs.statSync(file);
            if (stat.isFile()) {
                let content = fs.readFileSync(file, "utf-8");
                let json = JSON.parse(content);
                if (json.userData && json.userData.isBundle) {
                    let bundFile = file.replace(".meta", "");
                    packages.push({
                        name: path.basename(bundFile),
                        path: bundFile,
                    });
                }
            }
        }
    }

    // 包中资源： 包名->资源uuid->资源名
    let packageRes: { [key: string]: { [key: string]: string } } = {};
    // 资源所在包： uuid->包名
    let resPackageMap: { [key: string]: string } = {};
    // 包使用的资源： 包名->资源uuid->预制体uuid
    let packageUsed: { [key: string]: { [key: string]: string } } = {};
    // 预制体使用的资源： 预制体(材质球等)uuid->资源uuid
    let prefabsUsed: { [key: string]: string[] } = {};
    // 资源被那个预制体使用： 资源uuid->预制体uuid
    let resUsed: { [key: string]: string[] } = {};

    packageRes["internal"] = {};

    // 获取包中的资源
    for (let i = 0; i < packages.length; i++) {
        let pkg = packages[i];
        if (!packageRes[pkg.name]) {
            packageRes[pkg.name] = {};
        }

        let allFiles = getAllFilesSync(pkg.path);
        for (let j = 0; j < allFiles.length; j++) {
            let file = allFiles[j];
            let ext = path.extname(file);
            let name = path.basename(file, ext);
            if (file.endsWith(".meta")) {
                let content = fs.readFileSync(file, "utf-8");
                let json = JSON.parse(content);
                let uuid = json.uuid.split("@")[0];
                name = json.userData?.name || name;
                packageRes[pkg.name][uuid] = name;
                resPackageMap[uuid] = pkg.name;
            }
        }
    }    

    // 获取包中的预制体使用的资源
    for (let i = 0; i < packages.length; i++) {
        let pkg = packages[i];
        if (!packageUsed[pkg.name]) {
            packageUsed[pkg.name] = {};
        }

        let allFiles = getAllFilesSync(pkg.path);
        for (let j = 0; j < allFiles.length; j++) {
            let file = allFiles[j];
            let ext = path.extname(file);
            let name = path.basename(file, ext);
            if (ext == ".prefab" || ext == ".scene" || ext == ".mtl") {
                let prefabFile = file + ".meta";
                let prefabUuid = "";
                if(fs.existsSync(prefabFile)) {
                    let prefabContent = fs.readFileSync(prefabFile, "utf-8");
                    let prefabJson = JSON.parse(prefabContent);
                    prefabUuid = prefabJson.uuid.split("@")[0];
                    if(!prefabsUsed[prefabUuid]) {
                        prefabsUsed[prefabUuid] = [];
                    }                    
                }

                let content = fs.readFileSync(file, "utf-8");
                // find all uuid
                let matches = content.match(new RegExp(uuidReg, "g"));
                if (matches) {
                    matches.forEach((uuid) => {
                        uuid = uuid.split("@")[0];
                        packageUsed[pkg.name][uuid] = prefabUuid;
                        if(prefabUuid && !prefabsUsed[prefabUuid].includes(uuid)) {
                            prefabsUsed[prefabUuid].push(uuid);    
                            
                            if(!resUsed[uuid]) {
                                resUsed[uuid] = [];
                            }
                            if(!resUsed[uuid].includes(prefabUuid)) {
                                resUsed[uuid].push(prefabUuid);
                            }

                            // 内部资源
                            if(!resPackageMap[uuid]) {
                                resPackageMap[uuid] = "internal";
                                Editor.Message.request('asset-db', 'query-path', uuid).then((p) => {
                                    let name = path.basename(p || uuid);
                                    packageRes["internal"][uuid] = name;
                                });
                            }   
                        }
                    });
                }           
            }
        }
    }

    // console.log("包名\t预制体名\t资源名\t资源uuid\t资源所在包");
    // for (let i = 0; i < packages.length; i++) {
    //     let pkg = packages[i];
    //     let prefabRes = prefabsUsed[pkg.name];
    //     if (!prefabRes) {
    //         continue;
    //     }
    //     let keys = Object.keys(prefabRes);
    //     let pkgRes = packageRes[pkg.name];
    //     keys.forEach((uuid) => {
    //         if (!pkgRes[uuid]) {
    //             // console.log(`包${pkg}中预制体${prefabRes[uuid]}使用了非本包资源${uuid},资源所在包为${resPackageMap[uuid]}`);
    //             // 表格输出
    //             let targetPKG = resPackageMap[uuid];
    //             console.log(`${pkg.name}\t${prefabRes[uuid]}\t${packageRes[targetPKG][uuid]}\t${uuid}\t${targetPKG}`);
    //         }
    //     });
    // }

    return {
        packageRes,
        resPackageMap,
        packageUsed,
        prefabsUsed,
        resUsed,
    };
}