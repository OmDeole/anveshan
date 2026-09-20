/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { TrainTrack } from 'lucide-react';
import { GameEngine } from './game/GameEngine';
import { VirtualJoystick } from './components/VirtualJoystick';
import { GameHUD } from './components/GameHUD';
import { IntroScrollCinematic } from './components/IntroScrollCinematic';
import { SanctuaryEventId, WaypointIndicatorData, TrainData, TrainId } from './types';
import { SANCTUARY_EVENTS } from './game/Environment';
import { STATION_TRAINS } from './game/MountainStationEnvironment';
import { TechTreasureHunt } from './components/events/TechTreasureHunt';
import { Promptify } from './components/events/Promptify';
import { LogicLamps } from './components/events/LogicLamps';
import { EventCompass } from './components/EventCompass';
import { TrainBoardingCinematic } from './components/TrainBoardingCinematic';

type AppPhase = 'cinematic' | 'mountain-station' | 'boarding' | 'temple';

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
  const [nearbyTrain, setNearbyTrain] = useState<TrainData | null>(null);
  const [waypoints, setWaypoints] = useState<WaypointIndicatorData[]>([]);
  const [isNearStationPortal, setIsNearStationPortal] = useState<boolean>(false);
  const [boardingTrain, setBoardingTrain] = useState<TrainData | null>(null);

  // Transition from cinematic scroll to 3D mountain station game
  const handleCinematicComplete = () => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    setCurrentPhase('mountain-station');
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

  // Option to return to Train Station to board other trains
  const handleGoToTrainStation = () => {
    setActiveEvent(null);
    setIsNearStationPortal(false);
    setCurrentPhase('mountain-station');
    if (engineRef.current) {
      engineRef.current.setEventModalOpen(false);
      engineRef.current.switchEnvironment('mountain-station', true); // spawn directly at station concourse
    }
  };

  const handleBoardTrain = (trainId: TrainId) => {
    const selected = STATION_TRAINS.find((t) => t.id === trainId) || STATION_TRAINS[0];
    setBoardingTrain(selected);
    setCurrentPhase('boarding');
    if (engineRef.current) {
      engineRef.current.setEventModalOpen(true);
    }
  };

  const handleRegisterKillersTrail = () => {
    // Ring the sacred Bonshō temple bells in the 3D sanctuary
    if (engineRef.current) {
      engineRef.current.ringTempleBells();
    }
  };

  const handleBoardingComplete = () => {
    setCurrentPhase('temple');
    setNearbyTrain(null);
    if (engineRef.current) {
      engineRef.current.setEventModalOpen(false);
      // When the user boards the train of the killer's trail, remove the other two events from the temple!
      let activeEventsForTrain: SanctuaryEventId[] = ['tech-treasure-hunt'];
      if (boardingTrain?.id === 'arya') {
        activeEventsForTrain = ['promptify'];
      } else if (boardingTrain?.id === 'sandip') {
        activeEventsForTrain = ['logic-lamps'];
      }
      engineRef.current.switchEnvironment('temple', false, activeEventsForTrain);
    }
  };

  // Keyboard shortcut 'KeyE' to interact with nearby train, nearby event, or return-to-station portal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.code === 'KeyE' || e.key === 'e' || e.key === 'E') && !activeEvent) {
        if (currentPhase === 'mountain-station' && nearbyTrain) {
          handleBoardTrain(nearbyTrain.id);
        } else if (currentPhase === 'temple') {
          if (isNearStationPortal) {
            handleGoToTrainStation();
          } else if (nearbyEvent) {
            handleOpenNearbyEvent();
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPhase, nearbyTrain, nearbyEvent, activeEvent, isNearStationPortal]);

  // Initialize 3D game engine ONCE and keep it alive.
  // Only destroy when leaving to 'cinematic' (unmount scenario).
  // 'boarding' phase keeps the engine running behind the cutscene.
  useEffect(() => {
    // Skip during cinematic, boarding, and if container isn't ready
    if (currentPhase === 'cinematic' || currentPhase === 'boarding' || !containerRef.current) return;
    if (engineRef.current) return; // already initialized — engine stays alive across boarding

    setIsLoading(true);

    // Initialize 3D WebGL engine in appropriate environment
    const initialEnv = currentPhase === 'temple' ? 'temple' : 'mountain-station';
    const engine = new GameEngine(containerRef.current, initialEnv);
    engineRef.current = engine;

    // Connect waypoint and train event handlers
    engine.onEventTriggered = (eventId) => {
      setActiveEvent(eventId);
      engine.setEventModalOpen(true);
    };

    engine.onNearEventChanged = (eventId) => {
      setNearbyEvent(eventId);
    };

    engine.onNearTrainChanged = (train) => {
      setNearbyTrain(train);
    };

    engine.onNearStationPortalChanged = (isNear) => {
      setIsNearStationPortal(isNear);
    };

    engine.onBoardTrain = (trainId) => {
      handleBoardTrain(trainId);
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

      {/* 2. Train Boarding Cutscene (Overlaid on top when boarding Train) */}
      {currentPhase === 'boarding' && (
        <TrainBoardingCinematic
          train={boardingTrain}
          videoSrc="/train_transition.mp4"
          onComplete={handleBoardingComplete}
        />
      )}

      {/* 3. Full 3D Game World & Canvas (Kept continuously mounted so WebGL engine never dies) */}
      {currentPhase !== 'cinematic' && (
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
              <p className="text-sm tracking-widest text-stone-300 uppercase">
                {currentPhase === 'mountain-station' ? 'Entering Fujimi Mountain Ridge...' : 'Entering Sacred Sanctuary...'}
              </p>
            </div>
          )}

          {/* Continuous Event & Train Direction Compass HUD (hidden during cutscene) */}
          {!isLoading && !activeEvent && currentPhase !== 'boarding' && (
            <EventCompass
              waypoints={waypoints}
              onOpenEvent={(id) => {
                if (currentPhase === 'mountain-station') {
                  if (id === 'tech-treasure-hunt') handleBoardTrain('om');
                  else if (id === 'promptify') handleBoardTrain('arya');
                  else if (id === 'logic-lamps') handleBoardTrain('sandip');
                } else {
                  setActiveEvent(id);
                  if (engineRef.current) {
                    engineRef.current.setEventModalOpen(true);
                  }
                }
              }}
            />
          )}

          {/* Overlay HUD (Go to train station, Camera controls, background audio on/off, fullscreen - hidden during cutscene) */}
          {currentPhase !== 'boarding' && (
            <GameHUD
              onResetCamera={handleResetCamera}
              isSprinting={isSprinting}
              onGoToTrainStation={handleGoToTrainStation}
              currentPhase={currentPhase === 'temple' ? 'temple' : 'mountain-station'}
            />
          )}

          {/* Virtual Joystick & Action Buttons (hidden during cutscene) */}
          {currentPhase !== 'boarding' && (
            <VirtualJoystick
              onMove={handleJoystickMove}
              onJump={handleJump}
              onSprintToggle={handleSprintToggle}
              isSprinting={isSprinting}
            />
          )}

          {/* Mountain Station: Train Proximity Prompt */}
          {currentPhase === 'mountain-station' && nearbyTrain && !activeEvent && (
            <div className="absolute top-24 sm:top-28 left-1/2 -translate-x-1/2 z-40 animate-bounce pointer-events-auto">
              <button
                type="button"
                onClick={() => handleBoardTrain(nearbyTrain.id)}
                className="px-5 py-2.5 rounded-full bg-stone-900/95 border border-rose-500/60 text-white shadow-2xl shadow-rose-950/70 backdrop-blur-md flex items-center gap-2.5 text-xs sm:text-sm font-medium tracking-wide hover:bg-stone-800 transition-all active:scale-95"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full animate-pulse"
                  style={{ backgroundColor: nearbyTrain.colorHex }}
                />
                <span className="font-serif font-bold text-amber-300">
                  {nearbyTrain.nameJapanese}
                </span>
                <span className="text-stone-200">
                  Board Train: {nearbyTrain.destinationEnglish}
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-stone-300 font-mono">
                  [E]
                </span>
              </button>
            </div>
          )}

          {/* Temple Sanctuary: Return to Train Station Gate Prompt */}
          {currentPhase === 'temple' && isNearStationPortal && !activeEvent && (
            <div className="absolute top-24 sm:top-28 left-1/2 -translate-x-1/2 z-40 animate-bounce pointer-events-auto">
              <button
                type="button"
                onClick={handleGoToTrainStation}
                className="px-5 py-2.5 rounded-full bg-stone-900/95 border border-amber-400 text-white shadow-2xl shadow-amber-950/70 backdrop-blur-md flex items-center gap-2.5 text-xs sm:text-sm font-medium tracking-wide hover:bg-stone-800 transition-all active:scale-95"
              >
                <TrainTrack className="w-4 h-4 text-amber-400" />
                <span className="font-serif font-bold text-amber-300">富士見高原駅</span>
                <span className="text-stone-200">Return to Train Station (Board other trains)</span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-stone-300 font-mono">
                  [E]
                </span>
              </button>
            </div>
          )}

          {/* Temple Sanctuary: Proximity Interaction Prompt */}
          {currentPhase === 'temple' && nearbyEvent && !activeEvent && !isNearStationPortal && (
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
            <TechTreasureHunt
              onClose={handleCloseEvent}
              onGoToTrainStation={handleGoToTrainStation}
              onRegister={handleRegisterKillersTrail}
            />
          )}
          {activeEvent === 'promptify' && (
            <Promptify onClose={handleCloseEvent} onGoToTrainStation={handleGoToTrainStation} />
          )}
          {activeEvent === 'logic-lamps' && (
            <LogicLamps onClose={handleCloseEvent} onGoToTrainStation={handleGoToTrainStation} />
          )}
        </div>
      )}

    </div>
  );
}
