import { useTranslation } from 'react-i18next';
import { useLang } from '../context/LangContext';

/**
 * Dropdown language switcher for FR / AR.
 * Applies dir="rtl" on <html> via LangContext.
 */
export default function LangSwitcher({ variant = 'dropdown' }) {
  const { lang, switchLang } = useLang();
  const { t } = useTranslation();

  if (variant === 'toggle') {
    // Inline FR | AR toggle (used in topbar)
    return (
      <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
        <button
          onClick={() => switchLang('fr')}
          className={`px-3 py-1 text-sm font-semibold rounded-md transition-all ${
            lang === 'fr'
              ? 'bg-white text-navy shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
          id="lang-fr-btn"
        >
          FR
        </button>
        <button
          onClick={() => switchLang('ar')}
          className={`px-3 py-1 text-sm font-semibold rounded-md transition-all ${
            lang === 'ar'
              ? 'bg-white text-navy shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
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
