#define RADIUS 5.5

varying vec2 vUv;

uniform float uNoiseUvScale;
uniform vec2 uNoiseUvPosition;

uniform sampler2D uNoiseTexture;

void main(){
    vec3 color = vec3(0.0);

    vec2 uv = vUv;
    uv += uNoiseUvPosition;
    uv *= uNoiseUvScale;
       
    vec4 noiseColor = texture2D(uNoiseTexture, uv);
    
    if(noiseColor.r < 0.5) discard;
    if(uv.x < 0.01 || uv.x > 0.61) discard;
    if(uv.y < 0.01 || uv.y > 0.61) discard;

    vec3 edgeColor = 1.0 - vec3(noiseColor.r);
    edgeColor *= 50.0;
    edgeColor = fract(edgeColor);

    color = edgeColor;

    gl_FragColor = vec4(color, 1.0);
}