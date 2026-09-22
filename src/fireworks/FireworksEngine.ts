import * as THREE from 'three';
import { FireworksAudio } from './FireworksAudio';
import { ExplosionPatterns, ExplosionPatternType } from './ExplosionPatterns';

export interface FireworksEvents {
  onLaunch?: (info: { x: number; y: number; z: number; color: number; pattern: ExplosionPatternType }) => void;
  onExplosion?: (info: { x: number; y: number; z: number; pattern: ExplosionPatternType; isUser: boolean }) => void;
  onSecondaryExplosion?: (info: { x: number; y: number; z: number }) => void;
  onFinale?: () => void;
}

interface Particle {
  active: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  r: number;
  g: number;
  b: number;
  alpha: number;
  size: number;
  life: number;
  maxLife: number;
  gravity: number;
  drag: number;
  sparkle: boolean;
  isSecondarySeed?: boolean;
  secondaryTriggered?: boolean;
  secondaryDelay?: number;
}

interface Rocket {
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
  pattern: ExplosionPatternType;
  sparkTimer: number;
  isUserTriggered: boolean;
}

interface FlashLight {
  light: THREE.PointLight;
  intensity: number;
  decayRate: number;
}

export class FireworksEngine {
  private container: HTMLElement;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public audio: FireworksAudio;
  public events: FireworksEvents = {};

  private isRunning: boolean = false;
  private animId: number | null = null;
  private lastTime: number = 0;

  // Particle System
  private maxParticles = 4000;
  private particles: Particle[] = [];
  private positions!: Float32Array;
  private colors!: Float32Array;
  private sizes!: Float32Array;
  private particleGeo!: THREE.BufferGeometry;
  private particleMat!: THREE.PointsMaterial;
  private particleMesh!: THREE.Points;
  private particleTex!: THREE.CanvasTexture;

  // Twinkling Starfield Backdrop (Pure Three.js)
  private starMesh!: THREE.Points;
  private starGeo!: THREE.BufferGeometry;
  private starMat!: THREE.PointsMaterial;

  // Dynamic Explosion Point Lights (pool of 4 lights for brief realistic flash)
  private flashLights: FlashLight[] = [];
  private ambientLight!: THREE.AmbientLight;
  private ambientBaseIntensity = 0.08;

  // Rocket Pool
  private maxRockets = 32;
  private rockets: Rocket[] = [];

  // Show Sequencing
  private showTime: number = 0;
  private autoShowEnabled: boolean = true;
  private nextAutoLaunchTime: number = 0.1;
  private scheduledStepIndex: number = 0;

  // Camera & Shake
  private baseCameraPos: THREE.Vector3 = new THREE.Vector3(0, 0, 48);
  private cameraShakeIntensity: number = 0;

  // Vibrant Fireworks Color Palette
  public static readonly COLORS = {
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

  private colorPalette: number[] = [
    FireworksEngine.COLORS.gold,
    FireworksEngine.COLORS.neonPink,
    FireworksEngine.COLORS.electricBlue,
    FireworksEngine.COLORS.cyan,
    FireworksEngine.COLORS.orange,
    FireworksEngine.COLORS.purple,
    FireworksEngine.COLORS.green,
    FireworksEngine.COLORS.red,
    FireworksEngine.COLORS.white,
  ];

  // Event Listeners bound references for clean disposal
  private onWindowResizeBound = this.onWindowResize.bind(this);
  private onPointerDownBound = this.onPointerDown.bind(this);

  constructor(container: HTMLElement, events?: FireworksEvents) {
    this.container = container;
    if (events) this.events = events;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Three.js Scene Setup (Deep midnight sky)
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x040612);

    // 2. Cinematic Perspective Camera
    this.camera = new THREE.PerspectiveCamera(58, width / height, 0.1, 1000);
    this.camera.position.copy(this.baseCameraPos);

    // 3. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: true,
      alpha: false,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35;
    this.container.appendChild(this.renderer.domElement);

    // 4. Audio Synthesizer
    this.audio = new FireworksAudio();

    // 5. Build Subsystems
    this.initLighting();
    this.initStarfield();
    this.initParticles();
    this.initRockets();

    // 6. Bind Interactions
    window.addEventListener('resize', this.onWindowResizeBound);
    this.container.addEventListener('pointerdown', this.onPointerDownBound);

    // 7. Start Animation Loop
    this.isRunning = true;
    this.lastTime = performance.now();
    this.animate();
  }

  // --- Dynamic Lighting ---
  private initLighting() {
    this.ambientLight = new THREE.AmbientLight(0x1a2238, this.ambientBaseIntensity);
    this.scene.add(this.ambientLight);

    // Pool of 4 short-lived point lights for detonation illumination
    for (let i = 0; i < 4; i++) {
      const pl = new THREE.PointLight(0xffffff, 0, 85, 1.8);
      pl.position.set(0, 0, 10);
      this.scene.add(pl);
      this.flashLights.push({ light: pl, intensity: 0, decayRate: 3.5 });
    }
  }

  private flashLightAt(x: number, y: number, z: number, color: THREE.Color, intensity: number = 3.0) {
    // Find first available or lowest-intensity light
    let best = this.flashLights[0];
    for (const fl of this.flashLights) {
      if (fl.intensity < best.intensity) {
        best = fl;
      }
    }
    best.light.position.set(x, y, z);
    best.light.color.copy(color);
    best.intensity = intensity;
    best.light.intensity = intensity;

    // Subtle ambient flash
    this.ambientLight.intensity = Math.min(0.45, this.ambientBaseIntensity + intensity * 0.08);
  }

  // --- Distant Starfield ---
  private initStarfield() {
    const starCount = 1800;
    this.starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const r = 240 + Math.random() * 80;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 0.95); // Mostly overhead & skyward
      starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = r * Math.cos(phi) - 20;
      starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta) - 40;

      const brightness = 0.45 + Math.random() * 0.55;
      starColors[i * 3] = brightness * (0.8 + Math.random() * 0.2);
      starColors[i * 3 + 1] = brightness * (0.85 + Math.random() * 0.15);
      starColors[i * 3 + 2] = brightness;
    }

    this.starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    this.starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    this.starMat = new THREE.PointsMaterial({
      size: 1.6,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.starMesh = new THREE.Points(this.starGeo, this.starMat);
    this.scene.add(this.starMesh);
  }

  // --- Procedural Glow Texture & Particle Setup ---
  private createGlowTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
    grad.addColorStop(0.18, 'rgba(255, 255, 255, 0.95)');
    grad.addColorStop(0.45, 'rgba(255, 230, 180, 0.65)');
    grad.addColorStop(0.75, 'rgba(255, 180, 100, 0.2)');
    grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }

  private initParticles() {
    this.positions = new Float32Array(this.maxParticles * 3);
    this.colors = new Float32Array(this.maxParticles * 3);
    this.sizes = new Float32Array(this.maxParticles);

    this.particles = [];
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push({
        active: false,
        x: 0,
        y: -1000,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        r: 1,
        g: 1,
        b: 1,
        alpha: 0,
        size: 0,
        life: 0,
        maxLife: 1,
        gravity: -5,
        drag: 0.96,
        sparkle: false,
      });
      this.positions[i * 3] = 0;
      this.positions[i * 3 + 1] = -1000;
      this.positions[i * 3 + 2] = 0;
      this.colors[i * 3] = 1;
      this.colors[i * 3 + 1] = 1;
      this.colors[i * 3 + 2] = 1;
      this.sizes[i] = 0;
    }

    this.particleGeo = new THREE.BufferGeometry();
    this.particleGeo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.particleGeo.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.particleGeo.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));

    this.particleTex = this.createGlowTexture();

    this.particleMat = new THREE.PointsMaterial({
      size: 4.8,
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      map: this.particleTex,
      depthWrite: false,
      depthTest: true,
    });

    this.particleMesh = new THREE.Points(this.particleGeo, this.particleMat);
    this.particleMesh.frustumCulled = false;
    this.scene.add(this.particleMesh);
  }

  private initRockets() {
    this.rockets = [];
    for (let i = 0; i < this.maxRockets; i++) {
      this.rockets.push({
        active: false,
        startX: 0,
        startY: -24,
        startZ: 0,
        x: 0,
        y: -24,
        z: 0,
        targetX: 0,
        targetY: 10,
        targetZ: 0,
        dirX: 0,
        dirY: 1,
        dirZ: 0,
        totalDist: 34,
        traveledDist: 0,
        speed: 38,
        color: new THREE.Color(0xffd700),
        secondaryColor: new THREE.Color(0xffffff),
        sizeFactor: 1.0,
        pattern: 'chrysanthemum',
        sparkTimer: 0,
        isUserTriggered: false,
      });
    }
  }

  // --- Rocket Launching ---
  public launchRocket(
    startX: number,
    startY: number,
    startZ: number,
    targetX: number,
    targetY: number,
    targetZ: number,
    pattern?: ExplosionPatternType,
    primaryColorHex?: number,
    secondaryColorHex?: number,
    sizeFactor: number = 1.0,
    isUserTriggered: boolean = false
  ): boolean {
    const freeRocket = this.rockets.find((r) => !r.active);
    if (!freeRocket) return false;

    freeRocket.active = true;
    freeRocket.startX = startX;
    freeRocket.startY = startY;
    freeRocket.startZ = startZ;
    freeRocket.x = startX;
    freeRocket.y = startY;
    freeRocket.z = startZ;
    freeRocket.targetX = targetX;
    freeRocket.targetY = targetY;
    freeRocket.targetZ = targetZ;

    const dx = targetX - startX;
    const dy = targetY - startY;
    const dz = targetZ - startZ;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    freeRocket.totalDist = dist > 0 ? dist : 1;
    freeRocket.traveledDist = 0;
    freeRocket.dirX = dx / freeRocket.totalDist;
    freeRocket.dirY = dy / freeRocket.totalDist;
    freeRocket.dirZ = dz / freeRocket.totalDist;
    freeRocket.speed = (32 + Math.random() * 12) * (isUserTriggered ? 1.25 : 1.0);

    // Color assignment
    const pColHex = primaryColorHex ?? this.colorPalette[Math.floor(Math.random() * this.colorPalette.length)];
    const sColHex = secondaryColorHex ?? this.colorPalette[Math.floor(Math.random() * this.colorPalette.length)];
    freeRocket.color.setHex(pColHex);
    freeRocket.secondaryColor.setHex(sColHex);

    freeRocket.sizeFactor = sizeFactor;
    freeRocket.pattern = pattern ?? ExplosionPatterns.getRandomPattern();
    freeRocket.sparkTimer = 0;
    freeRocket.isUserTriggered = isUserTriggered;

    // Launch whistle audio
    this.audio.playLaunch(freeRocket.sizeFactor);

    // Event Hook
    if (this.events.onLaunch) {
      this.events.onLaunch({
        x: startX,
        y: startY,
        z: startZ,
        color: pColHex,
        pattern: freeRocket.pattern,
      });
    }

    return true;
  }

  // --- Interactive Pointer Down (Click & Tap to Blast) ---
  private onPointerDown(event: PointerEvent) {
    const rect = this.container.getBoundingClientRect();
    const clientX = event.clientX - rect.left;
    const clientY = event.clientY - rect.top;

    // Normalized Device Coordinates (-1 to +1)
    const ndcX = (clientX / rect.width) * 2 - 1;
    const ndcY = -(clientY / rect.height) * 2 + 1;

    // Unproject to 3D world plane at Z = (Math.random() - 0.5) * 12
    const targetZ = (Math.random() - 0.5) * 12;
    const vector = new THREE.Vector3(ndcX, ndcY, 0.5);
    vector.unproject(this.camera);
    vector.sub(this.camera.position).normalize();

    const distance = (targetZ - this.camera.position.z) / vector.z;
    const targetPos = this.camera.position.clone().add(vector.multiplyScalar(distance));

    // Clamp Y to comfortable sky altitude
    const clampedY = Math.max(-2, Math.min(26, targetPos.y));
    const clampedX = Math.max(-28, Math.min(28, targetPos.x));

    // Launch rocket from bottom right below or angled toward target
    const startX = clampedX * 0.45 + (Math.random() - 0.5) * 10;
    const startY = -22;
    const startZ = targetZ + (Math.random() - 0.5) * 4;

    this.launchRocket(
      startX,
      startY,
      startZ,
      clampedX,
      clampedY,
      targetZ,
      undefined, // random pattern
      undefined, // random color
      undefined,
      1.35,      // Larger explosion for user clicks
      true       // User-triggered
    );
  }

  // --- Auto Show Sequence ---
  private updateAutoShow(delta: number) {
    if (!this.autoShowEnabled) return;

    this.showTime += delta;

    // Dynamic Scripted Opening Sequence
    const scheduledEvents: { time: number; run: () => void }[] = [
      {
        time: 0.05,
        run: () => {
          this.launchRocket(0, -22, 0, (Math.random() - 0.5) * 6, 12, 0, 'chrysanthemum', FireworksEngine.COLORS.gold, FireworksEngine.COLORS.white, 1.45);
        },
      },
      {
        time: 1.0,
        run: () => {
          this.launchRocket(-16, -22, -4, -14, 15, -2, 'spherical', FireworksEngine.COLORS.electricBlue, FireworksEngine.COLORS.cyan, 1.25);
        },
      },
      {
        time: 1.8,
        run: () => {
          this.launchRocket(14, -22, 2, 12, 14, 2, 'star', FireworksEngine.COLORS.neonPink, FireworksEngine.COLORS.purple, 1.3);
        },
      },
      {
        time: 2.5,
        run: () => {
          this.launchRocket(-10, -22, 4, -8, 16, 6, 'ring', FireworksEngine.COLORS.cyan, FireworksEngine.COLORS.white, 1.2);
          this.launchRocket(12, -22, -6, 10, 18, -4, 'double-ring', FireworksEngine.COLORS.orange, FireworksEngine.COLORS.red, 1.3);
        },
      },
      {
        time: 3.6,
        run: () => {
          this.launchRocket(0, -22, 0, 0, 15, 0, 'heart', FireworksEngine.COLORS.neonPink, FireworksEngine.COLORS.gold, 1.4);
        },
      },
      {
        time: 4.8,
        run: () => {
          this.launchRocket(-18, -22, -2, -15, 14, 0, 'spiral', FireworksEngine.COLORS.green, FireworksEngine.COLORS.gold, 1.35);
          this.launchRocket(0, -22, 2, 2, 18, 2, 'multi-stage', FireworksEngine.COLORS.electricBlue, FireworksEngine.COLORS.neonPink, 1.5);
          this.launchRocket(18, -22, -4, 16, 13, -2, 'golden-shower', FireworksEngine.COLORS.gold, FireworksEngine.COLORS.white, 1.4);
        },
      },
    ];

    while (this.scheduledStepIndex < scheduledEvents.length && this.showTime >= scheduledEvents[this.scheduledStepIndex].time) {
      scheduledEvents[this.scheduledStepIndex].run();
      this.scheduledStepIndex++;
    }

    // Ongoing dynamic randomized rhythm after opening sequence
    if (this.showTime >= 5.8) {
      if (this.showTime >= this.nextAutoLaunchTime) {
        const startX = (Math.random() - 0.5) * 36;
        const startY = -22;
        const startZ = (Math.random() - 0.5) * 16;

        const targetX = (Math.random() - 0.5) * 44;
        const targetY = 7 + Math.random() * 16;
        const targetZ = (Math.random() - 0.5) * 20;

        this.launchRocket(startX, startY, startZ, targetX, targetY, targetZ);

        // Occasional double salvo
        if (Math.random() > 0.6) {
          setTimeout(() => {
            if (this.isRunning) {
              this.launchRocket(
                startX + (Math.random() - 0.5) * 10,
                startY,
                startZ,
                targetX + (Math.random() - 0.5) * 12,
                targetY + (Math.random() - 0.5) * 4,
                targetZ
              );
            }
          }, 180 + Math.random() * 220);
        }

        this.nextAutoLaunchTime = this.showTime + (0.8 + Math.random() * 0.95);
      }
    }
  }

  // --- Create 3D Explosion Burst ---
  public createExplosion(rocket: Rocket) {
    const isUser = rocket.isUserTriggered;
    const baseCount = isUser ? 260 : 180;
    const particleCount = Math.floor(baseCount * rocket.sizeFactor);
    let spawned = 0;

    // Detonation sound
    this.audio.playExplosion(rocket.sizeFactor, isUser);

    // Dynamic point light flash
    this.flashLightAt(rocket.x, rocket.y, rocket.z, rocket.color, 3.2 * rocket.sizeFactor);

    // Camera shake
    this.triggerCameraShake(isUser ? 0.38 : 0.16);

    // Event Hook
    if (this.events.onExplosion) {
      this.events.onExplosion({
        x: rocket.x,
        y: rocket.y,
        z: rocket.z,
        pattern: rocket.pattern,
        isUser,
      });
    }

    const sizeFac = rocket.sizeFactor;
    const primColor = { r: rocket.color.r, g: rocket.color.g, b: rocket.color.b };
    const secColor = { r: rocket.secondaryColor.r, g: rocket.secondaryColor.g, b: rocket.secondaryColor.b };

    for (let i = 0; i < this.maxParticles && spawned < particleCount; i++) {
      const p = this.particles[i];
      if (p.active) continue;

      p.active = true;
      p.x = rocket.x;
      p.y = rocket.y;
      p.z = rocket.z;

      // Kinematics and styling via ExplosionPatterns
      const result = ExplosionPatterns.generateParticle(
        rocket.pattern,
        spawned,
        particleCount,
        sizeFac,
        primColor,
        secColor
      );

      p.vx = result.vx;
      p.vy = result.vy;
      p.vz = result.vz;
      p.gravity = result.gravity;
      p.drag = result.drag;
      p.maxLife = result.maxLife;
      p.sparkle = result.sparkle ?? false;

      if (result.colorOverride) {
        p.r = result.colorOverride.r;
        p.g = result.colorOverride.g;
        p.b = result.colorOverride.b;
      } else {
        p.r = primColor.r;
        p.g = primColor.g;
        p.b = primColor.b;
      }

      p.life = 0;
      p.alpha = 1.0;
      p.size = (3.6 + Math.random() * 2.8) * sizeFac;

      // Multi-stage secondary explosion seed
      p.isSecondarySeed = result.isSecondarySeed ?? false;
      p.secondaryTriggered = false;
      p.secondaryDelay = 0.45 + Math.random() * 0.35;

      spawned++;
    }
  }

  // --- Trigger Secondary Mini-Explosion ---
  public triggerSecondaryBurst(x: number, y: number, z: number, r: number, g: number, b: number) {
    this.audio.playSecondaryExplosion(0.85);

    if (this.events.onSecondaryExplosion) {
      this.events.onSecondaryExplosion({ x, y, z });
    }

    const subCount = 28;
    let spawned = 0;

    for (let i = 0; i < this.maxParticles && spawned < subCount; i++) {
      const p = this.particles[i];
      if (p.active) continue;

      p.active = true;
      p.x = x;
      p.y = y;
      p.z = z;

      const angle = Math.random() * Math.PI * 2;
      const spd = 4.5 + Math.random() * 6.5;
      p.vx = Math.cos(angle) * spd;
      p.vy = (Math.random() - 0.5) * 4.0;
      p.vz = Math.sin(angle) * spd;
      p.gravity = -4.0;
      p.drag = 0.95;
      p.maxLife = 0.9 + Math.random() * 0.4;
      p.life = 0;
      p.alpha = 1.0;
      p.size = 3.2;
      p.r = r;
      p.g = g;
      p.b = b;
      p.sparkle = true;
      p.isSecondarySeed = false;

      spawned++;
    }
  }

  // --- Spawn Rocket Ascent Glowing Trail ---
  private spawnRocketTrail(r: Rocket) {
    let count = 0;
    for (let i = 0; i < this.maxParticles && count < 2; i++) {
      const p = this.particles[i];
      if (p.active) continue;

      p.active = true;
      p.x = r.x + (Math.random() - 0.5) * 0.35;
      p.y = r.y + (Math.random() - 0.5) * 0.35;
      p.z = r.z + (Math.random() - 0.5) * 0.35;
      p.vx = (Math.random() - 0.5) * 0.9 - r.dirX * 3.5;
      p.vy = (Math.random() - 0.5) * 0.9 - r.dirY * 3.5;
      p.vz = (Math.random() - 0.5) * 0.9 - r.dirZ * 3.5;
      p.r = r.color.r * 1.2;
      p.g = r.color.g * 1.2;
      p.b = r.color.b * 1.2;
      p.alpha = 0.95;
      p.size = 3.0 * r.sizeFactor;
      p.life = 0;
      p.maxLife = 0.32 + Math.random() * 0.16;
      p.gravity = -1.2;
      p.drag = 0.94;
      p.sparkle = true;
      p.isSecondarySeed = false;

      count++;
    }
  }

  private triggerCameraShake(intensity: number) {
    this.cameraShakeIntensity = Math.min(0.85, this.cameraShakeIntensity + intensity);
  }

  // --- Main Animation Update ---
  private animate = () => {
    if (!this.isRunning) return;
    this.animId = requestAnimationFrame(this.animate);

    const now = performance.now();
    const delta = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    // 1. Auto Show Sequencer
    this.updateAutoShow(delta);

    // 2. Subtle Floating Cinematic Camera Movement + Camera Shake
    const time = now * 0.0004;
    const floatX = Math.sin(time * 0.6) * 1.4;
    const floatY = Math.cos(time * 0.4) * 0.9;

    let shakeX = 0;
    let shakeY = 0;
    let shakeZ = 0;
    if (this.cameraShakeIntensity > 0.001) {
      shakeX = (Math.random() - 0.5) * this.cameraShakeIntensity * 1.8;
      shakeY = (Math.random() - 0.5) * this.cameraShakeIntensity * 1.8;
      shakeZ = (Math.random() - 0.5) * this.cameraShakeIntensity * 0.8;
      this.cameraShakeIntensity = Math.max(0, this.cameraShakeIntensity - delta * 2.2);
    }

    this.camera.position.x = this.baseCameraPos.x + floatX + shakeX;
    this.camera.position.y = this.baseCameraPos.y + floatY + shakeY;
    this.camera.position.z = this.baseCameraPos.z + shakeZ;
    this.camera.lookAt(0, 10, 0);

    // 3. Update Dynamic Point Lights
    for (const fl of this.flashLights) {
      if (fl.intensity > 0.01) {
        fl.intensity = Math.max(0, fl.intensity - fl.intensity * fl.decayRate * delta);
        fl.light.intensity = fl.intensity;
      } else {
        fl.light.intensity = 0;
      }
    }
    this.ambientLight.intensity = Math.max(
      this.ambientBaseIntensity,
      this.ambientLight.intensity - (this.ambientLight.intensity - this.ambientBaseIntensity) * 4.0 * delta
    );

    // 4. Update Ascending Rockets
    for (const r of this.rockets) {
      if (!r.active) continue;

      const remainingDist = r.totalDist - r.traveledDist;
      // Realistic deceleration near apex
      const progress = r.traveledDist / r.totalDist;
      const speedFac = progress > 0.65 ? Math.max(0.42, 1.0 - (progress - 0.65) * 1.5) : 1.0;
      const step = r.speed * speedFac * delta;

      r.x += r.dirX * step;
      r.y += r.dirY * step;
      r.z += r.dirZ * step;
      r.traveledDist += step;

      // Spawn glowing trail particles
      r.sparkTimer += delta;
      if (r.sparkTimer > 0.014) {
        this.spawnRocketTrail(r);
        r.sparkTimer = 0;
      }

      // Detonate upon reaching target apex
      if (r.traveledDist >= r.totalDist || remainingDist <= step) {
        r.active = false;
        this.createExplosion(r);
      }
    }

    // 5. Update Particle Dynamics & Geometry Buffers
    let activeParticlesCount = 0;

    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.particles[i];
      const i3 = i * 3;

      if (!p.active) {
        this.positions[i3 + 1] = -1000;
        this.sizes[i] = 0;
        continue;
      }

      activeParticlesCount++;
      p.life += delta;

      if (p.life >= p.maxLife) {
        p.active = false;
        this.positions[i3 + 1] = -1000;
        this.sizes[i] = 0;
        continue;
      }

      // Check for multi-stage secondary explosion trigger
      if (p.isSecondarySeed && !p.secondaryTriggered && p.life >= (p.secondaryDelay ?? 0.5)) {
        p.secondaryTriggered = true;
        this.triggerSecondaryBurst(p.x, p.y, p.z, p.r, p.g, p.b);
      }

      // Physics integration
      p.vx *= Math.pow(p.drag, delta * 60);
      p.vy *= Math.pow(p.drag, delta * 60);
      p.vz *= Math.pow(p.drag, delta * 60);
      p.vy += p.gravity * delta;

      p.x += p.vx * delta;
      p.y += p.vy * delta;
      p.z += p.vz * delta;

      // Opacity fade curve (smooth cubic exit)
      const t = p.life / p.maxLife;
      const fade = Math.max(0, 1.0 - t * t);
      p.alpha = fade;

      // Sparkle/twinkle modulation
      let flicker = 1.0;
      if (p.sparkle && t > 0.3) {
        flicker = Math.random() > 0.25 ? 1.25 : 0.45;
      }

      this.positions[i3] = p.x;
      this.positions[i3 + 1] = p.y;
      this.positions[i3 + 2] = p.z;

      this.colors[i3] = p.r * fade * flicker;
      this.colors[i3 + 1] = p.g * fade * flicker;
      this.colors[i3 + 2] = p.b * fade * flicker;

      this.sizes[i] = p.size * (0.4 + 0.6 * fade);
    }

    this.particleGeo.attributes.position.needsUpdate = true;
    this.particleGeo.attributes.color.needsUpdate = true;
    this.particleGeo.attributes.size.needsUpdate = true;

    // 6. Render Frame
    this.renderer.render(this.scene, this.camera);
  };

  // --- Window Resize ---
  private onWindowResize() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  // --- Clean Up Resources ---
  public dispose() {
    this.isRunning = false;
    if (this.animId !== null) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }

    window.removeEventListener('resize', this.onWindowResizeBound);
    this.container.removeEventListener('pointerdown', this.onPointerDownBound);

    // Audio cleanup
    this.audio.dispose();

    // Scene & Objects cleanup
    if (this.particleMesh) this.scene.remove(this.particleMesh);
    if (this.starMesh) this.scene.remove(this.starMesh);

    if (this.particleGeo) this.particleGeo.dispose();
    if (this.particleMat) this.particleMat.dispose();
    if (this.particleTex) this.particleTex.dispose();

    if (this.starGeo) this.starGeo.dispose();
    if (this.starMat) this.starMat.dispose();

    for (const fl of this.flashLights) {
      this.scene.remove(fl.light);
      fl.light.dispose();
    }
    this.flashLights = [];

    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
    }
  }
}
