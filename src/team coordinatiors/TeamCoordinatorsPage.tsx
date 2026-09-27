import React, { useEffect } from 'react';
import { TEAM_SECTIONS_DATA } from './data/teamData';
import { TeamSection } from './components/TeamSection';
import { TeamNavbar } from './components/TeamNavbar';
import { ArrowUp, Sparkles } from 'lucide-react';
import fujiPagodaImg from './assets/fuji_pagoda.png';
import './styles/teamCoordinators.css';

interface TeamCoordinatorsPageProps {
  onBackToMain?: () => void;
}

/**
 * Isolated Team Coordinators Showcase Page
 * - Built completely inside the dedicated 'team coordinatiors' folder
 * - Does not alter, overwrite, or break existing website pages
 * - Uses uploaded Image 2 (Mount Fuji, Chureito Pagoda, Cherry Blossoms) as the stunning cinematic background
 * - Matches the visual language of Reference Image 1 (purple glow rings, lime-yellow names, bold white category headings)
 */
export const TeamCoordinatorsPage: React.FC<TeamCoordinatorsPageProps> = ({ onBackToMain }) => {
  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.title = 'Team Coordinators | Anveshan 2026';
    return () => {
      document.title = 'Samurai Mountain Adventure';
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="team-page-container relative min-h-screen w-full bg-[#05020a] text-white selection:bg-pink-600 selection:text-white overflow-x-hidden">
      {/* 0. Fixed Cinematic Background with Image 2 (Mount Fuji, Chureito Pagoda, Cherry Blossoms) */}
      <div className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden">
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center sm:bg-[center_top]"
          style={{
            backgroundImage: `url(${fujiPagodaImg})`,
          }}
        />
        {/* Clean, subtle neutral tint so the authentic pink sky, Mount Fuji, and Pagoda remain vibrant and visible */}
        <div className="absolute inset-0 bg-black/25" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
      </div>

      {/* 1. Top Navigation Bar */}
      <TeamNavbar onBackToMain={onBackToMain} />

      {/* 2. Grand Hero Introduction */}
      <div className="relative z-10 pt-28 sm:pt-36 pb-12 sm:pb-16 px-4 text-center overflow-hidden">
        {/* Ambient atmospheric sakura glows */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-pink-500/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute -top-10 left-1/3 w-[300px] h-[200px] bg-rose-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-950/60 border border-pink-400/40 text-pink-200 text-xs font-mono tracking-widest uppercase mb-4 shadow-lg backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" />
            <span>Anveshan 2026 • 探求の導き手</span>
          </div>

          <h1 className="team-display-font text-4xl sm:text-6xl md:text-7xl font-extrabold uppercase tracking-[0.14em] sm:tracking-[0.2em] text-white drop-shadow-[0_0_35px_rgba(244,114,182,0.6)]">
            TEAM COORDINATORS
          </h1>

          <p className="mt-4 text-sm sm:text-base text-zinc-200 max-w-xl mx-auto font-light tracking-wide leading-relaxed drop-shadow-md">
            The visionary minds, coordinators, and passionate team members shaping the sanctuary events, algorithmic trials, and AI challenges.
          </p>
        </div>
      </div>

      {/* 3. Major Team Sections Stacked Vertically */}
      <main className="w-full">
        {TEAM_SECTIONS_DATA.map((section, idx) => (
          <TeamSection key={section.id} section={section} isFirst={idx === 0} />
        ))}
      </main>

      {/* 4. Page Footer */}
      <footer className="w-full py-12 px-4 bg-black/60 backdrop-blur-md border-t border-pink-900/30 text-center relative z-10">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:text-left">
            <span className="team-display-font font-bold tracking-widest text-white text-base">
              ANVESHAN 2026
            </span>
            <span className="text-xs text-pink-200/60 mt-1">
              Crafted with excellence by the Organizing Committee.
            </span>
          </div>

          <button
            type="button"
            onClick={scrollToTop}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-950/50 hover:bg-rose-900/70 border border-pink-800/40 text-xs text-pink-200 hover:text-white transition-all active:scale-95 shadow-lg cursor-pointer"
          >
            <span>Back to Top</span>
            <ArrowUp className="w-3.5 h-3.5 text-pink-300" />
          </button>
        </div>
      </footer>
    </div>
  );
};
