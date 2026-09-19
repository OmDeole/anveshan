/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from './game/GameEngine';
import { VirtualJoystick } from './components/VirtualJoystick';
import { GameHUD } from './components/GameHUD';
import { IntroScrollCinematic } from './components/IntroScrollCinematic';
import { SanctuaryEventId, WaypointIndicatorData } from './types';
import { SANCTUARY_EVENTS } from './game/Environment';
import { TechTreasureHunt } from './components/events/TechTreasureHunt';
import { Promptify } from './components/events/Promptify';
import { LogicLamps } from './components/events/LogicLamps';
import { EventCompass } from './components/EventCompass';

type AppPhase = 'cinematic' | 'game';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Initial phase: living cinematic intro & scroll scrubbing
  const [currentPhase, setCurrentPhase] = useState<AppPhase>('cinematic');
  const [isSprinting, setIsSprinting] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Active Sanctuary Event Modal ('tech-treasure-hunt' | 'promptify' | 'logic-lamps' | null)
  const [activeEvent, setActiveEvent] = useState<SanctuaryEventId | null>(null);
  const [nearbyEvent, setNearbyEvent] = useState<SanctuaryEventId | null>(null);
  const [waypoints, setWaypoints] = useState<WaypointIndicatorData[]>([]);


  // Transition from cinematic scroll to 3D game
  const handleCinematicComplete = () => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    setCurrentPhase('game');
  };

  const handleCloseEvent = () => {
    setActiveEvent(null);
    if (engineRef.current) {
      engineRef.current.setEventModalOpen(false);
    }
  };

  const handleOpenNearbyEvent = () => {
    if (nearbyEvent) {
      setActiveEvent(nearbyEvent);
      if (engineRef.current) {
        engineRef.current.setEventModalOpen(true);
      }
    }
  };

  // Keyboard shortcut 'KeyE' to open nearby event if closed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.code === 'KeyE' || e.key === 'e' || e.key === 'E') && nearbyEvent && !activeEvent) {
        handleOpenNearbyEvent();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nearbyEvent, activeEvent]);

  // Initialize 3D game engine ONLY after the scroll cinematic completes
  useEffect(() => {
    if (currentPhase !== 'game' || !containerRef.current) return;

    setIsLoading(true);

    // Initialize 3D WebGL engine
    const engine = new GameEngine(containerRef.current);
    engineRef.current = engine;

    // Connect waypoint event handlers
    engine.onEventTriggered = (eventId) => {
      setActiveEvent(eventId);
      engine.setEventModalOpen(true);
    };

    engine.onNearEventChanged = (eventId) => {
      setNearbyEvent(eventId);
    };

    engine.onWaypointsUpdate = (data) => {
      setWaypoints(data);
    };

    setIsLoading(false);

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [currentPhase]);

  // Joystick move handler
  const handleJoystickMove = (x: number, y: number) => {
    if (engineRef.current) {
      engineRef.current.setJoystickVector(x, y);
    }
  };

  // Jump handler
  const handleJump = () => {
    if (engineRef.current) {
      engineRef.current.triggerJump();
    }
  };

  // Sprint toggle handler
  const handleSprintToggle = (sprint: boolean) => {
    setIsSprinting(sprint);
    if (engineRef.current) {
      engineRef.current.setSprint(sprint);
    }
  };

  // Camera recenter handler
  const handleResetCamera = () => {
    if (engineRef.current) {
      engineRef.current.resetCameraBehind();
    }
  };

  return (
    <div className="relative w-screen min-h-screen bg-stone-950 font-sans select-none">
      {/* 1. Living Cinematic Experience:
          - Plays intro video continuously
          - At 14s, displays subtle, non-intrusive bottom prompt
          - Loops scenic footage 14s -> 23s without pause if user hasn't scrolled yet
          - Seamlessly scrubs scroll frames upon user scroll gesture
      */}
      {currentPhase === 'cinematic' && (
        <IntroScrollCinematic onComplete={handleCinematicComplete} />
      )}

      {/* 2. Full 3D Game World & Canvas (Mounts after completing scroll) */}
      {currentPhase === 'game' && (
        <div className="fixed inset-0 w-screen h-screen overflow-hidden touch-none select-none">
          {/* 3D WebGL Canvas Container */}
          <div
            id="game-canvas-container"
            ref={containerRef}
            className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
          />

          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-950 text-white z-50">
              <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm tracking-widest text-stone-300 uppercase">Constructing Sanctuary...</p>
            </div>
          )}

          {/* Continuous Event Direction Compass HUD */}
          {!isLoading && !activeEvent && (
            <EventCompass
              waypoints={waypoints}
              onOpenEvent={(id) => {
                setActiveEvent(id);
                if (engineRef.current) {
                  engineRef.current.setEventModalOpen(true);
                }
              }}
            />
          )}

          {/* Overlay HUD (Camera controls, background audio on/off, fullscreen) */}
          <GameHUD onResetCamera={handleResetCamera} isSprinting={isSprinting} />

          {/* Virtual Joystick & Action Buttons */}
          <VirtualJoystick
            onMove={handleJoystickMove}
            onJump={handleJump}
            onSprintToggle={handleSprintToggle}
            isSprinting={isSprinting}
          />

          {/* Proximity Interaction Prompt (when close to a waypoint and modal is closed) */}
          {nearbyEvent && !activeEvent && (
            <div className="absolute top-24 sm:top-28 left-1/2 -translate-x-1/2 z-40 animate-bounce pointer-events-auto">
              <button
                type="button"
                onClick={handleOpenNearbyEvent}
                className="px-5 py-2.5 rounded-full bg-stone-900/90 border border-amber-400/50 text-white shadow-xl shadow-black/50 backdrop-blur-md flex items-center gap-2.5 text-xs sm:text-sm font-medium tracking-wide hover:bg-stone-800 transition-all active:scale-95"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                <span>
                  {SANCTUARY_EVENTS.find((e) => e.id === nearbyEvent)?.name || 'Event'}
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-stone-300 font-mono">
                  [E]
                </span>
              </button>
            </div>
          )}


          {/* Active Sanctuary Event Modal Pages */}
          {activeEvent === 'tech-treasure-hunt' && (
            <TechTreasureHunt onClose={handleCloseEvent} />
          )}
          {activeEvent === 'promptify' && (
            <Promptify onClose={handleCloseEvent} />
          )}
          {activeEvent === 'logic-lamps' && (
            <LogicLamps onClose={handleCloseEvent} />
          )}
        </div>
      )}
    </div>
  );
}
