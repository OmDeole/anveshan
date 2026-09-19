import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, FastForward, Play } from 'lucide-react';
import { soundController } from '../game/SoundController';

interface IntroVideoProps {
  onComplete: (stopTime?: number) => void;
}

const INTRO_CUTOFF_SECONDS = 15.0;

export const IntroVideo: React.FC<IntroVideoProps> = ({ onComplete }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [needsInteraction, setNeedsInteraction] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const hasTriggeredEndRef = useRef(false);

  const [isMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.innerWidth <= 768 ||
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    );
  });

  // Attempt autoplay on mount
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.volume = 0.85;

    const startPlay = async () => {
      try {
        await video.play();
        setIsPlaying(true);
        setNeedsInteraction(false);
      } catch {
        // Autoplay with sound blocked by browser policy; prompt user
        setNeedsInteraction(true);
      }
    };

    startPlay();
  }, []);

  const handleManualStart = async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      video.muted = isMuted;
      await video.play();
      setIsPlaying(true);
      setNeedsInteraction(false);
    } catch (err) {
      console.warn('Playback error:', err);
    }
  };

  const triggerCompletion = (stopTime: number = INTRO_CUTOFF_SECONDS) => {
    if (hasTriggeredEndRef.current) return;
    hasTriggeredEndRef.current = true;

    const video = videoRef.current;
    if (video) {
      video.pause();
    }

    setIsExiting(true);
    // Smooth cinematic transition into the scroll experience
    setTimeout(() => {
      onComplete(stopTime);
    }, 450);
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;

    // Check if reached 14 seconds
    if (video.currentTime >= INTRO_CUTOFF_SECONDS) {
      triggerCompletion(video.currentTime);
      return;
    }

    setProgress(Math.min((video.currentTime / INTRO_CUTOFF_SECONDS) * 100, 100));
  };

  const handleVideoEnded = () => {
    triggerCompletion(INTRO_CUTOFF_SECONDS);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    const nextMuted = !isMuted;
    video.muted = nextMuted;
    setIsMuted(nextMuted);
    if (nextMuted) {
      if (!soundController.getIsMuted()) {
        soundController.toggleMute();
      }
    } else {
      if (soundController.getIsMuted()) {
        soundController.toggleMute();
      }
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black transition-opacity duration-500 select-none ${
        isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* HTML5 Video Player */}
      <video
        ref={videoRef}
        key={isMobile ? 'mobile' : 'desktop'}
        className="w-full h-full object-cover cursor-pointer"
        playsInline
        preload="auto"
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleVideoEnded}
        onClick={() => {
          if (needsInteraction) {
            handleManualStart();
          }
        }}
      >
        {isMobile ? (
          <>
            <source src="/mobile_intro.mp4" type="video/mp4" />
            <source src="/mobile_intro.mov" type="video/quicktime" />
          </>
        ) : (
          <>
            <source src="/japvidanveshan.mp4" type="video/mp4" />
            <source src="/japvidanveshan.mov" type="video/quicktime" />
          </>
        )}
        Your browser does not support video playback.
      </video>

      {/* Atmospheric Prompt when browser blocks unmuted autoplay */}
      {needsInteraction && (
        <div
          onClick={handleManualStart}
          className="absolute inset-0 bg-black/75 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center cursor-pointer z-30 transition-all duration-300"
        >
          <div className="max-w-md flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-red-600/30 border border-red-500/50 flex items-center justify-center mb-6 shadow-2xl shadow-red-600/40 animate-pulse">
              <Play className="w-8 h-8 text-red-200 fill-red-200 ml-1" />
            </div>

            <span className="text-xs uppercase tracking-[0.4em] text-red-400 font-semibold mb-2">
              Chureito Sanctuary • 探索
            </span>
            <h1 className="text-3xl sm:text-4xl font-light text-white tracking-widest uppercase mb-4">
              Anveshan
            </h1>
            <p className="text-stone-300/80 text-sm mb-8 leading-relaxed max-w-sm">
              Immerse yourself in the sacred heights of Mount Fuji. Click to begin with cinematic sound.
            </p>

            <button
              type="button"
              onClick={handleManualStart}
              className="px-8 py-3.5 rounded-full bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-medium text-sm tracking-wider uppercase shadow-xl shadow-red-900/40 transition-transform active:scale-95"
            >
              Begin Journey • 入場
            </button>
          </div>
        </div>
      )}

      {/* Top Header Overlay Controls */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between pointer-events-none z-20">
        {/* Audio Mute/Unmute */}
        <button
          type="button"
          onClick={toggleMute}
          title={isMuted ? 'Unmute' : 'Mute'}
          className="pointer-events-auto p-2.5 rounded-2xl backdrop-blur-md bg-stone-900/60 hover:bg-stone-800/80 border border-white/15 text-white/90 transition-all active:scale-95 shadow-lg"
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-stone-400" />
          ) : (
            <Volume2 className="w-4 h-4 text-emerald-400" />
          )}
        </button>

        {/* Skip Intro Button */}
        <button
          type="button"
          onClick={() => triggerCompletion(videoRef.current?.currentTime || INTRO_CUTOFF_SECONDS)}
          title="Skip Intro to Descent"
          className="pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-2xl backdrop-blur-md bg-stone-900/60 hover:bg-stone-800/80 border border-white/15 text-white/90 text-xs font-medium tracking-wider transition-all active:scale-95 shadow-lg"
        >
          <span>Skip Intro</span>
          <FastForward className="w-3.5 h-3.5 text-amber-400" />
        </button>
      </div>

      {/* Bottom Timeline Indicator for 14-second sequence */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 pointer-events-none z-20">
        <div
          className="h-full bg-gradient-to-r from-red-600 via-amber-500 to-amber-300 transition-all duration-150 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
