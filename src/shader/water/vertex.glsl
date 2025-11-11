varying vec2 vUv;

uniform sampler2D uNoiseTexture;

uniform float uNoiseUvScale;
uniform vec2 uNoiseUvPosition;

void main() {
    vec4 modelPosition      = modelMatrix * vec4(position, 1.0);
    vec4 viewPosition       = viewMatrix * modelPosition;
    vec4 projectionPosition = projectionMatrix * viewPosition;

    gl_Position = projectionPosition;
    
    vec2 terrainUv  = uv;
         terrainUv += uNoiseUvPosition;
         terrainUv *= uNoiseUvScale;

    vec4  noiseData       = texture2D(uNoiseTexture, terrainUv);

    float distanceToShore = noiseData.r;
    distanceToShore = pow(distanceToShore, 2.0);
    distanceToShore = smoothstep(0.2, 0.9, distanceToShore);
 
    gl_Position.y -= distanceToShore;

    // Varying
    vUv = uv;
}