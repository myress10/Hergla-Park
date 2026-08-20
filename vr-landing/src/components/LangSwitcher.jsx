import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { Globe } from 'lucide-react';

const LANGUAGES = [
  { code: 'fr', label: 'FR' },
  { code: 'ar', label: 'العربية' },
  { code: 'en', label: 'EN' },
];

export default function LangSwitcher() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'fr';

  useEffect(() => {
    // Sync document direction with language
    const dir = currentLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = currentLang;
  }, [currentLang]);

  const cycleLanguage = () => {
    const currentIndex = LANGUAGES.findIndex((l) => l.code === currentLang);
    const nextIndex = (currentIndex + 1) % LANGUAGES.length;
    const nextLang = LANGUAGES[nextIndex].code;
    i18n.changeLanguage(nextLang);
    localStorage.setItem('hergla_vr_lang', nextLang);
  };

  const selectLanguage = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('hergla_vr_lang', code);
  };

  return (
    <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full p-1 text-xs font-semibold">
      <Globe size={13} className="text-white/70 ms-2 me-1" />
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          onClick={() => selectLanguage(l.code)}
          id={`vr-lang-btn-${l.code}`}
          className={`px-2.5 py-1 rounded-full uppercase tracking-wider transition-all ${
            currentLang === l.code
              ? 'bg-red-600 text-white shadow-md font-bold'
              : 'text-white/80 hover:text-white hover:bg-white/10'
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
