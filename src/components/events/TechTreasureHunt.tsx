import React, { useEffect } from 'react';
import { X, Sparkles, Compass } from 'lucide-react';

interface TechTreasureHuntProps {
  onClose: () => void;
}

export const TechTreasureHunt: React.FC<TechTreasureHuntProps> = ({ onClose }) => {
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
      <div className="relative w-full max-w-2xl bg-stone-900/90 border border-amber-500/30 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-amber-950/40 text-white overflow-hidden">
        {/* Subtle Ambient Background Glow */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

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
          <span className="text-[10px] font-semibold uppercase tracking-[0.35em] text-amber-400 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30">
            Event 01 • 宝探し
          </span>
        </div>

        {/* Event Name */}
        <h1 className="text-3xl sm:text-4xl font-light tracking-wide text-white mb-2 flex items-center gap-3">
          <Compass className="w-8 h-8 text-amber-400" />
          <span>Tech Treasure Hunt</span>
        </h1>

        <p className="text-amber-200/70 text-sm tracking-wider uppercase mb-6 font-mono">
          Mount Fuji Sanctuary • Waypoint Alpha
        </p>

        {/* Content Section - You can easily edit or replace this content */}
        <div className="space-y-4 text-stone-300 text-sm leading-relaxed border-t border-white/10 pt-6">
          <p className="text-stone-300">
            Welcome to the <strong className="text-amber-400">Tech Treasure Hunt</strong>.
          </p>
          <div className="p-4 rounded-2xl bg-stone-950/60 border border-white/10 text-stone-300">
            <p className="text-xs text-stone-400 italic">
              {/* EDIT YOUR EVENT CONTENT HERE */}
              Put your challenge instructions, clues, riddles, or interactive content for Tech Treasure Hunt right here in this file.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-medium text-xs tracking-wider uppercase shadow-lg shadow-amber-950/50 transition-all active:scale-95 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Return to Sanctuary</span>
          </button>
        </div>
      </div>
    </div>
  );
};
