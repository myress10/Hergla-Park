import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ProgressSteps from './components/ProgressSteps';
import LangSwitcher from './components/LangSwitcher';
import WelcomePage from './pages/WelcomePage';
import ControlsPage from './pages/ControlsPage';
import SafetyPage from './pages/SafetyPage';
import LaunchPage from './pages/LaunchPage';
import { AnimatePresence, motion } from 'framer-motion';
import './i18n/index';

const STEPS_PATH = ['/', '/controles', '/securite', '/lancer'];

function LayoutWrapper({ children }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  const currentIdx = STEPS_PATH.indexOf(path);

  const handleNext = () => {
    if (currentIdx < STEPS_PATH.length - 1) {
      navigate(STEPS_PATH[currentIdx + 1]);
    }
  };

  const handleBack = () => {
    if (currentIdx > 0) {
      navigate(STEPS_PATH[currentIdx - 1]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between overflow-x-hidden relative font-sans">
      {/* Top Header Navigation */}
      <header className="fixed top-0 left-0 right-0 z-30 bg-slate-950/20 backdrop-blur-md border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Hergla Park Logo" className="w-9 h-9 object-contain" />
          <span className="font-extrabold text-white text-lg tracking-wider">
            Hergla Park
          </span>
        </div>

        {/* Dynamic progress nodes */}
        <div className="flex-1 max-w-lg mx-4">
          <ProgressSteps />
        </div>

        <div>
          <LangSwitcher />
        </div>
      </header>

      {/* Main Pages Content with transition effects */}
      <div className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={path}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="flex-1 flex flex-col"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Actions Bar (Matches maquettes Stitch) */}
      <footer className="relative z-20 bg-slate-950/40 backdrop-blur-md border-t border-white/5 py-4 px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-400">
        {/* Left footer links */}
        <div className="flex items-center gap-4 order-2 sm:order-1">
          <a href="#" className="hover:text-white transition-colors">{t('actions.privacy')}</a>
          <span>•</span>
          <a href="#" className="hover:text-white transition-colors">{t('actions.help')}</a>
        </div>

        {/* Navigation Actions — dynamic Back/Next for every step */}
        <div className="flex items-center gap-3 order-1 sm:order-2 w-full sm:w-auto">
          {/* Back button — hide on first step */}
          {currentIdx > 0 && (
            <button
              onClick={handleBack}
              id="action-back-btn"
              className="flex-1 sm:flex-initial bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold px-6 py-3 rounded-2xl transition-colors cursor-pointer"
            >
              {t('actions.previous')}
            </button>
          )}

          {/* Next / Start button — hide on last step */}
          {currentIdx < STEPS_PATH.length - 1 && (
            <button
              onClick={handleNext}
              id="action-next-btn"
              className={`flex-1 sm:flex-initial text-white font-bold px-8 py-3 rounded-2xl transition-colors cursor-pointer shadow-lg
                ${currentIdx === 0 ? 'w-full sm:w-auto bg-red-600 hover:bg-red-700 shadow-red-900/20' : 'bg-red-600 hover:bg-red-700'}
              `}
            >
              {currentIdx === 0 ? t('welcome.startBtn') : t('actions.next')}
            </button>
          )}
        </div>

        {/* Right copyright notice */}
        <div className="order-3 text-slate-500">
          {t('actions.copyright')}
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <LayoutWrapper>
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/controles" element={<ControlsPage />} />
          <Route path="/securite" element={<SafetyPage />} />
          <Route path="/lancer" element={<LaunchPage />} />
          <Route path="*" element={<WelcomePage />} />
        </Routes>
      </LayoutWrapper>
    </BrowserRouter>
  );
}
