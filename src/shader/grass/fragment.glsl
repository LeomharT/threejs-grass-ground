#define RADIUS 5.5

varying vec2 vUv;
varying vec3 vPosition;

uniform vec3 uRootColor;
uniform vec3 uGrassColor;
uniform vec3 uGrassColor2;

uniform float uNoiseEdge;

uniform sampler2D uNoiseTexture;


void main(){
    vec2 uv       = vUv;
    vec3 color    = vec3(0.0);
    
    vec2 groundUv = vec2(vPosition.xz / (RADIUS * 2.0)) + 0.5;
    groundUv *= 0.625;

    vec4 noiseColor = texture2D(uNoiseTexture, groundUv);
    vec3 grassColor = uGrassColor;

    if(noiseColor.r > uNoiseEdge) {
        grassColor = uGrassColor2;
    }

    if(noiseColor.r > 0.5) {
        discard;
    }
    
    color = mix(
        uRootColor,
        grassColor,
        uv.y
    );

    gl_FragColor = vec4(color , 1.0);

    #include <colorspace_fragment>
    #include <tonemapping_fragment>
}