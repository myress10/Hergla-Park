import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Glasses, Zap, Trophy, Play, Sparkles, ArrowRight } from 'lucide-react';

export default function ExperienceChoice({ onSelectUnity }) {
  const navigate = useNavigate();

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-300">
      {/* Title Header */}
      <div className="text-center space-y-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider">
          <Sparkles size={13} />
          <span>Hergla Park — Expériences Virtuelles</span>
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Choisissez votre mode d'immersion
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto">
          Découvrez le parc à votre rythme ou prenez immédiatement les commandes d'un kart sur le circuit.
        </p>
      </div>

      {/* Choice Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Option 1: Essai Rapide Karting (Three.js Prototype) */}
        <div className="relative group bg-gradient-to-b from-slate-900 via-slate-900 to-amber-950/20 border-2 border-amber-500/30 hover:border-amber-400 rounded-3xl p-7 flex flex-col justify-between space-y-6 shadow-2xl hover:shadow-amber-500/10 transition-all hover:scale-[1.02]">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shadow-lg">
                <Zap size={30} />
              </div>
              <span className="px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 font-bold text-xs flex items-center gap-1.5 shadow-sm">
                <Zap size={13} className="fill-amber-300" />
                <span>Instantané, dans le navigateur</span>
              </span>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white">
                Essai rapide Karting
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Pilotez directement l'un des karts configurés par l'équipe sur la piste 3D en temps réel. Moteur physique Rapier, chrono au tour et classement officiel.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300">
                🏎️ Choix de bolide
              </span>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300">
                ⏱️ Chronomètre en direct
              </span>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-amber-300">
                🏆 Leaderboard Top 10
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/prototype-karting')}
            className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm rounded-2xl shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer group-hover:shadow-amber-500/40"
          >
            <Play size={18} className="fill-slate-950" />
            <span>Lancer la course immédiate</span>
            <ArrowRight size={16} />
          </button>
        </div>

        {/* Option 2: Visite Immersive Complète (Unity WebGL / VR) */}
        <div className="relative group bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950/20 border-2 border-slate-800 hover:border-indigo-500/40 rounded-3xl p-7 flex flex-col justify-between space-y-6 shadow-2xl transition-all hover:scale-[1.02]">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shadow-lg">
                <Glasses size={30} />
              </div>
              <span className="px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 font-bold text-xs flex items-center gap-1.5">
                <span>🥽 Casque VR bientôt disponible</span>
              </span>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white">
                Visite immersive complète
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Explorez l'intégralité du complexe touristique Hergla Park : café mauresque, restaurant panoramique, stands et circuits sous moteur Unity WebGL.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300">
                🌐 Visite globale
              </span>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300">
                ☕ Statut Espaces Ouvert/Fermé
              </span>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-indigo-300">
                🕹️ Clavier & Souris
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onSelectUnity}
            className="w-full py-4 bg-slate-800 hover:bg-indigo-600 text-white font-black text-sm rounded-2xl border border-slate-700 hover:border-indigo-500 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg"
          >
            <span>Explorer le complexe complet</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
