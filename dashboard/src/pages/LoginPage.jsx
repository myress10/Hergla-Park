import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import LangSwitcher from '../components/LangSwitcher';
import { Eye, EyeOff, Mail, Lock, LogIn, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { t } = useTranslation();
  const { login, getDefaultRoute } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    try {
      const userData = await login(email.trim(), password, remember);
      const route = getDefaultRoute(userData.role);
      navigate(route, { replace: true });
    } catch (err) {
      let message;
      if (!err.response) {
        // No response at all — network error or timeout
        message = t('login.error.serverUnreachable');
      } else if (err.response.status === 401) {
        message = t('login.error.invalidCredentials');
      } else {
        message = err.response?.data?.message || t('login.error.networkError');
      }
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Language switcher top right */}
      <div className="flex justify-end p-4">
        <LangSwitcher variant="dropdown" />
      </div>

      {/* Centered login card */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <img src="/logo.png" alt="Hergla Park Logo" className="w-24 h-24 object-contain mb-4" />
            <h1 className="text-xl font-bold text-slate-800">{t('login.title')}</h1>
            <p className="text-slate-500 text-sm mt-1">{t('login.subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Email field */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {t('login.emailLabel')}
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('login.emailPlaceholder')}
                  required
                  className="w-full ps-9 pe-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-navy/30 focus:border-navy transition-colors"
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-slate-700">
                  {t('login.passwordLabel')}
                </label>
                <button
                  type="button"
                  className="text-sm text-red-500 hover:text-red-600 font-medium transition-colors"
                  tabIndex={-1}
                  id="forgot-password-link"
                >
                  {t('login.forgotPassword')}
                </button>
              </div>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full ps-9 pe-11 py-3 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-navy/30 focus:border-navy transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  id="toggle-password-btn"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2">
              <input
                id="remember-me"
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 text-navy border-slate-300 rounded cursor-pointer"
              />
              <label htmlFor="remember-me" className="text-sm text-slate-600 cursor-pointer">
                {t('login.rememberMe')}
              </label>
            </div>

            {/* Submit button */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading || !email || !password}
              className="w-full bg-navy text-white py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2
                hover:bg-navy/90 active:scale-[0.98] transition-all duration-150
                disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <LogIn size={18} />
              )}
              {t('login.submitButton')}
            </button>
          </form>

          {/* Divider */}
          <div className="border-t border-slate-100 mt-6 pt-5 text-center">
            <p className="text-sm text-slate-500">
              {t('login.contactSupport')}
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-slate-400">
        {t('login.copyright')}
      </footer>
    </div>
  );
}
