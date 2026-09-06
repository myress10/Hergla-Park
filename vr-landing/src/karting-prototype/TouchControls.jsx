import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';

export default function TouchControls({ onControlChange, onReset }) {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const checkTouch = () => {
      setIsTouchDevice(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        window.innerWidth <= 1024
      );
    };
    checkTouch();
    window.addEventListener('resize', checkTouch);
    return () => window.removeEventListener('resize', checkTouch);
  }, []);

  if (!isTouchDevice) return null;

  const handleTouch = (action, active) => {
    if (onControlChange) {
      onControlChange(action, active);
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-6 z-40 px-6 flex items-end justify-between pointer-events-none select-none">
      {/* Left / Right Steering Pad */}
      <div className="flex items-center gap-3 pointer-events-auto">
        <button
          type="button"
          onTouchStart={() => handleTouch('left', true)}
          onTouchEnd={() => handleTouch('left', false)}
          onMouseDown={() => handleTouch('left', true)}
          onMouseUp={() => handleTouch('left', false)}
          className="w-16 h-16 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-white/20 text-white flex items-center justify-center active:bg-blue-600/80 active:scale-95 shadow-xl transition-all"
        >
          <ChevronLeft size={32} />
        </button>
        <button
          type="button"
          onTouchStart={() => handleTouch('right', true)}
          onTouchEnd={() => handleTouch('right', false)}
          onMouseDown={() => handleTouch('right', true)}
          onMouseUp={() => handleTouch('right', false)}
          className="w-16 h-16 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-white/20 text-white flex items-center justify-center active:bg-blue-600/80 active:scale-95 shadow-xl transition-all"
        >
          <ChevronRight size={32} />
        </button>
      </div>

      {/* Center: Reset */}
      <div className="pointer-events-auto">
        <button
          type="button"
          onClick={onReset}
          className="px-3.5 py-2 rounded-xl bg-slate-900/70 border border-white/10 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 backdrop-blur-md"
        >
          <RefreshCw size={14} />
          <span>Remettre en piste</span>
        </button>
      </div>

      {/* Throttle & Brake Pad */}
      <div className="flex flex-col items-center gap-3 pointer-events-auto">
        <button
          type="button"
          onTouchStart={() => handleTouch('forward', true)}
          onTouchEnd={() => handleTouch('forward', false)}
          onMouseDown={() => handleTouch('forward', true)}
          onMouseUp={() => handleTouch('forward', false)}
          className="w-16 h-16 rounded-2xl bg-emerald-600/90 backdrop-blur-md border border-emerald-400/40 text-white flex items-center justify-center active:bg-emerald-500 active:scale-95 shadow-xl transition-all"
        >
          <ChevronUp size={36} />
        </button>
        <button
          type="button"
          onTouchStart={() => handleTouch('backward', true)}
          onTouchEnd={() => handleTouch('backward', false)}
          onMouseDown={() => handleTouch('backward', true)}
          onMouseUp={() => handleTouch('backward', false)}
          className="w-16 h-14 rounded-2xl bg-rose-600/90 backdrop-blur-md border border-rose-400/40 text-white flex items-center justify-center active:bg-rose-500 active:scale-95 shadow-xl transition-all"
        >
          <ChevronDown size={32} />
        </button>
      </div>
    </div>
  );
}
