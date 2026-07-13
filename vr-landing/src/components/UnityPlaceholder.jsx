import { useTranslation } from 'react-i18next';
import { Monitor, RefreshCw, Layers } from 'lucide-react';
import { motion } from 'framer-motion';

export default function UnityPlaceholder({ onReset }) {
  const { t } = useTranslation();

  return (
    <div
      className="relative w-full aspect-video max-w-4xl mx-auto rounded-3xl overflow-hidden border border-cyan-500/30 bg-slate-950 flex flex-col justify-between shadow-[0_0_50px_rgba(6,182,212,0.15)]"
      id="unity-container"
    >
      {/* Simulation Screen Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-slate-900/40">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse" />
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
            <Monitor size={12} />
            {t('launch.placeholder.title')}
          </span>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono text-slate-500">
          <span>RENDERER: WEBGL 2.0</span>
          <span>BUILD: V0.9.2-BETA</span>
        </div>
      </div>

      {/* Center Simulated Environment */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
        {/* Animated grid in background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,24,38,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(18,24,38,0.3)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 space-y-6 max-w-lg"
        >
          <div className="w-16 h-16 rounded-full border border-cyan-500/20 bg-cyan-500/5 flex items-center justify-center mx-auto text-cyan-400">
            <Layers size={28} className="animate-pulse" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white uppercase tracking-wide">
              {t('launch.placeholder.title')}
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              {t('launch.placeholder.subtitle')}
            </p>
          </div>

          <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-4 text-start font-mono text-xs text-slate-400 leading-normal max-w-md mx-auto space-y-2">
            <div className="text-cyan-500 font-bold uppercase tracking-wider">// INTEGRATION INSTRUCTIONS</div>
            <p>{t('launch.placeholder.integrationDoc')}</p>
          </div>

          <button
            onClick={onReset}
            className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl border border-white/10 transition-colors cursor-pointer"
            id="reset-simulation-btn"
          >
            <RefreshCw size={14} />
            {t('launch.placeholder.btnText')}
          </button>
        </motion.div>
      </div>

      {/* Simulation Screen Footer */}
      <div className="px-6 py-3 border-t border-white/5 bg-slate-900/20 text-[10px] font-mono text-slate-500 flex justify-between">
        <span>STATUS: SIMULATION ACTIVE</span>
        <span>FPS: 60.0 (LOCKED)</span>
      </div>
    </div>
  );
}
