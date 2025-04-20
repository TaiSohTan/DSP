import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { authAPI } from '../services/api';

// Create context
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for existing token on mount
  useEffect(() => {
    const checkToken = async () => {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        setIsLoading(false);
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
            return;
          }
          
          try {
            const response = await authAPI.refreshToken(refreshToken);
            localStorage.setItem('access_token', response.data.access);
            
            // Set user from refreshed token
            const refreshedToken = jwtDecode(response.data.access);
            setCurrentUser({
              id: refreshedToken.user_id,
              email: refreshedToken.email,
              name: refreshedToken.name || '',
            });
          } catch (refreshError) {
            handleLogout();
          }
        } else {
          // Token valid, set user
          setCurrentUser({
            id: decodedToken.user_id,
            email: decodedToken.email,
            name: decodedToken.name || '',
          });
        }
      } catch (error) {
        // Invalid token
        handleLogout();
      } finally {
        setIsLoading(false);
      }
    };
    
    checkToken();
  }, []);
  
  // Login function
  const handleLogin = async (email, password) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authAPI.login(email, password);
      
      // Store tokens
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      
      // Set user from token
      const decodedToken = jwtDecode(response.data.access);
      setCurrentUser({
        id: decodedToken.user_id,
        email: decodedToken.email,
        name: decodedToken.name || '',
      });
      
      return true;
    } catch (error) {
      setError(error.response?.data?.detail || 'Login failed. Please check your credentials.');
      return false;
    } finally {
      setIsLoading(false);
    }
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
  };
  
  // Context value
  const value = {
    currentUser,
    isAuthenticated: !!currentUser,
    isLoading,
    error,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
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
