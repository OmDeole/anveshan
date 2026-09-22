import * as THREE from 'three';
import { promptifyAudio } from './PromptifyAudio';
import { ExplosionPatterns } from '../../fireworks/ExplosionPatterns';
import { FireworksAudio } from '../../fireworks/FireworksAudio';

export type FireworkBurstType =
  | 'spherical'
  | 'ring'
  | 'double-ring'
  | 'star'
  | 'golden-shower'
  | 'spiral'
  | 'multi-layer'
  | 'chrysanthemum'
  | 'secondary'
  | 'random-3d';

interface FireworkParticle {
  active: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  colorR: number;
  colorG: number;
  colorB: number;
  alpha: number;
  size: number;
  life: number;
  maxLife: number;
  gravity: number;
  drag: number;
  sparkle: boolean;
}

interface ActiveRocket {
  active: boolean;
  startX: number;
  startY: number;
  startZ: number;
  x: number;
  y: number;
  z: number;
  targetX: number;
  targetY: number;
  targetZ: number;
  dirX: number;
  dirY: number;
  dirZ: number;
  totalDist: number;
  traveledDist: number;
  speed: number;
  color: THREE.Color;
  secondaryColor: THREE.Color;
  sizeFactor: number;
  burstType: FireworkBurstType;
  sparkTimer: number;
}

export class PromptifyFireworks {
  private scene: THREE.Scene;
  public isRunning: boolean = false;
  public isCelebrationActive: boolean = false;
  public onCelebrationFinished?: () => void;
  public fireworksAudio: FireworksAudio = new FireworksAudio();

  // Particle Pool
  private maxParticles = 2400;
  private particles: FireworkParticle[] = [];
  private particleGeo!: THREE.BufferGeometry;
  private particleMat!: THREE.PointsMaterial;
  private particleMesh!: THREE.Points;

  private positions!: Float32Array;
  private colors!: Float32Array;
  private sizes!: Float32Array;

  // Rocket Pool
  private maxRockets = 16;
  private rockets: ActiveRocket[] = [];

  // Environmental Flash Point Lights (temporary scene illumination on Torii, stalls, stone path)
  private flashLights: THREE.PointLight[] = [];
  private flashTargets: number[] = [0, 0, 0];

  // Choreographed 10–15 second celebration timeline
  private celebrationTime: number = 0;
  private launchTimer: number = 999;
  private queuedSteps: { time: number; executed: boolean; run: () => void }[] = [];

  // Vibrant Japanese Festival Color Palette
  public static readonly COLOR_PALETTE = {
    neonPink: 0xff1493,
    electricBlue: 0x00f0ff,
    gold: 0xffd700,
    green: 0x00ff66,
    red: 0xff2244,
    purple: 0xb026ff,
    cyan: 0x00ffff,
    orange: 0xff6600,
    white: 0xffffff,
  };

  private colorList: number[] = [
    PromptifyFireworks.COLOR_PALETTE.gold,
    PromptifyFireworks.COLOR_PALETTE.neonPink,
    PromptifyFireworks.COLOR_PALETTE.electricBlue,
    PromptifyFireworks.COLOR_PALETTE.cyan,
    PromptifyFireworks.COLOR_PALETTE.orange,
    PromptifyFireworks.COLOR_PALETTE.purple,
    PromptifyFireworks.COLOR_PALETTE.green,
    PromptifyFireworks.COLOR_PALETTE.red,
    PromptifyFireworks.COLOR_PALETTE.white,
  ];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.initialize();
  }

  /**
   * System Lifecycle: initialize()
   * Allocates particle buffers, materials, lights, and pools.
   * Remains completely invisible and inactive until startCelebration() is triggered!
   */
  public initialize() {
    this.positions = new Float32Array(this.maxParticles * 3);
    this.colors = new Float32Array(this.maxParticles * 3);
    this.sizes = new Float32Array(this.maxParticles);

    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push({
        active: false,
        x: 0,
        y: -100,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        colorR: 1,
        colorG: 1,
        colorB: 1,
        alpha: 0,
        size: 0,
        life: 0,
        maxLife: 1,
        gravity: -9.8,
        drag: 0.96,
        sparkle: true,
      });
      this.positions[i * 3 + 1] = -100;
      this.sizes[i] = 0;
    }

    for (let i = 0; i < this.maxRockets; i++) {
      this.rockets.push({
        active: false,
        startX: 0,
        startY: 0,
        startZ: 0,
        x: 0,
        y: 0,
        z: 0,
        targetX: 0,
        targetY: 30,
        targetZ: 0,
        dirX: 0,
        dirY: 1,
        dirZ: 0,
        totalDist: 30,
        traveledDist: 0,
        speed: 30,
        color: new THREE.Color(0xffffff),
        secondaryColor: new THREE.Color(0xffd700),
        sizeFactor: 1,
        burstType: 'chrysanthemum',
        sparkTimer: 0,
      });
    }

    // High-resolution procedural circular glowing particle texture via HTML5 Canvas (No external files)
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.2, 'rgba(255, 245, 220, 0.95)');
    grad.addColorStop(0.5, 'rgba(255, 180, 80, 0.45)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    const particleTex = new THREE.CanvasTexture(canvas);

    this.particleGeo = new THREE.BufferGeometry();
    this.particleGeo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.particleGeo.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.particleGeo.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));

    this.particleMat = new THREE.PointsMaterial({
      size: 3.4,
      map: particleTex,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.particleMesh = new THREE.Points(this.particleGeo, this.particleMat);
    this.scene.add(this.particleMesh);

    // Dynamic Flash Lights (distributed along market axis: Torii gate, mid-market stalls, checkpoint)
    const lightZPositions = [-20, 2, 24];
    lightZPositions.forEach((z) => {
      const pLight = new THREE.PointLight(0xfff0dd, 0, 85, 1.4);
      pLight.position.set(0, 22, z);
      this.scene.add(pLight);
      this.flashLights.push(pLight);
      this.flashTargets.push(0);
    });

    // Inactive initially
    this.isRunning = false;
    this.isCelebrationActive = false;
  }

  /**
   * System Lifecycle: startCelebration()
   * MUST ONLY be called AFTER registration is confirmed successful!
   * Launches first rocket immediately (0s), then progresses through a 10–15s festival show.
   */
  public startCelebration() {
    if (this.isCelebrationActive) return;
    this.isRunning = true;
    this.isCelebrationActive = true;
    this.celebrationTime = 0;
    this.launchTimer = 999;
    console.log('[Promptify] PromptifyFireworks: startCelebration() active');

    // Start celebration festival audio (Taiko + Shinobue flute)
    promptifyAudio.startCelebrationMusic();

    // Set up choreographed timeline
    this.setupCelebrationTimeline();
  }

  /**
   * Staggered 10–15 second celebration show sequence:
   * 0s      → FIRST FIREWORK launches immediately (large golden chrysanthemum above Torii)
   * ~1s     → Second firework (Electric blue palm)
   * ~2s     → Third firework (Neon pink star burst)
   * ~3s     → Two fireworks (Cyan ring + Orange/Red double ring)
   * ~4–6s   → Larger and more colorful fireworks (Multi-layer & Spiral)
   * ~6–10s  → Main celebration (Giant chrysanthemum + secondary explosions)
   * ~10–15s → Gradual finale (Golden shower weeping willow tendrils)
   * ~15s    → Celebration automatically completes and fades
   */
  private setupCelebrationTimeline() {
    this.queuedSteps = [
      // 0s: FIRST LARGE FIREWORK launches IMMEDIATELY right above the market in front of the player!
      {
        time: 0.05,
        executed: false,
        run: () => {
          this.launchFirework(
            new THREE.Vector3(0, 0.8, 14),
            new THREE.Vector3(0, 26, 16),
            'chrysanthemum',
            PromptifyFireworks.COLOR_PALETTE.gold,
            PromptifyFireworks.COLOR_PALETTE.white,
            1.65
          );
        },
      },
      // ~1s: Second firework (Electric blue palm flanking left)
      {
        time: 1.0,
        executed: false,
        run: () => {
          this.launchFirework(
            new THREE.Vector3(-10, 0.8, 10),
            new THREE.Vector3(-7, 27, 12),
            'spherical',
            PromptifyFireworks.COLOR_PALETTE.electricBlue,
            PromptifyFireworks.COLOR_PALETTE.cyan,
            1.35
          );
        },
      },
      // ~2s: Third firework (Neon pink star burst flanking right)
      {
        time: 2.0,
        executed: false,
        run: () => {
          this.launchFirework(
            new THREE.Vector3(10, 0.8, 12),
            new THREE.Vector3(7, 28, 14),
            'star',
            PromptifyFireworks.COLOR_PALETTE.neonPink,
            PromptifyFireworks.COLOR_PALETTE.purple,
            1.4
          );
        },
      },
      // ~3s: Two fireworks (Cyan ring & Orange/Red double-ring)
      {
        time: 3.1,
        executed: false,
        run: () => {
          this.launchFirework(
            new THREE.Vector3(-11, 0.8, 6),
            new THREE.Vector3(-8, 29, 8),
            'ring',
            PromptifyFireworks.COLOR_PALETTE.cyan,
            PromptifyFireworks.COLOR_PALETTE.white,
            1.3
          );
          this.launchFirework(
            new THREE.Vector3(11, 0.8, 4),
            new THREE.Vector3(8, 30, 6),
            'double-ring',
            PromptifyFireworks.COLOR_PALETTE.orange,
            PromptifyFireworks.COLOR_PALETTE.red,
            1.4
          );
        },
      },
      // ~4.6s: Larger & more colorful fireworks (Multi-layer & Spiral)
      {
        time: 4.6,
        executed: false,
        run: () => {
          this.launchFirework(
            new THREE.Vector3(-6, 0.8, -2),
            new THREE.Vector3(-3, 31, 0),
            'multi-layer',
            PromptifyFireworks.COLOR_PALETTE.electricBlue,
            PromptifyFireworks.COLOR_PALETTE.neonPink,
            1.45
          );
          this.launchFirework(
            new THREE.Vector3(6, 0.8, 2),
            new THREE.Vector3(3, 29, 4),
            'spiral',
            PromptifyFireworks.COLOR_PALETTE.green,
            PromptifyFireworks.COLOR_PALETTE.gold,
            1.35
          );
        },
      },
      // ~6.8s: MAIN CELEBRATION (Giant chrysanthemum, secondary bursts, and random 3D)
      {
        time: 6.8,
        executed: false,
        run: () => {
          // Giant central explosion right above the market street
          this.launchFirework(
            new THREE.Vector3(0, 0.8, 8),
            new THREE.Vector3(0, 32, 10),
            'chrysanthemum',
            PromptifyFireworks.COLOR_PALETTE.gold,
            PromptifyFireworks.COLOR_PALETTE.white,
            1.85
          );
          // Flanking secondary explosion
          this.launchFirework(
            new THREE.Vector3(-12, 0.8, -8),
            new THREE.Vector3(-8, 31, -6),
            'secondary',
            PromptifyFireworks.COLOR_PALETTE.purple,
            PromptifyFireworks.COLOR_PALETTE.neonPink,
            1.4
          );
          // Flanking random 3D burst
          this.launchFirework(
            new THREE.Vector3(12, 0.8, -4),
            new THREE.Vector3(8, 31, -2),
            'random-3d',
            PromptifyFireworks.COLOR_PALETTE.cyan,
            PromptifyFireworks.COLOR_PALETTE.electricBlue,
            1.35
          );
        },
      },
      // ~9.2s: Torii Avenue and Overhead festive bursts
      {
        time: 9.2,
        executed: false,
        run: () => {
          this.launchFirework(
            new THREE.Vector3(-6, 0.8, -18),
            new THREE.Vector3(-3, 33, -16),
            'double-ring',
            PromptifyFireworks.COLOR_PALETTE.gold,
            PromptifyFireworks.COLOR_PALETTE.green,
            1.4
          );
          this.launchFirework(
            new THREE.Vector3(7, 0.8, 15),
            new THREE.Vector3(4, 28, 17),
            'star',
            PromptifyFireworks.COLOR_PALETTE.neonPink,
            PromptifyFireworks.COLOR_PALETTE.white,
            1.4
          );
        },
      },
      // ~11.5s: Gradual Finale (Golden shower weeping willow tendrils)
      {
        time: 11.5,
        executed: false,
        run: () => {
          this.launchFirework(
            new THREE.Vector3(-5, 0.8, 11),
            new THREE.Vector3(-2, 30, 13),
            'golden-shower',
            PromptifyFireworks.COLOR_PALETTE.gold,
            PromptifyFireworks.COLOR_PALETTE.gold,
            1.65
          );
          this.launchFirework(
            new THREE.Vector3(5, 0.8, 7),
            new THREE.Vector3(2, 31, 9),
            'golden-shower',
            PromptifyFireworks.COLOR_PALETTE.gold,
            PromptifyFireworks.COLOR_PALETTE.white,
            1.65
          );
        },
      },
      // ~15.0s: Celebration show ends
      {
        time: 15.0,
        executed: false,
        run: () => {
          this.stopCelebration();
        },
      },
    ];
  }

  /**
   * System Lifecycle: launchFirework()
   * Core rocket launch method taking start and target 3D world positions.
   */
  public launchFirework(
    startPos: THREE.Vector3,
    targetPos: THREE.Vector3,
    burstType: FireworkBurstType = 'chrysanthemum',
    primaryColorHex?: number,
    secondaryColorHex?: number,
    sizeFactor: number = 1.2
  ): boolean {
    const freeRocket = this.rockets.find((r) => !r.active);
    if (!freeRocket) return false;

    const dx = targetPos.x - startPos.x;
    const dy = targetPos.y - startPos.y;
    const dz = targetPos.z - startPos.z;
    const totalDist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (totalDist < 1) return false;

    const pColor =
      primaryColorHex !== undefined
        ? primaryColorHex
        : this.colorList[Math.floor(Math.random() * this.colorList.length)];
    const sColor =
      secondaryColorHex !== undefined
        ? secondaryColorHex
        : this.colorList[Math.floor(Math.random() * this.colorList.length)];

    freeRocket.active = true;
    freeRocket.startX = startPos.x;
    freeRocket.startY = startPos.y;
    freeRocket.startZ = startPos.z;
    freeRocket.x = startPos.x;
    freeRocket.y = startPos.y;
    freeRocket.z = startPos.z;
    freeRocket.targetX = targetPos.x;
    freeRocket.targetY = targetPos.y;
    freeRocket.targetZ = targetPos.z;
    freeRocket.dirX = dx / totalDist;
    freeRocket.dirY = dy / totalDist;
    freeRocket.dirZ = dz / totalDist;
    freeRocket.totalDist = totalDist;
    freeRocket.traveledDist = 0;
    freeRocket.speed = 28 + Math.random() * 5;
    freeRocket.color.setHex(pColor);
    freeRocket.secondaryColor.setHex(sColor);
    freeRocket.sizeFactor = sizeFactor;
    freeRocket.burstType = burstType;
    freeRocket.sparkTimer = 0;

    // Play rocket launch rising whistle using dedicated fireworks audio synthesizer
    this.fireworksAudio.playLaunch(sizeFactor);
    promptifyAudio.playFireworkLaunch(sizeFactor);

    return true;
  }

  /**
   * Interactive Screen Click / Tap handler (Section 15)
   * Only active AFTER registration! Converts screen coordinates to 3D sky target and fires!
   */
  public launchFromScreenClick(
    screenX: number,
    screenY: number,
    camera: THREE.Camera,
    width: number,
    height: number
  ) {
    const ndcX = (screenX / width) * 2 - 1;
    const ndcY = -(screenY / height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);

    const target = new THREE.Vector3();
    const skyPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -32); // Y = 32m
    const hasIntersection = raycaster.ray.intersectPlane(skyPlane, target);

    if (!hasIntersection || target.distanceTo(camera.position) > 85 || target.y < 20) {
      target.copy(camera.position).add(raycaster.ray.direction.clone().multiplyScalar(44));
      target.y = Math.max(target.y, 22);
    }

    const launchX = target.x * 0.4 + (Math.random() - 0.5) * 12;
    const launchZ = target.z * 0.4 + (Math.random() - 0.5) * 12;
    const startPos = new THREE.Vector3(launchX, 0.8, launchZ);

    const patterns: FireworkBurstType[] = [
      'spherical',
      'ring',
      'double-ring',
      'star',
      'golden-shower',
      'spiral',
      'multi-layer',
      'chrysanthemum',
      'secondary',
      'random-3d',
    ];
    const burstType = patterns[Math.floor(Math.random() * patterns.length)];

    this.launchFirework(startPos, target, burstType, undefined, undefined, 1.25 + Math.random() * 0.3);
  }

  /**
   * System Lifecycle: createExplosion()
   * Spawns 3D particle explosion matching one of the 10 patterns.
   */
  public createExplosion(rocket: ActiveRocket) {
    const particleCount = Math.floor((150 + Math.random() * 80) * rocket.sizeFactor);
    let spawned = 0;

    // Play synthesized firework explosion boom + crackle using fireworks audio
    this.fireworksAudio.playExplosion(rocket.sizeFactor, rocket.burstType !== 'spherical');
    promptifyAudio.playFireworkExplosion(rocket.sizeFactor, rocket.burstType !== 'spherical');

    // Environmental Light Flash: illuminates Torii, roofs, and stone path in explosion color
    let closestLight = this.flashLights[0];
    let closestDist = 9999;
    let closestIdx = 0;
    this.flashLights.forEach((l, idx) => {
      const d = Math.abs(l.position.z - rocket.z);
      if (d < closestDist) {
        closestDist = d;
        closestLight = l;
        closestIdx = idx;
      }
    });

    closestLight.color.copy(rocket.color);
    closestLight.position.set(rocket.x * 0.4, rocket.y * 0.55 + 5, rocket.z);
    this.flashTargets[closestIdx] = 3.6 * rocket.sizeFactor;

    for (let i = 0; i < this.maxParticles && spawned < particleCount; i++) {
      const p = this.particles[i];
      if (p.active) continue;

      p.active = true;
      p.x = rocket.x;
      p.y = rocket.y;
      p.z = rocket.z;

      const sizeFac = rocket.sizeFactor;
      let r = rocket.color.r;
      let g = rocket.color.g;
      let b = rocket.color.b;

      // 10 Distinct Explosion Patterns
      switch (rocket.burstType) {
        case 'ring': {
          // 2. Ring burst
          const angle = Math.random() * Math.PI * 2;
          const speed = (9.5 + Math.random() * 3.5) * sizeFac;
          p.vx = Math.cos(angle) * speed;
          p.vy = (Math.random() - 0.5) * 1.5;
          p.vz = Math.sin(angle) * speed;
          p.gravity = -4.8;
          p.drag = 0.96;
          p.maxLife = 1.7;
          break;
        }

        case 'double-ring': {
          // 3. Double ring burst (Dual contrasting color rings)
          const isOuter = Math.random() > 0.45;
          const angle = Math.random() * Math.PI * 2;
          const speed = (isOuter ? 12.0 + Math.random() * 2 : 7.0 + Math.random() * 2) * sizeFac;
          p.vx = Math.cos(angle) * speed;
          p.vy = (Math.random() - 0.5) * 2.2;
          p.vz = Math.sin(angle) * speed;
          p.gravity = -5.0;
          p.drag = 0.958;
          p.maxLife = 1.8;
          if (!isOuter) {
            r = rocket.secondaryColor.r;
            g = rocket.secondaryColor.g;
            b = rocket.secondaryColor.b;
          }
          break;
        }

        case 'star': {
          // 4. Star burst (5-pointed star pattern)
          const numPoints = 5;
          const armIdx = Math.floor(Math.random() * numPoints);
          const baseAngle = (armIdx * Math.PI * 2) / numPoints;
          const jitter = (Math.random() - 0.5) * 0.26;
          const angle = baseAngle + jitter;
          const speed = (9.5 + Math.random() * 9.5) * sizeFac;
          p.vx = Math.cos(angle) * speed;
          p.vy = (Math.random() - 0.5) * 3.5;
          p.vz = Math.sin(angle) * speed;
          p.gravity = -5.5;
          p.drag = 0.96;
          p.maxLife = 1.7;
          break;
        }

        case 'golden-shower': {
          // 5. Golden shower (weeping willow tendrils drifting down)
          const theta = Math.random() * Math.PI * 2;
          const speed = (4.5 + Math.random() * 7.5) * sizeFac;
          p.vx = Math.sin(theta) * speed;
          p.vy = (Math.random() * 0.6 + 0.3) * speed;
          p.vz = Math.cos(theta) * speed;
          p.gravity = -2.8; // Slow weeping fall
          p.drag = 0.94; // Heavy drag creates weeping tendrils
          p.maxLife = 2.5 + Math.random() * 0.8;
          r = 1.0;
          g = 0.84;
          b = 0.25;
          break;
        }

        case 'spiral': {
          // 6. Spiral burst (swirling arms)
          const arm = Math.random() > 0.5 ? 0 : Math.PI;
          const tAngle = Math.random() * Math.PI * 4;
          const rSpeed = (4.0 + tAngle * 1.8) * sizeFac;
          p.vx = Math.cos(tAngle + arm) * rSpeed;
          p.vy = (Math.random() - 0.5) * 3.0 + Math.sin(tAngle) * 2.0;
          p.vz = Math.sin(tAngle + arm) * rSpeed;
          p.gravity = -5.2;
          p.drag = 0.96;
          p.maxLife = 1.75;
          break;
        }

        case 'multi-layer': {
          // 7. Multi-layer burst (3 concentric shells)
          const layer = Math.random();
          let shellSpeed = 5.0;
          if (layer > 0.6) {
            shellSpeed = 13.5;
          } else if (layer > 0.25) {
            shellSpeed = 8.8;
            r = rocket.secondaryColor.r;
            g = rocket.secondaryColor.g;
            b = rocket.secondaryColor.b;
          } else {
            shellSpeed = 4.2;
            r = 1.0;
            g = 1.0;
            b = 1.0;
          }
          const u = Math.random();
          const v = Math.random();
          const theta = u * 2.0 * Math.PI;
          const phi = Math.acos(2.0 * v - 1.0);
          const spd = (shellSpeed + Math.random() * 1.8) * sizeFac;
          p.vx = spd * Math.sin(phi) * Math.cos(theta);
          p.vy = spd * Math.cos(phi);
          p.vz = spd * Math.sin(phi) * Math.sin(theta);
          p.gravity = -5.8;
          p.drag = 0.956;
          p.maxLife = 1.8;
          break;
        }

        case 'chrysanthemum': {
          // 8. Large chrysanthemum-style burst (Dense sphere with long sparkling trails)
          const u = Math.random();
          const v = Math.random();
          const theta = u * 2.0 * Math.PI;
          const phi = Math.acos(2.0 * v - 1.0);
          const spd = (8.5 + Math.random() * 14.0) * sizeFac;
          p.vx = spd * Math.sin(phi) * Math.cos(theta);
          p.vy = spd * Math.cos(phi);
          p.vz = spd * Math.sin(phi) * Math.sin(theta);
          p.gravity = -6.8;
          p.drag = 0.962;
          p.maxLife = 2.2 + Math.random() * 0.7;
          p.sparkle = true;
          break;
        }

        case 'secondary': {
          // 9. Secondary explosion burst (initial burst + delayed mini detonations)
          const u = Math.random();
          const v = Math.random();
          const theta = u * 2.0 * Math.PI;
          const phi = Math.acos(2.0 * v - 1.0);
          const spd = (7.0 + Math.random() * 12.0) * sizeFac;
          p.vx = spd * Math.sin(phi) * Math.cos(theta);
          p.vy = spd * Math.cos(phi);
          p.vz = spd * Math.sin(phi) * Math.sin(theta);
          p.gravity = -6.0;
          p.drag = 0.955;
          p.maxLife = 1.6;
          break;
        }

        case 'random-3d': {
          // 10. Random 3D organic burst
          const theta = Math.random() * Math.PI * 2;
          const phi = (Math.random() - 0.5) * Math.PI;
          const spd = (6.0 + Math.random() * 13.0) * sizeFac;
          p.vx = spd * Math.cos(phi) * Math.sin(theta);
          p.vy = spd * Math.sin(phi) + 1.5;
          p.vz = spd * Math.cos(phi) * Math.cos(theta);
          p.gravity = -5.8;
          p.drag = 0.94 + Math.random() * 0.03;
          p.maxLife = 1.7 + Math.random() * 0.6;
          p.sparkle = Math.random() > 0.35;
          break;
        }

        case 'spherical':
        default: {
          // 1. Spherical burst
          const u = Math.random();
          const v = Math.random();
          const theta = u * 2.0 * Math.PI;
          const phi = Math.acos(2.0 * v - 1.0);
          const spd = (7.5 + Math.random() * 12.0) * sizeFac;
          p.vx = spd * Math.sin(phi) * Math.cos(theta);
          p.vy = spd * Math.cos(phi);
          p.vz = spd * Math.sin(phi) * Math.sin(theta);
          p.gravity = -6.5;
          p.drag = 0.955;
          p.maxLife = 1.6 + Math.random() * 0.6;
          break;
        }
      }

      p.colorR = r;
      p.colorG = g;
      p.colorB = b;
      p.alpha = 1.0;
      p.life = 0;
      p.size = (3.4 + Math.random() * 2.8) * sizeFac;
      p.sparkle = true;

      spawned++;
    }

    // Secondary explosions for 'secondary' type
    if (rocket.burstType === 'secondary') {
      setTimeout(() => {
        if (!this.isRunning) return;
        promptifyAudio.playFireworkExplosion(rocket.sizeFactor * 0.65, true);
        const subBursts = 6;
        for (let bIdx = 0; bIdx < subBursts; bIdx++) {
          const offAngle = (bIdx * Math.PI * 2) / subBursts;
          const offDist = 3.5 * rocket.sizeFactor;
          const subX = rocket.x + Math.cos(offAngle) * offDist;
          const subY = rocket.y + (Math.random() - 0.5) * 2;
          const subZ = rocket.z + Math.sin(offAngle) * offDist;

          let inSpawned = 0;
          for (let i = 0; i < this.maxParticles && inSpawned < 16; i++) {
            const sp = this.particles[i];
            if (sp.active) continue;
            sp.active = true;
            sp.x = subX;
            sp.y = subY;
            sp.z = subZ;
            const u = Math.random();
            const v = Math.random();
            const th = u * 2.0 * Math.PI;
            const ph = Math.acos(2.0 * v - 1.0);
            const spd = (3.5 + Math.random() * 5.5) * rocket.sizeFactor;
            sp.vx = spd * Math.sin(ph) * Math.cos(th);
            sp.vy = spd * Math.cos(ph);
            sp.vz = spd * Math.sin(ph) * Math.sin(th);
            sp.colorR = rocket.secondaryColor.r;
            sp.colorG = rocket.secondaryColor.g;
            sp.colorB = rocket.secondaryColor.b;
            sp.alpha = 1.0;
            sp.life = 0;
            sp.maxLife = 1.1 + Math.random() * 0.4;
            sp.size = 2.2 * rocket.sizeFactor;
            sp.gravity = -4.2;
            sp.drag = 0.96;
            sp.sparkle = true;
            inSpawned++;
          }
        }
      }, 240);
    }
  }

  /**
   * System Lifecycle: update(deltaTime)
   * Updates flight physics, spark trails, particle decay, and dynamic lights.
   */
  public update(delta: number) {
    if (!this.isRunning) return;

    this.celebrationTime += delta;

    // 1. Process Choreographed Timeline Steps
    for (const step of this.queuedSteps) {
      if (!step.executed && this.celebrationTime >= step.time) {
        step.executed = true;
        step.run();
      }
    }

    // 2. Update Active Rockets (Ascending with glowing trail & apex slowdown)
    for (const r of this.rockets) {
      if (!r.active) continue;

      const remainingDist = r.totalDist - r.traveledDist;
      // Decelerate smoothly near apex
      const decel = Math.min(Math.max(remainingDist / 8.0, 0.42), 1.0);
      const stepDist = r.speed * decel * delta;

      r.traveledDist += stepDist;
      r.x += r.dirX * stepDist;
      r.y += r.dirY * stepDist;
      r.z += r.dirZ * stepDist;
      r.sparkTimer += delta;

      // Rocket Glowing Spark Trail
      if (r.sparkTimer > 0.02) {
        r.sparkTimer = 0;
        const trailP = this.particles.find((p) => !p.active);
        if (trailP) {
          trailP.active = true;
          trailP.x = r.x + (Math.random() - 0.5) * 0.25;
          trailP.y = r.y - 0.2;
          trailP.z = r.z + (Math.random() - 0.5) * 0.25;
          trailP.vx = -r.dirX * 2.0 + (Math.random() - 0.5) * 0.6;
          trailP.vy = -r.dirY * 2.0 + (Math.random() - 0.5) * 0.6;
          trailP.vz = -r.dirZ * 2.0 + (Math.random() - 0.5) * 0.6;
          trailP.colorR = r.color.r * 0.9 + 0.1;
          trailP.colorG = r.color.g * 0.85 + 0.1;
          trailP.colorB = r.color.b * 0.7 + 0.1;
          trailP.alpha = 0.9;
          trailP.life = 0;
          trailP.maxLife = 0.32;
          trailP.size = 2.4;
          trailP.gravity = -2;
          trailP.drag = 0.97;
          trailP.sparkle = false;
        }
      }

      // Detonate at target apex
      if (r.traveledDist >= r.totalDist || r.y >= r.targetY) {
        r.active = false;
        this.createExplosion(r);
      }
    }

    // 3. Update Active Particles
    let activeCount = 0;
    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.particles[i];
      if (!p.active) continue;

      p.life += delta;
      if (p.life >= p.maxLife) {
        p.active = false;
        this.positions[i * 3 + 1] = -100;
        this.sizes[i] = 0;
        continue;
      }

      activeCount++;

      // Physics
      p.vx *= p.drag;
      p.vy = (p.vy + p.gravity * delta) * p.drag;
      p.vz *= p.drag;

      p.x += p.vx * delta;
      p.y += p.vy * delta;
      p.z += p.vz * delta;

      const progress = p.life / p.maxLife;
      const alpha = 1.0 - progress * progress;

      this.positions[i * 3] = p.x;
      this.positions[i * 3 + 1] = p.y;
      this.positions[i * 3 + 2] = p.z;

      // Color decay & sparkle
      const sparkleVal = p.sparkle && progress > 0.45 ? (Math.random() > 0.25 ? 1.0 : 0.15) : 1.0;
      this.colors[i * 3] = p.colorR * alpha * sparkleVal;
      this.colors[i * 3 + 1] = p.colorG * alpha * sparkleVal;
      this.colors[i * 3 + 2] = p.colorB * alpha * sparkleVal;

      this.sizes[i] = p.size * (1.0 - progress * 0.45);
    }

    if (activeCount > 0 || this.particleGeo.attributes.position.needsUpdate) {
      this.particleGeo.attributes.position.needsUpdate = true;
      this.particleGeo.attributes.color.needsUpdate = true;
      this.particleGeo.attributes.size.needsUpdate = true;
    }

    // 4. Smooth decay of dynamic environmental lights
    this.flashLights.forEach((light, idx) => {
      if (this.flashTargets[idx] > 0) {
        light.intensity = this.flashTargets[idx];
        this.flashTargets[idx] = THREE.MathUtils.lerp(this.flashTargets[idx], 0, delta * 4.8);
      }
    });
  }

  /**
   * System Lifecycle: stopCelebration()
   * Automatically finishes automatic show after 15s.
   * Lets existing particles finish, stops fireworks audio, and returns to serene market ambience.
   */
  public stopCelebration() {
    this.isCelebrationActive = false;
    promptifyAudio.stopCelebrationMusic();
    console.log('[Promptify] PromptifyFireworks: stopCelebration() finished');

    if (this.onCelebrationFinished) {
      this.onCelebrationFinished();
    }
  }

  /**
   * System Lifecycle: dispose()
   */
  public dispose() {
    this.stopCelebration();
    this.isRunning = false;
    this.fireworksAudio.dispose();

    this.flashLights.forEach((l) => {
      if (l.parent) l.parent.remove(l);
    });
    if (this.particleMesh.parent) {
      this.particleMesh.parent.remove(this.particleMesh);
    }
    this.particleGeo.dispose();
    this.particleMat.dispose();
  }
}
