import * as THREE from 'three';
import { SanctuaryEventData, SanctuaryEventId } from '../types';
import { bellSoundController } from './BellSoundController';

export const SANCTUARY_EVENTS: SanctuaryEventData[] = [
  {
    id: 'tech-treasure-hunt',
    name: "The Killer's Trail",
    kanji: '殺人鬼の足跡',
    tagline: 'Fuji Panoramic Overlook',
    position: { x: -32.0, y: 0.7, z: 0.0 },
    color: 0xf59e0b, // Amber gold
    colorHex: '#f59e0b',
  },
  {
    id: 'promptify',
    name: 'Promptify',
    kanji: '詠唱',
    tagline: 'Sacred Torii Sakura Grove',
    position: { x: 0.0, y: 0.7, z: 30.0 },
    color: 0xc084fc, // Ethereal purple
    colorHex: '#c084fc',
  },
  {
    id: 'logic-lamps',
    name: 'Logic Lamps',
    kanji: '論理灯',
    tagline: 'Moon Pavilion & Pagoda Gardens',
    position: { x: 33.0, y: 1.5, z: 1.0 },
    color: 0x34d399, // Sacred emerald/teal
    colorHex: '#34d399',
  },
];

export class Environment {
  public scene: THREE.Scene;
  public colliders: { minX: number; maxX: number; minZ: number; maxZ: number; height: number }[] = [];
  public petalParticles!: THREE.Points;
  private petalPositions!: Float32Array;
  private petalSpeeds!: Float32Array;
  private petalCount = 120;
  private lanternLights: THREE.PointLight[] = [];
  private eventWaypointObjects: {
    group: THREE.Group;
    orb: THREE.Mesh;
    ring1: THREE.Mesh;
    ring2: THREE.Mesh;
    beam: THREE.Mesh;
    light: THREE.PointLight;
    groundRune: THREE.Mesh;
    baseY: number;
  }[] = [];

  // Japanese Night Sky & Celestial Objects
  public starParticles!: THREE.Points;
  public moonMesh!: THREE.Mesh;
  public moonGlow!: THREE.Mesh;

  // Bioluminescent Night Fireflies (Hotaru)
  private fireflyParticles!: THREE.Points;
  private fireflyPositions!: Float32Array;
  private fireflyBaseY!: Float32Array;
  private fireflyCount = 75;

  // Japanese Temple Bell (Bonshō - 梵鐘) & Belfry Pavilion (Shōrō)
  public templeBellGroup!: THREE.Group;
  public bonshoBellGroup!: THREE.Group;
  public bonshoStriker!: THREE.Group;
  public shockwaveRing!: THREE.Mesh;
  public bellLight!: THREE.PointLight;
  private bellRingTimer: number = -1;

  public activeEventIds: SanctuaryEventId[];

  constructor(scene: THREE.Scene, activeEventIds: SanctuaryEventId[] = ['tech-treasure-hunt']) {
    this.scene = scene;
    this.activeEventIds = activeEventIds;
    this.setupLighting();
    this.createSkyAndBackdrop();
    this.createMountFuji();
    this.createTerrainAndCourtyard();
    this.createChureitoPagoda();
    this.createWestOverlookPlatform();
    this.createToriiGatePassage();
    this.createMoonPavilion();
    this.createSakuraTrees();
    this.createStoneLanterns();
    this.createWoodenRailings();
    this.createSakuraPetalSystem();
    this.createTempleBellPavilion();
    this.createNightFireflies();
    this.createPagodaUplighting();
    this.createHangingChōchinLanterns();
    this.createEventWaypoints();
    this.createStationDepartureGate();
  }

  /**
   * Japanese Night Lighting:
   * Optimized for smooth 60 FPS performance with deep atmospheric moonlight
   */
  private setupLighting() {
    // Ambient light — bright enough to see the scene clearly, rich moonlit indigo-slate
    // This prevents any pitch-black areas while keeping the night-time atmosphere
    const ambientLight = new THREE.AmbientLight(0x4a5c82, 2.0);
    this.scene.add(ambientLight);

    // Primary Moonlight — positioned in front of the scene so it illuminates faces
    // and terraces. cool silver-blue directional light from above-right
    const moonDirLight = new THREE.DirectionalLight(0xd4e2fc, 2.2);
    moonDirLight.position.set(25, 75, 35);
    moonDirLight.castShadow = true;
    moonDirLight.shadow.mapSize.width = 1024;
    moonDirLight.shadow.mapSize.height = 1024;
    moonDirLight.shadow.camera.near = 0.5;
    moonDirLight.shadow.camera.far = 240;
    moonDirLight.shadow.camera.left = -60;
    moonDirLight.shadow.camera.right = 60;
    moonDirLight.shadow.camera.top = 60;
    moonDirLight.shadow.camera.bottom = -60;
    moonDirLight.shadow.bias = -0.0005;
    this.scene.add(moonDirLight);

    // Soft fill light from the opposite valley — lifts shadows off the ground
    const fillLight = new THREE.DirectionalLight(0x566d96, 1.0);
    fillLight.position.set(-35, 45, -45);
    this.scene.add(fillLight);

    // Softer fog density so you can see further into the night mist
    this.scene.fog = new THREE.FogExp2(0x18243b, 0.0068);
  }

  /**
   * Japanese Night Sky:
   * Deep starry indigo celestial sphere with glowing silver Moon & lunar halo
   */
  private createSkyAndBackdrop() {
    const skyGeo = new THREE.SphereGeometry(350, 32, 24);
    
    // Luminous midnight sky — clearly a night sky but with visible depth
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, '#060e1f');   // Deep zenith midnight
    grad.addColorStop(0.3, '#0e1e38'); // Rich celestial indigo
    grad.addColorStop(0.6, '#162a4f'); // Moonlit navy blue
    grad.addColorStop(0.82, '#1e3660');// Warmer horizon indigo
    grad.addColorStop(1.0, '#18243b'); // Ground-meeting night mist
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    const skyTex = new THREE.CanvasTexture(canvas);
    const skyMat = new THREE.MeshBasicMaterial({
      map: skyTex,
      side: THREE.BackSide,
      fog: false,
    });
    const skyMesh = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(skyMesh);

    // 1. Starfield across the celestial sphere
    const starCount = 750;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 340;
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = Math.abs(r * Math.cos(phi)) + 15; // Upper celestial dome
      const z = r * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3] = x;
      starPositions[i * 3 + 1] = y;
      starPositions[i * 3 + 2] = z;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));

    // Star point sprite texture
    const starCanvas = document.createElement('canvas');
    starCanvas.width = 64;
    starCanvas.height = 64;
    const sCtx = starCanvas.getContext('2d')!;
    const sGrad = sCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
    sGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    sGrad.addColorStop(0.35, 'rgba(224, 242, 254, 0.85)');
    sGrad.addColorStop(0.8, 'rgba(147, 197, 253, 0.2)');
    sGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    sCtx.fillStyle = sGrad;
    sCtx.fillRect(0, 0, 64, 64);
    const starTex = new THREE.CanvasTexture(starCanvas);

    const starMat = new THREE.PointsMaterial({
      size: 2.4,
      map: starTex,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.starParticles = new THREE.Points(starGeo, starMat);
    this.scene.add(this.starParticles);

    // 2. Majestic Luminous Moon in the night sky
    const moonGroup = new THREE.Group();
    moonGroup.position.set(-45, 95, -75);

    // Glowing Moon Sphere
    const moonGeo = new THREE.SphereGeometry(6.5, 32, 32);
    const moonMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      emissive: 0xdbeafe,
      emissiveIntensity: 0.92,
      roughness: 0.3,
    });
    this.moonMesh = new THREE.Mesh(moonGeo, moonMat);
    moonGroup.add(this.moonMesh);

    // Moon Glow Halo Billboard
    const haloCanvas = document.createElement('canvas');
    haloCanvas.width = 128;
    haloCanvas.height = 128;
    const hCtx = haloCanvas.getContext('2d')!;
    const hGrad = hCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
    hGrad.addColorStop(0, 'rgba(224, 242, 254, 0.85)');
    hGrad.addColorStop(0.25, 'rgba(186, 230, 253, 0.45)');
    hGrad.addColorStop(0.65, 'rgba(125, 211, 252, 0.12)');
    hGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    hCtx.fillStyle = hGrad;
    hCtx.fillRect(0, 0, 128, 128);
    const haloTex = new THREE.CanvasTexture(haloCanvas);

    const haloGeo = new THREE.PlaneGeometry(44, 44);
    const haloMat = new THREE.MeshBasicMaterial({
      map: haloTex,
      transparent: true,
      opacity: 0.78,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.moonGlow = new THREE.Mesh(haloGeo, haloMat);
    moonGroup.add(this.moonGlow);

    this.scene.add(moonGroup);

    // Nocturnal cloud layer drifting in the valley with silver moonlit rims
    const cloudMat = new THREE.MeshBasicMaterial({
      color: 0x141d30,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    });
    for (let i = 0; i < 24; i++) {
      const cloudW = 28 + Math.random() * 35;
      const cloudH = 6 + Math.random() * 8;
      const cloudGeo = new THREE.BoxGeometry(cloudW, cloudH, 20);
      const cloud = new THREE.Mesh(cloudGeo, cloudMat);
      const angle = (i / 24) * Math.PI * 0.7 + 0.9;
      const dist = 110 + Math.random() * 40;
      cloud.position.set(Math.cos(angle) * dist, 8 + Math.random() * 10, Math.sin(angle) * dist);
      cloud.rotation.y = angle + Math.PI / 2;
      this.scene.add(cloud);
    }
  }

  /**
   * Majestic Mount Fuji in the background
   */
  private createMountFuji() {
    const fujiGroup = new THREE.Group();
    // Positioned in distance directly behind the scenic overlook view
    fujiGroup.position.set(0, -5, -170);

    // Dark volcanic slate base
    const mountainMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.95,
      metalness: 0.05,
      flatShading: true,
    });

    // Snow cap material
    const snowMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.4,
      metalness: 0.1,
      flatShading: true,
    });

    // Volcanic cone geometry with custom sloping profile
    const coneRadius = 90;
    const coneHeight = 110;
    const fujiGeo = new THREE.ConeGeometry(coneRadius, coneHeight, 36, 16, true);
    
    // Deform cone vertices to give Mt. Fuji's iconic graceful concave curve and crater dip
    const pos = fujiGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const x = pos.getX(i);
      const z = pos.getZ(i);

      // Height ratio: 0 (bottom) to 1 (top)
      const hNorm = (y + coneHeight / 2) / coneHeight;
      // Exponential curve for classic Fuji silhouette
      const radiusFactor = Math.pow(1 - hNorm, 1.35);
      
      const r = Math.sqrt(x * x + z * z);
      if (r > 0.001) {
        const angle = Math.atan2(z, x);
        const newR = coneRadius * radiusFactor * (0.95 + Math.sin(angle * 7) * 0.03);
        pos.setX(i, Math.cos(angle) * newR);
        pos.setZ(i, Math.sin(angle) * newR);
      }
      
      // Top crater indentation
      if (hNorm > 0.95) {
        pos.setY(i, y - (hNorm - 0.95) * 12);
      }
    }
    fujiGeo.computeVertexNormals();

    const mountainMesh = new THREE.Mesh(fujiGeo, mountainMat);
    mountainMesh.position.y = coneHeight / 2;
    fujiGroup.add(mountainMesh);

    // Snow Cap overlay with ragged serrated edge
    const snowHeight = 44;
    const snowGeo = new THREE.ConeGeometry(42, snowHeight, 32, 10, true);
    const snowPos = snowGeo.attributes.position;
    for (let i = 0; i < snowPos.count; i++) {
      const y = snowPos.getY(i);
      const x = snowPos.getX(i);
      const z = snowPos.getZ(i);
      const hNorm = (y + snowHeight / 2) / snowHeight;
      const radiusFactor = Math.pow(1 - hNorm, 1.25);
      const r = Math.sqrt(x * x + z * z);
      if (r > 0.001) {
        const angle = Math.atan2(z, x);
        // Jagged snow channels / snow gullies
        const gully = Math.sin(angle * 9) * 0.12 + Math.cos(angle * 13) * 0.08;
        const newR = 42 * radiusFactor * (1 + gully);
        snowPos.setX(i, Math.cos(angle) * newR);
        snowPos.setZ(i, Math.sin(angle) * newR);
      }
    }
    snowGeo.computeVertexNormals();

    const snowMesh = new THREE.Mesh(snowGeo, snowMat);
    snowMesh.position.y = coneHeight - snowHeight / 2 + 0.2;
    fujiGroup.add(snowMesh);

    // Surrounding Foothills & Ridges
    const hillMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.9,
      flatShading: true,
    });

    const hill1 = new THREE.Mesh(new THREE.ConeGeometry(65, 38, 14), hillMat);
    hill1.position.set(-65, 14, -130);
    const hill2 = new THREE.Mesh(new THREE.ConeGeometry(75, 45, 14), hillMat);
    hill2.position.set(70, 18, -140);
    this.scene.add(hill1, hill2);

    this.scene.add(fujiGroup);
  }

  /**
   * Paved temple terrace, stone paths, steps, and rock retaining walls
   * Expanded with 3 distinct interconnected spaces:
   * 1. Central Courtyard (Hub)
   * 2. West Fuji Overlook Terrace (Tech Treasure Hunt)
   * 3. South Torii Sakura Grove (Promptify)
   * 4. East Moon Pavilion & Pagoda Gardens (Logic Lamps)
   */
  private createTerrainAndCourtyard() {
    // 1. Lower Mountain Base Terrain - Expansively sized to cover all 4 areas
    const baseTerrainGeo = new THREE.PlaneGeometry(280, 280, 48, 48);
    const pos = baseTerrainGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      // Gentle rolling mountain terrain dropping down to valley
      const drop = Math.max(0, -y - 10) * 0.22;
      pos.setZ(i, Math.sin(x * 0.05) * 1.8 + Math.cos(y * 0.05) * 1.8 - drop);
    }
    baseTerrainGeo.computeVertexNormals();

    const grassMat = new THREE.MeshStandardMaterial({
      color: 0x2e4237, // Moonlit moss green — visible under lunar light
      roughness: 0.9,
      flatShading: true,
    });
    const baseTerrain = new THREE.Mesh(baseTerrainGeo, grassMat);
    baseTerrain.rotation.x = -Math.PI / 2;
    baseTerrain.position.set(0, -1.8, 8);
    baseTerrain.receiveShadow = true;
    this.scene.add(baseTerrain);

    // Stone Materials - moonlit Japanese stone tones, visible but clearly night-time
    const terraceMat = new THREE.MeshStandardMaterial({
      color: 0x47556a, // Moonlit slate courtyard flagstone
      roughness: 0.8,
      flatShading: true,
    });
    const pagodaBaseMat = new THREE.MeshStandardMaterial({
      color: 0x3a4558, // Dressed temple granite under moonlight
      roughness: 0.82,
      flatShading: true,
    });
    const slabMat = new THREE.MeshStandardMaterial({
      color: 0x5c6b80, // Moonlit weathered slate pavers
      roughness: 0.75,
      flatShading: true,
    });
    const darkWoodMat = new THREE.MeshStandardMaterial({
      color: 0x2d2420, // Deep weathered Japanese cedar decking
      roughness: 0.85,
      flatShading: true,
    });

    // 2. Central Sanctuary Courtyard (Starting Hub)
    const centralTerraceGeo = new THREE.BoxGeometry(32, 1.4, 26);
    const centralTerrace = new THREE.Mesh(centralTerraceGeo, terraceMat);
    centralTerrace.position.set(0, 0, 0);
    centralTerrace.receiveShadow = true;
    centralTerrace.castShadow = true;
    this.scene.add(centralTerrace);

    this.colliders.push({
      minX: -16,
      maxX: 16,
      minZ: -13,
      maxZ: 13,
      height: 0.7,
    });

    // 3. Pagoda Raised Stone Foundation (Right Side of Hub)
    const pagodaBaseGeo = new THREE.BoxGeometry(16, 2.2, 16);
    const pagodaBase = new THREE.Mesh(pagodaBaseGeo, pagodaBaseMat);
    pagodaBase.position.set(11, 0.4, 1);
    pagodaBase.receiveShadow = true;
    pagodaBase.castShadow = true;
    this.scene.add(pagodaBase);

    this.colliders.push({
      minX: 3,
      maxX: 19,
      minZ: -7,
      maxZ: 9,
      height: 1.5,
    });

    // Steps leading up to Pagoda Platform from Hub
    for (let s = 0; s < 4; s++) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.22, 0.6), slabMat);
      step.position.set(2.4 - s * 0.55, 0.75 + s * 0.2, 1);
      step.receiveShadow = true;
      step.castShadow = true;
      this.scene.add(step);
    }

    // 4. ZONE 1: WEST FUJI OVERLOOK TERRACE (Tech Treasure Hunt)
    // Connecting Stone Promenade / Bridge to the West
    const westBridgeGeo = new THREE.BoxGeometry(12, 1.4, 7.5);
    const westBridge = new THREE.Mesh(westBridgeGeo, terraceMat);
    westBridge.position.set(-21, 0, 0);
    westBridge.receiveShadow = true;
    westBridge.castShadow = true;
    this.scene.add(westBridge);

    // Large Mountain Overlook Platform
    const westOverlookGeo = new THREE.BoxGeometry(18, 1.4, 18);
    const westOverlook = new THREE.Mesh(westOverlookGeo, terraceMat);
    westOverlook.position.set(-32, 0, 0);
    westOverlook.receiveShadow = true;
    westOverlook.castShadow = true;
    this.scene.add(westOverlook);

    // Decorative perimeter stone kerbs for West Overlook
    const westInlay = new THREE.Mesh(new THREE.BoxGeometry(15, 0.05, 15), slabMat);
    westInlay.position.set(-32, 0.73, 0);
    westInlay.receiveShadow = true;
    this.scene.add(westInlay);

    this.colliders.push({
      minX: -41,
      maxX: -15,
      minZ: -9,
      maxZ: 9,
      height: 0.7,
    });

    // 5. ZONE 2: SOUTH SACRED TORII SAKURA GROVE (Promptify)
    // Flagstone Avenue extending South from Central Courtyard
    const southAvenueGeo = new THREE.BoxGeometry(7.5, 1.4, 12);
    const southAvenue = new THREE.Mesh(southAvenueGeo, terraceMat);
    southAvenue.position.set(0, 0, 18);
    southAvenue.receiveShadow = true;
    southAvenue.castShadow = true;
    this.scene.add(southAvenue);

    // Expansive Sakura Grove Terrace
    const southGroveGeo = new THREE.BoxGeometry(20, 1.4, 20);
    const southGrove = new THREE.Mesh(southGroveGeo, terraceMat);
    southGrove.position.set(0, 0, 31);
    southGrove.receiveShadow = true;
    southGrove.castShadow = true;
    this.scene.add(southGrove);

    // Mossy circular garden inlay in Sakura Grove
    const groveInlayMat = new THREE.MeshStandardMaterial({
      color: 0x4a5d45,
      roughness: 0.9,
      flatShading: true,
    });
    const groveInlay = new THREE.Mesh(new THREE.CylinderGeometry(8.0, 8.0, 0.06, 24), groveInlayMat);
    groveInlay.position.set(0, 0.73, 31);
    groveInlay.receiveShadow = true;
    this.scene.add(groveInlay);

    this.colliders.push({
      minX: -10,
      maxX: 10,
      minZ: 12,
      maxZ: 41,
      height: 0.7,
    });

    // 6. ZONE 3: EAST MOON PAVILION & UPPER GARDENS (Logic Lamps)
    // Elevated bridge extending East from Pagoda Foundation
    const eastBridgeGeo = new THREE.BoxGeometry(9, 2.2, 7.5);
    const eastBridge = new THREE.Mesh(eastBridgeGeo, pagodaBaseMat);
    eastBridge.position.set(23.5, 0.4, 1);
    eastBridge.receiveShadow = true;
    eastBridge.castShadow = true;
    this.scene.add(eastBridge);

    // Elevated Moon Pavilion Terrace (height 1.5)
    const moonTerraceGeo = new THREE.BoxGeometry(18, 2.2, 18);
    const moonTerrace = new THREE.Mesh(moonTerraceGeo, pagodaBaseMat);
    moonTerrace.position.set(33, 0.4, 1);
    moonTerrace.receiveShadow = true;
    moonTerrace.castShadow = true;
    this.scene.add(moonTerrace);

    // Wooden deck inlay for Moon Pavilion
    const deckInlay = new THREE.Mesh(new THREE.BoxGeometry(15, 0.05, 15), darkWoodMat);
    deckInlay.position.set(33, 1.53, 1);
    deckInlay.receiveShadow = true;
    this.scene.add(deckInlay);

    this.colliders.push({
      minX: 18,
      maxX: 42,
      minZ: -8,
      maxZ: 10,
      height: 1.5,
    });

    // 7. Stone Pathway Pavers connecting Hub routes
    for (let z = -11; z <= 11; z += 1.8) {
      const slab = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.08, 1.4), slabMat);
      slab.position.set(-2.5, 0.74, z);
      slab.receiveShadow = true;
      this.scene.add(slab);
    }
    // Path heading East to Pagoda steps
    for (let x = -2; x <= 3; x += 1.6) {
      const slab = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 2.4), slabMat);
      slab.position.set(x, 0.74, 1);
      slab.receiveShadow = true;
      this.scene.add(slab);
    }
    // Path heading West across West Bridge
    for (let x = -15; x >= -32; x -= 2.0) {
      const slab = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 2.6), slabMat);
      slab.position.set(x, 0.74, 0);
      slab.receiveShadow = true;
      this.scene.add(slab);
    }
    // Path heading South across Torii Avenue
    for (let z = 11; z <= 30; z += 2.0) {
      const slab = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.08, 1.6), slabMat);
      slab.position.set(0, 0.74, z);
      slab.receiveShadow = true;
      this.scene.add(slab);
    }
  }

  /**
   * The iconic 5-Tier Vermilion Chureito Pagoda
   */
  private createChureitoPagoda() {
    const pagoda = new THREE.Group();
    pagoda.position.set(11, 1.5, 1); // Situated on the elevated right foundation

    // Palette strictly matching the reference photo
    const vermilionRed = new THREE.MeshStandardMaterial({
      color: 0xc83226, // Japanese shrine lacquer red
      roughness: 0.35,
      metalness: 0.1,
      flatShading: true,
    });

    const darkSlateRoof = new THREE.MeshStandardMaterial({
      color: 0x1f2937, // Dark charcoal / weathered copper
      roughness: 0.45,
      flatShading: true,
    });

    const whitePlaster = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.8,
      flatShading: true,
    });

    const goldTrim = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.2,
      metalness: 0.8,
      flatShading: true,
    });

    // Tier 1 Base platform railing (matching foreground of photo)
    const baseRailingMat = new THREE.MeshStandardMaterial({
      color: 0xd63e2d,
      roughness: 0.3,
      flatShading: true,
    });
    const railDeck = new THREE.Mesh(new THREE.BoxGeometry(12.5, 0.35, 12.5), baseRailingMat);
    railDeck.position.y = 0.2;
    railDeck.receiveShadow = true;
    pagoda.add(railDeck);

    // Surrounding Balustrade Railing around pagoda porch
    for (let side = 0; side < 4; side++) {
      const rot = (side * Math.PI) / 2;
      const railGroup = new THREE.Group();
      railGroup.rotation.y = rot;

      const topRail = new THREE.Mesh(new THREE.BoxGeometry(11.8, 0.1, 0.12), vermilionRed);
      topRail.position.set(0, 1.0, 5.8);
      railGroup.add(topRail);

      const midRail = new THREE.Mesh(new THREE.BoxGeometry(11.8, 0.08, 0.08), vermilionRed);
      midRail.position.set(0, 0.6, 5.8);
      railGroup.add(midRail);

      // Baluster posts
      for (let p = -5.4; p <= 5.4; p += 1.2) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.9, 0.12), vermilionRed);
        post.position.set(p, 0.55, 5.8);
        railGroup.add(post);
      }
      pagoda.add(railGroup);
    }

    // Pagoda Tiers (5 floors with decreasing size and flared eaves)
    const tierWidths = [8.5, 7.4, 6.4, 5.5, 4.6];
    const floorHeights = [3.2, 2.8, 2.5, 2.2, 2.0];
    let currentY = 0.35;

    tierWidths.forEach((width, index) => {
      const height = floorHeights[index];
      const tierGroup = new THREE.Group();
      tierGroup.position.y = currentY;

      // 1. Center Core Body (White plaster walls with red timber framing)
      const bodyWidth = width * 0.72;
      const coreGeo = new THREE.BoxGeometry(bodyWidth, height, bodyWidth);
      const core = new THREE.Mesh(coreGeo, whitePlaster);
      core.position.y = height / 2;
      core.castShadow = true;
      core.receiveShadow = true;
      tierGroup.add(core);

      // Red corner pillars & horizontal tie beams (Nuki)
      const pillarRadius = 0.22;
      const pOffset = bodyWidth / 2 - 0.1;
      const pillarGeo = new THREE.CylinderGeometry(pillarRadius, pillarRadius, height, 6);

      const corners = [
        [-pOffset, -pOffset],
        [-pOffset, pOffset],
        [pOffset, -pOffset],
        [pOffset, pOffset],
      ];
      corners.forEach(([cx, cz]) => {
        const pillar = new THREE.Mesh(pillarGeo, vermilionRed);
        pillar.position.set(cx, height / 2, cz);
        pillar.castShadow = true;
        tierGroup.add(pillar);
      });

      // Red horizontal beams
      const beamGeo = new THREE.BoxGeometry(bodyWidth + 0.15, 0.25, bodyWidth + 0.15);
      const beamTop = new THREE.Mesh(beamGeo, vermilionRed);
      beamTop.position.y = height - 0.15;
      const beamMid = new THREE.Mesh(beamGeo, vermilionRed);
      beamMid.position.y = height * 0.5;
      tierGroup.add(beamTop, beamMid);

      // Lattice window / Shoji screens
      const windowMat = new THREE.MeshStandardMaterial({ color: 0x1e3a47, roughness: 0.3 });
      const winGeo = new THREE.BoxGeometry(bodyWidth * 0.45, height * 0.38, bodyWidth + 0.05);
      const win = new THREE.Mesh(winGeo, windowMat);
      win.position.y = height * 0.52;
      tierGroup.add(win);

      // Balustrade on this tier
      const tierRailGeo = new THREE.BoxGeometry(width * 0.88, 0.45, width * 0.88);
      const tierRail = new THREE.Mesh(tierRailGeo, vermilionRed);
      tierRail.position.y = 0.25;
      tierGroup.add(tierRail);

      // 2. Sloped Flared Japanese Eaves Roof (Noki)
      const roofY = height;
      const roofBaseW = width * 1.35;
      const roofTopW = width * 0.7;
      const roofDepth = 1.1;

      // Compound roof using pyramid cone / extruded box for classic sori curve
      const roofGroup = new THREE.Group();
      roofGroup.position.y = roofY;

      // Underside red bracketing (Tokyō)
      const bracketGeo = new THREE.BoxGeometry(roofBaseW * 0.82, 0.35, roofBaseW * 0.82);
      const bracket = new THREE.Mesh(bracketGeo, vermilionRed);
      bracket.position.y = 0.1;
      roofGroup.add(bracket);

      // Main dark tiled roof
      const roofMainGeo = new THREE.CylinderGeometry(roofTopW, roofBaseW, roofDepth, 4, 1);
      const roofMain = new THREE.Mesh(roofMainGeo, darkSlateRoof);
      roofMain.position.y = roofDepth / 2 + 0.15;
      roofMain.rotation.y = Math.PI / 4;
      roofMain.castShadow = true;
      roofMain.receiveShadow = true;
      roofGroup.add(roofMain);

      // Flared upturned eave corners
      const cornerRidgeGeo = new THREE.BoxGeometry(0.35, 0.25, roofBaseW * 0.7);
      const ridge1 = new THREE.Mesh(cornerRidgeGeo, darkSlateRoof);
      ridge1.rotation.y = Math.PI / 4;
      ridge1.position.y = roofDepth * 0.6;
      roofGroup.add(ridge1);

      // Wind bells (Futaku) at four corners
      const bellGeo = new THREE.CylinderGeometry(0.06, 0.14, 0.22, 6);
      const bellDist = (roofBaseW * Math.SQRT2) / 2 - 0.25;
      for (let b = 0; b < 4; b++) {
        const bAngle = (b * Math.PI) / 2 + Math.PI / 4;
        const bell = new THREE.Mesh(bellGeo, goldTrim);
        bell.position.set(Math.cos(bAngle) * bellDist, -0.15, Math.sin(bAngle) * bellDist);
        roofGroup.add(bell);
      }

      tierGroup.add(roofGroup);
      pagoda.add(tierGroup);

      currentY += height + roofDepth * 0.75;
    });

    // 3. Sacred Top Spire (Sōrin)
    const sorinGroup = new THREE.Group();
    sorinGroup.position.y = currentY;

    // Central bronze shaft
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 5.5, 8), goldTrim);
    shaft.position.y = 2.75;
    shaft.castShadow = true;
    sorinGroup.add(shaft);

    // 9 Sacred Discs (Kuruma)
    for (let d = 0; d < 9; d++) {
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.48 - d * 0.02, 0.48 - d * 0.02, 0.12, 12), goldTrim);
      disc.position.y = 1.6 + d * 0.32;
      sorinGroup.add(disc);
    }

    // Flame finial jewel (Hōju) at very apex
    const jewel = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), goldTrim);
    jewel.position.y = 5.6;
    sorinGroup.add(jewel);

    pagoda.add(sorinGroup);
    this.scene.add(pagoda);
  }

  /**
   * ZONE 1: West Mountain Overlook Platform (Tech Treasure Hunt)
   * A breathtaking panoramic terrace cantilevered over the valley directly facing Mt. Fuji
   */
  private createWestOverlookPlatform() {
    const group = new THREE.Group();

    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x78869b,
      roughness: 0.8,
      flatShading: true,
    });
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x2b221d,
      roughness: 0.75,
      flatShading: true,
    });

    // 1. Bridge Railings on both sides of West Connecting Promenade
    const bridgeLength = 11;
    [-3.6, 3.6].forEach((zOffset) => {
      const top = new THREE.Mesh(new THREE.BoxGeometry(bridgeLength, 0.1, 0.14), woodMat);
      top.position.set(-21, 1.65, zOffset);
      const mid = new THREE.Mesh(new THREE.BoxGeometry(bridgeLength, 0.08, 0.1), woodMat);
      mid.position.set(-21, 1.2, zOffset);
      group.add(top, mid);

      for (let x = -26; x <= -16; x += 1.8) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.05, 0.14), woodMat);
        post.position.set(x, 1.2, zOffset);
        post.castShadow = true;
        group.add(post);
      }
    });

    // 2. Overlook Perimeter Railings (North, West, South edges)
    // North edge railing (z = -8.8)
    const nRailTop = new THREE.Mesh(new THREE.BoxGeometry(18, 0.1, 0.14), woodMat);
    nRailTop.position.set(-32, 1.65, -8.8);
    const nRailMid = new THREE.Mesh(new THREE.BoxGeometry(18, 0.08, 0.1), woodMat);
    nRailMid.position.set(-32, 1.2, -8.8);
    group.add(nRailTop, nRailMid);
    for (let x = -40.5; x <= -23.5; x += 1.8) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.05, 0.14), woodMat);
      post.position.set(x, 1.2, -8.8);
      group.add(post);
    }

    // South edge railing (z = 8.8)
    const sRailTop = new THREE.Mesh(new THREE.BoxGeometry(18, 0.1, 0.14), woodMat);
    sRailTop.position.set(-32, 1.65, 8.8);
    const sRailMid = new THREE.Mesh(new THREE.BoxGeometry(18, 0.08, 0.1), woodMat);
    sRailMid.position.set(-32, 1.2, 8.8);
    group.add(sRailTop, sRailMid);
    for (let x = -40.5; x <= -23.5; x += 1.8) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.05, 0.14), woodMat);
      post.position.set(x, 1.2, 8.8);
      group.add(post);
    }

    // West edge railing facing Fuji (x = -40.8)
    const wRailTop = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 17.6), woodMat);
    wRailTop.position.set(-40.8, 1.65, 0);
    const wRailMid = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 17.6), woodMat);
    wRailMid.position.set(-40.8, 1.2, 0);
    group.add(wRailTop, wRailMid);
    for (let z = -8.5; z <= 8.5; z += 1.8) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.05, 0.14), woodMat);
      post.position.set(-40.8, 1.2, z);
      group.add(post);
    }

    // 3. Panoramic Viewing Monument / Altar (Stone pillar overlooking Fuji)
    const stelaBase = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 1.2), stoneMat);
    stelaBase.position.set(-38.5, 0.9, 0);
    const stela = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.6, 0.7), stoneMat);
    stela.position.set(-38.5, 1.8, 0);
    const stelaCap = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.25, 0.85), stoneMat);
    stelaCap.position.set(-38.5, 2.7, 0);
    group.add(stelaBase, stela, stelaCap);

    // 4. Overlook Stone Viewing Benches
    [-4.5, 4.5].forEach((zBench) => {
      const bench = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.35, 0.9), stoneMat);
      bench.position.set(-34, 0.9, zBench);
      bench.castShadow = true;
      group.add(bench);
    });

    this.scene.add(group);
  }

  /**
   * ZONE 2: South Torii Sakura Grove (Promptify)
   * A sacred ceremonial avenue lined with vermilion Torii gates leading into a blooming garden
   */
  private createToriiGatePassage() {
    const toriiGroup = new THREE.Group();

    const vermilionMat = new THREE.MeshStandardMaterial({
      color: 0xc83226,
      roughness: 0.5,
      metalness: 0.1,
      flatShading: true,
    });
    const blackCapMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.6,
      flatShading: true,
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xeab308,
      roughness: 0.3,
      metalness: 0.8,
    });
    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.8,
      flatShading: true,
    });

    // 4 Torii Gates along the South Avenue at z = 13.5, 16.5, 19.5, 22.5
    const gateZPositions = [13.5, 16.5, 19.5, 22.5];
    gateZPositions.forEach((zPos, idx) => {
      const gate = new THREE.Group();
      gate.position.set(0, 0.7, zPos);

      // Gate dimensions: width ~4.6m, height ~3.8m
      const halfW = 2.2 + idx * 0.05;

      // Two vertical pillars (Hashira)
      [-halfW, halfW].forEach((xSide) => {
        // Stone foundation pedestal (Kamebara)
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.32, 0.35, 8), stoneMat);
        base.position.set(xSide, 0.17, 0);
        base.castShadow = true;
        gate.add(base);

        // Pillar column
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 3.4, 8), vermilionMat);
        pillar.position.set(xSide, 1.85, 0);
        pillar.castShadow = true;
        gate.add(pillar);
      });

      // Upper curved lintel (Kasagi & Shimaki)
      const lintelW = halfW * 2 + 1.6;
      const lintel = new THREE.Mesh(new THREE.BoxGeometry(lintelW, 0.28, 0.38), vermilionMat);
      lintel.position.set(0, 3.5, 0);
      lintel.castShadow = true;
      gate.add(lintel);

      // Black top roof cap
      const topCap = new THREE.Mesh(new THREE.BoxGeometry(lintelW + 0.3, 0.12, 0.46), blackCapMat);
      topCap.position.set(0, 3.68, 0);
      gate.add(topCap);

      // Secondary horizontal tie beam (Nuki)
      const tieBeam = new THREE.Mesh(new THREE.BoxGeometry(halfW * 2 + 0.6, 0.2, 0.26), vermilionMat);
      tieBeam.position.set(0, 2.9, 0);
      gate.add(tieBeam);

      // Central tablet strut (Gakuzuka)
      const tablet = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.55, 0.12), blackCapMat);
      tablet.position.set(0, 3.2, 0);
      const plaque = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.45, 0.14), goldMat);
      plaque.position.set(0, 3.2, 0);
      gate.add(tablet, plaque);

      toriiGroup.add(gate);
    });

    // Zen stone arrangements in the Sakura Grove around Promptify
    const zenRockMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.9,
      flatShading: true,
    });
    const rockConfigs = [
      { x: -5, z: 27, s: 1.2 },
      { x: -6, z: 28.5, s: 0.8 },
      { x: 5.5, z: 28, s: 1.4 },
      { x: 6.2, z: 26.5, s: 0.9 },
      { x: -4.5, z: 35, s: 1.1 },
      { x: 5, z: 35.5, s: 1.3 },
    ];
    rockConfigs.forEach((rc) => {
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(rc.s, 1), zenRockMat);
      rock.position.set(rc.x, 0.7 + rc.s * 0.4, rc.z);
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      rock.castShadow = true;
      rock.receiveShadow = true;
      toriiGroup.add(rock);
    });

    this.scene.add(toriiGroup);
  }

  /**
   * ZONE 3: East Moon Pavilion & Pagoda Gardens (Logic Lamps)
   * An elevated meditation pavilion set in tranquil pine and stone gardens
   */
  private createMoonPavilion() {
    const pavilion = new THREE.Group();
    pavilion.position.set(33, 1.5, 1);

    const timberMat = new THREE.MeshStandardMaterial({
      color: 0x2b1d14, // Dark charred cypress timber
      roughness: 0.75,
      flatShading: true,
    });
    const roofSlateMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b, // Slate roof tiles
      roughness: 0.6,
      flatShading: true,
    });
    const goldTrim = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.35,
      metalness: 0.7,
    });
    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.85,
      flatShading: true,
    });

    // 1. Four Main Corner Pillars
    const pillarHalf = 3.2;
    [
      [-pillarHalf, -pillarHalf],
      [pillarHalf, -pillarHalf],
      [-pillarHalf, pillarHalf],
      [pillarHalf, pillarHalf],
    ].forEach(([px, pz]) => {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 3.4, 8), timberMat);
      pillar.position.set(px, 1.7, pz);
      pillar.castShadow = true;
      pavilion.add(pillar);

      const base = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.25, 0.5), stoneMat);
      base.position.set(px, 0.12, pz);
      pavilion.add(base);
    });

    // 2. Cross Beams (Nageshi)
    const beamGeoX = new THREE.BoxGeometry(pillarHalf * 2 + 0.8, 0.22, 0.28);
    const beamGeoZ = new THREE.BoxGeometry(0.28, 0.22, pillarHalf * 2 + 0.8);
    [-pillarHalf, pillarHalf].forEach((p) => {
      const beamX = new THREE.Mesh(beamGeoX, timberMat);
      beamX.position.set(0, 3.3, p);
      const beamZ = new THREE.Mesh(beamGeoZ, timberMat);
      beamZ.position.set(p, 3.3, 0);
      pavilion.add(beamX, beamZ);
    });

    // 3. Pavilion Traditional Hip Roof (Pyramidal pagoda style)
    const roofW = pillarHalf * 2 + 2.4;
    const roofGeo = new THREE.ConeGeometry(roofW * 0.75, 1.8, 4);
    const roof = new THREE.Mesh(roofGeo, roofSlateMat);
    roof.position.y = 4.3;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    pavilion.add(roof);

    // Roof Apex Gold Jewel Finial
    const finial = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), goldTrim);
    finial.position.y = 5.3;
    pavilion.add(finial);

    // 4. Emerald Hanging Lanterns under the 4 Eaves
    [
      [-pillarHalf, -pillarHalf],
      [pillarHalf, -pillarHalf],
      [-pillarHalf, pillarHalf],
      [pillarHalf, pillarHalf],
    ].forEach(([lx, lz]) => {
      const lanternGeo = new THREE.CylinderGeometry(0.15, 0.18, 0.35, 6);
      const emeraldGlowMat = new THREE.MeshBasicMaterial({
        color: 0x34d399,
        transparent: true,
        opacity: 0.9,
      });
      const lanternMesh = new THREE.Mesh(lanternGeo, emeraldGlowMat);
      lanternMesh.position.set(lx * 0.85, 2.7, lz * 0.85);
      pavilion.add(lanternMesh);

      const light = new THREE.PointLight(0x34d399, 1.2, 5);
      light.position.copy(lanternMesh.position);
      pavilion.add(light);
    });

    // 5. Traditional Stone Water Basin (Tsukubai)
    const basin = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.45, 0.6, 12), stoneMat);
    basin.position.set(-5.5, 0.3, 3.5);
    basin.castShadow = true;
    pavilion.add(basin);

    // Water surface inside basin
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.1,
      metalness: 0.3,
    });
    const water = new THREE.Mesh(new THREE.CircleGeometry(0.42, 12), waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.set(-5.5, 0.58, 3.5);
    pavilion.add(water);

    this.scene.add(pavilion);
  }

  /**
   * Blooming Sakura (Cherry Blossom) trees framing the scene
   */
  private createSakuraTrees() {
    // Tree wood material - dark weathered bark
    const barkMat = new THREE.MeshStandardMaterial({
      color: 0x2b2118,
      roughness: 0.9,
      flatShading: true,
    });

    // Blossom materials with soft pink gradient hues & subtle moonlit luminescence
    const blossomColors = [0xfbcfe8, 0xf472b6, 0xf9a8d4, 0xfce7f3, 0xfda4af];
    const blossomMats = blossomColors.map(
      (col) =>
        new THREE.MeshStandardMaterial({
          color: col,
          roughness: 0.55,
          metalness: 0.05,
          emissive: col,
          emissiveIntensity: 0.18,
          flatShading: true,
        })
    );

    // Positions matching the reference photo:
    // Pushed outward around the perimeter and elevated so crowns are well above player/camera sightlines
    const treePositions = [
      // Central Hub framing trees (cleared from pathways)
      { x: -16.5, y: 0.8, z: -8, scale: 1.5, rotation: 0.3 },
      { x: -16.5, y: 0.8, z: 8, scale: 1.4, rotation: -0.5 },
      // Valley canopy edge below terrace railing
      { x: -9, y: -1.6, z: -17, scale: 1.5, rotation: 0.7 },
      { x: -2, y: -1.8, z: -19, scale: 1.4, rotation: 2.1 },
      { x: 5, y: -1.8, z: -20, scale: 1.6, rotation: -1.1 },
      { x: 13, y: -1.6, z: -18, scale: 1.3, rotation: 0.4 },
      // Trees flanking the Pagoda
      { x: 23, y: 0.8, z: -8, scale: 1.35, rotation: -0.9 },
      { x: 21, y: 0.4, z: 12, scale: 1.2, rotation: 0.2 },
      // Zone 1: West Overlook framing trees
      { x: -43, y: 0.8, z: -10, scale: 1.45, rotation: 0.8 },
      { x: -43, y: 0.8, z: 9, scale: 1.4, rotation: -0.4 },
      { x: -33, y: 0.8, z: -11.5, scale: 1.35, rotation: 1.5 },
      { x: -33, y: 0.8, z: 11.5, scale: 1.35, rotation: -1.2 },
      { x: -25, y: 0.8, z: -7.5, scale: 1.3, rotation: 0.2 },
      { x: -25, y: 0.8, z: 7.5, scale: 1.3, rotation: -0.7 },
      // Zone 2: South Torii Sakura Grove trees (dense sacred blooming grove)
      { x: -12, y: 0.8, z: 24, scale: 1.4, rotation: 0.6 },
      { x: 12, y: 0.8, z: 24, scale: 1.4, rotation: -0.6 },
      { x: -13, y: 0.8, z: 34, scale: 1.5, rotation: 1.1 },
      { x: 13, y: 0.8, z: 34, scale: 1.5, rotation: -1.1 },
      { x: 0, y: 0.8, z: 42.5, scale: 1.6, rotation: 0.2 },
      { x: -7, y: 0.8, z: 41, scale: 1.35, rotation: -0.7 },
      { x: 7, y: 0.8, z: 41, scale: 1.35, rotation: 0.7 },
      // Zone 3: East Moon Pavilion & Pagoda Upper Gardens trees
      { x: 44, y: 1.5, z: -6, scale: 1.35, rotation: 0.4 },
      { x: 44, y: 1.5, z: 8, scale: 1.4, rotation: -0.8 },
      { x: 33, y: 1.5, z: -10.5, scale: 1.3, rotation: 1.2 },
      { x: 33, y: 1.5, z: 12.5, scale: 1.3, rotation: -1.4 },
    ];

    treePositions.forEach((conf) => {
      const tree = new THREE.Group();
      tree.position.set(conf.x, conf.y, conf.z);
      tree.scale.setScalar(conf.scale);
      tree.rotation.y = conf.rotation;

      // Tall stately stylized trunk lifting canopy above player camera line
      const trunkCurve = new THREE.CylinderGeometry(0.32, 0.52, 5.8, 7);
      const trunk = new THREE.Mesh(trunkCurve, barkMat);
      trunk.position.y = 2.9;
      trunk.rotation.z = (Math.random() - 0.5) * 0.12;
      trunk.castShadow = true;
      tree.add(trunk);

      // Primary branches elevated high
      const branchGeo = new THREE.CylinderGeometry(0.2, 0.3, 3.2, 6);
      for (let b = 0; b < 3; b++) {
        const branch = new THREE.Mesh(branchGeo, barkMat);
        const bAngle = (b * Math.PI * 2) / 3 + Math.random() * 0.4;
        branch.position.set(Math.cos(bAngle) * 0.45, 4.4, Math.sin(bAngle) * 0.45);
        branch.rotation.x = Math.sin(bAngle) * 0.65;
        branch.rotation.z = -Math.cos(bAngle) * 0.65;
        tree.add(branch);
      }

      // Volumetric cloud-like low-poly blossom clusters sitting high overhead
      const clusterCount = 12 + Math.floor(Math.random() * 5);
      for (let c = 0; c < clusterCount; c++) {
        const mat = blossomMats[c % blossomMats.length];
        const blobRadius = 1.4 + Math.random() * 1.1;
        // Dodecahedron for clean crystalline low-poly look
        const blobGeo = new THREE.DodecahedronGeometry(blobRadius, 1);

        const blob = new THREE.Mesh(blobGeo, mat);
        const theta = Math.random() * Math.PI * 2;
        const dist = 0.9 + Math.random() * 2.8;
        const blobY = 5.2 + Math.random() * 3.0; // High canopy so it never blocks camera

        blob.position.set(Math.cos(theta) * dist, blobY, Math.sin(theta) * dist);
        blob.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
        blob.castShadow = true;
        blob.receiveShadow = true;
        tree.add(blob);
      }

      this.scene.add(tree);
    });
  }

  /**
   * Stone Lanterns (Kasuga Tōrō) on the terrace and paths with warm glowing candlelight
   */
  private createStoneLanterns() {
    const lanternMat = new THREE.MeshStandardMaterial({
      color: 0x334155, // Weathered Japanese granite
      roughness: 0.85,
      flatShading: true,
    });

    // Glowing warm paper screen / candlelight chamber
    const fireboxMat = new THREE.MeshStandardMaterial({
      color: 0x292524,
      emissive: 0xf59e0b,
      emissiveIntensity: 1.6,
      roughness: 0.4,
    });

    const flameMat = new THREE.MeshBasicMaterial({
      color: 0xffedd5, // Warm bright flame core
    });

    // Positions lining courtyard, overlook, and path to Killer's Trail
    const lanternPositions = [
      { x: -1.2, z: -6.5 },
      { x: 3.8, z: -6.5 },
      { x: 3.8, z: -1.5 },
      { x: -8.5, z: -6.5 },
      { x: -8.5, z: 6.5 },
      { x: -14.0, z: -5.0 },
      { x: -20.0, z: 4.5 },
      { x: -25.0, z: -4.0 },
      { x: -29.0, z: 3.5 },
    ];

    lanternPositions.forEach((pos) => {
      const lantern = new THREE.Group();
      lantern.position.set(pos.x, 0.7, pos.z);

      // Base pedestal (Kidan & Kiso)
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.25, 0.7), lanternMat);
      base.position.y = 0.12;
      lantern.add(base);

      // Pillar shaft (Sao)
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 1.1, 6), lanternMat);
      pillar.position.y = 0.75;
      lantern.add(pillar);

      // Middle shelf (Chudai)
      const shelf = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.35, 0.2, 6), lanternMat);
      shelf.position.y = 1.35;
      lantern.add(shelf);

      // Light chamber (Hibukuro) with warm glow
      const firebox = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.42), fireboxMat);
      firebox.position.y = 1.62;
      lantern.add(firebox);

      // Bright flame core
      const flame = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), flameMat);
      flame.position.y = 1.62;
      lantern.add(flame);

      // Umbrella roof cap (Kasa)
      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.75, 0.35, 6), lanternMat);
      cap.position.y = 1.95;
      lantern.add(cap);

      // Top jewel finial (Hoju)
      const finial = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), lanternMat);
      finial.position.y = 2.22;
      lantern.add(finial);

      lantern.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      this.scene.add(lantern);
    });
  }

  /**
   * Post-and-rail protective balustrades along the scenic overlook
   */
  /**
   * Post-and-rail protective balustrades along the scenic overlook
   * Designed with open gateways leading into the 3 new zones
   */
  private createWoodenRailings() {
    const railMat = new THREE.MeshStandardMaterial({
      color: 0x2b221d, // Dark weathered cedar timber
      roughness: 0.75,
      flatShading: true,
    });

    // 1. North overlook fence (facing Mt. Fuji)
    const northRailing = new THREE.Group();
    northRailing.position.set(-6, 0.7, -12.5);

    const length = 19;
    const topBar = new THREE.Mesh(new THREE.BoxGeometry(length, 0.1, 0.14), railMat);
    topBar.position.set(0, 0.95, 0);
    const midBar = new THREE.Mesh(new THREE.BoxGeometry(length, 0.08, 0.1), railMat);
    midBar.position.set(0, 0.5, 0);
    northRailing.add(topBar, midBar);

    for (let x = -length / 2; x <= length / 2; x += 1.4) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.05, 0.14), railMat);
      post.position.set(x, 0.5, 0);
      post.castShadow = true;
      northRailing.add(post);
    }
    this.scene.add(northRailing);

    // 2. West fences (with grand open archway leading to West Promenade at z: [-3.8, 3.8])
    const westNorth = new THREE.Group();
    westNorth.position.set(-15.5, 0.7, -8.15);
    westNorth.rotation.y = Math.PI / 2;
    const wnLen = 8.5;
    westNorth.add(
      new THREE.Mesh(new THREE.BoxGeometry(wnLen, 0.1, 0.14), railMat),
      new THREE.Mesh(new THREE.BoxGeometry(wnLen, 0.08, 0.1), railMat)
    );
    (westNorth.children[0] as THREE.Mesh).position.set(0, 0.95, 0);
    (westNorth.children[1] as THREE.Mesh).position.set(0, 0.5, 0);
    for (let z = -wnLen / 2; z <= wnLen / 2; z += 1.4) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.05, 0.14), railMat);
      post.position.set(z, 0.5, 0);
      westNorth.add(post);
    }
    this.scene.add(westNorth);

    const westSouth = new THREE.Group();
    westSouth.position.set(-15.5, 0.7, 8.15);
    westSouth.rotation.y = Math.PI / 2;
    const wsLen = 8.5;
    westSouth.add(
      new THREE.Mesh(new THREE.BoxGeometry(wsLen, 0.1, 0.14), railMat),
      new THREE.Mesh(new THREE.BoxGeometry(wsLen, 0.08, 0.1), railMat)
    );
    (westSouth.children[0] as THREE.Mesh).position.set(0, 0.95, 0);
    (westSouth.children[1] as THREE.Mesh).position.set(0, 0.5, 0);
    for (let z = -wsLen / 2; z <= wsLen / 2; z += 1.4) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.05, 0.14), railMat);
      post.position.set(z, 0.5, 0);
      westSouth.add(post);
    }
    this.scene.add(westSouth);

    // 3. South fences (with open archway leading to Torii Avenue at x: [-3.8, 3.8])
    const southWest = new THREE.Group();
    southWest.position.set(-9.65, 0.7, 12.5);
    const swLen = 11.5;
    southWest.add(
      new THREE.Mesh(new THREE.BoxGeometry(swLen, 0.1, 0.14), railMat),
      new THREE.Mesh(new THREE.BoxGeometry(swLen, 0.08, 0.1), railMat)
    );
    (southWest.children[0] as THREE.Mesh).position.set(0, 0.95, 0);
    (southWest.children[1] as THREE.Mesh).position.set(0, 0.5, 0);
    for (let x = -swLen / 2; x <= swLen / 2; x += 1.4) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.05, 0.14), railMat);
      post.position.set(x, 0.5, 0);
      southWest.add(post);
    }
    this.scene.add(southWest);

    const southEast = new THREE.Group();
    southEast.position.set(6.8, 0.7, 12.5);
    const seLen = 6.0;
    southEast.add(
      new THREE.Mesh(new THREE.BoxGeometry(seLen, 0.1, 0.14), railMat),
      new THREE.Mesh(new THREE.BoxGeometry(seLen, 0.08, 0.1), railMat)
    );
    (southEast.children[0] as THREE.Mesh).position.set(0, 0.95, 0);
    (southEast.children[1] as THREE.Mesh).position.set(0, 0.5, 0);
    for (let x = -seLen / 2; x <= seLen / 2; x += 1.4) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.05, 0.14), railMat);
      post.position.set(x, 0.5, 0);
      southEast.add(post);
    }
    this.scene.add(southEast);
  }

  /**
   * Floating Cherry Blossom Petals Particle System
   */
  private createSakuraPetalSystem() {
    const geo = new THREE.BufferGeometry();
    this.petalPositions = new Float32Array(this.petalCount * 3);
    this.petalSpeeds = new Float32Array(this.petalCount * 3);

    for (let i = 0; i < this.petalCount; i++) {
      // Scatter within expanded play areas and surrounding valleys
      this.petalPositions[i * 3] = (Math.random() - 0.5) * 110;
      this.petalPositions[i * 3 + 1] = Math.random() * 18;
      this.petalPositions[i * 3 + 2] = (Math.random() * 65) - 15;

      // Velocities: drift down and with the mountain breeze (towards +X, -Z)
      this.petalSpeeds[i * 3] = 0.5 + Math.random() * 0.8;      // Drift X
      this.petalSpeeds[i * 3 + 1] = -0.4 - Math.random() * 0.6; // Fall Y
      this.petalSpeeds[i * 3 + 2] = -0.3 - Math.random() * 0.5; // Drift Z
    }

    geo.setAttribute('position', new THREE.BufferAttribute(this.petalPositions, 3));

    // Custom circular/petal particle texture
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#fbcfe8';
    ctx.beginPath();
    ctx.ellipse(16, 16, 12, 7, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    const petalTex = new THREE.CanvasTexture(canvas);

    const mat = new THREE.PointsMaterial({
      size: 0.35,
      map: petalTex,
      transparent: true,
      opacity: 0.85,
      blending: THREE.NormalBlending,
      depthWrite: false,
    });

    this.petalParticles = new THREE.Points(geo, mat);
    this.scene.add(this.petalParticles);
  }

  /**
   * Traditional Japanese Shōrō (Belfry Pavilion) and Great Bonshō Bronze Bell.
   * Gracefully situated on the North-West courtyard terrace (x: -9.5, z: -8.0),
   * nestling into the garden while leaving the forward mountain vista completely open.
   */
  private createTempleBellPavilion() {
    const belfry = new THREE.Group();
    belfry.position.set(-9.5, 0.7, -8.0);

    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x1e2638, // Dressed dark slate foundation
      roughness: 0.85,
      flatShading: true,
    });

    const darkTimber = new THREE.MeshStandardMaterial({
      color: 0x1c1917, // Weathered Japanese cedar
      roughness: 0.8,
    });

    const vermilionMat = new THREE.MeshStandardMaterial({
      color: 0x881337, // Deep lacquer vermilion
      roughness: 0.5,
    });

    const roofSlate = new THREE.MeshStandardMaterial({
      color: 0x0f172a, // Dark clay roof tiles
      roughness: 0.85,
    });

    const bronzeMat = new THREE.MeshStandardMaterial({
      color: 0x52525b, // Antique cast bronze
      roughness: 0.35,
      metalness: 0.82,
      emissive: 0x27272a,
      emissiveIntensity: 0.25,
    });

    const goldTrim = new THREE.MeshStandardMaterial({
      color: 0xd97706, // Aged temple brass/gold leaf
      roughness: 0.3,
      metalness: 0.85,
    });

    // 1. Raised Stone Foundation Plinth (Stylobate)
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.25, 3.8), stoneMat);
    plinth.position.y = 0.12;
    plinth.receiveShadow = true;
    belfry.add(plinth);

    // Platform Wood Decking
    const deck = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.12, 3.4), darkTimber);
    deck.position.y = 0.28;
    deck.receiveShadow = true;
    belfry.add(deck);

    // 2. Four Cedar Columns (Hashira)
    const pillarPositions = [
      [-1.35, -1.35],
      [-1.35, 1.35],
      [1.35, -1.35],
      [1.35, 1.35],
    ];

    pillarPositions.forEach(([px, pz]) => {
      // Column plinth
      const soseki = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.18, 8), stoneMat);
      soseki.position.set(px, 0.38, pz);
      belfry.add(soseki);

      // Cedar pillar
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 3.2, 8), vermilionMat);
      col.position.set(px, 1.95, pz);
      col.castShadow = true;
      belfry.add(col);
    });

    // 3. Interlocking Tie-Beams (Nuki)
    const beamGeoX = new THREE.BoxGeometry(3.2, 0.2, 0.2);
    const beamGeoZ = new THREE.BoxGeometry(0.2, 0.2, 3.2);

    const bX1 = new THREE.Mesh(beamGeoX, vermilionMat);
    bX1.position.set(0, 3.45, -1.35);
    const bX2 = new THREE.Mesh(beamGeoX, vermilionMat);
    bX2.position.set(0, 3.45, 1.35);
    const bZ1 = new THREE.Mesh(beamGeoZ, vermilionMat);
    bZ1.position.set(-1.35, 3.45, 0);
    const bZ2 = new THREE.Mesh(beamGeoZ, vermilionMat);
    bZ2.position.set(1.35, 3.45, 0);

    // Central crossbeam holding the bell
    const centerBeam = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 3.2), darkTimber);
    centerBeam.position.set(0, 3.55, 0);
    belfry.add(bX1, bX2, bZ1, bZ2, centerBeam);

    // 4. Traditional Curved Tiled Roof
    const roofBase = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.2, 4.0), vermilionMat);
    roofBase.position.y = 3.65;
    belfry.add(roofBase);

    const roofMain = new THREE.Mesh(
      new THREE.CylinderGeometry(1.0, 4.6, 1.1, 4, 1),
      roofSlate
    );
    roofMain.position.y = 4.25;
    roofMain.rotation.y = Math.PI / 4;
    roofMain.castShadow = true;
    belfry.add(roofMain);

    const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.22, 3.4), roofSlate);
    ridge.position.y = 4.85;
    belfry.add(ridge);

    // 5. Great Japanese Bonshō Bronze Bell (梵鐘)
    this.bonshoBellGroup = new THREE.Group();
    this.bonshoBellGroup.position.set(0, 3.45, 0);

    // Dragon-head suspension loop (Ryūzu)
    const ryuzu = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.045, 8, 16), goldTrim);
    ryuzu.position.y = -0.1;
    this.bonshoBellGroup.add(ryuzu);

    // Bell body mesh group
    const bellMeshGroup = new THREE.Group();
    bellMeshGroup.position.y = -0.9;

    // Bronze Bell Barrel
    const bellBodyGeo = new THREE.CylinderGeometry(0.38, 0.55, 1.25, 16, 3, true);
    const bellBody = new THREE.Mesh(bellBodyGeo, bronzeMat);
    bellBody.castShadow = true;
    bellMeshGroup.add(bellBody);

    // Crown Dome
    const crownGeo = new THREE.SphereGeometry(0.38, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const crown = new THREE.Mesh(crownGeo, bronzeMat);
    crown.position.y = 0.62;
    bellMeshGroup.add(crown);

    // Flared bottom rim
    const rimGeo = new THREE.TorusGeometry(0.55, 0.055, 8, 20);
    const rim = new THREE.Mesh(rimGeo, bronzeMat);
    rim.position.y = -0.62;
    rim.rotation.x = Math.PI / 2;
    bellMeshGroup.add(rim);

    // Relief decorative bands
    const bandGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.06, 16);
    const band1 = new THREE.Mesh(bandGeo, goldTrim);
    band1.position.y = 0.35;
    const band2 = new THREE.Mesh(bandGeo, goldTrim);
    band2.position.y = -0.28;
    bellMeshGroup.add(band1, band2);

    // Tsukiza striking target medallion facing +X direction
    const tsukiza = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.04, 12), goldTrim);
    tsukiza.rotation.z = Math.PI / 2;
    tsukiza.position.set(0.48, -0.15, 0);
    bellMeshGroup.add(tsukiza);

    this.bonshoBellGroup.add(bellMeshGroup);
    belfry.add(this.bonshoBellGroup);

    // 6. Suspended Wooden Striker (Shumoku - 撞木)
    this.bonshoStriker = new THREE.Group();
    this.bonshoStriker.position.set(1.05, 3.45, 0);

    const ropeMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.9 });
    const ropeGeo = new THREE.CylinderGeometry(0.015, 0.015, 1.5, 4);
    const rope1 = new THREE.Mesh(ropeGeo, ropeMat);
    rope1.position.set(0, -0.75, -0.3);
    const rope2 = new THREE.Mesh(ropeGeo, ropeMat);
    rope2.position.set(0, -0.75, 0.3);
    this.bonshoStriker.add(rope1, rope2);

    const strikerLog = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.09, 1.3, 10),
      darkTimber
    );
    strikerLog.position.set(0, -1.5, 0);
    strikerLog.rotation.z = Math.PI / 2;
    this.bonshoStriker.add(strikerLog);

    belfry.add(this.bonshoStriker);

    // 7. Celestial Resonant Shockwave Ring
    const ringGeo = new THREE.RingGeometry(0.2, 0.6, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.shockwaveRing = new THREE.Mesh(ringGeo, ringMat);
    this.shockwaveRing.position.set(0.48, 1.9, 0);
    this.shockwaveRing.rotation.y = Math.PI / 2;
    this.shockwaveRing.scale.set(0.001, 0.001, 0.001);
    belfry.add(this.shockwaveRing);

    // 8. One gentle warm ambient light inside the Belfry
    this.bellLight = new THREE.PointLight(0xf59e0b, 1.5, 6.5);
    this.bellLight.position.set(0, 3.1, 0);
    belfry.add(this.bellLight);

    // Glowing corner paper lanterns (Emissive - NO heavy dynamic point lights)
    const lanternMat = new THREE.MeshStandardMaterial({
      color: 0x991b1b,
      emissive: 0xf97316,
      emissiveIntensity: 1.2,
    });
    const lGeo = new THREE.CylinderGeometry(0.14, 0.17, 0.35, 8);
    [[-1.8, 1.8], [1.8, 1.8]].forEach(([lx, lz]) => {
      const lMesh = new THREE.Mesh(lGeo, lanternMat);
      lMesh.position.set(lx, 3.3, lz);
      belfry.add(lMesh);
    });

    this.templeBellGroup = belfry;
    this.scene.add(belfry);

    // Collider for the relocated bell tower
    this.colliders.push({
      minX: -9.5 - 1.9,
      maxX: -9.5 + 1.9,
      minZ: -8.0 - 1.9,
      maxZ: -8.0 + 1.9,
      height: 3.8,
    });
  }

  /**
   * Bioluminescent Night Fireflies (Hotaru - 蛍)
   * Lightweight 25-particle system with smooth group hover (0 GPU stalls)
   */
  private createNightFireflies() {
    const count = 25;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 55;
      positions[i * 3 + 1] = 1.2 + Math.random() * 2.8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 45;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Soft golden glowing sprite texture
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(254, 240, 138, 0.95)');
    grad.addColorStop(0.4, 'rgba(245, 158, 11, 0.5)');
    grad.addColorStop(0.8, 'rgba(74, 222, 128, 0.15)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(canvas);

    const mat = new THREE.PointsMaterial({
      size: 0.45,
      map: tex,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.fireflyParticles = new THREE.Points(geo, mat);
    this.scene.add(this.fireflyParticles);
  }

  /**
   * Pagoda Night Illumination:
   * 4 ornamental stone lanterns at the foundation base (0 dynamic GPU lights)
   */
  private createPagodaUplighting() {
    const fixtureMat = new THREE.MeshStandardMaterial({
      color: 0x1e2638,
      roughness: 0.8,
    });
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
    });

    const uplightPositions = [
      { x: -5.0, z: -6.5 },
      { x: 5.0, z: -6.5 },
      { x: -5.0, z: 3.5 },
      { x: 5.0, z: 3.5 },
    ];

    uplightPositions.forEach((pos) => {
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.35, 8), fixtureMat);
      base.position.set(pos.x, 0.88, pos.z);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), glowMat);
      cap.position.y = 0.22;
      base.add(cap);
      this.scene.add(base);
    });
  }

  /**
   * Traditional Japanese Hanging Paper Lanterns (Chōchin - 提灯)
   * Uses glowing emissive materials for rich Japanese night atmosphere with 0 lag
   */
  private createHangingChōchinLanterns() {
    const redLanternMat = new THREE.MeshStandardMaterial({
      color: 0x991b1b,
      emissive: 0xf97316,
      emissiveIntensity: 1.15,
      roughness: 0.45,
    });

    const lanternLocs = [
      { x: -1.2, y: 3.2, z: 12.0 },
      { x: 1.2, y: 3.2, z: 12.0 },
      { x: -18.0, y: 3.4, z: -4.0 },
      { x: -24.0, y: 3.4, z: 4.0 },
      { x: -2.0, y: 3.2, z: -8.5 },
    ];

    lanternLocs.forEach((loc) => {
      const group = new THREE.Group();
      group.position.set(loc.x, loc.y, loc.z);

      const string = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 0.4, 4),
        new THREE.MeshBasicMaterial({ color: 0x1c1917 })
      );
      string.position.y = 0.2;
      group.add(string);

      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.24, 0.45, 10),
        redLanternMat
      );
      group.add(body);

      const capMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.8 });
      const topCap = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.05, 8), capMat);
      topCap.position.y = 0.25;
      const btmCap = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.16, 0.05, 8), capMat);
      btmCap.position.y = -0.25;
      group.add(topCap, btmCap);

      this.scene.add(group);
    });
  }

  /**
   * Ring the sacred Bonshō temple bells:
   * Striker swings in and impacts, bell oscillates in damped harmonic swing,
   * golden celestial shockwave expands, and resonant bell sound effect plays!
   */
  public ringBells() {
    this.bellRingTimer = 0.0;
    // Play rich resonant Japanese Bonsho sound effect
    bellSoundController.playTempleBell(1.0);
  }

  /**
   * Update animation loop (drifting petals, firefly hover, bell ringing)
   * Streamlined for buttery-smooth 60 FPS
   */
  public update(delta: number) {
    const time = performance.now() * 0.003;

    // 1. Drifting Petals animation
    const pos = this.petalParticles.geometry.attributes.position;
    for (let i = 0; i < this.petalCount; i++) {
      const idx = i * 3;
      const windX = Math.sin(this.petalPositions[idx + 1] * 0.5 + i) * 0.2;

      this.petalPositions[idx] += (this.petalSpeeds[idx] + windX) * delta;
      this.petalPositions[idx + 1] += this.petalSpeeds[idx + 1] * delta;
      this.petalPositions[idx + 2] += this.petalSpeeds[idx + 2] * delta;

      if (this.petalPositions[idx + 1] < 0) {
        this.petalPositions[idx + 1] = 16 + Math.random() * 4;
        this.petalPositions[idx] = (Math.random() - 0.5) * 110;
        this.petalPositions[idx + 2] = (Math.random() * 65) - 15;
      }
    }
    pos.needsUpdate = true;

    // 2. Smooth firefly group hover (no CPU buffer uploads)
    if (this.fireflyParticles) {
      this.fireflyParticles.position.y = Math.sin(time * 1.5) * 0.18;
    }

    // 3. Bonshō Temple Bell Ringing Physical Animation
    if (this.bellRingTimer >= 0 && this.bonshoBellGroup && this.bonshoStriker) {
      this.bellRingTimer += delta;
      const t = this.bellRingTimer;

      // Stage A: Striker swings toward bell and impacts at t = 0.22s
      if (t < 0.22) {
        const strikeProgress = t / 0.22;
        this.bonshoStriker.rotation.z = Math.sin(strikeProgress * Math.PI) * 0.45;
      } else {
        // Stage B: Rebound of the striker
        const reboundT = t - 0.22;
        this.bonshoStriker.rotation.z = -Math.sin(reboundT * 7.5) * Math.exp(-reboundT * 2.5) * 0.22;
      }

      // Stage C: Bell pendulum oscillation after impact
      if (t >= 0.22) {
        const bellT = t - 0.22;
        // Harmonic damped swing
        const swing = Math.sin(bellT * 6.5) * Math.exp(-bellT * 0.5) * 0.28;
        this.bonshoBellGroup.rotation.z = swing;

        // Stage D: Expanding golden shockwave ring
        if (this.shockwaveRing) {
          const waveProgress = Math.min(bellT / 2.0, 1.0);
          const waveScale = 0.1 + waveProgress * 12.0;
          this.shockwaveRing.scale.set(waveScale, waveScale, waveScale);
          const waveMat = this.shockwaveRing.material as THREE.MeshBasicMaterial;
          waveMat.opacity = Math.max(0, 0.95 * (1.0 - waveProgress));
        }

        // Stage E: Pulsing bell illumination
        if (this.bellLight) {
          this.bellLight.intensity = 1.5 + Math.exp(-bellT * 3.0) * 2.5;
        }
      }

      // Reset after 7s complete bell resonance
      if (t > 7.0) {
        this.bellRingTimer = -1;
        this.bonshoBellGroup.rotation.z = 0;
        this.bonshoStriker.rotation.z = 0;
        if (this.shockwaveRing) {
          this.shockwaveRing.scale.set(0.001, 0.001, 0.001);
          (this.shockwaveRing.material as THREE.MeshBasicMaterial).opacity = 0;
        }
        if (this.bellLight) this.bellLight.intensity = 1.5;
      }
    }

    // 4. Animate event waypoint beacons
    this.eventWaypointObjects.forEach((wp, idx) => {
      const t = time + idx * 2.1;

      wp.orb.position.y = 1.6 + Math.sin(t * 1.2) * 0.15;
      const pulse = 1.0 + Math.sin(t * 2.5) * 0.12;
      wp.orb.scale.set(pulse, pulse, pulse);

      wp.ring1.rotation.y += delta * 0.8;
      wp.ring1.rotation.x = Math.sin(t * 0.7) * 0.3;
      wp.ring2.rotation.y -= delta * 0.6;
      wp.ring2.rotation.z = Math.cos(t * 0.5) * 0.4;

      const beamMat = wp.beam.material as THREE.MeshBasicMaterial;
      beamMat.opacity = 0.35 + Math.sin(t * 1.8) * 0.12;

      const runeMat = wp.groundRune.material as THREE.MeshBasicMaterial;
      runeMat.opacity = 0.2 + Math.sin(t * 1.4) * 0.1;
      wp.groundRune.rotation.y += delta * 0.3;

      wp.light.intensity = 1.8 + Math.sin(t * 2.0) * 0.6;
    });
  }

  /**
   * Create 3 glowing event waypoint beacons at sanctuary locations.
   * Each beacon consists of:
   * - Ethereal floating orb (core sphere)
   * - Two rotating orbital ring halos
   * - Vertical light beam pillar
   * - Ground rune/sigil circle
   * - Colored point light for atmospheric illumination
   */
  private createEventWaypoints() {
    const activeEvents = SANCTUARY_EVENTS.filter((e) => this.activeEventIds.includes(e.id));
    activeEvents.forEach((event) => {
      const group = new THREE.Group();
      group.position.set(event.position.x, event.position.y, event.position.z);

      const color = new THREE.Color(event.color);

      // 1. Core Floating Orb (inner glowing sphere)
      const orbGeo = new THREE.SphereGeometry(0.18, 16, 16);
      const orbMat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.95,
      });
      const orb = new THREE.Mesh(orbGeo, orbMat);
      orb.position.y = 1.6;
      group.add(orb);

      // Outer glow halo sphere (larger, semi-transparent)
      const glowGeo = new THREE.SphereGeometry(0.32, 16, 16);
      const glowMat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.18,
        depthWrite: false,
      });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      orb.add(glow);

      // 2. Orbital Ring 1 (tilted torus halo)
      const ring1Geo = new THREE.TorusGeometry(0.42, 0.018, 8, 32);
      const ring1Mat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
      });
      const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
      ring1.position.y = 1.6;
      ring1.rotation.x = Math.PI * 0.35;
      group.add(ring1);

      // 3. Orbital Ring 2 (perpendicular smaller torus)
      const ring2Geo = new THREE.TorusGeometry(0.34, 0.014, 8, 32);
      const ring2Mat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
      });
      const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
      ring2.position.y = 1.6;
      ring2.rotation.x = Math.PI * 0.6;
      ring2.rotation.z = Math.PI * 0.25;
      group.add(ring2);

      // 4. Vertical Celestial Light Beam (tall glowing pillar reaching high into the sky)
      const beamGeo = new THREE.CylinderGeometry(0.12, 0.28, 26.0, 16, 1, true);
      const beamMat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.38,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.y = 13.0;
      group.add(beam);

      // Outer ethereal corona for the beam
      const coronaGeo = new THREE.CylinderGeometry(0.35, 1.1, 26.0, 16, 1, true);
      const coronaMat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.15,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const corona = new THREE.Mesh(coronaGeo, coronaMat);
      corona.position.y = 13.0;
      group.add(corona);


      // 5. Ground Rune Circle (flat sigil ring on ground plane)
      const runeGeo = new THREE.RingGeometry(0.6, 0.75, 32);
      const runeMat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.25,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const groundRune = new THREE.Mesh(runeGeo, runeMat);
      groundRune.rotation.x = -Math.PI / 2;
      groundRune.position.y = 0.02;
      group.add(groundRune);

      // Inner rune ring
      const innerRuneGeo = new THREE.RingGeometry(0.3, 0.38, 32);
      const innerRuneMat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.15,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const innerRune = new THREE.Mesh(innerRuneGeo, innerRuneMat);
      innerRune.rotation.x = -Math.PI / 2;
      innerRune.position.y = 0.03;
      group.add(innerRune);

      // 6. Colored Point Light for atmospheric glow
      const light = new THREE.PointLight(event.color, 2.0, 6.0, 1.5);
      light.position.y = 1.6;
      group.add(light);

      this.scene.add(group);

      this.eventWaypointObjects.push({
        group,
        orb,
        ring1,
        ring2,
        beam,
        light,
        groundRune,
        baseY: event.position.y,
      });
    });
  }

  /**
   * Station Departure Gate in the Temple Courtyard (North edge at x: -2.0, z: -10.0)
   * Allows player to return to Fujimi Train Station to board other trains.
   */
  private createStationDepartureGate() {
    const gateGroup = new THREE.Group();
    gateGroup.position.set(-2.0, 0.7, -10.0);

    const vermilionMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.5 });
    const blackMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.8 });

    // 1. Torii Gate Archway
    [-1.8, 1.8].forEach((px) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 4.2, 8), vermilionMat);
      post.position.set(px, 2.1, 0);
      post.castShadow = true;
      gateGroup.add(post);
    });

    const lintel = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.35, 0.45), blackMat);
    lintel.position.set(0, 4.1, 0);
    gateGroup.add(lintel);

    const subBeam = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.2, 0.3), vermilionMat);
    subBeam.position.set(0, 3.4, 0);
    gateGroup.add(subBeam);

    // 2. Hanging Wooden Sign: "富士見高原駅行 / To Fujimi Train Station"
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 160;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 512, 160);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 6;
    ctx.strokeRect(6, 6, 500, 148);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 38px "Hiragino Sans", "Meiryo", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('◄ 富士見高原駅行', 256, 65);
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('To Train Station (Board Trains)', 256, 115);

    const signTex = new THREE.CanvasTexture(canvas);
    const signGeo = new THREE.BoxGeometry(2.2, 0.7, 0.08);
    const signMat = new THREE.MeshBasicMaterial({ map: signTex });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, 2.7, 0);
    gateGroup.add(sign);

    // 3. Glowing Departure Platform Rune on Ground
    const runeGeo = new THREE.RingGeometry(0.8, 1.6, 24);
    const runeMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
    });
    const rune = new THREE.Mesh(runeGeo, runeMat);
    rune.rotation.x = -Math.PI / 2;
    rune.position.y = 0.03;
    gateGroup.add(rune);

    // 4. Warm Amber Departure Light
    const portalLight = new THREE.PointLight(0xf59e0b, 1.6, 6.0);
    portalLight.position.set(0, 1.8, 0);
    gateGroup.add(portalLight);

    this.scene.add(gateGroup);
  }
}
