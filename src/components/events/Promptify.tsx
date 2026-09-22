import React, { useEffect } from 'react';
import { X, Sparkles, MessageSquareCode, TrainTrack } from 'lucide-react';

interface PromptifyProps {
  onClose: () => void;
  onGoToTrainStation?: () => void;
}

export const Promptify: React.FC<PromptifyProps> = ({ onClose, onGoToTrainStation }) => {
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
      <div className="relative w-full max-w-2xl max-h-[88dvh] overflow-y-auto bg-stone-900/90 border border-purple-500/30 rounded-3xl p-5 sm:p-10 shadow-2xl shadow-purple-950/40 text-white">
        {/* Subtle Ambient Background Glow */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />

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
          <span className="text-[10px] font-semibold uppercase tracking-[0.35em] text-purple-300 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30">
            Event 02 • 詠唱
          </span>
        </div>

        {/* Event Name */}
        <h1 className="text-3xl sm:text-4xl font-light tracking-wide text-white mb-2 flex items-center gap-3">
          <MessageSquareCode className="w-8 h-8 text-purple-400" />
          <span>Promptify</span>
        </h1>

        <p className="text-purple-200/70 text-sm tracking-wider uppercase mb-6 font-mono">
          Sakura Grove Sanctuary • Waypoint Beta
        </p>

        {/* Content Section */}
        <div className="space-y-4 text-stone-300 text-sm leading-relaxed border-t border-white/10 pt-6">
          <p className="text-stone-300">
            Welcome to <strong className="text-purple-300">Promptify</strong>.
            Harness the power of Kotodama (言霊) — the spiritual energy of words — in the ultimate generative AI battleground. Prompt engineers and creative technologists compete in rapid-fire sprints.
          </p>
          <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-purple-300 uppercase tracking-wider">Official Registration Open</div>
              <div className="text-[11px] text-stone-300">Squad: 1–3 Artisans • Oct 10, 2026</div>
            </div>
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSfsNwliV1DRE4bFFaH95I_2Yz9NINxNOG9ojTssRwyVAbPiJg/viewform"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs tracking-wider uppercase shadow-lg transition-all active:scale-95 shrink-0 flex items-center gap-2"
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
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-stone-800/90 hover:bg-stone-700/90 border border-purple-500/40 text-purple-300 hover:text-purple-200 font-medium text-xs tracking-wider uppercase transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <TrainTrack className="w-4 h-4 text-purple-400" />
              <span>Back to Train Station</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto ml-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-medium text-xs tracking-wider uppercase shadow-lg shadow-purple-950/50 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Explore Sanctuary</span>
          </button>
        </div>
      </div>
    </div>
  );
};
