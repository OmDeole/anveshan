import React, { useState } from 'react';
import { Menu, X, ArrowLeft, Moon, Sparkles } from 'lucide-react';

interface TeamNavbarProps {
  onBackToMain?: () => void;
}

/**
 * Top Header Navigation Bar
 * Directly inspired by Image 1:
 * - "ANVESHAN" logo with glowing crescent moon motif
 * - Section jump anchors (Killer's Trail, Logic Lamps, Promptify, Core)
 * - Return to Main 3D Experience button
 * - Clean mobile menu drawer
 */
export const TeamNavbar: React.FC<TeamNavbarProps> = ({ onBackToMain }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const navLinks = [
    { label: "Killer's Trail", href: '#killers-trail' },
    { label: 'Logic Lamps', href: '#logic-lamps' },
    { label: 'Promptify', href: '#promptify' },
  ];

  const handleReturn = () => {
    if (onBackToMain) {
      onBackToMain();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0d040f]/80 backdrop-blur-md border-b border-pink-500/20 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
        {/* 1. Left Logo matching Image 1 */}
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-rose-600 via-pink-500 to-amber-300 p-[1.5px] shadow-[0_0_15px_rgba(244,114,182,0.45)] flex items-center justify-center">
            <div className="w-full h-full rounded-full bg-[#130412] flex items-center justify-center">
              <Moon className="w-5 h-5 text-amber-300 fill-amber-300/40" />
            </div>
            <Sparkles className="absolute -top-1 -right-1 w-3.5 h-3.5 text-amber-300 animate-spin" />
          </div>

          <div className="flex flex-col">
            <span className="font-extrabold tracking-[0.25em] text-white text-base sm:text-lg font-serif">
              ANVESHAN
            </span>
            <span className="text-[9px] font-mono tracking-widest text-pink-300/80 -mt-1 hidden sm:inline">
              EVENT COORDINATORS 2026
            </span>
          </div>
        </div>

        {/* 2. Desktop Navigation Anchors */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-xs uppercase tracking-widest text-zinc-300 hover:text-pink-300 transition-colors font-medium"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* 3. Action Buttons & Mobile Hamburger */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleReturn}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-pink-500/40 text-pink-200 hover:text-white text-xs font-mono tracking-wider transition-all active:scale-95 shadow-md cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-pink-300" />
            <span className="hidden xs:inline">Main Website</span>
          </button>

          {/* Mobile hamburger icon matching Image 1 */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* 4. Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0e0310]/95 border-b border-pink-800/40 px-6 py-4 space-y-3 backdrop-blur-xl animate-in slide-in-from-top-4 duration-200">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm uppercase tracking-widest text-zinc-200 hover:text-pink-300 font-medium border-b border-white/5"
            >
              {link.label}
            </a>
          ))}
        </div>
      )}
    </header>
  );
};
