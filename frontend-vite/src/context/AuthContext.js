import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { authAPI } from '../services/api';

// Create context
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Debug log function
  const debugLog = (message, data = null) => {
    if (import.meta.env.DEV) {
      if (data) {
        console.log(`[Auth] ${message}`, data);
      } else {
        console.log(`[Auth] ${message}`);
      }
    }
  };

  // Check for existing token on mount
  useEffect(() => {
    const checkToken = async () => {
      debugLog('Checking for existing authentication token');
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        debugLog('No token found in localStorage');
        setIsLoading(false);
        return;
      }
      
      try {
        // Decode the token
        const decodedToken = jwtDecode(token);
        debugLog('Token decoded', decodedToken);
        
        // Log what we found in the token
        if (decodedToken.is_admin !== undefined) {
          debugLog(`Token contains is_admin flag: ${decodedToken.is_admin}`);
        }
        if (decodedToken.role !== undefined) {
          debugLog(`Token contains role: ${decodedToken.role}`);
        }
        
        // Check if token is expired
        const currentTime = Date.now() / 1000;
        if (decodedToken.exp < currentTime) {
          debugLog('Token is expired, attempting refresh');
          const refreshToken = localStorage.getItem('refresh_token');
          if (!refreshToken) {
            debugLog('No refresh token available');
            handleLogout();
            return;
          }
          
          try {
            debugLog('Attempting to refresh token');
            const response = await authAPI.refreshToken(refreshToken);
            localStorage.setItem('access_token', response.data.access);
            debugLog('Token refreshed successfully');
            
            // Get latest user profile from API
            try {
              debugLog('Fetching current user profile after token refresh');
              const userResponse = await authAPI.getProfile();
              debugLog('User profile received', userResponse.data);
              
              const userData = {
                id: userResponse.data.id,
                email: userResponse.data.email,
                fullName: userResponse.data.full_name,
                isAdmin: !!userResponse.data.is_admin,  // Convert to boolean
                role: userResponse.data.role || 'USER'
              };
              
              debugLog('Setting user data from API', userData);
              setCurrentUser(userData);
            } catch (userError) {
              debugLog('Failed to fetch user profile, using token data as fallback', userError);
              
              // If getting user details fails, fall back to token data
              const refreshedToken = jwtDecode(response.data.access);
              const userData = {
                id: refreshedToken.user_id,
                email: refreshedToken.email,
                fullName: refreshedToken.full_name || refreshedToken.name || '',
                isAdmin: !!refreshedToken.is_admin,  // Convert to boolean
                role: refreshedToken.role || 'USER'
              };
              
              debugLog('Setting user data from refreshed token', userData);
              setCurrentUser(userData);
            }
          } catch (refreshError) {
            debugLog('Token refresh failed', refreshError);
            handleLogout();
          }
        } else {
          debugLog('Token is valid, fetching user profile');
          
          // Token valid, attempt to get user profile
          try {
            const userResponse = await authAPI.getProfile();
            debugLog('User profile received', userResponse.data);
            
            const userData = {
              id: userResponse.data.id,
              email: userResponse.data.email,
              fullName: userResponse.data.full_name,
              // Force convert to boolean with !!
              isAdmin: !!userResponse.data.is_admin,
              role: userResponse.data.role || 'USER'
            };
            
            debugLog('Setting user data from API', userData);
            debugLog(`isAdmin status: ${userData.isAdmin}, role: ${userData.role}`);
            setCurrentUser(userData);
          } catch (userError) {
            debugLog('Failed to fetch user profile, using token data', userError);
            
            // If API fails, extract what we can from the token
            const userData = {
              id: decodedToken.user_id,
              email: decodedToken.email,
              fullName: decodedToken.full_name || decodedToken.name || '',
              // Force convert to boolean with !!
              isAdmin: !!decodedToken.is_admin,
              role: decodedToken.role || 'USER'
            };
            
            debugLog('Setting user data from token', userData);
            debugLog(`isAdmin status: ${userData.isAdmin}, role: ${userData.role}`);
            setCurrentUser(userData);
          }
        }
      } catch (error) {
        debugLog('Error processing token', error);
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
      debugLog(`Attempting login for ${email}`);
      const response = await authAPI.login(email, password);
      debugLog('Login successful', response.data);
      
      // Store tokens
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      
      // Set user from API response
      const userData = {
        id: response.data.user.id,
        email: response.data.user.email,
        fullName: response.data.user.full_name,
        // Force convert to boolean with !!
        isAdmin: !!response.data.user.is_admin,
        role: response.data.user.role || 'USER'
      };
      
      debugLog('Setting user data after login', userData);
      debugLog(`isAdmin status: ${userData.isAdmin}, role: ${userData.role}`);
      setCurrentUser(userData);
      
      return response.data.user;
    } catch (error) {
      debugLog('Login failed', error);
      setError(error.response?.data?.error || 'Login failed. Please check your credentials.');
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
    debugLog('Logging out user');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setCurrentUser(null);
  };
  
  // Computed value to determine if user is admin
  const isAdmin = React.useMemo(() => {
    if (!currentUser) return false;
    
    const hasAdminFlag = !!currentUser.isAdmin;
    const hasAdminRole = currentUser.role === 'ADMIN';
    
    debugLog(`Computing isAdmin: isAdmin=${hasAdminFlag}, role=${currentUser.role}`);
    return hasAdminFlag || hasAdminRole;
  }, [currentUser]);
  
  // Context value
  const value = {
    currentUser,
    isAuthenticated: !!currentUser,
    isAdmin,
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