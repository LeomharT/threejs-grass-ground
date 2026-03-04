varying vec2 vUv;
varying vec3 vPosition;
varying float vH;
varying vec2 vGridUv;

uniform sampler2D uAlphaTexture;
uniform sampler2D uDiffuseTexture;
uniform sampler2D uNoiseTexture;
uniform vec3 uTipColor;
uniform vec3 uTipColor2;
uniform vec3 uBottomColor;

void main() {
  vec3 color = vec3(0.0);
  vec2 uv = vUv;
  vec2 gridUv = vGridUv;
  gridUv *= 0.35;

  if (length(vPosition.xz) < 4.0) discard;

  float alpha = texture2D(uAlphaTexture, uv).r;
  if (alpha <= 0.5) discard;

  vec4 noiseColor = texture2D(uNoiseTexture, gridUv);
  vec3 tipColor = mix(uTipColor, uTipColor2, step(0.5, noiseColor.r));

  vec4 diffuseColor = texture2D(uDiffuseTexture, uv);
  color = diffuseColor.rgb;
  color = mix(tipColor, color, vH);
  color = mix(uBottomColor, color, vH);

  float tipMix = smoothstep(0.8, 1.2, uv.y);

  color = mix(color, vec3(1.0), tipMix);

  gl_FragColor = vec4(color, 1.0);

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
