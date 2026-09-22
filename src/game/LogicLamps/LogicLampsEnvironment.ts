import * as THREE from 'three';
import { LOGIC_LAMPS_CONFIG } from './logicLampsConfig';
import { LogicLampsCheckpoint } from './LogicLampsCheckpoint';
import { LanternField } from './LanternField';

export class LogicLampsEnvironment {
  public scene: THREE.Scene;
  public checkpoint: LogicLampsCheckpoint;
  public lanternField: LanternField;

  // Sky & Celestial
  private starParticles!: THREE.Points;
  private moonMesh!: THREE.Mesh;
  private moonGlow!: THREE.Mesh;

  // Floating ambient static lanterns on river
  private ambientRiverLanterns: { group: THREE.Group; baseY: number; phase: number; speed: number }[] = [];
  
  // Hanging lanterns on bridge & houses
  private hangingLanterns: { mesh: THREE.Mesh; light?: THREE.PointLight }[] = [];

  // Animated river water surface
  private waterMesh!: THREE.Mesh;

  // Colliders for houses, pagoda, trees, bridge railings
  public colliders: { minX: number; maxX: number; minZ: number; maxZ: number; height: number }[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    this.setupLighting();
    this.createNightSkyAndCelestial();
    this.createDistantMountains();
    this.createTerrainAndRiver();
    this.createWoodenArchBridge();
    this.createJapaneseShrinePagoda();
    this.createVillageHouses();
    this.createDistantVillage();
    this.createPineTreesAndFoliage();
    this.createSakuraAndBamboo();
    this.createVillageEntranceToriiGate();
    this.createStoneLanterns();
    this.createHangingLanterns();
    this.createAmbientFloatingRiverLanterns();
    this.createStationDepartureGate();

    // Initialize Checkpoint on the bridge
    this.checkpoint = new LogicLampsCheckpoint();
    this.scene.add(this.checkpoint.group);

    // Initialize Instanced 100+ Lantern Release Field
    this.lanternField = new LanternField();
    this.scene.add(this.lanternField.group);
  }

  /**
   * Deep Japanese Night Village Lighting:
   * Cool indigo ambient moonlight + warm orange lantern point lights
   */
  private setupLighting() {
    // Warm golden-hour sunset haze — visible throughout the village
    this.scene.fog = new THREE.FogExp2(0xb05820, 0.0045);

    // Warm golden ambient fill — bathes every surface in sunset warmth
    const ambientLight = new THREE.AmbientLight(0xffd580, 3.4);
    this.scene.add(ambientLight);

    // Primary sunset sun: warm low-angle golden light from west-northwest
    const sunLight = new THREE.DirectionalLight(0xffb347, 2.6);
    sunLight.position.set(-55, 30, 15);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 140;
    const d = 40;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    this.scene.add(sunLight);

    // Soft purple-dusk fill from the eastern horizon opposite the sun
    const duskFill = new THREE.DirectionalLight(0x9966cc, 0.65);
    duskFill.position.set(40, 15, -25);
    this.scene.add(duskFill);

    // Warm ground-bounce: golden light reflected up from sun-lit terrain
    const groundBounce = new THREE.DirectionalLight(0xff9944, 0.45);
    groundBounce.position.set(0, -8, 0);
    this.scene.add(groundBounce);
  }

  /**
   * Starry Night Sky with Crescent Moon and Luminous Halo
   */
  private createNightSkyAndCelestial() {
    // ── 1. Vertex-colored sunset sky dome ─────────────────────────────────────
    // Horizon: bright golden-amber → mid-sky: warm pink/rose → zenith: deep indigo
    const skyGeo = new THREE.SphereGeometry(300, 32, 32);
    const skyColors: number[] = [];
    const pos = skyGeo.attributes.position as THREE.BufferAttribute;

    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      // t = 0 at horizon (y=0), t = 1 at zenith (y=250)
      const t = Math.max(0, Math.min(1, y / 250));
      let r: number, g: number, b: number;

      if (t < 0.12) {
        // Horizon blaze: rich golden-amber
        const u = t / 0.12;
        r = 1.00 + (0.95 - 1.00) * u;
        g = 0.65 + (0.44 - 0.65) * u;
        b = 0.12 + (0.08 - 0.12) * u;
      } else if (t < 0.42) {
        // Lower-mid sky: warm orange fading to rosy pink
        const u = (t - 0.12) / 0.30;
        r = 0.95 + (0.60 - 0.95) * u;
        g = 0.44 + (0.16 - 0.44) * u;
        b = 0.08 + (0.30 - 0.08) * u;
      } else {
        // Upper sky: pink-rose cooling to deep indigo
        const u = (t - 0.42) / 0.58;
        r = 0.60 + (0.06 - 0.60) * (u * u);
        g = 0.16 + (0.03 - 0.16) * u;
        b = 0.30 + (0.24 - 0.30) * u;
      }

      skyColors.push(r, g, b);
    }

    skyGeo.setAttribute('color', new THREE.Float32BufferAttribute(skyColors, 3));
    const skyMat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      side: THREE.BackSide,
      fog: false,
    });
    this.scene.add(new THREE.Mesh(skyGeo, skyMat));

    // ── 2. Low-horizon Sun Disk + layered additive glow spheres ─────────────
    const sunGroup = new THREE.Group();
    sunGroup.position.set(-130, 42, -65); // low west-northwest horizon

    // Sun core — bright golden disc
    const sunMesh = new THREE.Mesh(
      new THREE.SphereGeometry(10, 24, 24),
      new THREE.MeshBasicMaterial({ color: 0xffdd44, fog: false })
    );
    this.moonMesh = sunMesh;
    sunGroup.add(sunMesh);

    // Inner warm halo (additive sphere — visible from every camera angle)
    const innerHalo = new THREE.Mesh(
      new THREE.SphereGeometry(22, 16, 16),
      new THREE.MeshBasicMaterial({
        color: 0xff9900,
        transparent: true,
        opacity: 0.18,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
      })
    );
    this.moonGlow = innerHalo;
    sunGroup.add(innerHalo);

    // Outer atmospheric bloom (very soft)
    const outerHalo = new THREE.Mesh(
      new THREE.SphereGeometry(48, 16, 16),
      new THREE.MeshBasicMaterial({
        color: 0xff6600,
        transparent: true,
        opacity: 0.07,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
      })
    );
    sunGroup.add(outerHalo);
    this.scene.add(sunGroup);

    // ── 3. Faint early-evening stars visible only near the zenith ─────────────
    const starCount = 200;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * 2.0 * Math.PI;
      const phi = Math.random() * 0.55; // concentrated near zenith
      const r = 270;
      starPos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = r * Math.cos(phi);
      starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    this.starParticles = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.9,
        transparent: true,
        opacity: 0.25, // subtle — only the brightest stars visible at dusk
      })
    );
    this.scene.add(this.starParticles);
  }

  /**
   * Distant Mountain Ranges featuring iconic Mount Fuji (Fuji-san)
   * Framed against the sunset horizon with classic snow-capped peak and volcanic foothills
   */
  private createDistantMountains() {
    const mountainMat = new THREE.MeshStandardMaterial({
      color: 0x32203e, // dusk mauve-indigo volcanic rock
      roughness: 0.95,
      metalness: 0.05,
    });

    const fujiRockMat = new THREE.MeshStandardMaterial({
      color: 0x382347, // volcanic slope purple-violet
      roughness: 0.92,
      metalness: 0.04,
    });

    const snowCapMat = new THREE.MeshStandardMaterial({
      color: 0xfffcfd, // pristine snow reflecting sunset blush
      roughness: 0.55,
      metalness: 0.05,
      emissive: 0x5a2d48,
      emissiveIntensity: 0.35,
    });

    // ── 1. Iconic Mount Fuji (Fuji-san) on the Northern Horizon ─────────────
    const fujiGroup = new THREE.Group();
    // Positioned prominently in the distance directly visible across the river & pagoda
    fujiGroup.position.set(-15, 0, -210);

    // Fuji Lower Volcanic Slopes: sweeping conical volcano base
    const fujiBase = new THREE.Mesh(
      new THREE.CylinderGeometry(14, 110, 85, 32, 1, true),
      fujiRockMat
    );
    fujiBase.position.y = 42.5;
    fujiGroup.add(fujiBase);

    // Fuji Snow-Capped Peak: upper truncated cone
    const fujiSnow = new THREE.Mesh(
      new THREE.CylinderGeometry(8, 48, 45, 32),
      snowCapMat
    );
    fujiSnow.position.y = 85 + 22.5;
    fujiGroup.add(fujiSnow);

    // Realistic snow tongues/gullies cascading down the volcanic ridges
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const gullyLen = 14 + (i % 3) * 6;
      const gully = new THREE.Mesh(
        new THREE.ConeGeometry(3.5, gullyLen, 4),
        snowCapMat
      );
      const rad = 48 + 3.5;
      gully.position.set(Math.sin(angle) * rad, 85 - gullyLen * 0.38, Math.cos(angle) * rad);
      gully.rotation.x = Math.PI; // pointing down
      gully.rotation.y = angle;
      fujiGroup.add(gully);
    }

    // Fuji Summit Crater (gentle dark volcanic caldera depression)
    const crater = new THREE.Mesh(
      new THREE.CylinderGeometry(7.5, 7.8, 3, 24),
      new THREE.MeshBasicMaterial({ color: 0x22132b })
    );
    crater.position.y = 107.5;
    fujiGroup.add(crater);

    this.scene.add(fujiGroup);

    // ── 2. Layered Mountain Foothills wrapping the horizon ───────────────────
    const foothillConfigs = [
      // Foothills framing Fuji on the North
      { x: -110, z: -180, radius: 75, height: 75 },
      { x: 75, z: -195, radius: 85, height: 80 },
      { x: -160, z: -150, radius: 90, height: 85 },
      { x: 150, z: -160, radius: 80, height: 75 },
      // South valley ridgelines
      { x: -90, z: 160, radius: 75, height: 70 },
      { x: 30, z: 180, radius: 95, height: 85 },
      { x: 130, z: 150, radius: 80, height: 75 },
      { x: -140, z: 120, radius: 70, height: 65 },
      // East & West distant passes
      { x: -180, z: 0, radius: 80, height: 60 },
      { x: 180, z: 0, radius: 85, height: 65 },
    ];

    foothillConfigs.forEach((m) => {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(m.radius, m.height, 14), mountainMat);
      cone.position.set(m.x, m.height * 0.42, m.z);
      this.scene.add(cone);
    });
  }

  /**
   * Village Valley Terrain, Living River, and Surrounding Countryside
   */
  private createTerrainAndRiver() {
    const grassMat = new THREE.MeshStandardMaterial({
      color: 0x2a361e, // warm dusk grass bathed in sunset light
      roughness: 0.85,
    });

    const extendedValleyMat = new THREE.MeshStandardMaterial({
      color: 0x243219, // lush countryside meadows extending into foothills
      roughness: 0.9,
    });

    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x3d3835, // warm stone embankment
      roughness: 0.75,
    });

    // ── 1. North Village Ground (Player walkable: Z: -28 to -7.5) ─────────────
    const northBank = new THREE.Mesh(new THREE.BoxGeometry(76, 2.0, 22), grassMat);
    northBank.position.set(0, 0.8, -18.5);
    northBank.receiveShadow = true;
    this.scene.add(northBank);

    // North Stone Embankment along river edge (extending 300m across valley)
    const northEmbankment = new THREE.Mesh(new THREE.BoxGeometry(300, 2.2, 1.2), stoneMat);
    northEmbankment.position.set(0, 0.9, -7.5);
    northEmbankment.receiveShadow = true;
    this.scene.add(northEmbankment);

    // ── 2. South Village Ground (Player walkable: Z: 7.5 to 28) ─────────────
    const southBank = new THREE.Mesh(new THREE.BoxGeometry(76, 2.0, 22), grassMat);
    southBank.position.set(0, 0.8, 18.5);
    southBank.receiveShadow = true;
    this.scene.add(southBank);

    // South Stone Embankment along river edge (extending 300m across valley)
    const southEmbankment = new THREE.Mesh(new THREE.BoxGeometry(300, 2.2, 1.2), stoneMat);
    southEmbankment.position.set(0, 0.9, 7.5);
    southEmbankment.receiveShadow = true;
    this.scene.add(southEmbankment);

    // ── 3. Expansive Countryside Valley Terraces (Removes "trapped" feeling!) ─
    // North Valley Floor stretching 300m wide and back to Z: -150 towards Fuji
    const northValley = new THREE.Mesh(new THREE.BoxGeometry(300, 1.8, 125), extendedValleyMat);
    northValley.position.set(0, 0.7, -85);
    northValley.receiveShadow = true;
    this.scene.add(northValley);

    // South Valley Floor stretching 300m wide and forward to Z: +150
    const southValley = new THREE.Mesh(new THREE.BoxGeometry(300, 1.8, 125), extendedValleyMat);
    southValley.position.set(0, 0.7, 85);
    southValley.receiveShadow = true;
    this.scene.add(southValley);

    // East and West valley grounds flanking the village center
    [-94, 94].forEach((xSide) => {
      const sideValleyN = new THREE.Mesh(new THREE.BoxGeometry(112, 1.9, 36), extendedValleyMat);
      sideValleyN.position.set(xSide, 0.75, -25);
      sideValleyN.receiveShadow = true;
      this.scene.add(sideValleyN);

      const sideValleyS = new THREE.Mesh(new THREE.BoxGeometry(112, 1.9, 36), extendedValleyMat);
      sideValleyS.position.set(xSide, 0.75, 25);
      sideValleyS.receiveShadow = true;
      this.scene.add(sideValleyS);
    });

    // ── 4. Living Mountain Riverbed with Stones & Gravel ──────────────────────
    // Sandy-gravel riverbed channel (warm tones, visible through clear water)
    const riverbedMat = new THREE.MeshStandardMaterial({
      color: 0x5a4d3b, // warm river sand and gravel pebbles
      roughness: 0.92,
      metalness: 0.05,
    });
    const riverbed = new THREE.Mesh(new THREE.BoxGeometry(300, 0.6, 16), riverbedMat);
    riverbed.position.set(0, -0.05, 0);
    this.scene.add(riverbed);

    // Scattered natural rounded river rocks and boulders beneath the water
    const rockMatSlate = new THREE.MeshStandardMaterial({ color: 0x383e47, roughness: 0.8 });
    const rockMatMoss = new THREE.MeshStandardMaterial({ color: 0x46543b, roughness: 0.85 });
    const rockMatGranite = new THREE.MeshStandardMaterial({ color: 0x63574a, roughness: 0.75 });
    const rockMats = [rockMatSlate, rockMatMoss, rockMatGranite];

    const rockGeo = new THREE.DodecahedronGeometry(0.5, 1);
    for (let r = 0; r < 48; r++) {
      const rockMesh = new THREE.Mesh(rockGeo, rockMats[r % 3]);
      const rx = (Math.random() - 0.5) * 120;
      const rz = (Math.random() - 0.5) * 12.0;
      const rScale = 0.35 + Math.random() * 0.75;
      rockMesh.position.set(rx, 0.15 + rScale * 0.25, rz);
      rockMesh.scale.set(rScale * 1.3, rScale * 0.55, rScale); // squashed river pebble shape
      rockMesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      rockMesh.castShadow = true;
      rockMesh.receiveShadow = true;
      this.scene.add(rockMesh);
    }

    // ── 5. Living Crystal Mountain River Water ──────────────────────────────
    // Vibrant, clear Japanese river water (replaces the "black pool"!)
    // Low metalness ensures it shows its true aquatic color, with subtle emissive
    // glow so it glistens under the sunset sky from any camera angle.
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x1d8a9e, // clear luminous Japanese mountain aquamarine/teal
      roughness: 0.14,
      metalness: 0.05, // low metalness = NEVER pitch black
      transparent: true,
      opacity: 0.80,
      emissive: 0x0a3c48, // subtle inner aquatic radiance
      emissiveIntensity: 0.45,
    });

    const water = new THREE.Mesh(new THREE.PlaneGeometry(300, 15.0), waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.set(0, 0.42, 0);
    water.receiveShadow = true;
    this.waterMesh = water;
    this.scene.add(water);

    // Riverbank water foam ribbons along both edges
    const foamMat = new THREE.MeshBasicMaterial({
      color: 0xa8e6f0,
      transparent: true,
      opacity: 0.35,
    });
    [-6.8, 6.8].forEach((fz) => {
      const foamStrip = new THREE.Mesh(new THREE.PlaneGeometry(300, 0.75), foamMat);
      foamStrip.rotation.x = -Math.PI / 2;
      foamStrip.position.set(0, 0.43, fz);
      this.scene.add(foamStrip);
    });

    // ── 6. Village Stone Pathways ─────────────────────────────────────────────
    const pathMat = new THREE.MeshStandardMaterial({
      color: 0x403730,
      roughness: 0.7,
    });

    const northPath = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.05, 16), pathMat);
    northPath.position.set(0, 1.82, -15.5);
    northPath.receiveShadow = true;
    this.scene.add(northPath);

    const southPath = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.05, 16), pathMat);
    southPath.position.set(0, 1.82, 15.5);
    southPath.receiveShadow = true;
    this.scene.add(southPath);
  }

  /**
   * Traditional Arched Japanese Wooden Bridge across the River
   * Bridge deck is where the player walks and registers!
   */
  private createWoodenArchBridge() {
    const bridgeGroup = new THREE.Group();

    const woodDarkMat = new THREE.MeshStandardMaterial({
      color: 0x3d271d,
      roughness: 0.65,
    });
    const woodPlankMat = new THREE.MeshStandardMaterial({
      color: 0x5a3d2c,
      roughness: 0.6,
    });
    const railingVermilionMat = new THREE.MeshStandardMaterial({
      color: 0xa82b1e,
      roughness: 0.45,
    });

    // 1. Arched Wooden Planks (Deck)
    // Runs Z: -7.5 to +7.5. Width X: 4.8. Peak height at Z=0 is Y=2.25
    const plankCount = 28;
    for (let i = 0; i <= plankCount; i++) {
      const t = (i / plankCount) * 2.0 - 1.0; // -1 to 1
      const zPos = t * 7.5;
      const archY = 1.8 + (1.0 - t * t) * 0.45;

      const plank = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.14, 0.48), woodPlankMat);
      plank.position.set(0, archY, zPos);
      plank.rotation.x = -t * 0.08;
      plank.castShadow = true;
      plank.receiveShadow = true;
      bridgeGroup.add(plank);
    }

    // 2. Heavy Timber Support Beams (under bridge)
    [-1.8, 1.8].forEach((xBeam) => {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 15.6), woodDarkMat);
      beam.position.set(xBeam, 1.7, 0);
      beam.castShadow = true;
      bridgeGroup.add(beam);
    });

    // Vertical River Piling Pillars sunk into riverbed
    [-1.8, 1.8].forEach((xPillar) => {
      [-4.0, 0.0, 4.0].forEach((zPillar) => {
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 2.6, 8), woodDarkMat);
        pillar.position.set(xPillar, 1.0, zPillar);
        pillar.castShadow = true;
        bridgeGroup.add(pillar);
      });
    });

    // 3. Traditional Vermilion Handrails & Balusters on East and West sides
    [-2.2, 2.2].forEach((xRail) => {
      // Continuous top rail
      for (let i = 0; i < plankCount; i++) {
        const t = (i / plankCount) * 2.0 - 1.0;
        const zPos = t * 7.5;
        const archY = 1.8 + (1.0 - t * t) * 0.45;

        // Baluster post
        if (i % 2 === 0) {
          const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.85, 0.12), railingVermilionMat);
          post.position.set(xRail, archY + 0.48, zPos);
          post.castShadow = true;
          bridgeGroup.add(post);
        }

        // Segmented rail beam
        const railSegment = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 0.58), railingVermilionMat);
        railSegment.position.set(xRail, archY + 0.9, zPos);
        railSegment.rotation.x = -t * 0.08;
        bridgeGroup.add(railSegment);
      }

      // 4 Grand Giboshi Ornamental Posts at 4 bridge corners
      [-7.5, 7.5].forEach((zCorner) => {
        const endPost = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 1.3, 8), woodDarkMat);
        endPost.position.set(xRail, 2.4, zCorner);
        endPost.castShadow = true;
        bridgeGroup.add(endPost);

        // Golden bronze Giboshi finial (onion cap)
        const bronzeFinial = new THREE.Mesh(
          new THREE.ConeGeometry(0.14, 0.28, 8),
          new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8, roughness: 0.3 })
        );
        bronzeFinial.position.set(xRail, 3.1, zCorner);
        bridgeGroup.add(bronzeFinial);
      });
    });

    // Bridge boundary colliders (keep player on the bridge deck)
    this.colliders.push({ minX: -40, maxX: -2.3, minZ: -7.0, maxZ: 7.0, height: 4 }); // West river barrier
    this.colliders.push({ minX: 2.3, maxX: 40, minZ: -7.0, maxZ: 7.0, height: 4 });  // East river barrier

    this.scene.add(bridgeGroup);
  }

  /**
   * Iconic Japanese Pagoda / Shrine structure along East riverbank
   */
  private createJapaneseShrinePagoda() {
    const pagodaGroup = new THREE.Group();
    // Positioned gracefully on the east bank overlooking river and bridge
    pagodaGroup.position.set(19.0, 1.8, 4.0);

    const stoneBaseMat = new THREE.MeshStandardMaterial({ color: 0x272c33, roughness: 0.8 });
    const woodPillarMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.5 });
    const wallPlasterMat = new THREE.MeshStandardMaterial({ color: 0xeee7db, roughness: 0.7 });
    const roofTileMat = new THREE.MeshStandardMaterial({ color: 0x181c22, roughness: 0.55 });
    const windowGlowMat = new THREE.MeshStandardMaterial({
      color: 0xffb74d,
      emissive: 0xff8c00,
      emissiveIntensity: 1.4,
    });

    // 1. Massive Stone Bastion Platform & Foundation Podium
    // Bastion foundation extending deep into the riverbank bedrock (prevents any floating/void!)
    const bastion = new THREE.Mesh(new THREE.BoxGeometry(17.0, 2.4, 16.0), stoneBaseMat);
    bastion.position.set(-1.0, -0.6, 0);
    bastion.receiveShadow = true;
    pagodaGroup.add(bastion);

    // Upper Shrine Foundation Podium
    const base = new THREE.Mesh(new THREE.BoxGeometry(9.0, 1.4, 9.0), stoneBaseMat);
    base.position.y = 0.7;
    base.castShadow = true;
    base.receiveShadow = true;
    pagodaGroup.add(base);

    // 2. Solid Monolithic Stone Staircase (West side entrance)
    // Every step is a 100% solid stone block extending from the foundation base
    // up to its tread surface, with zero floating gaps!
    const stepCount = 5;
    const stepH = 1.4 / stepCount; // 0.28m per rise, perfectly meets 1.4m podium top
    const stepD = 0.65;
    const stepW = 3.8;

    for (let s = 0; s < stepCount; s++) {
      // Step height rises from bottom (s = 4) to top (s = 0)
      const treadY = (stepCount - s) * stepH; // s=0 -> 1.4, s=4 -> 0.28
      const blockH = treadY + 0.4; // anchors 0.4m into the bastion base
      const stepMesh = new THREE.Mesh(new THREE.BoxGeometry(stepD, blockH, stepW), stoneBaseMat);
      stepMesh.position.set(
        -4.5 - (s + 0.5) * stepD,
        -0.4 + blockH * 0.5,
        0
      );
      stepMesh.receiveShadow = true;
      stepMesh.castShadow = true;
      pagodaGroup.add(stepMesh);
    }

    // Wide Stone Flagstone Landing at the foot of the stairs
    const landing = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.45, stepW + 1.2), stoneBaseMat);
    landing.position.set(-4.5 - stepCount * stepD - 0.9, -0.05, 0);
    landing.receiveShadow = true;
    pagodaGroup.add(landing);

    // Solid Stone Balustrade Cheek Walls flanking the staircase on left and right
    [-1, 1].forEach((side) => {
      const zOffset = side * (stepW * 0.5 + 0.18);
      const totalStairLen = stepCount * stepD;
      const curb = new THREE.Mesh(
        new THREE.BoxGeometry(totalStairLen + 0.6, 1.2, 0.36),
        stoneBaseMat
      );
      curb.position.set(-4.5 - totalStairLen * 0.45, 0.4, zOffset);
      curb.rotation.z = Math.atan2(1.4, totalStairLen); // slope along stairs
      curb.castShadow = true;
      curb.receiveShadow = true;
      pagodaGroup.add(curb);
    });

    // 2. Three Pagoda Tiers
    const tierSizes = [
      { bodyW: 6.0, bodyH: 3.2, roofW: 9.4, yOffset: 1.4 },
      { bodyW: 4.8, bodyH: 2.8, roofW: 7.8, yOffset: 4.6 },
      { bodyW: 3.6, bodyH: 2.4, roofW: 6.2, yOffset: 7.4 },
    ];

    tierSizes.forEach((tier) => {
      // Walls
      const walls = new THREE.Mesh(new THREE.BoxGeometry(tier.bodyW, tier.bodyH, tier.bodyW), wallPlasterMat);
      walls.position.y = tier.yOffset + tier.bodyH * 0.5;
      walls.castShadow = true;
      pagodaGroup.add(walls);

      // Vermilion Corner Columns
      [-1, 1].forEach((cx) => {
        [-1, 1].forEach((cz) => {
          const col = new THREE.Mesh(
            new THREE.CylinderGeometry(0.18, 0.18, tier.bodyH, 6),
            woodPillarMat
          );
          col.position.set(cx * (tier.bodyW * 0.48), tier.yOffset + tier.bodyH * 0.5, cz * (tier.bodyW * 0.48));
          pagodaGroup.add(col);
        });
      });

      // Warm Shoji Windows
      const winGeo = new THREE.PlaneGeometry(1.6, 1.4);
      [-1, 1].forEach((dir) => {
        const winZ = new THREE.Mesh(winGeo, windowGlowMat);
        winZ.position.set(0, tier.yOffset + tier.bodyH * 0.5, dir * (tier.bodyW * 0.51));
        if (dir < 0) winZ.rotation.y = Math.PI;
        pagodaGroup.add(winZ);

        const winX = new THREE.Mesh(winGeo, windowGlowMat);
        winX.position.set(dir * (tier.bodyW * 0.51), tier.yOffset + tier.bodyH * 0.5, 0);
        winX.rotation.y = dir * (Math.PI / 2);
        pagodaGroup.add(winX);
      });

      // Sweeping Curved Roof Eaves
      const roofY = tier.yOffset + tier.bodyH + 0.3;
      const roof = new THREE.Mesh(new THREE.ConeGeometry(tier.roofW * 0.72, 1.3, 4), roofTileMat);
      roof.position.y = roofY;
      roof.rotation.y = Math.PI / 4;
      roof.castShadow = true;
      pagodaGroup.add(roof);
    });

    // 3. Pagoda Bronze Spire (Sōrin)
    const spireY = 7.4 + 2.4 + 1.3;
    const spire = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.22, 4.5, 8),
      new THREE.MeshStandardMaterial({ color: 0xc49742, metalness: 0.85, roughness: 0.3 })
    );
    spire.position.y = spireY + 2.0;
    pagodaGroup.add(spire);

    // Golden jewel (Hōju) at spire top
    const hoju = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xffaa00, emissiveIntensity: 0.8 })
    );
    hoju.position.y = spireY + 4.2;
    pagodaGroup.add(hoju);

    // Warm ambient glow around pagoda base
    const pagodaLight = new THREE.PointLight(0xff8c00, 2.2, 18, 1.5);
    pagodaLight.position.set(0, 3.2, 0);
    pagodaGroup.add(pagodaLight);

    // Add collider
    this.colliders.push({
      minX: 19.0 - 4.8,
      maxX: 19.0 + 4.8,
      minZ: 4.0 - 4.8,
      maxZ: 4.0 + 4.8,
      height: 18,
    });

    this.scene.add(pagodaGroup);
  }

  /**
   * Builds a Type A house: Traditional Minka farmhouse elevated on wooden stilts.
   * Features grey tiled hip roof, shoji screens, stone path lantern post.
   * Based on reference image 1.
   */
  private buildMinkaFarmhouse(w: number, l: number): THREE.Group {
    const g = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x5c3a1e, roughness: 0.75 });
    const darkWoodMat = new THREE.MeshStandardMaterial({ color: 0x2e1a0e, roughness: 0.82 });
    const plasterMat = new THREE.MeshStandardMaterial({ color: 0xddd5c0, roughness: 0.78 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x2a2f36, roughness: 0.55 });
    const shojiMat = new THREE.MeshStandardMaterial({ color: 0xffeec2, emissive: 0xff8800, emissiveIntensity: 1.4, roughness: 0.9 });
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x7a7a6e, roughness: 0.92 });

    // Raised platform (engawa base)
    const platform = new THREE.Mesh(new THREE.BoxGeometry(w + 1.2, 0.18, l + 1.0), darkWoodMat);
    platform.position.y = 0.72;
    g.add(platform);

    // Stilts (wooden legs)
    const stiltPositions = [
      [-w * 0.4, -l * 0.38], [w * 0.4, -l * 0.38],
      [-w * 0.4, l * 0.38], [w * 0.4, l * 0.38],
      [0, -l * 0.38], [0, l * 0.38],
    ];
    stiltPositions.forEach(([sx, sz]) => {
      const stilt = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.72, 6), woodMat);
      stilt.position.set(sx, 0.36, sz);
      g.add(stilt);
    });

    // Plaster walls
    const wallH = 2.5;
    const walls = new THREE.Mesh(new THREE.BoxGeometry(w, wallH, l), plasterMat);
    walls.position.y = 0.81 + wallH * 0.5;
    walls.castShadow = true;
    g.add(walls);

    // Dark wood frame pillars on corners
    [-1, 1].forEach(cx => [-1, 1].forEach(cz => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.2, wallH + 0.1, 0.2), darkWoodMat);
      post.position.set(cx * w * 0.48, 0.81 + wallH * 0.5, cz * l * 0.48);
      g.add(post);
    }));

    // Horizontal beam bands
    [0.5, 1.8].forEach(by => {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(w + 0.05, 0.12, 0.12), darkWoodMat);
      beam.position.set(0, 0.81 + by, l * 0.5);
      g.add(beam);
      const beamB = new THREE.Mesh(new THREE.BoxGeometry(w + 0.05, 0.12, 0.12), darkWoodMat);
      beamB.position.set(0, 0.81 + by, -l * 0.5);
      g.add(beamB);
    });

    // Shoji windows front (2 sliding panels)
    [-0.85, 0.85].forEach(ox => {
      const shoji = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.5, 0.06), shojiMat);
      shoji.position.set(ox, 0.81 + 1.2, l * 0.5 + 0.04);
      g.add(shoji);
      // Grid lattice on shoji
      [0, 0.55].forEach(lx => {
        const v = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.5, 0.07), darkWoodMat);
        v.position.set(ox - 0.55 + lx, 0.81 + 1.2, l * 0.5 + 0.05);
        g.add(v);
      });
      [0.45].forEach(ly => {
        const h2 = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.04, 0.07), darkWoodMat);
        h2.position.set(ox, 0.81 + ly, l * 0.5 + 0.05);
        g.add(h2);
      });
    });

    // Small square window on side
    const sideWin = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.8, 0.8), shojiMat);
    sideWin.position.set(w * 0.5 + 0.04, 0.81 + 1.4, 0.5);
    g.add(sideWin);
    // lattice cross on side window
    const sideV = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.8, 0.04), darkWoodMat);
    sideV.position.set(w * 0.5 + 0.05, 0.81 + 1.4, 0.5);
    g.add(sideV);

    // Irimoya (hip-and-gable) roof — main hip section
    const roofMain = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, l) * 0.82, 2.2, 4), roofMat);
    roofMain.position.y = 0.81 + wallH + 1.05;
    roofMain.rotation.y = Math.PI / 4;
    roofMain.castShadow = true;
    g.add(roofMain);

    // Roof eave overhang ledge
    const eave = new THREE.Mesh(new THREE.BoxGeometry(w + 1.6, 0.12, l + 1.6), roofMat);
    eave.position.y = 0.81 + wallH + 0.12;
    g.add(eave);

    // Stone garden lantern post (toro)
    const toroBase = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.14, 0.32), stoneMat);
    toroBase.position.set(l * 0.5 + 1.2, 0.07, 0.6);
    g.add(toroBase);
    const toroShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.8, 6), stoneMat);
    toroShaft.position.set(l * 0.5 + 1.2, 0.5, 0.6);
    g.add(toroShaft);
    const toroHead = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.28), stoneMat);
    toroHead.position.set(l * 0.5 + 1.2, 1.04, 0.6);
    g.add(toroHead);
    const toroCap = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.2, 4), stoneMat);
    toroCap.position.set(l * 0.5 + 1.2, 1.28, 0.6);
    toroCap.rotation.y = Math.PI / 4;
    g.add(toroCap);

    // Interior warm light
    const intLight = new THREE.PointLight(0xffa020, 1.6, 8.0);
    intLight.position.set(0, 0.81 + 1.0, 0);
    g.add(intLight);

    return g;
  }

  /**
   * Builds a Type B house: Tea House (Machiya) with open veranda.
   * Features warm golden tiled roof, open engawa deck, tatami interior glow.
   * Based on reference image 2.
   */
  private buildTeaHouse(w: number, l: number): THREE.Group {
    const g = new THREE.Group();
    const warmWoodMat = new THREE.MeshStandardMaterial({ color: 0x8b5e2a, roughness: 0.65 });
    const lightWoodMat = new THREE.MeshStandardMaterial({ color: 0xc4934a, roughness: 0.6 });
    const plasterMat = new THREE.MeshStandardMaterial({ color: 0xf0e8d0, roughness: 0.75 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0xb8722a, roughness: 0.5 }); // warm golden-brown roof
    const shojiMat = new THREE.MeshStandardMaterial({ color: 0xffe8a0, emissive: 0xff9900, emissiveIntensity: 1.8, roughness: 0.9 });
    const deckMat = new THREE.MeshStandardMaterial({ color: 0x9b6b30, roughness: 0.65 });

    // Raised deck/veranda platform (engawa)
    const deck = new THREE.Mesh(new THREE.BoxGeometry(w + 2.0, 0.2, l + 2.0), deckMat);
    deck.position.y = 0.4;
    g.add(deck);
    // Deck edge step
    const step = new THREE.Mesh(new THREE.BoxGeometry(w * 0.6, 0.18, 0.4), lightWoodMat);
    step.position.set(0, 0.09, (l + 2.0) * 0.5 + 0.2);
    g.add(step);

    // Main house body
    const wallH = 2.4;
    const walls = new THREE.Mesh(new THREE.BoxGeometry(w, wallH, l), plasterMat);
    walls.position.y = 0.5 + wallH * 0.5;
    walls.castShadow = true;
    g.add(walls);

    // Warm wood pillars — along front edge of veranda
    const verandaZ = (l * 0.5) + 0.8;
    [-1, 0, 1].forEach(px => {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.14, wallH + 0.6, 0.14), warmWoodMat);
      pillar.position.set(px * (w * 0.38), 0.5 + (wallH + 0.6) * 0.5, verandaZ);
      g.add(pillar);
    });
    // Side pillars
    [-1, 1].forEach(pz => {
      const sidePillar = new THREE.Mesh(new THREE.BoxGeometry(0.14, wallH + 0.6, 0.14), warmWoodMat);
      sidePillar.position.set(w * 0.5, 0.5 + (wallH + 0.6) * 0.5, pz * (l * 0.5));
      g.add(sidePillar);
    });

    // Wide sliding shoji panels
    [-0.7, 0.7].forEach(ox => {
      const shoji = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.6, 0.06), shojiMat);
      shoji.position.set(ox, 0.5 + 1.1, l * 0.5 + 0.04);
      g.add(shoji);
      // Lattice grid
      [-0.35, 0, 0.35].forEach(gx => {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.6, 0.07), warmWoodMat);
        bar.position.set(ox + gx, 0.5 + 1.1, l * 0.5 + 0.05);
        g.add(bar);
      });
      [0.4, 0.9].forEach(gy => {
        const hbar = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.04, 0.07), warmWoodMat);
        hbar.position.set(ox, 0.5 + gy, l * 0.5 + 0.05);
        g.add(hbar);
      });
    });

    // Gabled roof with overhanging eaves
    // Main ridge beam
    const ridgeBeam = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, l + 1.2), warmWoodMat);
    ridgeBeam.position.y = 0.5 + wallH + 1.55;
    g.add(ridgeBeam);

    // Triangular gable ends (prism shape via cone)
    const roofPrism = new THREE.Mesh(new THREE.CylinderGeometry(0.01, Math.max(w, l) * 0.75, 1.9, 4), roofMat);
    roofPrism.position.y = 0.5 + wallH + 0.92;
    roofPrism.rotation.y = Math.PI / 4;
    roofPrism.castShadow = true;
    g.add(roofPrism);
    // Eave ledge
    const eave = new THREE.Mesh(new THREE.BoxGeometry(w + 2.2, 0.14, l + 2.2), roofMat);
    eave.position.y = 0.5 + wallH + 0.1;
    g.add(eave);

    // Small hanging paper lantern
    const lanternBody = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.28, 8), new THREE.MeshStandardMaterial({ color: 0xff4422, emissive: 0xff2200, emissiveIntensity: 1.2 }));
    lanternBody.position.set(0, 0.5 + wallH - 0.2, verandaZ * 0.5);
    g.add(lanternBody);

    // Interior warm glow
    const intLight = new THREE.PointLight(0xffcc44, 2.0, 10.0);
    intLight.position.set(0, 0.5 + 1.0, 0);
    g.add(intLight);

    return g;
  }

  /**
   * Builds a Type C house: 2-story Machiya merchant shop with red accents.
   * Features red trim, upper balcony, ground-floor shop front, red paper lanterns.
   * Based on reference image 3.
   */
  private buildMachiyaShop(w: number, l: number): THREE.Group {
    const g = new THREE.Group();
    const darkWoodMat = new THREE.MeshStandardMaterial({ color: 0x2c1a0b, roughness: 0.75 });
    const plasterMat = new THREE.MeshStandardMaterial({ color: 0xe8e0cc, roughness: 0.78 });
    const redTrimMat = new THREE.MeshStandardMaterial({ color: 0xb81c0e, roughness: 0.5 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x252a30, roughness: 0.55 });
    const shojiMat = new THREE.MeshStandardMaterial({ color: 0xffe0a0, emissive: 0xff8800, emissiveIntensity: 1.5, roughness: 0.9 });
    const shopGlowMat = new THREE.MeshStandardMaterial({ color: 0xffcc66, emissive: 0xffaa00, emissiveIntensity: 2.0, roughness: 0.9 });

    // Ground floor: shop body
    const floor1H = 2.6;
    const f1Walls = new THREE.Mesh(new THREE.BoxGeometry(w, floor1H, l), plasterMat);
    f1Walls.position.y = floor1H * 0.5;
    f1Walls.castShadow = true;
    g.add(f1Walls);

    // Red trim band at ground floor top
    const trimBand = new THREE.Mesh(new THREE.BoxGeometry(w + 0.1, 0.22, l + 0.1), redTrimMat);
    trimBand.position.y = floor1H;
    g.add(trimBand);

    // Shop front awning (red)
    const awning = new THREE.Mesh(new THREE.BoxGeometry(w + 0.4, 0.08, 1.2), redTrimMat);
    awning.position.set(0, floor1H - 0.5, (l * 0.5) + 0.6);
    awning.rotation.x = -0.2;
    g.add(awning);

    // Shop window/door opening (glowing interior)
    const shopFront = new THREE.Mesh(new THREE.BoxGeometry(w * 0.65, floor1H * 0.62, 0.06), shopGlowMat);
    shopFront.position.set(0, floor1H * 0.38, (l * 0.5) + 0.04);
    g.add(shopFront);
    // Dark wood frame around shop front
    const frameTop = new THREE.Mesh(new THREE.BoxGeometry(w * 0.65 + 0.2, 0.14, 0.1), darkWoodMat);
    frameTop.position.set(0, floor1H * 0.38 + (floor1H * 0.62 * 0.5) + 0.06, l * 0.5 + 0.05);
    g.add(frameTop);
    [-1, 1].forEach(sx => {
      const sideFrame = new THREE.Mesh(new THREE.BoxGeometry(0.14, floor1H * 0.62 + 0.14, 0.1), darkWoodMat);
      sideFrame.position.set(sx * (w * 0.65 * 0.5 + 0.08), floor1H * 0.38, l * 0.5 + 0.05);
      g.add(sideFrame);
    });

    // Red paper lanterns hanging in front of shop
    [-0.9, 0, 0.9].forEach(lx => {
      const lanternBody = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.26, 8),
        new THREE.MeshStandardMaterial({ color: 0xee2200, emissive: 0xff1100, emissiveIntensity: 1.6 }));
      lanternBody.position.set(lx, floor1H - 0.35, (l * 0.5) + 0.8);
      g.add(lanternBody);
      const lanternTop = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.11, 0.08, 8),
        new THREE.MeshStandardMaterial({ color: 0x222222 }));
      lanternTop.position.set(lx, floor1H - 0.35 + 0.17, (l * 0.5) + 0.8);
      g.add(lanternTop);
    });

    // 2nd floor body
    const floor2H = 2.2;
    const f2Walls = new THREE.Mesh(new THREE.BoxGeometry(w, floor2H, l), plasterMat);
    f2Walls.position.y = floor1H + 0.22 + floor2H * 0.5;
    f2Walls.castShadow = true;
    g.add(f2Walls);

    // 2nd floor corner posts
    [-1, 1].forEach(cx => [-1, 1].forEach(cz => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.18, floor2H + 0.1, 0.18), darkWoodMat);
      post.position.set(cx * w * 0.48, floor1H + 0.22 + floor2H * 0.5, cz * l * 0.48);
      g.add(post);
    }));

    // 2nd floor upper shoji windows
    [-0.5, 0.5].forEach(ox => {
      const shoji2 = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.2, 0.06), shojiMat);
      shoji2.position.set(ox, floor1H + 0.22 + 1.0, (l * 0.5) + 0.04);
      g.add(shoji2);
      // Horizontal bar
      const hbar = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.04, 0.08), darkWoodMat);
      hbar.position.set(ox, floor1H + 0.22 + 0.55, l * 0.5 + 0.05);
      g.add(hbar);
    });

    // Balcony railing on front of 2nd floor
    const balconyDeck = new THREE.Mesh(new THREE.BoxGeometry(w + 0.3, 0.12, 0.8), darkWoodMat);
    balconyDeck.position.set(0, floor1H + 0.22 + 0.06, (l * 0.5) + 0.4);
    g.add(balconyDeck);
    const balconyRail = new THREE.Mesh(new THREE.BoxGeometry(w + 0.3, 0.06, 0.06), redTrimMat);
    balconyRail.position.set(0, floor1H + 0.22 + 0.75, (l * 0.5) + 0.8);
    g.add(balconyRail);
    // Balcony balusters
    for (let bi = -2; bi <= 2; bi++) {
      const baluster = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.68, 0.06), darkWoodMat);
      baluster.position.set(bi * (w / 4.5), floor1H + 0.22 + 0.4, (l * 0.5) + 0.8);
      g.add(baluster);
    }

    // Sign board below 2nd floor windows
    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(w * 0.7, 0.42, 0.08), darkWoodMat);
    signBoard.position.set(0, floor1H + 0.22 + floor2H * 0.5 + 0.55, (l * 0.5) + 0.05);
    g.add(signBoard);

    // Roof with prominent overhanging eaves
    const roofTop = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, l) * 0.8, 1.8, 4), roofMat);
    roofTop.position.y = floor1H + 0.22 + floor2H + 0.85;
    roofTop.rotation.y = Math.PI / 4;
    roofTop.castShadow = true;
    g.add(roofTop);
    const eave = new THREE.Mesh(new THREE.BoxGeometry(w + 1.8, 0.14, l + 1.8), roofMat);
    eave.position.y = floor1H + 0.22 + floor2H + 0.05;
    g.add(eave);

    // Street lamp post on side
    const lampPost = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 3.2, 6), darkWoodMat);
    lampPost.position.set(w * 0.5 + 0.5, 1.6, (l * 0.5) + 0.6);
    g.add(lampPost);
    const lampHead = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.28),
      new THREE.MeshStandardMaterial({ color: 0xffee88, emissive: 0xffcc00, emissiveIntensity: 2.0 }));
    lampHead.position.set(w * 0.5 + 0.5, 3.35, (l * 0.5) + 0.6);
    g.add(lampHead);

    // Lights
    const shopLight = new THREE.PointLight(0xffbb44, 2.2, 10.0);
    shopLight.position.set(0, 1.0, l * 0.5 + 0.8);
    g.add(shopLight);
    const upperLight = new THREE.PointLight(0xffaa22, 1.4, 8.0);
    upperLight.position.set(0, floor1H + 0.22 + 1.0, 0);
    g.add(upperLight);

    return g;
  }

  /**
   * Builds a Type D house: Yatai market stall with open counter.
   * Features striped canopy awning, open display counter, warm interior.
   * Based on reference image 4.
   */
  private buildYataiStall(w: number, l: number): THREE.Group {
    const g = new THREE.Group();
    const darkWoodMat = new THREE.MeshStandardMaterial({ color: 0x3d2410, roughness: 0.78 });
    const lightWoodMat = new THREE.MeshStandardMaterial({ color: 0x8b5e2a, roughness: 0.65 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x282e34, roughness: 0.55 });
    const awningMat = new THREE.MeshStandardMaterial({ color: 0xe8d5a0, roughness: 0.7 }); // warm cream/tan
    const awningStripeMat = new THREE.MeshStandardMaterial({ color: 0xc8a055, roughness: 0.7 }); // golden stripe
    const interiorMat = new THREE.MeshStandardMaterial({ color: 0xffd080, emissive: 0xffaa00, emissiveIntensity: 1.5, roughness: 0.9 });

    // Wooden floor platform
    const floor = new THREE.Mesh(new THREE.BoxGeometry(w + 0.4, 0.2, l), darkWoodMat);
    floor.position.y = 0.4;
    g.add(floor);

    // Back wall
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(w, 2.4, 0.2), lightWoodMat);
    backWall.position.set(0, 1.6, -l * 0.5 + 0.1);
    g.add(backWall);

    // Side walls
    [-1, 1].forEach(sx => {
      const sideW = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.4, l), darkWoodMat);
      sideW.position.set(sx * w * 0.5, 1.6, 0);
      g.add(sideW);
    });

    // Counter display shelf
    const counter = new THREE.Mesh(new THREE.BoxGeometry(w - 0.2, 0.16, 0.8), darkWoodMat);
    counter.position.set(0, 1.1, l * 0.5 - 0.5);
    g.add(counter);
    // Counter front face
    const counterFront = new THREE.Mesh(new THREE.BoxGeometry(w - 0.2, 0.7, 0.12), darkWoodMat);
    counterFront.position.set(0, 0.75, l * 0.5 - 0.1);
    g.add(counterFront);

    // Food display items (small boxes as stand-ins for food)
    [-0.6, -0.2, 0.2, 0.6].forEach(fx => {
      const foodItem = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.22),
        new THREE.MeshStandardMaterial({ color: 0xc87830, roughness: 0.7 }));
      foodItem.position.set(fx, 1.2, l * 0.5 - 0.5);
      g.add(foodItem);
    });

    // Vertical support posts
    [-w * 0.45, w * 0.45].forEach(px => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 3.2, 6), darkWoodMat);
      post.position.set(px, 1.6, l * 0.5 - 0.1);
      g.add(post);
    });

    // Striped awning — alternating panels
    const awningW = w + 0.6;
    const awningStripeCount = 5;
    const stripeW = awningW / awningStripeCount;
    for (let si = 0; si < awningStripeCount; si++) {
      const mat = si % 2 === 0 ? awningMat : awningStripeMat;
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(stripeW - 0.01, 0.06, 1.1), mat);
      stripe.position.set(-awningW * 0.5 + stripeW * (si + 0.5), 2.82, l * 0.5 + 0.25);
      stripe.rotation.x = 0.18;
      g.add(stripe);
    }

    // Traditional tiled mini-roof above awning
    const miniRoof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, l) * 0.72, 1.4, 4), roofMat);
    miniRoof.position.y = 3.6;
    miniRoof.rotation.y = Math.PI / 4;
    miniRoof.castShadow = true;
    g.add(miniRoof);
    const miniEave = new THREE.Mesh(new THREE.BoxGeometry(w + 1.4, 0.1, l + 1.4), roofMat);
    miniEave.position.y = 3.0;
    g.add(miniEave);

    // Hanging price tag/menu sign
    const sign = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.06), lightWoodMat);
    sign.position.set(w * 0.3, 2.2, l * 0.5 + 0.05);
    g.add(sign);

    // Hanging lantern in stall
    const stallLantern = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.22, 8),
      new THREE.MeshStandardMaterial({ color: 0xffcc44, emissive: 0xffaa00, emissiveIntensity: 2.0 }));
    stallLantern.position.set(0, 2.2, -l * 0.18);
    g.add(stallLantern);

    // Interior glow panel (back wall)
    const intGlow = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.4, 1.6), interiorMat);
    intGlow.position.set(0, 1.7, -l * 0.5 + 0.25);
    g.add(intGlow);

    // Warm interior light
    const intLight = new THREE.PointLight(0xffcc66, 2.0, 9.0);
    intLight.position.set(0, 1.8, 0);
    g.add(intLight);

    return g;
  }

  /**
   * Places the 4 varieties of Japanese buildings in the playable village area.
   * Type A = Minka farmhouse, B = Tea house, C = Machiya shop, D = Yatai stall.
   */
  private createVillageHouses() {
    // [x, z, rotY, type, w, l]
    const houseConfigs: Array<{ x: number; z: number; rotY: number; type: 'A'|'B'|'C'|'D'; w: number; l: number }> = [
      // North-West bank — Minka farmhouse
      { x: -14.0, z: -15.0, rotY: 0.15,           type: 'A', w: 7.2, l: 5.8 },
      // North-East bank — 2-story Machiya shop
      { x: 13.0,  z: -16.0, rotY: -0.25,           type: 'C', w: 6.0, l: 5.0 },
      // South-West bank — Tea house
      { x: -15.0, z: 16.0,  rotY: Math.PI - 0.2,   type: 'B', w: 6.8, l: 5.5 },
      // South-East corner — Yatai market stall
      { x: 14.0,  z: 17.0,  rotY: Math.PI + 0.3,   type: 'D', w: 5.5, l: 4.0 },
    ];

    houseConfigs.forEach((h) => {
      let houseGroup: THREE.Group;
      switch (h.type) {
        case 'A': houseGroup = this.buildMinkaFarmhouse(h.w, h.l); break;
        case 'B': houseGroup = this.buildTeaHouse(h.w, h.l); break;
        case 'C': houseGroup = this.buildMachiyaShop(h.w, h.l); break;
        case 'D': default: houseGroup = this.buildYataiStall(h.w, h.l); break;
      }
      houseGroup.position.set(h.x, 1.8, h.z);
      houseGroup.rotation.y = h.rotY;

      // Add Collider
      this.colliders.push({
        minX: h.x - h.w * 0.6,
        maxX: h.x + h.w * 0.6,
        minZ: h.z - h.l * 0.6,
        maxZ: h.z + h.l * 0.6,
        height: 6,
      });

      this.scene.add(houseGroup);
    });
  }

  /**
   * Distant Village Farmhouses, Mountain Shrines, and Countryside Scenery
   * Transforms the isolated stage into an authentic sprawling Japanese mountain village
   */
  private createDistantVillage() {
    // Cycle through the 4 building types for visual variety in the distant village
    const distantHouseConfigs: Array<{ x: number; z: number; rotY: number; type: 'A'|'B'|'C'|'D'; w: number; l: number }> = [
      // North-East Valley
      { x: 38,  z: -38, rotY: 0.3,  type: 'A', w: 7.0, l: 5.4 },
      { x: 55,  z: -46, rotY: -0.2, type: 'C', w: 5.8, l: 4.8 },
      { x: 74,  z: -36, rotY: 0.5,  type: 'B', w: 6.2, l: 5.0 },
      { x: 48,  z: -68, rotY: 0.1,  type: 'A', w: 8.0, l: 6.0 },
      { x: 82,  z: -62, rotY: -0.4, type: 'D', w: 5.0, l: 3.8 },
      { x: 25,  z: -58, rotY: 0.25, type: 'B', w: 6.5, l: 5.2 },

      // North-West Valley
      { x: -38, z: -42, rotY: -0.3, type: 'C', w: 5.6, l: 4.6 },
      { x: -58, z: -36, rotY: 0.2,  type: 'A', w: 7.8, l: 5.8 },
      { x: -75, z: -52, rotY: -0.5, type: 'B', w: 6.8, l: 5.4 },
      { x: -44, z: -66, rotY: 0.4,  type: 'D', w: 5.2, l: 3.8 },
      { x: -85, z: -70, rotY: -0.1, type: 'A', w: 7.5, l: 5.6 },

      // South-East Valley
      { x: 42,  z: 42,  rotY: -0.2, type: 'B', w: 7.2, l: 5.6 },
      { x: 65,  z: 52,  rotY: 0.35, type: 'C', w: 5.4, l: 4.6 },
      { x: 86,  z: 40,  rotY: -0.4, type: 'A', w: 6.5, l: 5.0 },
      { x: 52,  z: 75,  rotY: 0.15, type: 'D', w: 5.0, l: 3.8 },

      // South-West Valley
      { x: -45, z: 48,  rotY: 0.4,  type: 'A', w: 7.2, l: 5.6 },
      { x: -68, z: 44,  rotY: -0.3, type: 'B', w: 6.8, l: 5.4 },
      { x: -58, z: 72,  rotY: 0.2,  type: 'C', w: 5.5, l: 4.5 },
    ];

    distantHouseConfigs.forEach((h) => {
      let houseGroup: THREE.Group;
      switch (h.type) {
        case 'A': houseGroup = this.buildMinkaFarmhouse(h.w, h.l); break;
        case 'B': houseGroup = this.buildTeaHouse(h.w, h.l); break;
        case 'C': houseGroup = this.buildMachiyaShop(h.w, h.l); break;
        case 'D': default: houseGroup = this.buildYataiStall(h.w, h.l); break;
      }
      houseGroup.position.set(h.x, 1.8, h.z);
      houseGroup.rotation.y = h.rotY;
      this.scene.add(houseGroup);
    });

    // ── 2. Distant Wooden Arch Bridge crossing the river in the East ────────
    const distantBridge = new THREE.Group();
    distantBridge.position.set(88, 1.8, 0);
    const dBridgePlankMat = new THREE.MeshStandardMaterial({ color: 0x4a3222, roughness: 0.7 });
    const dBridgeRailMat = new THREE.MeshStandardMaterial({ color: 0x992218, roughness: 0.5 });

    const dArchDeck = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.35, 16.5), dBridgePlankMat);
    dArchDeck.position.y = 0.5;
    distantBridge.add(dArchDeck);

    [-1.7, 1.7].forEach((rx) => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.7, 16.5), dBridgeRailMat);
      rail.position.set(rx, 0.95, 0);
      distantBridge.add(rail);
    });
    this.scene.add(distantBridge);

    // ── 3. Distant Hillside Torii Gate on North Valley trail ─────────────────
    const distantTorii = new THREE.Group();
    distantTorii.position.set(45, 1.8, -82);
    const dToriiMat = new THREE.MeshStandardMaterial({ color: 0xa82218, roughness: 0.5 });
    [-1.8, 1.8].forEach((tx) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 4.2, 6), dToriiMat);
      post.position.set(tx, 2.1, 0);
      distantTorii.add(post);
    });
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.35, 0.4), dToriiMat);
    lintel.position.set(0, 4.1, 0);
    distantTorii.add(lintel);
    this.scene.add(distantTorii);
  }

  /**
   * Japanese Black Pine Trees & Bamboo framing the village banks
   */
  private createPineTreesAndFoliage() {
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x382618, roughness: 0.85 });
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x0f2415, roughness: 0.8 });

    const treeLocs = [
      { x: -24, z: -12, scale: 1.1 },
      { x: -6, z: -20, scale: 0.9 },
      { x: 7, z: -21, scale: 0.95 },
      { x: 25, z: -10, scale: 1.15 },
      { x: -24, z: 12, scale: 1.05 },
      { x: -7, z: 22, scale: 0.9 },
      { x: 8, z: 21, scale: 1.0 },
      { x: 26, z: 14, scale: 1.2 },
    ];

    treeLocs.forEach((t) => {
      const tree = new THREE.Group();
      tree.position.set(t.x, 1.8, t.z);
      tree.scale.set(t.scale, t.scale, t.scale);

      // Crooked, stylized Bonsai pine trunk
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.45, 3.8, 7), trunkMat);
      trunk.position.y = 1.9;
      trunk.rotation.z = (Math.random() - 0.5) * 0.15;
      trunk.castShadow = true;
      tree.add(trunk);

      // Tiered Cloud Foliage (Niwaki style)
      [-0.4, 0.5, 1.3].forEach((yTier, idx) => {
        const radius = 2.0 - idx * 0.45;
        const puff = new THREE.Mesh(new THREE.ConeGeometry(radius, 1.2, 7), foliageMat);
        puff.position.set((Math.random() - 0.5) * 0.4, 3.2 + yTier * 1.1, (Math.random() - 0.5) * 0.4);
        puff.castShadow = true;
        tree.add(puff);
      });

      this.scene.add(tree);
    });
  }

  /**
   * Builds an authentic, lush Japanese Sakura (Cherry Blossom) Tree
   * Modeled directly after the reference photo:
   * - Natural organic flared root base and gnarled weathered trunk
   * - 5 spreading curved boughs subdividing into upper canopy branches
   * - Voluminous multi-layered blossom clouds in 4 pastel pink tones
   * - Weeping/drooping blossom sprigs along the lower fringe
   * - Feathery double-sided blossom petal texture cards
   * - Fallen petal carpet on the grass below
   */
  private createRealisticSakuraTree(scale: number): THREE.Group {
    const tree = new THREE.Group();
    tree.scale.set(scale, scale, scale);

    // ── 1. Materials ──────────────────────────────────────────────────────────
    const barkMat = new THREE.MeshStandardMaterial({
      color: 0x332015,
      roughness: 0.88,
      metalness: 0.08,
    });

    // 4 layered blossom materials reflecting the natural depth in the reference photo:
    const blossomMatDeep = new THREE.MeshStandardMaterial({
      color: 0xdb5887, // deeper blush pink for lower/inner shadowed clusters
      roughness: 0.8,
      emissive: 0x4a1226,
      emissiveIntensity: 0.35,
    });
    const blossomMatMid = new THREE.MeshStandardMaterial({
      color: 0xf48fb1, // classic vibrant cherry blossom pink
      roughness: 0.75,
      emissive: 0x5a1834,
      emissiveIntensity: 0.35,
    });
    const blossomMatLight = new THREE.MeshStandardMaterial({
      color: 0xf8bbd0, // soft delicate pastel pink for mid-upper canopy
      roughness: 0.7,
      emissive: 0x6e2544,
      emissiveIntensity: 0.3,
    });
    const blossomMatCrest = new THREE.MeshStandardMaterial({
      color: 0xffeef4, // sunlit white-pink blossom highlights for crown crest
      roughness: 0.65,
      emissive: 0x5c203b,
      emissiveIntensity: 0.25,
    });
    const blossomMats = [blossomMatDeep, blossomMatMid, blossomMatLight, blossomMatCrest];

    const petalMat = new THREE.MeshBasicMaterial({
      color: 0xffbccc,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95,
    });

    // ── 2. Trunk & Root Flare ────────────────────────────────────────────────
    // Root flare at base
    const rootBase = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.60, 0.7, 8), barkMat);
    rootBase.position.y = 0.35;
    rootBase.castShadow = true;
    rootBase.receiveShadow = true;
    tree.add(rootBase);

    // Buttress root spurs spreading into ground
    [0.0, 1.3, 2.5, 3.8, 5.0].forEach((rAngle) => {
      const rootSpur = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.85, 5), barkMat);
      rootSpur.rotation.z = Math.PI * 0.38;
      rootSpur.rotation.y = rAngle;
      rootSpur.position.set(Math.cos(rAngle) * 0.42, 0.2, Math.sin(rAngle) * 0.42);
      rootSpur.castShadow = true;
      tree.add(rootSpur);
    });

    // Lower main trunk with subtle organic lean
    const lowerTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 1.4, 8), barkMat);
    lowerTrunk.position.y = 1.3;
    lowerTrunk.rotation.z = 0.05;
    lowerTrunk.castShadow = true;
    tree.add(lowerTrunk);

    // Upper trunk knot before fork
    const trunkFork = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.32, 0.8, 8), barkMat);
    trunkFork.position.y = 2.1;
    trunkFork.rotation.x = -0.04;
    trunkFork.castShadow = true;
    tree.add(trunkFork);

    // ── 3. Spreading Boughs & Sub-Branches ───────────────────────────────────
    // 5 primary boughs spreading in 5 directions forming an umbrella armature
    const boughConfigs = [
      { angleY: 0.20, tilt: 0.42, len1: 1.5, len2: 1.3 },
      { angleY: 1.45, tilt: 0.48, len1: 1.6, len2: 1.4 },
      { angleY: 2.70, tilt: 0.44, len1: 1.5, len2: 1.3 },
      { angleY: 3.95, tilt: 0.50, len1: 1.6, len2: 1.5 },
      { angleY: 5.20, tilt: 0.40, len1: 1.4, len2: 1.2 },
    ];

    boughConfigs.forEach((cfg) => {
      const bGroup = new THREE.Group();
      bGroup.position.set(0, 2.3, 0);
      bGroup.rotation.y = cfg.angleY;

      // Segment 1 (spreading outward from fork)
      const seg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, cfg.len1, 6), barkMat);
      seg1.position.set(0, cfg.len1 * 0.45 * Math.cos(cfg.tilt), cfg.len1 * 0.45 * Math.sin(cfg.tilt));
      seg1.rotation.x = cfg.tilt;
      seg1.castShadow = true;
      bGroup.add(seg1);

      // Segment 2 (curving upwards into canopy)
      const seg1End = new THREE.Vector3(0, cfg.len1 * Math.cos(cfg.tilt), cfg.len1 * Math.sin(cfg.tilt));
      const seg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, cfg.len2, 5), barkMat);
      const tilt2 = cfg.tilt * 0.65;
      seg2.position.set(
        0,
        seg1End.y + (cfg.len2 * 0.48) * Math.cos(tilt2),
        seg1End.z + (cfg.len2 * 0.48) * Math.sin(tilt2)
      );
      seg2.rotation.x = tilt2;
      seg2.castShadow = true;
      bGroup.add(seg2);

      // Finer branch twig extending horizontally
      const twig = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.07, 1.1, 4), barkMat);
      twig.position.set(
        0.25,
        seg1End.y + cfg.len2 * 0.8,
        seg1End.z + cfg.len2 * 0.6
      );
      twig.rotation.z = Math.PI * 0.35;
      twig.rotation.x = 0.2;
      bGroup.add(twig);

      tree.add(bGroup);
    });

    // ── 4. Dense Voluminous Blossom Clouds (Crown Dome) ───────────────────────
    const puffGeoLarge = new THREE.IcosahedronGeometry(1.25, 1);
    const puffGeoMed = new THREE.IcosahedronGeometry(0.95, 1);
    const puffGeoSmall = new THREE.IcosahedronGeometry(0.68, 1);
    const puffGeoDroop = new THREE.IcosahedronGeometry(0.42, 1);

    // Core canopy dome clusters (Y: 3.2 to 5.6, Radius: 0.8 to 3.8m)
    const clusterPositions: { x: number; y: number; z: number; r: number; matIdx: number }[] = [
      // Central dome crest
      { x: 0, y: 5.5, z: 0, r: 1.35, matIdx: 3 },
      { x: 0.6, y: 5.2, z: 0.5, r: 1.2, matIdx: 3 },
      { x: -0.7, y: 5.1, z: -0.4, r: 1.25, matIdx: 2 },
      { x: 0.3, y: 5.3, z: -0.7, r: 1.15, matIdx: 3 },
      { x: -0.5, y: 5.2, z: 0.6, r: 1.2, matIdx: 2 },

      // Upper mid layer (Y: 4.4 - 4.9, Radius: 1.6 - 2.5m)
      { x: 1.8, y: 4.6, z: 0.4, r: 1.2, matIdx: 2 },
      { x: -1.7, y: 4.7, z: -0.5, r: 1.25, matIdx: 2 },
      { x: 0.5, y: 4.8, z: 1.9, r: 1.15, matIdx: 2 },
      { x: -0.6, y: 4.6, z: -1.8, r: 1.2, matIdx: 2 },
      { x: 1.4, y: 4.7, z: 1.4, r: 1.1, matIdx: 2 },
      { x: -1.3, y: 4.8, z: 1.3, r: 1.15, matIdx: 2 },
      { x: 1.5, y: 4.5, z: -1.3, r: 1.1, matIdx: 1 },
      { x: -1.4, y: 4.6, z: -1.4, r: 1.2, matIdx: 1 },

      // Middle spreading layer (Y: 3.8 - 4.4, Radius: 2.3 - 3.4m)
      { x: 2.6, y: 4.1, z: 0.8, r: 1.05, matIdx: 1 },
      { x: -2.7, y: 4.0, z: -0.7, r: 1.1, matIdx: 1 },
      { x: 0.7, y: 4.2, z: 2.7, r: 1.0, matIdx: 1 },
      { x: -0.8, y: 3.9, z: -2.6, r: 1.05, matIdx: 1 },
      { x: 2.1, y: 4.0, z: 2.0, r: 0.95, matIdx: 1 },
      { x: -2.2, y: 4.1, z: 1.9, r: 1.0, matIdx: 1 },
      { x: 2.0, y: 3.8, z: -2.1, r: 0.95, matIdx: 0 },
      { x: -2.1, y: 3.9, z: -2.0, r: 1.0, matIdx: 0 },
      { x: 3.0, y: 3.7, z: -0.3, r: 0.9, matIdx: 1 },
      { x: -3.1, y: 3.6, z: 0.4, r: 0.95, matIdx: 1 },

      // Lower canopy skirt (Y: 3.2 - 3.7, Radius: 2.8 - 3.9m)
      { x: 2.8, y: 3.4, z: 1.5, r: 0.85, matIdx: 0 },
      { x: -2.9, y: 3.3, z: 1.4, r: 0.85, matIdx: 0 },
      { x: 1.6, y: 3.5, z: 2.9, r: 0.8, matIdx: 1 },
      { x: -1.5, y: 3.4, z: -2.8, r: 0.85, matIdx: 0 },
      { x: 2.7, y: 3.3, z: -1.6, r: 0.8, matIdx: 0 },
      { x: -2.8, y: 3.4, z: -1.5, r: 0.85, matIdx: 0 },
      { x: 0.0, y: 3.5, z: 3.2, r: 0.8, matIdx: 1 },
      { x: 0.0, y: 3.4, z: -3.1, r: 0.85, matIdx: 0 },
      { x: 3.3, y: 3.3, z: 0.2, r: 0.8, matIdx: 1 },
      { x: -3.4, y: 3.2, z: -0.1, r: 0.85, matIdx: 0 },
    ];

    clusterPositions.forEach((cp) => {
      const puffMesh = new THREE.Mesh(
        cp.r > 1.15 ? puffGeoLarge : cp.r > 0.88 ? puffGeoMed : puffGeoSmall,
        blossomMats[cp.matIdx]
      );
      puffMesh.position.set(cp.x, cp.y, cp.z);
      const s = cp.r / (cp.r > 1.15 ? 1.25 : cp.r > 0.88 ? 0.95 : 0.68);
      puffMesh.scale.set(
        s * (0.95 + Math.random() * 0.1),
        s * (0.85 + Math.random() * 0.15),
        s * (0.95 + Math.random() * 0.1)
      );
      puffMesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      puffMesh.castShadow = true;
      puffMesh.receiveShadow = true;
      tree.add(puffMesh);
    });

    // ── 5. Weeping / Drooping Blossom Sprigs (Reference Photo signature) ─────
    const droopPositions = [
      { x: 3.2, y: 2.7, z: 1.1 },
      { x: -3.3, y: 2.6, z: 0.9 },
      { x: 1.4, y: 2.8, z: 3.1 },
      { x: -1.3, y: 2.7, z: -3.0 },
      { x: 2.9, y: 2.6, z: -1.5 },
      { x: -3.0, y: 2.8, z: -1.4 },
      { x: 2.2, y: 2.7, z: 2.6 },
      { x: -2.3, y: 2.8, z: 2.4 },
      { x: 3.5, y: 2.8, z: -0.4 },
      { x: -3.6, y: 2.7, z: 0.2 },
      { x: 0.4, y: 2.6, z: 3.3 },
      { x: -0.3, y: 2.7, z: -3.2 },
    ];

    droopPositions.forEach((dp, idx) => {
      const droop = new THREE.Mesh(puffGeoDroop, blossomMats[idx % 2]);
      droop.position.set(dp.x, dp.y, dp.z);
      droop.scale.set(0.9, 1.4, 0.9); // Elongated downward teardrop
      tree.add(droop);
    });

    // ── 6. Feathery Blossom Petal Texture Quads ───────────────────────────────
    const petalGeo = new THREE.PlaneGeometry(0.24, 0.16);
    for (let p = 0; p < 120; p++) {
      const petal = new THREE.Mesh(petalGeo, petalMat);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.55;
      const rad = 2.4 + Math.random() * 1.5;
      petal.position.set(
        rad * Math.sin(phi) * Math.cos(theta),
        3.5 + Math.cos(phi) * 2.2,
        rad * Math.sin(phi) * Math.sin(theta)
      );
      petal.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      );
      tree.add(petal);
    }

    // ── 7. Fallen Blossom Petals Carpet on the Ground ─────────────────────────
    for (let fp = 0; fp < 35; fp++) {
      const fallen = new THREE.Mesh(petalGeo, petalMat);
      const angle = Math.random() * Math.PI * 2;
      const dist = 0.8 + Math.random() * 3.2;
      fallen.position.set(Math.cos(angle) * dist, 0.02, Math.sin(angle) * dist);
      fallen.rotation.x = -Math.PI / 2;
      fallen.rotation.z = Math.random() * Math.PI * 2;
      tree.add(fallen);
    }

    return tree;
  }

  /**
   * Scattered Sakura (Cherry Blossom) Trees & Bamboo Stalks framing the village
   */
  private createSakuraAndBamboo() {
    const sakuraPositions = [
      { x: 13.0, z: -3.0, scale: 1.15 }, // Flanking pagoda approach
      { x: 14.0, z: 12.0, scale: 1.0 },  // South riverbank near village houses
      { x: -9.0, z: -14.0, scale: 1.1 }, // Near entrance approach path
    ];

    sakuraPositions.forEach((loc) => {
      const sakuraTree = this.createRealisticSakuraTree(loc.scale);
      sakuraTree.position.set(loc.x, 1.8, loc.z);
      this.scene.add(sakuraTree);
    });

    // ── Bamboo clusters (unchanged) ──────────────────────────────────────────
    const bambooStalkMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.5 });
    const bambooLeafMat = new THREE.MeshStandardMaterial({ color: 0x4caf50, roughness: 0.6 });

    const bambooClusters = [
      { x: 25.0, z: -18.0 },
      { x: -22.0, z: 8.0 },
    ];

    bambooClusters.forEach((cluster) => {
      const bGroup = new THREE.Group();
      bGroup.position.set(cluster.x, 1.8, cluster.z);

      for (let b = 0; b < 7; b++) {
        const offX = (Math.random() - 0.5) * 2.2;
        const offZ = (Math.random() - 0.5) * 2.2;
        const height = 4.5 + Math.random() * 1.5;

        const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, height, 6), bambooStalkMat);
        stalk.position.set(offX, height * 0.5, offZ);
        stalk.castShadow = true;
        bGroup.add(stalk);

        const leafCrown = new THREE.Mesh(new THREE.ConeGeometry(0.8, 1.4, 5), bambooLeafMat);
        leafCrown.position.set(offX, height + 0.4, offZ);
        bGroup.add(leafCrown);
      }

      this.scene.add(bGroup);
    });
  }

  /**
   * Traditional Weathered Vermilion Torii Gate along the bridge approach avenue
   */
  private createVillageEntranceToriiGate() {
    const toriiGroup = new THREE.Group();
    toriiGroup.position.set(0, 1.8, -12.0);

    const vermilionMat = new THREE.MeshStandardMaterial({
      color: 0xaa221b,
      roughness: 0.55,
      flatShading: true,
    });
    const blackCapMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.7,
      flatShading: true,
    });
    const stoneBaseMat = new THREE.MeshStandardMaterial({
      color: 0x272c33,
      roughness: 0.8,
    });

    // 1. Two Main Cylindrical Upright Columns (Hashira)
    [-2.2, 2.2].forEach((px, idx) => {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 4.4, 8), vermilionMat);
      col.position.set(px, 2.2, 0);
      col.rotation.z = (idx === 0 ? 1 : -1) * 0.025; // Subtle inward incline
      col.castShadow = true;
      toriiGroup.add(col);

      // Stone pedestal base (Kamebara)
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.42, 0.35, 8), stoneBaseMat);
      base.position.set(px, 0.17, 0);
      toriiGroup.add(base);
    });

    // 2. Upper Lintel (Kasagi) with curved roof edge
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.36, 0.46), vermilionMat);
    lintel.position.set(0, 4.35, 0);
    toriiGroup.add(lintel);

    const blackCap = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.12, 0.52), blackCapMat);
    blackCap.position.set(0, 4.54, 0);
    toriiGroup.add(blackCap);

    // 3. Lower Horizontal Tie-Beam (Nuki)
    const nuki = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.22, 0.28), vermilionMat);
    nuki.position.set(0, 3.55, 0);
    toriiGroup.add(nuki);

    // 4. Central Gakuzuka Strut
    const gaku = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.6, 0.2), vermilionMat);
    gaku.position.set(0, 3.95, 0);
    toriiGroup.add(gaku);

    // 5. Two hanging paper lanterns with warm illumination
    [-1.2, 1.2].forEach((lx) => {
      const lanternMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.18, 0.38, 8),
        new THREE.MeshStandardMaterial({
          color: 0x991b1b,
          emissive: 0xff6600,
          emissiveIntensity: 1.6,
        })
      );
      lanternMesh.position.set(lx, 3.15, 0);
      toriiGroup.add(lanternMesh);

      const lanternLight = new THREE.PointLight(0xff7700, 1.0, 4.5);
      lanternLight.position.set(lx, 3.15, 0);
      toriiGroup.add(lanternLight);
    });

    this.scene.add(toriiGroup);
  }

  /**
   * Traditional Stone Lanterns (Tōrō - 灯籠) with glowing embers
   */
  private createStoneLanterns() {
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x3a424d, roughness: 0.75 });
    const fireMat = new THREE.MeshBasicMaterial({ color: 0xffaa33 });

    const toroLocs = [
      { x: -2.8, z: -8.2 },
      { x: 2.8, z: -8.2 },
      { x: -2.8, z: 8.2 },
      { x: 2.8, z: 8.2 },
      { x: -6.0, z: -13.0 },
      { x: 6.0, z: -13.0 },
      { x: -6.0, z: 13.0 },
      { x: 6.0, z: 13.0 },
      { x: 14.0, z: 2.0 },
    ];

    toroLocs.forEach((loc) => {
      const group = new THREE.Group();
      group.position.set(loc.x, 1.8, loc.z);

      // Base & Pillar
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.32, 0.25, 6), stoneMat);
      base.position.y = 0.12;
      group.add(base);

      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.7, 6), stoneMat);
      pillar.position.y = 0.55;
      group.add(pillar);

      // Firebox (Hibukuro)
      const firebox = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.32, 0.38), stoneMat);
      firebox.position.y = 1.05;
      group.add(firebox);

      // Glowing Fire Chamber
      const fire = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), fireMat);
      fire.position.y = 1.05;
      group.add(fire);

      // Umbrella Roof (Kasa)
      const kasa = new THREE.Mesh(new THREE.ConeGeometry(0.48, 0.28, 6), stoneMat);
      kasa.position.y = 1.32;
      group.add(kasa);

      // Warm Amber Point Light
      const light = new THREE.PointLight(0xff9911, 1.1, 6.0);
      light.position.y = 1.05;
      group.add(light);

      this.scene.add(group);
    });
  }

  /**
   * Hanging Chōchin Paper Lanterns strung along bridge railings and eaves
   */
  private createHangingLanterns() {
    const redLanternMat = new THREE.MeshStandardMaterial({
      color: 0x991b1b,
      emissive: 0xff6600,
      emissiveIntensity: 1.8,
      roughness: 0.4,
    });
    const capMat = new THREE.MeshStandardMaterial({ color: 0x1f1915, roughness: 0.8 });

    // Lanterns strung along bridge posts
    const bridgeLanternLocs = [
      { x: -2.3, y: 2.5, z: -4.5 },
      { x: 2.3, y: 2.5, z: -4.5 },
      { x: -2.3, y: 2.85, z: 0.0 },
      { x: 2.3, y: 2.85, z: 0.0 },
      { x: -2.3, y: 2.5, z: 4.5 },
      { x: 2.3, y: 2.5, z: 4.5 },
    ];

    bridgeLanternLocs.forEach((loc) => {
      const group = new THREE.Group();
      group.position.set(loc.x, loc.y, loc.z);

      const cord = new THREE.Mesh(
        new THREE.CylinderGeometry(0.01, 0.01, 0.25, 4),
        new THREE.MeshBasicMaterial({ color: 0x111111 })
      );
      cord.position.y = 0.12;
      group.add(cord);

      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.42, 8), redLanternMat);
      group.add(body);

      const topCap = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.04, 8), capMat);
      topCap.position.y = 0.22;
      const btmCap = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.04, 8), capMat);
      btmCap.position.y = -0.22;
      group.add(topCap, btmCap);

      const pLight = new THREE.PointLight(0xff7700, 1.2, 5.5);
      group.add(pLight);

      this.hangingLanterns.push({ mesh: body, light: pLight });
      this.scene.add(group);
    });
  }

  /**
   * Ambient floating lanterns gently bobbing on the river at all times
   * (Scene dressing distinct from the 100-lantern registration release effect)
   */
  private createAmbientFloatingRiverLanterns() {
    const floatMat = new THREE.MeshStandardMaterial({
      color: 0xffe082,
      emissive: 0xff7043,
      emissiveIntensity: 2.2,
      roughness: 0.35,
    });
    const woodRimMat = new THREE.MeshStandardMaterial({ color: 0x2b1c14, roughness: 0.8 });

    const floatLocs = [
      { x: -8.0, z: -2.5, scale: 0.8 },
      { x: -5.0, z: 2.0, scale: 0.9 },
      { x: -1.5, z: -3.5, scale: 0.75 },
      { x: 3.5, z: 1.8, scale: 0.85 },
      { x: 7.0, z: -1.5, scale: 0.9 },
      { x: 12.0, z: 2.8, scale: 0.8 },
      { x: -16.0, z: 1.0, scale: 0.85 },
      { x: 18.0, z: -2.0, scale: 0.95 },
    ];

    floatLocs.forEach((loc, idx) => {
      const group = new THREE.Group();
      group.position.set(loc.x, 0.42, loc.z);
      group.scale.set(loc.scale, loc.scale, loc.scale);

      // Square floating wooden raft base
      const raft = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.04, 0.44), woodRimMat);
      group.add(raft);

      // Glowing paper lantern box
      const paper = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.34, 0.36), floatMat);
      paper.position.y = 0.18;
      group.add(paper);

      // Small warm point light
      const light = new THREE.PointLight(0xff6d00, 0.8, 3.5);
      light.position.y = 0.2;
      group.add(light);

      this.ambientRiverLanterns.push({
        group,
        baseY: 0.42,
        phase: idx * 1.1,
        speed: 1.4 + (idx % 3) * 0.3,
      });

      this.scene.add(group);
    });
  }

  /**
   * Station Departure Gate (allows returning to Fujimi Mountain Station)
   */
  private createStationDepartureGate() {
    const gateGroup = new THREE.Group();
    gateGroup.position.set(
      LOGIC_LAMPS_CONFIG.stationGatePosition.x,
      LOGIC_LAMPS_CONFIG.stationGatePosition.y,
      LOGIC_LAMPS_CONFIG.stationGatePosition.z
    );

    const vermilionMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.5 });
    const blackMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.8 });

    // Torii Gate Archway
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

    // Hanging Wooden Sign
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 160;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 512, 160);
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 6;
    ctx.strokeRect(6, 6, 500, 148);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px "Hiragino Sans", "Meiryo", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('◄ 富士見高原駅行', 256, 65);
    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 23px sans-serif';
    ctx.fillText('To Train Station (Board Trains)', 256, 115);

    const signTex = new THREE.CanvasTexture(canvas);
    const signGeo = new THREE.BoxGeometry(2.2, 0.7, 0.08);
    const signMat = new THREE.MeshBasicMaterial({ map: signTex });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, 2.7, 0);
    gateGroup.add(sign);

    // Portal ground rune & light
    const runeGeo = new THREE.RingGeometry(0.8, 1.6, 24);
    const runeMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
    });
    const rune = new THREE.Mesh(runeGeo, runeMat);
    rune.rotation.x = -Math.PI / 2;
    rune.position.y = 0.03;
    gateGroup.add(rune);

    const portalLight = new THREE.PointLight(0x10b981, 1.8, 6.0);
    portalLight.position.set(0, 1.8, 0);
    gateGroup.add(portalLight);

    this.scene.add(gateGroup);
  }

  /**
   * Fires the continuous 100+ lantern release effect
   */
  public triggerLanternRelease() {
    this.lanternField.activate();
  }

  /**
   * Ground height calculation for player physics
   */
  public getGroundHeight(x: number, z: number): number {
    // 1. On Bridge (X within deck width: -2.3 to +2.3, Z: -7.5 to 7.5)
    if (x >= -2.3 && x <= 2.3 && z >= -7.8 && z <= 7.8) {
      const t = z / 7.8;
      // Arched deck height formula: peaks at y = 2.25m over center of river
      return 1.8 + (1.0 - t * t) * 0.45;
    }

    // 2. North Village Ground (z <= -7.0)
    if (z <= -7.0) {
      return 1.8;
    }

    // 3. South Village Ground (z >= 7.0)
    if (z >= 7.0) {
      return 1.8;
    }

    // 4. In River Channel: blocked by colliders, but default to safe level
    return 1.8;
  }

  /**
   * Village Boundaries Check
   */
  public isWithinBounds(x: number, z: number): boolean {
    // Outer village perimeter
    if (
      x < LOGIC_LAMPS_CONFIG.bounds.minX ||
      x > LOGIC_LAMPS_CONFIG.bounds.maxX ||
      z < LOGIC_LAMPS_CONFIG.bounds.minZ ||
      z > LOGIC_LAMPS_CONFIG.bounds.maxZ
    ) {
      return false;
    }

    // River channel is impassable EXCEPT via bridge (x: -2.3 to 2.3)
    if (z > -7.2 && z < 7.2) {
      if (x < -2.3 || x > 2.3) {
        return false;
      }
    }

    // Custom object colliders (houses, pagoda, etc.)
    for (const c of this.colliders) {
      if (x >= c.minX && x <= c.maxX && z >= c.minZ && z <= c.maxZ) {
        return false;
      }
    }

    return true;
  }

  /**
   * Per-frame animation loop (checkpoint rotation, floating lanterns, 100+ lantern field)
   */
  public update(delta: number) {
    const time = performance.now() * 0.001;

    // 1. Update Checkpoint
    if (this.checkpoint) {
      this.checkpoint.update(delta);
    }

    // 2. Update 100+ Lantern Release Field
    if (this.lanternField) {
      this.lanternField.update(delta);
    }

    // 3. Bob ambient floating lanterns on river surface
    this.ambientRiverLanterns.forEach((lantern) => {
      lantern.group.position.y = lantern.baseY + Math.sin(time * lantern.speed + lantern.phase) * 0.035;
      lantern.group.rotation.y += delta * 0.15;
      lantern.group.rotation.z = Math.sin(time * 1.2 + lantern.phase) * 0.04;
    });

    // 4. Subtle river water surface shimmer
    if (this.waterMesh) {
      this.waterMesh.position.y = 0.38 + Math.sin(time * 1.4) * 0.012;
    }
  }
}
