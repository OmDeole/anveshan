import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Sparkles, Volume2, VolumeX, Zap } from 'lucide-react';
import { FireworksEngine } from './FireworksEngine';

interface FireworksShowProps {
  onClose?: () => void;
  title?: string;
  closeButtonText?: string;
  autoGrandSalvo?: boolean;
}

/**
 * Self-Contained, Full-Screen, Highly Interactive 3D Fireworks Show
 * Built exclusively using pure Three.js procedural particles, lights, and physics.
 * Completely isolated from the main website and cleans up all WebGL/audio resources on unmount.
 */
export const FireworksShow: React.FC<FireworksShowProps> = ({
  onClose,
  title = '3D FIREWORKS BLASTING SHOW',
  closeButtonText = 'Main Website',
  autoGrandSalvo = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<FireworksEngine | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [blastCount, setBlastCount] = useState<number>(0);

  const triggerGrandSalvoInternal = (engine: FireworksEngine) => {
    setBlastCount((prev) => prev + 1);

    // Launch a spectacular 6-rocket grand salvo across the sky
    const offsets = [-22, -13, -4, 5, 14, 23];
    offsets.forEach((ox, idx) => {
      setTimeout(() => {
        engine.launchRocket(
          ox * 0.75,
          -22,
          (Math.random() - 0.5) * 8,
          ox,
          9 + Math.random() * 15,
          (Math.random() - 0.5) * 14,
          undefined,
          undefined,
          undefined,
          1.45,
          true
        );
      }, idx * 130);
    });
  };

  // Initialize and clean up dedicated FireworksEngine instance
  useEffect(() => {
    if (!containerRef.current) return;

    const engine = new FireworksEngine(containerRef.current);
    engineRef.current = engine;

    if (autoGrandSalvo) {
      const timer = setTimeout(() => {
        triggerGrandSalvoInternal(engine);
      }, 500);
      return () => {
        clearTimeout(timer);
        engine.dispose();
        engineRef.current = null;
      };
    }

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, [autoGrandSalvo]);

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!engineRef.current) return;
    const next = !isMuted;
    setIsMuted(next);
    engineRef.current.audio.setMuted(next);
  };

  const triggerGrandSalvo = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!engineRef.current) return;
    triggerGrandSalvoInternal(engineRef.current);
  };

  const handleReturnToSite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClose) {
      onClose();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="fixed inset-0 w-screen h-screen z-[9999] bg-[#040612] select-none overflow-hidden touch-none font-sans">
      {/* 1. Full-Screen WebGL Canvas Container */}
      <div
        ref={containerRef}
        className="absolute inset-0 w-full h-full cursor-crosshair active:cursor-grabbing"
      />

      {/* 2. Top Header Overlay (Non-blocking) */}
      <div className="absolute top-4 left-4 right-4 sm:top-6 sm:left-6 sm:right-6 flex items-center justify-between pointer-events-none z-10">
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-full text-xs font-mono font-bold tracking-widest uppercase border border-amber-400/60 bg-stone-950/85 text-amber-300 backdrop-blur-md shadow-xl flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            <span>{title}</span>
          </div>
          <div className="hidden md:inline-block text-stone-400 text-xs tracking-wider font-mono">
            PURE THREE.JS • 3D PROCEDURAL PARTICLES
          </div>
        </div>

        <div className="flex items-center gap-2.5 pointer-events-auto">
          {/* Audio Mute Toggle */}
          <button
            type="button"
            onClick={toggleMute}
            className="p-2.5 rounded-xl bg-stone-900/85 hover:bg-stone-800 border border-white/15 text-stone-300 hover:text-white transition-all active:scale-95 shadow-lg backdrop-blur-md cursor-pointer"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Return to Main Website / Market button */}
          <button
            type="button"
            onClick={handleReturnToSite}
            className="px-3 py-2 rounded-xl bg-stone-900/85 hover:bg-stone-800 border border-white/15 text-stone-300 hover:text-white text-xs font-mono tracking-wider transition-all active:scale-95 shadow-lg backdrop-blur-md flex items-center gap-1.5 cursor-pointer"
            title={closeButtonText}
          >
            <ArrowLeft className="w-3.5 h-3.5 text-stone-400" />
            <span className="hidden sm:inline">{closeButtonText}</span>
          </button>
        </div>
      </div>

      {/* 3. Bottom Interactive Hint & Grand Salvo Trigger */}
      <div className="absolute bottom-5 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 flex flex-col sm:flex-row items-center justify-between gap-3 pointer-events-none z-10">
        <div className="px-4 py-2 rounded-xl bg-stone-950/85 border border-white/10 text-stone-300 text-xs font-mono tracking-wider backdrop-blur-md shadow-lg flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Click or tap anywhere in the sky to blast 3D fireworks!</span>
        </div>

        <button
          type="button"
          onClick={triggerGrandSalvo}
          className="pointer-events-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 hover:from-amber-400 hover:to-rose-400 text-white font-semibold text-xs tracking-wider uppercase shadow-2xl transition-all active:scale-95 flex items-center gap-2 backdrop-blur-md cursor-pointer"
        >
          <Zap className="w-3.5 h-3.5 text-amber-200 fill-amber-200 animate-pulse" />
          <span>Launch Grand Salvo</span>
          {blastCount > 0 && <span className="text-[10px] text-amber-200 font-mono">({blastCount})</span>}
        </button>
      </div>
    </div>
  );
};
