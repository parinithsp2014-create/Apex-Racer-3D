import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { CarModelId, CameraMode, GameTelemetry, NearMissEvent, ThemeId } from '../types/game';
import { THEMES } from './themes';
import {
  CarRig,
  buildPlayerCar,
  buildTrafficVehicle,
  buildPickupMesh,
  createPalmTree,
  createPineTree,
  createLampPost,
  createHighwayGantry,
  TrafficType,
} from './proceduralModels';
import { sound } from '../audio/soundEngine';

interface ActivePickup {
  mesh: THREE.Group;
  type: 'nitro' | 'coin' | 'shield' | 'magnet';
  z: number;
  x: number;
  active: boolean;
}

interface ActiveTraffic {
  rig: CarRig;
  lane: number;
  x: number;
  z: number;
  speed: number; // km/h
  type: TrafficType;
  passed: boolean;
  nearMissed: boolean;
  spinOut: boolean;
  spinVelocity: THREE.Vector3;
}

interface RoadChunk {
  group: THREE.Group;
  z: number;
}

export class RacingEngine {
  private container: HTMLDivElement;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private pmrem!: THREE.PMREMGenerator;

  private isSoftwareGl: boolean = false;
  private frameId: number = 0;
  private isDestroyed: boolean = false;

  // Game state
  public isRunning: boolean = false;
  public isPaused: boolean = false;

  // Selected player configuration
  public currentModel: CarModelId = 'supercar';
  public currentColor: number = 0xee1122;
  public currentTheme: ThemeId = 'sunset';
  public cameraMode: CameraMode = 'chase';

  // Player car rig
  private playerRig!: CarRig;
  private playerPos = new THREE.Vector3(0, 0, 0);
  private playerVel = new THREE.Vector3(0, 0, 0);
  private playerRoll = 0;
  private playerPitch = 0;
  private speedKmH = 0;
  private maxSpeedKmH = 220;
  private nitroAmount = 100;
  private isBoosting = false;
  private shieldTimer = 0;
  private magnetTimer = 0;
  private shieldMesh?: THREE.Mesh;

  // Stats
  private score = 0;
  private highScore = 0;
  private distanceMeters = 0;
  private coinsCount = 0;
  private nearMissCount = 0;
  private topSpeedRecorded = 0;
  private multiplier = 1;
  private multiplierTimer = 0;

  // Road & Environment
  private roadWidth = 18;
  private roadLength = 400;
  private roadChunks: RoadChunk[] = [];
  private roadLines: THREE.Mesh[] = [];
  private lampPosts: THREE.Group[] = [];
  private gantries: THREE.Group[] = [];
  private sceneryTrees: THREE.Group[] = [];
  private rainParticles?: THREE.Points;

  // Lights
  private sunLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;

  // Traffic & Pickups
  private traffic: ActiveTraffic[] = [];
  private pickups: ActivePickup[] = [];
  private trafficSpawnTimer = 0;
  private pickupSpawnTimer = 0;
  private lanes = [-6, -2, 2, 6];

  // Camera dynamics
  private cameraPosTarget = new THREE.Vector3(0, 5, 9);
  private cameraLookTarget = new THREE.Vector3(0, 1, -15);
  private cameraShake = 0;

  // Particles
  private nitroParticles!: THREE.Points;
  private nitroGeo!: THREE.BufferGeometry;
  private nitroPositions!: Float32Array;
  private nitroLifes!: Float32Array;

  // Controls input map
  public inputs = {
    up: false,
    down: false,
    left: false,
    right: false,
    nitro: false,
    brake: false,
  };

  // Callbacks
  public onTelemetryUpdate?: (telemetry: GameTelemetry) => void;
  public onNearMiss?: (event: NearMissEvent) => void;
  public onGameOver?: (telemetry: GameTelemetry) => void;

  private lastTime = 0;

  constructor(container: HTMLDivElement) {
    this.container = container;
    this.loadHighScore();
    this.detectSoftwareGl();
    this.initThree();
    this.initEnvironment();
    this.initRoad();
    this.initPlayer();
    this.initParticles();
    this.applyTheme(this.currentTheme);
    this.setupWindowResize();

    // Start background render loop (shows garage/preview until start)
    this.lastTime = performance.now();
    this.tick();
  }

  private loadHighScore() {
    try {
      const saved = localStorage.getItem('apex_racer_highscore');
      if (saved) this.highScore = parseInt(saved, 10) || 0;
    } catch {
      this.highScore = 0;
    }
  }

  private saveHighScore() {
    try {
      localStorage.setItem('apex_racer_highscore', Math.floor(this.highScore).toString());
    } catch {
      // ignore
    }
  }

  private detectSoftwareGl() {
    try {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) {
        this.isSoftwareGl = true;
        return;
      }
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      this.isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    } catch {
      this.isSoftwareGl = false;
    }
  }

  private initThree() {
    this.scene = new THREE.Scene();

    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(65, w / h, 0.2, 450);
    this.camera.position.set(0, 5, 9);
    this.camera.lookAt(0, 1, -15);

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true,
    });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    // Procedural Studio Environment for metal reflections
    this.pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = this.pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  }

  private initEnvironment() {
    this.hemiLight = new THREE.HemisphereLight(0xffeedd, 0x334455, 1.4);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xfff5ea, 2.8);
    this.sunLight.position.set(-30, 45, -50);
    if (!this.isSoftwareGl) {
      this.sunLight.castShadow = true;
      this.sunLight.shadow.mapSize.width = 1024;
      this.sunLight.shadow.mapSize.height = 1024;
      this.sunLight.shadow.camera.near = 10;
      this.sunLight.shadow.camera.far = 180;
      const d = 35;
      this.sunLight.shadow.camera.left = -d;
      this.sunLight.shadow.camera.right = d;
      this.sunLight.shadow.camera.top = d;
      this.sunLight.shadow.camera.bottom = -d;
      this.sunLight.shadow.bias = -0.0006;
      this.sunLight.shadow.normalBias = 0.02;
    }
    this.scene.add(this.sunLight);

    // Horizon matched Fog
    this.scene.fog = new THREE.Fog(0xd95a3f, 40, 260);
  }

  private initRoad() {
    const chunkCount = 4;
    const chunkLength = 100;

    for (let c = 0; c < chunkCount; c++) {
      const chunkGroup = new THREE.Group();
      const chunkZ = -c * chunkLength;
      chunkGroup.position.z = chunkZ;

      // Road asphalt surface
      const roadGeo = new THREE.PlaneGeometry(this.roadWidth, chunkLength);
      roadGeo.rotateX(-Math.PI / 2);
      const roadMat = new THREE.MeshStandardMaterial({
        color: 0x222225,
        roughness: 0.85,
        metalness: 0.15,
      });
      const road = new THREE.Mesh(roadGeo, roadMat);
      road.position.set(0, 0.02, 0);
      road.receiveShadow = true;
      chunkGroup.add(road);

      // Road shoulder rumble strips (red/white curbs)
      [-this.roadWidth / 2 - 0.3, this.roadWidth / 2 + 0.3].forEach(x => {
        const curbGeo = new THREE.BoxGeometry(0.6, 0.15, chunkLength);
        const curbMat = new THREE.MeshStandardMaterial({ color: 0xcc3333, roughness: 0.8 });
        const curb = new THREE.Mesh(curbGeo, curbMat);
        curb.position.set(x, 0.08, 0);
        curb.receiveShadow = true;
        chunkGroup.add(curb);
      });

      // Guard rails
      [-this.roadWidth / 2 - 1.2, this.roadWidth / 2 + 1.2].forEach(x => {
        const railGeo = new THREE.BoxGeometry(0.2, 0.6, chunkLength);
        const railMat = new THREE.MeshStandardMaterial({ color: 0x88929e, metalness: 0.8, roughness: 0.3 });
        const rail = new THREE.Mesh(railGeo, railMat);
        rail.position.set(x, 0.5, 0);
        rail.castShadow = true;
        chunkGroup.add(rail);
      });

      // Vast landscape ground plane (extends to horizon, never floating)
      const groundGeo = new THREE.PlaneGeometry(350, chunkLength);
      groundGeo.rotateX(-Math.PI / 2);
      const groundMat = new THREE.MeshStandardMaterial({
        color: 0x483226,
        roughness: 0.95,
      });
      const ground = new THREE.Mesh(groundGeo, groundMat);
      ground.position.set(0, -0.05, 0);
      ground.receiveShadow = true;
      chunkGroup.add(ground);

      // Road dashed lines (3 divider lines for 4 lanes: -4, 0, 4)
      [-4, 0, 4].forEach(x => {
        for (let l = -chunkLength / 2 + 3; l < chunkLength / 2; l += 9) {
          const dashGeo = new THREE.BoxGeometry(0.18, 0.02, 4.5);
          const dashMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
          const dash = new THREE.Mesh(dashGeo, dashMat);
          dash.position.set(x, 0.04, l);
          chunkGroup.add(dash);
          this.roadLines.push(dash);
        }
      });

      // Roadside street lamps
      const lampL = createLampPost();
      lampL.position.set(-this.roadWidth / 2 - 2.5, 0, -chunkLength / 4);
      lampL.rotation.y = Math.PI;
      chunkGroup.add(lampL);
      this.lampPosts.push(lampL);

      const lampR = createLampPost();
      lampR.position.set(this.roadWidth / 2 + 2.5, 0, chunkLength / 4);
      chunkGroup.add(lampR);
      this.lampPosts.push(lampR);

      // Scenery trees & rocks along side
      for (let t = -chunkLength / 2 + 8; t < chunkLength / 2; t += 22) {
        const treeL = c % 2 === 0 ? createPalmTree() : createPineTree();
        treeL.position.set(-this.roadWidth / 2 - 5 - Math.random() * 12, 0, t);
        treeL.scale.setScalar(0.85 + Math.random() * 0.3);
        chunkGroup.add(treeL);
        this.sceneryTrees.push(treeL);

        const treeR = c % 2 === 0 ? createPineTree() : createPalmTree();
        treeR.position.set(this.roadWidth / 2 + 5 + Math.random() * 12, 0, t + 10);
        treeR.scale.setScalar(0.85 + Math.random() * 0.3);
        chunkGroup.add(treeR);
        this.sceneryTrees.push(treeR);
      }

      // Overhead highway gantry sign on first chunk
      if (c === 0 || c === 2) {
        const gantry = createHighwayGantry();
        gantry.position.set(0, 0, 0);
        chunkGroup.add(gantry);
        this.gantryList = this.gantryList || [];
        this.gantryList.push(gantry);
      }

      this.scene.add(chunkGroup);
      this.roadChunks.push({ group: chunkGroup, z: chunkZ });
    }
  }

  private gantryList: THREE.Group[] = [];

  private initPlayer() {
    if (this.playerRig) {
      this.scene.remove(this.playerRig.group);
    }
    this.playerRig = buildPlayerCar(this.currentModel, this.currentColor);
    this.playerRig.group.position.set(0, 0, 0);
    this.scene.add(this.playerRig.group);

    // Shield energy orb
    const shieldGeo = new THREE.SphereGeometry(2.3, 24, 16);
    const shieldMat = new THREE.MeshBasicMaterial({
      color: 0x00d4ff,
      wireframe: true,
      transparent: true,
      opacity: 0,
    });
    this.shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    this.shieldMesh.position.set(0, 0.8, 0);
    this.playerRig.group.add(this.shieldMesh);
  }

  private initParticles() {
    // Nitro sparks & exhaust trails
    const count = 120;
    this.nitroGeo = new THREE.BufferGeometry();
    this.nitroPositions = new Float32Array(count * 3);
    this.nitroLifes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      this.nitroPositions[i * 3] = 0;
      this.nitroPositions[i * 3 + 1] = -10;
      this.nitroPositions[i * 3 + 2] = 0;
      this.nitroLifes[i] = 0;
    }

    this.nitroGeo.setAttribute('position', new THREE.BufferAttribute(this.nitroPositions, 3));

    const pMat = new THREE.PointsMaterial({
      color: 0x00f0ff,
      size: 0.28,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    this.nitroParticles = new THREE.Points(this.nitroGeo, pMat);
    this.scene.add(this.nitroParticles);

    // Rain particles (for storm theme)
    const rainCount = 800;
    const rainGeo = new THREE.BufferGeometry();
    const rainPos = new Float32Array(rainCount * 3);
    for (let i = 0; i < rainCount; i++) {
      rainPos[i * 3] = (Math.random() - 0.5) * 80;
      rainPos[i * 3 + 1] = Math.random() * 40;
      rainPos[i * 3 + 2] = (Math.random() - 0.5) * 160;
    }
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
    const rainMat = new THREE.PointsMaterial({
      color: 0x88bbff,
      size: 0.18,
      transparent: true,
      opacity: 0.6,
    });
    this.rainParticles = new THREE.Points(rainGeo, rainMat);
    this.rainParticles.visible = false;
    this.scene.add(this.rainParticles);
  }

  public applyTheme(themeId: ThemeId) {
    this.currentTheme = themeId;
    const theme = THEMES[themeId];
    if (!theme) return;

    this.scene.background = new THREE.Color(theme.skyColor);
    this.scene.fog = new THREE.Fog(theme.fogColor, theme.fogNear, theme.fogFar);

    this.sunLight.color.setHex(theme.sunColor);
    this.sunLight.intensity = theme.sunIntensity;
    this.sunLight.position.set(...theme.sunPosition);

    this.hemiLight.color.setHex(theme.hemiSkyColor);
    this.hemiLight.groundColor.setHex(theme.hemiGroundColor);
    this.hemiLight.intensity = theme.hemiIntensity;

    if (this.rainParticles) {
      this.rainParticles.visible = !!theme.hasRain;
    }

    // Dynamic headlight glow on cyber/storm themes
    const headIntensity = theme.neonGlow ? 1.4 : 0.8;
    this.playerRig.headlights.forEach(hl => {
      if ('color' in hl.material) {
        (hl.material as THREE.MeshBasicMaterial).color.setHex(theme.neonGlow ? 0x00ffff : 0xffffff);
      }
    });

    if (this.playerRig.underglow) {
      this.playerRig.underglow.visible = true;
    }
  }

  public selectCar(modelId: CarModelId, colorHex?: number) {
    this.currentModel = modelId;
    if (colorHex !== undefined) this.currentColor = colorHex;
    this.initPlayer();
  }

  public setCarColor(hex: number) {
    this.currentColor = hex;
    this.initPlayer();
  }

  public setCameraMode(mode: CameraMode) {
    this.cameraMode = mode;
  }

  public startGame() {
    this.clearTrafficAndPickups();

    this.playerPos.set(0, 0, 0);
    this.playerVel.set(0, 0, 0);
    this.speedKmH = 75;
    this.nitroAmount = 100;
    this.score = 0;
    this.distanceMeters = 0;
    this.coinsCount = 0;
    this.nearMissCount = 0;
    this.topSpeedRecorded = 75;
    this.multiplier = 1;
    this.multiplierTimer = 0;
    this.shieldTimer = 0;
    this.magnetTimer = 0;
    this.trafficSpawnTimer = 0;
    this.pickupSpawnTimer = 0;

    this.isRunning = true;
    this.isPaused = false;

    sound.startEngine();
  }

  public pauseGame() {
    this.isPaused = true;
    sound.stopEngine();
  }

  public resumeGame() {
    this.isPaused = false;
    sound.startEngine();
  }

  public restartGame() {
    this.startGame();
  }

  private clearTrafficAndPickups() {
    this.traffic.forEach(t => this.scene.remove(t.rig.group));
    this.traffic = [];

    this.pickups.forEach(p => this.scene.remove(p.mesh));
    this.pickups = [];
  }

  // --- TRAFFIC SPAWNER ---
  private spawnTrafficVehicle() {
    const laneIndex = Math.floor(Math.random() * this.lanes.length);
    const laneX = this.lanes[laneIndex];

    // Check if lane is already blocked near spawn zone
    const spawnZ = -220 - Math.random() * 40;
    const isOccupied = this.traffic.some(t => Math.abs(t.x - laneX) < 3.2 && Math.abs(t.z - spawnZ) < 30);
    if (isOccupied) return;

    // Traffic type distribution
    const rand = Math.random();
    let type: TrafficType = 'sedan';
    let baseSpeed = 70 + Math.random() * 25;

    if (rand < 0.22) {
      type = 'truck';
      baseSpeed = 50 + Math.random() * 15;
    } else if (rand < 0.45) {
      type = 'cab';
      baseSpeed = 75 + Math.random() * 20;
    } else if (rand < 0.7) {
      type = 'sedan';
      baseSpeed = 80 + Math.random() * 20;
    } else if (rand < 0.88) {
      type = 'sports';
      baseSpeed = 110 + Math.random() * 25;
    } else {
      type = 'police';
      baseSpeed = 100 + Math.random() * 20;
    }

    const trafficRig = buildTrafficVehicle(type);
    trafficRig.group.position.set(laneX, 0, spawnZ);
    this.scene.add(trafficRig.group);

    this.traffic.push({
      rig: trafficRig,
      lane: laneIndex,
      x: laneX,
      z: spawnZ,
      speed: baseSpeed,
      type,
      passed: false,
      nearMissed: false,
      spinOut: false,
      spinVelocity: new THREE.Vector3(),
    });
  }

  // --- PICKUP SPAWNER ---
  private spawnPickup() {
    const laneX = this.lanes[Math.floor(Math.random() * this.lanes.length)];
    const spawnZ = -200 - Math.random() * 30;

    const rand = Math.random();
    let type: 'nitro' | 'coin' | 'shield' | 'magnet' = 'coin';
    if (rand < 0.55) {
      type = 'coin';
    } else if (rand < 0.78) {
      type = 'nitro';
    } else if (rand < 0.9) {
      type = 'shield';
    } else {
      type = 'magnet';
    }

    const mesh = buildPickupMesh(type);
    mesh.position.set(laneX, 0.8, spawnZ);
    this.scene.add(mesh);

    this.pickups.push({
      mesh,
      type,
      x: laneX,
      z: spawnZ,
      active: true,
    });
  }

  // --- MAIN SIMULATION STEP ---
  private updatePhysics(dt: number) {
    if (!this.isRunning || this.isPaused) return;

    // Multiplier countdown
    if (this.multiplierTimer > 0) {
      this.multiplierTimer -= dt;
      if (this.multiplierTimer <= 0) {
        this.multiplier = 1;
      }
    }

    // Powerup Timers
    if (this.shieldTimer > 0) {
      this.shieldTimer -= dt;
      if (this.shieldMesh) {
        (this.shieldMesh.material as THREE.MeshBasicMaterial).opacity = 0.5 + Math.sin(performance.now() * 0.01) * 0.2;
      }
    } else if (this.shieldMesh) {
      (this.shieldMesh.material as THREE.MeshBasicMaterial).opacity = 0;
    }

    if (this.magnetTimer > 0) {
      this.magnetTimer -= dt;
    }

    // Nitro handling
    const isNitroPressed = this.inputs.nitro && this.nitroAmount > 0;
    if (isNitroPressed) {
      this.isBoosting = true;
      this.nitroAmount = Math.max(0, this.nitroAmount - 38 * dt);
      sound.startNitro();
    } else {
      this.isBoosting = false;
      this.nitroAmount = Math.min(100, this.nitroAmount + 3.5 * dt); // slow recharge
      sound.stopNitro();
    }

    // Acceleration & Braking
    const accelRate = this.isBoosting ? 130 : 60;
    const maxSpeedTarget = this.isBoosting ? 245 : this.maxSpeedKmH;

    if (this.inputs.up) {
      this.speedKmH += accelRate * dt;
    } else if (this.inputs.down || this.inputs.brake) {
      this.speedKmH -= 140 * dt;
      sound.setSkid(0.7);
    } else {
      this.speedKmH -= 18 * dt; // road friction
      sound.stopSkid();
    }

    // Clamp speed
    this.speedKmH = THREE.MathUtils.clamp(this.speedKmH, 40, maxSpeedTarget);
    if (this.speedKmH > this.topSpeedRecorded) {
      this.topSpeedRecorded = this.speedKmH;
    }

    // Steering & Banking
    const steerSpeed = 16.5;
    let targetRoll = 0;
    let isSkidding = false;

    if (this.inputs.left) {
      this.playerPos.x -= steerSpeed * dt * (this.speedKmH / 120);
      targetRoll = 0.12;
      if (this.speedKmH > 130) isSkidding = true;
    } else if (this.inputs.right) {
      this.playerPos.x += steerSpeed * dt * (this.speedKmH / 120);
      targetRoll = -0.12;
      if (this.speedKmH > 130) isSkidding = true;
    }

    if (isSkidding) {
      sound.setSkid(0.5);
    }

    // Clamp to road boundaries
    const maxRoadX = this.roadWidth / 2 - 1.2;
    this.playerPos.x = THREE.MathUtils.clamp(this.playerPos.x, -maxRoadX, maxRoadX);

    // Smooth roll damping
    this.playerRoll = THREE.MathUtils.damp(this.playerRoll, targetRoll, 14, dt);
    this.playerRig.group.position.x = this.playerPos.x;
    this.playerRig.group.rotation.z = this.playerRoll;
    this.playerRig.group.rotation.y = -this.playerRoll * 0.8;

    // Wheels rotation animation
    const wheelRotDelta = (this.speedKmH / 3.6 / 0.36) * dt;
    this.playerRig.wheels.forEach(w => {
      w.rotation.x += wheelRotDelta;
    });

    // Distance & Score progression
    const forwardMovementMps = (this.speedKmH / 3.6);
    const frameDistance = forwardMovementMps * dt;
    this.distanceMeters += frameDistance;
    this.score += frameDistance * (this.speedKmH / 50) * this.multiplier;

    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.saveHighScore();
    }

    // Road chunk scrolling (Endless illusion)
    const chunkLength = 100;
    const totalRoadSpan = this.roadChunks.length * chunkLength;

    this.roadChunks.forEach(chunk => {
      chunk.group.position.z += frameDistance;
      if (chunk.group.position.z > 60) {
        chunk.group.position.z -= totalRoadSpan;
      }
    });

    // Update sound engine pitch
    sound.updateEngine(this.speedKmH, this.inputs.up, this.isBoosting);

    // Traffic Spawning & Updating
    this.trafficSpawnTimer += dt;
    const spawnInterval = Math.max(0.45, 1.4 - (this.speedKmH / 300));
    if (this.trafficSpawnTimer > spawnInterval) {
      this.spawnTrafficVehicle();
      this.trafficSpawnTimer = 0;
    }

    this.updateTraffic(dt, frameDistance);

    // Pickups Spawning & Updating
    this.pickupSpawnTimer += dt;
    if (this.pickupSpawnTimer > 3.0) {
      this.spawnPickup();
      this.pickupSpawnTimer = 0;
    }
    this.updatePickups(dt, frameDistance);

    // Particles update
    this.updateParticles(dt);

    // Camera follow & shake
    this.updateCamera(dt);

    // Send Telemetry to HUD
    this.sendTelemetry();
  }

  private updateTraffic(dt: number, frameDistance: number) {
    const playerBox = {
      minX: this.playerPos.x - 0.9,
      maxX: this.playerPos.x + 0.9,
      minZ: -1.8,
      maxZ: 1.8,
    };

    for (let i = this.traffic.length - 1; i >= 0; i--) {
      const t = this.traffic[i];

      if (t.spinOut) {
        // Vehicle spinning out from shield hit
        t.rig.group.position.addScaledVector(t.spinVelocity, dt);
        t.rig.group.rotation.y += 12 * dt;
        t.rig.group.rotation.x += 6 * dt;
      } else {
        // Traffic speed relative to player road scroll
        const trafficSpeedMps = t.speed / 3.6;
        const relativeMove = frameDistance - trafficSpeedMps * dt;
        t.z += relativeMove;
        t.rig.group.position.z = t.z;

        // Animated police lights
        if (t.type === 'police' && t.rig.sirenRed && t.rig.sirenBlue) {
          const blink = Math.sin(performance.now() * 0.02) > 0;
          t.rig.sirenRed.visible = blink;
          t.rig.sirenBlue.visible = !blink;
        }

        // Wheel animation
        const trafficWheelRot = (trafficSpeedMps / 0.36) * dt;
        t.rig.wheels.forEach(w => (w.rotation.x += trafficWheelRot));

        // Collision Check
        const trafficW = t.type === 'truck' ? 1.4 : 1.0;
        const trafficL = t.type === 'truck' ? 3.6 : 2.0;

        const isColliding =
          Math.abs(this.playerPos.x - t.x) < 0.9 + trafficW &&
          Math.abs(t.z) < 1.8 + trafficL;

        if (isColliding) {
          if (this.shieldTimer > 0) {
            // Deflect traffic with shield!
            t.spinOut = true;
            t.spinVelocity.set((t.x - this.playerPos.x) * 15, 8, -25);
            sound.playCrash();
            this.cameraShake = 0.5;
            this.addFloatingText(this.playerPos.x, 'SHIELD DEFLECT!', 0x00f0ff);
          } else {
            // Crash Game Over!
            this.triggerGameOver();
            return;
          }
        }

        // Near-Miss Bonus Check
        if (!t.nearMissed && !t.passed && t.z > -3.5 && t.z < 3.5) {
          const latDist = Math.abs(this.playerPos.x - t.x);
          if (latDist > 1.2 + trafficW && latDist < 2.5 + trafficW) {
            t.nearMissed = true;
            this.triggerNearMiss(t.x, t.z);
          }
        }

        if (t.z > 2.5) {
          t.passed = true;
        }
      }

      // Cleanup off-screen traffic
      if (t.z > 40 || t.z < -300) {
        this.scene.remove(t.rig.group);
        this.traffic.splice(i, 1);
      }
    }
  }

  private triggerNearMiss(trafficX: number, trafficZ: number) {
    this.nearMissCount++;
    this.multiplier = Math.min(5, this.multiplier + 1);
    this.multiplierTimer = 4.5;
    this.nitroAmount = Math.min(100, this.nitroAmount + 25);
    const points = 250 * this.multiplier;
    this.score += points;

    sound.playNearMiss();
    this.cameraShake = 0.2;

    if (this.onNearMiss) {
      this.onNearMiss({
        id: Math.random().toString(),
        points,
        multiplier: this.multiplier,
        message: this.multiplier > 1 ? `NEAR MISS x${this.multiplier}!` : 'NEAR MISS!',
        x: trafficX,
        y: trafficZ,
      });
    }
  }

  private addFloatingText(x: number, text: string, color: number) {
    if (this.onNearMiss) {
      this.onNearMiss({
        id: Math.random().toString(),
        points: 0,
        multiplier: this.multiplier,
        message: text,
        x,
        y: 0,
      });
    }
  }

  private updatePickups(dt: number, frameDistance: number) {
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const p = this.pickups[i];
      p.z += frameDistance;
      p.mesh.position.z = p.z;
      p.mesh.rotation.y += 3.5 * dt;

      // Magnet attraction
      if (this.magnetTimer > 0 && p.type === 'coin') {
        const dx = this.playerPos.x - p.x;
        const dz = -p.z;
        const dist = Math.hypot(dx, dz);
        if (dist < 18) {
          p.x += dx * 6 * dt;
          p.mesh.position.x = p.x;
        }
      }

      // Pickup collision
      const distToPlayer = Math.hypot(this.playerPos.x - p.x, p.z);
      if (distToPlayer < 2.0 && p.active) {
        p.active = false;
        this.collectPickup(p.type);
        this.scene.remove(p.mesh);
        this.pickups.splice(i, 1);
        continue;
      }

      if (p.z > 25) {
        this.scene.remove(p.mesh);
        this.pickups.splice(i, 1);
      }
    }
  }

  private collectPickup(type: 'nitro' | 'coin' | 'shield' | 'magnet') {
    if (type === 'coin') {
      this.coinsCount++;
      this.score += 100 * this.multiplier;
      sound.playCoin();
    } else if (type === 'nitro') {
      this.nitroAmount = 100;
      sound.playPowerup();
      this.addFloatingText(this.playerPos.x, 'NITRO RECHARGED!', 0x00f0ff);
    } else if (type === 'shield') {
      this.shieldTimer = 10;
      sound.playPowerup();
      this.addFloatingText(this.playerPos.x, 'SHIELD ACTIVE!', 0x38bdf8);
    } else if (type === 'magnet') {
      this.magnetTimer = 12;
      sound.playPowerup();
      this.addFloatingText(this.playerPos.x, 'COIN MAGNET!', 0xf59e0b);
    }
  }

  private updateParticles(dt: number) {
    // Rain streaks update
    if (this.rainParticles && this.rainParticles.visible) {
      const pos = this.rainParticles.geometry.attributes.position.array as Float32Array;
      for (let i = 1; i < pos.length; i += 3) {
        pos[i] -= 90 * dt;
        if (pos[i] < 0) {
          pos[i] = 40;
        }
      }
      this.rainParticles.geometry.attributes.position.needsUpdate = true;
    }

    // Nitro flame particles from exhausts
    const isExhaustFiring = this.isBoosting || (this.inputs.up && this.speedKmH > 100);
    const count = this.nitroLifes.length;

    for (let i = 0; i < count; i++) {
      if (this.nitroLifes[i] > 0) {
        this.nitroLifes[i] -= dt * 4;
        this.nitroPositions[i * 3 + 2] += 25 * dt; // move backwards
        this.nitroPositions[i * 3 + 1] += (Math.random() - 0.5) * 0.5 * dt;
      } else if (isExhaustFiring && Math.random() < 0.35) {
        // Spawn new particle at one of the exhaust pipes
        const pipes = this.playerRig.exhaustPipes;
        const pipe = pipes.length > 0 ? pipes[Math.floor(Math.random() * pipes.length)] : new THREE.Vector3(0, 0.3, 1.9);

        this.nitroPositions[i * 3] = this.playerPos.x + pipe.x + (Math.random() - 0.5) * 0.1;
        this.nitroPositions[i * 3 + 1] = pipe.y + (Math.random() - 0.5) * 0.1;
        this.nitroPositions[i * 3 + 2] = pipe.z + 0.2;
        this.nitroLifes[i] = 1.0;
      } else {
        this.nitroPositions[i * 3 + 1] = -100;
      }
    }
    this.nitroGeo.attributes.position.needsUpdate = true;
  }

  private updateCamera(dt: number) {
    let targetX = 0;
    let targetY = 5.2;
    let targetZ = 8.8;
    let lookX = 0;
    let lookY = 1.2;
    let lookZ = -22;

    const speedRatio = this.speedKmH / 220;

    if (this.cameraMode === 'chase') {
      targetX = this.playerPos.x * 0.45;
      targetY = 4.6 + speedRatio * 0.6;
      targetZ = 7.8 + speedRatio * 2.2;
      lookX = this.playerPos.x * 0.25;
      lookY = 1.2;
      lookZ = -25;
    } else if (this.cameraMode === 'hood') {
      targetX = this.playerPos.x;
      targetY = 1.25;
      targetZ = -0.4;
      lookX = this.playerPos.x;
      lookY = 1.0;
      lookZ = -30;
    } else if (this.cameraMode === 'cinematic') {
      targetX = this.playerPos.x * 0.3 - 4.5;
      targetY = 2.4;
      targetZ = 6.0;
      lookX = this.playerPos.x;
      lookY = 1.2;
      lookZ = -15;
    }

    // Dynamic FOV for speed sensation
    const targetFov = this.isBoosting ? 76 : 64 + speedRatio * 7;
    this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 6, dt);
    this.camera.updateProjectionMatrix();

    // Smooth spring position
    this.cameraPosTarget.set(targetX, targetY, targetZ);
    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, this.cameraPosTarget.x, 9, dt);
    this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, this.cameraPosTarget.y, 9, dt);
    this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, this.cameraPosTarget.z, 9, dt);

    // Camera trauma shake
    if (this.cameraShake > 0) {
      this.camera.position.x += (Math.random() - 0.5) * this.cameraShake * 1.2;
      this.camera.position.y += (Math.random() - 0.5) * this.cameraShake * 0.8;
      this.cameraShake = Math.max(0, this.cameraShake - dt * 2.5);
    }

    this.cameraLookTarget.set(lookX, lookY, lookZ);
    this.camera.lookAt(this.cameraLookTarget);
  }

  private sendTelemetry() {
    if (!this.onTelemetryUpdate) return;

    // RPM & Gear calculation
    const gear = Math.min(6, Math.max(1, Math.floor(this.speedKmH / 38) + 1));
    const gearMinSpeed = (gear - 1) * 38;
    const gearMaxSpeed = gear * 38;
    const rpmRatio = (this.speedKmH - gearMinSpeed) / (gearMaxSpeed - gearMinSpeed);
    const rpm = Math.floor(2500 + rpmRatio * 5500);

    this.onTelemetryUpdate({
      speed: Math.round(this.speedKmH),
      rpm,
      gear,
      nitro: Math.round(this.nitroAmount),
      score: Math.floor(this.score),
      highScore: Math.floor(this.highScore),
      distance: Math.floor(this.distanceMeters),
      coins: this.coinsCount,
      nearMisses: this.nearMissCount,
      topSpeed: Math.round(this.topSpeedRecorded),
      multiplier: this.multiplier,
      shieldRemaining: Math.ceil(this.shieldTimer),
      magnetRemaining: Math.ceil(this.magnetTimer),
      health: 100,
    });
  }

  private triggerGameOver() {
    this.isRunning = false;
    sound.stopEngine();
    sound.playCrash();
    this.cameraShake = 1.0;

    const finalTelemetry: GameTelemetry = {
      speed: 0,
      rpm: 0,
      gear: 1,
      nitro: Math.round(this.nitroAmount),
      score: Math.floor(this.score),
      highScore: Math.floor(this.highScore),
      distance: Math.floor(this.distanceMeters),
      coins: this.coinsCount,
      nearMisses: this.nearMissCount,
      topSpeed: Math.round(this.topSpeedRecorded),
      multiplier: this.multiplier,
      shieldRemaining: 0,
      magnetRemaining: 0,
      health: 0,
    };

    if (this.onGameOver) {
      this.onGameOver(finalTelemetry);
    }
  }

  // --- RENDER LOOP WITH SOFTWARE WEBGL PACING ---
  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private tick = () => {
    if (this.isDestroyed) return;

    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;

    if (this.isRunning && !this.isPaused) {
      this.updatePhysics(dt);
    } else {
      // Idle rotate / showcase camera in start screen
      const t = now * 0.0006;
      this.playerRig.group.position.set(0, 0, 0);
      this.camera.position.set(Math.sin(t) * 7.5, 3.2, Math.cos(t) * 7.5);
      this.camera.lookAt(0, 0.8, 0);
    }

    this.renderer.render(this.scene, this.camera);

    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  };

  private setupWindowResize() {
    window.addEventListener('resize', this.onResize);
  }

  private onResize = () => {
    if (this.isDestroyed || !this.renderer || !this.camera) return;
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  public destroy() {
    this.isDestroyed = true;
    window.removeEventListener('resize', this.onResize);
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    sound.stopEngine();
    this.pmrem.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
