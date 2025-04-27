import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/feedback/LoadingSpinner';

/**
 * This component redirects already authenticated users to their appropriate dashboard
 * based on their role. It's used on public routes where logged-in users shouldn't stay,
 * such as login, register, and the landing page.
 */
const RedirectAuthenticatedUser = () => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  // Show loading state while checking auth status
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  // If the user is already authenticated, redirect them
  if (isAuthenticated) {
    // Redirect admins to admin dashboard and regular users to user dashboard
    return <Navigate to={isAdmin ? "/admin" : "/dashboard"} replace />;
  }

  // If not authenticated, render the child route (login, register, etc.)
  return <Outlet />;
};

export default RedirectAuthenticatedUser;