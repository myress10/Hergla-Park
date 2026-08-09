import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Keyboard, Clock, Users, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SafetyPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const safetyItems = [
    {
      icon: Keyboard,
      title: t('safety.cards.controls.title'),
      desc: t('safety.cards.controls.desc'),
      color: 'text-red-500 bg-red-500/10 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.15)]',
    },
    {
      icon: Clock,
      title: t('safety.cards.duration.title'),
      desc: t('safety.cards.duration.desc'),
      color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]',
    },
    {
      icon: Users,
      title: t('safety.cards.age.title'),
      desc: t('safety.cards.age.desc'),
      color: 'text-purple-500 bg-purple-500/10 border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.15)]',
    }
  ];

  return (
    <div className="relative w-full min-h-screen flex flex-col justify-between pt-24 pb-8" id="vr-safety-page">
      {/* Background Image: Deep dark night theme */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1600&q=80"
          alt="Amusement park deep night"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-[4px]" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 w-full my-auto space-y-10 text-center">
        {/* Page Titles */}
        <motion.div
          initial={{ opacity: 0, y: -25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-wider">
            {t('safety.status')}
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight uppercase tracking-wide">
            {t('safety.title')}
          </h1>
          <p className="text-slate-400 text-sm max-w-lg mx-auto">
            {t('safety.subtitle')}
          </p>
        </motion.div>

        {/* 3 cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {safetyItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                className={`bg-slate-900/60 border rounded-3xl p-6 text-center space-y-4 ${item.color}`}
              >
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto">
                  <Icon size={24} />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-white tracking-wide uppercase text-sm">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* VR User Illustration Screen (simulating futuristic status) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="relative max-w-xl mx-auto rounded-3xl overflow-hidden aspect-[16/7] border border-white/5 bg-slate-900/40 p-4 shadow-xl flex items-center gap-6"
        >
          {/* Cyberpunk headset illustration */}
          <div className="w-1/3 h-full rounded-2xl overflow-hidden relative">
            <img
              src="https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=400&q=80"
              alt="VR device"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-slate-900/80" />
          </div>

          <div className="flex-1 text-start space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold font-mono">
              <ShieldCheck size={14} />
              <span>{t('safety.sessionReady')}</span>
            </div>
            <h4 className="text-white text-base font-bold uppercase tracking-wider">
              {t('safety.systemCheck')}: <span className="text-emerald-400">OK</span>
            </h4>
            <p className="text-slate-400 text-xs leading-normal">
              {t('safety.pressStart')}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
