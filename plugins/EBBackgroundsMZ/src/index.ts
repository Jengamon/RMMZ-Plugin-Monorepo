/* eslint-disable @typescript-eslint/no-this-alias */
import * as json5 from "json5";
import { $gameSystem, PluginManager, Scene_Battle, Sprite, Spriteset_Battle, Sprite_Battleback } from "rmmz";
import { Configuration, EBBFilter } from "./layer_config";
import { getFileFromServer } from "./utils";
import * as PIXI from "pixi.js";

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

const configuration1 = new Configuration({
    type: "horizontal",
    amplitude: 10,
    frequency: 5,
});

const configuration2 = new Configuration({
    type: "horizontal_interlaced",
    amplitude: 30,
    frequency: 45,
});

interface Spriteset_BattleExt {
    _ebb1Sprite: Sprite;
    _ebb2Sprite: Sprite;
}

const SB_createBackground = Spriteset_Battle.prototype.createBackground;
Spriteset_Battle.prototype.createBackground = function (this: Spriteset_Battle) {
    SB_createBackground.apply(this, []);

    const _ebb1Sprite = new Sprite();
    const _ebb2Sprite = new Sprite();

    _ebb1Sprite.filters = [new EBBFilter(configuration1)];
    _ebb2Sprite.filters = [new EBBFilter(configuration2)];

    this._backgroundSprite.addChild(_ebb1Sprite);
    this._backgroundSprite.addChild(_ebb2Sprite);

    {
        const nthis = this as Spriteset_Battle & Spriteset_BattleExt;
        nthis._ebb1Sprite = _ebb1Sprite;
        nthis._ebb2Sprite = _ebb2Sprite;
    }

    console.log("ghas");
};

const SB_createBattleback = Spriteset_Battle.prototype.createBattleback;
Spriteset_Battle.prototype.createBattleback = function (this: Spriteset_Battle) {
    SB_createBattleback.apply(this, []);

    this._back1Sprite.visible = false;
    this._back2Sprite.visible = false;

    console.log("goomba");
}