#define PI 3.1415926

precision lowp float;

varying vec2 vUv;
varying vec3 vPosition;

uniform float uTime;
uniform sampler2D uNoiseTexture;

vec2 rotate2D(vec2 v, float angle) {
    mat2 m = mat2(
        cos(angle), -sin(angle),
        sin(angle), cos(angle)
    );
    return v * m;
}

// return value [-1.0, 1.0] so scale the grass!!!
vec2 getWind(sampler2D noiseTexture, vec3 worldPosition) {
    float time = uTime;

    vec2 direction = vec2(
        -1.0,
        1.0
    );
    direction = normalize(direction);

    vec2  noiseUv1 = worldPosition.xz * 0.06 + direction * time * 0.18;
    float noise1   = texture2D(noiseTexture, noiseUv1).r - 0.5;

    vec2  noiseUv2 = worldPosition.xz * 0.043 + direction * time * 0.03;
    float noise2   = texture2D(noiseTexture, noiseUv2).r;

    float intensity = noise1 * noise2;

    return direction * intensity;
}
 

void main(){
    #include <begin_vertex>

    //
    vec4 instancePosition = modelMatrix * instanceMatrix * vec4(vec3(0.0), 1.0);
    vec3 viewDirection    = normalize(cameraPosition - instancePosition.xyz);

    float angle  = atan(viewDirection.z, viewDirection.x);
          angle -= PI / 2.0;

    vec2 rotateXZ       = rotate2D(transformed.xz, angle);
         transformed.xz = rotateXZ;

    vec2 wind = getWind(uNoiseTexture, instancePosition.xyz);

    #include <project_vertex>

    gl_Position.x = gl_Position.x + wind.x * uv.y;

    // Varying
    vUv       = uv;
    vPosition = instancePosition.xyz;
}