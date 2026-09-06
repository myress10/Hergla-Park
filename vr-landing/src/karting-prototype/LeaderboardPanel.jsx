import React, { useState, useEffect } from 'react';
import { Trophy, X, Send, Medal, Timer, Loader2, Sparkles, CheckCircle } from 'lucide-react';

function formatTime(ms) {
  if (!ms || ms <= 0) return '--:--.---';
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const millis = Math.floor(ms % 1000);
  const pad = (n, len = 2) => String(n).padStart(len, '0');
  return `${pad(minutes)}:${pad(seconds)}.${pad(millis, 3)}`;
}

export default function LeaderboardPanel({
  isOpen,
  onClose,
  completedLapTime,
  selectedKart,
  companySlug = 'hergla-park',
  espaceId = 'space-karting-demo-id',
}) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pseudo, setPseudo] = useState(localStorage.getItem('hergla_kart_pseudo') || '');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:5000/api/companies/${companySlug}/espaces/${espaceId}/laptimes?limit=10`
      );
      if (!res.ok) {
        // Try relative or preview fallback
        const fallbackRes = await fetch(
          `https://backend-app-nine-mu.vercel.app/api/companies/${companySlug}/espaces/${espaceId}/laptimes?limit=10`
        );
        const data = await fallbackRes.json();
        setLeaderboard(Array.isArray(data) ? data : []);
        return;
      }
      const data = await res.json();
      setLeaderboard(Array.isArray(data) ? data : []);
    } catch {
      // Local demo mock fallback if backend offline
      setLeaderboard([
        { pseudo: 'RedBull_Pilot', tempsMs: 38450, numeroKart: '01' },
        { pseudo: 'HerglaChamp', tempsMs: 41200, numeroKart: '07' },
        { pseudo: 'Speedy_Tunis', tempsMs: 43890, numeroKart: '12' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLeaderboard();
      setSubmitted(false);
      setError(null);
    }
  }, [isOpen]);

  const handleSubmitScore = async (e) => {
    e.preventDefault();
    const cleanPseudo = pseudo.trim();
    if (!cleanPseudo || cleanPseudo.length < 2) {
      setError('Le pseudo doit contenir au moins 2 caractères');
      return;
    }
    if (!completedLapTime || completedLapTime < 5000) {
      setError('Aucun temps valide à soumettre');
      return;
    }

    setSubmitting(true);
    setError(null);
    localStorage.setItem('hergla_kart_pseudo', cleanPseudo);

    try {
      const payload = {
        pseudo: cleanPseudo,
        tempsMs: Math.round(completedLapTime),
        kartId: selectedKart?.id || undefined,
      };

      const res = await fetch(
        `http://localhost:5000/api/companies/${companySlug}/espaces/${espaceId}/laptimes`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        // Fallback to prod backend
        await fetch(
          `https://backend-app-nine-mu.vercel.app/api/companies/${companySlug}/espaces/${espaceId}/laptimes`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }
        );
      }

      setSubmitted(true);
      await fetchLeaderboard();
    } catch {
      // Optimistic local add
      setSubmitted(true);
      setLeaderboard((prev) => [
        ...prev,
        { pseudo: cleanPseudo, tempsMs: Math.round(completedLapTime), numeroKart: selectedKart?.numeroPlaque || '07' },
      ].sort((a, b) => a.tempsMs - b.tempsMs));
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden text-white flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Trophy size={20} />
            </div>
            <div>
              <h2 className="text-base font-black tracking-wide">
                Classement Général — Hergla Park
              </h2>
              <p className="text-[11px] text-slate-400">
                Top 10 des meilleurs chronos sur circuit
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Lap Submission Box (if user just finished a lap) */}
        {completedLapTime && completedLapTime > 5000 && (
          <div className="p-4 bg-gradient-to-r from-amber-500/10 via-slate-800 to-amber-500/10 border-b border-amber-500/20">
            {submitted ? (
              <div className="flex items-center gap-2.5 text-emerald-400 text-xs font-bold py-2 justify-center">
                <CheckCircle size={16} />
                <span>Votre chrono de {formatTime(completedLapTime)} a été enregistré !</span>
              </div>
            ) : (
              <form onSubmit={handleSubmitScore} className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Sparkles size={14} />
                    <span>Nouveau tour terminé : {formatTime(completedLapTime)}</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    Kart #{selectedKart?.numeroPlaque || '07'}
                  </span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={20}
                    value={pseudo}
                    onChange={(e) => setPseudo(e.target.value)}
                    placeholder="Votre pseudo de pilote..."
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/30"
                  />
                  <button
                    type="submit"
                    disabled={submitting || !pseudo.trim()}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    <span>Publier</span>
                  </button>
                </div>
                {error && <p className="text-[10px] font-semibold text-rose-400">{error}</p>}
              </form>
            )}
          </div>
        )}

        {/* Leaderboard Table List */}
        <div className="p-5 flex-1 overflow-y-auto space-y-2.5">
          {loading ? (
            <div className="py-12 text-center space-y-2">
              <Loader2 size={24} className="animate-spin text-amber-400 mx-auto" />
              <p className="text-xs font-semibold text-slate-400">Chargement des meilleurs temps...</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              Aucun chrono enregistré pour le moment. Soyez le premier à inscrire votre nom !
            </div>
          ) : (
            leaderboard.map((entry, idx) => {
              const isFirst = idx === 0;
              const isSecond = idx === 1;
              const isThird = idx === 2;

              return (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                    isFirst
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-200'
                      : isSecond
                      ? 'bg-slate-300/10 border-slate-400/30 text-slate-200'
                      : isThird
                      ? 'bg-amber-800/20 border-amber-700/30 text-amber-300'
                      : 'bg-slate-950/40 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-7 h-7 rounded-xl font-mono font-black text-xs flex items-center justify-center ${
                        isFirst
                          ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30'
                          : isSecond
                          ? 'bg-slate-300 text-slate-950'
                          : isThird
                          ? 'bg-amber-700 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {idx + 1}
                    </span>

                    <div>
                      <span className="font-bold text-xs block">{entry.pseudo}</span>
                      {entry.numeroKart && (
                        <span className="text-[10px] font-mono text-slate-400">
                          Kart #{entry.numeroKart}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="font-mono font-black text-sm tracking-wider flex items-center gap-2">
                    <Timer size={14} className="text-slate-400" />
                    <span>{formatTime(entry.tempsMs)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
