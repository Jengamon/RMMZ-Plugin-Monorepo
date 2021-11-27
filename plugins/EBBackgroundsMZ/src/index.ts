import * as json5 from "json5";
import { $gameSystem, PluginManager, Spriteset_Battle } from "rmmz";
import "./layer_config";
import { getFileFromServer } from "./utils";

const parameters = PluginManager.parameters("JM_EarthBoundBackgroundsMZ");

const conf_file = parameters["config"] || "ebb/ebb_config.json";

console.log(conf_file);

const config = {};

getFileFromServer(conf_file, res => res.text())
    .then(res => Object.assign(config, json5.parse(res)))
    .catch(err => {
        console.error(err);
    });

console.log(config);

export function greet(name: string) {
    return `Hello, ${name}`;
}

// const SB_createDisplayObjects = Spriteset_Battle.prototype.createBattleback;
// Spriteset_Battle.prototype.createBattleback = function() {

// };