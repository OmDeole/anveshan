import React, { useEffect } from 'react';
import { X, Sparkles, MessageSquareCode } from 'lucide-react';

interface PromptifyProps {
  onClose: () => void;
}

export const Promptify: React.FC<PromptifyProps> = ({ onClose }) => {
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
      <div className="relative w-full max-w-2xl bg-stone-900/90 border border-purple-500/30 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-purple-950/40 text-white overflow-hidden">
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

        {/* Content Section - You can easily edit or replace this content */}
        <div className="space-y-4 text-stone-300 text-sm leading-relaxed border-t border-white/10 pt-6">
          <p className="text-stone-300">
            Welcome to <strong className="text-purple-300">Promptify</strong>.
          </p>
          <div className="p-4 rounded-2xl bg-stone-950/60 border border-white/10 text-stone-300">
            <p className="text-xs text-stone-400 italic">
              {/* EDIT YOUR EVENT CONTENT HERE */}
              Put your prompt engineering challenges, AI creativity tasks, or guidelines for Promptify right here in this file.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-medium text-xs tracking-wider uppercase shadow-lg shadow-purple-950/50 transition-all active:scale-95 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Return to Sanctuary</span>
          </button>
        </div>
      </div>
    </div>
  );
};
