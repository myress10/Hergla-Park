import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

function KeyCap({ char, label, isPressed }) {
  return (
    <motion.div
      className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center border-b-[5px] transition-all duration-100 font-bold select-none
        ${isPressed
          ? 'bg-red-600 border-red-800 text-white translate-y-[3px] border-b-[2px] shadow-[0_0_15px_rgba(220,38,38,0.7)]'
          : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
        }
      `}
      animate={{
        scale: isPressed ? 0.95 : 1,
      }}
    >
      <span className="text-xl leading-none uppercase">{char}</span>
      {label && <span className="text-[9px] text-slate-400 mt-1 uppercase leading-none">{label}</span>}
    </motion.div>
  );
}

export default function ControlsDiagram() {
  const { t } = useTranslation();
  const [pressedKeys, setPressedKeys] = useState({});

  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      if (['z', 'q', 's', 'd', 'e'].includes(key)) {
        setPressedKeys((prev) => ({ ...prev, [key]: true }));
      }
    };

    const handleKeyUp = (e) => {
      const key = e.key.toLowerCase();
      if (['z', 'q', 's', 'd', 'e'].includes(key)) {
        setPressedKeys((prev) => ({ ...prev, [key]: false }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <div className="bg-slate-950/40 backdrop-blur-md rounded-3xl border border-white/10 p-8 space-y-8 flex flex-col items-center justify-center max-w-sm mx-auto shadow-2xl">
      {/* Keyboard movement keys block */}
      <div className="space-y-2 flex flex-col items-center">
        <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase mb-2">
          {t('controls.movementLabel')}
        </p>

        {/* Key row 1: Z */}
        <div>
          <KeyCap char="Z" label="↑" isPressed={pressedKeys['z']} />
        </div>

        {/* Key row 2: Q S D */}
        <div className="flex gap-2">
          <KeyCap char="Q" label="←" isPressed={pressedKeys['q']} />
          <KeyCap char="S" label="↓" isPressed={pressedKeys['s']} />
          <KeyCap char="D" label="→" isPressed={pressedKeys['d']} />
        </div>
      </div>

      {/* Keyboard action keys block */}
      <div className="w-full border-t border-white/5 pt-6 flex flex-col items-center">
        <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase mb-4">
          {t('controls.actionLabel')}
        </p>
        <div className="flex gap-4 items-center">
          <KeyCap char="E" label={t('controls.interactTitle')} isPressed={pressedKeys['e']} />
          <div className="text-start">
            <h4 className="text-sm font-semibold text-white uppercase tracking-wide">
              {t('controls.interactTitle')}
            </h4>
            <p className="text-xs text-slate-400 max-w-[180px] mt-1 leading-normal">
              {t('controls.interactDesc')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
