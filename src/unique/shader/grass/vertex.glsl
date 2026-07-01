#define PI 3.141592627

attribute vec3 aOffset;
attribute vec4 aOrientation;
attribute float aHalfRootAngleCos;
attribute float aHalfRootAngleSin;
attribute float aStretches;

varying vec2 vUv;
varying vec3 vPosition;
varying float vH;
varying vec2 vGridUv;

uniform float uTime;

#include <simplex2DNoise>

//https://www.geeks3d.com/20141201/how-to-rotate-a-vertex-by-a-quaternion-in-glsl/
vec3 rotateVectorByQuaternion(vec3 v, vec4 q) {
  return 2.0 * cross(q.xyz, v * q.w + cross(q.xyz, v)) + v;
}

//https://en.wikipedia.org/wiki/Slerp
vec4 slerp(vec4 v0, vec4 v1, float t) {
  // Only unit quaternions are valid rotations.
  // Normalize to avoid undefined behavior.
  normalize(v0);
  normalize(v1);

  // Compute the cosine of the angle between the two vectors.
  float dot_ = dot(v0, v1);

  // If the dot product is negative, slerp won't take
  // the shorter path. Note that v1 and -v1 are equivalent when
  // the negation is applied to all four components. Fix by
  // reversing one quaternion.
  if (dot_ < 0.0) {
    v1 = -v1;
    dot_ = -dot_;
  }

  const float DOT_THRESHOLD = 0.9995;
  if (dot_ > DOT_THRESHOLD) {
    // If the inputs are too close for comfort, linearly interpolate
    // and normalize the result.
    vec4 result = t * (v1 - v0) + v0;
    normalize(result);
    return result;
  }

  // Since dot is in range [0, DOT_THRESHOLD], acos is safe
  float theta_0 = acos(dot_); // theta_0 = angle between input vectors
  float theta = theta_0 * t; // theta = angle between v0 and result
  float sin_theta = sin(theta); // compute this value only once
  float sin_theta_0 = sin(theta_0); // compute this value only once
  float s0 = cos(theta) - dot_ * sin_theta / sin_theta_0; // == sin(theta_0 - theta) / sin(theta_0)
  float s1 = sin_theta / sin_theta_0;
  return s0 * v0 + s1 * v1;
}

vec2 rotate2D(vec2 v, float angle) {
  mat2 m = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
  return v * m;
}

void main() {
  vec3 transformed = vec3(position);
  vec3 viewDirection = normalize(cameraPosition - (transformed + aOffset));

  //Get wind data from simplex noise
  float noise =
    1.0 - snoise(vec2(uTime - aOffset.x / 50.0, uTime - aOffset.z / 50.0));

  // Billboarding
  float angle = atan(viewDirection.z, viewDirection.x);
  //   transformed.xz = rotate2D(transformed.xz, angle - PI / 2.0);

  float h = position.y / 1.0;
  vec4 direction = vec4(0.0, aHalfRootAngleSin, 0.0, aHalfRootAngleCos);
  direction = slerp(direction, aOrientation, h);

  transformed.y += transformed.y * aStretches;
  transformed = rotateVectorByQuaternion(transformed, direction);

  float halfAngle = noise * 0.15;
  transformed = rotateVectorByQuaternion(
    transformed,
    normalize(vec4(sin(halfAngle), 0.0, -sin(halfAngle), cos(halfAngle)))
  );

  vec4 modelPosition = modelMatrix * vec4(transformed + aOffset, 1.0);
  vec4 viewPosition = viewMatrix * modelPosition;
  vec4 projectionPosition = projectionMatrix * viewPosition;

  gl_Position = projectionPosition;

  vH = h;
  vUv = uv;
  vPosition = vec3(position) + aOffset;

  vGridUv = vPosition.xz / 50.0;
  vGridUv.x = (vGridUv.x + 1.0) / 2.0;
  vGridUv.y = 1.0 - (vGridUv.y + 1.0) / 2.0;
}
