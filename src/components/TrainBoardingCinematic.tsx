import React, { useEffect, useState, useRef } from 'react';
import { FastForward, Volume2, VolumeX } from 'lucide-react';
import { TrainData } from '../types';
import { soundController } from '../game/SoundController';

interface TrainBoardingCinematicProps {
  onComplete: () => void;
  videoSrc?: string;
  train?: TrainData | null;
}

export const TrainBoardingCinematic: React.FC<TrainBoardingCinematicProps> = ({
  onComplete,
  videoSrc = '/train_transition_fast.mp4',
  train,
}) => {
  const [progress, setProgress] = useState<number>(0);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasFinishedRef = useRef<boolean>(false);

  // 1. Manage audio lifecycle: pause normal background music during the train video
  useEffect(() => {
    const wasPlayingBefore = soundController.isSoundActive();
    // Pause background soundtrack
    soundController.pause();

    return () => {
      // Resume background music when transition completes or unmounts
      if (wasPlayingBefore && !soundController.getIsMuted()) {
        soundController.play().catch(() => {});
      }
    };
  }, []);

  // 2. Play transition video with its own audio
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.volume = 1.0;
    video.muted = false;

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn('Train transition video autoplay with sound was restricted by browser:', err);
        // Fallback to muted playback if browser policy requires it
        video.muted = true;
        setIsAudioMuted(true);
        video.play().catch(() => {});
      });
    }
  }, [videoSrc]);

  const handleFinish = () => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;
    onComplete();
  };

  // 3. Failsafe: if video pauses or stalls near the end, auto-finish
  useEffect(() => {
    const failsafe = setTimeout(() => {
      handleFinish();
    }, 5500);
    return () => clearTimeout(failsafe);
  }, []);

  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.duration) {
      const cur = videoRef.current.currentTime;
      const dur = videoRef.current.duration;
      const pct = Math.min(cur / dur, 1.0);
      setProgress(pct);

      if (cur >= dur - 0.25 || pct >= 0.98) {
        handleFinish();
      }
    }
  };

  const toggleVideoMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    const nextMuted = !videoRef.current.muted;
    videoRef.current.muted = nextMuted;
    setIsAudioMuted(nextMuted);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950 flex flex-col items-center justify-center select-none overflow-hidden animate-in fade-in duration-500">
      {/* Train Transition Video */}
      <video
        ref={videoRef}
        playsInline
        autoPlay
        preload="metadata"
        className="absolute inset-0 w-full h-full object-cover"
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleFinish}
        onPause={() => {
          if (videoRef.current && videoRef.current.duration) {
            if (videoRef.current.currentTime >= videoRef.current.duration - 0.5) {
              handleFinish();
            }
          }
        }}
        onError={() => {
          console.warn('Failed to load transition video, finishing cutscene.');
          handleFinish();
        }}
      >
        <source src={videoSrc} type="video/mp4" />
        <source src="/train_transition_fast.mp4" type="video/mp4" />
      </video>

      {/* Cinematic Vignette Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-stone-950/60 pointer-events-none" />

      {/* Top Banner: Train Information */}
      <div className="absolute top-6 left-6 right-6 sm:left-10 sm:right-10 flex items-center justify-between z-30 pointer-events-none">
        <div className="flex items-center gap-3">
          <div
            className="px-3 py-1 rounded-full text-xs font-serif font-bold tracking-widest uppercase border backdrop-blur-md shadow-lg"
            style={{
              backgroundColor: `${train?.colorHex || '#e11d48'}30`,
              borderColor: `${train?.colorHex || '#e11d48'}80`,
              color: train?.colorHex || '#f43f5e',
            }}
          >
            特急 • {train?.nameJapanese || 'オム'}
          </div>
          <div className="text-white text-xs sm:text-sm font-sans tracking-wide drop-shadow-md">
            Bound for <span className="font-semibold text-amber-300">{train?.destinationEnglish || "The Killer's Trail"}</span>
          </div>
        </div>

        {/* Unmute button if browser enforced muted autoplay */}
        {isAudioMuted && (
          <button
            type="button"
            onClick={toggleVideoMute}
            className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-900/90 border border-amber-400 text-amber-300 text-xs font-mono backdrop-blur-md hover:bg-stone-800 transition-all shadow-xl active:scale-95"
            title="Unmute train transition sound"
          >
            <VolumeX className="w-3.5 h-3.5 animate-pulse" />
            <span>Click to Unmute Audio</span>
          </button>
        )}
      </div>

      {/* Bottom Status & Cinematic Progress Bar */}
      <div className="absolute bottom-8 left-6 sm:left-10 z-30 pointer-events-none max-w-sm">
        <p className="text-[11px] sm:text-xs text-stone-300 font-mono tracking-widest mb-2 drop-shadow">
          TRANSIT IN PROGRESS • APPROACHING SACRED TEMPLE
        </p>
        <div className="w-48 sm:w-64 h-1 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
          <div
            className="h-full bg-gradient-to-r from-rose-500 via-amber-400 to-amber-200 transition-all duration-100 ease-linear rounded-full"
            style={{ width: `${Math.max(progress * 100, 2)}%` }}
          />
        </div>
      </div>

      {/* Skip Button */}
      <button
        type="button"
        onClick={handleFinish}
        className="absolute bottom-8 right-6 sm:right-10 z-30 flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900/80 hover:bg-stone-800 border border-white/20 text-stone-200 hover:text-white text-xs font-mono tracking-wider backdrop-blur-md shadow-2xl transition-all active:scale-95 pointer-events-auto"
      >
        <span>SKIP</span>
        <FastForward className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
