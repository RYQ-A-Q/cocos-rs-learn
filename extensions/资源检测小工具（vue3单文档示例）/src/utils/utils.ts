import * as fs from "fs-extra";
import { join } from "path";
import path = require("path");

export function registENV() {
    const infos = Editor.Package.getPackages({
        name: "resource-checker"
    });

    const __PLUGIN_PATH__ = infos[0].path;
    //@ts-ignore
    globalThis.__PLUGIN_PATH__ = __PLUGIN_PATH__;

    const fileContent = fs.readFileSync(path.join(__PLUGIN_PATH__, "./package.json"))
    const PackageJSON = JSON.parse(fileContent.toString());    
    //@ts-ignore
    globalThis.PackageJSON = PackageJSON;
}

export function loadCSS(files: string[]) {
    let css = ""
    for (const file of files) {
        css += fs.readFileSync(file, 'utf-8')
    }

    return css
}

export function loadJS(file: string) {
    let scriptElement = document.createElement('script')
    scriptElement.setAttribute('type', 'text/javascript')
    scriptElement.setAttribute('src', file)
    document.body.appendChild(scriptElement)
}


export function __ASSET__(path: string) {
    return __PLUGIN_PATH__ + `/assets/${path}`
}

export function __ROOT__(path: string) {
    return __PLUGIN_PATH__ + `/${path}`
}  

export function loadScript(file: string, callback?: Function) {
    let scriptElement = document.createElement('script')
    scriptElement.setAttribute('type', 'text/javascript')
    scriptElement.setAttribute('src', file)
    document.body.appendChild(scriptElement)
    scriptElement.onload = () => {
        callback && callback()
    }
}

export function loadScripts(files: string[], callback?: Function) {
    let scripts = files.slice();
    if(scripts.length === 0) {
        callback && callback()
        return
    }

    let file = scripts.shift() as string
    loadScript(file, () => {
        loadScripts(scripts, callback)
    });
}

export function getAllFilesSync(filePath: string, files?: string[]){
    files ||= [];

    //根据文件路径读取文件，返回文件列表
    let all = fs.readdirSync(filePath);
    //遍历读取到的文件列表
    all.forEach((filename)=>{
        //获取当前文件的绝对路径
        var filedir = join(filePath,filename);
        //根据文件路径获取文件信息，返回一个fs.Stats对象
        let stats = fs.statSync(filedir);

        var isDir = stats.isDirectory();//是文件夹
        if(isDir){
            getAllFilesSync(filedir, files);//递归，如果是文件夹，就继续遍历该文件夹下面的文件
        }else{
            files.push(filedir,);
        }
    });   
    
    return files;
}