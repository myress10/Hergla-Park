import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import UnityPlaceholder from '../components/UnityPlaceholder';
import ExperienceChoice from '../components/ExperienceChoice';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LOADING_STEPS = [
  'launch.loading',
  'launch.connecting',
  'launch.streaming',
  'launch.starting'
];

export default function LaunchPage() {
  const { t } = useTranslation();
  
  // States: 'choice' -> 'loading' -> 'loaded'
  const [stage, setStage] = useState('choice'); // 'choice' | 'loading' | 'loaded'
  const [progress, setProgress] = useState(0);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);

  // Simulated loading sequence for Unity
  useEffect(() => {
    if (stage !== 'loading') return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setStage('loaded');
          return 100;
        }
        return prev + 1;
      });
    }, 35); // Approx 3.5 seconds total load

    return () => clearInterval(interval);
  }, [stage]);

  // Rotate loading sub-messages
  useEffect(() => {
    if (stage !== 'loading') return;
    const stepInterval = setInterval(() => {
      setCurrentStepIdx((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
    }, 900);
    return () => clearInterval(stepInterval);
  }, [stage]);

  const handleLaunchUnity = () => {
    setStage('loading');
    setProgress(0);
    setCurrentStepIdx(0);
  };

  const handleReset = () => {
    setStage('choice');
    setProgress(0);
  };

  return (
    <div className="relative w-full min-h-screen flex flex-col justify-between pt-24 pb-12" id="vr-launch-page">
      {/* Background Image: Deep digital futuristic dark tech theme */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1600&q=80"
          alt="Abstract dark cyberpunk background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-[6px]" />
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 w-full my-auto flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {stage === 'choice' && (
            <motion.div
              key="choice-state"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full"
            >
              <ExperienceChoice onSelectUnity={handleLaunchUnity} />
            </motion.div>
          )}

          {stage === 'loading' && (
            <motion.div
              key="loading-state"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full max-w-md bg-slate-900/80 border border-white/10 p-8 rounded-3xl space-y-6 text-center shadow-2xl backdrop-blur-md"
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

          {stage === 'loaded' && (
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
