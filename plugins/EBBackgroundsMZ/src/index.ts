import * as json5 from "json5";
import { PluginManager } from "rmmz";
import "./layer_config";
import { FileAccessError, loadFileFromServer } from "./utils";

const parameters = PluginManager.parameters("JM_EarthBoundBackgroundsMZ");

const conf_file = parameters["config"] || "ebb/ebb_config.json";

console.log(conf_file);

const config = {};

try {
    loadFileFromServer(conf_file)
        .then(res => res.text())
        .then(res => Object.assign(config, json5.parse(res)));
} catch (e) {
    if (e instanceof FileAccessError) {
        throw e;
    } else {
        throw e;
    }
}

console.log(config);

export function greet(name: string) {
    return `Hello, ${name}`;
}