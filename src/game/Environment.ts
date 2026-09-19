import * as THREE from 'three';
import { SanctuaryEventData } from '../types';

export const SANCTUARY_EVENTS: SanctuaryEventData[] = [
  {
    id: 'tech-treasure-hunt',
    name: 'Tech Treasure Hunt',
    kanji: '宝探し',
    tagline: 'Fuji Panoramic Overlook',
    position: { x: -6.0, y: 0.7, z: -6.5 },
    color: 0xf59e0b, // Amber gold
    colorHex: '#f59e0b',
  },
  {
    id: 'promptify',
    name: 'Promptify',
    kanji: '詠唱',
    tagline: 'Sakura Grove Passage',
    position: { x: -8.5, y: 0.7, z: 3.5 },
    color: 0xc084fc, // Ethereal purple
    colorHex: '#c084fc',
  },
  {
    id: 'logic-lamps',
    name: 'Logic Lamps',
    kanji: '論理灯',
    tagline: 'Chureito Pagoda Steps',
    position: { x: 4.2, y: 1.5, z: -1.5 },
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
  private petalCount = 450;
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

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.setupLighting();
    this.createSkyAndBackdrop();
    this.createMountFuji();
    this.createTerrainAndCourtyard();
    this.createChureitoPagoda();
    this.createSakuraTrees();
    this.createStoneLanterns();
    this.createWoodenRailings();
    this.createSakuraPetalSystem();
    this.createEventWaypoints();
  }

  /**
   * Lighting calibrated to sunset/dawn golden twilight matching reference photo
   */
  private setupLighting() {
    // Ambient light - soft lilac/rose tint
    const ambientLight = new THREE.AmbientLight(0xf2d9e6, 1.2);
    this.scene.add(ambientLight);

    // Directional Sun/Sky Light - warm apricot dawn light from right
    const dirLight = new THREE.DirectionalLight(0xffecd2, 2.2);
    dirLight.position.set(45, 60, 30);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 180;
    dirLight.shadow.camera.left = -40;
    dirLight.shadow.camera.right = 40;
    dirLight.shadow.camera.top = 40;
    dirLight.shadow.camera.bottom = -40;
    dirLight.shadow.bias = -0.0005;
    this.scene.add(dirLight);

    // Soft cool blue-violet fill light from opposite side
    const fillLight = new THREE.DirectionalLight(0xa5b4fc, 0.8);
    fillLight.position.set(-35, 30, -25);
    this.scene.add(fillLight);

    // Atmospheric Fog matching twilight mist
    this.scene.fog = new THREE.FogExp2(0xebd2de, 0.009);
  }

  /**
   * Atmospheric sky dome with soft gradient and distant clouds
   */
  private createSkyAndBackdrop() {
    // Sky Dome with twilight gradient
    const skyGeo = new THREE.SphereGeometry(350, 32, 24);
    
    // Shader or vertex colored sky
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, '#585e82');   // Twilight purple blue above
    grad.addColorStop(0.4, '#a288a6'); // Soft lavender
    grad.addColorStop(0.65, '#e4a5b8');// Rose dawn pink
    grad.addColorStop(0.85, '#f6c3a9');// Soft peach/apricot horizon
    grad.addColorStop(1.0, '#ebd4d8'); // Mist base
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

    // Volumetric cloud layer in the valley
    const cloudMat = new THREE.MeshBasicMaterial({
      color: 0xedd6df,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
    });
    for (let i = 0; i < 24; i++) {
      const cloudW = 25 + Math.random() * 35;
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
   */
  private createTerrainAndCourtyard() {
    // 1. Lower Mountain Base Terrain
    const baseTerrainGeo = new THREE.PlaneGeometry(160, 160, 32, 32);
    const pos = baseTerrainGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      // Gentle slope dropping down into valley in front
      const drop = Math.max(0, -y - 10) * 0.25;
      pos.setZ(i, Math.sin(x * 0.08) * 1.5 + Math.cos(y * 0.08) * 1.5 - drop);
    }
    baseTerrainGeo.computeVertexNormals();

    const grassMat = new THREE.MeshStandardMaterial({
      color: 0x5b7052,
      roughness: 0.85,
      flatShading: true,
    });
    const baseTerrain = new THREE.Mesh(baseTerrainGeo, grassMat);
    baseTerrain.rotation.x = -Math.PI / 2;
    baseTerrain.position.set(0, -1.8, 0);
    baseTerrain.receiveShadow = true;
    this.scene.add(baseTerrain);

    // 2. Main Overlook Stone Terrace (Where player walks and views Fuji)
    const terraceMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8, // Light stone
      roughness: 0.65,
      flatShading: true,
    });
    const terraceGeo = new THREE.BoxGeometry(32, 1.4, 26);
    const terrace = new THREE.Mesh(terraceGeo, terraceMat);
    terrace.position.set(0, 0, 0);
    terrace.receiveShadow = true;
    terrace.castShadow = true;
    this.scene.add(terrace);

    // Add collider for main terrace surface
    this.colliders.push({
      minX: -16,
      maxX: 16,
      minZ: -13,
      maxZ: 13,
      height: 0.7,
    });

    // 3. Pagoda Raised Stone Foundation (Right Side)
    const pagodaBaseMat = new THREE.MeshStandardMaterial({
      color: 0x64748b, // Darker dressed ashlar stone
      roughness: 0.7,
      flatShading: true,
    });
    const pagodaBaseGeo = new THREE.BoxGeometry(16, 2.2, 16);
    const pagodaBase = new THREE.Mesh(pagodaBaseGeo, pagodaBaseMat);
    pagodaBase.position.set(11, 0.4, 1);
    pagodaBase.receiveShadow = true;
    pagodaBase.castShadow = true;
    this.scene.add(pagodaBase);

    // Add foundation collider
    this.colliders.push({
      minX: 3,
      maxX: 19,
      minZ: -7,
      maxZ: 9,
      height: 1.5,
    });

    // 4. Stone Pathway Slabs on Courtyard
    const slabMat = new THREE.MeshStandardMaterial({
      color: 0xcfd8dc,
      roughness: 0.5,
      flatShading: true,
    });
    for (let z = -11; z <= 11; z += 1.8) {
      const slab = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.08, 1.4), slabMat);
      slab.position.set(-2.5, 0.74, z);
      slab.receiveShadow = true;
      this.scene.add(slab);
    }
    for (let x = -2; x <= 7; x += 1.8) {
      const slab = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 2.2), slabMat);
      slab.position.set(x, 0.74, 1);
      slab.receiveShadow = true;
      this.scene.add(slab);
    }

    // 5. Stone Steps leading up to the Pagoda Terrace
    for (let s = 0; s < 4; s++) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.22, 0.6), slabMat);
      step.position.set(2.4 - s * 0.55, 0.75 + s * 0.2, 1);
      step.receiveShadow = true;
      step.castShadow = true;
      this.scene.add(step);
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
   * Blooming Sakura (Cherry Blossom) trees framing the scene
   */
  private createSakuraTrees() {
    // Tree wood material - dark weathered bark
    const barkMat = new THREE.MeshStandardMaterial({
      color: 0x2b2118,
      roughness: 0.9,
      flatShading: true,
    });

    // Blossom materials with soft pink gradient hues
    const blossomColors = [0xfbcfe8, 0xf472b6, 0xf9a8d4, 0xfce7f3, 0xfda4af];
    const blossomMats = blossomColors.map(
      (col) =>
        new THREE.MeshStandardMaterial({
          color: col,
          roughness: 0.6,
          metalness: 0.05,
          flatShading: true,
        })
    );

    // Positions matching the reference photo:
    // Pushed outward around the perimeter and elevated so crowns are well above player/camera sightlines
    const treePositions = [
      // Left framing trees (pushed further back to perimeter and raised higher)
      { x: -16, y: 0.8, z: -8, scale: 1.5, rotation: 0.3 },
      { x: -15, y: 0.8, z: 2, scale: 1.35, rotation: 1.2 },
      { x: -17, y: 0.4, z: 9, scale: 1.4, rotation: -0.5 },
      // Valley canopy edge below terrace railing (creating sea of pink blossoms down in valley)
      { x: -9, y: -1.6, z: -17, scale: 1.5, rotation: 0.7 },
      { x: -2, y: -1.8, z: -19, scale: 1.4, rotation: 2.1 },
      { x: 5, y: -1.8, z: -20, scale: 1.6, rotation: -1.1 },
      { x: 13, y: -1.6, z: -18, scale: 1.3, rotation: 0.4 },
      // Trees flanking the Pagoda on the right outer perimeter
      { x: 23, y: 0.8, z: 1, scale: 1.25, rotation: 1.8 },
      { x: 21, y: 0.6, z: -9, scale: 1.35, rotation: -0.9 },
      { x: 19, y: 0.4, z: 12, scale: 1.2, rotation: 0.2 },
      // Behind the courtyard perimeter
      { x: -8, y: 0.4, z: 18, scale: 1.3, rotation: 0.5 },
      { x: 3, y: 0.4, z: 18, scale: 1.2, rotation: -1.5 },
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
   * Stone Lanterns (Kasuga Tōrō) on the terrace with warm candlelight
   */
  private createStoneLanterns() {
    const lanternMat = new THREE.MeshStandardMaterial({
      color: 0x78869b, // Weathered granite stone
      roughness: 0.8,
      flatShading: true,
    });

    const fireMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a, // Warm glowing fire box
    });

    // Positions matching the stone lanterns in the photo
    const lanternPositions = [
      { x: -1.2, z: -6.5 },
      { x: 3.8, z: -6.5 },
      { x: 3.8, z: -1.5 },
      { x: -8.5, z: -6.5 },
      { x: -8.5, z: 6.5 },
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
      const firebox = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.42), fireMat);
      firebox.position.y = 1.62;
      lantern.add(firebox);

      // Umbrella roof cap (Kasa)
      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.75, 0.35, 6), lanternMat);
      cap.position.y = 1.95;
      lantern.add(cap);

      // Top jewel finial (Hoju)
      const finial = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), lanternMat);
      finial.position.y = 2.22;
      lantern.add(finial);

      // Warm point light radiating into scene
      const light = new THREE.PointLight(0xf59e0b, 1.4, 6);
      light.position.y = 1.62;
      lantern.add(light);
      this.lanternLights.push(light);

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
  private createWoodenRailings() {
    const railMat = new THREE.MeshStandardMaterial({
      color: 0x2b221d, // Dark weathered cedar timber
      roughness: 0.75,
      flatShading: true,
    });

    // North overlook fence (facing Mt. Fuji)
    const northRailing = new THREE.Group();
    northRailing.position.set(-6, 0.7, -12.5);

    const length = 19;
    const topBar = new THREE.Mesh(new THREE.BoxGeometry(length, 0.1, 0.14), railMat);
    topBar.position.set(0, 0.95, 0);
    const midBar = new THREE.Mesh(new THREE.BoxGeometry(length, 0.08, 0.1), railMat);
    midBar.position.set(0, 0.5, 0);
    northRailing.add(topBar, midBar);

    // Vertical posts
    for (let x = -length / 2; x <= length / 2; x += 1.4) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.05, 0.14), railMat);
      post.position.set(x, 0.5, 0);
      post.castShadow = true;
      northRailing.add(post);
    }
    this.scene.add(northRailing);

    // West overlook fence
    const westRailing = new THREE.Group();
    westRailing.position.set(-15.5, 0.7, 0);
    westRailing.rotation.y = Math.PI / 2;

    const wLength = 25;
    const wTop = new THREE.Mesh(new THREE.BoxGeometry(wLength, 0.1, 0.14), railMat);
    wTop.position.set(0, 0.95, 0);
    const wMid = new THREE.Mesh(new THREE.BoxGeometry(wLength, 0.08, 0.1), railMat);
    wMid.position.set(0, 0.5, 0);
    westRailing.add(wTop, wMid);

    for (let z = -wLength / 2; z <= wLength / 2; z += 1.4) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.05, 0.14), railMat);
      post.position.set(z, 0.5, 0);
      post.castShadow = true;
      westRailing.add(post);
    }
    this.scene.add(westRailing);
  }

  /**
   * Floating Cherry Blossom Petals Particle System
   */
  private createSakuraPetalSystem() {
    const geo = new THREE.BufferGeometry();
    this.petalPositions = new Float32Array(this.petalCount * 3);
    this.petalSpeeds = new Float32Array(this.petalCount * 3);

    for (let i = 0; i < this.petalCount; i++) {
      // Scatter within play area and valley
      this.petalPositions[i * 3] = (Math.random() - 0.5) * 50;
      this.petalPositions[i * 3 + 1] = Math.random() * 18;
      this.petalPositions[i * 3 + 2] = (Math.random() - 0.5) * 45;

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
   * Update animation loop (drifting petals, flickering lantern lights)
   */
  public update(delta: number) {
    // 1. Drifting Petals animation
    const pos = this.petalParticles.geometry.attributes.position;
    for (let i = 0; i < this.petalCount; i++) {
      const idx = i * 3;
      // Swaying sine wave wind effect
      const windX = Math.sin(this.petalPositions[idx + 1] * 0.5 + i) * 0.2;

      this.petalPositions[idx] += (this.petalSpeeds[idx] + windX) * delta;
      this.petalPositions[idx + 1] += this.petalSpeeds[idx + 1] * delta;
      this.petalPositions[idx + 2] += this.petalSpeeds[idx + 2] * delta;

      // Reset when below ground
      if (this.petalPositions[idx + 1] < 0) {
        this.petalPositions[idx + 1] = 16 + Math.random() * 4;
        this.petalPositions[idx] = (Math.random() - 0.5) * 50;
        this.petalPositions[idx + 2] = (Math.random() - 0.5) * 45;
      }
    }
    pos.needsUpdate = true;

    // 2. Subtle organic lantern flicker
    const time = performance.now() * 0.003;
    this.lanternLights.forEach((light, idx) => {
      light.intensity = 1.3 + Math.sin(time * 3 + idx * 1.7) * 0.2;
    });

    // 3. Animate event waypoint beacons
    this.eventWaypointObjects.forEach((wp, idx) => {
      const t = time + idx * 2.1;

      // Floating orb gentle hover bob
      wp.orb.position.y = 1.6 + Math.sin(t * 1.2) * 0.15;

      // Scale pulse on inner orb
      const pulse = 1.0 + Math.sin(t * 2.5) * 0.12;
      wp.orb.scale.set(pulse, pulse, pulse);

      // Rotate orbital rings
      wp.ring1.rotation.y += delta * 0.8;
      wp.ring1.rotation.x = Math.sin(t * 0.7) * 0.3;
      wp.ring2.rotation.y -= delta * 0.6;
      wp.ring2.rotation.z = Math.cos(t * 0.5) * 0.4;

      // Pulsing beam intensity
      const beamMat = wp.beam.material as THREE.MeshBasicMaterial;
      beamMat.opacity = 0.12 + Math.sin(t * 1.8) * 0.06;

      // Pulsing ground rune
      const runeMat = wp.groundRune.material as THREE.MeshBasicMaterial;
      runeMat.opacity = 0.2 + Math.sin(t * 1.4) * 0.1;
      wp.groundRune.rotation.y += delta * 0.3;

      // Breathing light intensity
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
    SANCTUARY_EVENTS.forEach((event) => {
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

      // 4. Vertical Light Beam (soft pillar from ground to sky)
      const beamGeo = new THREE.CylinderGeometry(0.06, 0.12, 5.0, 8, 1, true);
      const beamMat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.14,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.y = 2.5;
      group.add(beam);

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
}
