import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Volume2, VolumeX, FastForward, ChevronDown, Mouse, Smartphone } from 'lucide-react';
import { soundController } from '../game/SoundController';

interface ScrollExperienceProps {
  onComplete: () => void;
}

const TOTAL_FRAMES = 240;

export const ScrollExperience: React.FC<ScrollExperienceProps> = ({ onComplete }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isSoundActive, setIsSoundActive] = useState<boolean>(soundController.isSoundActive());
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [hasStartedScrolling, setHasStartedScrolling] = useState<boolean>(false);

  // Frame image cache & rendering refs
  const imagesCacheRef = useRef<Map<number, HTMLImageElement>>(new Map());
  const lastDrawnImageRef = useRef<HTMLImageElement | null>(null);
  const targetProgressRef = useRef<number>(0);
  const currentProgressRef = useRef<number>(0);
  const animFrameIdRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  // SoundController subscription
  useEffect(() => {
    const unsubscribe = soundController.subscribe(() => {
      setIsSoundActive(soundController.isSoundActive());
    });
    return unsubscribe;
  }, []);

  const getFrameUrl = useCallback((index: number) => {
    const pad = String(index).padStart(4, '0');
    return `/scroll_frames/frame_${pad}.jpg`;
  }, []);

  // Draw a frame onto the canvas maintaining cover aspect ratio
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

    // Cover math
    const hRatio = cw / iw;
    const vRatio = ch / ih;
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

  // Resize canvas to match high-DPI display
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

  // Preload frames progressively
  useEffect(() => {
    let isCancelled = false;

    // 1. Load initial frame immediately
    const firstImg = new Image();
    firstImg.src = getFrameUrl(1);
    firstImg.onload = () => {
      if (isCancelled) return;
      imagesCacheRef.current.set(1, firstImg);
      lastDrawnImageRef.current = firstImg;
      handleResize();
    };

    // 2. Load keyframes every 4th frame first for rapid scrubbing response
    const loadKeyframes = async () => {
      for (let i = 2; i <= TOTAL_FRAMES; i += 4) {
        if (isCancelled) break;
        const img = new Image();
        img.src = getFrameUrl(i);
        img.onload = () => {
          if (!isCancelled) imagesCacheRef.current.set(i, img);
        };
      }

      // 3. Fill in all remaining intermediate frames
      for (let i = 1; i <= TOTAL_FRAMES; i++) {
        if (isCancelled) break;
        if (!imagesCacheRef.current.has(i)) {
          const img = new Image();
          img.src = getFrameUrl(i);
          img.onload = () => {
            if (!isCancelled) imagesCacheRef.current.set(i, img);
          };
        }
      }
    };

    loadKeyframes();

    return () => {
      isCancelled = true;
    };
  }, [getFrameUrl, handleResize]);

  // Smooth kinetic lerp loop using requestAnimationFrame
  useEffect(() => {
    const updateLoop = () => {
      const target = targetProgressRef.current;
      const current = currentProgressRef.current;
      const diff = target - current;

      if (Math.abs(diff) > 0.0004) {
        // Silky smooth kinetic easing
        currentProgressRef.current += diff * 0.14;
        const frameIdx = Math.min(
          Math.max(Math.floor(currentProgressRef.current * (TOTAL_FRAMES - 1)) + 1, 1),
          TOTAL_FRAMES
        );
        drawFrame(frameIdx);
        setScrollProgress(currentProgressRef.current);
      }

      // Trigger completion when scrolled to the bottom (>= 98.5%)
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
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const scrollableHeight = rect.height - window.innerHeight;
      if (scrollableHeight <= 0) return;

      const progress = Math.min(Math.max(-rect.top / scrollableHeight, 0), 1);
      targetProgressRef.current = progress;

      if (progress > 0.03) {
        setHasStartedScrolling(true);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [handleResize]);

  // Direct touch support for mobile devices
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartYRef.current = e.touches[0].clientY;
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartYRef.current === null || e.touches.length !== 1) return;
    const deltaY = touchStartYRef.current - e.touches[0].clientY;
    touchStartYRef.current = e.touches[0].clientY;

    // Convert touch drag into progress increment
    const scrollSensitivity = 0.0022;
    targetProgressRef.current = Math.min(
      Math.max(targetProgressRef.current + deltaY * scrollSensitivity, 0),
      1
    );

    if (targetProgressRef.current > 0.03) {
      setHasStartedScrolling(true);
    }
  };

  const onTouchEnd = () => {
    touchStartYRef.current = null;
  };

  // Direct mouse wheel support for instant trackpad / mouse response
  const onWheel = (e: React.WheelEvent) => {
    const wheelSensitivity = 0.00085;
    targetProgressRef.current = Math.min(
      Math.max(targetProgressRef.current + e.deltaY * wheelSensitivity, 0),
      1
    );
    if (targetProgressRef.current > 0.03) {
      setHasStartedScrolling(true);
    }
  };

  const handleSkip = () => {
    if (isCompleted) return;
    setIsCompleted(true);
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
      className={`relative w-full h-[320vh] bg-black select-none transition-opacity duration-700 ${
        isCompleted ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Sticky Viewport Container */}
      <div className="sticky top-0 w-full h-screen overflow-hidden flex items-center justify-center bg-black">
        {/* Render Canvas */}
        <canvas
          ref={canvasRef}
          className="w-full h-full object-cover block"
          style={{ touchAction: 'none' }}
        />

        {/* Ambient Vignette Overlay */}
        <div className="absolute inset-0 pointer-events-none bg-radial from-transparent via-black/10 to-black/70" />

        {/* Top Header Overlay Controls */}
        <div className="absolute top-6 left-6 right-6 flex items-center justify-between pointer-events-none z-30">
          {/* Audio Mute/Unmute */}
          <button
            type="button"
            onClick={() => soundController.toggleSound()}
            title={isSoundActive ? 'Mute Background Soundtrack' : 'Play Background Soundtrack'}
            className="pointer-events-auto p-2.5 rounded-2xl backdrop-blur-md bg-stone-900/60 hover:bg-stone-800/80 border border-white/15 text-white/90 transition-all active:scale-95 shadow-lg"
          >
            {isSoundActive ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-stone-400" />
            )}
          </button>

          {/* Skip Directly to Sanctuary Button */}
          <button
            type="button"
            onClick={handleSkip}
            title="Skip Directly to Game"
            className="pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-2xl backdrop-blur-md bg-stone-900/60 hover:bg-stone-800/80 border border-white/15 text-white/90 text-xs font-medium tracking-wider transition-all active:scale-95 shadow-lg"
          >
            <span>Skip to Game</span>
            <FastForward className="w-3.5 h-3.5 text-amber-400" />
          </button>
        </div>

        {/* Guidance: Prominent Scroll Indicator Overlay */}
        <div
          className={`absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6 text-center transition-all duration-700 z-20 ${
            hasStartedScrolling && scrollProgress > 0.06
              ? 'opacity-0 scale-95'
              : 'opacity-100 scale-100'
          }`}
        >
          <div className="flex flex-col items-center max-w-md bg-stone-950/65 backdrop-blur-md border border-white/15 px-8 py-7 rounded-3xl shadow-2xl">
            {/* Japanese Seal & Subtitle */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] uppercase tracking-[0.35em] text-red-400 font-semibold px-2 py-0.5 rounded-md bg-red-950/60 border border-red-500/30">
                富士見道 • DESCENT
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-light text-white tracking-widest uppercase mb-2">
              Scroll To Enter
            </h2>
            <p className="text-stone-300/80 text-xs sm:text-sm max-w-xs mb-6 leading-relaxed">
              Scroll down or swipe to descend through the mountain passage into Mount Fuji sanctuary.
            </p>

            {/* Animated Device-adaptive Scroll Indicator */}
            <div className="flex items-center justify-center gap-4 text-stone-300">
              {/* Desktop Mouse indicator */}
              <div className="hidden sm:flex flex-col items-center gap-1.5">
                <div className="w-6 h-10 rounded-full border-2 border-amber-400/80 flex items-start justify-center p-1.5 shadow-lg shadow-amber-500/20">
                  <div className="w-1.5 h-2.5 bg-amber-400 rounded-full animate-bounce" />
                </div>
                <span className="text-[10px] tracking-wider uppercase text-amber-200/90 font-medium">
                  Scroll
                </span>
              </div>

              {/* Mobile Touch indicator */}
              <div className="flex sm:hidden flex-col items-center gap-1.5">
                <div className="p-2.5 rounded-full border border-amber-400/60 bg-amber-500/10">
                  <Smartphone className="w-5 h-5 text-amber-300 animate-pulse" />
                </div>
                <span className="text-[10px] tracking-wider uppercase text-amber-200/90 font-medium">
                  Swipe Up
                </span>
              </div>
            </div>

            {/* Bouncing Chevrons */}
            <div className="mt-4 flex flex-col items-center text-amber-400/80">
              <ChevronDown className="w-5 h-5 animate-bounce" />
            </div>
          </div>
        </div>

        {/* Minimal Bottom Progress Bar & Percentage Pill */}
        <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between pointer-events-none z-20">
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full backdrop-blur-md bg-stone-900/60 border border-white/10 text-white/80 text-[11px] font-mono shadow-lg">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>DESCENT: {Math.round(scrollProgress * 100)}%</span>
          </div>

          <span className="text-[11px] text-white/50 tracking-widest uppercase hidden sm:inline">
            Reach 100% to enter 3D world
          </span>
        </div>

        {/* Bottom Progress Line */}
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/10 pointer-events-none z-20">
          <div
            className="h-full bg-gradient-to-r from-red-600 via-amber-500 to-amber-300 transition-all duration-75 ease-out"
            style={{ width: `${scrollProgress * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};
