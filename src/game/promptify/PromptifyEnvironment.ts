import * as THREE from 'three';
import { PROMPTIFY_CONFIG, PROMPTIFY_EVENT_DATA } from './PromptifyConfig';
import { PromptifyFireworks } from './PromptifyFireworks';
import { promptifyAudio } from './PromptifyAudio';

export class PromptifyEnvironment {
  public scene: THREE.Scene;
  public fireworks: PromptifyFireworks;
  public isCelebrationActive: boolean = false;
  public onCelebrationFinished?: () => void;

  // Lighting & atmosphere references
  private ambientLight!: THREE.AmbientLight;
  private moonLight!: THREE.DirectionalLight;
  private lanternLights: THREE.PointLight[] = [];

  // Checkpoint Beacon components
  public checkpointGroup!: THREE.Group;
  private checkpointOrb!: THREE.Mesh;
  private checkpointRing1!: THREE.Mesh;
  private checkpointRing2!: THREE.Mesh;
  private checkpointBeam!: THREE.Mesh;
  private checkpointRune!: THREE.Mesh;
  private checkpointLight!: THREE.PointLight;

  // Floating Lanterns & Petals
  private atmosphericPetals!: THREE.Points;
  private petalPositions!: Float32Array;
  private petalCount = 90;

  // Reusable Shared Materials
  private sharedMaterials!: {
    stoneRoad: THREE.MeshStandardMaterial;
    darkWood: THREE.MeshStandardMaterial;
    lightWood: THREE.MeshStandardMaterial;
    warmHinoki: THREE.MeshStandardMaterial;
    vermilionTorii: THREE.MeshStandardMaterial;
    darkTileRoof: THREE.MeshStandardMaterial;
    lanternAmber: THREE.MeshStandardMaterial;
    lanternRed: THREE.MeshStandardMaterial;
    lanternCream: THREE.MeshStandardMaterial;
    bulbGlow: THREE.MeshStandardMaterial;
    plasterWall: THREE.MeshStandardMaterial;
    bannerRed: THREE.MeshStandardMaterial;
    bannerIndigo: THREE.MeshStandardMaterial;
    bannerGold: THREE.MeshStandardMaterial;
    goldAccent: THREE.MeshStandardMaterial;
    foodFried: THREE.MeshStandardMaterial;
    foodGlazed: THREE.MeshStandardMaterial;
    foodDumpling: THREE.MeshStandardMaterial;
    sakuraBlossom: THREE.MeshStandardMaterial;
    pineNeedles: THREE.MeshStandardMaterial;
  };

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.initSharedMaterials();
    this.setupLighting();
    this.createSkyAndBackdrop();
    this.createStonePathwayAndGround();
    this.createGrandToriiGate();
    this.createMarketStalls();
    this.createOverheadLanternStrings();
    this.createBackgroundMachiyaBuildings();
    this.createFlora();
    this.createYellowCheckpoint();
    this.createStationDepartureGate();
    this.createAtmosphericPetals();

    // In-game 3D Particle Fireworks System (pure Three.js, completely inactive until registration)
    this.fireworks = new PromptifyFireworks(this.scene);
    this.fireworks.onCelebrationFinished = () => {
      // Revert ambient lighting smoothly back to normal market mood
      this.ambientLight.intensity = 1.6;
      this.ambientLight.color.setHex(0x283858);
      if (this.onCelebrationFinished) {
        this.onCelebrationFinished();
      }
    };

    // Start Market Ambient Audio
    promptifyAudio.startMarketAmbience();
  }

  // --- 1. SHARED MATERIALS (High Performance) ---
  private initSharedMaterials() {
    // Flagstone pavers texture for central market pathway
    const stoneCanvas = document.createElement('canvas');
    stoneCanvas.width = 512;
    stoneCanvas.height = 512;
    const sCtx = stoneCanvas.getContext('2d')!;
    sCtx.fillStyle = '#2a2f3b';
    sCtx.fillRect(0, 0, 512, 512);
    // Draw flagstone paver pattern
    sCtx.strokeStyle = '#181d26';
    sCtx.lineWidth = 4;
    for (let y = 0; y < 512; y += 64) {
      const offsetX = (y / 64) % 2 === 0 ? 0 : 32;
      for (let x = -32; x < 544; x += 64) {
        sCtx.fillStyle = (x + y) % 128 === 0 ? '#323946' : '#262b37';
        sCtx.fillRect(x + offsetX + 2, y + 2, 60, 60);
        sCtx.strokeRect(x + offsetX, y, 64, 64);
      }
    }
    const stoneTex = new THREE.CanvasTexture(stoneCanvas);
    stoneTex.wrapS = THREE.RepeatWrapping;
    stoneTex.wrapT = THREE.RepeatWrapping;
    stoneTex.repeat.set(4, 16);

    this.sharedMaterials = {
      stoneRoad: new THREE.MeshStandardMaterial({
        map: stoneTex,
        roughness: 0.85,
        metalness: 0.1,
      }),
      darkWood: new THREE.MeshStandardMaterial({
        color: 0x241811, // Dark weathered cedar timber
        roughness: 0.85,
        flatShading: true,
      }),
      lightWood: new THREE.MeshStandardMaterial({
        color: 0x5c3d28, // Japanese cypress Hinoki wood
        roughness: 0.75,
        flatShading: true,
      }),
      warmHinoki: new THREE.MeshStandardMaterial({
        color: 0xc88b48, // Warm amber Hinoki tavern timber matching Image 1
        roughness: 0.65,
        flatShading: true,
      }),
      vermilionTorii: new THREE.MeshStandardMaterial({
        color: 0xc92a1d, // Sacred vibrant vermilion lacquer
        roughness: 0.45,
        metalness: 0.05,
        flatShading: true,
      }),
      darkTileRoof: new THREE.MeshStandardMaterial({
        color: 0x1a212d, // Japanese Kawara clay roof tiles
        roughness: 0.65,
        metalness: 0.2,
        flatShading: true,
      }),
      lanternAmber: new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        emissive: 0xf59e0b,
        emissiveIntensity: 1.5,
        roughness: 0.3,
      }),
      lanternRed: new THREE.MeshStandardMaterial({
        color: 0xef4444,
        emissive: 0xd97706,
        emissiveIntensity: 1.3,
        roughness: 0.3,
      }),
      lanternCream: new THREE.MeshStandardMaterial({
        color: 0xfef3c7,
        emissive: 0xfde68a,
        emissiveIntensity: 1.2,
        roughness: 0.4,
      }),
      bulbGlow: new THREE.MeshStandardMaterial({
        color: 0xfffbeb,
        emissive: 0xfde047,
        emissiveIntensity: 2.0,
        roughness: 0.2,
      }),
      plasterWall: new THREE.MeshStandardMaterial({
        color: 0xd6cfc4,
        roughness: 0.9,
      }),
      bannerRed: new THREE.MeshStandardMaterial({
        color: 0x991b1b,
        roughness: 0.8,
      }),
      bannerIndigo: new THREE.MeshStandardMaterial({
        color: 0x1e3a8a,
        roughness: 0.8,
      }),
      bannerGold: new THREE.MeshStandardMaterial({
        color: 0xb45309,
        roughness: 0.8,
      }),
      goldAccent: new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        roughness: 0.25,
        metalness: 0.85,
      }),
      foodFried: new THREE.MeshStandardMaterial({
        color: 0xd97706, // Golden fried tempura/dumplings
        roughness: 0.6,
        flatShading: true,
      }),
      foodGlazed: new THREE.MeshStandardMaterial({
        color: 0x7c2d12, // Teriyaki glazed skewers
        roughness: 0.3,
        flatShading: true,
      }),
      foodDumpling: new THREE.MeshStandardMaterial({
        color: 0xfef08a, // Steamed gyoza dumplings
        roughness: 0.5,
        flatShading: true,
      }),
      sakuraBlossom: new THREE.MeshStandardMaterial({
        color: 0xf472b6,
        roughness: 0.6,
        flatShading: true,
      }),
      pineNeedles: new THREE.MeshStandardMaterial({
        color: 0x14532d,
        roughness: 0.7,
        flatShading: true,
      }),
    };
  }

  // --- 2. LIGHTING & NIGHT ATMOSPHERE ---
  private setupLighting() {
    this.ambientLight = new THREE.AmbientLight(0x283a5e, 1.8);
    this.scene.add(this.ambientLight);

    this.moonLight = new THREE.DirectionalLight(0xcfdcf8, 1.6);
    this.moonLight.position.set(20, 60, -10);
    this.moonLight.castShadow = true;
    this.moonLight.shadow.mapSize.width = 1024;
    this.moonLight.shadow.mapSize.height = 1024;
    this.moonLight.shadow.bias = -0.0005;
    this.scene.add(this.moonLight);

    this.scene.fog = new THREE.FogExp2(0x101b2f, 0.008);
  }

  // --- 3. SKY DOME & CELESTIAL BACKDROP ---
  private createSkyAndBackdrop() {
    const skyGeo = new THREE.SphereGeometry(300, 24, 18);
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, '#040b18'); // Deep zenith
    grad.addColorStop(0.35, '#0b1933'); // Midnight indigo
    grad.addColorStop(0.7, '#13284f'); // Moonlit navy
    grad.addColorStop(1.0, '#101b2f'); // Horizon night mist
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    const skyTex = new THREE.CanvasTexture(canvas);
    const skyMat = new THREE.MeshBasicMaterial({
      map: skyTex,
      side: THREE.BackSide,
      fog: false,
    });
    this.scene.add(new THREE.Mesh(skyGeo, skyMat));

    // Starfield
    const starCount = 650;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 290;
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = Math.abs(r * Math.cos(phi)) + 10;
      starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.8,
      transparent: true,
      opacity: 0.9,
    });
    this.scene.add(new THREE.Points(starGeo, starMat));

    // Glowing Moon
    const moonGeo = new THREE.SphereGeometry(6.0, 16, 16);
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xfffbeb, fog: false });
    const moon = new THREE.Mesh(moonGeo, moonMat);
    moon.position.set(70, 110, -120);
    this.scene.add(moon);

    // Lunar Halo
    const haloGeo = new THREE.RingGeometry(6.5, 13.0, 32);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x93c5fd,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
      depthWrite: false,
      fog: false,
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.position.copy(moon.position);
    halo.lookAt(0, 0, 0);
    this.scene.add(halo);
  }

  // --- 4. CENTRAL STONE PATHWAY & MARKET GROUNDS ---
  private createStonePathwayAndGround() {
    const pathGeo = new THREE.PlaneGeometry(9.0, 64.0);
    const pathMesh = new THREE.Mesh(pathGeo, this.sharedMaterials.stoneRoad);
    pathMesh.rotation.x = -Math.PI / 2;
    pathMesh.position.set(0, 0.7, 0);
    pathMesh.receiveShadow = true;
    this.scene.add(pathMesh);

    const groundGeo = new THREE.PlaneGeometry(80.0, 80.0);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x181e28,
      roughness: 0.95,
      metalness: 0.05,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.set(0, 0.68, 0);
    groundMesh.receiveShadow = true;
    this.scene.add(groundMesh);

    [-4.5, 4.5].forEach((cx) => {
      const curbGeo = new THREE.BoxGeometry(0.35, 0.25, 64.0);
      const curb = new THREE.Mesh(curbGeo, this.sharedMaterials.darkWood);
      curb.position.set(cx, 0.8, 0);
      this.scene.add(curb);
    });
  }

  // --- 5. GRAND ENTRANCE TORII GATE ---
  private createGrandToriiGate() {
    const toriiGroup = new THREE.Group();
    toriiGroup.position.set(
      PROMPTIFY_CONFIG.toriiPosition.x,
      PROMPTIFY_CONFIG.toriiPosition.y,
      PROMPTIFY_CONFIG.toriiPosition.z
    );

    // Two Main Vermilion Pillars (Hashira)
    [-4.2, 4.2].forEach((px) => {
      const baseGeo = new THREE.CylinderGeometry(0.55, 0.65, 0.6, 8);
      const base = new THREE.Mesh(baseGeo, this.sharedMaterials.darkWood);
      base.position.set(px, 0.3, 0);
      toriiGroup.add(base);

      const pillarGeo = new THREE.CylinderGeometry(0.38, 0.44, 7.8, 12);
      const pillar = new THREE.Mesh(pillarGeo, this.sharedMaterials.vermilionTorii);
      pillar.position.set(px, 4.2, 0);
      pillar.castShadow = true;
      toriiGroup.add(pillar);

      const ringGeo = new THREE.TorusGeometry(0.42, 0.06, 6, 16);
      const ring = new THREE.Mesh(ringGeo, this.sharedMaterials.darkTileRoof);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(px, 5.8, 0);
      toriiGroup.add(ring);

      const lantern = this.createHangingChōchinMesh('amber', 0.45);
      lantern.position.set(px + (px > 0 ? -0.7 : 0.7), 4.8, 0.4);
      toriiGroup.add(lantern);

      const tLight = new THREE.PointLight(0xf59e0b, 1.8, 7.0);
      tLight.position.set(px, 4.8, 0.5);
      this.lanternLights.push(tLight);
      toriiGroup.add(tLight);
    });

    const nukiGeo = new THREE.BoxGeometry(10.2, 0.4, 0.35);
    const nuki = new THREE.Mesh(nukiGeo, this.sharedMaterials.vermilionTorii);
    nuki.position.set(0, 6.4, 0);
    nuki.castShadow = true;
    toriiGroup.add(nuki);

    const kasagiGeo = new THREE.BoxGeometry(11.4, 0.55, 0.6);
    const kasagi = new THREE.Mesh(kasagiGeo, this.sharedMaterials.darkTileRoof);
    kasagi.position.set(0, 7.8, 0);
    kasagi.castShadow = true;
    toriiGroup.add(kasagi);

    const capGeo = new THREE.BoxGeometry(11.8, 0.22, 0.75);
    const cap = new THREE.Mesh(capGeo, this.sharedMaterials.darkTileRoof);
    cap.position.set(0, 8.1, 0);
    toriiGroup.add(cap);

    // Central Tablet with Japanese kanji "詠唱 / Promptify"
    const tabletCanvas = document.createElement('canvas');
    tabletCanvas.width = 128;
    tabletCanvas.height = 256;
    const tCtx = tabletCanvas.getContext('2d')!;
    tCtx.fillStyle = '#0f172a';
    tCtx.fillRect(0, 0, 128, 256);
    tCtx.strokeStyle = '#f59e0b';
    tCtx.lineWidth = 6;
    tCtx.strokeRect(4, 4, 120, 248);
    tCtx.fillStyle = '#fbbf24';
    tCtx.font = 'bold 54px serif';
    tCtx.textAlign = 'center';
    tCtx.fillText('詠', 64, 90);
    tCtx.fillText('唱', 64, 175);
    const tabTex = new THREE.CanvasTexture(tabletCanvas);

    const tabGeo = new THREE.BoxGeometry(0.85, 1.35, 0.15);
    const tabMat = new THREE.MeshStandardMaterial({ map: tabTex, roughness: 0.5 });
    const tab = new THREE.Mesh(tabGeo, tabMat);
    tab.position.set(0, 7.1, 0);
    toriiGroup.add(tab);

    this.scene.add(toriiGroup);
  }

  // --- 6. TRADITIONAL JAPANESE MARKET STALLS & STOREFRONTS ---
  private createMarketStalls() {
    const stallZPositions = [-18.0, -10.0, -2.0, 6.0, 14.0, 22.0];
    const shopConfigs = [
      { title: '肉汁餃子酒場', sign: '餃', type: 'izakaya' },
      { title: '手羽餃子・焼鳥', sign: '串', type: 'yakitori' },
      { title: '錦市場・海鮮', sign: '魚', type: 'market' },
      { title: '手作り和菓子', sign: '菓', type: 'sweets' },
      { title: '伝統工芸・狐面', sign: '面', type: 'crafts' },
      { title: '宇治銘茶・酒', sign: '茶', type: 'tea' },
    ];

    stallZPositions.forEach((zPos, idx) => {
      const cfgLeft = shopConfigs[idx % shopConfigs.length];
      const cfgRight = shopConfigs[(idx + 3) % shopConfigs.length];

      // Left side stall
      this.buildRichMarketStall(-6.8, zPos, 1, cfgLeft, idx);
      // Right side stall
      this.buildRichMarketStall(6.8, zPos, -1, cfgRight, idx + 10);
    });
  }

  /**
   * Builds an authentic Japanese wooden market stall / tavern facade based on Reference Images 1 & 2
   */
  private buildRichMarketStall(
    xPos: number,
    zPos: number,
    directionX: number, // 1: facing +X (street), -1: facing -X (street)
    config: { title: string; sign: string; type: string },
    stallSeed: number
  ) {
    const stallGroup = new THREE.Group();
    stallGroup.position.set(xPos, 0.7, zPos);

    const stallWidth = 5.4; // along Z
    const stallDepth = 3.4; // along X
    const stallHeight = 3.7;

    // 1. Warm Timber Facade Cladding & Base Platform (Matching Image 1)
    const deckGeo = new THREE.BoxGeometry(stallDepth, 0.18, stallWidth);
    const deck = new THREE.Mesh(deckGeo, this.sharedMaterials.warmHinoki);
    deck.position.set(0, 0.09, 0);
    deck.receiveShadow = true;
    stallGroup.add(deck);

    // Multi-tiered wooden display counter (Matching Image 2 - Nishiki Market counter)
    const counterGeo = new THREE.BoxGeometry(stallDepth * 0.8, 0.95, stallWidth * 0.96);
    const counter = new THREE.Mesh(counterGeo, this.sharedMaterials.warmHinoki);
    counter.position.set(0, 0.52, 0);
    counter.castShadow = true;
    stallGroup.add(counter);

    // Lower slatted timber kickboard
    const kickboardGeo = new THREE.BoxGeometry(0.12, 0.85, stallWidth * 0.96);
    const kickboard = new THREE.Mesh(kickboardGeo, this.sharedMaterials.darkWood);
    kickboard.position.set(directionX * (stallDepth * 0.4), 0.48, 0);
    stallGroup.add(kickboard);

    // 2. Corner Cedar Posts
    [-stallDepth * 0.45, stallDepth * 0.45].forEach((px) => {
      [-stallWidth * 0.46, stallWidth * 0.46].forEach((pz) => {
        const post = new THREE.Mesh(
          new THREE.BoxGeometry(0.18, stallHeight, 0.18),
          this.sharedMaterials.darkWood
        );
        post.position.set(px, stallHeight / 2, pz);
        post.castShadow = true;
        stallGroup.add(post);
      });
    });

    // 3. Sloped Japanese Overhang Eave Roof with Dark Tiles
    const roofSlope = 0.28;
    const roofOverhangX = stallDepth * 1.35;
    const roofOverhangZ = stallWidth * 1.15;

    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(roofOverhangX, 0.18, roofOverhangZ),
      this.sharedMaterials.darkTileRoof
    );
    roof.position.set(0, stallHeight + 0.1, 0);
    roof.rotation.z = -directionX * roofSlope;
    roof.castShadow = true;
    stallGroup.add(roof);

    const ridge = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.24, roofOverhangZ * 1.05),
      this.sharedMaterials.darkWood
    );
    ridge.position.set(0, stallHeight + 0.3, 0);
    stallGroup.add(ridge);

    // 4. Large Authentic Japanese Wooden Signboard (Matching Image 1: "肉汁餃子酒場 / 営業中")
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 512;
    signCanvas.height = 160;
    const sCtx = signCanvas.getContext('2d')!;
    sCtx.fillStyle = '#c88b48'; // Warm timber
    sCtx.fillRect(0, 0, 512, 160);
    // Draw woodgrain lines
    sCtx.fillStyle = '#b47738';
    for (let i = 0; i < 160; i += 8) {
      sCtx.fillRect(0, i, 512, 2);
    }
    // Red calligraphy seal & Kanji text
    sCtx.strokeStyle = '#dc2626';
    sCtx.lineWidth = 5;
    sCtx.beginPath();
    sCtx.arc(75, 80, 48, 0, Math.PI * 2);
    sCtx.stroke();
    sCtx.fillStyle = '#dc2626';
    sCtx.font = 'bold 52px "Hiragino Sans", "Meiryo", serif';
    sCtx.textAlign = 'center';
    sCtx.fillText(config.sign, 75, 98);

    sCtx.fillStyle = '#1c1917';
    sCtx.font = 'bold 44px "Hiragino Sans", "Meiryo", serif';
    sCtx.textAlign = 'left';
    sCtx.fillText(config.title, 145, 95);

    const signTex = new THREE.CanvasTexture(signCanvas);
    const signMat = new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.6 });
    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.95, 3.2), signMat);
    signBoard.position.set(directionX * (stallDepth * 0.58), stallHeight + 0.15, 0);
    stallGroup.add(signBoard);

    // Small standing A-frame sidewalk menu board (Matching Image 1: "営業中")
    const menuBoard = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.85, 0.65),
      this.sharedMaterials.darkWood
    );
    menuBoard.position.set(directionX * (stallDepth * 0.52), 0.45, -stallWidth * 0.38);
    menuBoard.rotation.y = directionX > 0 ? 0.3 : -0.3;
    stallGroup.add(menuBoard);

    // 5. Hanging Noren Fabric Curtains with Japanese Crests (Indigo / Crimson)
    const norenCanvas = document.createElement('canvas');
    norenCanvas.width = 256;
    norenCanvas.height = 128;
    const nCtx = norenCanvas.getContext('2d')!;
    nCtx.fillStyle = stallSeed % 2 === 0 ? '#1e3a8a' : '#991b1b';
    nCtx.fillRect(0, 0, 256, 128);
    nCtx.strokeStyle = '#ffffff';
    nCtx.lineWidth = 4;
    nCtx.strokeRect(6, 6, 244, 116);
    nCtx.fillStyle = '#ffffff';
    nCtx.font = 'bold 58px "Hiragino Sans", "Meiryo", serif';
    nCtx.textAlign = 'center';
    nCtx.fillText(config.sign + ' • 手作', 128, 80);

    const norenTex = new THREE.CanvasTexture(norenCanvas);
    const norenMat = new THREE.MeshStandardMaterial({ map: norenTex, side: THREE.DoubleSide });
    const noren = new THREE.Mesh(new THREE.PlaneGeometry(stallWidth * 0.85, 0.75), norenMat);
    noren.position.set(directionX * (stallDepth * 0.52), stallHeight - 0.45, 0);
    noren.rotation.y = directionX > 0 ? Math.PI / 2 : -Math.PI / 2;
    stallGroup.add(noren);

    // 6. Hanging Festoon String Light Bulbs under Eaves (Matching Image 1)
    const bulbCount = 6;
    for (let b = 0; b < bulbCount; b++) {
      const bZ = -stallWidth * 0.4 + (b / (bulbCount - 1)) * (stallWidth * 0.8);
      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.09, 8, 8),
        this.sharedMaterials.bulbGlow
      );
      bulb.position.set(directionX * (stallDepth * 0.56), stallHeight - 0.25, bZ);
      stallGroup.add(bulb);
    }

    // 7. Large Cylindrical Paper Lantern (*Chōchin*) Hanging from Stall Post (Matching Image 1 & 2)
    const chōchin = this.createHangingChōchinMesh(stallSeed % 2 === 0 ? 'red' : 'cream', 0.42);
    chōchin.position.set(directionX * (stallDepth * 0.58), stallHeight - 0.9, stallWidth * 0.4);
    stallGroup.add(chōchin);

    // 8. Densely Populated Market Products & Food Displays (Matching Image 2 - Nishiki Market)
    this.populateRichProductDisplays(stallGroup, directionX, config.type);

    // 9. Warm Internal Illuminating Point Light
    const sLight = new THREE.PointLight(0xf59e0b, 1.5, 6.0);
    sLight.position.set(directionX * (stallDepth * 0.25), stallHeight - 0.75, 0);
    this.lanternLights.push(sLight);
    stallGroup.add(sLight);

    this.scene.add(stallGroup);
  }

  /**
   * Populate shop display counters with dense realistic goods from Reference Image 2
   */
  private populateRichProductDisplays(stallGroup: THREE.Group, dirX: number, type: string) {
    const counterY = 1.05;

    // A. Food / Gyoza / Yakitori Stall (Image 2 style dense multi-tiered food trays)
    if (type === 'izakaya' || type === 'yakitori' || type === 'market') {
      // Row of rectangular metallic/wooden food trays
      [-1.6, -0.8, 0, 0.8, 1.6].forEach((tZ, idx) => {
        const tray = new THREE.Mesh(
          new THREE.BoxGeometry(0.55, 0.05, 0.65),
          this.sharedMaterials.darkTileRoof
        );
        tray.position.set(dirX * 0.2, counterY + 0.03, tZ);
        stallGroup.add(tray);

        // Food items inside tray (skewers, dumplings, golden fried items)
        const foodMat =
          idx % 3 === 0
            ? this.sharedMaterials.foodDumpling
            : idx % 3 === 1
            ? this.sharedMaterials.foodFried
            : this.sharedMaterials.foodGlazed;

        const foodClump = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.08, 0.55), foodMat);
        foodClump.position.set(dirX * 0.2, counterY + 0.08, tZ);
        stallGroup.add(foodClump);

        // Small yellow price tag card (Matching Image 2)
        const tag = new THREE.Mesh(
          new THREE.BoxGeometry(0.04, 0.16, 0.22),
          this.sharedMaterials.lanternAmber
        );
        tag.position.set(dirX * 0.52, counterY + 0.15, tZ);
        tag.rotation.y = dirX > 0 ? 0.2 : -0.2;
        stallGroup.add(tag);
      });

      // Steaming bamboo basket / cooking pot at the back
      const pot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.22, 0.35, 12),
        this.sharedMaterials.darkWood
      );
      pot.position.set(dirX * -0.25, counterY + 0.18, 0.5);
      stallGroup.add(pot);
    }
    // B. Traditional Crafts / Kitsune Masks / Souvenirs
    else if (type === 'crafts') {
      [-1.4, -0.5, 0.5, 1.4].forEach((mZ) => {
        // Wooden display stand
        const stand = new THREE.Mesh(
          new THREE.BoxGeometry(0.4, 0.15, 0.4),
          this.sharedMaterials.warmHinoki
        );
        stand.position.set(dirX * 0.2, counterY + 0.08, mZ);
        stallGroup.add(stand);

        // Traditional Kitsune mask
        const mask = new THREE.Mesh(
          new THREE.BoxGeometry(0.08, 0.38, 0.26),
          this.sharedMaterials.plasterWall
        );
        mask.position.set(dirX * 0.2, counterY + 0.34, mZ);
        mask.rotation.y = dirX > 0 ? 0.3 : -0.3;
        stallGroup.add(mask);
      });
    }
    // C. Traditional Tea & Sweets
    else {
      for (let i = -1.5; i <= 1.5; i += 0.6) {
        // Ceramic teacups / lacquer bowls
        const bowl = new THREE.Mesh(
          new THREE.CylinderGeometry(0.14, 0.09, 0.12, 8),
          this.sharedMaterials.vermilionTorii
        );
        bowl.position.set(dirX * 0.22, counterY + 0.06, i);
        stallGroup.add(bowl);
      }
      // Wooden tea canister boxes
      const teaBox = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 0.35, 0.35),
        this.sharedMaterials.darkWood
      );
      teaBox.position.set(dirX * -0.22, counterY + 0.18, -0.4);
      stallGroup.add(teaBox);
    }
  }

  // --- 7. OVERHEAD LANTERN CANOPY & STRINGS CROSSING STREET ---
  private createOverheadLanternStrings() {
    const cableZPositions = [-18.0, -10.0, -2.0, 6.0, 14.0, 22.0];

    cableZPositions.forEach((zPos, sIdx) => {
      const cableGroup = new THREE.Group();
      cableGroup.position.set(0, 0.7, zPos);

      // Catenary sag wire across street
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(-5.0, 4.4, 0),
        new THREE.Vector3(0, 3.8, 0),
        new THREE.Vector3(5.0, 4.4, 0)
      );
      const tubeGeo = new THREE.TubeGeometry(curve, 16, 0.015, 6, false);
      const tubeMat = new THREE.MeshBasicMaterial({ color: 0x111827 });
      const wire = new THREE.Mesh(tubeGeo, tubeMat);
      cableGroup.add(wire);

      // 5 Vibrant Chōchin lanterns along each crossing string
      const lanternXPositions = [-3.6, -1.8, 0, 1.8, 3.6];
      lanternXPositions.forEach((lx, lIdx) => {
        const t = (lx + 5.0) / 10.0;
        const pt = curve.getPoint(t);

        const colorType =
          (sIdx + lIdx) % 3 === 0 ? 'amber' : (sIdx + lIdx) % 3 === 1 ? 'red' : 'cream';
        const lanternMesh = this.createHangingChōchinMesh(colorType, 0.38);
        lanternMesh.position.set(pt.x, pt.y - 0.38, pt.z);
        cableGroup.add(lanternMesh);

        if (lIdx % 2 === 0) {
          const pLight = new THREE.PointLight(
            colorType === 'red' ? 0xf43f5e : 0xf59e0b,
            1.2,
            5.0
          );
          pLight.position.set(pt.x, pt.y - 0.4, pt.z);
          this.lanternLights.push(pLight);
          cableGroup.add(pLight);
        }
      });

      this.scene.add(cableGroup);
    });
  }

  /**
   * Helper to build a detailed traditional Japanese paper lantern (*Chōchin*)
   */
  private createHangingChōchinMesh(
    type: 'amber' | 'red' | 'cream',
    radius: number = 0.35
  ): THREE.Group {
    const group = new THREE.Group();

    const mat =
      type === 'amber'
        ? this.sharedMaterials.lanternAmber
        : type === 'red'
        ? this.sharedMaterials.lanternRed
        : this.sharedMaterials.lanternCream;

    const bodyGeo = new THREE.SphereGeometry(radius, 12, 10);
    bodyGeo.scale(1.0, 1.35, 1.0);
    const body = new THREE.Mesh(bodyGeo, mat);
    group.add(body);

    const collarGeo = new THREE.CylinderGeometry(radius * 0.45, radius * 0.45, 0.08, 10);
    const topCap = new THREE.Mesh(collarGeo, this.sharedMaterials.darkTileRoof);
    topCap.position.y = radius * 1.35 + 0.04;
    group.add(topCap);

    const botCap = new THREE.Mesh(collarGeo, this.sharedMaterials.darkTileRoof);
    botCap.position.y = -radius * 1.35 - 0.04;
    group.add(botCap);

    const stringGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.25, 4);
    const string = new THREE.Mesh(stringGeo, this.sharedMaterials.darkTileRoof);
    string.position.y = radius * 1.35 + 0.16;
    group.add(string);

    return group;
  }

  // --- 8. BACKGROUND TRADITIONAL JAPANESE MACHIYA BUILDINGS ---
  private createBackgroundMachiyaBuildings() {
    const zOffsets = [-24.0, -12.0, 0.0, 12.0, 24.0];

    zOffsets.forEach((z) => {
      this.buildMachiyaHouse(-13.5, z, 1);
      this.buildMachiyaHouse(13.5, z, -1);
    });
  }

  private buildMachiyaHouse(x: number, z: number, dirX: number) {
    const houseGroup = new THREE.Group();
    houseGroup.position.set(x, 0.7, z);

    const houseWidth = 10.5; // along Z
    const houseDepth = 7.0; // along X
    const houseHeight = 7.5; // 2 stories

    const bodyGeo = new THREE.BoxGeometry(houseDepth, houseHeight, houseWidth);
    const body = new THREE.Mesh(bodyGeo, this.sharedMaterials.plasterWall);
    body.position.set(0, houseHeight / 2, 0);
    body.castShadow = true;
    houseGroup.add(body);

    const timberGeo = new THREE.BoxGeometry(houseDepth * 1.02, 0.25, houseWidth * 1.02);
    const floorBeam = new THREE.Mesh(timberGeo, this.sharedMaterials.darkWood);
    floorBeam.position.set(0, 3.6, 0);
    houseGroup.add(floorBeam);

    const midEaveGeo = new THREE.BoxGeometry(houseDepth * 1.25, 0.2, houseWidth * 1.1);
    const midEave = new THREE.Mesh(midEaveGeo, this.sharedMaterials.darkTileRoof);
    midEave.position.set(0, 3.8, 0);
    midEave.rotation.z = -dirX * 0.18;
    houseGroup.add(midEave);

    const roofGeo = new THREE.BoxGeometry(houseDepth * 1.4, 0.35, houseWidth * 1.15);
    const roof = new THREE.Mesh(roofGeo, this.sharedMaterials.darkTileRoof);
    roof.position.set(0, houseHeight + 0.4, 0);
    roof.rotation.z = -dirX * 0.25;
    roof.castShadow = true;
    houseGroup.add(roof);

    this.scene.add(houseGroup);
  }

  // --- 9. FLORA & NATURE ACCENTS (Sakura & Pine Trees) ---
  private createFlora() {
    const treePositions = [
      { x: -16.0, z: -20.0, type: 'sakura' },
      { x: 16.0, z: -16.0, type: 'pine' },
      { x: -17.0, z: 2.0, type: 'pine' },
      { x: 17.0, z: 8.0, type: 'sakura' },
      { x: -16.5, z: 22.0, type: 'sakura' },
      { x: 16.5, z: 26.0, type: 'sakura' },
    ];

    treePositions.forEach((tp) => {
      const treeGroup = new THREE.Group();
      treeGroup.position.set(tp.x, 0.7, tp.z);

      const trunkGeo = new THREE.CylinderGeometry(0.35, 0.55, 6.5, 8);
      const trunk = new THREE.Mesh(trunkGeo, this.sharedMaterials.darkWood);
      trunk.position.set(0, 3.25, 0);
      trunk.castShadow = true;
      treeGroup.add(trunk);

      const foliageMat =
        tp.type === 'sakura'
          ? this.sharedMaterials.sakuraBlossom
          : this.sharedMaterials.pineNeedles;
      const canopyCount = tp.type === 'sakura' ? 5 : 3;

      for (let i = 0; i < canopyCount; i++) {
        const rad = 2.2 + Math.random() * 0.8;
        const clumpGeo = new THREE.SphereGeometry(rad, 8, 6);
        const clump = new THREE.Mesh(clumpGeo, foliageMat);
        clump.position.set(
          (Math.random() - 0.5) * 2.0,
          5.5 + i * 1.2,
          (Math.random() - 0.5) * 2.0
        );
        clump.castShadow = true;
        treeGroup.add(clump);
      }

      this.scene.add(treeGroup);
    });
  }

  // --- 10. YELLOW CHECKPOINT BEACON (Promptify Waypoint) ---
  private createYellowCheckpoint() {
    this.checkpointGroup = new THREE.Group();
    this.checkpointGroup.position.set(
      PROMPTIFY_CONFIG.checkpointPosition.x,
      PROMPTIFY_CONFIG.checkpointPosition.y,
      PROMPTIFY_CONFIG.checkpointPosition.z
    );

    const yellowColor = new THREE.Color(PROMPTIFY_EVENT_DATA.color);

    // 1. Core Floating Orb (Glowing inner sphere)
    const orbGeo = new THREE.SphereGeometry(0.22, 16, 16);
    const orbMat = new THREE.MeshBasicMaterial({
      color: yellowColor,
      transparent: true,
      opacity: 0.95,
    });
    this.checkpointOrb = new THREE.Mesh(orbGeo, orbMat);
    this.checkpointOrb.position.y = 1.6;
    this.checkpointGroup.add(this.checkpointOrb);

    const glowGeo = new THREE.SphereGeometry(0.42, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({
      color: yellowColor,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
    });
    this.checkpointOrb.add(new THREE.Mesh(glowGeo, glowMat));

    // 2. Orbital Ring 1
    const ring1Geo = new THREE.TorusGeometry(0.55, 0.022, 8, 32);
    const ring1Mat = new THREE.MeshBasicMaterial({
      color: yellowColor,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    });
    this.checkpointRing1 = new THREE.Mesh(ring1Geo, ring1Mat);
    this.checkpointRing1.position.y = 1.6;
    this.checkpointRing1.rotation.x = Math.PI * 0.35;
    this.checkpointGroup.add(this.checkpointRing1);

    // 3. Orbital Ring 2
    const ring2Geo = new THREE.TorusGeometry(0.44, 0.018, 8, 32);
    const ring2Mat = new THREE.MeshBasicMaterial({
      color: yellowColor,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    this.checkpointRing2 = new THREE.Mesh(ring2Geo, ring2Mat);
    this.checkpointRing2.position.y = 1.6;
    this.checkpointRing2.rotation.x = Math.PI * 0.65;
    this.checkpointRing2.rotation.z = Math.PI * 0.3;
    this.checkpointGroup.add(this.checkpointRing2);

    // 4. Vertical Celestial Light Beam
    const beamGeo = new THREE.CylinderGeometry(0.16, 0.38, 28.0, 16, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: yellowColor,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.checkpointBeam = new THREE.Mesh(beamGeo, beamMat);
    this.checkpointBeam.position.y = 14.0;
    this.checkpointGroup.add(this.checkpointBeam);

    const coronaGeo = new THREE.CylinderGeometry(0.45, 1.4, 28.0, 16, 1, true);
    const coronaMat = new THREE.MeshBasicMaterial({
      color: yellowColor,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const corona = new THREE.Mesh(coronaGeo, coronaMat);
    corona.position.y = 14.0;
    this.checkpointGroup.add(corona);

    // 5. Ground Sigil Rune Circles
    const runeGeo = new THREE.RingGeometry(0.75, 1.05, 32);
    const runeMat = new THREE.MeshBasicMaterial({
      color: yellowColor,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.checkpointRune = new THREE.Mesh(runeGeo, runeMat);
    this.checkpointRune.rotation.x = -Math.PI / 2;
    this.checkpointRune.position.y = 0.03;
    this.checkpointGroup.add(this.checkpointRune);

    // 6. Amber/Yellow Point Light
    this.checkpointLight = new THREE.PointLight(yellowColor, 2.4, 8.0, 1.5);
    this.checkpointLight.position.y = 1.6;
    this.checkpointGroup.add(this.checkpointLight);

    this.scene.add(this.checkpointGroup);
  }

  // --- 11. STATION RETURN DEPARTURE GATE ---
  private createStationDepartureGate() {
    const gateGroup = new THREE.Group();
    gateGroup.position.set(
      PROMPTIFY_CONFIG.returnGatePosition.x,
      PROMPTIFY_CONFIG.returnGatePosition.y,
      PROMPTIFY_CONFIG.returnGatePosition.z
    );

    [-2.2, 2.2].forEach((px) => {
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.24, 4.4, 8),
        this.sharedMaterials.vermilionTorii
      );
      post.position.set(px, 2.2, 0);
      gateGroup.add(post);
    });

    const lintel = new THREE.Mesh(
      new THREE.BoxGeometry(5.2, 0.35, 0.45),
      this.sharedMaterials.darkTileRoof
    );
    lintel.position.set(0, 4.3, 0);
    gateGroup.add(lintel);

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
    ctx.font = 'bold 36px "Hiragino Sans", "Meiryo", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('◄ 富士見高原駅行', 256, 65);
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('To Train Station (Board Trains)', 256, 115);

    const signTex = new THREE.CanvasTexture(canvas);
    const signGeo = new THREE.BoxGeometry(2.4, 0.75, 0.08);
    const signMat = new THREE.MeshStandardMaterial({ map: signTex });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, 2.8, 0);
    gateGroup.add(sign);

    const runeGeo = new THREE.RingGeometry(0.9, 1.8, 24);
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

    const gateLight = new THREE.PointLight(0xf59e0b, 1.8, 7.0);
    gateLight.position.set(0, 2.0, 0);
    gateGroup.add(gateLight);

    this.scene.add(gateGroup);
  }

  // --- 12. FLOATING ATMOSPHERIC SAKURA PETALS ---
  private createAtmosphericPetals() {
    this.petalPositions = new Float32Array(this.petalCount * 3);
    for (let i = 0; i < this.petalCount; i++) {
      this.petalPositions[i * 3] = (Math.random() - 0.5) * 20.0;
      this.petalPositions[i * 3 + 1] = 0.8 + Math.random() * 5.0;
      this.petalPositions[i * 3 + 2] = (Math.random() - 0.5) * 55.0;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.petalPositions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xfbcfe8,
      size: 0.4,
      transparent: true,
      opacity: 0.75,
    });
    this.atmosphericPetals = new THREE.Points(geo, mat);
    this.scene.add(this.atmosphericPetals);
  }

  /**
   * Trigger in-game 3D festival fireworks celebration upon Promptify registration
   */
  public triggerCelebration() {
    if (this.isCelebrationActive) return;
    this.isCelebrationActive = true;

    // 1. Launch 3D Fireworks Celebration (pure Three.js)
    this.fireworks.startCelebration();

    // 2. Enrich atmospheric lighting for nighttime celebration
    this.ambientLight.intensity = 2.4;
    this.ambientLight.color.setHex(0x3e4f7a);
  }

  /**
   * Animation update loop for Promptify
   */
  public update(delta: number) {
    const t = performance.now() * 0.001;

    // 1. Checkpoint Beacon Animations
    if (this.checkpointOrb) {
      const hover = Math.sin(t * 2.2) * 0.12;
      this.checkpointOrb.position.y = 1.6 + hover;
      this.checkpointRing1.position.y = 1.6 + hover;
      this.checkpointRing2.position.y = 1.6 + hover;

      this.checkpointRing1.rotation.y += delta * 0.8;
      this.checkpointRing1.rotation.x = Math.sin(t * 0.7) * 0.3;
      this.checkpointRing2.rotation.y -= delta * 0.6;
      this.checkpointRing2.rotation.z = Math.cos(t * 0.5) * 0.4;

      (this.checkpointBeam.material as THREE.MeshBasicMaterial).opacity =
        0.38 + Math.sin(t * 1.8) * 0.12;

      (this.checkpointRune.material as THREE.MeshBasicMaterial).opacity =
        0.25 + Math.sin(t * 1.4) * 0.1;
      this.checkpointRune.rotation.y += delta * 0.3;

      this.checkpointLight.intensity = 2.2 + Math.sin(t * 2.0) * 0.6;
    }

    // 2. Update Petal floating
    if (this.atmosphericPetals) {
      const pos = this.petalPositions;
      for (let i = 0; i < this.petalCount; i++) {
        pos[i * 3 + 1] -= delta * 0.45; // fall gently
        pos[i * 3] += Math.sin(t + i) * delta * 0.25; // sway
        if (pos[i * 3 + 1] < 0.7) {
          pos[i * 3 + 1] = 5.5;
        }
      }
      this.atmosphericPetals.geometry.attributes.position.needsUpdate = true;
    }

    // 3. Update In-Game 3D Particle Fireworks
    if (this.fireworks && this.fireworks.isRunning) {
      this.fireworks.update(delta);
    }
  }

  public destroy() {
    this.fireworks.dispose();
    promptifyAudio.stopAll();
  }
}
