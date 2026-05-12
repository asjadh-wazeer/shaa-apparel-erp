import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '../store';
import { ROUTES } from '../shared/constants';

interface ProtectedRouteProps {
  requiredPermission?: string;
  redirectTo?: string;
}

export function ProtectedRoute({
  requiredPermission,
  redirectTo = ROUTES.LOGIN,
}: ProtectedRouteProps): React.JSX.Element {
  const location = useLocation();
  const { isAuthenticated, permissions } = useAppSelector((s) => s.auth);

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (requiredPermission && !permissions.includes(requiredPermission)) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Access Denied</h2>
          <p className="text-sm text-gray-500 mt-1">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
