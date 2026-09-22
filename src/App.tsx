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
import { PROMPTIFY_EVENT_DATA } from './game/promptify/PromptifyConfig';
import { STATION_TRAINS } from './game/MountainStationEnvironment';
import { TechTreasureHunt } from './components/events/TechTreasureHunt';
import { Promptify } from './components/events/Promptify';
import { LogicLamps } from './components/events/LogicLamps';
import { EventCompass } from './components/EventCompass';
import { TrainBoardingCinematic } from './components/TrainBoardingCinematic';
import { FireworksShow } from './fireworks/FireworksShow';

type AppPhase = 'cinematic' | 'mountain-station' | 'boarding' | 'temple' | 'promptify';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Initial phase: living cinematic intro (or direct ?promptify preview)
  const [currentPhase, setCurrentPhase] = useState<AppPhase>(() => {
    if (typeof window !== 'undefined') {
      const search = window.location.search.toLowerCase();
      const path = window.location.pathname.toLowerCase();
      if (search.includes('promptify') || path.includes('promptify')) {
        return 'promptify';
      }
    }
    return 'cinematic';
  });
  const [isSprinting, setIsSprinting] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Active Sanctuary Event Modal ('tech-treasure-hunt' | 'promptify' | 'logic-lamps' | null)
  const [activeEvent, setActiveEvent] = useState<SanctuaryEventId | null>(null);
  const [nearbyEvent, setNearbyEvent] = useState<SanctuaryEventId | null>(null);
  const [nearbyTrain, setNearbyTrain] = useState<TrainData | null>(null);
  const [waypoints, setWaypoints] = useState<WaypointIndicatorData[]>([]);
  const [isNearStationPortal, setIsNearStationPortal] = useState<boolean>(false);
  const [boardingTrain, setBoardingTrain] = useState<TrainData | null>(null);
  const [showPromptifyCelebration, setShowPromptifyCelebration] = useState<boolean>(false);

  // Transition from cinematic scroll to 3D mountain station game
  const handleCinematicComplete = () => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    setCurrentPhase('mountain-station');
  };

  // Expose convenient test hooks on window and support ?promptify&modal=1
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__openPromptifyModal = () => {
        setActiveEvent('promptify');
        if (engineRef.current) engineRef.current.setEventModalOpen(true);
      };
      const search = window.location.search.toLowerCase();
      if (search.includes('promptify') && search.includes('modal')) {
        setActiveEvent('promptify');
      }
    }
  }, []);

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
    setShowPromptifyCelebration(false);
    hasPromptifyFireworksStarted.current = false;
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

  const hasPromptifyFireworksStarted = useRef<boolean>(false);

  const handleRegisterPromptify = () => {
    if (hasPromptifyFireworksStarted.current) return;
    hasPromptifyFireworksStarted.current = true;
    console.log('[Promptify] Registration successful');

    // 1. Allow a brief 400ms moment for the registration success state to be seen
    setTimeout(() => {
      // 2. Close registration modal using existing behavior
      setActiveEvent(null);
      if (engineRef.current) {
        engineRef.current.setEventModalOpen(false);
        // Also trigger existing in-game 3D fireworks celebration
        engineRef.current.triggerPromptifyRegistration();
      }
      // 3. Launch exact full-screen 3D fireworks show from src/fireworks
      console.log('[Promptify] Launching exact 3D fireworks from src/fireworks');
      setShowPromptifyCelebration(true);
    }, 400);
  };

  const handleBoardingComplete = () => {
    setNearbyTrain(null);
    if (boardingTrain?.id === 'arya') {
      setCurrentPhase('promptify');
      if (engineRef.current) {
        engineRef.current.setEventModalOpen(false);
        engineRef.current.switchEnvironment('promptify', false, ['promptify']);
      }
    } else {
      setCurrentPhase('temple');
      if (engineRef.current) {
        engineRef.current.setEventModalOpen(false);
        let activeEventsForTrain: SanctuaryEventId[] = ['tech-treasure-hunt'];
        if (boardingTrain?.id === 'sandip') {
          activeEventsForTrain = ['logic-lamps'];
        }
        engineRef.current.switchEnvironment('temple', false, activeEventsForTrain);
      }
    }
  };

  // Keyboard shortcut 'KeyE' to interact with nearby train, nearby event, or return-to-station portal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.code === 'KeyE' || e.key === 'e' || e.key === 'E') && !activeEvent) {
        if (currentPhase === 'mountain-station' && nearbyTrain) {
          handleBoardTrain(nearbyTrain.id);
        } else if (currentPhase === 'temple' || currentPhase === 'promptify') {
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

  // Initialize 3D game engine ONCE and keep it alive across boarding & fireworks video
  useEffect(() => {
    if (currentPhase === 'cinematic' || currentPhase === 'boarding' || !containerRef.current) return;
    if (engineRef.current) return;

    setIsLoading(true);

    const initialEnv =
      currentPhase === 'promptify'
        ? 'promptify'
        : currentPhase === 'temple'
        ? 'temple'
        : 'mountain-station';

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

      {/* 1. Living Cinematic Experience */}
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
                {currentPhase === 'mountain-station'
                  ? 'Entering Fujimi Mountain Ridge...'
                  : currentPhase === 'promptify'
                  ? 'Entering Traditional Night Market...'
                  : 'Entering Sacred Sanctuary...'}
              </p>
            </div>
          )}

          {/* Continuous Event & Train Direction Compass HUD */}
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

          {/* Overlay HUD (Go to train station, Camera controls, background audio on/off, fullscreen) */}
          {currentPhase !== 'boarding' && (
            <GameHUD
              onResetCamera={handleResetCamera}
              isSprinting={isSprinting}
              onGoToTrainStation={handleGoToTrainStation}
              currentPhase={currentPhase === 'mountain-station' ? 'mountain-station' : 'temple'}
            />
          )}


          {/* Virtual Joystick & Action Buttons */}
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
                className="px-5 py-2.5 rounded-full bg-stone-900/95 border border-rose-500/60 text-white shadow-2xl shadow-rose-950/70 backdrop-blur-md flex items-center gap-2.5 text-xs sm:text-sm font-medium tracking-wide hover:bg-stone-800 transition-all active:scale-95 cursor-pointer"
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

          {/* Temple Sanctuary / Promptify Market: Return to Train Station Gate Prompt */}
          {(currentPhase === 'temple' || currentPhase === 'promptify') &&
            isNearStationPortal &&
            !activeEvent && (
              <div className="absolute top-24 sm:top-28 left-1/2 -translate-x-1/2 z-40 animate-bounce pointer-events-auto">
                <button
                  type="button"
                  onClick={handleGoToTrainStation}
                  className="px-5 py-2.5 rounded-full bg-stone-900/95 border border-amber-400 text-white shadow-2xl shadow-amber-950/70 backdrop-blur-md flex items-center gap-2.5 text-xs sm:text-sm font-medium tracking-wide hover:bg-stone-800 transition-all active:scale-95 cursor-pointer"
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

          {/* Proximity Interaction Prompt */}
          {(currentPhase === 'temple' || currentPhase === 'promptify') &&
            nearbyEvent &&
            !activeEvent &&
            !isNearStationPortal && (
              <div className="absolute top-24 sm:top-28 left-1/2 -translate-x-1/2 z-40 animate-bounce pointer-events-auto">
                <button
                  type="button"
                  onClick={handleOpenNearbyEvent}
                  className="px-5 py-2.5 rounded-full bg-stone-900/90 border border-amber-400/50 text-white shadow-xl shadow-black/50 backdrop-blur-md flex items-center gap-2.5 text-xs sm:text-sm font-medium tracking-wide hover:bg-stone-800 transition-all active:scale-95 cursor-pointer"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                  <span>
                    {nearbyEvent === 'promptify'
                      ? PROMPTIFY_EVENT_DATA.name
                      : SANCTUARY_EVENTS.find((e) => e.id === nearbyEvent)?.name || 'Event'}
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
            <Promptify
              onClose={handleCloseEvent}
              onGoToTrainStation={handleGoToTrainStation}
              onRegister={handleRegisterPromptify}
            />
          )}
          {activeEvent === 'logic-lamps' && (
            <LogicLamps
              onClose={handleCloseEvent}
              onGoToTrainStation={handleGoToTrainStation}
            />
          )}
        </div>
      )}

      {/* Exact 3D Fireworks Show from src/fireworks triggered after Promptify registration */}
      {showPromptifyCelebration && (
        <FireworksShow
          title="PROMPTIFY CELEBRATION"
          closeButtonText="Explore Night Market"
          autoGrandSalvo={true}
          onClose={() => setShowPromptifyCelebration(false)}
        />
      )}
    </div>
  );
}
