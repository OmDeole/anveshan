/**
 * Procedural 3D Explosion Pattern Generators for Fireworks
 * Pure Three.js mathematical distributions (Spherical, Ring, Double Ring, Star,
 * Golden Shower, Heart Burst, Spiral, Chrysanthemum, Multi-Stage, Custom).
 */

export type ExplosionPatternType =
  | 'spherical'
  | 'ring'
  | 'double-ring'
  | 'star'
  | 'golden-shower'
  | 'heart'
  | 'spiral'
  | 'chrysanthemum'
  | 'multi-stage'
  | 'custom';

export interface PatternParticleResult {
  vx: number;
  vy: number;
  vz: number;
  gravity: number;
  drag: number;
  maxLife: number;
  sparkle?: boolean;
  colorOverride?: { r: number; g: number; b: number };
  isSecondarySeed?: boolean;
}

export class ExplosionPatterns {
  public static readonly ALL_PATTERNS: ExplosionPatternType[] = [
    'spherical',
    'ring',
    'double-ring',
    'star',
    'golden-shower',
    'heart',
    'spiral',
    'chrysanthemum',
    'multi-stage',
    'custom',
  ];

  public static getRandomPattern(): ExplosionPatternType {
    const idx = Math.floor(Math.random() * this.ALL_PATTERNS.length);
    return this.ALL_PATTERNS[idx];
  }

  /**
   * Generates initial particle kinematics for a given pattern
   */
  public static generateParticle(
    pattern: ExplosionPatternType,
    index: number,
    totalCount: number,
    sizeFactor: number,
    primaryColor: { r: number; g: number; b: number },
    secondaryColor: { r: number; g: number; b: number }
  ): PatternParticleResult {
    switch (pattern) {
      // 1. SPHERICAL BURST
      case 'spherical': {
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        const spd = (7.5 + Math.random() * 12.0) * sizeFactor;
        return {
          vx: spd * Math.sin(phi) * Math.cos(theta),
          vy: spd * Math.cos(phi),
          vz: spd * Math.sin(phi) * Math.sin(theta),
          gravity: -6.5,
          drag: 0.955,
          maxLife: 1.6 + Math.random() * 0.6,
        };
      }

      // 2. RING BURST
      case 'ring': {
        const angle = Math.random() * Math.PI * 2;
        const spd = (10.0 + Math.random() * 3.5) * sizeFactor;
        return {
          vx: Math.cos(angle) * spd,
          vy: (Math.random() - 0.5) * 1.5,
          vz: Math.sin(angle) * spd,
          gravity: -4.8,
          drag: 0.96,
          maxLife: 1.6,
        };
      }

      // 3. DOUBLE RING
      case 'double-ring': {
        const isOuter = Math.random() > 0.45;
        const angle = Math.random() * Math.PI * 2;
        const spd = (isOuter ? 12.0 + Math.random() * 2.0 : 7.0 + Math.random() * 2.0) * sizeFactor;
        return {
          vx: Math.cos(angle) * spd,
          vy: (Math.random() - 0.5) * 2.0,
          vz: Math.sin(angle) * spd,
          gravity: -5.0,
          drag: 0.958,
          maxLife: 1.7,
          colorOverride: isOuter ? undefined : secondaryColor,
        };
      }

      // 4. STAR BURST (5-pointed star geometry)
      case 'star': {
        const points = 5;
        const arm = Math.floor(Math.random() * points);
        const base = (arm * Math.PI * 2) / points;
        const jitter = (Math.random() - 0.5) * 0.22;
        const angle = base + jitter;
        const spd = (9.0 + Math.random() * 10.0) * sizeFactor;
        return {
          vx: Math.cos(angle) * spd,
          vy: (Math.random() - 0.5) * 3.0,
          vz: Math.sin(angle) * spd,
          gravity: -5.2,
          drag: 0.96,
          maxLife: 1.65,
        };
      }

      // 5. GOLDEN SHOWER (Weeping willow effect)
      case 'golden-shower': {
        const theta = Math.random() * Math.PI * 2;
        const spd = (4.5 + Math.random() * 8.0) * sizeFactor;
        return {
          vx: Math.sin(theta) * spd,
          vy: (Math.random() * 0.7 + 0.3) * spd,
          vz: Math.cos(theta) * spd,
          gravity: -2.8,
          drag: 0.942, // High drag causes weeping tendrils
          maxLife: 2.5 + Math.random() * 0.8,
          colorOverride: { r: 1.0, g: 0.84, b: 0.2 }, // Imperial Gold
          sparkle: true,
        };
      }

      // 6. HEART BURST (Parametric 3D Heart: x = 16 sin^3 t, y = 13 cos t - 5 cos 2t - 2 cos 3t - cos 4t)
      case 'heart': {
        const t = Math.random() * Math.PI * 2;
        const hx = 16 * Math.pow(Math.sin(t), 3);
        const hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
        const depth = (Math.random() - 0.5) * 4.0;
        const scale = 0.72 * sizeFactor * (0.85 + Math.random() * 0.3);
        return {
          vx: hx * scale,
          vy: hy * scale,
          vz: depth * scale,
          gravity: -3.8,
          drag: 0.955,
          maxLife: 1.85,
          colorOverride: Math.random() > 0.3 ? { r: 1.0, g: 0.15, b: 0.45 } : { r: 1.0, g: 0.75, b: 0.85 },
          sparkle: true,
        };
      }

      // 7. SPIRAL BURST (Dual spiral arms)
      case 'spiral': {
        const arm = Math.random() > 0.5 ? 0 : Math.PI;
        const tAngle = Math.random() * Math.PI * 4;
        const spd = (3.5 + tAngle * 1.8) * sizeFactor;
        return {
          vx: Math.cos(tAngle + arm) * spd,
          vy: (Math.random() - 0.5) * 2.5 + Math.sin(tAngle) * 2.2,
          vz: Math.sin(tAngle + arm) * spd,
          gravity: -5.0,
          drag: 0.96,
          maxLife: 1.7,
        };
      }

      // 8. CHRYSANTHEMUM (Expanding sphere with sparkling persistent embers)
      case 'chrysanthemum': {
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        const spd = (9.5 + Math.random() * 14.5) * sizeFactor;
        return {
          vx: spd * Math.sin(phi) * Math.cos(theta),
          vy: spd * Math.cos(phi),
          vz: spd * Math.sin(phi) * Math.sin(theta),
          gravity: -6.0,
          drag: 0.962,
          maxLife: 2.2 + Math.random() * 0.7,
          sparkle: true,
        };
      }

      // 9. MULTI-STAGE (Outer fragment shells trigger delayed secondary explosions)
      case 'multi-stage': {
        const layer = Math.random();
        let shellSpeed = 5.0;
        let isSeed = false;
        let colorOverride = undefined;

        if (layer > 0.75) {
          // Outermost sparks - candidates for secondary burst
          shellSpeed = 14.0;
          isSeed = Math.random() < 0.12; // 12% of outer shell become secondary burst centers
          colorOverride = secondaryColor;
        } else if (layer > 0.35) {
          shellSpeed = 9.0;
        } else {
          shellSpeed = 4.2;
          colorOverride = { r: 1.0, g: 1.0, b: 1.0 }; // White center core
        }

        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        const spd = (shellSpeed + Math.random() * 2.0) * sizeFactor;
        return {
          vx: spd * Math.sin(phi) * Math.cos(theta),
          vy: spd * Math.cos(phi),
          vz: spd * Math.sin(phi) * Math.sin(theta),
          gravity: -5.6,
          drag: 0.957,
          maxLife: 1.8,
          colorOverride,
          isSecondarySeed: isSeed,
        };
      }

      // 10. RANDOM CUSTOM BURST (Asymmetrical chaotic multi-color burst)
      case 'custom':
      default: {
        const phi = Math.random() * Math.PI;
        const theta = Math.random() * Math.PI * 2;
        // Asymmetrical ellipsoidal deformation
        const spdX = (7.0 + Math.random() * 12.0) * 1.3 * sizeFactor;
        const spdY = (6.0 + Math.random() * 11.0) * 0.9 * sizeFactor;
        const spdZ = (7.0 + Math.random() * 12.0) * 1.1 * sizeFactor;
        const useSec = Math.random() > 0.5;
        return {
          vx: spdX * Math.sin(phi) * Math.cos(theta),
          vy: spdY * Math.cos(phi),
          vz: spdZ * Math.sin(phi) * Math.sin(theta),
          gravity: -5.4,
          drag: 0.958,
          maxLife: 1.75 + Math.random() * 0.5,
          colorOverride: useSec ? secondaryColor : undefined,
          sparkle: Math.random() > 0.6,
        };
      }
    }
  }
}
