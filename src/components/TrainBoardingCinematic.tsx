import React, { useEffect, useState, useRef } from 'react';
import { FastForward, Train } from 'lucide-react';
import { TrainData } from '../types';

interface TrainBoardingCinematicProps {
  onComplete: () => void;
  videoSrc?: string;
  train?: TrainData | null;
}

export const TrainBoardingCinematic: React.FC<TrainBoardingCinematicProps> = ({
  onComplete,
  videoSrc,
  train,
}) => {
  const [hasCustomVideo, setHasCustomVideo] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Check if a custom video file is available and playable
  useEffect(() => {
    if (videoSrc) {
      setHasCustomVideo(true);
    }
  }, [videoSrc]);

  // Fallback procedural cinematic timer if no custom video is supplied yet
  useEffect(() => {
    if (hasCustomVideo) return;

    const duration = 4800; // 4.8s immersive departure cutscene
    const start = performance.now();

    const frame = () => {
      const elapsed = performance.now() - start;
      const pct = Math.min(elapsed / duration, 1.0);
      setProgress(pct);

      if (pct < 1.0) {
        requestAnimationFrame(frame);
      } else {
        onComplete();
      }
    };

    const animId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(animId);
  }, [hasCustomVideo, onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-stone-950 flex flex-col items-center justify-center select-none overflow-hidden animate-in fade-in duration-500">
      {hasCustomVideo && videoSrc ? (
        // Custom User-Supplied Boarding Video
        <video
          ref={videoRef}
          src={videoSrc}
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          onEnded={onComplete}
        />
      ) : (
        // High-Production Cinematic Departure Sequence
        <div className="relative w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-b from-stone-950 via-red-950/30 to-stone-950">
          {/* Animated Speed Lines / Track Horizon */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-black/80 pointer-events-none" />

          {/* Central Train Departing Emblem */}
          <div className="relative flex flex-col items-center max-w-lg text-center z-10">
            {/* Express Train Icon with dynamic pulse */}
            <div
              className="relative w-24 h-24 mb-6 rounded-3xl border flex items-center justify-center shadow-2xl transition-colors"
              style={{
                backgroundColor: `${train?.colorHex || '#e11d48'}25`,
                borderColor: `${train?.colorHex || '#e11d48'}60`,
              }}
            >
              <Train
                className="w-12 h-12 animate-pulse"
                style={{ color: train?.colorHex || '#f43f5e' }}
              />
              <div
                className="absolute inset-0 rounded-3xl border animate-ping opacity-25"
                style={{ borderColor: train?.colorHex || '#f43f5e' }}
              />
            </div>

            {/* Japanese Train Name */}
            <div className="text-3xl sm:text-4xl font-serif tracking-[0.3em] text-amber-300 font-bold mb-2">
              特急 • {train?.nameJapanese || 'オム'}
            </div>

            {/* Destination Title */}
            <h2 className="text-xl sm:text-2xl font-light text-white tracking-widest uppercase mb-1">
              {train?.destinationEnglish || "To The Killer's Trail"}
            </h2>

            <p className="text-xs sm:text-sm text-stone-400 font-mono tracking-widest mb-8">
              {train?.destinationJapanese || '殺人鬼の足跡行'} • DEPARTING FOR TEMPLE SANCTUARY
            </p>

            {/* Japanese Departure Announcement Quote */}
            <div className="px-6 py-3 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-md text-stone-300 text-xs sm:text-sm font-sans italic max-w-md">
              「まもなく発車いたします。次は 霊峰・本堂 です。」
              <div className="text-[10px] text-stone-400 tracking-wider mt-1 not-italic font-mono">
                Doors Closing. Next Stop: Sacred Temple Sanctuary.
              </div>
            </div>

            {/* Cinematic Progress Bar */}
            <div className="w-64 h-1.5 bg-stone-800 rounded-full mt-8 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-rose-500 to-amber-400 transition-all duration-75 ease-out rounded-full"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Skip Button */}
      <button
        type="button"
        onClick={onComplete}
        className="absolute bottom-8 right-8 z-20 flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-stone-200 text-xs font-mono tracking-wider backdrop-blur-md transition-all active:scale-95"
      >
        <span>SKIP</span>
        <FastForward className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
