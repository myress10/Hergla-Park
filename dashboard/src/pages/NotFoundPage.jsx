import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Home } from 'lucide-react';

export default function NotFoundPage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const homeRoute = user?.role === 'SUPERADMIN' ? '/espaces' : user ? '/mon-espace' : '/login';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="text-8xl font-black text-slate-200 mb-4">404</div>
        <div className="w-16 h-16 bg-navy rounded-2xl flex items-center justify-center mx-auto mb-6">
          <span className="text-white font-black text-lg">HP</span>
        </div>
        <h1 className="text-xl font-bold text-slate-800 mb-2">{t('notFound.title')}</h1>
        <p className="text-slate-500 text-sm mb-8">{t('notFound.subtitle')}</p>
        <Link
          to={homeRoute}
          className="inline-flex items-center gap-2 bg-navy text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-navy/90 transition-colors"
          id="not-found-back-btn"
        >
          <Home size={16} />
          {t('notFound.back')}
        </Link>
      </div>
    </div>
  );
}
