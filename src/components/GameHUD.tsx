import React, { useEffect, useState } from 'react';
import { RotateCcw, Volume2, VolumeX, Maximize2, TrainTrack } from 'lucide-react';
import { soundController } from '../game/SoundController';

interface GameHUDProps {
  onResetCamera: () => void;
  isSprinting: boolean;
  onGoToTrainStation?: () => void;
  currentPhase?: 'mountain-station' | 'temple' | 'logic-lamps';
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
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between pt-[max(0.75rem,env(safe-area-inset-top))] px-[max(0.75rem,env(safe-area-inset-left))] pb-3 sm:p-6 z-20">
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
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl backdrop-blur-md bg-stone-900/80 hover:bg-stone-800/95 border border-amber-500/40 hover:border-amber-400 text-white text-[11px] sm:text-xs font-medium tracking-wide transition-all shadow-xl shadow-black/50 active:scale-95 group"
            >
              <TrainTrack className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="font-serif font-bold text-amber-300">富士見高原駅</span>
              <span className="hidden md:inline text-stone-200">
                {currentPhase !== 'mountain-station' ? 'Return to Train Station' : 'Station Platforms'}
              </span>
              <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded bg-amber-400/15 text-amber-300 font-mono hidden sm:inline-block border border-amber-400/30">
                {currentPhase !== 'mountain-station' ? 'Board Trains' : '3 Trains'}
              </span>
            </button>
          )}
        </div>

        {/* Right: Column layout — small icon controls on top, bigger Quick Register below */}
        <div className="pointer-events-auto flex flex-col items-end gap-2.5">

          {/* Row 1: Recenter, Mute, Fullscreen icon buttons */}
          <div className="flex items-center gap-2">
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

          {/* Row 2: Quick Register — bigger, vermilion, opens landing.html in new tab */}
          <style>{`
            @keyframes hudRegisterPulse {
              0%, 100% { box-shadow: 0 4px 20px rgba(220,38,38,0.55), 0 0 14px rgba(252,211,77,0.3); }
              50%       { box-shadow: 0 7px 32px rgba(220,38,38,0.88), 0 0 26px rgba(252,211,77,0.65); }
            }
          `}</style>
          <a
            id="quick-register-button"
            href="/landing.html"
            target="_blank"
            rel="noopener noreferrer"
            title="Register for ANVESHAN 3.0 Events"
            style={{ animation: 'hudRegisterPulse 2.8s ease-in-out infinite' }}
            className="flex items-center gap-1.5 sm:gap-2.5 px-3 sm:px-5 py-1.5 sm:py-3 rounded-xl
              bg-gradient-to-r from-red-600 via-rose-600 to-red-700
              hover:from-red-500 hover:via-rose-500 hover:to-red-600
              border border-amber-400/60 hover:border-amber-300
              text-white text-xs sm:text-sm font-bold tracking-wider sm:tracking-widest uppercase
              transition-all active:scale-95 group shadow-lg"
          >
            {/* Pulsing live beacon */}
            <span
              className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-amber-300 shrink-0"
              style={{ boxShadow: '0 0 8px 3px rgba(252,211,77,0.9)' }}
            />
            <span>Quick Register</span>
            <span className="text-sm sm:text-base leading-none group-hover:translate-x-0.5 transition-transform">⛩️</span>
          </a>

        </div>
      </div>

      {/* Bottom spacer for VirtualJoystick */}
      <div className="h-20" />
    </div>
  );
};
