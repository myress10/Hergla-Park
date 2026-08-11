import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_DEFAULT_ROUTES = {
  SUPERADMIN: '/espaces',
  ADMIN: '/mon-espace',
  EMPLOYE: '/mon-espace',
};

/**
 * Blocks access if the user's role is not in allowedRoles[].
 * Redirects to their default route.
 */
export default function RoleRoute({ children, allowedRoles }) {
  const { user } = useAuth();

  if (!user) return null; // ProtectedRoute handles the null case

  // ROOT role has super-user access to all admin routes
  if (user.role === 'ROOT' || allowedRoles.includes(user.role)) {
    return children;
  }

  const defaultRoute = ROLE_DEFAULT_ROUTES[user.role] || '/espaces';
  return <Navigate to={defaultRoute} replace />;
}
