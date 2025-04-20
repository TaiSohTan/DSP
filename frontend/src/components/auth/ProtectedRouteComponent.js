import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/feedback/LoadingSpinner';

const ProtectedRoute = ({ requireAdmin = false }) => {
  const { isAuthenticated, currentUser, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Check if admin route but user is not admin
  if (requireAdmin && currentUser?.role !== 'ADMIN') {
    return <Navigate to="/" />;
  }

  return <Outlet />;
};

export default ProtectedRoute;