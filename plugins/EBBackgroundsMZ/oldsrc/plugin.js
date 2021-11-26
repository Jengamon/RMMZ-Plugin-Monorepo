import _ from "lodash-core";
import Hjson from "hjson";
import { LayerConfig, Configuration, EBBShader } from "./layer_config";
import { to_boolean, sandbox, loadFileFromServer} from "./utils";

const params = PluginManager.parameters("JM_EarthboundBackgrounds");

const config_file = String(params["Config File"] || "ebb/jm_ebb_example.hjson");
const default_configuration = String(params["Default Configuration"] || "default");
const letterbox_top = Number(params["Letterbox Top"] || 0);
const letterbox_bottom = Number(params["Letterbox Bottom"] || 0);
const letterbox_color = String(params["Letterbox Color"] || "#000000");
const letterbox_default_visibility = to_boolean(params["Letterbox Visible?"]);
const scale_factor = Number(params["Scale Factor"] || 1);

let currentConfiguration = default_configuration;
let currentConfigurationDirty = true;
let nextConfiguration = null;

let letterbox_bitmap, letterbox_sprite;
let config, layers, configurations;
let background_sprite = new PIXI.Sprite();

background_sprite.visible = to_boolean(params["Enabled?"]);

sandbox(true, async () => {
    // Trust that the user knows what they are doing, and just load the config file as a JSON.
    // if(!fs.existsSync(config_file)) { throw new Error(`Cannot find file ${config_file}`); }
    let config_json = await loadFileFromServer(config_file, "application/hjson");
    config = Hjson.parse(config_json.toString('utf8'));

    layers = _.map(config.layers, (layer, index) => new LayerConfig(layer, index));
    configurations = _.mapValues(config.configurations, (config, name) => new Configuration(config, layers, name));
});

export function setNextConfiguration(to) {
    nextConfiguration = to;
};

function _setConfiguration(to) {
    if(configurations[to] == undefined)
        throw new Error(`Unknown configuration: ${to}`);
    currentConfiguration = to;
    currentConfigurationDirty = true;
};

export function setConfiguration(to) {
    if($gameParty.inBattle()) {
        _setConfiguration(to);
    } else {
        setNextConfiguration(to);
    }
};

export function setDefaultConfiguration() {
    _setConfiguration(default_configuration);
};

export function setLetterboxVisible(to) {
    if (letterbox_sprite != undefined) {
        letterbox_sprite.visible = to;
    }
}

export function getConfigurations() {
    return _.keys(configurations);
}

export function getConfiguration() {
    if(nextConfiguration != null) {
        return nextConfiguration;
    }
    return currentConfiguration;
}

export function enabled(enable) {
    background_sprite.visible = enable;
}

export function isEnabled() {
    return background_sprite.visible;
}

// Sprite fix
Object.defineProperty(Sprite.prototype, "origin", {
    get() { return this.anchor; },
    set(value) { this.anchor = value; }
});

// Command Interpreter
var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
Game_Interpreter.prototype.pluginCommand = function(command, args) {
    _Game_Interpreter_pluginCommand.call(this, command, args);
    if (command === 'EarthboundBackgrounds') {
        switch (args[0]) {
        case 'enabled?':
            enabled(args[1]);
            break;
        case 'set':
            setConfiguration(args[1]);
            break;
        case 'setNext':
            setNextConfiguration(args[1]);
            break;
        case 'setDefault':
            setDefaultConfiguration();
            break;
        case 'setLetterboxVisible':
            setLetterboxVisible(to_boolean(args[1]));
            break;
        }
    }
};

/// Injection Point
let _SB_createDisplayObjects = Scene_Battle.prototype.createDisplayObjects;
Scene_Battle.prototype.createDisplayObjects = function() {
    letterbox_bitmap = new Bitmap(Graphics.width * 3, Graphics.height);
    letterbox_bitmap.fillRect(0, 0, Graphics.width * 3, letterbox_top, letterbox_color);
    letterbox_bitmap.fillRect(0, Graphics.height - letterbox_bottom, Graphics.width * 3, letterbox_bottom, letterbox_color);
    letterbox_sprite = new Sprite(letterbox_bitmap);
    letterbox_sprite.position.x = -Graphics.width;

    _SB_createDisplayObjects.apply(this, arguments);

    if(nextConfiguration) {
        _setConfiguration(nextConfiguration);
        nextConfiguration = null;
    } else {
        setDefaultConfiguration(); // Reset to default configuration whenever a battle is started
    }
    setLetterboxVisible(letterbox_default_visibility);
};

// Yanfly Battle Core fix, just don't touch us.
Spriteset_Battle.prototype.updateZCoordinates = function() {
    this._battleField.children.sort(this.battleFieldDepthCompare);
};

const ebb_config_tag = /\[\s*EBB\s*:\s*(\w+)\s*\]/i;
var _BM_setup = BattleManager.setup;
BattleManager.setup = function() {//troopId, canEscape, canLose) {
    _BM_setup.apply(this, arguments);

    let troopName = $gameTroop.troop().name;
    let matches = troopName.match(ebb_config_tag);
    if(matches) {
        setConfiguration(matches[1]);
    }
};

Spriteset_Battle.prototype.adjustSprite = function(layer, sprite) {
    let width = Graphics.width;
    let height = Graphics.height;

    if(layer.image_mode == "tiled") {
        sprite.position.x = -width / 2;
        sprite.position.y = -height/2;
        sprite.width = width * 2;
        sprite.height = height * 2;
    } else if(layer.image_mode == "stretched") {
        sprite.position.x = -width;
        sprite.position.y = -height;
        sprite.width = width * 3;
        sprite.height = height * 3;
        sprite.tileScale.x = (width) / layer._image.width;
        sprite.tileScale.y = (height) / layer._image.height;
    }

    let palette_sprite = PIXI.Sprite.from(layer._palette.baseTexture);
    sprite.palette = palette_sprite;

    // palette_sprite.blendMode = PIXI.utils.correctBlendMode(PIXI.BLEND_MODES.MULTIPLY, false);
    //sprite.blendMode = PIXI.BLEND_MODES.ADD;
    sprite.filters = [new EBBShader(configurations[currentConfiguration], layer, palette_sprite, {scale_factor})];
}

let _SB_createBattleback = Spriteset_Battle.prototype.createBattleback;
Spriteset_Battle.prototype.createBattleback = function() {
    _SB_createBattleback.apply(this, arguments);
    this.oldb1s = this._back1Sprite;
    this.oldb2s = this._back2Sprite;
    let bitmap = new Bitmap(Graphics.width, Graphics.height);
    bitmap.fillRect(0, 0, Graphics.width, Graphics.height, "#000000");
    let bg_block = new Sprite(bitmap);

    let configuration = configurations[currentConfiguration];
    this._back1Sprite = configuration.backSprite;
    this._back2Sprite = configuration.frontSprite;
    this.adjustSprite(configuration.backLayer, this._back1Sprite);
    this.adjustSprite(configuration.frontLayer, this._back2Sprite);

    let old_visible = background_sprite.visible;
    background_sprite = new PIXI.Sprite();
    background_sprite.visible = old_visible;
    background_sprite.addChild(bg_block);
    background_sprite.addChild(this._back1Sprite.palette);
    background_sprite.addChild(this._back1Sprite);
    background_sprite.addChild(this._back2Sprite.palette);
    background_sprite.addChild(this._back2Sprite);
    background_sprite.addChild(letterbox_sprite);
    this._battleField.addChild(background_sprite);

    this.prevTick = configuration.elapsed;
};

var _SB_updateBattleback = Spriteset_Battle.prototype.updateBattleback ;
Spriteset_Battle.prototype.updateBattleback  = function() {
    _SB_updateBattleback.apply(this, arguments);
    let configuration = configurations[currentConfiguration];
    if(currentConfigurationDirty) {
        configuration.tick();
        this.prevTick = configuration.elapsed;
        background_sprite.removeChild(this._back1Sprite.palette);
        background_sprite.removeChild(this._back2Sprite.palette);
        let index = background_sprite.getChildIndex(this._back1Sprite);
        let index2 = background_sprite.getChildIndex(this._back2Sprite);
        background_sprite.removeChild(this._back1Sprite);
        background_sprite.removeChild(this._back2Sprite);
        // console.log(index, index2);
        
        this._back1Sprite = configuration.backSprite;
        this._back2Sprite = configuration.frontSprite;
        this.adjustSprite(configuration.backLayer, this._back1Sprite);
        this.adjustSprite(configuration.frontLayer, this._back2Sprite);
        background_sprite.addChild(this._back1Sprite.palette);
        background_sprite.addChildAt(this._back1Sprite, index);
        background_sprite.addChild(this._back1Sprite.palette);
        background_sprite.addChildAt(this._back2Sprite, index2);
        
        currentConfigurationDirty = false;
    }

    this.oldb1s.visible = !background_sprite.visible;
    this.oldb2s.visible = !background_sprite.visible;

    // Properly scroll the layers
    let back1Layer = configuration.backLayer;
    let back2Layer = configuration.frontLayer;
    let delta = configuration.elapsed - this.prevTick;

    this._back1Sprite.tilePosition.x += (back1Layer.scroll[0] * delta * 60);
    this._back1Sprite.tilePosition.y += (back1Layer.scroll[1] * delta * 60);
    this._back2Sprite.tilePosition.x += (back2Layer.scroll[0] * delta * 60);
    this._back2Sprite.tilePosition.y += (back2Layer.scroll[1] * delta * 60);

    this.prevTick = configuration.elapsed;
};

let _SB_locateBattleback = Spriteset_Battle.prototype.locateBattleback;
Spriteset_Battle.prototype.locateBattleback = function() {
    let cb1s = this._back1Sprite;
    let cb2s = this._back2Sprite;
    if(!background_sprite.visible) {
        this._back1Sprite = this.oldb1s;
        this._back2Sprite = this.oldb2s;
        _SB_locateBattleback.apply(this, arguments);
    }
    this._back1Sprite = cb1s;
    this._back2Sprite = cb2s;
};