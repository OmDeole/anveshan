export interface InputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  sprint: boolean;
  jump: boolean;
  // Normalized 2D vector for movement: x = -1..1 (left/right), y = -1..1 (down/up)
  moveVector: { x: number; y: number };
}

export type AnimationAction = 'idle' | 'walk' | 'run' | 'jump' | 'land';

export interface CameraSettings {
  distance: number;
  height: number;
  pitch: number; // in radians
  yaw: number;   // in radians
  lerpSpeed: number;
}

export type SanctuaryEventId = 'tech-treasure-hunt' | 'promptify' | 'logic-lamps';

export type TrainId = 'om' | 'arya' | 'sandip';

export interface TrainData {
  id: TrainId;
  nameJapanese: string;        // strictly Japanese: "オム" | "アーリア" | "サンディープ"
  destinationEnglish: string;  // "To The Killer's Trail" | "To Promptify" | "To Logic Lamps"
  destinationJapanese: string; // "殺人鬼の足跡行" | "プロンプティファイ行" | "論理灯行"
  colorHex: string;
  position: { x: number; y: number; z: number };
  doorPosition: { x: number; y: number; z: number };
}

export interface SanctuaryEventData {
  id: SanctuaryEventId;
  name: string;
  kanji: string;
  tagline: string;
  position: { x: number; y: number; z: number };
  color: number;
  colorHex: string;
}

export interface WaypointIndicatorData {
  id: SanctuaryEventId;
  name: string;
  kanji: string;
  tagline: string;
  colorHex: string;
  distance: number;
  relativeAngleDeg: number;
  isNearby: boolean;
}

export type WorldEnvironmentType = 'mountain-station' | 'temple' | 'promptify';


