import path = require("path");
import { AssetInfo } from "../@types/packages/asset-db/@types/public";
import * as fs from 'fs-extra';
import { EditorStorage } from './utils/editor-storage';
const PackageJSON = require('../package.json')

export function onAssetMenu(assetInfo: AssetInfo) {
    return [
        {
            label: 'ResourceChecker',
            submenu: [
                {
                    label: 'Show Asset Relation',
                    enabled: !assetInfo.isDirectory,
                    async click() {  
                        let name = PackageJSON.name + ".bundles";
                        EditorStorage.set("currentUuid", assetInfo.uuid);
                        Editor.Panel.open(name);

                        Editor.Message.broadcast(PackageJSON.name + ":set-current-uuid", assetInfo.uuid);
                    },
                },
            ],
        },
    ];
};