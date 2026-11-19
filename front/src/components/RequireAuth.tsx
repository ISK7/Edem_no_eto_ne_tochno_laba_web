import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageLoader } from './Loader';

interface RequireAuthProps {
  adminOnly?: boolean;
}

export function RequireAuth({ adminOnly = false }: RequireAuthProps) {
  const { user, status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return <PageLoader label="Проверяем сессию…" />;
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  if (adminOnly && user.role !== 'ADMIN') {
    return <Navigate to="/requests" replace />;
  }

  return <Outlet />;
}
