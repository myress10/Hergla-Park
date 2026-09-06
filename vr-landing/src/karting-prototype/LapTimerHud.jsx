import React from 'react';
import { Timer, Trophy, Gauge, Flag, RotateCcw } from 'lucide-react';

function formatTime(ms) {
  if (!ms || ms <= 0) return '--:--.---';
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const millis = Math.floor(ms % 1000);

  const pad = (n, len = 2) => String(n).padStart(len, '0');
  return `${pad(minutes)}:${pad(seconds)}.${pad(millis, 3)}`;
}

export default function LapTimerHud({
  currentLapTime = 0,
  bestLapTime = null,
  lapCount = 0,
  speedKmh = 0,
  selectedKart,
  onResetTrack,
  onOpenLeaderboard,
}) {
  const mainColor = selectedKart?.couleurs?.piece_carrosserie || '#E53935';

  return (
    <div className="fixed inset-x-0 top-6 z-30 px-6 pointer-events-none flex items-start justify-between">
      {/* Top Left: Kart Badge & Lap Counter */}
      <div className="flex items-center gap-3 pointer-events-auto">
        {/* Number Plate Badge */}
        <div
          className="bg-slate-950/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/15 shadow-xl flex items-center gap-2.5"
          style={{ borderLeft: `5px solid ${mainColor}` }}
        >
          <div className="font-mono font-black text-lg text-white tracking-wider">
            N° {selectedKart?.numeroPlaque || '07'}
          </div>
          <div className="h-4 w-px bg-white/20" />
          <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Flag size={14} className="text-emerald-400" />
            <span>Tour {Math.max(1, lapCount + 1)}</span>
          </div>
        </div>

        {/* Leaderboard toggle button */}
        <button
          type="button"
          onClick={onOpenLeaderboard}
          className="bg-slate-900/80 hover:bg-slate-900 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 text-amber-300 hover:text-amber-200 text-xs font-bold flex items-center gap-1.5 shadow-lg transition-colors cursor-pointer"
        >
          <Trophy size={14} />
          <span className="hidden sm:inline">Classement</span>
        </button>
      </div>

      {/* Top Center / Right: Chrono & Best Lap */}
      <div className="flex flex-col items-end gap-2">
        {/* Live Timer Card */}
        <div className="bg-slate-950/90 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white/15 shadow-2xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Timer size={18} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              Chrono en direct
            </span>
            <span className="font-mono font-black text-2xl text-white tracking-wider">
              {formatTime(currentLapTime)}
            </span>
          </div>
        </div>

        {/* Best Lap & Speed */}
        <div className="flex items-center gap-2">
          {bestLapTime && (
            <div className="bg-slate-900/85 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1.5 shadow-md">
              <Trophy size={13} className="text-amber-400" />
              <span>Record : {formatTime(bestLapTime)}</span>
            </div>
          )}

          <div className="bg-slate-900/85 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 text-slate-200 text-xs font-mono font-bold flex items-center gap-1.5 shadow-md">
            <Gauge size={14} className="text-cyan-400" />
            <span>{Math.round(speedKmh)} km/h</span>
          </div>
        </div>
      </div>
    </div>
  );
}
