import * as THREE from 'three';
import { CarModelId } from '../types/game';

// Shared materials and geometries for high performance and zero memory leaks
const tireGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.26, 18);
tireGeo.rotateZ(Math.PI / 2);

const rimGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.27, 12);
rimGeo.rotateZ(Math.PI / 2);

const tireMat = new THREE.MeshStandardMaterial({
  color: 0x1a1a1a,
  roughness: 0.9,
  metalness: 0.1,
});

const rimMat = new THREE.MeshStandardMaterial({
  color: 0xd0d4dc,
  roughness: 0.2,
  metalness: 0.9,
});

const glassMat = new THREE.MeshStandardMaterial({
  color: 0x0a1420,
  roughness: 0.05,
  metalness: 0.3,
  transparent: true,
  opacity: 0.85,
});

const headLightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
const tailLightMat = new THREE.MeshBasicMaterial({ color: 0xff1e28 });
const policeRedMat = new THREE.MeshBasicMaterial({ color: 0xff002b });
const policeBlueMat = new THREE.MeshBasicMaterial({ color: 0x0077ff });
const exhaustMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.9, roughness: 0.3 });

export interface CarRig {
  group: THREE.Group;
  wheels: THREE.Mesh[];
  bodyMesh: THREE.Mesh;
  headlights: THREE.Mesh[];
  taillights: THREE.Mesh[];
  sirenRed?: THREE.Mesh;
  sirenBlue?: THREE.Mesh;
  exhaustPipes: THREE.Vector3[];
  underglow?: THREE.Mesh;
}

export function createWheel(x: number, y: number, z: number, parent: THREE.Group, wheelsList: THREE.Mesh[]) {
  const wheelGroup = new THREE.Group();
  wheelGroup.position.set(x, y, z);

  const tire = new THREE.Mesh(tireGeo, tireMat);
  tire.castShadow = true;
  tire.receiveShadow = true;
  wheelGroup.add(tire);

  const rim = new THREE.Mesh(rimGeo, rimMat);
  wheelGroup.add(rim);

  parent.add(wheelGroup);
  wheelsList.push(tire);
  return wheelGroup;
}

/**
 * Creates 4 wheels with standard sports car track width & wheelbase
 */
function attachStandardWheels(parent: THREE.Group, width: number, frontZ: number, rearZ: number, y: number = 0.36): THREE.Mesh[] {
  const wheels: THREE.Mesh[] = [];
  const halfW = width * 0.5;
  createWheel(-halfW, y, frontZ, parent, wheels);
  createWheel(halfW, y, frontZ, parent, wheels);
  createWheel(-halfW, y, rearZ, parent, wheels);
  createWheel(halfW, y, rearZ, parent, wheels);
  return wheels;
}

/**
 * Procedural Apex Supercar: Low-slung, aerodynamic, aggressive rear wing, quad exhausts
 */
export function buildSupercar(colorHex: number): CarRig {
  const group = new THREE.Group();
  const wheels: THREE.Mesh[] = [];
  const headlights: THREE.Mesh[] = [];
  const taillights: THREE.Mesh[] = [];

  const bodyMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    roughness: 0.22,
    metalness: 0.75,
  });

  // 1. Main lower chassis / aero floor
  const chassisGeo = new THREE.BoxGeometry(1.82, 0.42, 3.8);
  const chassis = new THREE.Mesh(chassisGeo, bodyMat);
  chassis.position.set(0, 0.44, 0);
  chassis.castShadow = true;
  chassis.receiveShadow = true;
  group.add(chassis);

  // 2. Sculpted Hood & Nose wedge
  const hoodGeo = new THREE.BoxGeometry(1.68, 0.26, 1.3);
  const hood = new THREE.Mesh(hoodGeo, bodyMat);
  hood.position.set(0, 0.58, -1.1);
  hood.rotation.x = 0.08;
  hood.castShadow = true;
  group.add(hood);

  // Front splitter (carbon/black)
  const splitterGeo = new THREE.BoxGeometry(1.88, 0.08, 0.5);
  const splitter = new THREE.Mesh(splitterGeo, exhaustMat);
  splitter.position.set(0, 0.22, -1.9);
  group.add(splitter);

  // 3. Cockpit / Aero canopy
  const cabinGeo = new THREE.BoxGeometry(1.36, 0.58, 1.85);
  const cabin = new THREE.Mesh(cabinGeo, glassMat);
  cabin.position.set(0, 0.88, 0.05);
  cabin.castShadow = true;
  group.add(cabin);

  // 4. Roof cap (body color)
  const roofGeo = new THREE.BoxGeometry(1.24, 0.08, 1.4);
  const roof = new THREE.Mesh(roofGeo, bodyMat);
  roof.position.set(0, 1.18, 0.1);
  group.add(roof);

  // 5. Rear Spoiler / Wing
  const wingPillarGeo = new THREE.BoxGeometry(0.08, 0.4, 0.15);
  const pillarL = new THREE.Mesh(wingPillarGeo, exhaustMat);
  pillarL.position.set(-0.6, 0.82, 1.6);
  const pillarR = new THREE.Mesh(wingPillarGeo, exhaustMat);
  pillarR.position.set(0.6, 0.82, 1.6);
  group.add(pillarL, pillarR);

  const wingBladeGeo = new THREE.BoxGeometry(1.85, 0.06, 0.38);
  const wingBlade = new THREE.Mesh(wingBladeGeo, bodyMat);
  wingBlade.position.set(0, 1.02, 1.62);
  wingBlade.rotation.x = -0.06;
  group.add(wingBlade);

  // 6. Headlights (Angled LED strips)
  const hlGeo = new THREE.BoxGeometry(0.38, 0.1, 0.06);
  const hlL = new THREE.Mesh(hlGeo, headLightMat);
  hlL.position.set(-0.62, 0.54, -1.91);
  hlL.rotation.y = 0.15;
  const hlR = new THREE.Mesh(hlGeo, headLightMat);
  hlR.position.set(0.62, 0.54, -1.91);
  hlR.rotation.y = -0.15;
  group.add(hlL, hlR);
  headlights.push(hlL, hlR);

  // 7. Full-width OLED Taillight bar
  const tlGeo = new THREE.BoxGeometry(1.58, 0.08, 0.06);
  const tl = new THREE.Mesh(tlGeo, tailLightMat);
  tl.position.set(0, 0.62, 1.91);
  group.add(tl);
  taillights.push(tl);

  // 8. Quad exhausts
  const exhaustPipes = [
    new THREE.Vector3(-0.35, 0.32, 1.92),
    new THREE.Vector3(-0.2, 0.32, 1.92),
    new THREE.Vector3(0.2, 0.32, 1.92),
    new THREE.Vector3(0.35, 0.32, 1.92),
  ];
  exhaustPipes.forEach(pos => {
    const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.15, 8), exhaustMat);
    tip.rotateX(Math.PI / 2);
    tip.position.copy(pos);
    group.add(tip);
  });

  // Underglow neon mesh
  const underglowGeo = new THREE.PlaneGeometry(1.7, 3.2);
  underglowGeo.rotateX(-Math.PI / 2);
  const underglowMat = new THREE.MeshBasicMaterial({
    color: 0x00f0ff,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
  });
  const underglow = new THREE.Mesh(underglowGeo, underglowMat);
  underglow.position.set(0, 0.05, 0);
  group.add(underglow);

  const wheelsList = attachStandardWheels(group, 1.92, -1.2, 1.25);
  wheels.push(...wheelsList);

  return {
    group,
    wheels,
    bodyMesh: chassis,
    headlights,
    taillights,
    exhaustPipes,
    underglow,
  };
}

/**
 * Procedural Cyber Phantom: Futuristic faceted electric hypercar with glowing geometric trims
 */
export function buildCyberCar(colorHex: number): CarRig {
  const group = new THREE.Group();
  const wheels: THREE.Mesh[] = [];
  const headlights: THREE.Mesh[] = [];
  const taillights: THREE.Mesh[] = [];

  const bodyMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    roughness: 0.15,
    metalness: 0.9,
  });

  // Angular chassis
  const chassisGeo = new THREE.BoxGeometry(1.88, 0.4, 3.9);
  const chassis = new THREE.Mesh(chassisGeo, bodyMat);
  chassis.position.set(0, 0.42, 0);
  chassis.castShadow = true;
  group.add(chassis);

  // Stealth cabin canopy
  const cabinGeo = new THREE.BoxGeometry(1.4, 0.52, 2.0);
  const cabin = new THREE.Mesh(cabinGeo, glassMat);
  cabin.position.set(0, 0.8, -0.05);
  cabin.castShadow = true;
  group.add(cabin);

  // Twin rear fin stabilizers
  const finGeo = new THREE.BoxGeometry(0.06, 0.5, 1.1);
  const finL = new THREE.Mesh(finGeo, bodyMat);
  finL.position.set(-0.76, 0.8, 1.2);
  finL.rotation.z = -0.15;
  const finR = new THREE.Mesh(finGeo, bodyMat);
  finR.position.set(0.76, 0.8, 1.2);
  finR.rotation.z = 0.15;
  group.add(finL, finR);

  // Neon Cyan Cyber Headlight Bar
  const hlGeo = new THREE.BoxGeometry(1.68, 0.06, 0.06);
  const hl = new THREE.Mesh(hlGeo, new THREE.MeshBasicMaterial({ color: 0x00ffff }));
  hl.position.set(0, 0.5, -1.96);
  group.add(hl);
  headlights.push(hl);

  // Neon Magenta Taillight Bar
  const tlGeo = new THREE.BoxGeometry(1.7, 0.08, 0.06);
  const tl = new THREE.Mesh(tlGeo, new THREE.MeshBasicMaterial({ color: 0xff0066 }));
  tl.position.set(0, 0.55, 1.96);
  group.add(tl);
  taillights.push(tl);

  const underglowGeo = new THREE.PlaneGeometry(1.8, 3.4);
  underglowGeo.rotateX(-Math.PI / 2);
  const underglowMat = new THREE.MeshBasicMaterial({
    color: 0xff00aa,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });
  const underglow = new THREE.Mesh(underglowGeo, underglowMat);
  underglow.position.set(0, 0.05, 0);
  group.add(underglow);

  const exhaustPipes = [new THREE.Vector3(-0.3, 0.35, 1.95), new THREE.Vector3(0.3, 0.35, 1.95)];

  const wheelsList = attachStandardWheels(group, 1.98, -1.25, 1.25);
  wheels.push(...wheelsList);

  return {
    group,
    wheels,
    bodyMesh: chassis,
    headlights,
    taillights,
    exhaustPipes,
    underglow,
  };
}

/**
 * Procedural Muscle Car: Classic muscular stance, supercharger blower scoop on hood, twin stripes
 */
export function buildMuscleCar(colorHex: number): CarRig {
  const group = new THREE.Group();
  const wheels: THREE.Mesh[] = [];
  const headlights: THREE.Mesh[] = [];
  const taillights: THREE.Mesh[] = [];

  const bodyMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    roughness: 0.3,
    metalness: 0.6,
  });

  // Boxy aggressive body
  const chassisGeo = new THREE.BoxGeometry(1.9, 0.52, 4.1);
  const chassis = new THREE.Mesh(chassisGeo, bodyMat);
  chassis.position.set(0, 0.48, 0);
  chassis.castShadow = true;
  group.add(chassis);

  // Cabin
  const cabinGeo = new THREE.BoxGeometry(1.48, 0.56, 1.9);
  const cabin = new THREE.Mesh(cabinGeo, glassMat);
  cabin.position.set(0, 0.94, 0.2);
  cabin.castShadow = true;
  group.add(cabin);

  // Roof
  const roofGeo = new THREE.BoxGeometry(1.44, 0.08, 1.6);
  const roof = new THREE.Mesh(roofGeo, bodyMat);
  roof.position.set(0, 1.24, 0.25);
  group.add(roof);

  // Chrome Blower scoop on hood
  const blowerGeo = new THREE.BoxGeometry(0.5, 0.25, 0.65);
  const blower = new THREE.Mesh(blowerGeo, rimMat);
  blower.position.set(0, 0.8, -1.1);
  group.add(blower);

  // Dual round headlights
  const hlGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.08, 12);
  hlGeo.rotateX(Math.PI / 2);
  [-0.64, -0.4, 0.4, 0.64].forEach(x => {
    const hl = new THREE.Mesh(hlGeo, headLightMat);
    hl.position.set(x, 0.52, -2.06);
    group.add(hl);
    headlights.push(hl);
  });

  // Triple vertical taillights
  [-0.6, -0.45, 0.45, 0.6].forEach(x => {
    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.24, 0.06), tailLightMat);
    tl.position.set(x, 0.56, 2.06);
    group.add(tl);
    taillights.push(tl);
  });

  const exhaustPipes = [new THREE.Vector3(-0.6, 0.28, 2.05), new THREE.Vector3(0.6, 0.28, 2.05)];

  const underglow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.8, 3.6).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0xff8800, transparent: true, opacity: 0.35, depthWrite: false })
  );
  underglow.position.set(0, 0.05, 0);
  group.add(underglow);

  const wheelsList = attachStandardWheels(group, 1.95, -1.25, 1.3);
  wheels.push(...wheelsList);

  return {
    group,
    wheels,
    bodyMesh: chassis,
    headlights,
    taillights,
    exhaustPipes,
    underglow,
  };
}

/**
 * Procedural Police Interceptor: Heavy pursuit interceptor with bullbar and animated lightbar
 */
export function buildInterceptor(colorHex: number): CarRig {
  const group = new THREE.Group();
  const wheels: THREE.Mesh[] = [];
  const headlights: THREE.Mesh[] = [];
  const taillights: THREE.Mesh[] = [];

  const bodyMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    roughness: 0.25,
    metalness: 0.7,
  });

  const chassisGeo = new THREE.BoxGeometry(1.86, 0.5, 4.0);
  const chassis = new THREE.Mesh(chassisGeo, bodyMat);
  chassis.position.set(0, 0.48, 0);
  chassis.castShadow = true;
  group.add(chassis);

  // Cabin
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.56, 1.9), glassMat);
  cabin.position.set(0, 0.94, 0.1);
  cabin.castShadow = true;
  group.add(cabin);

  // Roof
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.08, 1.6), bodyMat);
  roof.position.set(0, 1.24, 0.15);
  group.add(roof);

  // Heavy steel push bar / Bullbar
  const bullbar = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.45, 0.2), exhaustMat);
  bullbar.position.set(0, 0.45, -2.1);
  group.add(bullbar);

  // Police Siren Lightbar on roof
  const sirenRed = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.1, 0.22), policeRedMat);
  sirenRed.position.set(-0.3, 1.34, 0.15);
  const sirenBlue = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.1, 0.22), policeBlueMat);
  sirenBlue.position.set(0.3, 1.34, 0.15);
  group.add(sirenRed, sirenBlue);

  // Headlights & Taillights
  [-0.6, 0.6].forEach(x => {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.14, 0.06), headLightMat);
    hl.position.set(x, 0.52, -2.01);
    group.add(hl);
    headlights.push(hl);

    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.14, 0.06), tailLightMat);
    tl.position.set(x, 0.56, 2.01);
    group.add(tl);
    taillights.push(tl);
  });

  const exhaustPipes = [new THREE.Vector3(-0.45, 0.3, 2.02), new THREE.Vector3(0.45, 0.3, 2.02)];

  const underglow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.8, 3.6).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0x3366ff, transparent: true, opacity: 0.4, depthWrite: false })
  );
  underglow.position.set(0, 0.05, 0);
  group.add(underglow);

  const wheelsList = attachStandardWheels(group, 1.94, -1.2, 1.25);
  wheels.push(...wheelsList);

  return {
    group,
    wheels,
    bodyMesh: chassis,
    headlights,
    taillights,
    sirenRed,
    sirenBlue,
    exhaustPipes,
    underglow,
  };
}

export function buildPlayerCar(modelId: CarModelId, colorHex: number): CarRig {
  switch (modelId) {
    case 'cyber':
      return buildCyberCar(colorHex);
    case 'muscle':
      return buildMuscleCar(colorHex);
    case 'interceptor':
      return buildInterceptor(colorHex);
    case 'supercar':
    default:
      return buildSupercar(colorHex);
  }
}

// --- TRAFFIC MODELS ---
export type TrafficType = 'sedan' | 'cab' | 'truck' | 'police' | 'sports';

export function buildTrafficVehicle(type: TrafficType, colorOverride?: number): CarRig {
  const group = new THREE.Group();
  const wheels: THREE.Mesh[] = [];
  const headlights: THREE.Mesh[] = [];
  const taillights: THREE.Mesh[] = [];
  let sirenRed: THREE.Mesh | undefined;
  let sirenBlue: THREE.Mesh | undefined;

  if (type === 'truck') {
    // 18-Wheeler Cargo Rig
    const cabMat = new THREE.MeshStandardMaterial({
      color: colorOverride ?? 0x1f3c88,
      roughness: 0.3,
      metalness: 0.5,
    });
    const containerMat = new THREE.MeshStandardMaterial({
      color: 0xefefef,
      roughness: 0.4,
      metalness: 0.2,
    });

    // Heavy tractor cabin
    const cab = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.6, 2.4), cabMat);
    cab.position.set(0, 1.3, -2.6);
    cab.castShadow = true;
    group.add(cab);

    // Windshield
    const ws = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.6, 0.1), glassMat);
    ws.position.set(0, 1.5, -3.81);
    group.add(ws);

    // Massive cargo container trailer
    const trailer = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.3, 6.4), containerMat);
    trailer.position.set(0, 1.7, 1.8);
    trailer.castShadow = true;
    group.add(trailer);

    // Chrome vertical smoke stacks
    [-1.05, 1.05].forEach(x => {
      const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.8, 10), rimMat);
      stack.position.set(x, 2.2, -1.5);
      group.add(stack);
    });

    // 6 Wheels
    [-1.2, 1.2].forEach(x => {
      createWheel(x, 0.45, -2.6, group, wheels);
      createWheel(x, 0.45, 0.6, group, wheels);
      createWheel(x, 0.45, 3.8, group, wheels);
    });

    // Lights
    const hlL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.1), headLightMat);
    hlL.position.set(-0.8, 0.7, -3.82);
    const hlR = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.1), headLightMat);
    hlR.position.set(0.8, 0.7, -3.82);
    group.add(hlL, hlR);
    headlights.push(hlL, hlR);

    const tl = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.15, 0.1), tailLightMat);
    tl.position.set(0, 0.8, 5.01);
    group.add(tl);
    taillights.push(tl);

    return {
      group,
      wheels,
      bodyMesh: cab,
      headlights,
      taillights,
      exhaustPipes: [new THREE.Vector3(-1.05, 3.0, -1.5), new THREE.Vector3(1.05, 3.0, -1.5)],
    };
  }

  if (type === 'cab') {
    // Yellow Taxi with taxi sign on roof
    const cabColor = 0xffbf00;
    const bodyMat = new THREE.MeshStandardMaterial({ color: cabColor, roughness: 0.35, metalness: 0.4 });
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.48, 3.8), bodyMat);
    chassis.position.set(0, 0.46, 0);
    chassis.castShadow = true;
    group.add(chassis);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.54, 1.8), glassMat);
    cabin.position.set(0, 0.9, 0.1);
    group.add(cabin);

    // TAXI rooftop roof sign
    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 0.18, 0.25),
      new THREE.MeshBasicMaterial({ color: 0xffea79 })
    );
    sign.position.set(0, 1.25, 0.1);
    group.add(sign);

    [-0.6, 0.6].forEach(x => {
      const hl = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.06), headLightMat);
      hl.position.set(x, 0.5, -1.91);
      group.add(hl);
      headlights.push(hl);

      const tl = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.06), tailLightMat);
      tl.position.set(x, 0.54, 1.91);
      group.add(tl);
      taillights.push(tl);
    });

    const wheelsList = attachStandardWheels(group, 1.86, -1.2, 1.2);
    wheels.push(...wheelsList);

    return { group, wheels, bodyMesh: chassis, headlights, taillights, exhaustPipes: [] };
  }

  if (type === 'police') {
    return buildInterceptor(0x0a0c10);
  }

  if (type === 'sports') {
    return buildSupercar(colorOverride ?? 0xff2020);
  }

  // Standard commuter sedan
  const bodyColor = colorOverride ?? 0x336699;
  const bodyMat = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.4, metalness: 0.5 });
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.48, 3.7), bodyMat);
  chassis.position.set(0, 0.46, 0);
  chassis.castShadow = true;
  group.add(chassis);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.54, 1.7), glassMat);
  cabin.position.set(0, 0.9, 0.05);
  group.add(cabin);

  [-0.58, 0.58].forEach(x => {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.06), headLightMat);
    hl.position.set(x, 0.5, -1.86);
    group.add(hl);
    headlights.push(hl);

    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.06), tailLightMat);
    tl.position.set(x, 0.52, 1.86);
    group.add(tl);
    taillights.push(tl);
  });

  const wheelsList = attachStandardWheels(group, 1.84, -1.15, 1.15);
  wheels.push(...wheelsList);

  return { group, wheels, bodyMesh: chassis, headlights, taillights, sirenRed, sirenBlue, exhaustPipes: [] };
}

// --- COLLECTIBLE POWERUPS ---

export function buildPickupMesh(type: 'nitro' | 'coin' | 'shield' | 'magnet'): THREE.Group {
  const group = new THREE.Group();

  if (type === 'coin') {
    const coinGeo = new THREE.CylinderGeometry(0.65, 0.65, 0.14, 24);
    coinGeo.rotateX(Math.PI / 2);
    const coinMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0xffaa00,
      emissiveIntensity: 0.3,
    });
    const coin = new THREE.Mesh(coinGeo, coinMat);
    coin.castShadow = true;
    group.add(coin);

    // Inner star/circle relief
    const innerRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.42, 0.05, 8, 20),
      new THREE.MeshStandardMaterial({ color: 0xfff088, metalness: 0.95, roughness: 0.1 })
    );
    group.add(innerRing);
  } else if (type === 'nitro') {
    // Nitro bottle
    const tankGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.85, 16);
    const tankMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      metalness: 0.7,
      roughness: 0.2,
      emissive: 0x00b4d8,
      emissiveIntensity: 0.5,
    });
    const tank = new THREE.Mesh(tankGeo, tankMat);
    tank.castShadow = true;
    group.add(tank);

    // Top valve
    const valve = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.2, 8), rimMat);
    valve.position.y = 0.52;
    group.add(valve);

    // Glowing energy ring
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.35, 0.04, 8, 18),
      new THREE.MeshBasicMaterial({ color: 0x80ffff })
    );
    group.add(ring);
  } else if (type === 'shield') {
    // Shield sphere
    const sphere = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.6, 2),
      new THREE.MeshStandardMaterial({
        color: 0x48cae4,
        roughness: 0.1,
        metalness: 0.3,
        transparent: true,
        opacity: 0.7,
        emissive: 0x0096c7,
        emissiveIntensity: 0.5,
      })
    );
    group.add(sphere);

    const orbit = new THREE.Mesh(
      new THREE.TorusGeometry(0.85, 0.04, 8, 24),
      new THREE.MeshBasicMaterial({ color: 0x90e0ef })
    );
    orbit.rotation.x = Math.PI / 4;
    group.add(orbit);
  } else if (type === 'magnet') {
    // Horseshoe magnet
    const ringGeo = new THREE.TorusGeometry(0.5, 0.12, 10, 24, Math.PI);
    ringGeo.rotateZ(Math.PI);
    const magMat = new THREE.MeshStandardMaterial({
      color: 0xe63946,
      roughness: 0.3,
      metalness: 0.7,
    });
    const magnet = new THREE.Mesh(ringGeo, magMat);
    group.add(magnet);

    // Silver tips
    [-0.5, 0.5].forEach(x => {
      const tip = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.25, 0.24), rimMat);
      tip.position.set(x, 0.12, 0);
      group.add(tip);
    });
  }

  group.position.y = 0.8;
  return group;
}

// --- ROADSIDE SCENERY MODELS ---

export function createPalmTree(): THREE.Group {
  const tree = new THREE.Group();

  // Segmented curved trunk
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6e4a2e, roughness: 0.9, metalness: 0.1 });
  const trunkGeo = new THREE.CylinderGeometry(0.2, 0.35, 6, 8);
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = 3;
  trunk.rotation.z = (Math.random() - 0.5) * 0.15;
  trunk.castShadow = true;
  tree.add(trunk);

  // Palm fronds (5-6 angled fans)
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x2d8a4e, roughness: 0.7, metalness: 0.1 });
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const leafGeo = new THREE.BoxGeometry(0.45, 0.05, 2.5);
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    leaf.position.set(Math.sin(angle) * 1.1, 5.8, Math.cos(angle) * 1.1);
    leaf.rotation.y = angle;
    leaf.rotation.x = 0.45;
    leaf.castShadow = true;
    tree.add(leaf);
  }

  return tree;
}

export function createPineTree(): THREE.Group {
  const tree = new THREE.Group();
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a2e18, roughness: 0.9 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.4, 2, 8), trunkMat);
  trunk.position.y = 1;
  trunk.castShadow = true;
  tree.add(trunk);

  const needleMat = new THREE.MeshStandardMaterial({ color: 0x1b492b, roughness: 0.8 });
  [
    { radius: 1.8, height: 2.2, y: 2.5 },
    { radius: 1.3, height: 1.8, y: 3.8 },
    { radius: 0.8, height: 1.4, y: 4.8 },
  ].forEach(layer => {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(layer.radius, layer.height, 8), needleMat);
    cone.position.y = layer.y;
    cone.castShadow = true;
    tree.add(cone);
  });

  return tree;
}

export function createLampPost(): THREE.Group {
  const post = new THREE.Group();
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x22262c, roughness: 0.4, metalness: 0.8 });

  // Vertical pole
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 7.5, 8), metalMat);
  pole.position.y = 3.75;
  post.add(pole);

  // Curved horizontal arm over the road
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.8, 8), metalMat);
  arm.rotateZ(Math.PI / 2.3);
  arm.position.set(-1.0, 7.2, 0);
  post.add(arm);

  // Fixture lamp
  const lamp = new THREE.Mesh(
    new THREE.BoxGeometry(0.35, 0.14, 0.6),
    new THREE.MeshBasicMaterial({ color: 0xffeedd })
  );
  lamp.position.set(-2.0, 7.0, 0);
  post.add(lamp);

  return post;
}

export function createHighwayGantry(): THREE.Group {
  const gantry = new THREE.Group();
  const steelMat = new THREE.MeshStandardMaterial({ color: 0x3a404d, metalness: 0.7, roughness: 0.5 });

  // Two pillar supports
  [-11.5, 11.5].forEach(x => {
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 8.5, 8), steelMat);
    pillar.position.set(x, 4.25, 0);
    gantry.add(pillar);
  });

  // Cross beam
  const beam = new THREE.Mesh(new THREE.BoxGeometry(24, 0.6, 0.8), steelMat);
  beam.position.set(0, 8.2, 0);
  gantry.add(beam);

  // Overhead highway digital LED board
  const board = new THREE.Mesh(
    new THREE.BoxGeometry(10, 2.2, 0.3),
    new THREE.MeshStandardMaterial({ color: 0x053520, roughness: 0.4 })
  );
  board.position.set(0, 7.5, -0.3);
  gantry.add(board);

  // Emissive speed limit / info sign
  const signText = new THREE.Mesh(
    new THREE.PlaneGeometry(9.4, 1.8),
    new THREE.MeshBasicMaterial({ color: 0x39ff14 })
  );
  signText.position.set(0, 7.5, -0.46);
  signText.rotation.y = Math.PI;
  gantry.add(signText);

  return gantry;
}
