import { SanctuaryEventData } from '../../types';

export const PROMPTIFY_EVENT_DATA: SanctuaryEventData = {
  id: 'promptify',
  name: 'Promptify',
  kanji: '詠唱',
  tagline: 'Traditional Night Market • Checkpoint',
  position: { x: 0.0, y: 0.7, z: 24.0 },
  color: 0xf59e0b, // Warm Amber/Yellow checkpoint matching the yellow event checkpoint
  colorHex: '#f59e0b',
};

export const PROMPTIFY_CONFIG = {
  // Samurai enters near the grand Torii gate facing down the market street (+Z)
  spawnPosition: { x: 0.0, y: 0.7, z: -26.0 },
  spawnFacingAngle: 0, // facing +Z into the market

  // Checkpoint located deep inside the market
  checkpointPosition: { x: 0.0, y: 0.7, z: 24.0 },

  // Portal to return back to Fujimi Mountain Station
  returnGatePosition: { x: 0.0, y: 0.7, z: -30.0 },

  // Market boundary dimensions for samurai navigation along central stone path
  walkableBounds: {
    minX: -4.2,
    maxX: 4.2,
    minZ: -31.5,
    maxZ: 28.5,
  },

  // Torii gate entrance
  toriiPosition: { x: 0.0, y: 0.7, z: -23.0 },

  // Ground elevation
  groundHeight: 0.7,
};
