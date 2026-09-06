import React, { useState, useEffect } from 'react';
import { Flag, Play, Sparkles, Loader2, Award, Zap } from 'lucide-react';

const FALLBACK_KARTS = [
  {
    id: 'kart-default-1',
    numeroPlaque: '07',
    couleurs: { piece_carrosserie: '#E53935', piece_aileron: '#1A1A1A' },
  },
  {
    id: 'kart-default-2',
    numeroPlaque: '12',
    couleurs: { piece_carrosserie: '#1E88E5', piece_aileron: '#FFFFFF' },
  },
  {
    id: 'kart-default-3',
    numeroPlaque: '44',
    couleurs: { piece_carrosserie: '#43A047', piece_aileron: '#FDD835' },
  },
  {
    id: 'kart-default-4',
    numeroPlaque: '99',
    couleurs: { piece_carrosserie: '#8E24AA', piece_aileron: '#FB8C00' },
  },
];

export default function KartSelector({ onSelectKart, companySlug = 'hergla-park', espaceId = 'space-karting-demo-id' }) {
  const [karts, setKarts] = useState(FALLBACK_KARTS);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    async function fetchPublicKarts() {
      try {
        const res = await fetch(
          `http://localhost:5000/api/companies/${companySlug}/espaces/${espaceId}/karts`
        );
        if (!res.ok) {
          const fallbackRes = await fetch(
            `https://backend-app-nine-mu.vercel.app/api/companies/${companySlug}/espaces/${espaceId}/karts`
          );
          const data = await fallbackRes.json();
          if (Array.isArray(data) && data.length > 0) {
            setKarts(data);
            return;
          }
        } else {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setKarts(data);
            return;
          }
        }
      } catch {
        // Fallback default karts
        setKarts(FALLBACK_KARTS);
      } finally {
        setLoading(false);
      }
    }
    fetchPublicKarts();
  }, [companySlug, espaceId]);

  const handleStart = () => {
    onSelectKart(karts[selectedIndex] || FALLBACK_KARTS[0]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full text-white space-y-6 shadow-2xl">
        {/* Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-black tracking-wider uppercase">
            <Zap size={13} />
            <span>Essai Rapide Karting</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Choisissez votre bolide
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            Ces karts sont synchronisés en temps réel avec la configuration officielle de l'équipe Hergla Park.
          </p>
        </div>

        {/* Karts Selection Grid */}
        {loading ? (
          <div className="py-12 text-center space-y-3">
            <Loader2 size={28} className="animate-spin text-amber-400 mx-auto" />
            <p className="text-xs text-slate-400">Chargement des karts en piste...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {karts.map((kart, index) => {
              const mainColor = kart.couleurs?.piece_carrosserie || kart.couleur || '#E53935';
              const isSelected = selectedIndex === index;

              return (
                <button
                  key={kart.id || index}
                  type="button"
                  onClick={() => setSelectedIndex(index)}
                  className={`p-4 rounded-2xl border text-center transition-all flex flex-col items-center gap-3 cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-400 ring-2 ring-amber-400/50 scale-105 shadow-xl'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100'
                  }`}
                >
                  {/* Plate Badge */}
                  <div
                    className="w-14 h-9 rounded-xl bg-white border-2 border-slate-900 flex items-center justify-center shadow-inner"
                    style={{ borderLeft: `5px solid ${mainColor}` }}
                  >
                    <span className="font-mono font-black text-slate-900 text-sm">
                      {kart.numeroPlaque || kart.numero || '??'}
                    </span>
                  </div>

                  {/* Colors dot */}
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-3 h-3 rounded-full border border-black/30"
                      style={{ backgroundColor: mainColor }}
                      title="Couleur carrosserie"
                    />
                    <span className="text-[11px] font-bold text-slate-300">
                      N° {kart.numeroPlaque || kart.numero || '??'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Start Button */}
        <button
          type="button"
          onClick={handleStart}
          className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2.5 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
        >
          <Play size={18} className="fill-slate-950" />
          <span>Prendre le départ</span>
        </button>

        {/* Controls Info */}
        <div className="bg-slate-950/60 rounded-2xl p-3 border border-slate-800/80 text-[11px] text-slate-400 text-center">
          🎮 <strong>Touches</strong> : Z/Q/S/D ou Flèches directionnelles • <strong>Espace</strong> : Frein • <strong>R</strong> : Replacer le kart
        </div>
      </div>
    </div>
  );
}
