import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const STEPS = [
  { path: '/', labelKey: 'nav.welcome' },
  { path: '/controles', labelKey: 'nav.controls' },
  { path: '/securite', labelKey: 'nav.security' },
  { path: '/lancer', labelKey: 'nav.launch' }
];

export default function ProgressSteps() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const activeIndex = STEPS.findIndex((s) => s.path === currentPath);
  const progressPercent = activeIndex >= 0 ? (activeIndex / (STEPS.length - 1)) * 100 : 0;

  return (
    <div className="w-full max-w-xl mx-auto px-4" id="vr-progress-steps">
      <div className="relative flex items-center justify-between">
        {/* Background track line */}
        <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-[3px] bg-white/10 rounded" />
        
        {/* Neon active track line */}
        <motion.div
          className="absolute top-1/2 left-0 -translate-y-1/2 h-[3px] bg-gradient-to-r from-red-500 to-cyan-500 rounded"
          initial={{ width: '0%' }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          style={{ originX: 0 }}
        />

        {/* Nodes */}
        {STEPS.map((step, index) => {
          const isCompleted = index < activeIndex;
          const isActive = index === activeIndex;

          return (
            <div key={step.path} className="relative z-10 flex flex-col items-center">
              {/* Clickable Node */}
              <motion.button
                onClick={() => navigate(step.path)}
                id={`step-node-${index}`}
                title={t(step.labelKey)}
                className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all duration-300 cursor-pointer
                  ${isCompleted ? 'bg-cyan-500 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.8)]' : ''}
                  ${isActive ? 'bg-red-600 border-red-500 shadow-[0_0_12px_rgba(220,38,38,0.9)] scale-110' : ''}
                  ${!isCompleted && !isActive ? 'bg-slate-900 border-white/20 hover:border-white/50' : ''}
                `}
                animate={{ scale: isActive ? 1.15 : 1 }}
              >
                <div className={`w-2 h-2 rounded-full ${isActive || isCompleted ? 'bg-white' : 'bg-white/20'}`} />
              </motion.button>

              {/* Label */}
              <span
                className={`absolute top-8 text-[11px] font-semibold tracking-wider whitespace-nowrap uppercase transition-colors duration-300
                  ${isActive ? 'text-red-500 font-bold' : ''}
                  ${isCompleted ? 'text-cyan-400' : ''}
                  ${!isCompleted && !isActive ? 'text-white/40' : ''}
                `}
              >
                {t(step.labelKey)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
