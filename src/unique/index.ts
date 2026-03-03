import { Colors } from '@blueprintjs/colors';
import * as EssentialsPlugin from '@tweakpane/plugin-essentials';
import { createNoise2D } from 'simplex-noise';
import {
  AxesHelper,
  Color,
  DoubleSide,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  MirroredRepeatWrapping,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  ShaderChunk,
  ShaderMaterial,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
  Timer,
  Uniform,
  Vector3,
  Vector4,
  WebGLRenderer,
  WebGLRenderTarget,
} from 'three';
import { OrbitControls, Sky } from 'three/examples/jsm/Addons.js';
import { Pane } from 'tweakpane';
import grassFragmentShader from './shader/grass/fragmeng.glsl?raw';
import grassVertexShader from './shader/grass/vertex.glsl?raw';
import simplex2DNoise from './shader/include/simplex2DNoise.glsl?raw';
import simplex3DNoise from './shader/include/simplex3DNoise.glsl?raw';
import './style.css';

(ShaderChunk as any)['simplex3DNoise'] = simplex3DNoise;
(ShaderChunk as any)['simplex2DNoise'] = simplex2DNoise;

const el = document.querySelector('#root');

const size = {
  width: window.innerWidth,
  height: window.innerHeight,
  pixelRatio: Math.min(2, window.devicePixelRatio),
};

const noise2D = createNoise2D();

const background = new Color(Colors.LIGHT_GRAY3);

const textureLoader = new TextureLoader();
textureLoader.setPath('/src/assets/textures/');

const renderer = new WebGLRenderer({
  alpha: true,
  antialias: true,
});
renderer.setSize(size.width, size.height);
renderer.setPixelRatio(size.pixelRatio);
el?.append(renderer.domElement);

const scene = new Scene();
scene.background = background;

const camera = new PerspectiveCamera(75, size.width / size.height, 0.1, 1000);
camera.position.set(0, 4, 10);
camera.lookAt(scene.position);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const clock = new Timer();

const noiseTexture = textureLoader.load('noiseTexture.png');
noiseTexture.wrapS = noiseTexture.wrapT = MirroredRepeatWrapping;

const bladeAlphaTexture = textureLoader.load('blade_alpha.jpg');
const bladeDiffuseTexture = textureLoader.load('blade_diffuse.jpg');
bladeDiffuseTexture.anisotropy = 8;
bladeDiffuseTexture.colorSpace = SRGBColorSpace;

const pmrem = new PMREMGenerator(renderer);

let envMap: WebGLRenderTarget | undefined = undefined;

/**
 * World
 */

const groundGeometry = new PlaneGeometry(100, 100, 32, 32);
groundGeometry.rotateX(-Math.PI / 2);
const positionArr = groundGeometry.getAttribute('position').array;
for (let i = 0; i < positionArr.length; i += 3) {
  positionArr[i + 1] += getYPosition(positionArr[i + 0], positionArr[i + 2]);
}
groundGeometry.attributes.position.needsUpdate = true;
groundGeometry.computeVertexNormals();

const groundMaterial = new MeshStandardMaterial({
  color: '#000f00',
  wireframe: false,
});
const ground = new Mesh(groundGeometry, groundMaterial);
scene.add(ground);

const options = { bW: 0.12, bH: 1, joints: 5 };

const GRASS_BLADE_INSTANCE = 200000;

function getAttributeData(instance: number, width: number) {
  const offsets: number[] = [];
  const orientations: number[] = [];
  const stretches: number[] = [];
  const halfRootAngleSin: number[] = [];
  const halfRootAngleCos: number[] = [];

  let quaternion_0 = new Vector4();
  let quaternion_1 = new Vector4();

  //The min and max angle for the growth direction (in radians)
  const min = -0.25;
  const max = 0.25;

  for (let i = 0; i < instance; i++) {
    //Offset of the roots
    let offsetX = Math.random() * width - width / 2;
    let offsetZ = Math.random() * width - width / 2;

    const distance = offsetX * offsetX + offsetZ * offsetZ;

    // if (Math.pow(distance, 2.0) < 100.0) {
    //   offsetX += Math.random() * 10;
    //   offsetZ += Math.random() * 10;
    // }

    const offsetY = getYPosition(offsetX, offsetZ);
    offsets.push(offsetX, offsetY, offsetZ);

    //Define random growth directions
    //Rotate around Y
    let angle = Math.PI - Math.random() * (2 * Math.PI);
    halfRootAngleSin.push(Math.sin(0.5 * angle));
    halfRootAngleCos.push(Math.cos(0.5 * angle));

    let RotationAxis = new Vector3(0, 1, 0);
    let x = RotationAxis.x * Math.sin(angle / 2.0);
    let y = RotationAxis.y * Math.sin(angle / 2.0);
    let z = RotationAxis.z * Math.sin(angle / 2.0);
    let w = Math.cos(angle / 2.0);
    quaternion_0.set(x, y, z, w).normalize();

    //Rotate around X
    angle = Math.random() * (max - min) + min;
    RotationAxis = new Vector3(1, 0, 0);
    x = RotationAxis.x * Math.sin(angle / 2.0);
    y = RotationAxis.y * Math.sin(angle / 2.0);
    z = RotationAxis.z * Math.sin(angle / 2.0);
    w = Math.cos(angle / 2.0);
    quaternion_1.set(x, y, z, w).normalize();

    //Combine rotations to a single quaternion
    quaternion_0 = multiplyQuaternions(quaternion_0, quaternion_1);

    //Rotate around Z
    angle = Math.random() * (max - min) + min;
    RotationAxis = new Vector3(0, 0, 1);
    x = RotationAxis.x * Math.sin(angle / 2.0);
    y = RotationAxis.y * Math.sin(angle / 2.0);
    z = RotationAxis.z * Math.sin(angle / 2.0);
    w = Math.cos(angle / 2.0);
    quaternion_1.set(x, y, z, w).normalize();

    //Combine rotations to a single quaternion
    quaternion_0 = multiplyQuaternions(quaternion_0, quaternion_1);

    orientations.push(
      quaternion_0.x,
      quaternion_0.y,
      quaternion_0.z,
      quaternion_0.w,
    );

    // Define variety in height
    if (i < GRASS_BLADE_INSTANCE / 3) {
      stretches.push(Math.random() * 1.8);
    } else {
      stretches.push(Math.random());
    }
  }

  return {
    offsets,
    halfRootAngleCos,
    halfRootAngleSin,
    stretches,
    orientations,
  };
}

const uniforms = {
  uTime: new Uniform(0),
  uAlphaTexture: new Uniform(bladeAlphaTexture),
  uDiffuseTexture: new Uniform(bladeDiffuseTexture),
  uTipColor: new Uniform(new Color(0.0, 0.6, 0.0).convertSRGBToLinear()),
  uTipColor2: new Uniform(new Color(0.0, 0.2, 0.1).convertSRGBToLinear()),
  uBottomColor: new Uniform(new Color(0.0, 0.1, 0.0).convertSRGBToLinear()),
  uNoiseTexture: new Uniform(noiseTexture),
};

const { offsets, halfRootAngleCos, halfRootAngleSin, stretches, orientations } =
  getAttributeData(GRASS_BLADE_INSTANCE, 100);

const baseGeo = new PlaneGeometry(
  options.bW,
  options.bH,
  1,
  options.joints,
).translate(0, options.bH / 2, 0);

const grassGeometry = new InstancedBufferGeometry();
grassGeometry.index = baseGeo.index;
grassGeometry.instanceCount = GRASS_BLADE_INSTANCE;
grassGeometry.setAttribute('position', baseGeo.getAttribute('position'));
grassGeometry.setAttribute('uv', baseGeo.getAttribute('uv'));
grassGeometry.setAttribute(
  'aOffset',
  new InstancedBufferAttribute(new Float32Array(offsets), 3),
);
grassGeometry.setAttribute(
  'aHalfRootAngleCos',
  new InstancedBufferAttribute(new Float32Array(halfRootAngleCos), 1),
);
grassGeometry.setAttribute(
  'aHalfRootAngleSin',
  new InstancedBufferAttribute(new Float32Array(halfRootAngleSin), 1),
);
grassGeometry.setAttribute(
  'aOrientation',
  new InstancedBufferAttribute(new Float32Array(orientations), 4),
);
grassGeometry.setAttribute(
  'aStretches',
  new InstancedBufferAttribute(new Float32Array(stretches), 1),
);

const grassMaterial = new ShaderMaterial({
  vertexShader: grassVertexShader,
  fragmentShader: grassFragmentShader,
  uniforms,
  wireframe: false,
  side: DoubleSide,
});

const grass = new Mesh(grassGeometry, grassMaterial);
scene.add(grass);

const sphereGeometry = new SphereGeometry(4, 32, 32);
const sphereMaterial = new MeshStandardMaterial({
  metalness: 0.5,
  roughness: 0.74,
});
const sphere = new Mesh(sphereGeometry, sphereMaterial);

scene.add(sphere);

const sky = new Sky();
sky.scale.setScalar(10000);
const sun = new Vector3();
const effectController = {
  turbidity: 10,
  rayleigh: 3,
  mieCoefficient: 0.005,
  mieDirectionalG: 0.7,
  elevation: 2,
  azimuth: 180,
  exposure: renderer.toneMappingExposure,
  cloudCoverage: 0.4,
  cloudDensity: 0.4,
  cloudElevation: 0.5,
};
function guiChanged() {
  const uniforms = sky.material.uniforms;
  uniforms['turbidity'].value = effectController.turbidity;
  uniforms['rayleigh'].value = effectController.rayleigh;
  uniforms['mieCoefficient'].value = effectController.mieCoefficient;
  uniforms['mieDirectionalG'].value = effectController.mieDirectionalG;
  uniforms['cloudCoverage'].value = effectController.cloudCoverage;
  uniforms['cloudDensity'].value = effectController.cloudDensity;
  uniforms['cloudElevation'].value = effectController.cloudElevation;

  const phi = MathUtils.degToRad(90 - effectController.elevation);
  const theta = MathUtils.degToRad(effectController.azimuth);

  sun.setFromSphericalCoords(1, phi, theta);

  uniforms['sunPosition'].value.copy(sun);

  renderer.toneMappingExposure = effectController.exposure;
}
guiChanged();
scene.add(sky);

/**
 * Helper
 */

const axesHelper = new AxesHelper(20);
scene.add(axesHelper);

/**
 * Pane
 */

const pane = new Pane({ title: 'Debug' });
pane.element.parentElement!.style.width = '380px';
pane.registerPlugin(EssentialsPlugin);

const fpsGraph: any = pane.addBlade({
  view: 'fpsgraph',
  label: undefined,
  rows: 4,
});

const f_grass = pane.addFolder({ title: '🌱 Grass Blead' });

f_grass.addBinding(uniforms.uTipColor, 'value', {
  label: 'uTipColor',
  color: { type: 'float' },
});
f_grass.addBinding(uniforms.uBottomColor, 'value', {
  label: 'uBottomColor',
  color: { type: 'float' },
});
/**
 * Event
 */

function getYPosition(x: number, z: number) {
  let y = 2 * noise2D(x / 50, z / 50);
  y += 4 * noise2D(x / 100, z / 100);
  y += 0.2 * noise2D(x / 10, z / 10);
  return y;
}

function multiplyQuaternions(q1: Vector4, q2: Vector4) {
  const x = q1.x * q2.w + q1.y * q2.z - q1.z * q2.y + q1.w * q2.x;
  const y = -q1.x * q2.z + q1.y * q2.w + q1.z * q2.x + q1.w * q2.y;
  const z = q1.x * q2.y - q1.y * q2.x + q1.z * q2.w + q1.w * q2.z;
  const w = -q1.x * q2.x - q1.y * q2.y - q1.z * q2.z + q1.w * q2.w;
  return new Vector4(x, y, z, w);
}

function renderEnvScene() {
  if (envMap) envMap.dispose();
  envMap = pmrem.fromScene(scene, 0.0, 0.01, 100, {});

  sphereMaterial.envMap = envMap.texture;
}

function render() {
  fpsGraph.begin();

  // Time
  const delta = clock.getDelta();
  const elapsed = clock.getElapsed();

  uniforms.uTime.value += delta * 0.5;

  // Update
  clock.update();
  controls.update();

  // Render
  renderEnvScene();
  renderer.render(scene, camera);
  // Animation
  requestAnimationFrame(render);

  fpsGraph.end();
}
render();

function resize() {
  size.width = window.innerWidth;
  size.height = window.innerHeight;

  renderer.setSize(size.width, size.height);

  camera.aspect = size.width / size.height;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
