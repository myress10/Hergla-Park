import { useTranslation } from 'react-i18next';
import { useLang } from '../context/LangContext';

/**
 * Multi-language switcher supporting FR / AR / EN.
 * Handles RTL styling when Arabic is active.
 */
export default function LangSwitcher({ variant = 'minimal' }) {
  const { lang, switchLang } = useLang();
  const { t } = useTranslation();

  const languages = [
    { code: 'fr', label: 'FR', title: 'Français' },
    { code: 'ar', label: 'AR', title: 'العربية' },
    { code: 'en', label: 'EN', title: 'English' },
  ];

  if (variant === 'minimal' || variant === 'toggle') {
    // Minimalist FR | AR | EN with underline/pill active indicator
    return (
      <div className="flex items-center gap-2 text-xs font-bold tracking-wider select-none bg-slate-100/70 p-1 rounded-xl border border-slate-200/50">
        {languages.map((l) => (
          <button
            key={l.code}
            type="button"
            onClick={() => switchLang(l.code)}
            title={l.title}
            className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all ${
              lang === l.code
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            id={`lang-${l.code}-btn`}
          >
            {l.label}
          </button>
        ))}
      </div>
    );
  }

  // Dropdown variant (used on login page and dialogs)
  return (
    <div className="relative">
      <select
        value={lang}
        onChange={(e) => switchLang(e.target.value)}
        className="appearance-none bg-white border border-slate-200 text-slate-700 text-sm rounded-xl px-4 py-2 pe-8 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer shadow-2xs font-medium"
        id="lang-select"
        aria-label="Language selector"
      >
        <option value="fr">🇫🇷 Français (FR)</option>
        <option value="ar">🇹🇳 العربية (AR)</option>
        <option value="en">🇬🇧 English (EN)</option>
      </select>
    </div>
  );
}
