import React, { useEffect, useState } from 'react';
import { RotateCcw, Volume2, VolumeX, Maximize2, TrainTrack, Users } from 'lucide-react';
import { soundController } from '../game/SoundController';

interface GameHUDProps {
  onResetCamera: () => void;
  isSprinting: boolean;
  onGoToTrainStation?: () => void;
  currentPhase?: 'mountain-station' | 'temple';
}

export const GameHUD: React.FC<GameHUDProps> = ({
  onResetCamera,
  onGoToTrainStation,
  currentPhase,
}) => {
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
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-3 sm:p-6 z-20">
      {/* Top Header View Controls */}
      <div className="flex items-start justify-between w-full">
        {/* Left: Quick Travel to Train Station Option */}
        <div className="pointer-events-auto flex items-center gap-2">
          {onGoToTrainStation && (
            <button
              id="go-to-station-hud-button"
              type="button"
              onClick={onGoToTrainStation}
              title="Go to Train Station to board other trains (オム, アーリア, サンディープ)"
              className="flex items-center gap-2 px-3 py-2 rounded-xl backdrop-blur-md bg-stone-900/80 hover:bg-stone-800/95 border border-amber-500/40 hover:border-amber-400 text-white text-xs font-medium tracking-wide transition-all shadow-xl shadow-black/50 active:scale-95 group"
            >
              <TrainTrack className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="font-serif font-bold text-amber-300">富士見高原駅</span>
              <span className="hidden md:inline text-stone-200">
                {currentPhase === 'temple' ? 'Return to Train Station' : 'Station Platforms'}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400/15 text-amber-300 font-mono hidden sm:inline-block border border-amber-400/30">
                {currentPhase === 'temple' ? 'Board Trains' : '3 Trains'}
              </span>
            </button>
          )}
        </div>

        {/* Right: Action buttons (Recenter Camera, Mute, Fullscreen, Team) */}
        <div className="pointer-events-auto flex items-center gap-2">
          <a
            id="team-coordinators-button"
            href="/team"
            title="View Team Coordinators"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl backdrop-blur-md bg-stone-900/70 hover:bg-stone-800/90 border border-pink-500/40 hover:border-pink-400 text-pink-200 hover:text-white text-xs font-medium transition-all shadow-lg active:scale-95 group cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-pink-400 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">Team</span>
          </a>

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
