import React, { useState } from 'react';
import { RotateCcw, Volume2, VolumeX, Maximize2 } from 'lucide-react';

interface GameHUDProps {
  onResetCamera: () => void;
  isSprinting: boolean;
}

export const GameHUD: React.FC<GameHUDProps> = ({ onResetCamera, isSprinting }) => {
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);

  // Procedural tranquil ambient sound (gentle wind breeze and occasional distant temple chime)
  const toggleAudio = () => {
    if (!audioEnabled) {
      try {
        const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        
        // Gentle white/pink noise wind filter
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 320;

        const gain = ctx.createGain();
        gain.gain.value = 0.05;

        whiteNoise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        whiteNoise.start();

        // Occasional gentle temple chime
        const playChime = () => {
          if (ctx.state === 'suspended') return;
          const osc = ctx.createOscillator();
          const chimeGain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
          chimeGain.gain.setValueAtTime(0.06, ctx.currentTime);
          chimeGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 3.5);
          osc.connect(chimeGain);
          chimeGain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 3.6);
        };

        const interval = window.setInterval(playChime, 8000);
        playChime();

        setAudioCtx(ctx);
        setAudioEnabled(true);
      } catch (err) {
        console.warn('Audio setup error:', err);
      }
    } else {
      if (audioCtx) {
        audioCtx.close();
        setAudioCtx(null);
      }
      setAudioEnabled(false);
    }
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
      {/* Top Header Watermark & View Controls */}
      <div className="flex items-start justify-between w-full">
        {/* Scenic Location Card */}
        <div className="flex items-center gap-3 backdrop-blur-md bg-stone-900/60 border border-white/10 px-4 py-2.5 rounded-2xl shadow-lg">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-medium text-sm sm:text-base tracking-wide">
                Chureito Overlook
              </span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                富士見台
              </span>
            </div>
            <div className="text-[11px] text-stone-300/70 tracking-wider">
              Mount Fuji Sanctuary • Third Person View
            </div>
          </div>
        </div>

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
            onClick={toggleAudio}
            title={audioEnabled ? 'Mute Ambient Wind' : 'Play Ambient Wind & Chime'}
            className="p-2 rounded-xl backdrop-blur-md bg-stone-900/60 hover:bg-stone-800/80 border border-white/10 hover:border-white/30 text-white/90 transition-colors shadow-lg active:scale-95"
          >
            {audioEnabled ? (
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
