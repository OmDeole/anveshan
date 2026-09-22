import * as THREE from 'three';
import { LOGIC_LAMPS_CONFIG } from './logicLampsConfig';

export class LogicLampsCheckpoint {
  public group: THREE.Group;
  public orb: THREE.Mesh;
  public glow: THREE.Mesh;
  public ring1: THREE.Mesh;
  public ring2: THREE.Mesh;
  public beam: THREE.Mesh;
  public corona: THREE.Mesh;
  public groundRune: THREE.Mesh;
  public innerRune: THREE.Mesh;
  public light: THREE.PointLight;
  public baseY: number;

  constructor(position = LOGIC_LAMPS_CONFIG.checkpointPosition) {
    this.group = new THREE.Group();
    this.group.position.set(position.x, position.y, position.z);
    this.baseY = position.y;

    const color = new THREE.Color(LOGIC_LAMPS_CONFIG.checkpointColor);

    // 1. Core Floating Orb (inner glowing sphere)
    const orbGeo = new THREE.SphereGeometry(0.18, 16, 16);
    const orbMat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.95,
    });
    this.orb = new THREE.Mesh(orbGeo, orbMat);
    this.orb.position.y = 1.6;
    this.group.add(this.orb);

    // Outer glow halo sphere (larger, semi-transparent)
    const glowGeo = new THREE.SphereGeometry(0.32, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
    });
    this.glow = new THREE.Mesh(glowGeo, glowMat);
    this.orb.add(this.glow);

    // 2. Orbital Ring 1 (tilted torus halo)
    const ring1Geo = new THREE.TorusGeometry(0.42, 0.018, 8, 32);
    const ring1Mat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    });
    this.ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    this.ring1.position.y = 1.6;
    this.ring1.rotation.x = Math.PI * 0.35;
    this.group.add(this.ring1);

    // 3. Orbital Ring 2 (perpendicular smaller torus)
    const ring2Geo = new THREE.TorusGeometry(0.34, 0.014, 8, 32);
    const ring2Mat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    });
    this.ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    this.ring2.position.y = 1.6;
    this.ring2.rotation.x = Math.PI * 0.6;
    this.ring2.rotation.z = Math.PI * 0.25;
    this.group.add(this.ring2);

    // 4. Vertical Celestial Light Beam (tall glowing pillar reaching high into the sky)
    const beamGeo = new THREE.CylinderGeometry(0.12, 0.28, 26.0, 16, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.38,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.beam = new THREE.Mesh(beamGeo, beamMat);
    this.beam.position.y = 13.0;
    this.group.add(this.beam);

    // Outer ethereal corona for the beam
    const coronaGeo = new THREE.CylinderGeometry(0.35, 1.1, 26.0, 16, 1, true);
    const coronaMat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.15,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.corona = new THREE.Mesh(coronaGeo, coronaMat);
    this.corona.position.y = 13.0;
    this.group.add(this.corona);

    // 5. Ground Rune Circle (flat sigil ring on deck)
    const runeGeo = new THREE.RingGeometry(0.6, 0.75, 32);
    const runeMat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.groundRune = new THREE.Mesh(runeGeo, runeMat);
    this.groundRune.rotation.x = -Math.PI / 2;
    this.groundRune.position.y = 0.04;
    this.group.add(this.groundRune);

    // Inner rune ring
    const innerRuneGeo = new THREE.RingGeometry(0.3, 0.38, 32);
    const innerRuneMat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.innerRune = new THREE.Mesh(innerRuneGeo, innerRuneMat);
    this.innerRune.rotation.x = -Math.PI / 2;
    this.innerRune.position.y = 0.05;
    this.group.add(this.innerRune);

    // 6. Colored Point Light for atmospheric glow
    this.light = new THREE.PointLight(LOGIC_LAMPS_CONFIG.checkpointColor, 2.0, 6.5, 1.5);
    this.light.position.y = 1.6;
    this.group.add(this.light);
  }

  public update(delta: number) {
    const time = performance.now() * 0.002;

    // Hover core orb gently
    this.orb.position.y = 1.6 + Math.sin(time * 2.2) * 0.08;

    // Rotate orbital rings
    this.ring1.rotation.y += delta * 1.2;
    this.ring1.rotation.x = Math.PI * 0.35 + Math.sin(time * 1.5) * 0.15;

    this.ring2.rotation.y -= delta * 1.5;
    this.ring2.rotation.z = Math.PI * 0.25 + Math.cos(time * 1.3) * 0.12;

    // Soft beam shimmer pulse
    const beamPulse = 0.32 + Math.sin(time * 3.0) * 0.08;
    (this.beam.material as THREE.MeshBasicMaterial).opacity = beamPulse;
    (this.corona.material as THREE.MeshBasicMaterial).opacity = beamPulse * 0.45;

    // Pulse light
    this.light.intensity = 1.8 + Math.sin(time * 4.0) * 0.4;
  }
}
