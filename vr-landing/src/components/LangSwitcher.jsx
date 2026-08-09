import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { Globe } from 'lucide-react';

export default function LangSwitcher() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'fr';

  useEffect(() => {
    // Sync document direction with language
    const dir = currentLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = currentLang;
  }, [currentLang]);

  const toggleLanguage = () => {
    const nextLang = currentLang === 'fr' ? 'ar' : 'fr';
    i18n.changeLanguage(nextLang);
    localStorage.setItem('hergla_vr_lang', nextLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      id="vr-lang-switcher"
      className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 transition-all text-white text-xs font-semibold uppercase tracking-wider"
    >
      <Globe size={14} />
      <span>{currentLang === 'fr' ? 'AR' : 'FR'}</span>
    </button>
  );
}
