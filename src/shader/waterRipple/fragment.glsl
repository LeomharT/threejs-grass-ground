#define RADIUS 5.5

varying vec2 vUv;

uniform sampler2D uNoiseTexture;
uniform sampler2D uNoiseTexture2;


uniform float uTime;
uniform float uNoiseUvScale;
uniform float uNoiseUvFrequency;
uniform vec2 uNoiseUvPosition;

void main(){
    vec3 color = vec3(0.0);

    vec2 uv = vUv;
    uv += uNoiseUvPosition;
    uv *= uNoiseUvScale;
       
    vec4 noiseColor = texture2D(uNoiseTexture, uv);
    vec4 noiseColor2 = texture2D(uNoiseTexture2, uv * uNoiseUvFrequency);
    
    if(noiseColor.r < 0.5) discard;
    if(uv.x < 0.01 || uv.x > 0.61) discard;
    if(uv.y < 0.01 || uv.y > 0.61) discard;

    float distanceToEdge = pow(noiseColor.r, 2.0);
    distanceToEdge = smoothstep(0.1, 0.5, distanceToEdge);

    vec3 baseRipple = vec3(noiseColor.r);
    baseRipple *= 35.0;
    baseRipple += uTime * 0.5;

    vec3 edgeColor = fract(baseRipple);
    edgeColor = smoothstep(0.5 - distanceToEdge, 1.0, edgeColor);

    float rippleIndex = floor(baseRipple.r);
    
    vec4 noiseRipple = texture2D(
        uNoiseTexture2,
        uv + rippleIndex / 0.345 * uNoiseUvFrequency
    );

    color = edgeColor - noiseColor2.r;

    color = vec3(rippleIndex * 0.01);

    // if(color.r <= 0.45) discard;
    // if(distanceToEdge > 0.65) discard;

    // color += 0.5;
  
    gl_FragColor = vec4(color, 1.0);
}