import React, { useEffect } from 'react';
import { X, Sparkles, LampFloor, TrainTrack, ArrowRight } from 'lucide-react';

interface LogicLampsProps {
  onClose: () => void;
  onGoToTrainStation?: () => void;
  googleFormUrl?: string;
  onRegister?: () => void;
}

export const LogicLamps: React.FC<LogicLampsProps> = ({
  onClose,
  onGoToTrainStation,
  googleFormUrl,
  onRegister,
}) => {
  // Allow closing with Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md select-none animate-in fade-in duration-300">
      {/* Event Container Card */}
      <div className="relative w-full max-w-2xl bg-stone-900/95 border border-emerald-500/30 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-emerald-950/40 text-white overflow-hidden">
        {/* Subtle Ambient Background Glow */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-2xl bg-white/5 hover:bg-white/15 border border-white/10 text-white/80 hover:text-white transition-all active:scale-95 shadow-md"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Event Header */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-semibold uppercase tracking-[0.35em] text-emerald-300 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30">
            EVENT 03 • 論理灯
          </span>
        </div>

        {/* Event Name */}
        <h1 className="text-3xl sm:text-4xl font-light tracking-wide text-white mb-2 flex items-center gap-3">
          <LampFloor className="w-8 h-8 text-emerald-400" />
          <span>Logic Lamps</span>
        </h1>

        <p className="text-emerald-200/70 text-xs sm:text-sm tracking-wider uppercase mb-5 font-mono">
          CHUREITO PAGODA STEPS • WAYPOINT GAMMA
        </p>

        {/* Event Overview & Registration */}
        <div className="space-y-5 text-stone-300 text-sm leading-relaxed border-t border-white/10 pt-5">
          <p className="text-stone-300 text-sm leading-relaxed">
            Welcome to <strong className="text-emerald-400">Logic Lamps</strong>. Inspired by the classical Japanese paper lantern guiding scholars through the mist, Logic Lamp tests the purest heights of your algorithmic intuition across multi-tiered speed deduction rounds.
          </p>

          {/* Registration Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                OFFICIAL REGISTRATION OPEN
              </p>
              <p className="text-xs text-stone-300 mt-1 font-medium">
                2 Scholars • Oct 9, 2026
              </p>
            </div>

            <a
              href={googleFormUrl || '#'}
              target={googleFormUrl ? '_blank' : undefined}
              rel="noopener noreferrer"
              onClick={(e) => {
                if (!googleFormUrl) {
                  e.preventDefault();
                  if (onRegister) onRegister();
                }
              }}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs tracking-wider uppercase shadow-lg shadow-emerald-950/50 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <span>FILL GOOGLE FORM</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/10 pt-5">
          {onGoToTrainStation && (
            <button
              type="button"
              onClick={onGoToTrainStation}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-stone-800/90 hover:bg-stone-700/90 border border-emerald-500/40 text-emerald-300 hover:text-emerald-200 font-medium text-xs tracking-wider uppercase transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <TrainTrack className="w-4 h-4 text-emerald-400" />
              <span>Back to Train Station</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto ml-auto px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs tracking-wider uppercase shadow-lg shadow-emerald-950/50 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-stone-950" />
            <span>Explore Sanctuary</span>
          </button>
        </div>
      </div>
    </div>
  );
};
