import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';

/**
 * A component that forces a redirect to the admin dashboard
 * This is used when we know the user is an admin from the login response
 * and want to bypass waiting for the auth context to update
 */
const AdminRedirect = () => {
  useEffect(() => {
    console.log('AdminRedirect component mounted - forcing redirect to /admin');
  }, []);

  return <Navigate to="/admin" replace />;
};

export default AdminRedirect;