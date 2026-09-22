import * as THREE from 'three';

export class SamuraiCharacter {
  public group: THREE.Group;
  public collisionRadius: number = 0.6;
  public height: number = 1.85;

  // Rig components for procedural animation
  private torsoGroup: THREE.Group;
  private headGroup: THREE.Group;
  private leftArmGroup: THREE.Group;
  private rightArmGroup: THREE.Group;
  private leftForearm: THREE.Group;
  private rightForearm: THREE.Group;
  private leftLegGroup: THREE.Group;
  private rightLegGroup: THREE.Group;
  private leftShinGroup: THREE.Group;
  private rightShinGroup: THREE.Group;
  private skirtPlates: THREE.Mesh[] = [];
  private scabbardGroup: THREE.Group;

  // Animation state
  private animTime: number = 0;
  private targetRotation: number = 0;
  private currentRotation: number = 0;
  private verticalVelocity: number = 0;
  public isGrounded: boolean = true;
  private jumpProgress: number = 0;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'SamuraiCharacter';

    // Materials - Stylized low poly palette based on Japanese lacquer & vermilion reference
    const materials = {
      blackArmor: new THREE.MeshStandardMaterial({
        color: 0x1e2229,
        roughness: 0.4,
        metalness: 0.2,
        flatShading: true,
      }),
      vermilionRed: new THREE.MeshStandardMaterial({
        color: 0xba2820,
        roughness: 0.5,
        metalness: 0.1,
        flatShading: true,
      }),
      crimsonCloth: new THREE.MeshStandardMaterial({
        color: 0x991b1b,
        roughness: 0.8,
        flatShading: true,
      }),
      ivoryRobe: new THREE.MeshStandardMaterial({
        color: 0xf1ece1,
        roughness: 0.7,
        flatShading: true,
      }),
      goldAccent: new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        roughness: 0.25,
        metalness: 0.8,
        flatShading: true,
      }),
      steelBlade: new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        roughness: 0.2,
        metalness: 0.9,
        flatShading: true,
      }),
      skinTone: new THREE.MeshStandardMaterial({
        color: 0xdfb48c,
        roughness: 0.6,
        flatShading: true,
      }),
      darkWood: new THREE.MeshStandardMaterial({
        color: 0x3e2723,
        roughness: 0.6,
        flatShading: true,
      }),
      strawSandal: new THREE.MeshStandardMaterial({
        color: 0xd4a373,
        roughness: 0.9,
        flatShading: true,
      }),
    };

    // Root offset so pivot is at feet base
    const rootOffset = new THREE.Group();
    rootOffset.position.y = 0;
    this.group.add(rootOffset);

    // ==========================================
    // 1. TORSO & CHEST ARMOR (Dō)
    // ==========================================
    this.torsoGroup = new THREE.Group();
    this.torsoGroup.position.y = 0.95;
    rootOffset.add(this.torsoGroup);

    // Inner Kimono chest
    const kimonoGeo = new THREE.BoxGeometry(0.46, 0.45, 0.32);
    const kimono = new THREE.Mesh(kimonoGeo, materials.ivoryRobe);
    kimono.castShadow = true;
    this.torsoGroup.add(kimono);

    // Main chest armor cuirass (Dō) - Stylized layered plates
    const chestPlateGeo = new THREE.BoxGeometry(0.5, 0.35, 0.36);
    const chestPlate = new THREE.Mesh(chestPlateGeo, materials.blackArmor);
    chestPlate.position.y = 0.05;
    chestPlate.castShadow = true;
    this.torsoGroup.add(chestPlate);

    // Vermilion silk cord lacing on chest
    const lacing1 = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, 0.38), materials.vermilionRed);
    lacing1.position.set(0, 0.12, 0);
    const lacing2 = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, 0.38), materials.vermilionRed);
    lacing2.position.set(0, 0.02, 0);
    const lacing3 = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, 0.38), materials.vermilionRed);
    lacing3.position.set(0, -0.08, 0);
    this.torsoGroup.add(lacing1, lacing2, lacing3);

    // Golden family crest on center chest (Mon)
    const chestMon = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 6), materials.goldAccent);
    chestMon.rotation.x = Math.PI / 2;
    chestMon.position.set(0, 0.06, 0.19);
    this.torsoGroup.add(chestMon);

    // Belt / Obi sash
    const obi = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.12, 0.35), materials.crimsonCloth);
    obi.position.y = -0.22;
    this.torsoGroup.add(obi);

    // ==========================================
    // 2. HEAD & KABUTO (HELMET)
    // ==========================================
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.35, 0);
    this.torsoGroup.add(this.headGroup);

    // Neck
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.14, 6), materials.skinTone);
    neck.position.y = -0.05;
    this.headGroup.add(neck);

    // Face / Head base
    const faceGeo = new THREE.BoxGeometry(0.24, 0.22, 0.24);
    const face = new THREE.Mesh(faceGeo, materials.skinTone);
    face.position.set(0, 0.08, 0.02);
    this.headGroup.add(face);

    // Samurai Menpo (Face mask/Mustache guard)
    const maskGeo = new THREE.BoxGeometry(0.26, 0.12, 0.16);
    const mask = new THREE.Mesh(maskGeo, materials.blackArmor);
    mask.position.set(0, 0.05, 0.08);
    this.headGroup.add(mask);

    // Kabuto Helmet Bowl (Hachi)
    const helmetBowl = new THREE.Mesh(
      new THREE.SphereGeometry(0.23, 8, 7, 0, Math.PI * 2, 0, Math.PI * 0.55),
      materials.blackArmor
    );
    helmetBowl.position.set(0, 0.15, 0.01);
    this.headGroup.add(helmetBowl);

    // Helmet Peak / Visor (Mabisashi)
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.04, 0.16), materials.goldAccent);
    visor.position.set(0, 0.18, 0.16);
    visor.rotation.x = 0.2;
    this.headGroup.add(visor);

    // Distinctive Golden Crescent Moon Crest (Kuwagata / Maedate)
    const crestGroup = new THREE.Group();
    crestGroup.position.set(0, 0.28, 0.15);
    
    // Golden central horn / moon ornament
    const hornL = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.25, 4), materials.goldAccent);
    hornL.rotation.z = -0.55;
    hornL.rotation.x = -0.15;
    hornL.position.set(-0.11, 0.08, 0);

    const hornR = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.25, 4), materials.goldAccent);
    hornR.rotation.z = 0.55;
    hornR.rotation.x = -0.15;
    hornR.position.set(0.11, 0.08, 0);

    const crestCenter = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.03, 6), materials.goldAccent);
    crestCenter.rotation.x = Math.PI / 2;

    crestGroup.add(hornL, hornR, crestCenter);
    this.headGroup.add(crestGroup);

    // Neck Guard Flaps (Shikoro) - Tiered plates at back of helmet
    for (let i = 0; i < 3; i++) {
      const shikoroTier = new THREE.Mesh(
        new THREE.CylinderGeometry(0.24 + i * 0.03, 0.26 + i * 0.03, 0.05, 8, 1, true, Math.PI * 0.7, Math.PI * 1.6),
        i % 2 === 0 ? materials.blackArmor : materials.vermilionRed
      );
      shikoroTier.position.set(0, 0.12 - i * 0.06, -0.02);
      this.headGroup.add(shikoroTier);
    }

    // ==========================================
    // 3. ARMS & SHOULDER GUARDS (Sode)
    // ==========================================
    // Left Arm
    this.leftArmGroup = new THREE.Group();
    this.leftArmGroup.position.set(-0.33, 0.18, 0);
    this.torsoGroup.add(this.leftArmGroup);

    // Left Shoulder Guard (Sode) - Iconic rectangular armored plate
    const sodeL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.26, 0.26), materials.blackArmor);
    sodeL.position.set(-0.06, -0.02, 0);
    sodeL.rotation.z = 0.18;
    sodeL.castShadow = true;
    const sodeTrimL = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.04, 0.27), materials.goldAccent);
    sodeTrimL.position.set(-0.06, 0.1, 0);
    sodeTrimL.rotation.z = 0.18;
    this.leftArmGroup.add(sodeL, sodeTrimL);

    // Upper Arm
    const upperArmL = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.22, 6), materials.ivoryRobe);
    upperArmL.position.y = -0.11;
    this.leftArmGroup.add(upperArmL);

    // Forearm & Armored Gauntlet (Kote)
    this.leftForearm = new THREE.Group();
    this.leftForearm.position.set(0, -0.22, 0);
    this.leftArmGroup.add(this.leftForearm);

    const koteL = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.22, 6), materials.blackArmor);
    koteL.position.y = -0.1;
    const handL = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.08, 0.09), materials.skinTone);
    handL.position.y = -0.22;
    this.leftForearm.add(koteL, handL);

    // Right Arm
    this.rightArmGroup = new THREE.Group();
    this.rightArmGroup.position.set(0.33, 0.18, 0);
    this.torsoGroup.add(this.rightArmGroup);

    // Right Shoulder Guard (Sode)
    const sodeR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.26, 0.26), materials.blackArmor);
    sodeR.position.set(0.06, -0.02, 0);
    sodeR.rotation.z = -0.18;
    sodeR.castShadow = true;
    const sodeTrimR = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.04, 0.27), materials.goldAccent);
    sodeTrimR.position.set(0.06, 0.1, 0);
    sodeTrimR.rotation.z = -0.18;
    this.rightArmGroup.add(sodeR, sodeTrimR);

    // Upper Arm
    const upperArmR = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.22, 6), materials.ivoryRobe);
    upperArmR.position.y = -0.11;
    this.rightArmGroup.add(upperArmR);

    // Forearm & Gauntlet
    this.rightForearm = new THREE.Group();
    this.rightForearm.position.set(0, -0.22, 0);
    this.rightArmGroup.add(this.rightForearm);

    const koteR = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.22, 6), materials.blackArmor);
    koteR.position.y = -0.1;
    const handR = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.08, 0.09), materials.skinTone);
    handR.position.y = -0.22;
    this.rightForearm.add(koteR, handR);

    // ==========================================
    // 4. KATANA & SCABBARD (Saya) ON HIP
    // ==========================================
    this.scabbardGroup = new THREE.Group();
    this.scabbardGroup.position.set(-0.25, -0.18, 0.04);
    this.scabbardGroup.rotation.x = 0.35;
    this.scabbardGroup.rotation.z = 0.45;
    this.torsoGroup.add(this.scabbardGroup);

    // Saya (Scabbard) - Sleek black lacquer
    const saya = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.8, 0.035), materials.blackArmor);
    saya.position.set(0, -0.25, 0);
    
    // Gold Sageo ribbon tie
    const sageo = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.08, 0.05), materials.goldAccent);
    sageo.position.set(0, 0.02, 0);

    // Tsuba (Sword Guard)
    const tsuba = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.015, 8), materials.goldAccent);
    tsuba.position.set(0, 0.16, 0);

    // Tsuka (Hilt/Handle) with traditional wrap
    const tsuka = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.25, 0.03), materials.ivoryRobe);
    tsuka.position.set(0, 0.3, 0);

    const tsukaGrip = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.03, 0.035), materials.crimsonCloth);
    tsukaGrip.position.set(0, 0.28, 0);

    this.scabbardGroup.add(saya, sageo, tsuba, tsuka, tsukaGrip);

    // ==========================================
    // 5. SKIRT PLATES (Kusazuri)
    // ==========================================
    const skirtAngles = [
      { x: 0, z: 0.17, ry: 0, rx: 0.2 },      // Front
      { x: 0, z: -0.17, ry: Math.PI, rx: 0.2 }, // Back
      { x: -0.24, z: 0, ry: -Math.PI / 2, rx: 0.2 }, // Left
      { x: 0.24, z: 0, ry: Math.PI / 2, rx: 0.2 },  // Right
    ];

    skirtAngles.forEach((conf) => {
      const platePivot = new THREE.Group();
      platePivot.position.set(conf.x, -0.24, conf.z);
      platePivot.rotation.y = conf.ry;
      this.torsoGroup.add(platePivot);

      const plate = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.28, 0.03), materials.blackArmor);
      plate.position.set(0, -0.12, 0.02);
      plate.rotation.x = conf.rx;
      plate.castShadow = true;
      platePivot.add(plate);

      const trim = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.03, 0.04), materials.vermilionRed);
      trim.position.set(0, -0.22, 0.02);
      trim.rotation.x = conf.rx;
      platePivot.add(trim);

      this.skirtPlates.push(plate);
    });

    // ==========================================
    // 6. LEGS, SHINS (Suneate) & SANDALS (Waraji)
    // ==========================================
    // Left Leg
    this.leftLegGroup = new THREE.Group();
    this.leftLegGroup.position.set(-0.16, 0.62, 0);
    rootOffset.add(this.leftLegGroup);

    // Thigh / Hakama
    const thighL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.32, 0.2), materials.crimsonCloth);
    thighL.position.y = -0.14;
    this.leftLegGroup.add(thighL);

    // Left Shin & Foot
    this.leftShinGroup = new THREE.Group();
    this.leftShinGroup.position.set(0, -0.3, 0);
    this.leftLegGroup.add(this.leftShinGroup);

    // Suneate (Shin Greave)
    const shinL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.28, 0.16), materials.blackArmor);
    shinL.position.y = -0.12;
    
    // Waraji / Foot
    const footL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.07, 0.22), materials.strawSandal);
    footL.position.set(0, -0.28, 0.03);
    footL.castShadow = true;

    this.leftShinGroup.add(shinL, footL);

    // Right Leg
    this.rightLegGroup = new THREE.Group();
    this.rightLegGroup.position.set(0.16, 0.62, 0);
    rootOffset.add(this.rightLegGroup);

    // Thigh
    const thighR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.32, 0.2), materials.crimsonCloth);
    thighR.position.y = -0.14;
    this.rightLegGroup.add(thighR);

    // Right Shin & Foot
    this.rightShinGroup = new THREE.Group();
    this.rightShinGroup.position.set(0, -0.3, 0);
    this.rightLegGroup.add(this.rightShinGroup);

    const shinR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.28, 0.16), materials.blackArmor);
    shinR.position.y = -0.12;

    const footR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.07, 0.22), materials.strawSandal);
    footR.position.set(0, -0.28, 0.03);
    footR.castShadow = true;

    this.rightShinGroup.add(shinR, footR);

    // Enable cast/receive shadows for all meshes
    this.group.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
  }

  /**
   * Set target facing angle in radians
   */
  public setFacingAngle(targetAngle: number) {
    this.targetRotation = targetAngle;
  }

  /**
   * Procedural animation loop updated every frame
   */
  public update(
    delta: number,
    isMoving: boolean,
    moveSpeed: number, // 0 to ~8
    isSprinting: boolean,
    isJumping: boolean
  ) {
    this.animTime += delta;

    // Smoothly rotate character toward movement vector
    // Using shortest angle interpolation
    let angleDiff = this.targetRotation - this.currentRotation;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    this.currentRotation += angleDiff * Math.min(1, delta * 12);
    this.group.rotation.y = this.currentRotation;

    if (!this.isGrounded || isJumping) {
      // JUMP ANIMATION
      this.jumpProgress += delta * 4;
      const t = Math.min(this.jumpProgress, 1);

      // Tuck legs
      this.leftLegGroup.rotation.x = THREE.MathUtils.lerp(this.leftLegGroup.rotation.x, -0.4, 0.15);
      this.rightLegGroup.rotation.x = THREE.MathUtils.lerp(this.rightLegGroup.rotation.x, 0.3, 0.15);
      this.leftShinGroup.rotation.x = THREE.MathUtils.lerp(this.leftShinGroup.rotation.x, 0.6, 0.15);
      this.rightShinGroup.rotation.x = THREE.MathUtils.lerp(this.rightShinGroup.rotation.x, 0.5, 0.15);

      // Arms out for balance
      this.leftArmGroup.rotation.x = THREE.MathUtils.lerp(this.leftArmGroup.rotation.x, -0.6, 0.15);
      this.rightArmGroup.rotation.x = THREE.MathUtils.lerp(this.rightArmGroup.rotation.x, -0.5, 0.15);
      this.leftArmGroup.rotation.z = THREE.MathUtils.lerp(this.leftArmGroup.rotation.z, -0.3, 0.15);
      this.rightArmGroup.rotation.z = THREE.MathUtils.lerp(this.rightArmGroup.rotation.z, 0.3, 0.15);

      // Torso lean forward slightly
      this.torsoGroup.rotation.x = THREE.MathUtils.lerp(this.torsoGroup.rotation.x, 0.18, 0.15);
      this.torsoGroup.position.y = 0.95;
    } else if (isMoving) {
      // LOCOMOTION ANIMATION (Walk / Run)
      this.jumpProgress = 0;
      const freq = isSprinting ? 12 : 8;
      const stride = isSprinting ? 0.75 : 0.45;
      const armSwing = isSprinting ? 0.7 : 0.4;
      const cycle = Math.sin(this.animTime * freq);
      const cosCycle = Math.cos(this.animTime * freq);

      // Legs swing back and forth
      this.leftLegGroup.rotation.x = cycle * stride;
      this.rightLegGroup.rotation.x = -cycle * stride;

      // Knee bend when foot kicks back
      this.leftShinGroup.rotation.x = Math.max(0, -cycle * stride * 1.4);
      this.rightShinGroup.rotation.x = Math.max(0, cycle * stride * 1.4);

      // Arms counter-swing opposite to legs
      this.leftArmGroup.rotation.x = -cycle * armSwing;
      this.rightArmGroup.rotation.x = cycle * armSwing;
      this.leftArmGroup.rotation.z = -0.1 + Math.abs(cycle) * 0.05;
      this.rightArmGroup.rotation.z = 0.1 - Math.abs(cycle) * 0.05;

      // Elbows bent slightly
      this.leftForearm.rotation.x = -0.3 + (isSprinting ? -0.4 : -0.2);
      this.rightForearm.rotation.x = -0.3 + (isSprinting ? -0.4 : -0.2);

      // Torso bobbing (2 steps per walk cycle = sin(2 * t))
      const bob = Math.abs(Math.sin(this.animTime * freq)) * (isSprinting ? 0.06 : 0.035);
      this.torsoGroup.position.y = 0.95 - bob;

      // Dynamic forward lean based on sprint
      const forwardLean = isSprinting ? 0.22 : 0.08;
      this.torsoGroup.rotation.x = forwardLean;

      // Slight hip roll / shoulder counter-twist
      this.torsoGroup.rotation.y = -cycle * 0.12;

      // Katana scabbard bounce with running cadence
      this.scabbardGroup.rotation.x = 0.35 + Math.sin(this.animTime * freq) * 0.1;

      // Skirt plates flare slightly with leg motion
      this.skirtPlates.forEach((plate, idx) => {
        plate.rotation.x = 0.2 + Math.sin(this.animTime * freq + idx) * 0.08;
      });
    } else {
      // IDLE ANIMATION (Tranquil warrior breathing)
      this.jumpProgress = 0;
      const breath = Math.sin(this.animTime * 2);

      // Subtle breathing expansion on torso & shoulders
      this.torsoGroup.position.y = 0.95 + breath * 0.012;
      this.torsoGroup.rotation.x = THREE.MathUtils.lerp(this.torsoGroup.rotation.x, 0, 0.1);
      this.torsoGroup.rotation.y = THREE.MathUtils.lerp(this.torsoGroup.rotation.y, 0, 0.1);

      // Relaxed arms at sides with subtle breathing sway
      this.leftArmGroup.rotation.x = THREE.MathUtils.lerp(this.leftArmGroup.rotation.x, 0.05 + breath * 0.02, 0.1);
      this.rightArmGroup.rotation.x = THREE.MathUtils.lerp(this.rightArmGroup.rotation.x, 0.05 + breath * 0.02, 0.1);
      this.leftArmGroup.rotation.z = THREE.MathUtils.lerp(this.leftArmGroup.rotation.z, -0.08, 0.1);
      this.rightArmGroup.rotation.z = THREE.MathUtils.lerp(this.rightArmGroup.rotation.z, 0.08, 0.1);

      this.leftForearm.rotation.x = THREE.MathUtils.lerp(this.leftForearm.rotation.x, -0.15, 0.1);
      this.rightForearm.rotation.x = THREE.MathUtils.lerp(this.rightForearm.rotation.x, -0.15, 0.1);

      // Relaxed upright legs
      this.leftLegGroup.rotation.x = THREE.MathUtils.lerp(this.leftLegGroup.rotation.x, 0, 0.1);
      this.rightLegGroup.rotation.x = THREE.MathUtils.lerp(this.rightLegGroup.rotation.x, 0, 0.1);
      this.leftShinGroup.rotation.x = THREE.MathUtils.lerp(this.leftShinGroup.rotation.x, 0, 0.1);
      this.rightShinGroup.rotation.x = THREE.MathUtils.lerp(this.rightShinGroup.rotation.x, 0, 0.1);

      // Head gentle survey
      this.headGroup.rotation.y = Math.sin(this.animTime * 0.8) * 0.05;
      this.headGroup.rotation.x = Math.cos(this.animTime * 0.7) * 0.02;

      // Scabbard resting
      this.scabbardGroup.rotation.x = 0.35 + breath * 0.02;
    }
  }
}
