import React, { useEffect, useState, useRef } from 'react';
import { FastForward, Sparkles, VolumeX } from 'lucide-react';
import { soundController } from '../game/SoundController';

interface PromptifyFireworksCinematicProps {
  onComplete: () => void;
  videoSrc?: string;
}

export const PromptifyFireworksCinematic: React.FC<PromptifyFireworksCinematicProps> = ({
  onComplete,
  videoSrc = '/promptify_fireworks.mp4',
}) => {
  const [progress, setProgress] = useState<number>(0);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasFinishedRef = useRef<boolean>(false);

  // 1. Manage audio lifecycle: pause normal background soundtrack during fireworks video
  useEffect(() => {
    const wasPlayingBefore = soundController.isSoundActive();
    soundController.pause();

    return () => {
      // Resume background music when fireworks video completes or unmounts
      if (wasPlayingBefore && !soundController.getIsMuted()) {
        soundController.play().catch(() => {});
      }
    };
  }, []);

  // 2. Auto-play fireworks video with its original audio
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.volume = 1.0;
    video.muted = false;

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn('Fireworks celebration video autoplay with sound was restricted by browser:', err);
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

  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.duration) {
      const pct = Math.min(videoRef.current.currentTime / videoRef.current.duration, 1.0);
      setProgress(pct);
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
    <div className="fixed inset-0 z-50 bg-stone-950 flex flex-col items-center justify-center select-none overflow-hidden animate-in fade-in duration-300">
      {/* Celebration Fireworks Video */}
      <video
        ref={videoRef}
        playsInline
        autoPlay
        controls={false}
        preload="auto"
        className="absolute inset-0 w-full h-full object-contain bg-black"
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleFinish}
        onError={() => {
          console.warn('Failed to load fireworks celebration video, completing cinematic.');
          handleFinish();
        }}
      >
        <source src={videoSrc} type="video/mp4" />
      </video>

      {/* Cinematic Vignette Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-transparent to-stone-950/50 pointer-events-none" />

      {/* Top Banner: Celebration Header */}
      <div className="absolute top-6 left-6 right-6 sm:left-10 sm:right-10 flex items-center justify-between z-30 pointer-events-none">
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-full text-xs font-serif font-bold tracking-widest uppercase border border-amber-400/80 bg-stone-900/90 text-amber-300 backdrop-blur-md shadow-xl flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" />
            <span>祭典 • PROMPTIFY CELEBRATION</span>
          </div>
          <div className="text-white text-xs sm:text-sm font-sans tracking-wide drop-shadow-md hidden sm:block">
            Summer Festival Fireworks Over Japanese Market
          </div>
        </div>

        {/* Unmute button if browser enforced muted autoplay */}
        {isAudioMuted && (
          <button
            type="button"
            onClick={toggleVideoMute}
            className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-900/90 border border-amber-400 text-amber-300 text-xs font-mono backdrop-blur-md hover:bg-stone-800 transition-all shadow-xl active:scale-95 cursor-pointer"
            title="Unmute fireworks sound"
          >
            <VolumeX className="w-3.5 h-3.5 animate-pulse" />
            <span>Click to Unmute Audio</span>
          </button>
        )}
      </div>

      {/* Bottom Status & Cinematic Progress Bar */}
      <div className="absolute bottom-8 left-6 sm:left-10 z-30 pointer-events-none max-w-sm">
        <p className="text-[11px] sm:text-xs text-amber-300 font-mono tracking-widest mb-2 drop-shadow">
          REGISTRATION COMPLETE • FESTIVAL NIGHT CELEBRATION
        </p>
        <div className="w-48 sm:w-64 h-1 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
          <div
            className="h-full bg-gradient-to-r from-amber-400 via-rose-500 to-purple-500 transition-all duration-100 ease-linear rounded-full"
            style={{ width: `${Math.max(progress * 100, 2)}%` }}
          />
        </div>
      </div>

      {/* Skip Button */}
      <button
        type="button"
        onClick={handleFinish}
        className="absolute bottom-8 right-6 sm:right-10 z-30 flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900/80 hover:bg-stone-800 border border-white/20 text-stone-200 hover:text-white text-xs font-mono tracking-wider backdrop-blur-md shadow-2xl transition-all active:scale-95 pointer-events-auto cursor-pointer"
      >
        <span>SKIP</span>
        <FastForward className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
