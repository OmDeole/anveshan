import React from 'react';
import { Navigation, Sparkles } from 'lucide-react';
import { WaypointIndicatorData, SanctuaryEventId } from '../types';

interface EventCompassProps {
  waypoints: WaypointIndicatorData[];
  onOpenEvent?: (id: SanctuaryEventId) => void;
}

export const EventCompass: React.FC<EventCompassProps> = ({
  waypoints,
  onOpenEvent,
}) => {
  if (!waypoints || waypoints.length === 0) return null;

  return (
    <div className="pointer-events-none fixed top-3 sm:top-5 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center select-none max-w-[96vw]">
      {/* Top Sanctuary Navigation Bar */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 p-1.5 sm:p-2 rounded-2xl backdrop-blur-xl bg-stone-950/75 border border-white/15 shadow-2xl shadow-black/80 pointer-events-auto">
        {waypoints.map((wp) => {
          const isClose = wp.isNearby;

          return (
            <button
              key={wp.id}
              type="button"
              onClick={() => isClose && onOpenEvent && onOpenEvent(wp.id)}
              className={`group relative flex items-center gap-1.5 sm:gap-2.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl border transition-all duration-200 ${
                isClose
                  ? 'bg-stone-900/90 border-amber-400/80 shadow-lg shadow-amber-500/20 scale-105'
                  : 'bg-stone-900/40 hover:bg-stone-800/60 border-white/10 hover:border-white/25'
              }`}
              title={`${wp.name} - Distance: ${wp.distance}m. ${isClose ? 'Click or press [E] to interact' : 'Navigate in direction of arrow'}`}
            >
              {/* Event Color Orb / Pulse Indicator */}
              <div className="relative flex items-center justify-center">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{
                    backgroundColor: wp.colorHex,
                    boxShadow: `0 0 10px ${wp.colorHex}`,
                  }}
                />
                {isClose && (
                  <span
                    className="absolute w-4 h-4 rounded-full animate-ping opacity-75"
                    style={{ backgroundColor: wp.colorHex }}
                  />
                )}
              </div>

              {/* Event Info */}
              <div className="flex flex-col items-start text-left leading-tight">
                <div className="flex items-center gap-1">
                  <span className="text-[11px] sm:text-xs font-semibold text-white tracking-wide truncate max-w-[70px] sm:max-w-none">
                    {wp.name}
                  </span>
                  <span className="hidden md:inline text-[9px] text-stone-400 font-serif">
                    {wp.kanji}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px]">
                  <span
                    className={`font-mono font-medium ${
                      isClose ? 'text-amber-300 font-bold' : 'text-stone-300'
                    }`}
                  >
                    {isClose ? 'NEARBY' : `${wp.distance}m`}
                  </span>
                  {isClose && (
                    <span className="hidden sm:inline-block px-1 py-0.2 bg-amber-400/20 text-amber-300 rounded text-[9px] font-mono">
                      [E]
                    </span>
                  )}
                </div>
              </div>

              {/* Dynamic Continuous Direction Pointer Arrow */}
              <div
                className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center bg-black/40 border border-white/10 transition-transform duration-100 ease-out"
                style={{
                  transform: `rotate(${wp.relativeAngleDeg}deg)`,
                }}
              >
                {isClose ? (
                  <Sparkles
                    className="w-3.5 h-3.5 animate-pulse"
                    style={{ color: wp.colorHex }}
                  />
                ) : (
                  <Navigation
                    className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current"
                    style={{ color: wp.colorHex }}
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Subtle Directional Hint Caption */}
      <div className="mt-1 px-3 py-0.5 rounded-full bg-stone-950/50 backdrop-blur-sm text-[9px] sm:text-[10px] text-stone-400 tracking-wider flex items-center gap-1.5 opacity-80">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span>Arrows point toward events relative to your view</span>
      </div>
    </div>
  );
};
