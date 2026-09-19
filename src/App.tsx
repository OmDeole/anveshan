/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from './game/GameEngine';
import { VirtualJoystick } from './components/VirtualJoystick';
import { GameHUD } from './components/GameHUD';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [isSprinting, setIsSprinting] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize 3D game engine
    const engine = new GameEngine(containerRef.current);
    engineRef.current = engine;
    setIsLoading(false);

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

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
    <div className="relative w-screen h-screen overflow-hidden bg-stone-950 font-sans select-none touch-none">
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

      {/* Overlay HUD (Scenic info, camera controls, instructions) */}
      <GameHUD onResetCamera={handleResetCamera} isSprinting={isSprinting} />

      {/* Virtual Joystick (Touch for mobile, clickable for desktop) */}
      <VirtualJoystick
        onMove={handleJoystickMove}
        onJump={handleJump}
        onSprintToggle={handleSprintToggle}
        isSprinting={isSprinting}
      />
    </div>
  );
}
