import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { authAPI } from '../services/api';
import { useLocation, useNavigate } from 'react-router-dom';

// Create context
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  
  // This flag prevents automatic error clearing on subsequent login attempts
  const [preventErrorReset, setPreventErrorReset] = useState(false);

  // Check for existing token on mount
  useEffect(() => {
    const checkToken = async () => {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        setIsLoading(false);
        // If on protected route, redirect to login
        redirectIfProtectedRoute();
        return;
      }
      
      try {
        // Decode the token
        const decodedToken = jwtDecode(token);
        
        // Check if token is expired
        const currentTime = Date.now() / 1000;
        if (decodedToken.exp < currentTime) {
          // Token expired, try to refresh
          const refreshToken = localStorage.getItem('refresh_token');
          if (!refreshToken) {
            handleLogout();
            // If on protected route, redirect to login
            redirectIfProtectedRoute();
            return;
          }
          
          try {
            const response = await authAPI.refreshToken(refreshToken);
            localStorage.setItem('access_token', response.data.access);
            
            // After refreshing token, fetch the complete user profile
            try {
              const userResponse = await authAPI.getProfile();
              
              // Set user data from the API response
              const userData = {
                id: userResponse.data.id,
                email: userResponse.data.email,
                name: userResponse.data.full_name || '',
                is_staff: userResponse.data.is_admin || false,
                is_admin: userResponse.data.is_admin || false,
              };
              
              setCurrentUser(userData);
            } catch (profileError) {
              // If profile fetch fails, fall back to token data
              const refreshedToken = jwtDecode(response.data.access);
              
              const userData = {
                id: refreshedToken.user_id,
                email: refreshedToken.email,
                name: refreshedToken.name || '',
                is_staff: refreshedToken.is_staff || false,
                is_admin: refreshedToken.is_staff || refreshedToken.is_superuser || false,
              };
              
              setCurrentUser(userData);
            }
            
            // No automatic redirect - stay on current page
          } catch (refreshError) {
            handleLogout();
            // If on protected route, redirect to login
            redirectIfProtectedRoute();
          }
        } else {
          // Token valid, fetch user profile from API for complete data
          try {
            const userResponse = await authAPI.getProfile();
            
            // Set user data from the API response
            const userData = {
              id: userResponse.data.id,
              email: userResponse.data.email,
              name: userResponse.data.full_name || '',
              is_staff: userResponse.data.is_admin || false,
              is_admin: userResponse.data.is_admin || false,
            };
            
            setCurrentUser(userData);
          } catch (profileError) {
            // If API fetch fails, fall back to token data
            const userData = {
              id: decodedToken.user_id,
              email: decodedToken.email,
              name: decodedToken.name || '',
              is_staff: decodedToken.is_staff || false,
              is_admin: decodedToken.is_staff || decodedToken.is_superuser || false,
            };
            
            setCurrentUser(userData);
          }
        }
      } catch (error) {
        // Invalid token
        handleLogout();
        // If on protected route, redirect to login
        redirectIfProtectedRoute();
      } finally {
        setIsLoading(false);
      }
    };
    
    const redirectIfProtectedRoute = () => {
      const protectedRoutes = ['/dashboard', '/profile', '/my-votes', '/vote', '/elections/create'];
      const adminRoutes = ['/admin'];
      
      // If on a protected route without authentication, redirect to login
      if (protectedRoutes.some(route => location.pathname.startsWith(route)) || 
          adminRoutes.some(route => location.pathname.startsWith(route))) {
        navigate('/login', { replace: true });
      }
    };
    
    checkToken();
  }, [location.pathname, navigate]);
  
  // Login function
  const handleLogin = async (email, password, rememberMe = false, shouldNavigate = true) => {
    // Only clear errors if we're not preventing error reset
    if (!preventErrorReset) {
      setError(null);
    }
    
    setIsLoading(true);
    
    try {
      const response = await authAPI.login(email, password, rememberMe);
      
      // Store tokens
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      
      console.log("Login response:", response.data); // Debug login response
      
      // Try to get user data directly from the response if available
      if (response.data.user) {
        const userData = {
          id: response.data.user.id,
          email: response.data.user.email,
          name: response.data.user.full_name || '',
          is_staff: response.data.user.is_admin || false,
          is_admin: response.data.user.is_admin || false, // Directly use from response
        };
        
        console.log("Using user data from response:", userData);
        setCurrentUser(userData);
      } else {
        // Fall back to token data if user object is not provided
        const decodedToken = jwtDecode(response.data.access);
        const userData = {
          id: decodedToken.user_id,
          email: decodedToken.email,
          name: decodedToken.name || '',
          is_staff: decodedToken.is_staff || false,
          is_admin: decodedToken.is_staff || decodedToken.is_superuser || false,
        };
        
        console.log("Using decoded token data:", userData);
        setCurrentUser(userData);
      }
      
      // Clear any previous errors on successful login
      setError(null);
      setPreventErrorReset(false);
      
      // Only navigate if the flag is true (default)
      if (shouldNavigate) {
        navigateAfterLogin();
      }
      
      return response.data.user || true;
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 
                           error.response?.data?.error || 
                           'Login failed. Please check your credentials.';
      setError(errorMessage);
      
      // Set the flag to prevent clearing errors on next attempt
      setPreventErrorReset(true);
      
      throw error; // Rethrow to allow component-level handling
    } finally {
      setIsLoading(false);
    }
  };
  
  // After login navigation
  const navigateAfterLogin = () => {
    console.log('Navigating after login. Current user:', currentUser);
    
    // Ensure we have the current user loaded and check admin status
    if (currentUser) {
      // Debug the admin status fields
      console.log('Admin status check:', {
        is_admin: currentUser.is_admin,
        is_staff: currentUser.is_staff,
        is_superuser: currentUser?.is_superuser
      });
      
      // Redirect admin users to admin dashboard
      if (currentUser.is_admin === true || currentUser.is_staff === true) {
        console.log('User is admin, redirecting to /admin');
        navigate('/admin', { replace: true });
      } else {
        // Redirect regular users to user dashboard
        console.log('User is not admin, redirecting to /dashboard');
        navigate('/dashboard', { replace: true });
      }
    } else {
      console.error('No user data available for navigation decision');
      // Default to dashboard if user data is not available
      navigate('/dashboard', { replace: true });
    }
  };
  
  // Manual method to clear errors (for use in components)
  const clearError = () => {
    setError(null);
    setPreventErrorReset(false);
  };
  
  // Register function
  const handleRegister = async (userData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await authAPI.register(userData);
      return true;
    } catch (error) {
      const errorMessage = error.response?.data || {};
      
      // Format error messages
      const formattedErrors = Object.keys(errorMessage).map(key => {
        return `${key}: ${errorMessage[key].join(' ')}`;
      }).join(', ');
      
      setError(formattedErrors || 'Registration failed. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Logout function
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setCurrentUser(null);
    // Force an immediate redirect to homepage
    navigate('/', { replace: true });
  };
  
  // Context value
  const value = {
    currentUser,
    setCurrentUser,
    isAuthenticated: !!currentUser,
    isLoading,
    error,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    clearError,
    navigateAfterLogin,
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;