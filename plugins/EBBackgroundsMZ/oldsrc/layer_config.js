import ebbShader from "./ebb_shader.frag.glsl";
import _ from "lodash-core";

function loadEBBPatternImage(filename) {
    return ImageManager.loadBitmap("img/ebattlebacks/patterns/", filename, 0, false);
}

function loadEBBPaletteImage(filename) {
    return ImageManager.loadBitmap("img/ebattlebacks/palettes/", filename, 0, false);
}

function Effect(conf, layer_index) {
    if(conf == null) {
        this._type = "none";
    } else {
        this._type = conf.type;
        if(this._type == "none") {
            // No parameters
            this._amplitude = 0;
            this._frequency = 0;
        } else if (this._type == "horizontal" || this._type == "horizontal_interlaced" || this._type == "vertical") {
            this._amplitude = conf.amplitude;
            this._frequency = conf.frequency;
        } else {
            throw new Error(`Invalid effect mode: ${this._type} in layer ${layer_index}`);
        }
    }
}

function PaletteShift(conf, layer_index) {
    if(!(conf instanceof Object)) {
        throw new Error(`"palette_shift" must be either a number or an object in layer ${layer_index}`);
    }
    this.speed = (conf.speed > 0 ? conf.speed : 0);
    this.shift_offset = conf.offset || 1;
}

function LayerConfig(conf, index) {
    this._image = loadEBBPatternImage(conf.image);
    this._image.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;
    this.image_mode = conf.image_mode || "tiled";
    this.effect = new Effect(conf.effect, index);
    this._palette = loadEBBPaletteImage(conf.image);
    this.paletteShift = ((!conf.palette_shift || typeof conf.palette_shift === "number") ? new PaletteShift({speed: conf.palette_shift}, index) : new PaletteShift(conf.palette_shift, index));

    if(conf.scroll) {
        if(!(conf.scroll instanceof Array) || conf.scroll.length != 2) {
            throw new Error(`scroll specifier must have length 2 for layer ${index}`);
        }
        this.scroll = conf.scroll;
    } else {
        this.scroll = [0, 0];
    }

    this._image.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;
    this._palette.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;
    this._palette.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
    this._palette.baseTexture.premultipliedAlpha = false;
}

function Configuration(conf, layers, name) {
    if(conf instanceof Array) {
        if(conf.length != 2 && conf.length != 3) {
            throw new Error(`configuration array must specify exactly 2 layers or 2 layers and 1 speed for configuration ${name}`);
        }

        this.layers = [layers[conf[0]], layers[conf[1]]];
        this.speed = (conf[2] === undefined ? 1 : conf[2]);
    } else {
        if(conf.layers.length != 2) {
            throw new Error(`configuration 'layers' array must specify exactly 2 layers for configuration ${name}`);
        }

        let ls = conf.layers;
        this.layers = [layers[ls[0]], layers[ls[1]]];
        this.speed = conf.speed || 1;
    }

    this.tick();
}

Configuration.prototype.tick = function() {
    this._now = Date.now();
}

Configuration.prototype._getLayerSprite = function(layer) {
    let sprite;
    if(layer.image_mode == "tiled") {
        sprite = new PIXI.extras.PictureTilingSprite(PIXI.Texture.from(layer._image.baseTexture));//new TilingSprite();
        sprite.bitmap = layer._image;
    } else if(layer.image_mode == "stretched") {
        sprite = new PIXI.extras.PictureTilingSprite(PIXI.Texture.from(layer._image.baseTexture));
        sprite.bitmap = layer._image;
        sprite.texture.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;
    } else {
        throw new Error(`Unsupported image mode: ${layer.image_mode}`);
    }
    //sprite.alpha = 0.7;
    sprite.blendMode = PIXI.BLEND_MODES.ADD;
    return sprite;
};

Object.defineProperty(Configuration.prototype, "elapsed", {
    get() {
        return (Date.now() - this._now) / 1000;
    }
});

Object.defineProperty(Configuration.prototype, "backSprite", {
    get() {
        return this._getLayerSprite(this.backLayer);
    }
});

Object.defineProperty(Configuration.prototype, "frontSprite", {
    get() {
        return this._getLayerSprite(this.frontLayer);
    }
});


Object.defineProperty(Configuration.prototype, "backLayer", {
    get() {
        return this.layers[0];
    }
});

Object.defineProperty(Configuration.prototype, "frontLayer", {
    get() {
        return this.layers[1];
    }
});

class EBBShader extends PIXI.Filter {
    constructor(configuration, layer, palette_sprite, options) {
        palette_sprite.renderable = false;

        super(undefined, ebbShader);

        this.uniforms.eTime = configuration.elapsed /  60;
        this.uniforms.eType = _.indexOf(["none", "horizontal", "horizontal_interlaced", "vertical"], layer.effect._type);
        this.uniforms.eAmplitude = layer.effect._amplitude;
        this.uniforms.eFrequency = layer.effect._frequency;
        this.uniforms.eSpeed = configuration.speed;
        this.uniforms.uPalette = palette_sprite._texture;
        this.uniforms.epOffset = 0;
        this.uniforms.epSize = 0;
        this.uniforms.epShiftOffset = 0;
        this.uniforms.eScaleFactor = options.scale_factor;

        this.autoFit = false;

        this.options = options;

        this.palette_sprite = palette_sprite;

        this.configuration = configuration;
        this.layer = layer;

        this._now = this.configuration.elapsed;
        this._timer = 0;
        this.epOffset = 0;
    }

    apply(filter_manager, input, output, clear) {
        this.uniforms.eTime = this.configuration.elapsed;
        this.uniforms.eType = _.indexOf(["none", "horizontal", "horizontal_interlaced", "vertical"], this.layer.effect._type);
        let sizeNormal = (this.uniforms.eType == 3 ? output.size.height : output.size.width);
        this.uniforms.eAmplitude = this.layer.effect._amplitude / (sizeNormal * 2);
        this.uniforms.eFrequency = this.layer.effect._frequency;
        this.uniforms.eSpeed = this.configuration.speed;
        this.uniforms.uPalette = this.palette_sprite._texture;
        this.uniforms.epOffset = this.epOffset;
        this.uniforms.epSize = this.palette_sprite.width;
        this.uniforms.epShiftOffset = this.layer.paletteShift.shift_offset;
        this.uniforms.eScaleFactor = this.options.scale_factor;

        // Time should only increase...
        this._timer += Math.max(0, this.configuration.elapsed - this._now) * 60;
        if(this.layer.paletteShift.speed > 0) {
            while(this._timer >= this.layer.paletteShift.speed) {
                this.epOffset = (this.epOffset + 1) % (this.palette_sprite.width - this.layer.paletteShift.shift_offset); // Don't count black
                this._timer -= this.layer.paletteShift.speed;
            }
        }
        this._now = this.configuration.elapsed;

        filter_manager.applyFilter(this, input, output, clear);
    }
}


export {
    LayerConfig, Configuration, EBBShader,
};