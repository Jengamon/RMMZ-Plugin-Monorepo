import ebbShader from "./ebb_shader.frag.glsl";
import * as _ from "lodash";
import * as PIXI from "pixi.js";

const ImageModes = {
    Tiled: "tiled",
    Stretched: "stretched",
} as const;
type ImageMode = typeof ImageModes[keyof typeof ImageModes];

const EffectTypes = {
    None: "none",
    Horizontal: "horizontal",
    HorizontalInterlaced: "horizontal_interlaced",
    Vertical: "vertical"
} as const;
type EffectType = typeof EffectTypes[keyof typeof EffectTypes];

interface EffectConfiguration {
    type: EffectType,
    amplitude: number,
    frequency: number
    //palette_shift: number,
    //scroll: [number, number] // x, y
}

export class Configuration {
    _effectConf: EffectConfiguration;

    constructor(effectConf: EffectConfiguration) {
        this._effectConf = effectConf;
    }

    attachToSprite(sprite: PIXI.Sprite) {
        sprite.filters = [new EBBFilter(this)];
    }
}

// console.log(ebbShader);
export class EBBFilter extends PIXI.Filter {
    _uniforms: {
        eTime: number,
        eType: number
        eAmplitude: number,
        eFrequency: number,
        eSpeed: number,
        uPalette: PIXI.Texture,
        epOffset: number,
        epShiftOffset: number,
        eScaleFactor: number,
    };

    configuration: Configuration;

    tickTime: number;

    constructor(conf: Configuration) {
        const uniforms = {
            eTime: 0,
            eType: 0,
            eAmplitude: 0,
            eFrequency: 0,
            eSpeed: 0,
            uPalette: PIXI.Texture.EMPTY,
            epOffset: 0,
            epShiftOffset: 0,
            eScaleFactor: 1,
        };

        super(undefined, ebbShader, uniforms);

        this.configuration = conf;
        this.tickTime = 0;

        const ticker = PIXI.Ticker.shared;

        ticker.add(time => {
            this.tickTime += ticker.deltaMS;
        })

        this._uniforms = uniforms;
    }

    override apply(filterManager: PIXI.FilterSystem, input: PIXI.RenderTexture, output: PIXI.RenderTexture, clearMode: PIXI.CLEAR_MODES, currentState: any) {
        this.updateUniorms(output);

        super.apply(filterManager, input, output, clearMode, currentState);
    }

    private updateUniorms(output: PIXI.RenderTexture) {
        this._uniforms.eTime = this.tickTime / 1000;
        this._uniforms.eType = _.indexOf(["none", "horizontal", "horizontal_interlaced", "vertical"], this.configuration._effectConf.type);
        /*
        let sizeNormal = (this.uniforms.eType == 3 ? output.size.height : output.size.width);
        this.uniforms.eAmplitude = this.layer.effect._amplitude / (sizeNormal * 2);
        this.uniforms.eFrequency = this.layer.effect._frequency;
        this._uniforms.eSpeed = this.configuration.speed;
        this._uniforms.uPalette = this.palette_sprite._texture;
        this._uniforms.epOffset = this.epOffset;
        this._uniforms.epSize = this.palette_sprite.width;
        this._uniforms.epShiftOffset = this.layer.paletteShift.shift_offset;
        this._uniforms.eScaleFactor = this.options.scale_factor;
        */
        const sizeNormal = (this._uniforms.eType == 3 ? output.frame.height : output.frame.width);
        this._uniforms.eAmplitude = this.configuration._effectConf.amplitude / (sizeNormal * 2);
        this._uniforms.eFrequency = this.configuration._effectConf.frequency;
        // this._uniforms.eSpeed = this.effect_configuration.speed;
        //this._uniforms.uPalette = this.palette_sprite._texture;
        // this._uniforms.epOffset = this.epOffset;
        // this._uniforms.epSize = this.palette_sprite.width;
        // this._uniforms.epShiftOffset = this.layer.paletteShift.shift_offset;
        // this._uniforms.eScaleFactor = this.options.scale_factor;
    }
}