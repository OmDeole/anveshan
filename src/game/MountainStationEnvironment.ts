import * as THREE from 'three';
import { TrainData, TrainId } from '../types';

export const STATION_TRAINS: TrainData[] = [
  {
    id: 'om',
    nameJapanese: 'オム',
    destinationEnglish: "To The Killer's Trail",
    destinationJapanese: '殺人鬼の足跡行',
    colorHex: '#e11d48',
    position: { x: -13.5, y: 0.9, z: 20.0 },
    doorPosition: { x: -11.0, y: 0.85, z: 17.5 },
  },
  {
    id: 'arya',
    nameJapanese: 'アーリア',
    destinationEnglish: 'To Promptify',
    destinationJapanese: 'プロンプティファイ行',
    colorHex: '#a855f7',
    position: { x: 0.0, y: 0.9, z: 20.0 },
    doorPosition: { x: 2.5, y: 0.85, z: 17.5 },
  },
  {
    id: 'sandip',
    nameJapanese: 'サンディープ',
    destinationEnglish: 'To Logic Lamps',
    destinationJapanese: '論理灯行',
    colorHex: '#10b981',
    position: { x: 13.5, y: 0.9, z: 20.0 },
    doorPosition: { x: 11.0, y: 0.85, z: 17.5 },
  },
];

export class MountainStationEnvironment {
  public scene: THREE.Scene;
  public colliders: { minX: number; maxX: number; minZ: number; maxZ: number; height: number }[] = [];
  private lanternLights: THREE.PointLight[] = [];
  private crossingLight1?: THREE.PointLight;
  private crossingLight2?: THREE.PointLight;
  private petalParticles!: THREE.Points;
  private petalPositions!: Float32Array;
  private trainDoorMarkers: { group: THREE.Group; light: THREE.PointLight; id: TrainId }[] = [];

  // Reusable shared materials to keep draw calls low & prevent lag
  private sharedStoneMat!: THREE.MeshStandardMaterial;
  private sharedWoodMat!: THREE.MeshStandardMaterial;
  private sharedVermilionMat!: THREE.MeshStandardMaterial;
  private sharedBarkMat!: THREE.MeshStandardMaterial;
  private sharedBlossomMats: THREE.MeshStandardMaterial[] = [];
  private sharedPineMat!: THREE.MeshStandardMaterial;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.initSharedMaterials();
    this.setupLighting();
    this.createSkyAndBackdrop();
    this.createMountFuji();
    this.createMountainTerrainAndTrail();
    this.createTrainStationPlatform();
    this.createTracksAndRailwayInfrastructure();
    this.createTheThreeTrains();
    this.createSakuraAndPineFlora();
    this.createAtmosphericPetals();
  }

  // --- 1. SHARED MATERIALS (Ultra performant, 0 lag) ---
  private initSharedMaterials() {
    this.sharedStoneMat = new THREE.MeshStandardMaterial({
      color: 0x78869b, // Warm Japanese slate stone matching temple terrace
      roughness: 0.8,
      flatShading: true,
    });

    this.sharedWoodMat = new THREE.MeshStandardMaterial({
      color: 0x3d281d, // Dark weathered cedar wood
      roughness: 0.8,
      flatShading: true,
    });

    this.sharedVermilionMat = new THREE.MeshStandardMaterial({
      color: 0xb91c1c, // Sacred vermilion torii red
      roughness: 0.5,
      flatShading: true,
    });

    this.sharedBarkMat = new THREE.MeshStandardMaterial({
      color: 0x2b1d14,
      roughness: 0.9,
      flatShading: true,
    });

    this.sharedBlossomMats = [0xfbcfe8, 0xf472b6, 0xf9a8d4, 0xfce7f3].map(
      (c) =>
        new THREE.MeshStandardMaterial({
          color: c,
          roughness: 0.6,
          metalness: 0.05,
          flatShading: true,
        })
    );

    this.sharedPineMat = new THREE.MeshStandardMaterial({
      color: 0x14321d, // Deep mountain pine green
      roughness: 0.8,
      flatShading: true,
    });
  }

  // --- 2. LIGHTING & ATMOSPHERE (Bright, ethereal dawn matching Temple) ---
  private setupLighting() {
    // Soft lilac/rose ambient light
    const ambientLight = new THREE.AmbientLight(0xf2d9e6, 1.25);
    this.scene.add(ambientLight);

    // Warm apricot morning dawn sunlight
    const sunLight = new THREE.DirectionalLight(0xffecd2, 2.2);
    sunLight.position.set(45, 60, 25);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 180;
    const d = 40;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0005;
    this.scene.add(sunLight);

    // Cool lilac fill light from valley side
    const fillLight = new THREE.DirectionalLight(0xa5b4fc, 0.75);
    fillLight.position.set(-35, 30, -25);
    this.scene.add(fillLight);

    // Dreamy Japanese watercolor atmospheric fog matching temple
    this.scene.fog = new THREE.FogExp2(0xebd2de, 0.008);
  }

  // --- 3. SKY DOME & BACKDROP (Soft dawn gradients matching Temple) ---
  private createSkyAndBackdrop() {
    const skyGeo = new THREE.SphereGeometry(320, 24, 18);
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Heavenly Japanese twilight dawn gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, '#585e82');   // Twilight purple-blue zenith
    gradient.addColorStop(0.38, '#a288a6'); // Soft lavender
    gradient.addColorStop(0.65, '#e4a5b8'); // Rose dawn pink
    gradient.addColorStop(0.85, '#f6c3a9'); // Apricot golden horizon
    gradient.addColorStop(1.0, '#ebd4d8');  // Gentle mist base
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 16, 256);

    const skyTexture = new THREE.CanvasTexture(canvas);
    const skyMat = new THREE.MeshBasicMaterial({
      map: skyTexture,
      side: THREE.BackSide,
      depthWrite: false,
    });
    const skyMesh = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(skyMesh);

    // Low-poly soft cloud puffs floating across the valley
    const cloudMat = new THREE.MeshBasicMaterial({
      color: 0xedd6df,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    for (let i = 0; i < 14; i++) {
      const cloudGeo = new THREE.BoxGeometry(22 + Math.random() * 20, 5, 14);
      const cloud = new THREE.Mesh(cloudGeo, cloudMat);
      const angle = (i / 14) * Math.PI * 1.4 - 0.7;
      const dist = 90 + Math.random() * 30;
      cloud.position.set(Math.sin(angle) * dist, 7 + Math.random() * 8, -Math.cos(angle) * dist);
      this.scene.add(cloud);
    }
  }

  // --- 4. MAJESTIC MOUNT FUJI (Scenic Northern Backdrop) ---
  private createMountFuji() {
    const fujiGroup = new THREE.Group();
    // Fuji cone with smooth gentle slope
    const fujiGeo = new THREE.ConeGeometry(48, 56, 36, 12, true);
    const fujiMat = new THREE.MeshStandardMaterial({
      color: 0x312e81, // Indigo volcanic twilight
      roughness: 0.9,
      flatShading: true,
    });
    const fujiCone = new THREE.Mesh(fujiGeo, fujiMat);
    fujiCone.position.set(0, 28, 0);
    fujiGroup.add(fujiCone);

    // Iconic Alpine Snowcap Crown
    const snowCapGeo = new THREE.ConeGeometry(20, 22, 36, 6, true);
    const snowCapMat = new THREE.MeshStandardMaterial({
      color: 0xfff7ed, // Soft rose-tinted alpine snow
      roughness: 0.6,
      flatShading: true,
    });
    const snowCap = new THREE.Mesh(snowCapGeo, snowCapMat);
    snowCap.position.set(0, 46, 0);
    fujiGroup.add(snowCap);

    // Soft cloud belt around the mountain waist
    const cloudGeo = new THREE.CylinderGeometry(54, 62, 4.0, 24, 1, true);
    const cloudMat = new THREE.MeshBasicMaterial({
      color: 0xffedd5,
      transparent: true,
      opacity: 0.38,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const cloudRing = new THREE.Mesh(cloudGeo, cloudMat);
    cloudRing.position.set(0, 11, 0);
    fujiGroup.add(cloudRing);

    // Position Mount Fuji directly ahead in the scenic view
    fujiGroup.position.set(0, -6.0, -110.0);
    this.scene.add(fujiGroup);
  }

  // --- 5. NATURAL MOUNTAIN RIDGE & WINDING STONE TRAIL ---
  private createMountainTerrainAndTrail() {
    const terrainGroup = new THREE.Group();

    // 1. Mountain Ridge Overlook (Spawn Point at x: 0, z: -28, y: 6.1)
    // Multi-tiered stone terrace platform with moss borders
    const ridgeBaseGeo = new THREE.BoxGeometry(26, 6.0, 16);
    const ridgeBase = new THREE.Mesh(ridgeBaseGeo, this.sharedStoneMat);
    ridgeBase.position.set(0, 3.0, -29);
    ridgeBase.receiveShadow = true;
    terrainGroup.add(ridgeBase);

    // Overlook Flagstone Deck with rich slate paving
    const deckGeo = new THREE.BoxGeometry(24, 0.35, 14);
    const deck = new THREE.Mesh(deckGeo, this.sharedStoneMat);
    deck.position.set(0, 6.15, -29);
    deck.receiveShadow = true;
    terrainGroup.add(deck);

    // Moss / Alpine turf perimeter border
    const mossMat = new THREE.MeshStandardMaterial({ color: 0x2d4a22, roughness: 0.9 });
    const mossBorderGeo = new THREE.BoxGeometry(24.8, 0.25, 14.8);
    const mossBorder = new THREE.Mesh(mossBorderGeo, mossMat);
    mossBorder.position.set(0, 6.05, -29);
    terrainGroup.add(mossBorder);

    // Overlook Viewing Rails (Back and side railings facing the mountain valley)
    this.createWoodenRailingSegment(-11.5, 6.2, -29, 13.5, 0, terrainGroup); // West rail
    this.createWoodenRailingSegment(11.5, 6.2, -29, 13.5, 0, terrainGroup);  // East rail
    this.createWoodenRailingSegment(0, 6.2, -35.5, 23.0, Math.PI / 2, terrainGroup); // North overlook rail

    // Sacred Trail Entrance Vermilion Torii Gate (Frames the path leading down)
    this.createToriiGate(0, 6.2, -23.5, 1.15, terrainGroup);

    // Traditional Kasuga Stone Lanterns with warm glowing windows
    this.createStoneLantern(-3.6, 6.2, -25, terrainGroup);
    this.createStoneLantern(3.6, 6.2, -25, terrainGroup);
    this.createStoneLantern(-3.6, 6.2, -31, terrainGroup);
    this.createStoneLantern(3.6, 6.2, -31, terrainGroup);

    // Ridge warm regional fill light
    const ridgeFill = new THREE.PointLight(0xfbbf24, 1.2, 16);
    ridgeFill.position.set(0, 7.8, -28);
    terrainGroup.add(ridgeFill);

    // 2. Sloping Winding Trail Down to Valley (z: -23 down to 0)
    // Natural flagstone trail ramp
    const trailRampGeo = new THREE.BoxGeometry(6.8, 0.9, 23.5);
    const trailRamp = new THREE.Mesh(trailRampGeo, this.sharedStoneMat);
    trailRamp.position.set(0, 3.48, -11.5);
    trailRamp.rotation.x = 0.228; // Smooth 0.228 radian incline matching groundHeight
    trailRamp.receiveShadow = true;
    terrainGroup.add(trailRamp);

    // Trail side timber post & beam guide rails
    this.createSlopedRailing(-3.4, 3.6, -11.5, 23.5, 0.228, terrainGroup);
    this.createSlopedRailing(3.4, 3.6, -11.5, 23.5, 0.228, terrainGroup);

    // Trail side stone lanterns guiding the way
    this.createStoneLantern(-4.2, 3.6, -12, terrainGroup);
    this.createStoneLantern(4.2, 3.6, -12, terrainGroup);
    this.createStoneLantern(-4.2, 1.4, -2, terrainGroup);
    this.createStoneLantern(4.2, 1.4, -2, terrainGroup);

    // Trail warm regional fill light
    const trailFill = new THREE.PointLight(0xfbbf24, 1.0, 16);
    trailFill.position.set(0, 4.5, -12);
    terrainGroup.add(trailFill);

    // Natural Mountain Boulders alongside the trail
    this.createBoulder(-6.8, 4.2, -18, 2.2, terrainGroup);
    this.createBoulder(7.2, 3.8, -16, 2.5, terrainGroup);
    this.createBoulder(-6.2, 2.2, -8, 1.9, terrainGroup);
    this.createBoulder(6.5, 1.8, -6, 2.1, terrainGroup);

    // 3. Station Valley Floor (y = 0.68)
    const valleyGeo = new THREE.PlaneGeometry(85, 75);
    const valleyMat = new THREE.MeshStandardMaterial({
      color: 0x292524,
      roughness: 0.9,
    });
    const valley = new THREE.Mesh(valleyGeo, valleyMat);
    valley.rotation.x = -Math.PI / 2;
    valley.position.set(0, 0.68, 16);
    valley.receiveShadow = true;
    terrainGroup.add(valley);

    this.scene.add(terrainGroup);
  }

  // --- 6. RURAL JAPANESE TRAIN STATION (Open-air, 0 camera occlusion) ---
  private createTrainStationPlatform() {
    const stationGroup = new THREE.Group();

    // Concrete Platform Deck (Raised 0.85m for boarding level, widened to 40m)
    const platformGeo = new THREE.BoxGeometry(40, 0.85, 32);
    const platform = new THREE.Mesh(platformGeo, this.sharedStoneMat);
    platform.position.set(0, 0.425, 18);
    platform.receiveShadow = true;
    platform.castShadow = true;
    stationGroup.add(platform);

    // Yellow Braille Tactile Safety Pavers along platform edges
    const tactileMat = new THREE.MeshStandardMaterial({
      color: 0xeab308, // Japanese safety yellow
      roughness: 0.5,
    });
    [-9.2, -4.2, 4.2, 9.2].forEach((px) => {
      const tactileGeo = new THREE.BoxGeometry(0.35, 0.05, 30);
      const tactile = new THREE.Mesh(tactileGeo, tactileMat);
      tactile.position.set(px, 0.88, 18);
      stationGroup.add(tactile);
    });

    // High Overhead Platform Canopy Pillars (Elevated clearance at 8.8m)
    const roofPillars = [-17.5, -6.5, 6.5, 17.5];
    roofPillars.forEach((x) => {
      [6, 18, 30].forEach((z) => {
        const pillarGeo = new THREE.BoxGeometry(0.25, 8.2, 0.25);
        const pillar = new THREE.Mesh(pillarGeo, this.sharedWoodMat);
        pillar.position.set(x, 4.8, z);
        pillar.castShadow = true;
        stationGroup.add(pillar);
      });
    });

    // Overhead High Canopy Roof (Elevated to y = 8.8m so camera never clips)
    const canopyGeo = new THREE.BoxGeometry(42.0, 0.35, 30);
    const canopyMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.6,
    });
    const canopy = new THREE.Mesh(canopyGeo, canopyMat);
    canopy.position.set(0, 8.8, 18);
    canopy.castShadow = true;
    stationGroup.add(canopy);

    // Station Hanging Lanterns (High clearance at 7.6m, luminous meshes)
    [-10, 0, 10].forEach((lx) => {
      [10, 24].forEach((lz) => {
        const lantern = this.createPlatformHangingLantern(lx, 7.6, lz);
        stationGroup.add(lantern);
      });
    });

    // 2 Soft Warm Area Lights for the whole platform
    const platformFill1 = new THREE.PointLight(0xfef08a, 1.2, 22);
    platformFill1.position.set(-6, 7.0, 18);
    stationGroup.add(platformFill1);

    const platformFill2 = new THREE.PointLight(0xfef08a, 1.2, 22);
    platformFill2.position.set(6, 7.0, 18);
    stationGroup.add(platformFill2);

    // Station Master Signboard: "富士見高原駅 / Fujimi Highlands Station"
    const stationSignMesh = this.createStationMasterSign();
    stationSignMesh.position.set(0, 4.8, 4.5);
    stationGroup.add(stationSignMesh);

    // Railway Crossing Signals with Red Flashing Bulbs
    this.createRailwayCrossingGate(-18.5, 0.85, 3.5);
    this.createRailwayCrossingGate(18.5, 0.85, 3.5);

    this.scene.add(stationGroup);
  }

  // --- 7. RAILWAY TRACKS & INFRASTRUCTURE (Instanced ties for 1 draw call = 0 lag) ---
  private createTracksAndRailwayInfrastructure() {
    const tracksGroup = new THREE.Group();

    // Reusable ballast geometry
    const ballastGeo = new THREE.BoxGeometry(4.2, 0.25, 36);
    const ballastMat = new THREE.MeshStandardMaterial({ color: 0x292524, roughness: 0.95 });

    // Steel rail material & geometry
    const railGeo = new THREE.BoxGeometry(0.12, 0.18, 36);
    const railMat = new THREE.MeshStandardMaterial({
      color: 0x9ca3af,
      metalness: 0.9,
      roughness: 0.25,
    });

    // Wooden Railroad Ties - Merged into a single InstancedMesh for maximum performance
    const sleeperGeo = new THREE.BoxGeometry(3.0, 0.14, 0.3);
    const tiesPerTrack = 28;
    const totalTies = tiesPerTrack * 3;
    const instancedSleepers = new THREE.InstancedMesh(sleeperGeo, this.sharedWoodMat, totalTies);
    const dummy = new THREE.Object3D();
    let tieIdx = 0;

    // 3 Sets of Parallel Train Tracks: Left (-13.5), Center (0), Right (13.5)
    [-13.5, 0.0, 13.5].forEach((trackX) => {
      // Gravel Ballast Bed
      const ballast = new THREE.Mesh(ballastGeo, ballastMat);
      ballast.position.set(trackX, 0.8, 18);
      tracksGroup.add(ballast);

      // Wooden Railroad Ties (Instanced)
      for (let z = 2; z <= 34.4; z += 1.2) {
        if (tieIdx < totalTies) {
          dummy.position.set(trackX, 0.93, z);
          dummy.updateMatrix();
          instancedSleepers.setMatrixAt(tieIdx++, dummy.matrix);
        }
      }

      // Steel Rails (Pair)
      [-0.8, 0.8].forEach((railOffset) => {
        const rail = new THREE.Mesh(railGeo, railMat);
        rail.position.set(trackX + railOffset, 1.05, 18);
        tracksGroup.add(rail);
      });
    });

    instancedSleepers.instanceMatrix.needsUpdate = true;
    tracksGroup.add(instancedSleepers);

    this.scene.add(tracksGroup);
  }

  // --- 8. THE 3 JAPANESE TRAINS ---
  private createTheThreeTrains() {
    STATION_TRAINS.forEach((trainData) => {
      const trainGroup = new THREE.Group();

      const carLength = 22.0;
      const carWidth = 3.2;
      const carHeight = 3.4;

      // Clean pearl white Japanese train body
      const carGeo = new THREE.BoxGeometry(carWidth, carHeight, carLength);
      const carMat = new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        roughness: 0.35,
        metalness: 0.4,
      });
      const carBody = new THREE.Mesh(carGeo, carMat);
      carBody.position.set(0, carHeight / 2 + 0.4, 0);
      carBody.castShadow = true;
      carBody.receiveShadow = true;
      trainGroup.add(carBody);

      // Livery Stripe in event color
      const stripeGeo = new THREE.BoxGeometry(carWidth + 0.05, 0.45, carLength + 0.02);
      const stripeMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(trainData.colorHex),
        roughness: 0.3,
        metalness: 0.5,
      });
      const stripe = new THREE.Mesh(stripeGeo, stripeMat);
      stripe.position.set(0, 1.5, 0);
      trainGroup.add(stripe);

      // Aerodynamic Front Nose Cone
      const noseGeo = new THREE.ConeGeometry(1.6, 2.8, 8);
      const noseMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        roughness: 0.3,
        metalness: 0.6,
      });
      const nose = new THREE.Mesh(noseGeo, noseMat);
      nose.rotation.x = -Math.PI / 2;
      nose.position.set(0, 1.9, -carLength / 2 - 0.7);
      trainGroup.add(nose);

      // Driver Windshield
      const windowMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        roughness: 0.1,
        metalness: 0.9,
        transparent: true,
        opacity: 0.8,
      });
      const cabWindowGeo = new THREE.BoxGeometry(2.4, 0.9, 0.6);
      const cabWindow = new THREE.Mesh(cabWindowGeo, windowMat);
      cabWindow.position.set(0, 2.5, -carLength / 2 - 0.3);
      trainGroup.add(cabWindow);

      // Passenger Side Windows (Warm glowing cabin light)
      const pWindowMat = new THREE.MeshBasicMaterial({
        color: 0xfef08a,
        transparent: true,
        opacity: 0.85,
      });
      for (let z = -8; z <= 8; z += 3.2) {
        [-carWidth / 2 - 0.02, carWidth / 2 + 0.02].forEach((wx) => {
          const pWindowGeo = new THREE.BoxGeometry(0.1, 0.95, 1.8);
          const pWindow = new THREE.Mesh(pWindowGeo, pWindowMat);
          pWindow.position.set(wx, 2.2, z);
          trainGroup.add(pWindow);
        });
      }

      // Roof Air Conditioner Unit
      const roofUnitGeo = new THREE.BoxGeometry(1.8, 0.45, 6.0);
      const roofUnit = new THREE.Mesh(roofUnitGeo, this.sharedWoodMat);
      roofUnit.position.set(0, carHeight + 0.6, 2.0);
      trainGroup.add(roofUnit);

      // Headlights (Dual glowing lantern bezels - lightweight basic material for 0 lag)
      [-0.9, 0.9].forEach((hx) => {
        const headLightBulb = new THREE.Mesh(
          new THREE.CylinderGeometry(0.2, 0.2, 0.15, 10),
          new THREE.MeshBasicMaterial({ color: 0xfffbeb })
        );
        headLightBulb.rotation.x = Math.PI / 2;
        headLightBulb.position.set(hx, 1.2, -carLength / 2 - 1.1);
        trainGroup.add(headLightBulb);
      });

      // --- SIGNAGE 1: FRONT HEADBOARD (Strictly Japanese Name ONLY) ---
      const headboardTexture = this.createHeadboardCanvasTexture(trainData.nameJapanese, trainData.colorHex);
      const headboardGeo = new THREE.CircleGeometry(0.55, 24);
      const headboardMat = new THREE.MeshBasicMaterial({ map: headboardTexture, side: THREE.DoubleSide });
      const headboard = new THREE.Mesh(headboardGeo, headboardMat);
      headboard.position.set(0, 1.75, -carLength / 2 - 1.2);
      trainGroup.add(headboard);

      // --- SIGNAGE 2: SIDE DESTINATION DISPLAY (English + Japanese) ---
      const destTexture = this.createDestinationCanvasTexture(
        trainData.destinationEnglish,
        trainData.destinationJapanese,
        trainData.colorHex
      );
      const destGeo = new THREE.PlaneGeometry(2.4, 0.7);
      const destMat = new THREE.MeshBasicMaterial({ map: destTexture, side: THREE.DoubleSide });

      const destSign = new THREE.Mesh(destGeo, destMat);
      destSign.position.set(carWidth / 2 + 0.05, 2.6, -3.0);
      destSign.rotation.y = Math.PI / 2;
      trainGroup.add(destSign);

      const destSign2 = new THREE.Mesh(destGeo, destMat);
      destSign2.position.set(-carWidth / 2 - 0.05, 2.6, -3.0);
      destSign2.rotation.y = -Math.PI / 2;
      trainGroup.add(destSign2);

      // --- BOARDING DOOR INDICATOR & GLOW ---
      const doorGroup = new THREE.Group();
      doorGroup.position.set(carWidth / 2 + 0.3, 0.8, -2.5);

      const matGeo = new THREE.PlaneGeometry(1.6, 1.8);
      const matMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(trainData.colorHex),
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
      });
      const boardingMat = new THREE.Mesh(matGeo, matMat);
      boardingMat.rotation.x = -Math.PI / 2;
      doorGroup.add(boardingMat);

      const doorLight = new THREE.PointLight(new THREE.Color(trainData.colorHex).getHex(), 1.4, 4.0);
      doorLight.position.set(0, 1.8, 0);
      doorGroup.add(doorLight);

      trainGroup.add(doorGroup);
      this.trainDoorMarkers.push({
        group: doorGroup,
        light: doorLight,
        id: trainData.id,
      });

      trainGroup.position.set(trainData.position.x, trainData.position.y, trainData.position.z);
      this.scene.add(trainGroup);
    });
  }

  // --- 9. FLORA: SAKURA BLOSSOMS & ALPINE PINES FRAMING THE OVERLOOK ---
  private createSakuraAndPineFlora() {
    // Cherry Blossom trees framing the mountain ridge overlook
    const sakuraConfigs = [
      { x: -11.0, y: 6.2, z: -27.0, scale: 1.35 },
      { x: 11.0, y: 6.2, z: -27.0, scale: 1.35 },
      { x: -9.5, y: 6.2, z: -33.0, scale: 1.45 },
      { x: 9.5, y: 6.2, z: -33.0, scale: 1.45 },
      { x: -6.5, y: 4.8, z: -19.0, scale: 1.25 },
      { x: 6.5, y: 4.8, z: -19.0, scale: 1.25 },
      { x: -6.0, y: 2.2, z: -7.0, scale: 1.2 },
      { x: 6.0, y: 2.2, z: -7.0, scale: 1.2 },
    ];

    sakuraConfigs.forEach((cfg) => {
      this.createSakuraTree(cfg.x, cfg.y, cfg.z, cfg.scale);
    });

    // Japanese Alpine Pines along the ridge rim
    const pineConfigs = [
      { x: -13.5, y: 6.1, z: -31.0, scale: 1.3 },
      { x: 13.5, y: 6.1, z: -31.0, scale: 1.3 },
      { x: -8.0, y: 3.5, z: -13.0, scale: 1.15 },
      { x: 8.0, y: 3.5, z: -13.0, scale: 1.15 },
      { x: -15.0, y: 0.85, z: 2.0, scale: 1.25 },
      { x: 15.0, y: 0.85, z: 2.0, scale: 1.25 },
    ];

    pineConfigs.forEach((cfg) => {
      this.createPineTree(cfg.x, cfg.y, cfg.z, cfg.scale);
    });
  }

  // --- SAKURA TREE BUILDER (Clean, stylized, zero lag) ---
  private createSakuraTree(x: number, y: number, z: number, scale: number) {
    const tree = new THREE.Group();
    tree.position.set(x, y, z);
    tree.scale.setScalar(scale);

    // Stately trunk elevating canopy above camera sightlines
    const trunkGeo = new THREE.CylinderGeometry(0.28, 0.44, 4.8, 7);
    const trunk = new THREE.Mesh(trunkGeo, this.sharedBarkMat);
    trunk.position.y = 2.4;
    trunk.castShadow = true;
    tree.add(trunk);

    // Elevated blossom foliage clusters (Low-poly dodecahedrons with shared materials)
    const clusterCount = 7;
    for (let i = 0; i < clusterCount; i++) {
      const mat = this.sharedBlossomMats[i % this.sharedBlossomMats.length];
      const radius = 1.4 + Math.random() * 0.7;
      const blob = new THREE.Mesh(new THREE.DodecahedronGeometry(radius, 1), mat);
      const angle = (i / clusterCount) * Math.PI * 2;
      const dist = 0.8 + Math.random() * 1.8;
      blob.position.set(Math.cos(angle) * dist, 4.8 + Math.random() * 1.6, Math.sin(angle) * dist);
      tree.add(blob);
    }

    this.scene.add(tree);
  }

  // --- PINE TREE BUILDER ---
  private createPineTree(x: number, y: number, z: number, scale: number) {
    const tree = new THREE.Group();
    tree.position.set(x, y, z);
    tree.scale.setScalar(scale);

    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.35, 3.5, 7), this.sharedBarkMat);
    trunk.position.y = 1.75;
    trunk.castShadow = true;
    tree.add(trunk);

    [2.8, 4.0, 5.0].forEach((tierY, idx) => {
      const radius = 2.0 - idx * 0.45;
      const cone = new THREE.Mesh(new THREE.ConeGeometry(radius, 1.6, 6), this.sharedPineMat);
      cone.position.y = tierY;
      tree.add(cone);
    });

    this.scene.add(tree);
  }

  // --- 10. DRIFTING SAKURA PETALS / MORNING MIST (Lightweight, 0 lag) ---
  private createAtmosphericPetals() {
    const petalCount = 90; // Reduced count for lightweight GPU compute
    const geo = new THREE.BufferGeometry();
    this.petalPositions = new Float32Array(petalCount * 3);

    for (let i = 0; i < petalCount; i++) {
      this.petalPositions[i * 3] = (Math.random() - 0.5) * 50;
      this.petalPositions[i * 3 + 1] = 1.0 + Math.random() * 8.0;
      this.petalPositions[i * 3 + 2] = -32 + Math.random() * 60;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(this.petalPositions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xfda4af, // Soft pink sakura petal
      size: 0.28,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.petalParticles = new THREE.Points(geo, mat);
    this.scene.add(this.petalParticles);
  }

  // --- ENVIRONMENT TICK / ANIMATIONS ---
  public update(delta: number) {
    const time = performance.now() * 0.002;

    // 1. Alternating Railway Crossing Flashers
    if (this.crossingLight1 && this.crossingLight2) {
      const isFirstOn = Math.floor(time * 2) % 2 === 0;
      this.crossingLight1.intensity = isFirstOn ? 2.0 : 0.0;
      this.crossingLight2.intensity = isFirstOn ? 0.0 : 2.0;
    }

    // 2. Animate train door markers
    this.trainDoorMarkers.forEach((dm, idx) => {
      dm.light.intensity = 1.2 + Math.sin(time * 3 + idx) * 0.6;
    });

    // 3. Petals / mist gentle drift
    if (this.petalPositions) {
      const count = this.petalPositions.length / 3;
      for (let i = 0; i < count; i++) {
        this.petalPositions[i * 3] += Math.sin(time + i) * 0.015;
        this.petalPositions[i * 3 + 1] -= 0.012; // gentle descent
        this.petalPositions[i * 3 + 2] += 0.025; // drift down valley

        if (this.petalPositions[i * 3 + 1] < 0.5) {
          this.petalPositions[i * 3 + 1] = 9.0;
        }
        if (this.petalPositions[i * 3 + 2] > 36) {
          this.petalPositions[i * 3 + 2] = -32;
        }
      }
      this.petalParticles.geometry.attributes.position.needsUpdate = true;
    }
  }

  // --- CANVAS TEXTURE GENERATOR FOR HEADBOARD (Japanese ONLY) ---
  private createHeadboardCanvasTexture(japaneseName: string, colorHex: string): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(256, 256, 240, 0, Math.PI * 2);
    ctx.fill();

    ctx.lineWidth = 18;
    ctx.strokeStyle = colorHex;
    ctx.stroke();

    ctx.lineWidth = 6;
    ctx.strokeStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(256, 256, 215, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 110px "Hiragino Sans", "Meiryo", "Noto Sans JP", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(japaneseName, 256, 256);

    ctx.font = '32px sans-serif';
    ctx.fillStyle = colorHex;
    ctx.fillText('◆ 特急 ◆', 256, 120);
    ctx.fillText('JAPAN RAIL', 256, 385);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  // --- CANVAS TEXTURE GENERATOR FOR DESTINATION SIGN (English + Japanese) ---
  private createDestinationCanvasTexture(destEn: string, destJp: string, colorHex: string): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 320;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, 1024, 320);

    ctx.strokeStyle = colorHex;
    ctx.lineWidth = 8;
    ctx.strokeRect(10, 10, 1004, 300);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 56px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(destEn, 512, 105);

    ctx.fillStyle = colorHex;
    ctx.font = 'bold 72px "Hiragino Sans", "Meiryo", "Noto Sans JP", sans-serif';
    ctx.fillText(destJp, 512, 225);

    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(60, 60, 14, 0, Math.PI * 2);
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  // --- STATION MASTER SIGNBOARD ---
  private createStationMasterSign(): THREE.Mesh {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 340;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 1024, 340);

    ctx.fillStyle = '#0369a1';
    ctx.fillRect(0, 270, 1024, 70);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 80px "Hiragino Sans", "Meiryo", "Noto Sans JP", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('富士見高原', 512, 110);

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 44px sans-serif';
    ctx.fillText('Fujimi-Kōgen Station', 512, 190);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('◄ 本堂・霊峰行 (To Sanctuary)      終点 (Terminal) ►', 512, 318);

    const texture = new THREE.CanvasTexture(canvas);
    const signGeo = new THREE.BoxGeometry(4.2, 1.4, 0.15);
    const signMat = new THREE.MeshBasicMaterial({ map: texture });
    return new THREE.Mesh(signGeo, signMat);
  }

  // --- RAILWAY CROSSING GATE ---
  private createRailwayCrossingGate(x: number, y: number, z: number) {
    const postGeo = new THREE.CylinderGeometry(0.12, 0.12, 4.0, 8);
    const post = new THREE.Mesh(postGeo, this.sharedWoodMat);
    post.position.set(x, y + 2.0, z);
    this.scene.add(post);

    const crossbuckMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const bar1 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.18, 0.05), crossbuckMat);
    bar1.rotation.z = 0.7;
    bar1.position.set(x, y + 3.2, z + 0.08);
    this.scene.add(bar1);

    const bar2 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.18, 0.05), crossbuckMat);
    bar2.rotation.z = -0.7;
    bar2.position.set(x, y + 3.2, z + 0.08);
    this.scene.add(bar2);

    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const bulb1 = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), bulbMat);
    bulb1.position.set(x - 0.4, y + 2.7, z + 0.1);
    this.scene.add(bulb1);

    const bulb2 = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), bulbMat);
    bulb2.position.set(x + 0.4, y + 2.7, z + 0.1);
    this.scene.add(bulb2);

    const light1 = new THREE.PointLight(0xef4444, 1.2, 4.0);
    light1.position.copy(bulb1.position);
    this.scene.add(light1);

    const light2 = new THREE.PointLight(0xef4444, 0.0, 4.0);
    light2.position.copy(bulb2.position);
    this.scene.add(light2);

    this.crossingLight1 = light1;
    this.crossingLight2 = light2;
  }

  // --- TRADITIONAL ASSET BUILDERS ---
  private createToriiGate(x: number, y: number, z: number, scale: number = 1.0, group?: THREE.Group) {
    const torii = new THREE.Group();
    const vermilionMat = this.sharedVermilionMat;
    const blackMat = this.sharedWoodMat;

    [-1.8 * scale, 1.8 * scale].forEach((px) => {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.18 * scale, 0.22 * scale, 4.2 * scale, 10), vermilionMat);
      p.position.set(px, 2.1 * scale, 0);
      p.castShadow = true;
      torii.add(p);
    });

    const lintel = new THREE.Mesh(new THREE.BoxGeometry(4.8 * scale, 0.35 * scale, 0.45 * scale), blackMat);
    lintel.position.set(0, 4.1 * scale, 0);
    torii.add(lintel);

    const subBeam = new THREE.Mesh(new THREE.BoxGeometry(4.2 * scale, 0.22 * scale, 0.3 * scale), vermilionMat);
    subBeam.position.set(0, 3.4 * scale, 0);
    torii.add(subBeam);

    torii.position.set(x, y, z);
    if (group) group.add(torii);
    else this.scene.add(torii);
  }

  private createStoneLantern(x: number, y: number, z: number, group?: THREE.Group) {
    const lanternGroup = new THREE.Group();
    const stoneMat = this.sharedStoneMat;

    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 1.3, 7), stoneMat);
    post.position.set(0, 0.65, 0);
    lanternGroup.add(post);

    // Glowing warm candle window core (MeshBasicMaterial = bright visual glow, 0 shader lag)
    const candleCore = new THREE.Mesh(
      new THREE.BoxGeometry(0.36, 0.35, 0.36),
      new THREE.MeshBasicMaterial({ color: 0xfef08a })
    );
    candleCore.position.set(0, 1.4, 0);
    lanternGroup.add(candleCore);

    const lightBox = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.45, 0.48), stoneMat);
    lightBox.position.set(0, 1.4, 0);
    lanternGroup.add(lightBox);

    const roof = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.35, 4), stoneMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.set(0, 1.8, 0);
    lanternGroup.add(roof);

    lanternGroup.position.set(x, y, z);
    if (group) group.add(lanternGroup);
    else this.scene.add(lanternGroup);
  }

  private createBoulder(x: number, y: number, z: number, scale: number, group?: THREE.Group) {
    const boulder = new THREE.Mesh(new THREE.DodecahedronGeometry(scale, 1), this.sharedStoneMat);
    boulder.position.set(x, y + scale * 0.4, z);
    boulder.castShadow = true;
    boulder.receiveShadow = true;
    if (group) group.add(boulder);
    else this.scene.add(boulder);
  }

  private createWoodenRailingSegment(x: number, y: number, z: number, length: number, rotationY: number, group: THREE.Group) {
    const railGroup = new THREE.Group();
    railGroup.position.set(x, y, z);
    railGroup.rotation.y = rotationY;

    const topBar = new THREE.Mesh(new THREE.BoxGeometry(length, 0.1, 0.12), this.sharedWoodMat);
    topBar.position.y = 0.9;
    railGroup.add(topBar);

    const midBar = new THREE.Mesh(new THREE.BoxGeometry(length, 0.08, 0.08), this.sharedWoodMat);
    midBar.position.y = 0.5;
    railGroup.add(midBar);

    for (let off = -length / 2 + 0.8; off <= length / 2 - 0.8; off += 1.8) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.95, 6), this.sharedWoodMat);
      post.position.set(off, 0.48, 0);
      post.castShadow = true;
      railGroup.add(post);
    }

    group.add(railGroup);
  }

  private createSlopedRailing(x: number, y: number, z: number, length: number, slopeAngle: number, group: THREE.Group) {
    const railMat = this.sharedWoodMat;
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.15, length), railMat);
    rail.position.set(x, y + 0.8, z);
    rail.rotation.x = slopeAngle;
    group.add(rail);

    for (let offset = -length / 2 + 1; offset <= length / 2 - 1; offset += 2.2) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.9, 6), railMat);
      const postZ = z + offset * Math.cos(slopeAngle);
      const posY = y - offset * Math.sin(slopeAngle) + 0.45;
      post.position.set(x, posY, postZ);
      group.add(post);
    }
  }

  private createPlatformHangingLantern(x: number, y: number, z: number): THREE.Group {
    const group = new THREE.Group();
    const lanternGeo = new THREE.CylinderGeometry(0.24, 0.2, 0.65, 8);
    const lanternMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const lantern = new THREE.Mesh(lanternGeo, lanternMat);
    group.add(lantern);

    group.position.set(x, y, z);
    return group;
  }
}
