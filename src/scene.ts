import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { createStage, pointerTracker } from './lib/stage';

/** Profile (radius, height) of a Bordeaux-style glass, revolved with LatheGeometry. */
const glassProfile: Array<[number, number]> = [
  [0, 0], [0.62, 0], [0.64, 0.03], [0.1, 0.07], [0.055, 0.12], [0.045, 1.2], [0.07, 1.3], [0.35, 1.45], [0.6, 1.75],
  [0.72, 2.15], [0.7, 2.6], [0.6, 3.05], [0.58, 3.1],
];

export function initScene(canvas: HTMLCanvasElement) {
  const stage = createStage(canvas, { fov: 30 });
  if (!stage) return;
  const { scene, camera, renderer, reducedMotion } = stage;
  camera.position.set(0, 1.6, 9);
  renderer.toneMappingExposure = 1.1;

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  const group = new THREE.Group();
  group.position.set(window.innerWidth > 900 ? 2.4 : 0, -1.4, 0);
  scene.add(group);

  // Glass: thin-walled by revolving the outer profile and rendering both sides.
  const pts = glassProfile.map(([r, y]) => new THREE.Vector2(r, y));
  const glass = new THREE.Mesh(
    new THREE.LatheGeometry(pts, 96),
    new THREE.MeshPhysicalMaterial({ color: '#ffffff', metalness: 0, roughness: 0.04, transmission: 1, thickness: 0.12, ior: 1.45, side: THREE.DoubleSide, envMapIntensity: 1.2 }),
  );
  group.add(glass);

  // Wine: a solid of revolution filling the bowl up to ~2.15.
  const winePts = [[0, 1.42], [0.32, 1.47], [0.56, 1.76], [0.66, 2.1], [0, 2.1]].map(([r, y]) => new THREE.Vector2(r * 0.97, y));
  const wine = new THREE.Mesh(
    new THREE.LatheGeometry(winePts, 96),
    new THREE.MeshPhysicalMaterial({ color: '#5a0a14', roughness: 0.1, clearcoat: 1, clearcoatRoughness: 0.05, sheen: 0.4, sheenColor: new THREE.Color('#ff3b4e') }),
  );
  group.add(wine);

  // Floating olives and a basil-like leaf: small details that catch the light.
  const olives = new THREE.Group();
  const oliveMat = new THREE.MeshPhysicalMaterial({ color: '#4c5a1e', roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.1 });
  const oliveGeo = new THREE.SphereGeometry(0.22, 32, 16);
  oliveGeo.scale(1, 1.35, 1);
  const olivePositions: Array<[number, number, number]> = [[-1.6, 2.7, 0.2], [1.5, 3.4, -0.8], [-1.4, 0.9, 0.9], [1.8, 1.5, 0.6]];
  olivePositions.forEach(([x, y, z]) => { const o = new THREE.Mesh(oliveGeo, oliveMat); o.position.set(x, y, z); o.rotation.z = x * 0.4; olives.add(o); });
  group.add(olives);

  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, 0); leafShape.quadraticCurveTo(0.45, 0.5, 0, 1.3); leafShape.quadraticCurveTo(-0.45, 0.5, 0, 0);
  const leaf = new THREE.Mesh(new THREE.ShapeGeometry(leafShape, 24), new THREE.MeshPhysicalMaterial({ color: '#2f5e2b', roughness: 0.55, side: THREE.DoubleSide, envMapIntensity: 0.4 }));
  leaf.position.set(-1.7, 1.7, -0.4); leaf.rotation.set(0.4, 0.6, -0.8);
  group.add(leaf);

  // Warm key light & rim light
  const key = new THREE.SpotLight('#ffcf9a', 60, 30, Math.PI / 6, 0.6);
  key.position.set(4, 8, 6);
  const rim = new THREE.PointLight('#ff5a36', 20, 12);
  rim.position.set(-3, 2, -3);
  scene.add(key, rim, new THREE.AmbientLight('#3a2418', 0.6));

  const pointer = pointerTracker();
  let scroll = 0;
  addEventListener('scroll', () => { scroll = Math.min(scrollY / innerHeight, 1.2); }, { passive: true });
  addEventListener('resize', () => { group.position.x = innerWidth > 900 ? 2.4 : 0; });

  stage.onFrame((t, dt) => {
    const p = pointer.update(dt, 3);
    const time = reducedMotion ? 0 : t;
    group.rotation.y = time * 0.25 + p.x * 0.5 + scroll * 1.5;
    group.rotation.x = p.y * 0.08;
    olives.children.forEach((o, i) => { o.position.y = olivePositions[i][1] + Math.sin(time * 0.9 + i * 1.7) * 0.12; o.rotation.y = time * 0.3 + i; });
    leaf.rotation.z = -0.8 + Math.sin(time * 0.7) * 0.1;
    // Gently swirl the wine surface by rocking it.
    wine.rotation.z = Math.sin(time * 1.2) * 0.02;
    camera.position.y = 1.6 - scroll * 1.2;
    camera.lookAt(group.position.x * 0.5, 0.2, 0);
  });
}
