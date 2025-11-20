import * as EssentialsPlugin from '@tweakpane/plugin-essentials';
import {
  ACESFilmicToneMapping,
  BufferAttribute,
  BufferGeometry,
  Clock,
  Color,
  DoubleSide,
  EquirectangularReflectionMapping,
  InstancedMesh,
  MathUtils,
  Mesh,
  MirroredRepeatWrapping,
  Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  TextureLoader,
  Uniform,
  Vector2,
  WebGLRenderer,
} from 'three';
import {
  HDRLoader,
  OrbitControls,
  TrackballControls,
} from 'three/examples/jsm/Addons.js';
import { Pane } from 'tweakpane';
import './index.css';
import grassFragmentShader from './shader/grass/fragment.glsl?raw';
import grassVertexShader from './shader/grass/vertex.glsl?raw';
import waterFragmentShader from './shader/water/fragment.glsl?raw';
import waterVertexShader from './shader/water/vertex.glsl?raw';
import waterRippleFragmentShader from './shader/waterRipple/fragment.glsl?raw';
import waterRippleVertexShader from './shader/waterRipple/vertex.glsl?raw';
const el = document.querySelector('#root') as HTMLDivElement;
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
  pixelRatio: Math.min(2, window.devicePixelRatio),
};

/**
 * Loader
 */

const rgbeLoader = new HDRLoader();
const textureLoader = new TextureLoader();

/**
 * Texture
 */

rgbeLoader.load('/river_alcove_2k.hdr', (data) => {
  data.mapping = EquirectangularReflectionMapping;

  scene.background = data;
  scene.backgroundBlurriness = 1.0;
});

const noiseTexture = textureLoader.load('/noiseTexture.png');
noiseTexture.wrapT = noiseTexture.wrapS = MirroredRepeatWrapping;

const noiseTexture2 = textureLoader.load('/noiseTexture_2.png');
noiseTexture2.wrapT = noiseTexture.wrapS = MirroredRepeatWrapping;

/**
 * Basic
 */
const renderer = new WebGLRenderer({
  antialias: true,
  alpha: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(sizes.pixelRatio);
renderer.toneMapping = ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
el.append(renderer.domElement);

const scene = new Scene();

const camera = new PerspectiveCamera(50, sizes.width / sizes.height, 0.1, 1000);
camera.position.set(3, 3, 3);
camera.lookAt(scene.position);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.enableZoom = false;
controls.enableRotate = true;

const controls2 = new TrackballControls(camera, renderer.domElement);
controls2.noPan = true;
controls2.noRotate = true;
controls2.noZoom = false;

const clock = new Clock();

/**
 * World
 */
const params = {
  count: 8500,
  radius: 5.5,
};

const uniforms = {
  // Common
  uTime: new Uniform(0.0),
  uNoiseTexture: new Uniform(noiseTexture),
  uNoiseTexture2: new Uniform(noiseTexture2),
  // Grass
  uRootColor: new Uniform(new Color('#135200')),
  uGrassColor: new Uniform(new Color('#95de64')),
  uGrassColor2: new Uniform(new Color('#52c41a')),
  uNoiseEdge: new Uniform(0.475),
  // Water
  uNoiseUvScale: new Uniform(1.0),
  uNoiseUvPosition: new Uniform(new Vector2(-0.19, -0.19)),
  uNoiseUvFrequency: new Uniform(6.52),
  uShoreAlpha: new Uniform(0.55),
  uWaterDepthColor: new Uniform(new Color('#3e6871')),
  uWaterShoreColor: new Uniform(new Color(0.47, 0.88, 0.49)),
};

const grassGeometry = new BufferGeometry();
const positionArr = new Float32Array([
  -0.5, 0.0, 0.0, 0.0, 1.0, 0.0, 0.5, 0.0, 0.0,
]);

const uvArr = new Float32Array([
  //
  0.0, 0.0,
  //
  0.5, 1.0,
  //
  1.0, 0.0,
]);
const attrUv = new BufferAttribute(uvArr, 2);

const attrPosition = new BufferAttribute(positionArr, 3);
grassGeometry.setAttribute('position', attrPosition);
grassGeometry.setAttribute('uv', attrUv);

const grassMaterial = new ShaderMaterial({
  vertexShader: grassVertexShader,
  fragmentShader: grassFragmentShader,
  uniforms,
  side: DoubleSide,
});

const grass = new InstancedMesh(grassGeometry, grassMaterial, params.count);
grass.scale.setScalar(0.3);

const object3D = new Object3D();

for (let i = 0; i < params.count; i++) {
  object3D.position.set(
    MathUtils.randFloat(-params.radius, params.radius),
    0,
    MathUtils.randFloat(-params.radius, params.radius)
  );
  object3D.scale.set(1, MathUtils.randFloat(0.3, 0.6), 1);

  object3D.updateMatrix();

  grass.setMatrixAt(i, object3D.matrix);
}

scene.add(grass);

const waterGeometry = new PlaneGeometry(params.radius, params.radius, 512, 512);

const waterMaterial = new ShaderMaterial({
  vertexShader: waterVertexShader,
  fragmentShader: waterFragmentShader,
  uniforms,
  side: DoubleSide,
});

const water = new Mesh(waterGeometry, waterMaterial);
water.rotation.x = Math.PI / 2;
scene.add(water);

const waterRippleMaterial = new ShaderMaterial({
  vertexShader: waterRippleVertexShader,
  fragmentShader: waterRippleFragmentShader,
  uniforms,
  side: DoubleSide,
});

const waterRipple = new Mesh(waterGeometry, waterRippleMaterial);
waterRipple.rotation.x = Math.PI / 2;
scene.add(waterRipple);

/**
 * Pane
 */

const pane = new Pane({ title: 'Debug Params' });
pane.element.parentElement!.style.width = '380px';
pane.registerPlugin(EssentialsPlugin);

const fpsGraph: any = pane.addBlade({
  view: 'fpsgraph',
  label: undefined,
  rows: 4,
});

const grassPane = pane.addFolder({ title: '🌿Grass' });
grassPane.addBinding(uniforms.uNoiseEdge, 'value', {
  label: 'Noise Edge',
  min: 0.1,
  max: 1.0,
  step: 0.001,
});
grassPane.addBinding(uniforms.uGrassColor, 'value', {
  label: 'Grass Color 1',
  color: {
    type: 'float',
  },
});
grassPane.addBinding(uniforms.uGrassColor2, 'value', {
  label: 'Grass Color 2',
  color: {
    type: 'float',
  },
});

const waterPane = pane.addFolder({ title: '🌊Water' });
waterPane.addBinding(uniforms.uNoiseUvScale, 'value', {
  label: 'Noise Scale',
  min: 0.1,
  max: 1.0,
  step: 0.001,
});
waterPane.addBinding(uniforms.uNoiseUvFrequency, 'value', {
  label: 'Noise Frequency',
  min: 0.0,
  max: 10.0,
  step: 0.001,
});
waterPane.addBinding(uniforms.uShoreAlpha, 'value', {
  label: 'Shore Alpha',
  min: 0.0,
  max: 1.0,
  step: 0.001,
});
waterPane.addBinding(uniforms.uNoiseUvPosition, 'value', {
  label: 'Noise Position',
  x: { step: 0.01, min: -1, max: 1 },
  y: { step: 0.01, min: -1, max: 1 },
});
waterPane.addBinding(uniforms.uWaterShoreColor, 'value', {
  label: 'Water Shore Color',
  color: {
    type: 'float',
  },
});

/**
 * Events
 */

function render() {
  // Time
  fpsGraph.begin();
  const delta = clock.getDelta();
  const elapsed = clock.getElapsedTime();

  // Render
  renderer.render(scene, camera);

  // Update
  controls.update(delta);
  controls2.update();
  uniforms.uTime.value = elapsed;

  // Animation
  fpsGraph.end();
  requestAnimationFrame(render);
}
render();

function resize() {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  renderer.setSize(sizes.width, sizes.height);

  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
