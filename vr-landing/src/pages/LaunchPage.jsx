import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import UnityPlaceholder from '../components/UnityPlaceholder';
import { Loader2, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LOADING_STEPS = [
  'launch.loading',
  'launch.connecting',
  'launch.streaming',
  'launch.starting'
];

export default function LaunchPage() {
  const { t } = useTranslation();
  
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // Simulated loading sequence
  useEffect(() => {
    if (!loading) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setLoading(false);
          setIsLoaded(true);
          return 100;
        }
        return prev + 1;
      });
    }, 35); // Approx 3.5 seconds total load

    return () => clearInterval(interval);
  }, [loading]);

  // Rotate loading sub-messages
  useEffect(() => {
    if (!loading) return;
    const stepInterval = setInterval(() => {
      setCurrentStepIdx((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
    }, 900);
    return () => clearInterval(stepInterval);
  }, [loading]);

  const handleLaunch = () => {
    setLoading(true);
    setProgress(0);
    setCurrentStepIdx(0);
    setIsLoaded(false);
  };

  const handleReset = () => {
    setIsLoaded(false);
    setProgress(0);
    setLoading(false);
  };

  return (
    <div className="relative w-full min-h-screen flex flex-col justify-between pt-24 pb-8" id="vr-launch-page">
      {/* Background Image: Deep digital futuristic dark tech theme */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1600&q=80"
          alt="Abstract dark cyberpunk background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-[5px]" />
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 w-full my-auto flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {!loading && !isLoaded && (
            /* 1. Launch Button state */
            <motion.div
              key="launch-button-state"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center space-y-12"
            >
              <div className="space-y-4">
                <span className="inline-block px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-wider">
                  {t('launch.badge')}
                </span>
                <p className="text-slate-400 text-sm max-w-xs mx-auto">
                  {t('launch.readyToStart')}
                </p>
              </div>

              {/* Large Neon Glow button */}
              <button
                onClick={handleLaunch}
                id="launch-virtual-tour-btn"
                className="relative group w-80 h-32 rounded-3xl bg-slate-950 border border-cyan-500/30 flex items-center justify-center cursor-pointer overflow-hidden transition-all duration-300
                  hover:border-cyan-400 hover:shadow-[0_0_50px_rgba(6,182,212,0.3)]"
              >
                {/* Neon glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 opacity-60 group-hover:opacity-100 transition-opacity" />
                
                {/* Active neon frame line */}
                <div className="absolute inset-0 border border-cyan-500 rounded-3xl animate-pulse opacity-40" />

                <span className="relative z-10 text-xl font-black text-cyan-400 tracking-widest text-center uppercase drop-shadow-[0_0_10px_rgba(34,211,238,0.7)] group-hover:text-white transition-colors duration-300">
                  {t('launch.title')}
                </span>
              </button>
            </motion.div>
          )}

          {loading && (
            /* 2. Loading state */
            <motion.div
              key="loading-state"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full max-w-md bg-slate-900/60 border border-white/5 p-8 rounded-3xl space-y-6 text-center shadow-2xl backdrop-blur-md"
            >
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="animate-spin text-cyan-400" size={32} />
                <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest animate-pulse">
                  {t(LOADING_STEPS[currentStepIdx])}
                </span>
              </div>

              {/* Loading progress bar */}
              <div className="space-y-2">
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-100 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>SYSTEM LOAD: ACTIVE</span>
                  <span>{progress}%</span>
                </div>
              </div>
            </motion.div>
          )}

          {isLoaded && (
            /* 3. Unity Simulation view */
            <motion.div
              key="loaded-state"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full"
            >
              <UnityPlaceholder onReset={handleReset} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Cyberpunk Statistics Bar */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 w-full border-t border-white/5 pt-4 flex flex-col sm:flex-row justify-between items-center text-[10px] font-mono text-slate-500 gap-2">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
            {t('launch.status.uplink')}
          </span>
          <span>{t('launch.status.latency')}</span>
        </div>
        <div>
          <span>{t('launch.status.immersion')}</span>
        </div>
      </div>
    </div>
  );
}
