import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LangProvider } from './context/LangContext';
import ProtectedRoute from './routes/ProtectedRoute';
import RoleRoute from './routes/RoleRoute';
import DashboardLayout from './layouts/DashboardLayout';
import LoginPage from './pages/LoginPage';
import EspacesOverviewPage from './pages/EspacesOverviewPage';
import MyEspacePage from './pages/MyEspacePage';
import ProfilePage from './pages/ProfilePage';
import UsersPage from './pages/UsersPage';
import SceneEditorPage from './pages/SceneEditorPage';
import KartsConfigPage from './pages/KartsConfigPage';
import AuditLogsPage from './pages/AuditLogsPage';
import SubscriptionPage from './pages/SubscriptionPage';
import RootUpgradeRequestsPage from './pages/RootUpgradeRequestsPage';
import NotFoundPage from './pages/NotFoundPage';
import './i18n/index';
import { Toaster } from 'react-hot-toast';

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'SUPERADMIN' || user.role === 'ROOT') return <Navigate to="/espaces" replace />;
  return <Navigate to="/mon-espace" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: '600',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          },
        }}
      />
      <AuthProvider>
        <LangProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />

            {/* Root redirect */}
            <Route path="/" element={<RootRedirect />} />

            {/* Protected dashboard routes */}
            <Route
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              {/* SUPERADMIN & ROOT only */}
              <Route
                path="/espaces"
                element={
                  <RoleRoute allowedRoles={['SUPERADMIN', 'ROOT']}>
                    <EspacesOverviewPage />
                  </RoleRoute>
                }
              />
              <Route
                path="/espaces/:espaceId"
                element={
                  <RoleRoute allowedRoles={['SUPERADMIN', 'ROOT', 'ADMIN', 'EMPLOYE']}>
                    <MyEspacePage />
                  </RoleRoute>
                }
              />
              <Route
                path="/utilisateurs"
                element={
                  <RoleRoute allowedRoles={['SUPERADMIN', 'ROOT']}>
                    <UsersPage />
                  </RoleRoute>
                }
              />
              <Route
                path="/audit-logs"
                element={
                  <RoleRoute allowedRoles={['SUPERADMIN', 'ROOT', 'ADMIN']}>
                    <AuditLogsPage />
                  </RoleRoute>
                }
              />

              {/* Subscriptions & Quotas (SUPERADMIN, ROOT, ADMIN) */}
              <Route
                path="/abonnement"
                element={
                  <RoleRoute allowedRoles={['SUPERADMIN', 'ROOT', 'ADMIN']}>
                    <SubscriptionPage />
                  </RoleRoute>
                }
              />

              {/* ROOT Only: Upgrade Requests Management */}
              <Route
                path="/root/demandes-upgrade"
                element={
                  <RoleRoute allowedRoles={['ROOT']}>
                    <RootUpgradeRequestsPage />
                  </RoleRoute>
                }
              />

              {/* ADMIN + EMPLOYE */}
              <Route
                path="/mon-espace"
                element={
                  <RoleRoute allowedRoles={['ADMIN', 'EMPLOYE', 'SUPERADMIN']}>
                    <MyEspacePage />
                  </RoleRoute>
                }
              />

              {/* Profile (all roles) */}
              <Route
                path="/mon-profil"
                element={<ProfilePage />}
              />

              {/* 3D Scene Editor (all authenticated roles) */}
              <Route
                path="/editeur-3d"
                element={
                  <RoleRoute allowedRoles={['SUPERADMIN', 'ADMIN', 'EMPLOYE']}>
                    <SceneEditorPage />
                  </RoleRoute>
                }
              />
              <Route
                path="/espaces/:espaceId/editeur-3d"
                element={
                  <RoleRoute allowedRoles={['SUPERADMIN', 'ADMIN', 'EMPLOYE']}>
                    <SceneEditorPage />
                  </RoleRoute>
                }
              />

              {/* Karting Configuration (SUPERADMIN, ADMIN, EMPLOYE) */}
              <Route
                path="/configuration-karts"
                element={
                  <RoleRoute allowedRoles={['SUPERADMIN', 'ADMIN', 'EMPLOYE']}>
                    <KartsConfigPage />
                  </RoleRoute>
                }
              />
              <Route
                path="/espaces/:espaceId/karts"
                element={
                  <RoleRoute allowedRoles={['SUPERADMIN', 'ADMIN', 'EMPLOYE']}>
                    <KartsConfigPage />
                  </RoleRoute>
                }
              />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </LangProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
