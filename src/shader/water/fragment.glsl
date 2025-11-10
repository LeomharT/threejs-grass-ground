#define RADIUS 5.5

varying vec3 vPosition;
varying vec2 vUv;

uniform float uNoiseEdge;

uniform sampler2D uNoiseTexture;

void main(){
    vec3 color = vec3(0.0);

    vec2 uv = vUv;
 
    vec4 noiseColor = texture2D(uNoiseTexture, uv);
    
    // if(noiseColor.r <  0.5) discard;
    color = noiseColor.rgb;

    gl_FragColor = vec4(color, 1.0);
}