varying vec2 vUv;

uniform sampler2D uNoiseTexture;

uniform float uNoiseUvScale;
uniform vec2 uNoiseUvPosition;

uniform vec3 uWaterDepthColor;
uniform vec3 uWaterShoreColor;


void main(){
    vec3 color = vec3(0.0);

    vec2 uv    = vUv;
    uv += uNoiseUvPosition;
    uv *= uNoiseUvScale;

    if(uv.x < 0.01 || uv.x > 0.61) discard;
    if(uv.y < 0.01 || uv.y > 0.61) discard;

    vec4  noiseColor      = texture2D(uNoiseTexture, uv);
    float distanceToShore = noiseColor.b;


    color = vec3(distanceToShore);


    gl_FragColor = vec4(color, 1.0);
}