import { Navigate } from 'react-router-dom';
import { LoadingState } from '../core-components';
import { useAuth } from '../hooks/useAuth';

export default function RoleBasedRoute({ children, allowedRoles = [], fallback = null }) {
  const { isAuthenticated, loading, user } = useAuth();

  // Convert single role to array for consistency
  const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (loading) {
    return <LoadingState message="Loading..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has required role
  if (rolesArray.length > 0 && !rolesArray.includes(user?.role)) {
    return fallback || <Navigate to="/" replace />;
  }

  return children;
}
