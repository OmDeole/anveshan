import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Volume2, VolumeX, FastForward, Play, ChevronDown } from 'lucide-react';
import { soundController } from '../game/SoundController';

interface IntroScrollCinematicProps {
  onComplete: () => void;
}

const TOTAL_FRAMES = 240;
const INTRO_PROMPT_SECONDS = 15.0;
const VIDEO_LOOP_END_SECONDS = 23.0;

export const IntroScrollCinematic: React.FC<IntroScrollCinematicProps> = ({ onComplete }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Mobile device detection for dedicated mobile portrait video
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.innerWidth <= 768 ||
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    );
  });

  useEffect(() => {
    const checkMobile = () => {
      const mobile =
        window.innerWidth <= 768 ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);
    };
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Intro video states
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [needsInteraction, setNeedsInteraction] = useState(false);
  const [canScroll, setCanScroll] = useState(false);

  // Scroll states
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [isActivelyScrubbing, setIsActivelyScrubbing] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // Frame rendering and animation refs
  const imagesCacheRef = useRef<Map<number, HTMLImageElement>>(new Map());
  const lastDrawnImageRef = useRef<HTMLImageElement | null>(null);
  const targetProgressRef = useRef<number>(0);
  const currentProgressRef = useRef<number>(0);
  const animFrameIdRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const hasSwitchedToAudioRef = useRef<boolean>(false);

  const [isSoundActive, setIsSoundActive] = useState<boolean>(soundController.isSoundActive());

  // Subscribe to SoundController changes
  useEffect(() => {
    const unsubscribe = soundController.subscribe(() => {
      setIsSoundActive(soundController.isSoundActive());
    });
    return unsubscribe;
  }, []);

  const getFrameUrl = useCallback((index: number) => {
    const pad = String(index).padStart(4, '0');
    return `/scroll_frames_fast/frame_${pad}.webp`;
  }, []);

  // Draw frame on canvas with aspect ratio cover
  const drawFrame = useCallback((frameIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let img = imagesCacheRef.current.get(frameIndex);
    if (!img || !img.complete || img.naturalWidth === 0) {
      img = lastDrawnImageRef.current || undefined;
    }

    if (!img) return;
    lastDrawnImageRef.current = img;

    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth || 1280;
    const ih = img.naturalHeight || 720;

    const hRatio = cw / iw;
    const vRatio = ch / ih;
    // Crop the scroll video to fill the screen on mobile devices (cover)
    const ratio = Math.max(hRatio, vRatio);

    const nw = iw * ratio;
    const nh = ih * ratio;
    const offsetX = (cw - nw) / 2;
    const offsetY = (ch - nh) / 2;

    ctx.clearRect(0, 0, cw, ch);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, iw, ih, offsetX, offsetY, nw, nh);
  }, []);

  // Handle canvas resize
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);

    const frameIdx = Math.min(
      Math.max(Math.floor(currentProgressRef.current * (TOTAL_FRAMES - 1)) + 1, 1),
      TOTAL_FRAMES
    );
    drawFrame(frameIdx);
  }, [drawFrame]);

  // Load the first frame and sparse keyframes immediately. Fill in the remaining
  // frames during idle time so startup does not compete with video playback.
  useEffect(() => {
    let isCancelled = false;
    const requestedFrames = new Set<number>();
    const idleWindow = window as Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    let idleId: number | null = null;

    const loadFrame = (index: number, priority: 'high' | 'low') => {
      if (requestedFrames.has(index)) return;
      requestedFrames.add(index);

      const img = new Image();
      img.decoding = 'async';
      img.fetchPriority = priority;
      img.src = getFrameUrl(index);
      img.onload = () => {
        if (isCancelled) return;
        imagesCacheRef.current.set(index, img);
        if (index === 1) {
          lastDrawnImageRef.current = img;
          handleResize();
        }
      };
    };

    loadFrame(1, 'high');
    for (let i = 9; i <= TOTAL_FRAMES; i += 8) {
      loadFrame(i, 'high');
    }

    let nextFrame = 2;
    const loadNextIdleFrame = () => {
      if (isCancelled) return;
      while (nextFrame <= TOTAL_FRAMES && requestedFrames.has(nextFrame)) nextFrame += 1;
      if (nextFrame > TOTAL_FRAMES) return;
      loadFrame(nextFrame, 'low');
      nextFrame += 1;
      idleId = idleWindow.requestIdleCallback
        ? idleWindow.requestIdleCallback(loadNextIdleFrame, { timeout: 500 })
        : window.setTimeout(loadNextIdleFrame, 50);
    };

    idleId = idleWindow.requestIdleCallback
      ? idleWindow.requestIdleCallback(loadNextIdleFrame, { timeout: 500 })
      : window.setTimeout(loadNextIdleFrame, 50);

    return () => {
      isCancelled = true;
      if (idleId !== null) {
        if (idleWindow.cancelIdleCallback) idleWindow.cancelIdleCallback(idleId);
        else window.clearTimeout(idleId);
      }
    };
  }, [getFrameUrl, handleResize]);

  // Attempt video autoplay on initial mount
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
        // Autoplay policy blocked audio; display non-intrusive prompt
        setNeedsInteraction(true);
      }
    };

    startPlay();
  }, [isMobile]);

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

  // Video time monitor: triggers prompt at 14s and loops scenic footage after 14s without pausing
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;

    const duration = video.duration || VIDEO_LOOP_END_SECONDS;
    const promptTime = Math.min(INTRO_PROMPT_SECONDS, duration * 0.6);

    // Reveal subtle scroll guidance
    if (video.currentTime >= promptTime) {
      if (!canScroll) {
        setCanScroll(true);
      }
    }

    // When footage reaches end, loop seamlessly so immersion is never broken
    if (video.currentTime >= Math.min(VIDEO_LOOP_END_SECONDS, duration - 0.2)) {
      video.currentTime = Math.max(0, promptTime);
      video.play().catch(() => {});
    }
  };

  const handleVideoEnded = () => {
    setCanScroll(true);
    const video = videoRef.current;
    if (video) {
      const duration = video.duration || VIDEO_LOOP_END_SECONDS;
      video.currentTime = Math.max(0, Math.min(INTRO_PROMPT_SECONDS, duration * 0.6));
      video.play().catch(() => {});
    }
  };

  // Switch from video audio to background SoundController when scrubbing begins
  const activateSoundtrackLoop = useCallback(() => {
    if (hasSwitchedToAudioRef.current) return;
    hasSwitchedToAudioRef.current = true;

    const video = videoRef.current;
    const currentTime = video ? video.currentTime : INTRO_PROMPT_SECONDS;

    if (video) {
      video.pause();
    }

    soundController.playFrom(currentTime);
  }, []);

  // Smooth kinetic lerp loop for canvas frame rendering
  useEffect(() => {
    const updateLoop = () => {
      const target = targetProgressRef.current;
      const current = currentProgressRef.current;
      const diff = target - current;

      if (Math.abs(diff) > 0.0003) {
        currentProgressRef.current += diff * 0.14;
        const frameIdx = Math.min(
          Math.max(Math.floor(currentProgressRef.current * (TOTAL_FRAMES - 1)) + 1, 1),
          TOTAL_FRAMES
        );
        drawFrame(frameIdx);
        setScrollProgress(currentProgressRef.current);
      }

      // Complete experience when scrolled to bottom (>= 98.5%)
      if (currentProgressRef.current >= 0.985 && !isCompleted) {
        setIsCompleted(true);
        setTimeout(() => {
          onComplete();
        }, 500);
        return;
      }

      animFrameIdRef.current = requestAnimationFrame(updateLoop);
    };

    animFrameIdRef.current = requestAnimationFrame(updateLoop);
    return () => {
      if (animFrameIdRef.current !== null) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [drawFrame, isCompleted, onComplete]);

  // Native window scroll listener
  useEffect(() => {
    const onScroll = () => {
      if (!containerRef.current || !canScroll) return;
      const rect = containerRef.current.getBoundingClientRect();
      const scrollableHeight = rect.height - window.innerHeight;
      if (scrollableHeight <= 0) return;

      const progress = Math.min(Math.max(-rect.top / scrollableHeight, 0), 1);
      targetProgressRef.current = progress;

      if (progress > 0.01) {
        setIsActivelyScrubbing(true);
        activateSoundtrackLoop();
      } else if (progress === 0) {
        setIsActivelyScrubbing(false);
        // Resume living video if user returns to top
        if (videoRef.current && hasSwitchedToAudioRef.current) {
          hasSwitchedToAudioRef.current = false;
          soundController.pause();
          videoRef.current.play().catch(() => {});
        }
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [canScroll, handleResize, activateSoundtrackLoop]);

  // Direct touch listener for mobile devices
  const onTouchStart = (e: React.TouchEvent) => {
    if (!canScroll) return;
    if (e.touches.length === 1) {
      touchStartYRef.current = e.touches[0].clientY;
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartYRef.current === null || e.touches.length !== 1) return;
    const deltaY = touchStartYRef.current - e.touches[0].clientY;
    touchStartYRef.current = e.touches[0].clientY;

    if (!canScroll && deltaY > 15) {
      setCanScroll(true);
    }

    const scrollSensitivity = 0.0022;
    targetProgressRef.current = Math.min(
      Math.max(targetProgressRef.current + deltaY * scrollSensitivity, 0),
      1
    );

    if (targetProgressRef.current > 0.01) {
      setIsActivelyScrubbing(true);
      activateSoundtrackLoop();
    }
  };

  const onTouchEnd = () => {
    touchStartYRef.current = null;
  };

  // Direct wheel listener for mouse and trackpad
  const onWheel = (e: React.WheelEvent) => {
    if (!canScroll) return;
    const wheelSensitivity = 0.00085;
    targetProgressRef.current = Math.min(
      Math.max(targetProgressRef.current + e.deltaY * wheelSensitivity, 0),
      1
    );

    if (targetProgressRef.current > 0.01) {
      setIsActivelyScrubbing(true);
      activateSoundtrackLoop();
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    if (video) {
      video.muted = nextMuted;
    }

    if (nextMuted) {
      if (!soundController.getIsMuted()) soundController.toggleMute();
    } else {
      if (soundController.getIsMuted()) soundController.toggleMute();
    }
  };

  const handleSkip = () => {
    if (isCompleted) return;
    setIsCompleted(true);
    activateSoundtrackLoop();
    setTimeout(() => {
      onComplete();
    }, 400);
  };

  return (
    <div
      ref={containerRef}
      onWheel={onWheel}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className={`relative w-full ${
        canScroll ? 'h-[320vh]' : 'h-screen'
      } bg-black select-none transition-opacity duration-700 ${
        isCompleted ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Sticky Viewport Container */}
      <div className="sticky top-0 w-full h-screen overflow-hidden flex items-center justify-center bg-black">
        {/* Layer 1: Living Intro Video Player (Plays continuously, loops 15s -> 23s without pause) */}
        <video
          ref={videoRef}
          key={isMobile ? 'mobile-video' : 'desktop-video'}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
            isActivelyScrubbing ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
          playsInline
          preload="metadata"
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleVideoEnded}
          onClick={() => {
            if (needsInteraction) handleManualStart();
          }}
        >
          {isMobile ? (
            <source src="/mobile_intro_fast.mp4" type="video/mp4" />
          ) : (
            <source src="/japvidanveshan_fast.mp4" type="video/mp4" />
          )}
          Your browser does not support video playback.
        </video>

        {/* Layer 2: Interactive Frame Canvas (Fades in seamlessly as user scrubs frames) */}
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 w-full h-full object-cover block transition-opacity duration-300 ${
            isActivelyScrubbing ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          style={{ touchAction: 'none' }}
        />

        {/* Subtle Ambient Vignette */}
        <div className="absolute inset-0 pointer-events-none bg-radial from-transparent via-transparent to-black/60" />

        {/* Top Header Overlay Controls */}
        <div className="absolute top-[max(1rem,env(safe-area-inset-top))] left-[max(1rem,env(safe-area-inset-left))] right-[max(1rem,env(safe-area-inset-right))] flex items-center justify-between pointer-events-none z-30">
          {/* Audio Mute/Unmute */}
          <button
            type="button"
            onClick={toggleMute}
            title={isMuted || !isSoundActive ? 'Unmute Audio' : 'Mute Audio'}
            className="pointer-events-auto p-2 sm:p-2.5 rounded-2xl backdrop-blur-md bg-stone-900/60 hover:bg-stone-800/80 border border-white/15 text-white/90 transition-all active:scale-95 shadow-lg"
          >
            {isMuted || !isSoundActive ? (
              <VolumeX className="w-4 h-4 text-stone-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            )}
          </button>

          {/* Skip to Sanctuary Button */}
          <button
            type="button"
            onClick={handleSkip}
            title="Skip Directly to Game"
            className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl backdrop-blur-md bg-stone-900/60 hover:bg-stone-800/80 border border-white/15 text-white/90 text-[11px] sm:text-xs font-medium tracking-wider transition-all active:scale-95 shadow-lg"
          >
            <span>Skip to Game</span>
            <FastForward className="w-3.5 h-3.5 text-amber-400" />
          </button>
        </div>

        {/* Non-intrusive Start Overlay (Only shown if browser requires initial gesture for sound) */}
        {needsInteraction && !isPlaying && (
          <div
            onClick={handleManualStart}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center cursor-pointer z-40 transition-all duration-300"
          >
            <div className="flex flex-col items-center max-w-sm">
              <div className="w-14 h-14 rounded-full bg-red-600/30 border border-red-500/50 flex items-center justify-center mb-5 shadow-2xl shadow-red-600/40 animate-pulse">
                <Play className="w-6 h-6 text-red-200 fill-red-200 ml-0.5" />
              </div>
              <span className="text-[11px] uppercase tracking-[0.35em] text-red-400 font-semibold mb-2">
                Chureito Sanctuary • 探索
              </span>
              <h1 className="text-2xl font-light text-white tracking-widest uppercase mb-6">
                Enter Sanctuary
              </h1>
              <button
                type="button"
                onClick={handleManualStart}
                className="px-7 py-3 rounded-full bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:from-amber-500 text-white font-medium text-xs tracking-widest uppercase shadow-xl shadow-red-950/50 transition-transform active:scale-95"
              >
                Begin Journey • 入場
              </button>
            </div>
          </div>
        )}

        {/* Subtle, Immersive Scroll Guidance (Fades in dynamically at the bottom; doesn't break immersion) */}
        {canScroll && (
          <div
            className={`absolute bottom-[max(2rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none transition-all duration-700 ease-out z-30 ${
              isActivelyScrubbing && scrollProgress > 0.04
                ? 'opacity-0 translate-y-3'
                : 'opacity-100 translate-y-0'
            }`}
          >
            <div className="flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full bg-black/50 backdrop-blur-md border border-white/15 text-white/90 text-xs tracking-wider uppercase shadow-2xl shadow-black/80">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="font-medium">{isMobile ? 'Swipe Up to Descend' : 'Scroll to Descend'}</span>
              <span className="text-white/30">•</span>
              <span className="text-stone-300/80 text-[11px] tracking-normal font-light">スクロール</span>
            </div>
            <ChevronDown className="w-4 h-4 text-amber-400/90 animate-bounce drop-shadow" />
          </div>
        )}

        {/* Minimal Bottom Progress Indicator while actively scrubbing */}
        {isActivelyScrubbing && (
          <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between pointer-events-none z-20 transition-opacity duration-300">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full backdrop-blur-md bg-stone-900/60 border border-white/10 text-white/80 text-[11px] font-mono shadow-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span>DESCENT: {Math.round(scrollProgress * 100)}%</span>
            </div>

            <span className="text-[10px] text-white/50 tracking-widest uppercase hidden sm:inline">
              Reach 100% to enter 3D world
            </span>
          </div>
        )}

        {/* Thin bottom line during scroll */}
        {isActivelyScrubbing && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 pointer-events-none z-20">
            <div
              className="h-full bg-gradient-to-r from-red-600 via-amber-500 to-amber-300 transition-all duration-75 ease-out"
              style={{ width: `${scrollProgress * 100}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
