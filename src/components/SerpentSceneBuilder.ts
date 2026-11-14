import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  classifyBiomeAtPosition,
  groundHeightAt,
  type PickupKind,
  type PrismWorldState,
} from '../game/prismEngine';

export interface ParticleSlot {
  active: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  scale: number;
  color: THREE.Color;
}

export interface SerpentVisualRig {
  group: THREE.Group;
  coreMesh: THREE.Mesh;
  telegraphRing: THREE.Mesh;
  shadowDisc: THREE.Mesh;
  hullMat: THREE.MeshStandardMaterial;
  accentMat: THREE.MeshStandardMaterial;
}

export interface RelicVisualRig {
  group: THREE.Group;
  innerRotor: THREE.Group;
  outerRing: THREE.Mesh;
  beaconBeam: THREE.Mesh;
}

export interface ShrineVisualRig {
  group: THREE.Group;
  crystalMesh: THREE.Mesh;
  haloRing: THREE.Mesh;
  progressArc: THREE.Mesh;
  crystalMat: THREE.MeshStandardMaterial;
}

export interface SerpentSceneController {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  updateFromWorld: (world: PrismWorldState, dt: number, elapsedSec: number) => void;
  spawnBurst: (x: number, y: number, z: number, colorHex: string, count?: number) => void;
  dispose: () => void;
}

function createRadialShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(64, 64, 8, 64, 64, 60);
  grad.addColorStop(0, 'rgba(2, 6, 18, 0.72)');
  grad.addColorStop(0.55, 'rgba(2, 6, 18, 0.32)');
  grad.addColorStop(1, 'rgba(2, 6, 18, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function createHexCircuitTextures(maxAnisotropy: number): {
  albedo: THREE.CanvasTexture;
  bump: THREE.CanvasTexture;
} {
  const size = 512;
  const albedoCanvas = document.createElement('canvas');
  albedoCanvas.width = size;
  albedoCanvas.height = size;
  const ctx = albedoCanvas.getContext('2d')!;

  ctx.fillStyle = '#142038';
  ctx.fillRect(0, 0, size, size);

  // Mineral grain speckle so terrain reads tactile at close chase camera distances
  for (let i = 0; i < 2400; i++) {
    const gx = (i * 173) % size;
    const gy = (i * 293) % size;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.035)' : 'rgba(4,9,22,0.14)';
    ctx.fillRect(gx, gy, 2, 2);
  }

  // Subtle geometric Sovereign circuit grid
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.19)';
  ctx.lineWidth = 2;
  const step = 64;
  for (let x = 0; x <= size; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, size);
    ctx.stroke();
  }
  for (let y = 0; y <= size; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }

  // Diagonal chamfer nodes at intersections
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.22)';
  ctx.lineWidth = 1.5;
  for (let x = step; x < size; x += step * 2) {
    for (let y = step; y < size; y += step * 2) {
      ctx.beginPath();
      ctx.moveTo(x, y - 10);
      ctx.lineTo(x + 10, y);
      ctx.lineTo(x, y + 10);
      ctx.lineTo(x - 10, y);
      ctx.closePath();
      ctx.stroke();
    }
  }

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bctx = bumpCanvas.getContext('2d')!;
  bctx.fillStyle = '#808080';
  bctx.fillRect(0, 0, size, size);
  bctx.strokeStyle = '#555555';
  bctx.lineWidth = 3;
  for (let x = 0; x <= size; x += step) {
    bctx.beginPath();
    bctx.moveTo(x, 0);
    bctx.lineTo(x, size);
    bctx.stroke();
  }
  for (let y = 0; y <= size; y += step) {
    bctx.beginPath();
    bctx.moveTo(0, y);
    bctx.lineTo(size, y);
    bctx.stroke();
  }

  const albedo = new THREE.CanvasTexture(albedoCanvas);
  albedo.colorSpace = THREE.SRGBColorSpace;
  albedo.wrapS = THREE.RepeatWrapping;
  albedo.wrapT = THREE.RepeatWrapping;
  albedo.repeat.set(42, 42);
  albedo.anisotropy = maxAnisotropy;

  const bump = new THREE.CanvasTexture(bumpCanvas);
  bump.wrapS = THREE.RepeatWrapping;
  bump.wrapT = THREE.RepeatWrapping;
  bump.repeat.set(42, 42);
  bump.anisotropy = maxAnisotropy;

  return { albedo, bump };
}

function createSkyDome(): THREE.Mesh {
  const geo = new THREE.SphereGeometry(285, 32, 20);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const zenith = new THREE.Color('#040814');
  const midSky = new THREE.Color('#0B1B38');
  const horizon = new THREE.Color('#13335C');
  const tmp = new THREE.Color();

  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const t = THREE.MathUtils.clamp((y + 30) / 260, 0, 1);
    if (t < 0.32) {
      tmp.copy(horizon).lerp(midSky, t / 0.32);
    } else {
      tmp.copy(midSky).lerp(zenith, (t - 0.32) / 0.68);
    }
    colors[i * 3] = tmp.r;
    colors[i * 3 + 1] = tmp.g;
    colors[i * 3 + 2] = tmp.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const mat = new THREE.MeshBasicMaterial({
    vertexColors: true,
    side: THREE.BackSide,
    fog: false,
    depthWrite: false,
  });
  return new THREE.Mesh(geo, mat);
}

function createDorsalCrestGeometry(): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(-0.55, 0);
  shape.lineTo(0.45, 0.05);
  shape.lineTo(0.1, 0.48);
  shape.lineTo(-0.72, 0.32);
  shape.closePath();
  return new THREE.ExtrudeGeometry(shape, {
    depth: 0.12,
    bevelEnabled: true,
    bevelSegments: 1,
    steps: 1,
    bevelSize: 0.03,
    bevelThickness: 0.03,
  });
}

function buildSerpentHeadRig(
  primaryHex: string,
  accentHex: string,
  shadowTex: THREE.Texture,
  crestGeo: THREE.BufferGeometry,
  castShadow: boolean,
): SerpentVisualRig {
  const group = new THREE.Group();

  const hullMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(primaryHex),
    metalness: 0.55,
    roughness: 0.28,
    emissive: new THREE.Color(primaryHex),
    emissiveIntensity: 0.22,
  });

  const accentMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(accentHex),
    metalness: 0.65,
    roughness: 0.22,
    emissive: new THREE.Color(accentHex),
    emissiveIntensity: 0.55,
  });

  const darkArmorMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#091224'),
    metalness: 0.72,
    roughness: 0.32,
  });

  // 1. Sculpted Snout Wedge (oriented along +X local forward)
  const snoutGeo = new THREE.ConeGeometry(0.76, 1.85, 6);
  snoutGeo.rotateZ(-Math.PI / 2);
  snoutGeo.scale(1, 0.68, 1.08);
  const snout = new THREE.Mesh(snoutGeo, hullMat);
  snout.position.set(0.22, 0.06, 0);
  snout.castShadow = castShadow;
  group.add(snout);

  // 2. Cranial Armor Crown Plate
  const crownGeo = new THREE.BoxGeometry(1.05, 0.42, 1.12);
  const crown = new THREE.Mesh(crownGeo, darkArmorMat);
  crown.position.set(-0.22, 0.16, 0);
  crown.castShadow = castShadow;
  group.add(crown);

  // 3. Swept Dorsal Sovereign Crest (ExtrudeGeometry)
  const crest = new THREE.Mesh(crestGeo, accentMat);
  crest.position.set(-0.08, 0.3, -0.06);
  group.add(crest);

  // 4 & 5. Twin Angled Optic Visors
  const eyeGeo = new THREE.BoxGeometry(0.42, 0.14, 0.18);
  const eyeMat = new THREE.MeshStandardMaterial({
    color: '#FFFBEB',
    emissive: new THREE.Color(accentHex),
    emissiveIntensity: 1.4,
    roughness: 0.15,
  });
  const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
  leftEye.position.set(0.36, 0.22, -0.44);
  leftEye.rotation.y = 0.28;
  const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
  rightEye.position.set(0.36, 0.22, 0.44);
  rightEye.rotation.y = -0.28;
  group.add(leftEye, rightEye);

  // 6 & 7. Forward Mandible Fangs
  const fangGeo = new THREE.ConeGeometry(0.12, 0.58, 4);
  fangGeo.rotateZ(-Math.PI / 2);
  const leftFang = new THREE.Mesh(fangGeo, accentMat);
  leftFang.position.set(0.92, -0.08, -0.28);
  leftFang.rotation.y = -0.18;
  const rightFang = new THREE.Mesh(fangGeo, accentMat);
  rightFang.position.set(0.92, -0.08, 0.28);
  rightFang.rotation.y = 0.18;
  group.add(leftFang, rightFang);

  // 8 & 9. Swept Lateral Gill Fins
  const finGeo = new THREE.ConeGeometry(0.22, 0.85, 4);
  finGeo.rotateZ(Math.PI / 2);
  const leftFin = new THREE.Mesh(finGeo, hullMat);
  leftFin.position.set(-0.42, 0.05, -0.66);
  leftFin.rotation.y = 0.48;
  const rightFin = new THREE.Mesh(finGeo, hullMat);
  rightFin.position.set(-0.42, 0.05, 0.66);
  rightFin.rotation.y = -0.48;
  group.add(leftFin, rightFin);

  // Exposed Prismatic Core Gem
  const coreGeo = new THREE.OctahedronGeometry(0.26, 0);
  const coreMesh = new THREE.Mesh(coreGeo, accentMat);
  coreMesh.position.set(-0.24, 0.46, 0);
  group.add(coreMesh);

  // Charge Windup Telegraph Ring (visible when NPC winds up an Interceptor/Pack-Hunter boost)
  const teleGeo = new THREE.RingGeometry(0.95, 1.22, 24);
  teleGeo.rotateX(-Math.PI / 2);
  const teleMat = new THREE.MeshBasicMaterial({
    color: '#F43F5E',
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0,
  });
  const telegraphRing = new THREE.Mesh(teleGeo, teleMat);
  telegraphRing.position.set(0, -0.35, 0);
  group.add(telegraphRing);

  // Ground Contact Shadow Disc
  const shadowGeo = new THREE.PlaneGeometry(2.3, 2.3);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    depthWrite: false,
  });
  const shadowDisc = new THREE.Mesh(shadowGeo, shadowMat);
  shadowDisc.position.set(0, -0.45, 0);
  group.add(shadowDisc);

  return { group, coreMesh, telegraphRing, shadowDisc, hullMat, accentMat };
}

function buildSpecialRelicRig(kind: PickupKind): RelicVisualRig {
  const group = new THREE.Group();
  const innerRotor = new THREE.Group();
  group.add(innerRotor);

  const colorMap: Record<PickupKind, string> = {
    'energy-orb': '#22D3EE',
    'hyper-core': '#F59E0B',
    'magnet-prism': '#38BDF8',
    'phase-cloak': '#A78BFA',
    'chrono-shard': '#34D399',
    'apex-crown': '#FBBF24',
  };
  const hex = colorMap[kind];

  const primaryMat = new THREE.MeshStandardMaterial({
    color: hex,
    emissive: new THREE.Color(hex),
    emissiveIntensity: 0.85,
    metalness: 0.65,
    roughness: 0.18,
  });

  const trimMat = new THREE.MeshStandardMaterial({
    color: '#F8FAFC',
    emissive: new THREE.Color(hex),
    emissiveIntensity: 0.35,
    metalness: 0.8,
    roughness: 0.2,
  });

  if (kind === 'apex-crown') {
    const crownBase = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.58, 0.42, 6), primaryMat);
    innerRotor.add(crownBase);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.62, 4), trimMat);
      spike.position.set(Math.cos(a) * 0.6, 0.45, Math.sin(a) * 0.6);
      innerRotor.add(spike);
    }
    const centerStar = new THREE.Mesh(new THREE.OctahedronGeometry(0.38, 0), trimMat);
    centerStar.position.y = 0.55;
    innerRotor.add(centerStar);
  } else if (kind === 'hyper-core') {
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.58, 0), primaryMat);
    const gyroA = new THREE.Mesh(new THREE.TorusGeometry(0.82, 0.07, 8, 24), trimMat);
    gyroA.rotation.x = Math.PI / 3;
    const gyroB = new THREE.Mesh(new THREE.TorusGeometry(0.82, 0.07, 8, 24), primaryMat);
    gyroB.rotation.y = Math.PI / 3;
    innerRotor.add(core, gyroA, gyroB);
  } else if (kind === 'magnet-prism') {
    const diamond = new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 0), primaryMat);
    const arch = new THREE.Mesh(new THREE.TorusGeometry(0.76, 0.1, 8, 20, Math.PI), trimMat);
    arch.rotation.z = Math.PI;
    innerRotor.add(diamond, arch);
  } else if (kind === 'phase-cloak') {
    const gem = new THREE.Mesh(new THREE.IcosahedronGeometry(0.62, 0), primaryMat);
    const shellMat = new THREE.MeshPhysicalMaterial({
      color: '#DDD6FE',
      transmission: 0.55,
      transparent: true,
      opacity: 0.55,
      roughness: 0.12,
      metalness: 0.1,
    });
    const shell = new THREE.Mesh(new THREE.OctahedronGeometry(0.92, 0), shellMat);
    innerRotor.add(gem, shell);
  } else {
    // chrono-shard
    const topPyr = new THREE.Mesh(new THREE.ConeGeometry(0.52, 0.72, 4), primaryMat);
    topPyr.position.y = 0.36;
    topPyr.rotation.x = Math.PI;
    const botPyr = new THREE.Mesh(new THREE.ConeGeometry(0.52, 0.72, 4), trimMat);
    botPyr.position.y = -0.36;
    innerRotor.add(topPyr, botPyr);
  }

  const outerRingGeo = new THREE.RingGeometry(1.15, 1.35, 28);
  outerRingGeo.rotateX(-Math.PI / 2);
  const outerRing = new THREE.Mesh(
    outerRingGeo,
    new THREE.MeshBasicMaterial({
      color: hex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.55,
    }),
  );
  outerRing.position.y = -0.82;
  group.add(outerRing);

  // Subtle vertical sky beacon so special objects read across the arena & open world
  const beamGeo = new THREE.CylinderGeometry(0.08, 0.32, 9.5, 8, 1, true);
  const beaconBeam = new THREE.Mesh(
    beamGeo,
    new THREE.MeshBasicMaterial({
      color: hex,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  beaconBeam.position.y = 4.2;
  group.add(beaconBeam);

  return { group, innerRotor, outerRing, beaconBeam };
}

function buildMonolithShrineRig(accentHex: string, castShadow: boolean): ShrineVisualRig {
  const group = new THREE.Group();

  const stoneMat = new THREE.MeshStandardMaterial({
    color: '#0D172A',
    metalness: 0.52,
    roughness: 0.46,
  });

  const crystalMat = new THREE.MeshStandardMaterial({
    color: accentHex,
    emissive: new THREE.Color(accentHex),
    emissiveIntensity: 0.45,
    metalness: 0.4,
    roughness: 0.16,
  });

  // Stepped hexagonal plinth
  const baseA = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.9, 0.7, 6), stoneMat);
  baseA.position.y = 0.35;
  baseA.receiveShadow = castShadow;
  const baseB = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.8, 0.65, 6), stoneMat);
  baseB.position.y = 1.0;
  group.add(baseA, baseB);

  // Four canted obelisk buttresses
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.68, 6.8, 0.68), stoneMat);
    pillar.position.set(Math.cos(a) * 2.1, 4.1, Math.sin(a) * 2.1);
    pillar.rotation.z = Math.cos(a) * 0.08;
    pillar.rotation.x = -Math.sin(a) * 0.08;
    pillar.castShadow = castShadow;
    group.add(pillar);
  }

  // Central levitating Prism Crystal
  const crystalGeo = new THREE.OctahedronGeometry(1.45, 0);
  crystalGeo.scale(0.85, 2.25, 0.85);
  const crystalMesh = new THREE.Mesh(crystalGeo, crystalMat);
  crystalMesh.position.y = 6.2;
  crystalMesh.castShadow = castShadow;
  group.add(crystalMesh);

  // Orbiting resonance halo
  const haloRing = new THREE.Mesh(
    new THREE.TorusGeometry(2.2, 0.09, 10, 32),
    new THREE.MeshBasicMaterial({ color: accentHex }),
  );
  haloRing.position.y = 6.2;
  haloRing.rotation.x = Math.PI / 2.4;
  group.add(haloRing);

  // Ground attunement boundary ring
  const progressGeo = new THREE.RingGeometry(6.8, 7.35, 40);
  progressGeo.rotateX(-Math.PI / 2);
  const progressArc = new THREE.Mesh(
    progressGeo,
    new THREE.MeshBasicMaterial({
      color: accentHex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35,
    }),
  );
  progressArc.position.y = 0.12;
  group.add(progressArc);

  return { group, crystalMesh, haloRing, progressArc, crystalMat };
}

export function buildSerpentScene(
  renderer: THREE.WebGLRenderer,
  initialWorld: PrismWorldState,
  isSoftwareGl: boolean,
): SerpentSceneController {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#0B1E3B');
  scene.fog = new THREE.FogExp2('#0B1E3B', 0.0092);

  const camera = new THREE.PerspectiveCamera(56, 16 / 9, 0.25, 320);
  camera.position.set(0, 12, 28);

  // Procedural PBR studio/sky environment reflections on every GPU/SwiftShader target
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  scene.environmentIntensity = 0.85;
  pmrem.dispose();

  // Sky dome
  const skyDome = createSkyDome();
  scene.add(skyDome);

  // Warm-vs-Cool 3-point spatial lighting
  const hemiLight = new THREE.HemisphereLight('#38BDF8', '#091326', 0.92);
  scene.add(hemiLight);

  const sunLight = new THREE.DirectionalLight('#FFF1DC', 2.25);
  sunLight.position.set(42, 74, 34);
  if (!isSoftwareGl) {
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(1024, 1024);
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 210;
    const d = 75;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0005;
  }
  scene.add(sunLight);

  const rimLight = new THREE.DirectionalLight('#22D3EE', 0.78);
  rimLight.position.set(-55, 32, -48);
  scene.add(rimLight);

  // Continuous displaced terrain with biome vertex tinting + procedural hex circuit textures
  const maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const { albedo: groundAlbedo, bump: groundBump } = createHexCircuitTextures(maxAniso);

  const terrainSegs = isSoftwareGl ? 48 : 104;
  const terrainGeo = new THREE.PlaneGeometry(310, 310, terrainSegs, terrainSegs);
  terrainGeo.rotateX(-Math.PI / 2);
  const tPos = terrainGeo.attributes.position;
  const tColors = new Float32Array(tPos.count * 3);
  const cTmp = new THREE.Color();

  for (let i = 0; i < tPos.count; i++) {
    const vx = tPos.getX(i);
    const vz = tPos.getZ(i);
    const vy = groundHeightAt(vx, vz);
    tPos.setY(i, vy);

    const biome = classifyBiomeAtPosition(vx, vz);
    if (biome.id === 'nexus-bowl') cTmp.set('#89C4E1');
    else if (biome.id === 'cobalt-dunes') cTmp.set('#7BB8F5');
    else if (biome.id === 'crystalline-spire') cTmp.set('#B497F7');
    else if (biome.id === 'solaris-rift') cTmp.set('#F2B26B');
    else cTmp.set('#77D9BD');

    tColors[i * 3] = cTmp.r;
    tColors[i * 3 + 1] = cTmp.g;
    tColors[i * 3 + 2] = cTmp.b;
  }
  terrainGeo.setAttribute('color', new THREE.BufferAttribute(tColors, 3));
  terrainGeo.computeVertexNormals();

  const terrainMat = new THREE.MeshStandardMaterial({
    map: groundAlbedo,
    bumpMap: isSoftwareGl ? null : groundBump,
    bumpScale: 0.18,
    vertexColors: true,
    roughness: 0.72,
    metalness: 0.22,
  });
  const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
  terrainMesh.receiveShadow = !isSoftwareGl;
  scene.add(terrainMesh);

  // Natural perimeter jagged basalt crags + outer mountain ridge + glowing crystal spires
  const cliffCount = 96;
  const cliffGeo = new THREE.ConeGeometry(5.6, 21, 5);
  const cliffMat = new THREE.MeshStandardMaterial({
    color: '#0A162B',
    roughness: 0.78,
    metalness: 0.25,
    flatShading: true,
  });
  const cliffInstanced = new THREE.InstancedMesh(cliffGeo, cliffMat, cliffCount);
  cliffInstanced.frustumCulled = false;
  scene.add(cliffInstanced);

  const crystalSpireGeo = new THREE.ConeGeometry(1.15, 10.5, 5);
  const crystalSpireMat = new THREE.MeshStandardMaterial({
    color: '#FFFFFF',
    emissive: '#0891B2',
    emissiveIntensity: 0.35,
    roughness: 0.2,
    metalness: 0.45,
    flatShading: true,
  });
  const crystalSpireInstanced = new THREE.InstancedMesh(
    crystalSpireGeo,
    crystalSpireMat,
    cliffCount,
  );
  crystalSpireInstanced.frustumCulled = false;
  scene.add(crystalSpireInstanced);

  let configuredRadius = -1;
  const dummy = new THREE.Object3D();
  const colorScratch = new THREE.Color();

  function syncPerimeterCliffs(radius: number) {
    if (configuredRadius === radius) return;
    configuredRadius = radius;
    for (let i = 0; i < cliffCount; i++) {
      const isOuter = i >= 64;
      const ringIndex = isOuter ? i - 64 : i;
      const ringTotal = isOuter ? 32 : 64;
      const a = (ringIndex / ringTotal) * Math.PI * 2 + (isOuter ? 0.05 : 0);
      const r = isOuter
        ? radius + 16 + (ringIndex % 3) * 4
        : radius + 5.2 + (ringIndex % 3) * 1.8;
      const cx = Math.cos(a) * r;
      const cz = Math.sin(a) * r;
      const cy = groundHeightAt(cx, cz);
      const hScale = isOuter
        ? 1.25 + ((ringIndex * 29) % 8) * 0.14
        : 0.72 + ((ringIndex * 37) % 9) * 0.09;

      dummy.position.set(cx, cy + 7.2 * hScale, cz);
      dummy.rotation.set(
        Math.sin(a * 3) * 0.12,
        a * 1.7,
        Math.cos(a * 2) * 0.12,
      );
      dummy.scale.set(
        (isOuter ? 1.8 : 1.15) + (i % 2) * 0.35,
        hScale,
        (isOuter ? 1.7 : 1.1) + ((i + 1) % 2) * 0.3,
      );
      dummy.updateMatrix();
      cliffInstanced.setMatrixAt(i, dummy.matrix);

      // Crystal spire accent along inner perimeter rim
      if (!isOuter && i % 2 === 0) {
        const sx = Math.cos(a + 0.018) * (radius + 1.9);
        const sz = Math.sin(a + 0.018) * (radius + 1.9);
        const sy = groundHeightAt(sx, sz);
        dummy.position.set(sx, sy + 3.6, sz);
        dummy.rotation.set(0.08, a * 2, ((i % 3) - 1) * 0.16);
        dummy.scale.set(0.95, 0.72 + (i % 4) * 0.16, 0.95);
      } else {
        dummy.position.set(0, -100, 0);
        dummy.scale.setScalar(0.001);
      }
      dummy.updateMatrix();
      crystalSpireInstanced.setMatrixAt(i, dummy.matrix);

      const biome = classifyBiomeAtPosition(cx, cz);
      colorScratch.set(biome.accentHex);
      crystalSpireInstanced.setColorAt(i, colorScratch);
    }
    cliffInstanced.instanceMatrix.needsUpdate = true;
    crystalSpireInstanced.instanceMatrix.needsUpdate = true;
    if (crystalSpireInstanced.instanceColor) {
      crystalSpireInstanced.instanceColor.needsUpdate = true;
    }
  }

  // Speed Chevron Pads Group
  const speedPadGroup = new THREE.Group();
  scene.add(speedPadGroup);
  let speedPadsRadius = -1;
  function syncSpeedPads(world: PrismWorldState) {
    if (speedPadsRadius === world.worldRadius) return;
    speedPadsRadius = world.worldRadius;
    while (speedPadGroup.children.length > 0) {
      speedPadGroup.remove(speedPadGroup.children[0]);
    }
    const padRingGeo = new THREE.RingGeometry(2.6, 3.4, 6);
    padRingGeo.rotateX(-Math.PI / 2);
    const padMat = new THREE.MeshBasicMaterial({
      color: '#22D3EE',
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.52,
    });
    const innerPadMat = new THREE.MeshBasicMaterial({
      color: '#F59E0B',
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.65,
    });
    const chevronGeo = new THREE.RingGeometry(1.1, 1.7, 3);
    chevronGeo.rotateX(-Math.PI / 2);

    for (const pad of world.speedPads) {
      const g = new THREE.Group();
      g.position.set(pad.x, pad.y, pad.z);
      g.rotation.y = pad.yaw;
      g.add(new THREE.Mesh(padRingGeo, padMat));
      g.add(new THREE.Mesh(chevronGeo, innerPadMat));
      speedPadGroup.add(g);
    }
  }

  // Serpent Heads (1 Player + 8 Rivals)
  const shadowTex = createRadialShadowTexture();
  const crestGeo = createDorsalCrestGeometry();

  const playerRig = buildSerpentHeadRig(
    initialWorld.player.primaryHex,
    initialWorld.player.accentHex,
    shadowTex,
    crestGeo,
    !isSoftwareGl,
  );
  scene.add(playerRig.group);

  const rivalRigs = new Map<string, SerpentVisualRig>();
  for (const r of initialWorld.rivals) {
    const rig = buildSerpentHeadRig(
      r.primaryHex,
      r.accentHex,
      shadowTex,
      crestGeo,
      !isSoftwareGl,
    );
    scene.add(rig.group);
    rivalRigs.set(r.id, rig);
  }

  // Instanced Body Armor Coils & Dorsal Spine Fins (Zero-GC per frame)
  const maxBodySegments = 1550;
  const segGeo = new THREE.IcosahedronGeometry(0.54, 1);
  segGeo.scale(1.18, 0.82, 0.96);
  const segMat = new THREE.MeshStandardMaterial({
    color: '#FFFFFF',
    roughness: 0.28,
    metalness: 0.52,
  });
  const bodyInstanced = new THREE.InstancedMesh(segGeo, segMat, maxBodySegments);
  bodyInstanced.frustumCulled = false;
  bodyInstanced.castShadow = !isSoftwareGl;
  scene.add(bodyInstanced);

  const dorsalFinGeo = new THREE.ConeGeometry(0.18, 0.48, 4);
  const dorsalFinMat = new THREE.MeshStandardMaterial({
    color: '#FFFFFF',
    emissive: '#22D3EE',
    emissiveIntensity: 0.35,
    roughness: 0.25,
    metalness: 0.6,
  });
  const finInstanced = new THREE.InstancedMesh(dorsalFinGeo, dorsalFinMat, maxBodySegments);
  finInstanced.frustumCulled = false;
  scene.add(finInstanced);

  // Instanced Radiant Energy Orbs (vivid per-instance color preserved without uniform emissive washout)
  const maxOrbs = 300;
  const orbGeo = new THREE.OctahedronGeometry(0.46, 1);
  const orbMat = new THREE.MeshStandardMaterial({
    color: '#FFFFFF',
    emissive: '#111827',
    emissiveIntensity: 0.25,
    roughness: 0.14,
    metalness: 0.12,
  });
  const orbInstanced = new THREE.InstancedMesh(orbGeo, orbMat, maxOrbs);
  orbInstanced.frustumCulled = false;
  scene.add(orbInstanced);

  // Special Relic Rigs Pool
  const relicRigs: RelicVisualRig[] = [];
  function ensureRelicRigs(world: PrismWorldState) {
    while (relicRigs.length < world.relics.length) {
      const idx = relicRigs.length;
      const rig = buildSpecialRelicRig(world.relics[idx].kind);
      scene.add(rig.group);
      relicRigs.push(rig);
    }
    for (let i = 0; i < relicRigs.length; i++) {
      if (i >= world.relics.length) {
        relicRigs[i].group.visible = false;
      }
    }
  }

  // Monolith Shrines Pool (5 Frontier Shrines)
  const shrineRigs: ShrineVisualRig[] = initialWorld.shrines.map((s) => {
    const rig = buildMonolithShrineRig(s.accentHex, !isSoftwareGl);
    rig.group.position.set(s.x, s.y, s.z);
    scene.add(rig.group);
    return rig;
  });

  // Expanding Shockwave Rings Pool
  const shockwaveMeshes: THREE.Mesh[] = [];
  const swGeo = new THREE.RingGeometry(0.82, 1.0, 40);
  swGeo.rotateX(-Math.PI / 2);
  for (let i = 0; i < 6; i++) {
    const m = new THREE.Mesh(
      swGeo,
      new THREE.MeshBasicMaterial({
        color: '#FBBF24',
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0,
      }),
    );
    m.visible = false;
    scene.add(m);
    shockwaveMeshes.push(m);
  }

  // Pre-allocated Zero-GC Particle Burst Pool
  const maxParticles = 280;
  const particleSlots: ParticleSlot[] = Array.from({ length: maxParticles }, () => ({
    active: false,
    x: 0,
    y: 0,
    z: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    life: 0,
    maxLife: 0.6,
    scale: 1,
    color: new THREE.Color('#22D3EE'),
  }));
  const partGeo = new THREE.OctahedronGeometry(0.22, 0);
  const partMat = new THREE.MeshBasicMaterial({ color: '#FFFFFF' });
  const partInstanced = new THREE.InstancedMesh(partGeo, partMat, maxParticles);
  partInstanced.frustumCulled = false;
  scene.add(partInstanced);

  let particleCursor = 0;
  function spawnBurst(x: number, y: number, z: number, colorHex: string, count = 14) {
    for (let i = 0; i < count; i++) {
      const slot = particleSlots[particleCursor];
      particleCursor = (particleCursor + 1) % maxParticles;
      const ang = (i / count) * Math.PI * 2 + Math.random() * 0.4;
      const spd = 3.5 + Math.random() * 8.5;
      slot.active = true;
      slot.x = x;
      slot.y = y + 0.3;
      slot.z = z;
      slot.vx = Math.cos(ang) * spd;
      slot.vy = 2.8 + Math.random() * 5.2;
      slot.vz = Math.sin(ang) * spd;
      slot.life = 0;
      slot.maxLife = 0.38 + Math.random() * 0.28;
      slot.scale = 0.8 + Math.random() * 0.7;
      slot.color.set(colorHex);
    }
  }

  const baseColor = new THREE.Color();
  const tipColor = new THREE.Color();

  function updateFromWorld(world: PrismWorldState, dt: number, elapsedSec: number) {
    syncPerimeterCliffs(world.worldRadius);
    syncSpeedPads(world);
    ensureRelicRigs(world);

    // Update Player Head Rig (always visible; invulnerability pulses cyan shield ring + emissive sheen)
    const p = world.player;
    playerRig.group.visible = true;
    playerRig.group.position.set(p.x, p.y, p.z);
    playerRig.group.rotation.y = -p.heading;
    playerRig.coreMesh.rotation.y = elapsedSec * 3.4;

    const playerShieldMat = playerRig.telegraphRing.material as THREE.MeshBasicMaterial;
    if (p.invulnerableMs > 0 || p.phaseCloakMs > 0) {
      playerShieldMat.color.set(p.phaseCloakMs > 0 ? '#A78BFA' : '#22D3EE');
      playerShieldMat.opacity = 0.42 + Math.sin(elapsedSec * 16) * 0.22;
    } else {
      playerShieldMat.opacity = 0;
    }

    if (p.phaseCloakMs > 0) {
      playerRig.hullMat.color.set('#A78BFA');
      playerRig.hullMat.emissive.set('#7C3AED');
      playerRig.hullMat.emissiveIntensity = 0.48;
    } else if (p.hyperCoreMs > 0) {
      playerRig.hullMat.color.set('#F59E0B');
      playerRig.hullMat.emissive.set('#D97706');
      playerRig.hullMat.emissiveIntensity = 0.55;
    } else {
      playerRig.hullMat.color.set(p.primaryHex);
      playerRig.hullMat.emissive.set(p.primaryHex);
      playerRig.hullMat.emissiveIntensity =
        p.invulnerableMs > 0 ? 0.38 + Math.sin(elapsedSec * 18) * 0.18 : 0.24;
    }

    // Update Rival Head Rigs
    for (const r of world.rivals) {
      const rig = rivalRigs.get(r.id);
      if (!rig) continue;
      if (!r.alive && r.dissolveProgress >= 1) {
        rig.group.visible = false;
        continue;
      }
      rig.group.visible = true;
      const liftY = !r.alive ? r.dissolveProgress * 2.8 : 0;
      const shrink = !r.alive ? Math.max(0.01, 1 - r.dissolveProgress) : 1;
      rig.group.position.set(r.x, r.y + liftY, r.z);
      rig.group.rotation.y = -r.heading;
      rig.group.scale.setScalar(
        (r.archetype === 'leviathan' ? 1.24 : 1.0) * shrink,
      );
      rig.coreMesh.rotation.y = elapsedSec * 3.0;

      const teleMat = rig.telegraphRing.material as THREE.MeshBasicMaterial;
      if (r.windupMs > 0 && r.alive) {
        teleMat.opacity = 0.55 + Math.sin(elapsedSec * 28) * 0.35;
        rig.telegraphRing.scale.setScalar(1 + Math.sin(elapsedSec * 20) * 0.15);
      } else {
        teleMat.opacity = 0;
      }
    }

    // Pack all Serpent Body Segments into InstancedMesh
    let segIdx = 0;
    const allSerpents = [p, ...world.rivals];
    for (const s of allSerpents) {
      if (!s.alive && s.dissolveProgress >= 1) continue;
      baseColor.set(
        s.isPlayer && s.phaseCloakMs > 0
          ? '#A78BFA'
          : s.isPlayer && s.hyperCoreMs > 0
            ? '#FBBF24'
            : s.primaryHex,
      );
      tipColor.set(s.accentHex);

      const len = s.segments.length;
      const leviathanScale = !s.isPlayer && s.archetype === 'leviathan' ? 1.22 : 1.0;

      for (let i = 0; i < len && segIdx < maxBodySegments; i++) {
        const seg = s.segments[i];
        const t = i / Math.max(1, len - 1);
        const taper = (1 - t * 0.54) * leviathanScale;
        const koScatter = !s.alive ? s.dissolveProgress : 0;

        dummy.position.set(
          seg.x + Math.sin(i * 1.9) * koScatter * 1.6,
          seg.y + koScatter * (1.8 + (i % 3) * 0.6),
          seg.z + Math.cos(i * 2.3) * koScatter * 1.6,
        );
        dummy.rotation.set(0, -seg.yaw, 0);
        const finalScale = Math.max(0.02, taper * (1 - koScatter));
        dummy.scale.setScalar(finalScale);
        dummy.updateMatrix();
        bodyInstanced.setMatrixAt(segIdx, dummy.matrix);

        colorScratch.copy(baseColor).lerp(tipColor, t * 0.72);
        if (s.isOverdrive) {
          colorScratch.offsetHSL(0, 0.08, 0.12);
        }
        bodyInstanced.setColorAt(segIdx, colorScratch);

        // Dorsal ridge fin on every second segment
        if (i % 2 === 0 && koScatter < 0.8) {
          dummy.position.y += 0.42 * finalScale;
          dummy.rotation.set(0, -seg.yaw, -0.22);
          dummy.scale.setScalar(finalScale);
        } else {
          dummy.position.set(0, -120, 0);
          dummy.scale.setScalar(0.001);
        }
        dummy.updateMatrix();
        finInstanced.setMatrixAt(segIdx, dummy.matrix);
        finInstanced.setColorAt(segIdx, tipColor);

        segIdx++;
      }
    }

    bodyInstanced.count = segIdx;
    finInstanced.count = segIdx;
    bodyInstanced.instanceMatrix.needsUpdate = true;
    finInstanced.instanceMatrix.needsUpdate = true;
    if (bodyInstanced.instanceColor) bodyInstanced.instanceColor.needsUpdate = true;
    if (finInstanced.instanceColor) finInstanced.instanceColor.needsUpdate = true;

    // Update Orbs InstancedMesh (pack only active orbs)
    let orbWriteIdx = 0;
    for (let i = 0; i < world.orbs.length && orbWriteIdx < maxOrbs; i++) {
      const orb = world.orbs[i];
      if (!orb || !orb.active) continue;
      const bob = Math.sin(orb.phase + elapsedSec * 2.5) * 0.14;
      const tierScale = orb.isLoot ? 1.38 : 0.82 + orb.tier * 0.25;
      dummy.position.set(orb.x, orb.y + bob, orb.z);
      dummy.rotation.set(elapsedSec * 1.4, orb.phase, 0);
      dummy.scale.setScalar(tierScale);
      dummy.updateMatrix();
      orbInstanced.setMatrixAt(orbWriteIdx, dummy.matrix);
      colorScratch.set(orb.colorHex);
      orbInstanced.setColorAt(orbWriteIdx, colorScratch);
      orbWriteIdx++;
    }
    orbInstanced.count = orbWriteIdx;
    orbInstanced.instanceMatrix.needsUpdate = true;
    if (orbInstanced.instanceColor) orbInstanced.instanceColor.needsUpdate = true;

    // Update Special Relic Rigs
    for (let i = 0; i < world.relics.length; i++) {
      const rel = world.relics[i];
      const rig = relicRigs[i];
      if (!rig) continue;
      rig.group.visible = rel.active;
      if (rel.active) {
        const bob = Math.sin(elapsedSec * 2.8 + i) * 0.22;
        rig.group.position.set(rel.x, rel.y + bob, rel.z);
        rig.innerRotor.rotation.y = rel.spinAngle;
        rig.innerRotor.rotation.x = Math.sin(elapsedSec * 1.6 + i) * 0.22;
        rig.outerRing.position.y = -0.82 - bob;
      }
    }

    // Update Monolith Shrines
    for (let i = 0; i < shrineRigs.length; i++) {
      const shrine = world.shrines[i];
      const rig = shrineRigs[i];
      const visible = world.mode === 'open-world' || i === 0;
      rig.group.visible = visible;
      if (!visible) continue;

      rig.crystalMesh.rotation.y = elapsedSec * (shrine.attuned ? 1.8 : 0.55);
      rig.crystalMesh.position.y = 6.2 + Math.sin(elapsedSec * 2.0 + i) * 0.35;
      rig.haloRing.rotation.z = elapsedSec * 1.2;
      rig.crystalMat.emissiveIntensity = shrine.attuned
        ? 1.25
        : 0.35 + shrine.attuneProgress * 0.75;

      const arcMat = rig.progressArc.material as THREE.MeshBasicMaterial;
      arcMat.opacity = shrine.attuned ? 0.75 : 0.24 + shrine.attuneProgress * 0.55;
      rig.progressArc.scale.setScalar(
        shrine.attuned ? 1.0 : 0.92 + Math.sin(elapsedSec * 4) * 0.03,
      );
    }

    // Update Shockwave Rings
    for (let i = 0; i < shockwaveMeshes.length; i++) {
      const sw = world.shockwaves[i];
      const mesh = shockwaveMeshes[i];
      if (sw) {
        mesh.visible = true;
        mesh.position.set(sw.x, sw.y + 0.15, sw.z);
        mesh.scale.setScalar(sw.radius);
        const m = mesh.material as THREE.MeshBasicMaterial;
        m.color.set(sw.colorHex);
        m.opacity = sw.alpha * 0.82;
      } else {
        mesh.visible = false;
      }
    }

    // Step Zero-GC Particle Burst Pool (pack active particles)
    let activePartCount = 0;
    for (let i = 0; i < maxParticles; i++) {
      const slot = particleSlots[i];
      if (!slot.active) continue;
      slot.life += dt;
      if (slot.life >= slot.maxLife) {
        slot.active = false;
        continue;
      }
      slot.x += slot.vx * dt;
      slot.y += slot.vy * dt;
      slot.z += slot.vz * dt;
      slot.vy -= 12.5 * dt;
      const remain = 1 - slot.life / slot.maxLife;
      dummy.position.set(slot.x, slot.y, slot.z);
      dummy.rotation.set(slot.life * 6, slot.life * 4, 0);
      dummy.scale.setScalar(slot.scale * remain);
      dummy.updateMatrix();
      partInstanced.setMatrixAt(activePartCount, dummy.matrix);
      partInstanced.setColorAt(activePartCount, slot.color);
      activePartCount++;
    }
    partInstanced.count = activePartCount;
    if (activePartCount > 0) {
      partInstanced.instanceMatrix.needsUpdate = true;
      if (partInstanced.instanceColor) partInstanced.instanceColor.needsUpdate = true;
    }

    // Keep sun shadow frustum centered near player
    sunLight.target.position.set(p.x, 0, p.z);
    sunLight.target.updateMatrixWorld();
    sunLight.position.set(p.x + 42, 74, p.z + 34);
    skyDome.position.set(p.x, 0, p.z);
  }

  function dispose() {
    envTex.dispose();
    groundAlbedo.dispose();
    groundBump.dispose();
    shadowTex.dispose();
    terrainGeo.dispose();
    terrainMat.dispose();
    cliffGeo.dispose();
    cliffMat.dispose();
    crystalSpireGeo.dispose();
    crystalSpireMat.dispose();
    crestGeo.dispose();
    segGeo.dispose();
    segMat.dispose();
    dorsalFinGeo.dispose();
    dorsalFinMat.dispose();
    orbGeo.dispose();
    orbMat.dispose();
    partGeo.dispose();
    partMat.dispose();
  }

  return {
    scene,
    camera,
    updateFromWorld,
    spawnBurst,
    dispose,
  };
}
