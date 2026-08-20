import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { getUser, updateUser, updateUserPassword } from '../api/usersApi';
import { getEspaces } from '../api/espacesApi';
import {
  User,
  Mail,
  Phone,
  Globe,
  Lock,
  Key,
  Shield,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  ChevronRight,
  Sparkles,
  Zap,
  Activity,
  Layers,
  Award,
} from 'lucide-react';
import toast from 'react-hot-toast';

const ROLE_CONFIGS = {
  ROOT: {
    label: 'ROOT',
    icon: '⚡',
    badgeBg: 'bg-indigo-900 text-indigo-100 border-indigo-700',
    level: 100,
  },
  SUPERADMIN: {
    label: 'SUPERADMIN',
    icon: '✪',
    badgeBg: 'bg-slate-900 text-white border-slate-800',
    level: 90,
  },
  ADMIN: {
    label: 'ADMIN',
    icon: '🔑',
    badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
    level: 50,
  },
  EMPLOYE: {
    label: 'EMPLOYE',
    icon: '👤',
    badgeBg: 'bg-slate-100 text-slate-700 border-slate-200',
    level: 20,
  },
};

export default function ProfilePage() {
  const { t } = useTranslation();
  const { user: authUser } = useAuth();
  const { lang, switchLang } = useLang();

  const [loading, setLoading] = useState(true);
  const [savingInfo, setSavingInfo] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [espaces, setEspaces] = useState([]);

  // Form states
  const [profileData, setProfileData] = useState({
    nom: '',
    email: '',
    telephone: '',
    langue: 'fr',
    role: 'EMPLOYE',
    assignedSpaceId: '',
    statut: 'En service / Connecté',
    customPermissions: [],
    createdAt: null,
  });

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Load fresh user data
  useEffect(() => {
    async function loadData() {
      if (!authUser?.id) return;
      setLoading(true);
      try {
        const [userRes, espacesRes] = await Promise.allSettled([
          getUser(authUser.id),
          getEspaces(),
        ]);

        if (espacesRes.status === 'fulfilled') {
          setEspaces(espacesRes.value.data?.data || []);
        }

        if (userRes.status === 'fulfilled' && userRes.value.data?.data) {
          const u = userRes.value.data.data;
          setProfileData({
            nom: u.nom || authUser.nom || '',
            email: u.email || authUser.email || '',
            telephone: u.telephone || '',
            langue: u.langue || lang || 'fr',
            role: u.role || authUser.role || 'EMPLOYE',
            assignedSpaceId: u.assignedSpaceId || '',
            statut: u.statut || t('profile.inServiceConnected'),
            customPermissions: u.customPermissions || [],
            createdAt: u.createdAt || new Date().toISOString(),
          });
        } else {
          // Fallback to authUser context
          setProfileData({
            nom: authUser.nom || '',
            email: authUser.email || '',
            telephone: authUser.telephone || '',
            langue: lang || 'fr',
            role: authUser.role || 'EMPLOYE',
            assignedSpaceId: authUser.assignedSpaceId || '',
            statut: t('profile.inServiceConnected'),
            customPermissions: authUser.customPermissions || [],
            createdAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.warn('Profile load fallback:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [authUser, lang, t]);

  const roleInfo = ROLE_CONFIGS[profileData.role] || ROLE_CONFIGS.EMPLOYE;

  const assignedSpaceObj = espaces.find((e) => e.id === profileData.assignedSpaceId);
  const assignedSpaceNom =
    profileData.role === 'SUPERADMIN' || profileData.role === 'ROOT'
      ? t('profile.allSpaces')
      : assignedSpaceObj?.nom || (profileData.assignedSpaceId ? t('profile.assignedSpaceTitle') : t('profile.unassigned'));

  const initials = profileData.nom
    ? profileData.nom
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : 'HP';

  // Handle Save Personal Info
  const handleSaveInfo = async (e) => {
    e.preventDefault();
    if (!authUser?.id) return;
    setSavingInfo(true);
    try {
      const payload = {
        nom: profileData.nom,
        email: profileData.email,
        telephone: profileData.telephone,
        langue: profileData.langue,
      };

      const res = await updateUser(authUser.id, payload);

      // Switch language if changed
      if (profileData.langue && profileData.langue !== lang) {
        switchLang(profileData.langue);
      }

      // Update localStorage cached user
      const stored = localStorage.getItem('hergla_user');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          localStorage.setItem(
            'hergla_user',
            JSON.stringify({ ...parsed, ...payload, nom: profileData.nom, email: profileData.email })
          );
        } catch (_) {}
      }

      toast.success(t('profile.successUpdate'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('common.error'));
    } finally {
      setSavingInfo(false);
    }
  };

  // Handle Update Password
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!authUser?.id) return;

    if (!newPassword || newPassword.length < 6) {
      toast.error(t('profile.passwordMinLength'));
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(t('profile.passwordsDontMatch'));
      return;
    }

    setSavingPassword(true);
    try {
      await updateUserPassword(authUser.id, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success(t('profile.successPassword'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('common.error'));
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-12">
      {/* Breadcrumb Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-1">
            <span>{t('nav.dashboard')}</span>
            <ChevronRight size={12} className="rtl:rotate-180" />
            <span className="text-slate-600 font-semibold">{t('profile.breadcrumb')}</span>
          </nav>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">{t('profile.title')}</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {t('profile.subtitle')}
          </p>
        </div>
      </div>

      {/* 1. Header Card with Avatar, Role & Status */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-navy to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Avatar and basic identity */}
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-indigo-500 to-emerald-400 p-0.5 shadow-lg">
                <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-white font-black text-2xl sm:text-3xl tracking-wider">
                  {initials}
                </div>
              </div>
              {/* Online Pulse Indicator */}
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-5 w-5 bg-emerald-500 border-2 border-slate-900 items-center justify-center">
                  <CheckCircle2 size={10} className="text-white" />
                </span>
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  {profileData.nom || 'Utilisateur Hergla Park'}
                </h2>
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-3 py-1 rounded-full border ${roleInfo.badgeBg} shadow-sm`}
                >
                  <span>{roleInfo.icon}</span>
                  {profileData.role}
                </span>
              </div>

              <p className="text-slate-300 text-xs sm:text-sm font-medium flex items-center gap-2">
                <Mail size={14} className="text-slate-400" />
                {profileData.email}
              </p>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 pt-1">
                <span className="inline-flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg backdrop-blur-md">
                  <MapPin size={13} className="text-indigo-300" />
                  {assignedSpaceNom}
                </span>
                <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {t('profile.inServiceConnected')}
                </span>
              </div>
            </div>
          </div>

          {/* Role Hierarchy Level Badge */}
          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 self-start md:self-auto min-w-[200px] text-end md:text-start">
            <div className="flex items-center justify-between gap-4 mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-200">
                {t('profile.hierarchyLevel')}
              </span>
              <Award size={16} className="text-amber-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white">
              {t('profile.level', { level: roleInfo.level })}
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              {profileData.role === 'ROOT' ? 'Global Super-Access' : 'Tenant Standard RBAC'}
            </p>
          </div>
        </div>

        {/* Decorative backdrop elements */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Main Grid: Forms & Overviews */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Personal Info & Security Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* 2. Personal Information Form */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                  <User size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">{t('profile.personalInfo')}</h3>
                  <p className="text-xs text-slate-400">{t('profile.personalInfoSub')}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveInfo} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    {t('profile.fullName')}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={profileData.nom}
                      onChange={(e) => setProfileData((p) => ({ ...p, nom: e.target.value }))}
                      required
                      placeholder="Ex: Sami Ben Romdhane"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
                      id="profile-name-input"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    {t('profile.email')}
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData((p) => ({ ...p, email: e.target.value }))}
                      required
                      placeholder="nom@herglapark.tn"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
                      id="profile-email-input"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    {t('profile.phone')}
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={profileData.telephone}
                      onChange={(e) => setProfileData((p) => ({ ...p, telephone: e.target.value }))}
                      placeholder="+216 98 123 456"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
                      id="profile-phone-input"
                    />
                  </div>
                </div>

                {/* Language Preference */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    {t('profile.language')}
                  </label>
                  <select
                    value={profileData.langue}
                    onChange={(e) => setProfileData((p) => ({ ...p, langue: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all cursor-pointer"
                    id="profile-lang-select"
                  >
                    <option value="fr">🇫🇷 Français (FR)</option>
                    <option value="ar">🇹🇳 العربية (AR)</option>
                    <option value="en">🇬🇧 English (EN)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={savingInfo}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm px-6 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 active:scale-[0.98] disabled:opacity-60"
                  id="profile-save-btn"
                >
                  {savingInfo ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  <span>{t('profile.saveChanges')}</span>
                </button>
              </div>
            </form>
          </div>

          {/* 3. Security Section: Change Password */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                  <Key size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">{t('profile.securityTitle')}</h3>
                  <p className="text-xs text-slate-400">{t('profile.securitySub')}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  {t('profile.currentPassword')}
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
                  id="current-password-input"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    {t('profile.newPassword')}
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
                    id="new-password-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    {t('profile.confirmPassword')}
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
                    id="confirm-password-input"
                  />
                </div>
              </div>

              {newPassword && confirmPassword && (
                <div className="text-xs font-semibold flex items-center gap-1.5">
                  {newPassword === confirmPassword ? (
                    <span className="text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 size={14} /> {t('profile.passwordsMatch')}
                    </span>
                  ) : (
                    <span className="text-rose-500 flex items-center gap-1">
                      <AlertCircle size={14} /> {t('profile.passwordsDontMatch')}
                    </span>
                  )}
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={savingPassword || (newPassword && newPassword !== confirmPassword)}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm px-6 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 active:scale-[0.98] disabled:opacity-60"
                  id="profile-password-submit-btn"
                >
                  {savingPassword ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Lock size={16} />
                  )}
                  <span>{t('profile.updatePassword')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Role & Assigned Space Overview (Read-Only) (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* 4. Role Hierarchy Overview Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Shield size={16} />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">{t('profile.roleOverview')}</h3>
                <p className="text-[11px] text-slate-400">{t('profile.roleOverviewSub')}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">{t('profile.activeRole')} :</span>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md border ${roleInfo.badgeBg}`}>
                  {roleInfo.label}
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed pt-1">
                {profileData.role === 'SUPERADMIN'
                  ? 'Gestion complète des espaces, utilisateurs, karts, scènes 3D et permissions.'
                  : profileData.role === 'ROOT'
                  ? 'Accès super-administrateur global, stealth mode, audit multi-tenant.'
                  : 'Opérations régulières selon le périmètre et espace assigné.'}
              </p>
            </div>

            {/* Custom Permissions overview */}
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">
                {t('profile.associatedPermissions')}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(profileData.customPermissions && profileData.customPermissions.length > 0
                  ? profileData.customPermissions
                  : ['espace:read', 'espace:update', 'kart:read', 'scene:edit']
                ).map((permKey) => (
                  <span
                    key={permKey}
                    className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200/80 font-mono"
                  >
                    ✓ {permKey}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Assigned Space / Attraction Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <MapPin size={16} />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">{t('profile.assignedSpaceTitle')}</h3>
                <p className="text-[11px] text-slate-400">{t('profile.assignedSpaceSub')}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2.5">
              <div className="flex items-center justify-between">
                <p className="font-bold text-slate-900 text-sm">{assignedSpaceNom}</p>
                {assignedSpaceObj && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    {assignedSpaceObj.statut || 'OUVERT'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {assignedSpaceObj?.categorie
                  ? `Catégorie : ${assignedSpaceObj.categorie}`
                  : 'Périmètre global couvrant l\'ensemble des attractions et services Hergla Park.'}
              </p>
            </div>
          </div>

          {/* Metadata Card */}
          <div className="bg-slate-900 text-slate-300 rounded-2xl p-5 shadow-lg space-y-3 text-xs">
            <div className="flex items-center justify-between text-white font-bold pb-2 border-b border-slate-800">
              <span>{t('profile.sessionAuditInfo')}</span>
              <Activity size={14} className="text-emerald-400" />
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">{t('profile.accountCreated')} :</span>
              <span className="font-medium text-slate-200">
                {profileData.createdAt
                  ? new Date(profileData.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-TN' : lang === 'en' ? 'en-US' : 'fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : '2026'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">{t('profile.sessionSecurity')} :</span>
              <span className="text-emerald-400 font-semibold">{t('profile.sessionProtected')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
