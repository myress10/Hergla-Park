import { useTranslation } from 'react-i18next';
import { useLang } from '../context/LangContext';

/**
 * Dropdown language switcher for FR / AR.
 * Applies dir="rtl" on <html> via LangContext.
 */
export default function LangSwitcher({ variant = 'minimal' }) {
  const { lang, switchLang } = useLang();
  const { t } = useTranslation();

  if (variant === 'minimal' || variant === 'toggle') {
    // Minimalist FR | AR with underline indicator matching benchmark screen.jpg
    return (
      <div className="flex items-center gap-3 text-xs font-bold tracking-wider select-none">
        <button
          type="button"
          onClick={() => switchLang('fr')}
          className={`pb-0.5 transition-all ${
            lang === 'fr'
              ? 'border-b-2 border-slate-900 text-slate-900'
              : 'text-slate-400 hover:text-slate-600 border-b-2 border-transparent'
          }`}
          id="lang-fr-btn"
        >
          FR
        </button>
        <button
          type="button"
          onClick={() => switchLang('ar')}
          className={`pb-0.5 transition-all ${
            lang === 'ar'
              ? 'border-b-2 border-slate-900 text-slate-900'
              : 'text-slate-400 hover:text-slate-600 border-b-2 border-transparent'
          }`}
          id="lang-ar-btn"
        >
          AR
        </button>
      </div>
    );
  }

  // Dropdown variant (used on login page)
  return (
    <div className="relative">
      <select
        value={lang}
        onChange={(e) => switchLang(e.target.value)}
        className="appearance-none bg-white border border-slate-200 text-slate-700 text-sm rounded-lg px-4 py-2 pe-8 focus:outline-none focus:ring-2 focus:ring-navy cursor-pointer"
        id="lang-select"
        aria-label="Language selector"
      >
        <option value="fr">🌐 FR</option>
        <option value="ar">🌐 AR</option>
      </select>
    </div>
  );
}
