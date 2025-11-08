import * as EssentialsPlugin from '@tweakpane/plugin-essentials';
import {
  ACESFilmicToneMapping,
  BufferAttribute,
  BufferGeometry,
  Clock,
  DoubleSide,
  EquirectangularReflectionMapping,
  InstancedMesh,
  MathUtils,
  Object3D,
  PerspectiveCamera,
  Scene,
  ShaderMaterial,
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

/**
 * Texture
 */

rgbeLoader.load('/river_alcove_2k.hdr', (data) => {
  data.mapping = EquirectangularReflectionMapping;

  scene.background = data;
  scene.backgroundBlurriness = 1.0;
});

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
camera.position.set(7, 7, 7);
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
  count: 1000,
  radius: 5.5,
};
const uniforms = {};

const grassGeometry = new BufferGeometry();
const positionArr = new Float32Array([
  -0.5, 0.0, 0.0, 0.0, 1.0, 0.0, 0.5, 0.0, 0.0,
]);

const attrPosition = new BufferAttribute(positionArr, 3);
grassGeometry.setAttribute('position', attrPosition);

const grassMaterial = new ShaderMaterial({
  vertexShader: grassVertexShader,
  fragmentShader: grassFragmentShader,
  uniforms,
  side: DoubleSide,
});

const grass = new InstancedMesh(grassGeometry, grassMaterial, params.count);
const object3D = new Object3D();

for (let i = 0; i < params.count; i++) {
  object3D.position.set(
    MathUtils.randFloat(-params.radius, params.radius),
    0,
    MathUtils.randFloat(-params.radius, params.radius)
  );
  object3D.scale.set(1, MathUtils.randFloat(0.6, 1), 1);
  object3D.lookAt(scene.position);

  object3D.updateMatrix();

  grass.setMatrixAt(i, object3D.matrix);
}

scene.add(grass);

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

/**
 * Events
 */

function render() {
  // Time
  fpsGraph.begin();
  const delta = clock.getDelta();

  // Render
  renderer.render(scene, camera);

  // Update
  controls.update(delta);
  controls2.update();

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
