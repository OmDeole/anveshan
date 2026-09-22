import React, { useEffect } from 'react';
import { X, Sparkles, LampFloor, TrainTrack } from 'lucide-react';

interface LogicLampsProps {
  onClose: () => void;
  onGoToTrainStation?: () => void;
}

export const LogicLamps: React.FC<LogicLampsProps> = ({ onClose, onGoToTrainStation }) => {
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
      <div className="relative w-full max-w-2xl max-h-[88dvh] overflow-y-auto bg-stone-900/90 border border-emerald-500/30 rounded-3xl p-5 sm:p-10 shadow-2xl shadow-emerald-950/40 text-white">
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
            Event 03 • 論理灯
          </span>
        </div>

        {/* Event Name */}
        <h1 className="text-3xl sm:text-4xl font-light tracking-wide text-white mb-2 flex items-center gap-3">
          <LampFloor className="w-8 h-8 text-emerald-400" />
          <span>Logic Lamps</span>
        </h1>

        <p className="text-emerald-200/70 text-sm tracking-wider uppercase mb-6 font-mono">
          Chureito Pagoda Steps • Waypoint Gamma
        </p>

        {/* Content Section */}
        <div className="space-y-4 text-stone-300 text-sm leading-relaxed border-t border-white/10 pt-6">
          <p className="text-stone-300">
            Welcome to <strong className="text-emerald-300">Logic Lamps</strong>.
            Inspired by the classical Japanese paper lantern guiding scholars through the mist, Logic Lamp tests the purest heights of your algorithmic intuition across multi-tiered speed deduction rounds.
          </p>
          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">Official Registration Open</div>
              <div className="text-[11px] text-stone-300">Squad: 1–2 Scholars • Oct 9, 2026</div>
            </div>
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSeCN64GEVrk_d34N0PEKvlO6zRV9kdN1zuwpCVXX_HOoT2J1A/viewform"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs tracking-wider uppercase shadow-lg transition-all active:scale-95 shrink-0 flex items-center gap-2"
            >
              <span>Fill Google Form</span>
              <span>➔</span>
            </a>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/10 pt-6">
          {onGoToTrainStation && (
            <button
              type="button"
              onClick={onGoToTrainStation}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-stone-800/90 hover:bg-stone-700/90 border border-emerald-500/40 text-emerald-300 hover:text-emerald-200 font-medium text-xs tracking-wider uppercase transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <TrainTrack className="w-4 h-4 text-emerald-400" />
              <span>Back to Train Station</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto ml-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-xs tracking-wider uppercase shadow-lg shadow-emerald-950/50 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Explore Sanctuary</span>
          </button>
        </div>
      </div>
    </div>
  );
};
