import * as THREE from 'three';

interface LanternInstanceData {
  baseX: number;
  baseZ: number;
  y: number;
  startY: number;
  maxY: number;
  riseSpeed: number;
  driftSpeedX: number;
  swaySpeed: number;
  swayAmp: number;
  phase: number;
  rotationY: number;
  rotSpeed: number;
  scale: number;
  delay: number;
  isAlive: boolean;
}

export class LanternField {
  public group: THREE.Group;

  // Three instanced meshes: body shell + inner fire + outer glow halo
  private bodyMesh: THREE.InstancedMesh;
  private fireMesh: THREE.InstancedMesh;
  private glowMesh: THREE.InstancedMesh;

  private count: number = 140;
  private dummy: THREE.Object3D = new THREE.Object3D();
  private fireDummy: THREE.Object3D = new THREE.Object3D();
  private lanterns: LanternInstanceData[] = [];
  public isActivated: boolean = false;
  private ambientAuraLight: THREE.PointLight;
  private glowLights: THREE.PointLight[] = [];

  // Half-height of the body geometry (profile spans -BODY_H to +BODY_H)
  private readonly BODY_H = 0.44;

  constructor() {
    this.group = new THREE.Group();

    // ── 1. Lantern body: rectangular / cylindrical paper lantern silhouette ──
    // User requested: "make the red part of the lantern a bit rectangle than oval"
    // Straight vertical rectangular walls, flat bottom opening, rounded shoulder bevel:
    const profile: THREE.Vector2[] = [
      new THREE.Vector2(0.16, -0.44), // bottom opening rim
      new THREE.Vector2(0.24, -0.42), // bottom corner curve
      new THREE.Vector2(0.26, -0.34), // straight vertical rectangular wall begins
      new THREE.Vector2(0.26,  0.00), // straight vertical wall middle
      new THREE.Vector2(0.26, +0.34), // straight vertical wall top
      new THREE.Vector2(0.23, +0.40), // upper corner shoulder
      new THREE.Vector2(0.12, +0.43), // flat top bevel
      new THREE.Vector2(0.01, +0.44), // top center
    ];

    const lanternBodyGeo = new THREE.LatheGeometry(profile, 14);

    // Deep vermilion-red — traditional Japanese washi paper colour
    const bodyMat = new THREE.MeshBasicMaterial({ color: 0xee2c00 });

    this.bodyMesh = new THREE.InstancedMesh(lanternBodyGeo, bodyMat, this.count);
    this.bodyMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.bodyMesh.castShadow = false;
    this.bodyMesh.receiveShadow = false;
    this.bodyMesh.frustumCulled = false;
    this.bodyMesh.geometry.boundingSphere = new THREE.Sphere(
      new THREE.Vector3(0, 20, 0),
      140
    );
    this.group.add(this.bodyMesh);

    // ── 2. Inner fire core — tucked inside the lower chamber of the lantern ───
    const fireCoreGeo = new THREE.SphereGeometry(0.07, 8, 8);
    const fireCoreMat = new THREE.MeshBasicMaterial({ color: 0xfff0aa }); // brilliant burning flame

    this.fireMesh = new THREE.InstancedMesh(fireCoreGeo, fireCoreMat, this.count);
    this.fireMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.fireMesh.frustumCulled = false;
    this.fireMesh.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 20, 0), 140);
    this.group.add(this.fireMesh);

    // ── 3. Additive-blend inner glow halo — illuminates lantern from within ───
    const glowGeo = new THREE.SphereGeometry(0.18, 8, 8);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xff9900,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.glowMesh = new THREE.InstancedMesh(glowGeo, glowMat, this.count);
    this.glowMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.glowMesh.frustumCulled = false;
    this.glowMesh.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 20, 0), 140);
    this.group.add(this.glowMesh);

    // ── 4. Scene-level warm festival ambient lighting ────────────────────────
    this.ambientAuraLight = new THREE.PointLight(0xff8c00, 0, 50, 1.2);
    this.ambientAuraLight.position.set(0, 8.0, 0);
    this.group.add(this.ambientAuraLight);

    [-20, -7, 7, 20].forEach((xPos) => {
      const pl = new THREE.PointLight(0xff7700, 0, 24, 1.5);
      pl.position.set(xPos, 4.0, 0);
      this.glowLights.push(pl);
      this.group.add(pl);
    });

    this.initLanternData();
    this.hideAll();
  }

  /** Initially hide all instances until activation */
  private hideAll() {
    this.dummy.position.set(0, -500, 0);
    this.dummy.scale.set(0.001, 0.001, 0.001);
    this.dummy.updateMatrix();
    for (let i = 0; i < this.count; i++) {
      this.bodyMesh.setMatrixAt(i, this.dummy.matrix);
      this.fireMesh.setMatrixAt(i, this.dummy.matrix);
      this.glowMesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.bodyMesh.instanceMatrix.needsUpdate = true;
    this.fireMesh.instanceMatrix.needsUpdate = true;
    this.glowMesh.instanceMatrix.needsUpdate = true;
  }

  private initLanternData() {
    this.lanterns = [];

    for (let i = 0; i < this.count; i++) {
      let riverX: number;
      let riverZ: number;

      if (i % 3 === 0) {
        // West river panorama
        riverX = -3.8 - Math.random() * 28.0;
        riverZ = (Math.random() - 0.5) * 14.0;
      } else if (i % 3 === 1) {
        // East river panorama (toward pagoda)
        riverX = 3.8 + Math.random() * 28.0;
        riverZ = (Math.random() - 0.5) * 14.0;
      } else {
        // Upstream / downstream sweeps
        riverX = (Math.random() - 0.5) * 38.0;
        riverZ = Math.sign(Math.random() - 0.5) * (8.5 + Math.random() * 10.0);
      }

      const startY = 0.5 + Math.random() * 0.4;
      const maxY = 22.0 + Math.random() * 12.0;

      // First 40 appear immediately, already spread across eye-level heights
      const isImmediate = i < 40;
      const initialY = isImmediate ? 1.5 + Math.random() * 8.0 : startY;
      const delay = isImmediate ? 0 : Math.random() * 14.0;

      this.lanterns.push({
        baseX: riverX,
        baseZ: riverZ,
        y: initialY,
        startY,
        maxY,
        riseSpeed: 0.80 + Math.random() * 0.70,
        driftSpeedX: 0.12 + Math.random() * 0.22,
        swaySpeed: 0.70 + Math.random() * 0.80,
        swayAmp: 0.30 + Math.random() * 0.50,
        phase: Math.random() * Math.PI * 2,
        rotationY: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.30,
        scale: 1.1 + Math.random() * 0.9,
        delay,
        isAlive: isImmediate,
      });
    }
  }

  /** Trigger the continuous 100+ lantern release upon successful registration */
  public activate() {
    this.isActivated = true;
  }

  public update(delta: number) {
    if (!this.isActivated) return;

    const time = performance.now() * 0.001;

    // Gradually swell the ambient festival glow
    if (this.ambientAuraLight.intensity < 3.5) {
      this.ambientAuraLight.intensity += delta * 0.9;
    }
    this.glowLights.forEach((lt) => {
      if (lt.intensity < 2.6) lt.intensity += delta * 0.6;
    });

    for (let i = 0; i < this.count; i++) {
      const l = this.lanterns[i];

      // Still in delay — keep hidden below scene
      if (l.delay > 0) {
        l.delay -= delta;
        this.dummy.position.set(l.baseX, -500, l.baseZ);
        this.dummy.scale.set(0.001, 0.001, 0.001);
        this.dummy.updateMatrix();
        this.bodyMesh.setMatrixAt(i, this.dummy.matrix);
        this.fireMesh.setMatrixAt(i, this.dummy.matrix);
        this.glowMesh.setMatrixAt(i, this.dummy.matrix);
        continue;
      }

      l.isAlive = true;

      // Rise and gentle eastward breeze drift
      l.y += l.riseSpeed * delta;
      l.baseX += l.driftSpeedX * delta;
      l.rotationY += l.rotSpeed * delta;

      // Sinusoidal sway from wind
      const sway = Math.sin(time * l.swaySpeed + l.phase) * l.swayAmp;
      const posX = l.baseX + sway;
      const posY = l.y;
      const posZ = l.baseZ + Math.cos(time * (l.swaySpeed * 0.8) + l.phase) * (l.swayAmp * 0.6);

      // Scale fades in near surface, fades out at high altitude
      const progress = (posY - l.startY) / (l.maxY - l.startY);
      let scaleMult = 1.0;
      if (progress < 0.04) {
        scaleMult = Math.max(0.01, progress / 0.04);
      } else if (progress > 0.82) {
        scaleMult = Math.max(0.01, 1.0 - (progress - 0.82) / 0.18);
      }

      const s = l.scale * scaleMult;

      // Subtle pendulum tilt (lanterns sway in the breeze)
      const tiltX = 0.07 * Math.sin(time * 1.5 + i);
      const tiltZ = 0.07 * Math.cos(time * 1.2 + i);

      // ── Body: centred at posY ──────────────────────────────────────────
      this.dummy.position.set(posX, posY, posZ);
      this.dummy.scale.set(s, s, s);
      this.dummy.rotation.set(tiltX, l.rotationY, tiltZ);
      this.dummy.updateMatrix();
      this.bodyMesh.setMatrixAt(i, this.dummy.matrix);

      // ── Fire core + glow halo: tucked inside the lower chamber of the lantern ──
      // Positioned just inside the bottom opening (at ~70% of BODY_H below center),
      // so the glow radiates from inside the translucent paper lantern.
      const fireY = posY - (this.BODY_H * 0.72) * s;

      this.fireDummy.position.set(posX, fireY, posZ);
      this.fireDummy.scale.set(s, s, s);
      this.fireDummy.rotation.set(0, 0, 0);
      this.fireDummy.updateMatrix();
      this.fireMesh.setMatrixAt(i, this.fireDummy.matrix);
      this.glowMesh.setMatrixAt(i, this.fireDummy.matrix); // same position inside base

      // Respawn when the lantern floats out of the visible sky
      if (posY >= l.maxY) {
        l.y = l.startY;
        l.baseX = i % 2 === 0
          ? -3.8 - Math.random() * 28.0
          : 3.8 + Math.random() * 28.0;
        l.baseZ = (Math.random() - 0.5) * 14.0;
        l.phase = Math.random() * Math.PI * 2;
        l.delay = Math.random() * 2.5;
      }
    }

    this.bodyMesh.instanceMatrix.needsUpdate = true;
    this.fireMesh.instanceMatrix.needsUpdate = true;
    this.glowMesh.instanceMatrix.needsUpdate = true;
  }
}
