import React, { useEffect, useState } from 'react';
import { RotateCcw, Volume2, VolumeX, Maximize2 } from 'lucide-react';
import { soundController } from '../game/SoundController';

interface GameHUDProps {
  onResetCamera: () => void;
  isSprinting: boolean;
}

export const GameHUD: React.FC<GameHUDProps> = ({ onResetCamera }) => {
  const [isSoundActive, setIsSoundActive] = useState<boolean>(soundController.isSoundActive());

  useEffect(() => {
    const unsubscribe = soundController.subscribe(() => {
      setIsSoundActive(soundController.isSoundActive());
    });
    return unsubscribe;
  }, []);

  const handleToggleSound = () => {
    soundController.toggleSound();
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-4 sm:p-6 z-20">
      {/* Top Header View Controls */}
      <div className="flex items-start justify-end w-full">
        {/* Action buttons (Recenter Camera, Mute, Fullscreen) */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            id="recenter-camera-button"
            type="button"
            onClick={onResetCamera}
            title="Recenter Camera Behind Samurai"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl backdrop-blur-md bg-stone-900/60 hover:bg-stone-800/80 border border-white/10 hover:border-white/30 text-white/90 text-xs transition-colors shadow-lg active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Recenter View</span>
          </button>

          <button
            id="ambient-audio-button"
            type="button"
            onClick={handleToggleSound}
            title={isSoundActive ? 'Mute Background Soundtrack' : 'Play Background Soundtrack'}
            className="p-2 rounded-xl backdrop-blur-md bg-stone-900/60 hover:bg-stone-800/80 border border-white/10 hover:border-white/30 text-white/90 transition-colors shadow-lg active:scale-95"
          >
            {isSoundActive ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-stone-400" />
            )}
          </button>

          <button
            id="fullscreen-button"
            type="button"
            onClick={toggleFullscreen}
            title="Toggle Fullscreen"
            className="p-2 rounded-xl backdrop-blur-md bg-stone-900/60 hover:bg-stone-800/80 border border-white/10 hover:border-white/30 text-white/90 transition-colors shadow-lg active:scale-95"
          >
            <Maximize2 className="w-4 h-4 text-stone-300" />
          </button>
        </div>
      </div>

      {/* Bottom spacer for VirtualJoystick */}
      <div className="h-20" />
    </div>
  );
};
