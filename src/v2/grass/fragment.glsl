precision lowp float;

varying vec2 vUv;
varying vec3 vPosition;

uniform float uTime;
uniform sampler2D uNoiseTexture;
uniform vec3 uColor1;
uniform vec3 uColor2;

vec2 rotateUv(vec2 uv, float angle) {
    mat2 m = mat2(
        cos(angle), -sin(angle),
        sin(angle), cos(angle)
    );
    return m * uv;
}

void main(){
    vec3 color  = vec3(0.0);
    vec2 uv     = vUv;
    vec2 center = vec2(0.5);

    uv -= center;
    // uv  = rotateUv(uv, uTime);
    uv += center;

    vec2 coord    = vec2(vPosition.x, vPosition.z);
         coord    = smoothstep(-15.0 / 4.0, 15.0 / 4.0, coord);
         coord.y  = 1.0 - coord.y;
        //  coord.x += uTime * 0.1;
         coord   *= 0.5;
  
    vec4 noiseColor = texture2D(uNoiseTexture, coord);
    
    float gradient = step(0.5, noiseColor.r);
    
    color = mix(
        uColor2 * uv.y,
        uColor1 * uv.y,
        gradient
    );

    // if(bool(gradient)) discard;
 
    gl_FragColor = vec4(color, 1.0);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}