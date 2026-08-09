import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LangProvider } from './context/LangContext';
import ProtectedRoute from './routes/ProtectedRoute';
import RoleRoute from './routes/RoleRoute';
import DashboardLayout from './layouts/DashboardLayout';
import LoginPage from './pages/LoginPage';
import EspacesOverviewPage from './pages/EspacesOverviewPage';
import MyEspacePage from './pages/MyEspacePage';
import UsersPage from './pages/UsersPage';
import SceneEditorPage from './pages/SceneEditorPage';
import NotFoundPage from './pages/NotFoundPage';
import './i18n/index';
import { Toaster } from 'react-hot-toast';

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'SUPERADMIN') return <Navigate to="/espaces" replace />;
  return <Navigate to="/mon-espace" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" toastOptions={{ duration: 4000 }} />
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
              {/* SUPERADMIN only */}
              <Route
                path="/espaces"
                element={
                  <RoleRoute allowedRoles={['SUPERADMIN']}>
                    <EspacesOverviewPage />
                  </RoleRoute>
                }
              />
              <Route
                path="/utilisateurs"
                element={
                  <RoleRoute allowedRoles={['SUPERADMIN']}>
                    <UsersPage />
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
                element={<MyEspacePage />}
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
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </LangProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
