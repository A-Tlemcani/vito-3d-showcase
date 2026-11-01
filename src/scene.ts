import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { createStage, pointerTracker } from './lib/stage';

/**
 * Cinematic table scene: CC0 Poly Haven models (compressed to meshopt + WebP),
 * lit by a real HDRI capture, with a scroll-driven camera path.
 * `progress` (0..1) is driven by the page's scroll story.
 */
export interface SceneApi { setProgress(p: number): void }

const MODELS = ['round_wooden_table_01', 'wooden_cutting_board', 'lemon', 'wine_bottles_01', 'brass_goblets', 'jug_01', 'vintage_oil_lamp', 'wooden_bowl_01', 'food_pomegranate_01', 'potted_plant_02'] as const;
type ModelId = (typeof MODELS)[number];

/** Wine-glass profile in metres (≈21 cm tall), revolved with LatheGeometry. */
const glassProfile: Array<[number, number]> = [
  [0, 0], [0.036, 0], [0.037, 0.002], [0.006, 0.005], [0.0035, 0.01], [0.003, 0.085], [0.005, 0.092], [0.024, 0.104],
  [0.04, 0.125], [0.045, 0.152], [0.043, 0.18], [0.036, 0.208], [0.035, 0.21],
];

export function initScene(canvas: HTMLCanvasElement, onProgress: (loaded: number) => void, onReady: () => void): SceneApi | null {
  const stage = createStage(canvas, { fov: 32, alpha: false });
  if (!stage) return null;
  const { scene, camera, renderer, reducedMotion } = stage;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMappingExposure = 0.95;
  // Dark trattoria room: warm floor fading into fog, so the table sits in a pool of light.
  const room = new THREE.Color('#130c08');
  scene.background = room;
  scene.fog = new THREE.Fog(room, 2.6, 7);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(8, 64), new THREE.MeshStandardMaterial({ color: '#2a1a11', roughness: 0.85 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const manager = new THREE.LoadingManager();
  manager.onProgress = (_url, loaded, total) => onProgress(loaded / total);

  // --- Image-based lighting from a real café capture; blurred as a soft backdrop.
  new HDRLoader(manager).load('./comfy_cafe_1k.hdr', (hdr) => {
    hdr.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = hdr;
    scene.environmentIntensity = 0.75;
    scene.environmentRotation.y = 1.9;
  });

  // Warm key light (soft shadows on the tabletop) + oil-lamp glow
  const key = new THREE.DirectionalLight('#ffd9a8', 2.2);
  key.position.set(0.9, 3.4, 1.5);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -1, right: 1, top: 1, bottom: -1, near: 0.5, far: 6 });
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.02;
  const flame = new THREE.PointLight('#ff9a3c', 1.2, 2.2, 2);
  scene.add(key, flame);

  // --- Load models
  const loader = new GLTFLoader(manager);
  loader.setMeshoptDecoder(MeshoptDecoder);
  const models = new Map<ModelId, THREE.Object3D>();
  MODELS.forEach((id) => loader.load(`./models/${id}.glb`, (g) => {
    g.scene.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    models.set(id, g.scene);
  }));

  const root = new THREE.Group();
  scene.add(root);

  const place = (id: ModelId, x: number, z: number, rotY = 0, y = 0, scale = 1) => {
    const src = models.get(id);
    if (!src) return null;
    const o = src.clone(true);
    o.position.set(x, y, z);
    o.rotation.y = rotY;
    o.scale.setScalar(scale);
    root.add(o);
    return o;
  };

  // --- Camera path (position + look target), sampled by scroll progress.
  const camPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(1.75, 1.7, 1.95),  // establishing, three-quarter from above
    new THREE.Vector3(0.52, 1.52, 0.6),  // close over the board and lemons
    new THREE.Vector3(0.8, 1.12, -0.12), // swing round towards the wine and brass
    new THREE.Vector3(0.28, 2.05, 0.32), // overhead, the whole table
  ]);
  const lookPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.66, 0),
    new THREE.Vector3(-0.06, 0.77, -0.08),
    new THREE.Vector3(-0.32, 0.92, -0.3),
    new THREE.Vector3(0, 0.74, 0),
  ]);
  let progress = 0, eased = 0;
  const pos = new THREE.Vector3(), look = new THREE.Vector3();

  manager.onLoad = () => {
    const table = models.get('round_wooden_table_01')!;
    const top = new THREE.Box3().setFromObject(table).max.y;
    // Lay props out in the first camera's frame: u = to the right on screen, v = away from the camera.
    const at = (u: number, v: number): [number, number] => [u * 0.74 - v * 0.67, -u * 0.67 - v * 0.74];
    const put = (id: ModelId, u: number, v: number, rot = 0, lift = 0, scale = 1) => place(id, ...at(u, v), rot, top + lift, scale);
    place('round_wooden_table_01', 0, 0);
    place('potted_plant_02', ...at(-1.25, 0.9), 0.4);
    const lamp = put('vintage_oil_lamp', -0.36, 0.34, 0.2);
    put('wine_bottles_01', -0.06, 0.44, 0.8);
    put('jug_01', 0.2, 0.42, 2.2);
    put('brass_goblets', 0.42, 0.18, -0.6);
    put('wooden_cutting_board', 0.02, -0.02, 0.25);
    put('lemon', -0.04, -0.03, 0.3, 0.022);
    put('lemon', 0.07, 0.04, 1.9, 0.022);
    put('lemon', 0.12, -0.06, 4.0, 0.022, 0.92);
    put('wooden_bowl_01', -0.38, -0.08, 0);
    put('food_pomegranate_01', -0.38, -0.08, 0.7, 0.035);
    put('food_pomegranate_01', -0.32, -0.13, 2.2, 0.032, 0.9);
    if (lamp) {
      const b = new THREE.Box3().setFromObject(lamp);
      flame.position.set(lamp.position.x, (b.min.y + b.max.y) / 2 + 0.03, lamp.position.z);
    }

    // Our own glass, filled with red wine
    const glass = new THREE.Group();
    glass.add(new THREE.Mesh(
      new THREE.LatheGeometry(glassProfile.map(([r, y]) => new THREE.Vector2(r, y)), 96),
      new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.02, transmission: 1, thickness: 0.004, ior: 1.5, side: THREE.DoubleSide }),
    ));
    const wine = new THREE.Mesh(
      new THREE.LatheGeometry([[0, 0.106], [0.022, 0.108], [0.037, 0.124], [0.042, 0.146], [0, 0.146]].map(([r, y]) => new THREE.Vector2(r * 0.97, y)), 96),
      new THREE.MeshPhysicalMaterial({ color: '#4a0710', roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.03 }),
    );
    glass.add(wine);
    glass.traverse((o) => { o.castShadow = true; });
    const [g1x, g1z] = at(0.34, -0.2);
    glass.position.set(g1x, top, g1z);
    root.add(glass);
    const glass2 = glass.clone(true);
    const [gx, gz] = at(0.2, -0.34);
    glass2.position.set(gx, top, gz);
    root.add(glass2);

    onReady();
  };

  const pointer = pointerTracker();
  stage.onFrame((t, dt) => {
    eased += (progress - eased) * (reducedMotion ? 1 : 1 - Math.exp(-4 * dt));
    camPath.getPoint(eased, pos);
    lookPath.getPoint(eased, look);
    const p = pointer.update(dt, 2);
    const sway = reducedMotion ? 0 : 1;
    camera.position.set(pos.x + p.x * 0.06 * sway + Math.sin(t * 0.3) * 0.015 * sway, pos.y + p.y * 0.03 * sway, pos.z);
    // On wide screens the copy sits on the left: aim slightly left of the table so it frames on the right.
    const shift = camera.aspect > 1.1 ? 0.11 * camera.position.distanceTo(look) : 0;
    look.x -= 0.74 * shift; look.z += 0.67 * shift;
    camera.lookAt(look);
    // Flame flicker: layered sines read as natural, cheap and deterministic.
    flame.intensity = 1.1 + (reducedMotion ? 0 : Math.sin(t * 13) * 0.08 + Math.sin(t * 7.3) * 0.12 + Math.sin(t * 23) * 0.05);
  });

  return { setProgress(v) { progress = THREE.MathUtils.clamp(v, 0, 1); } };
}
