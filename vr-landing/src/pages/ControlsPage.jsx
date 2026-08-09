import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import ControlsDiagram from '../components/ControlsDiagram';
import { ArrowLeft, ArrowRight, Play, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ControlsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="relative w-full min-h-screen flex flex-col justify-between pt-24 pb-8" id="vr-controls-page">
      {/* Background Image: Night Theme (darker than welcome) */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1533105079780-92b9be482077?w=1600&q=80"
          alt="Amusement park night"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[3px]" />
      </div>

      {/* Content wrapper */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 w-full my-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left Side: Explanations */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6 text-start"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold uppercase tracking-wider">
            {t('controls.badge')}
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
            {t('controls.title')}
          </h1>
          <p className="text-slate-300 text-base leading-relaxed">
            {t('controls.subtitle')}
          </p>

          <div className="space-y-4 pt-4 border-t border-white/5">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400 mt-0.5">
                <Play size={16} />
              </div>
              <p className="text-sm text-slate-300 leading-normal flex-1">
                {t('controls.moveText')}
              </p>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-lg bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mt-0.5">
                <Eye size={16} />
              </div>
              <p className="text-sm text-slate-300 leading-normal flex-1">
                {t('controls.interactText')}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Right Side: Key diagram */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <ControlsDiagram />
        </motion.div>
      </div>
    </div>
  );
}
