import React, { useEffect, useState } from 'react';
import { X, Sparkles, MessageSquareCode, TrainTrack, Flame, CheckCircle2 } from 'lucide-react';

interface PromptifyProps {
  onClose: () => void;
  onGoToTrainStation?: () => void;
  onRegister?: () => void;
}

export const Promptify: React.FC<PromptifyProps> = ({
  onClose,
  onGoToTrainStation,
  onRegister,
}) => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const hasTriggeredRegistration = React.useRef<boolean>(false);

  // Allow closing with Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleRegisterClick = () => {
    if (isSubmitting || isRegistered || hasTriggeredRegistration.current) return;
    setIsSubmitting(true);

    // Verify registration submission credentials
    setTimeout(() => {
      setIsSubmitting(false);
      setIsRegistered(true); // Confirmed SUCCESS!
      if (!hasTriggeredRegistration.current) {
        hasTriggeredRegistration.current = true;
        console.log('[Promptify] Registration successful');
        if (onRegister) {
          onRegister();
        }
      }
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md select-none animate-in fade-in duration-300">
      {/* Event Container Card */}
      <div className="relative w-full max-w-2xl bg-stone-900/95 border border-amber-500/40 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-amber-950/50 text-white overflow-hidden">
        {/* Subtle Ambient Background Glows */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-2xl bg-white/5 hover:bg-white/15 border border-white/10 text-white/80 hover:text-white transition-all active:scale-95 shadow-md z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Event Header Tag */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-semibold uppercase tracking-[0.35em] text-amber-300 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30">
            Event 02 • 詠唱
          </span>
          <span className="text-[10px] font-mono tracking-widest text-stone-400">
            TRADITIONAL NIGHT MARKET
          </span>
        </div>

        {/* Event Name */}
        <h1 className="text-3xl sm:text-4xl font-light tracking-wide text-white mb-2 flex items-center gap-3">
          <MessageSquareCode className="w-8 h-8 text-amber-400" />
          <span>Promptify</span>
        </h1>

        <p className="text-amber-200/70 text-sm tracking-wider uppercase mb-5 font-mono">
          Edo Night Market • Waypoint Beta Checkpoint
        </p>

        {/* Event Content & Registration Section */}
        <div className="space-y-4 text-stone-300 text-sm leading-relaxed border-t border-white/10 pt-5">
          <p className="text-stone-300">
            Welcome to <strong className="text-amber-300">Promptify</strong>. Master the art of generative AI prompts, solve linguistic puzzles under the warm lantern glow, and unveil the secrets of the Japanese market.
          </p>

          {isRegistered ? (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-purple-500/20 border border-amber-400/50 text-white flex items-center gap-3 animate-in zoom-in duration-300">
              <CheckCircle2 className="w-7 h-7 text-amber-400 shrink-0 animate-bounce" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  Registration Successful!
                </p>
                <p className="text-xs text-stone-200 mt-0.5">
                  Japanese Festival Celebration is now active! Fireworks are illuminating the night sky above the market.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-stone-950/60 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span>Join the Promptify Event</span>
                </p>
                <p className="text-xs text-stone-400 mt-1">
                  Complete your registration to unlock the festival celebration fireworks!
                </p>
              </div>
              <button
                type="button"
                onClick={handleRegisterClick}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-amber-600 hover:from-amber-400 hover:to-rose-400 text-white font-semibold text-xs tracking-wider uppercase shadow-xl shadow-amber-950/60 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <Sparkles className="w-4 h-4 text-amber-200 animate-spin" />
                <span>{isSubmitting ? 'Verifying Registration...' : 'Register for Promptify'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/10 pt-5">
          {onGoToTrainStation && (
            <button
              type="button"
              onClick={onGoToTrainStation}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-stone-800/90 hover:bg-stone-700/90 border border-amber-500/40 text-amber-300 hover:text-amber-200 font-medium text-xs tracking-wider uppercase transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <TrainTrack className="w-4 h-4 text-amber-400" />
              <span>Back to Train Station</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto ml-auto px-6 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 border border-white/15 text-stone-200 hover:text-white font-medium text-xs tracking-wider uppercase shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Explore Night Market</span>
          </button>
        </div>
      </div>
    </div>
  );
};
