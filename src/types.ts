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
