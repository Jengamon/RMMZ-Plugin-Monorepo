#define PI 3.1415926538
#define C1 (1.0 / 512.0)
#define C2 (2.0 * PI) //(8.0 * PI / (1024.0 * 256.0))
#define C3 (PI / 60.0)

varying vec2 vPosition;
varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform sampler2D uPalette;
uniform float eAmplitude;
uniform float eFrequency;
uniform float eSpeed;
uniform float eTime;
uniform float eType;
uniform vec4 filterArea;
uniform float epOffset;
uniform float epSize;
uniform float epShiftOffset;
uniform float eScaleFactor;

float wrap(float v, float upper, float lower) {
    if(v > upper) {
        return lower + abs(v - upper);
    }

    if(v < lower) {
        return upper - abs(v - lower);
    }

    return v;
}

float gamma_correct(float u) {
    if(u <= 0.0031308)
        return 12.92 * u;
    return 1.055 * pow(u, (1.0 / 2.4)) - 0.055;
}

float offset(float y) {
    float amp = (eAmplitude);
    float freq = C2 * (eFrequency);
    float spd = C3 * eSpeed * eTime;
    return amp * sin(freq * y + spd);
}

vec4 map_color(float inp, float alpha) {
    vec4 mapped_color = vec4(epOffset);
    if(inp < (1.0 / epSize)) {
        mapped_color = vec4(0.0, 0.0, 0.0, 0.0);
    } else if (inp < (epShiftOffset / epSize)) {
        float mapped = fract(inp);
        mapped_color = texture2D(uPalette, vec2(mapped, 0.5));
        mapped_color.a = alpha;
    } else {
        float unmapped = inp + epOffset / epSize;
        float mapped = (unmapped > 1.0 ? unmapped - ((epSize - epShiftOffset) / epSize) : unmapped);
        mapped_color = texture2D(uPalette, vec2(mapped, 0.5));
        //mapped_color.rgb /= mapped_color.a;
        mapped_color.a = alpha;
    }
    return mapped_color;
}

void main(void)
{
    // We divide filterArea by 3 because we actually render a texture 3 times the size of the screen...
    float modGFrag = floor(gl_FragCoord.y / eScaleFactor);
    vec2 texCoord = vec2(vTextureCoord.x, vTextureCoord.y);//modGFrag / filterArea.y);
    vec2 _offset = vec2(0, 0);
    if(eType == 1.0) {
        _offset.x -= offset(vTextureCoord.y);
    } else if(eType == 2.0) {
        _offset.x += (mod(modGFrag, 2.0) == 0.0 ? offset(vTextureCoord.y) : -offset(vTextureCoord.y));
    } else if(eType == 3.0) {
        _offset.y += offset(vTextureCoord.y);
    }
   
    vec2 coord = vTextureCoord + _offset;
    vec4 plColor = texture2D(uSampler, coord);
    float avg = dot(plColor.rgb, vec3(1.0, 1.0, 1.0)) / 3.0;
    vec4 texColor = map_color(avg, 0.5);//plColor.a);
    gl_FragColor = texColor;
}