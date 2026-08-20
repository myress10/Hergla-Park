import { useTranslation } from 'react-i18next';
import { ChevronDown, MapPin, Clock, Star, Users, Zap, Shield, Globe, Play } from 'lucide-react';
import { motion } from 'framer-motion';

// ─── Easily replaceable constants ───────────────────────────────────────────
const PARK_IMAGES = [
  {
    key: 'karting',
    titleKey: 'welcome.categories.karting',
    tag: 'Pro',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
  },
  {
    key: 'family',
    titleKey: 'welcome.categories.family',
    tag: 'Fun',
    image: 'https://images.unsplash.com/photo-1575783970733-1aaedde1db74?w=600&q=80',
  },
  {
    key: 'events',
    titleKey: 'welcome.categories.events',
    tag: 'Live',
    image: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=600&q=80',
  },
];

// ─── Animation helpers ───────────────────────────────────────────────────────
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease: 'easeOut' },
});

export default function WelcomePage() {
  const { t } = useTranslation();

  const STATS = [
    { icon: Users, value: '50 000+', label: t('welcome.stats.visitors') },
    { icon: Star, value: '4.9 / 5', label: t('welcome.stats.satisfaction') },
    { icon: MapPin, value: 'Hergla', label: t('welcome.stats.location') },
    { icon: Clock, value: 'Depuis 1996', label: t('welcome.stats.history') },
  ];

  const FEATURES = [
    {
      icon: Globe,
      title: t('welcome.features.f1Title'),
      desc: t('welcome.features.f1Desc'),
    },
    {
      icon: Zap,
      title: t('welcome.features.f2Title'),
      desc: t('welcome.features.f2Desc'),
    },
    {
      icon: Shield,
      title: t('welcome.features.f3Title'),
      desc: t('welcome.features.f3Desc'),
    },
  ];

  const HOW_IT_WORKS = [
    { step: '01', title: t('welcome.howItWorks.h1Title'), desc: t('welcome.howItWorks.h1Desc') },
    { step: '02', title: t('welcome.howItWorks.h2Title'), desc: t('welcome.howItWorks.h2Desc') },
    { step: '03', title: t('welcome.howItWorks.h3Title'), desc: t('welcome.howItWorks.h3Desc') },
  ];

  return (
    <div className="relative w-full flex flex-col" id="vr-welcome-page">
      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative w-full min-h-screen flex flex-col items-center justify-center pt-24 pb-12 overflow-hidden">
        {/* Cinematic background */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1800&q=80"
            alt="Hergla Park background"
            className="w-full h-full object-cover scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/50 to-slate-950" />
        </div>

        {/* Hero text */}
        <div className="relative z-10 text-center max-w-4xl mx-auto px-6 space-y-6">
          <motion.div {...fadeUp(0)} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm text-xs font-bold uppercase tracking-widest text-white">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            {t('welcome.badge')}
          </motion.div>

          <motion.h1
            {...fadeUp(0.1)}
            className="text-4xl sm:text-5xl lg:text-7xl font-black text-white leading-tight drop-shadow-2xl"
          >
            {t('welcome.heroTitle1')}<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600">
              {t('welcome.heroTitle2')}
            </span>
          </motion.h1>

          <motion.p
            {...fadeUp(0.2)}
            className="text-lg sm:text-xl text-slate-300 font-medium leading-relaxed max-w-2xl mx-auto"
          >
            {t('welcome.subtitle')}
          </motion.p>

          {/* CTA preview — desktop only (real button is in footer) */}
          <motion.div {...fadeUp(0.35)} className="hidden sm:flex items-center justify-center gap-4 pt-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 text-sm text-slate-300">
              <Play size={14} className="text-red-400" />
              <span>4 étapes • ~3 min</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 text-sm text-slate-300">
              <Shield size={14} className="text-cyan-400" />
              <span>Sans téléchargement</span>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          {...fadeUp(0.6)}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-slate-400"
        >
          <span className="text-[11px] font-semibold tracking-wider uppercase">
            {t('welcome.scrollDown')}
          </span>
          <ChevronDown size={16} className="animate-bounce" />
        </motion.div>
      </section>

      {/* ── STATS BAR ─────────────────────────────────────────────────────── */}
      <section className="relative z-10 bg-slate-900/80 backdrop-blur-md border-y border-white/5 py-6">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0 lg:divide-x lg:divide-white/10">
          {STATS.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={i}
                {...fadeUp(0.05 * i)}
                className="flex flex-col items-center text-center lg:px-8"
              >
                <Icon size={18} className="text-red-500 mb-2" />
                <span className="text-xl font-black text-white">{stat.value}</span>
                <span className="text-xs text-slate-400 mt-0.5">{stat.label}</span>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── GALLERY ───────────────────────────────────────────────────────── */}
      <section className="relative z-10 bg-slate-950 py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeUp(0)} className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              {t('welcome.galleryTitle')}
            </h2>
            <p className="text-slate-400 text-sm mt-2">
              {t('welcome.heroDesc')}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {PARK_IMAGES.map((item, index) => (
              <motion.div
                key={item.key}
                {...fadeUp(0.1 * index)}
                className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-xl border border-white/5 group cursor-pointer"
              >
                <img
                  src={item.image}
                  alt={t(item.titleKey)}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                {/* Tag badge */}
                <div className="absolute top-4 end-4">
                  <span className="px-2.5 py-1 rounded-full bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider">
                    {item.tag}
                  </span>
                </div>
                <div className="absolute bottom-4 start-4">
                  <h3 className="text-white font-bold text-lg leading-tight">{t(item.titleKey)}</h3>
                </div>
                {/* Play overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                    <Play size={22} className="text-white ms-0.5" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────────────────── */}
      <section className="relative z-10 bg-slate-900/50 py-16 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <motion.div {...fadeUp(0)} className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              {t('welcome.features.title')}
            </h2>
            <p className="text-slate-400 text-sm mt-2 max-w-lg mx-auto">
              {t('welcome.features.subtitle')}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {FEATURES.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <motion.div
                  key={i}
                  {...fadeUp(0.1 * i)}
                  className="bg-slate-900 border border-white/5 rounded-3xl p-6 text-center space-y-3 hover:border-red-500/30 hover:shadow-[0_0_20px_rgba(220,38,38,0.08)] transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-2xl bg-red-600/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-400">
                    <Icon size={22} />
                  </div>
                  <h3 className="text-base font-bold text-white">{feat.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{feat.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section className="relative z-10 bg-slate-950 py-16 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <motion.div {...fadeUp(0)} className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              {t('welcome.howItWorks.title')}
            </h2>
            <p className="text-slate-400 text-sm mt-2">
              {t('welcome.howItWorks.subtitle')}
            </p>
          </motion.div>

          <div className="relative">
            {/* Connector line */}
            <div className="hidden sm:block absolute top-9 start-[16%] end-[16%] h-px bg-white/10" />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {HOW_IT_WORKS.map((step, i) => (
                <motion.div
                  key={i}
                  {...fadeUp(0.1 * i)}
                  className="flex flex-col items-center text-center space-y-3"
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-700 to-red-500 flex items-center justify-center shadow-lg shadow-red-900/30 relative z-10">
                    <span className="text-2xl font-black text-white">{step.step}</span>
                  </div>
                  <h3 className="font-bold text-white text-base">{step.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER CTA TEASER ─────────────────────────────────────────────── */}
      <section className="relative z-10 bg-gradient-to-r from-red-900/30 to-slate-950 border-t border-red-500/10 py-14 px-6 text-center mb-20">
        <motion.div {...fadeUp(0)} className="max-w-xl mx-auto space-y-4">
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            {t('welcome.cta.title')}
          </h2>
          <p className="text-slate-400 text-sm">
            {t('welcome.cta.desc')}
          </p>
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-red-600/10 border border-red-500/20 text-red-400 text-sm font-medium">
            <ChevronDown size={16} className="animate-bounce" />
            {t('welcome.scrollDown')}
          </div>
        </motion.div>
      </section>
    </div>
  );
}
