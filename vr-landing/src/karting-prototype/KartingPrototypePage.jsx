import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { Link } from 'react-router-dom';
import PhysicsWorld from './PhysicsWorld';
import LapTimerHud from './LapTimerHud';
import LeaderboardPanel from './LeaderboardPanel';
import KartSelector from './KartSelector';
import TouchControls from './TouchControls';
import { useKeyboardControls } from './hooks/useKeyboardControls';
import { ArrowLeft, Trophy, RefreshCw } from 'lucide-react';

export default function KartingPrototypePage() {
  const keyboardControls = useKeyboardControls();
  const [touchState, setTouchState] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
    brake: false,
  });

  // Merged controls
  const activeControls = {
    forward: keyboardControls.forward || touchState.forward,
    backward: keyboardControls.backward || touchState.backward,
    left: keyboardControls.left || touchState.left,
    right: keyboardControls.right || touchState.right,
    brake: keyboardControls.brake || touchState.brake,
  };

  const [selectedKart, setSelectedKart] = useState(null);
  const [isSelectorOpen, setIsSelectorOpen] = useState(true);

  // Speed and Chrono State
  const [speedKmh, setSpeedKmh] = useState(0);
  const [currentLapTime, setCurrentLapTime] = useState(0);
  const [bestLapTime, setBestLapTime] = useState(null);
  const [lapCount, setLapCount] = useState(0);

  // Leaderboard modal
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [completedLapTime, setCompletedLapTime] = useState(null);

  // Reset trigger
  const [resetCount, setResetCount] = useState(0);
  const startTimeRef = useRef(null);

  // Live Timer RAF
  useEffect(() => {
    let animId;
    const updateChrono = () => {
      if (startTimeRef.current !== null) {
        setCurrentLapTime(performance.now() - startTimeRef.current);
      }
      animId = requestAnimationFrame(updateChrono);
    };
    animId = requestAnimationFrame(updateChrono);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Keyboard 'R' to reset
  useEffect(() => {
    if (keyboardControls.reset) {
      handleReset();
    }
  }, [keyboardControls.reset]);

  const handleReset = () => {
    setResetCount((c) => c + 1);
    startTimeRef.current = performance.now();
    setCurrentLapTime(0);
  };

  const handleLapCompleted = useCallback((durationMs) => {
    setLapCount((c) => c + 1);
    setCompletedLapTime(durationMs);
    setLeaderboardOpen(true); // Open leaderboard submission automatically on lap completion!

    setBestLapTime((prev) => {
      if (prev === null || durationMs < prev) {
        return durationMs;
      }
      return prev;
    });

    startTimeRef.current = performance.now();
  }, []);

  const handleTouchChange = (action, active) => {
    setTouchState((prev) => ({ ...prev, [action]: active }));
  };

  const handleSelectKart = (kart) => {
    setSelectedKart(kart);
    setIsSelectorOpen(false);
    handleReset();
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 select-none">
      {/* Back to Home Button */}
      <div className="fixed top-6 left-6 z-30 pointer-events-auto">
        <Link
          to="/"
          className="px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-900 backdrop-blur-md border border-white/10 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 shadow-lg transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Quitter la piste</span>
        </Link>
      </div>

      {/* 3D WebGL Canvas */}
      <Canvas
        camera={{ position: [21, 6, -10], fov: 45 }}
        shadows
        gl={{ antialias: true, alpha: false }}
      >
        {selectedKart && (
          <PhysicsWorld
            selectedKart={selectedKart}
            controls={activeControls}
            onSpeedUpdate={setSpeedKmh}
            onLapCompleted={handleLapCompleted}
            resetTrigger={resetCount}
          />
        )}
      </Canvas>

      {/* Live HUD */}
      {selectedKart && (
        <LapTimerHud
          currentLapTime={currentLapTime}
          bestLapTime={bestLapTime}
          lapCount={lapCount}
          speedKmh={speedKmh}
          selectedKart={selectedKart}
          onResetTrack={handleReset}
          onOpenLeaderboard={() => setLeaderboardOpen(true)}
        />
      )}

      {/* Touchpad Controls on Touch Screens */}
      <TouchControls
        onControlChange={handleTouchChange}
        onReset={handleReset}
      />

      {/* Kart Selection Modal (First screen) */}
      {isSelectorOpen && (
        <KartSelector onSelectKart={handleSelectKart} />
      )}

      {/* Leaderboard Panel */}
      <LeaderboardPanel
        isOpen={leaderboardOpen}
        onClose={() => setLeaderboardOpen(false)}
        completedLapTime={completedLapTime}
        selectedKart={selectedKart}
      />
    </div>
  );
}
