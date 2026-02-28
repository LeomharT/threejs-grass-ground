import * as EssentialsPlugin from '@tweakpane/plugin-essentials';
import {
  AxesHelper,
  BufferAttribute,
  Color,
  DoubleSide,
  FogExp2,
  InstancedBufferGeometry,
  InstancedMesh,
  MirroredRepeatWrapping,
  Object3D,
  PerspectiveCamera,
  Scene,
  ShaderChunk,
  ShaderMaterial,
  TextureLoader,
  Timer,
  Uniform,
  WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { Pane } from 'tweakpane';
import grassFragmentShader from './shader/grass/fragment.glsl?raw';
import grassVertexShader from './shader/grass/vertex.glsl?raw';
import simplex3DNoise from './shader/include/simplex3DNoise.glsl?raw';
import './style.css';

(ShaderChunk as any)['simplex3DNoise'] = simplex3DNoise;

function random(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

const el = document.querySelector('#root');

const size = {
  width: window.innerWidth,
  height: window.innerHeight,
  pixelRatio: Math.min(2, window.devicePixelRatio),
};

const background = new Color('#1e1e1e');

const fog = new FogExp2(background, 0.03);

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
scene.fog = fog;

const camera = new PerspectiveCamera(75, size.width / size.height, 0.1, 1000);
camera.position.set(0, 1, 5);
camera.lookAt(scene.position);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const clock = new Timer();

const noiseTexture = textureLoader.load('noiseTexture.png');
noiseTexture.wrapS = noiseTexture.wrapT = MirroredRepeatWrapping;

/**
 * World
 */

const positionArr = new Float32Array([
  0, 1, 0,
  //
  -1, 0, 0,
  //
  1, 0, 0,
]);
const positionAttr = new BufferAttribute(positionArr, 3);

const uvArr = new Float32Array([
  0.5,
  1.0, // v0
  0.0,
  0.0, // v1
  1.0,
  0.0, // v2
]);
const uvAttr = new BufferAttribute(uvArr, 2);

const grassGeometry = new InstancedBufferGeometry();
grassGeometry.setAttribute('position', positionAttr);
grassGeometry.setAttribute('uv', uvAttr);

const params = {
  count: 5000,
};

const uniforms = {
  uTime: new Uniform(0),
  uNoiseTexture: new Uniform(noiseTexture),
  uColor1: new Uniform(new Color('#62D96B')),
  uColor2: new Uniform(new Color('#29A634')),
};
const grassMaterial = new ShaderMaterial({
  vertexShader: grassVertexShader,
  fragmentShader: grassFragmentShader,
  uniforms,
  side: DoubleSide,
});
const grass = new InstancedMesh(grassGeometry, grassMaterial, params.count);
grass.scale.setScalar(0.15);

const obj = new Object3D();

function updateGrass() {
  for (let i = 0; i < params.count; i++) {
    obj.position.set(random(-25, 25), 0, random(-25, 25));
    obj.scale.y = random(1.0, 3.5);
    obj.updateMatrixWorld();
    grass.setMatrixAt(i, obj.matrix);
  }
  grass.instanceMatrix.needsUpdate = true;
}

updateGrass();

scene.add(grass);

/**
 * Helper
 */

const axesHelper = new AxesHelper();
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

pane.addBinding(params, 'count', {
  step: 1,
  min: 50,
  max: 500,
});
pane.addBinding(uniforms.uColor1, 'value', {
  color: { type: 'float' },
});
pane.addBinding(uniforms.uColor2, 'value', {
  color: { type: 'float' },
});

/**
 * Event
 */

function render() {
  fpsGraph.begin();

  // Time
  const delta = clock.getDelta();
  const elapsed = clock.getElapsed();

  uniforms.uTime.value += delta;

  // Update
  clock.update();
  controls.update();

  // Render
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
