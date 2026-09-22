import * as THREE from 'three';
import { SanctuaryEventData } from '../../types';

export const LOGIC_LAMPS_CONFIG = {
  eventId: 'logic-lamps' as const,
  name: 'Logic Lamps',
  kanji: '論理灯',
  tagline: 'River Bridge & Sacred Night Village',
  // Green checkpoint matching Logic Lamps train color
  checkpointColor: 0x10b981,
  checkpointColorHex: '#10b981',
  
  // Registration checkpoint placed directly on the bridge
  checkpointPosition: { x: 0.0, y: 1.8, z: 0.0 },
  
  // Spawn position facing the bridge and village
  spawnPosition: { x: 0.0, y: 1.8, z: -16.0 },
  
  // Village spatial boundaries
  bounds: {
    minX: -36.0,
    maxX: 36.0,
    minZ: -28.0,
    maxZ: 28.0,
  },
  
  // Return-to-station departure gate
  stationGatePosition: { x: 0.0, y: 1.8, z: -22.0 },
  
  // River area
  river: {
    minX: -40.0,
    maxX: 40.0,
    minZ: -6.0,
    maxZ: 6.0,
    waterLevel: 0.35,
  },
  
  // Bridge geometry
  bridge: {
    startX: -3.0,
    endX: 3.0,
    startZ: -8.0,
    endZ: 8.0,
    archPeakY: 1.85,
    deckWidth: 4.8,
  }
};

export const LOGIC_LAMPS_SANCTUARY_DATA: SanctuaryEventData = {
  id: 'logic-lamps',
  name: LOGIC_LAMPS_CONFIG.name,
  kanji: LOGIC_LAMPS_CONFIG.kanji,
  tagline: LOGIC_LAMPS_CONFIG.tagline,
  position: LOGIC_LAMPS_CONFIG.checkpointPosition,
  color: LOGIC_LAMPS_CONFIG.checkpointColor,
  colorHex: LOGIC_LAMPS_CONFIG.checkpointColorHex,
};
