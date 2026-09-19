import React, { useRef, useState, useCallback, useEffect } from 'react';

interface VirtualJoystickProps {
  onMove: (x: number, y: number) => void;
  onJump?: () => void;
  onSprintToggle?: (sprint: boolean) => void;
  isSprinting?: boolean;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({
  onMove,
  onJump,
  onSprintToggle,
  isSprinting = false,
}) => {
  const baseRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const touchIdRef = useRef<number | null>(null);

  const radius = 56; // max joystick thumbstick displacement in pixels

  const handlePointer = useCallback(
    (clientX: number, clientY: number) => {
      if (!baseRef.current) return;
      const rect = baseRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      let dx = clientX - centerX;
      let dy = clientY - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > radius) {
        dx = (dx / dist) * radius;
        dy = (dy / dist) * radius;
      }

      setPosition({ x: dx, y: dy });

      // Normalized vector: x (-1 to 1), y (-1 to 1, with UP being +1)
      const normX = dx / radius;
      const normY = -dy / radius; // Invert so up is +1
      onMove(normX, normY);
    },
    [onMove, radius]
  );

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setActive(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    handlePointer(e.clientX, e.clientY);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!active) return;
    e.preventDefault();
    e.stopPropagation();
    handlePointer(e.clientX, e.clientY);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setActive(false);
    setPosition({ x: 0, y: 0 });
    onMove(0, 0);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // safe fallback
    }
  };

  // Keyboard navigation fallback listener for visual joystick reflection
  useEffect(() => {
    const handleKeyEnd = () => {
      if (!active) {
        // keep resting position
      }
    };
    window.addEventListener('keyup', handleKeyEnd);
    return () => window.removeEventListener('keyup', handleKeyEnd);
  }, [active]);

  return (
    <div className="fixed bottom-6 left-6 right-6 flex items-end justify-between pointer-events-none select-none z-30">
      {/* Analog Joystick (Left Side) */}
      <div className="pointer-events-auto flex flex-col items-center">
        <div
          id="virtual-joystick-base"
          ref={baseRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className={`relative w-36 h-36 rounded-full flex items-center justify-center transition-colors duration-200 touch-none shadow-2xl backdrop-blur-md border ${
            active
              ? 'bg-red-950/40 border-red-500/60 shadow-red-900/30'
              : 'bg-black/35 border-white/20 hover:border-white/40'
          }`}
          style={{ touchAction: 'none' }}
        >
          {/* Subtle Japanese Cardinal Crosshair lines */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-25">
            <div className="w-full h-px bg-red-200" />
            <div className="absolute h-full w-px bg-red-200" />
          </div>

          {/* Inner ring marker */}
          <div className="w-16 h-16 rounded-full border border-white/10 pointer-events-none" />

          {/* Draggable Knob */}
          <div
            id="virtual-joystick-knob"
            className={`absolute w-14 h-14 rounded-full flex items-center justify-center border shadow-lg transition-transform ${
              active
                ? 'bg-red-600/90 border-red-300 scale-105 shadow-red-600/50'
                : 'bg-stone-800/80 border-stone-400/50'
            }`}
            style={{
              transform: `translate(${position.x}px, ${position.y}px)`,
              transition: active ? 'none' : 'transform 0.15s ease-out',
            }}
          >
            {/* Center crest dot */}
            <div className={`w-3 h-3 rounded-full ${active ? 'bg-amber-300' : 'bg-stone-300/80'}`} />
          </div>
        </div>

        <span className="mt-2 text-[11px] font-medium tracking-wider text-white/60 uppercase select-none">
          Move
        </span>
      </div>

      {/* Action Buttons for Mobile / Quick Action (Right Side) */}
      <div className="pointer-events-auto flex items-end gap-3">
        {/* Sprint Toggle Button */}
        {onSprintToggle && (
          <button
            id="sprint-button"
            type="button"
            onClick={() => onSprintToggle(!isSprinting)}
            className={`w-14 h-14 rounded-full flex flex-col items-center justify-center border text-xs font-semibold backdrop-blur-md shadow-xl transition-all active:scale-95 ${
              isSprinting
                ? 'bg-amber-500/80 border-amber-300 text-stone-900 shadow-amber-500/40'
                : 'bg-black/40 border-white/20 text-white/80 hover:border-white/40'
            }`}
          >
            <span className="text-base leading-none">疾</span>
            <span className="text-[9px] tracking-wider uppercase opacity-80">Run</span>
          </button>
        )}

        {/* Jump Button */}
        {onJump && (
          <button
            id="jump-button"
            type="button"
            onClick={onJump}
            className="w-16 h-16 rounded-full flex flex-col items-center justify-center border bg-red-600/80 hover:bg-red-500/90 border-red-300/60 text-white font-bold backdrop-blur-md shadow-xl shadow-red-950/50 active:scale-95 transition-all"
          >
            <span className="text-lg leading-none">跳</span>
            <span className="text-[10px] tracking-wider uppercase text-red-100/90">Jump</span>
          </button>
        )}
      </div>
    </div>
  );
};
