import React, { useEffect } from 'react';
import { X, Sparkles, Compass, TrainTrack } from 'lucide-react';

interface TechTreasureHuntProps {
  onClose: () => void;
  onGoToTrainStation?: () => void;
  onRegister?: () => void;
  googleFormUrl?: string;
}

export const TechTreasureHunt: React.FC<TechTreasureHuntProps> = ({
  onClose,
  onGoToTrainStation,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md select-none animate-in fade-in duration-300">
      {/* Event Container Card */}
      <div className="relative w-full max-w-xl max-h-[88dvh] overflow-y-auto bg-stone-900/95 border border-amber-500/40 rounded-3xl p-5 sm:p-8 shadow-2xl shadow-amber-950/50 text-white">
        {/* Ambient Glowing Orbs */}
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
            Event 01 • 殺人鬼の足跡
          </span>
          <span className="text-[10px] font-mono tracking-widest text-stone-400">
            NIGHT SANCTUARY
          </span>
        </div>

        {/* Event Title */}
        <h1 className="text-2xl sm:text-4xl font-light tracking-wide text-white mb-1 flex items-center gap-3">
          <Compass className="w-8 h-8 text-amber-400 shrink-0" />
          <span>The Killer's Trail</span>
        </h1>

        <p className="text-amber-200/70 text-xs sm:text-sm tracking-wider uppercase mb-6 font-mono">
          Sacred Temple Overlook • Waypoint Alpha
        </p>

        {/* Event Overview */}
        <div className="space-y-4 text-stone-300 text-xs sm:text-sm leading-relaxed border-t border-white/10 pt-4">
          <p>
            Welcome to <strong className="text-amber-300">The Killer's Trail</strong>.
            Under the moonlight of Mount Fuji, your investigative team must piece
            together the clues and uncover the truth hidden in the temple grounds.
          </p>
          <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-amber-300 uppercase tracking-wider">Official Registration Open</div>
              <div className="text-[11px] text-stone-300">Squad: 2–4 Detectives • Oct 9, 2026</div>
            </div>
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSddvOgfgO6StxlWagowgGFFZEZB2Gd-QpWSAg3WNch0jOuomw/viewform?pli=1"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-white font-bold text-xs tracking-wider uppercase shadow-lg transition-all active:scale-95 shrink-0 flex items-center gap-2"
            >
              <span>Fill Google Form</span>
              <span>➔</span>
            </a>
          </div>
        </div>

        {/* Footer Navigation Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/10 pt-5">
          {onGoToTrainStation && (
            <button
              type="button"
              onClick={onGoToTrainStation}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-stone-800/90 hover:bg-stone-700/90 border border-amber-500/40 text-amber-300 hover:text-amber-200 font-medium text-xs tracking-wider uppercase transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <TrainTrack className="w-4 h-4 text-amber-400" />
              <span>Back to Train Station</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto ml-auto px-6 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 border border-white/15 text-stone-200 hover:text-white font-medium text-xs tracking-wider uppercase shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Explore Night Sanctuary</span>
          </button>
        </div>
      </div>
    </div>
  );
};
