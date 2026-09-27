import React from 'react';
import { TeamSectionData } from '../data/teamData';
import { TeamCategory } from './TeamCategory';
import fujiPagodaImg from '../assets/fuji_pagoda.png';

interface TeamSectionProps {
  section: TeamSectionData;
  isFirst?: boolean;
}

/**
 * TeamSection Component
 * Renders a major event section (THE KILLER'S TRAIL, LOGIC LAMPS, PROMPTIFY, or JAPANESE FUJI SECTION)
 * Highlights:
 * - Distinctive stylish display font (Cinzel) for major heading
 * - Subtitle & Kanji tags
 * - Image 2 background integration for the Japanese Fuji/Pagoda section
 * - Gothic architecture & purple nebula treatment for standard sections matching Image 1
 */
export const TeamSection: React.FC<TeamSectionProps> = ({ section, isFirst = false }) => {
  const isFujiSection = section.backgroundType === 'fuji-pagoda';

  return (
    <section
      id={section.id}
      className={`relative w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-pink-900/20 overflow-hidden ${
        isFujiSection ? 'bg-rose-950/20' : ''
      }`}
    >
      {/* 1. Backdrop Overlays */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-rose-500/10 rounded-full blur-[130px]" />
        <div className="absolute -bottom-10 right-1/4 w-[400px] h-[300px] bg-pink-500/10 rounded-full blur-[110px]" />
      </div>

      {/* 2. Main Section Content */}
      <div className="relative z-10 max-w-6xl mx-auto flex flex-col items-center">
        {/* Japanese Kanji Accent & Event Tag */}
        <div className="flex items-center gap-2.5 mb-3">
          {section.kanji && (
            <span className="text-xs font-serif font-bold text-pink-300 tracking-widest px-2.5 py-0.5 rounded bg-pink-500/15 border border-pink-400/30 shadow-sm">
              {section.kanji}
            </span>
          )}
          {section.tagline && (
            <span className="text-[11px] sm:text-xs font-mono tracking-widest text-pink-200/80 uppercase">
              {section.tagline}
            </span>
          )}
        </div>

        {/* Distinctive Major Heading (Same majestic Cinzel font across all sections) */}
        <h2 className="team-display-font text-3xl sm:text-5xl md:text-6xl font-extrabold uppercase tracking-[0.16em] sm:tracking-[0.22em] text-center text-white drop-shadow-[0_0_25px_rgba(244,114,182,0.45)] transition-all">
          {section.title}
        </h2>

        {/* Decorative Golden/Pink divider */}
        <div className="w-24 sm:w-36 h-[2px] mt-4 mb-8 bg-gradient-to-r from-transparent via-pink-400/80 to-transparent" />

        {/* Categories Stacked Vertically (TY COORDINATOR, SY COORDINATOR, MEMBERS) */}
        <div className="w-full space-y-4 sm:space-y-6">
          {section.categories.map((category) => (
            <TeamCategory key={category.id} category={category} />
          ))}
        </div>
      </div>
    </section>
  );
};
