import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/feedback/LoadingSpinner';

const ProtectedRoute = ({ requireAdmin = false, userOnly = false }) => {
  const { isAuthenticated, currentUser, isLoading } = useAuth();
  const location = useLocation();
  
  // Properly determine admin status from the currentUser
  const isAdmin = currentUser?.is_admin === true || currentUser?.is_staff === true;

  // Add debugging in development mode
  React.useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('[ProtectedRoute]', { 
        path: location.pathname,
        requireAdmin, 
        userOnly, 
        isAuthenticated,
        isAdmin, // Now this will have the correct value
        currentUser
      });
    }
  }, [location.pathname, requireAdmin, userOnly, isAuthenticated, isAdmin, currentUser]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login but preserve the intended location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if admin route but user is not admin
  if (requireAdmin && !isAdmin) {
    if (import.meta.env.DEV) {
      console.log('[ProtectedRoute] Non-admin attempting to access admin route - redirecting to home');
    }
    return <Navigate to="/" replace />;
  }

  // Check if user-only route but the user is an admin
  if (userOnly && isAdmin) {
    if (import.meta.env.DEV) {
      console.log('[ProtectedRoute] Admin attempting to access user-only route - redirecting to admin dashboard');
    }
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;