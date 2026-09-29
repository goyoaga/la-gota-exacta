import * as THREE from 'three';
import { CAPACITY, MARK_FRACTIONS, heightForVolume, makeVolumeTable } from './game.js';

const HEIGHT = 2.65;
const BASE = 0.22;

export function createScene(canvas, wrapper) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0xffffff, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(4.35, 4.35, 9.3);
  camera.lookAt(0, 1.5, 0);

  scene.add(new THREE.HemisphereLight(0xe8ffff, 0x858d82, 2.25));
  const light = new THREE.DirectionalLight(0xffffff, 2.4);
  light.position.set(-3, 7, 6);
  scene.add(light);
  const cool = new THREE.DirectionalLight(0x8ce7df, 0.8);
  cool.position.set(5, 3, -2);
  scene.add(cool);

  // A soft painted shadow keeps the scene inexpensive on mobile GPUs.
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(1.5, 64),
    new THREE.MeshBasicMaterial({ color: 0x6a8580, transparent: true, opacity: 0.13, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.scale.set(1.65, 0.7, 1);
  shadow.position.y = 0.025;
  scene.add(shadow);

  const coaster = new THREE.Mesh(
    new THREE.CylinderGeometry(1.45, 1.45, 0.09, 72),
    new THREE.MeshStandardMaterial({ color: 0xe3e5de, roughness: 0.8 }),
  );
  coaster.position.y = 0.02;
  scene.add(coaster);

  const vesselGroup = new THREE.Group();
  scene.add(vesselGroup);
  const waterMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x30c5c5,
    metalness: 0.02,
    roughness: 0.13,
    transmission: 0.22,
    transparent: true,
    opacity: 0.83,
    side: THREE.DoubleSide,
    depthWrite: true,
  });
  const surfaceMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x8ce9e3,
    roughness: 0.11,
    metalness: 0.03,
    transparent: true,
    opacity: 0.95,
    side: THREE.DoubleSide,
  });
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xe3ffff,
    metalness: 0.02,
    roughness: 0.11,
    transparent: true,
    opacity: 0.20,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const rimMaterial = new THREE.MeshStandardMaterial({
    color: 0xe8f7f4, metalness: 0.36, roughness: 0.24, transparent: true, opacity: 0.85,
  });
  const markMaterial = new THREE.MeshBasicMaterial({
    color: 0x396c69, transparent: true, opacity: 0.48, depthWrite: false,
  });
  const pourMaterial = new THREE.MeshBasicMaterial({ color: 0x9bedeb, transparent: true, opacity: 0.82 });
  const stream = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.042, 1, 10), pourMaterial);
  stream.visible = false;
  scene.add(stream);

  let vessel;
  let table;
  let liquid;
  let surface;
  let lastDrawn = -1;
  let currentVolume = 0;
  let isPouring = false;

  function clearVessel() {
    while (vesselGroup.children.length) {
      const child = vesselGroup.children[0];
      vesselGroup.remove(child);
      child.geometry?.dispose();
    }
    liquid = null;
    surface = null;
  }

  function setVessel(next) {
    clearVessel();
    vessel = next;
    table = makeVolumeTable(vessel);
    lastDrawn = -1;
    const outline = [];
    for (let i = 0; i <= 48; i += 1) {
      const t = i / 48;
      outline.push(new THREE.Vector2(vessel.radius(t) * 1.43, BASE + HEIGHT * t));
    }
    const glass = new THREE.Mesh(new THREE.LatheGeometry(outline, 80), glassMaterial);
    glass.renderOrder = 3;
    vesselGroup.add(glass);

    const topRadius = vessel.radius(1) * 1.43;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(topRadius, 0.028, 8, 80), rimMaterial);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = BASE + HEIGHT;
    rim.renderOrder = 4;
    vesselGroup.add(rim);

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(vessel.radius(0) * 1.43, vessel.radius(0) * 1.43, 0.055, 80),
      new THREE.MeshStandardMaterial({ color: 0xd7efec, roughness: 0.36, metalness: 0.08 }),
    );
    base.position.y = BASE;
    vesselGroup.add(base);

    for (const fraction of MARK_FRACTIONS) {
      const h = heightForVolume(fraction * CAPACITY, table);
      const radius = vessel.radius(h) * 1.43 + 0.009;
      const tick = new THREE.Mesh(
        new THREE.TorusGeometry(radius, 0.008, 4, 80, Math.PI * 0.20),
        markMaterial,
      );
      tick.rotation.x = Math.PI / 2;
      tick.rotation.z = -Math.PI * 0.41;
      tick.position.y = BASE + h * HEIGHT;
      tick.renderOrder = 5;
      vesselGroup.add(tick);
    }
    setVolume(0);
  }

  function setVolume(volume) {
    currentVolume = Math.max(0, Math.min(CAPACITY, volume));
    // Geometry is updated at most every 0.3 ml; the score itself stays precise.
    if (Math.abs(currentVolume - lastDrawn) < 0.3 && currentVolume !== 0) return;
    lastDrawn = currentVolume;
    if (liquid) {
      vesselGroup.remove(liquid, surface);
      liquid.geometry.dispose();
      surface.geometry.dispose();
      liquid = null;
      surface = null;
    }
    if (currentVolume < 0.03) return;
    const h = heightForVolume(currentVolume, table);
    const points = [new THREE.Vector2(0, BASE + 0.042)];
    const count = Math.max(4, Math.ceil(h * 52));
    for (let i = 0; i <= count; i += 1) {
      const t = h * i / count;
      points.push(new THREE.Vector2(Math.max(0.001, vessel.radius(t) * 1.43 - 0.045), BASE + 0.042 + (HEIGHT - 0.065) * t));
    }
    liquid = new THREE.Mesh(new THREE.LatheGeometry(points, 64), waterMaterial);
    liquid.renderOrder = 1;
    vesselGroup.add(liquid);
    const radius = Math.max(0.05, vessel.radius(h) * 1.43 - 0.045);
    surface = new THREE.Mesh(new THREE.CircleGeometry(radius, 64), surfaceMaterial);
    surface.rotation.x = -Math.PI / 2;
    surface.position.y = BASE + 0.042 + (HEIGHT - 0.065) * h + 0.004;
    surface.renderOrder = 2;
    vesselGroup.add(surface);
  }

  function setPouring(value) {
    isPouring = value;
    stream.visible = value;
  }

  function resize() {
    const { width, height } = wrapper.getBoundingClientRect();
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.zoom = width < 730 ? 1.55 : 1;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }
  const observer = new ResizeObserver(resize);
  observer.observe(wrapper);
  resize();

  let frame = 0;
  function render() {
    if (isPouring) {
      const h = heightForVolume(currentVolume, table);
      const surfaceY = BASE + 0.042 + (HEIGHT - 0.065) * h;
      const top = BASE + HEIGHT + 0.65;
      stream.scale.y = Math.max(0.05, top - surfaceY);
      stream.position.set(-0.08, (top + surfaceY) / 2, 0);
    }
    vesselGroup.rotation.y = Math.sin(performance.now() * 0.00026) * 0.12;
    renderer.render(scene, camera);
    frame = requestAnimationFrame(render);
  }
  render();

  return {
    setVessel,
    setVolume,
    setPouring,
    dispose() {
      cancelAnimationFrame(frame);
      observer.disconnect();
      clearVessel();
      shadow.geometry.dispose();
      coaster.geometry.dispose();
      stream.geometry.dispose();
      renderer.dispose();
    },
  };
}
