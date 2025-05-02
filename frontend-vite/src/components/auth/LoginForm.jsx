import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import Alert from '../common/feedback/Alert';
import Button from '../common/buttons/Button';
import { motion, AnimatePresence } from 'framer-motion';
import AdminRedirect from './AdminRedirect';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const { login, error: contextError, clearError } = useAuth();
  const navigate = useNavigate();

  // Use effect to sync errors from context to local state
  useEffect(() => {
    if (contextError) {
      setLoginError(contextError);
    }
  }, [contextError]);

  // Enhanced animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.6, 
        ease: "easeOut" 
      }
    }
  };

  const formItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (custom) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: custom * 0.1,
        duration: 0.5
      }
    })
  };

  // Handle form submission with direct admin detection
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      // First attempt to log in without any redirects
      const loginResult = await authAPI.login(email, password, rememberMe);
      
      // Store tokens directly
      localStorage.setItem('access_token', loginResult.data.access);
      localStorage.setItem('refresh_token', loginResult.data.refresh);
      
      // Extract user data from response
      const userData = loginResult.data.user || {};
      
      // Check if user is admin
      const isAdminUser = userData.is_admin === true;
      
      // Set local state - important to do before potential redirects
      setLoginError(null); // Clear any error on success
      setIsAdmin(isAdminUser);
      setLoginSuccess(true);
      
      // Let the context know user is logged in (without redirect)
      // We'll disable context login for now as it might be causing the refresh
      // login(email, password, rememberMe, false);
      
      // Regular users go to dashboard
      if (!isAdminUser) {
        console.log("Redirecting to user dashboard");
        // Use a longer delay to ensure state updates before navigating
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 500);
      }
      // Admin users will be redirected by the AdminRedirect component
      
    } catch (error) {
      console.error('Login error:', error);
      
      // Get the detailed error message
      let errorMessage = 'Login failed. Please check your credentials.';
      
      if (error.response) {
        // Get specific error message from response if available
        errorMessage = error.response.data?.error || 
                       error.response.data?.detail || 
                       'Invalid email or password. Please try again.';
      } else if (error.request) {
        errorMessage = 'No response received from server. Please try again later.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Very important - set error state here, before any async operations
      setLoginError(errorMessage);
      
      // Add this to prevent any potential state resets after error
      setTimeout(() => {
        if (!loginError) {
          setLoginError(errorMessage);
        }
      }, 100);
      
      // For debugging
      console.log('Setting error message to:', errorMessage);
      
      // Prevent the effect from clearing the error
      if (clearError) {
        clearError();
      }
      
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clear error when user starts typing
  const handleInputChange = (setter) => (e) => {
    setter(e.target.value);
    if (loginError) {
      // Only clear error when user modifies input fields after an error
      setLoginError(null);
      clearError(); // Also clear context error
    }
  };

  const dismissError = () => {
    setLoginError(null);
    clearError(); // Also clear context error
  };

  // If login was successful and user is admin, render the admin redirect component
  if (loginSuccess && isAdmin) {
    console.log("Rendering AdminRedirect component");
    return <AdminRedirect />;
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-50">
      <motion.div 
        className="w-full max-w-md"
        variants={cardVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 px-8 pt-8 pb-10 relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-primary-500 via-blue-500 to-purple-500"></div>
          
          {/* Decorative elements */}
          <div className="absolute opacity-5 top-20 right-0 w-40 h-40 bg-primary-500 rounded-full -mr-20"></div>
          <div className="absolute opacity-5 bottom-20 left-0 w-60 h-60 bg-blue-500 rounded-full -ml-32"></div>

          {/* Logo */}
          <div className="text-center mb-8 relative">
            <div className="mx-auto h-20 w-20 bg-gradient-to-br from-primary-600 to-primary-400 rounded-full flex items-center justify-center shadow-lg mb-4 transform hover:scale-105 transition-all duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-primary-600 to-blue-600 mb-1">Welcome Back</h2>
            <p className="text-gray-500">Sign in to your account to continue</p>
          </div>

          <AnimatePresence>
            {loginError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="mb-6"
              >
                <Alert 
                  type="error" 
                  message={loginError} 
                  dismissible={true}
                  onDismiss={dismissError}
                />
              </motion.div>
            )}
          </AnimatePresence>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <motion.div custom={1} variants={formItemVariants} initial="hidden" animate="visible">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 group-hover:text-primary-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition duration-200 group-hover:border-primary-300"
                  id="email"
                  type="email"
                  value={email}
                  onChange={handleInputChange(setEmail)}
                  required
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
            </motion.div>
            
            <motion.div custom={2} variants={formItemVariants} initial="hidden" animate="visible">
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <Link to="/forgot-password" className="text-sm font-medium text-primary-600 hover:text-primary-500 transition-colors duration-200 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 group-hover:text-primary-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition duration-200 group-hover:border-primary-300"
                  id="password"
                  type="password"
                  value={password}
                  onChange={handleInputChange(setPassword)}
                  required
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
            </motion.div>
            
            <motion.div custom={3} variants={formItemVariants} initial="hidden" animate="visible" className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded transition duration-200"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>
            </motion.div>
            
            <motion.div custom={4} variants={formItemVariants} initial="hidden" animate="visible">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                isLoading={isSubmitting}
                variant="primary"
                size="lg"
                fullWidth
                className="relative overflow-hidden group"
              >
                <span className="relative z-10">Sign In</span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Button>
            </motion.div>
          </form>

          <motion.div 
            custom={5} 
            variants={formItemVariants} 
            initial="hidden" 
            animate="visible" 
            className="mt-8 text-center"
          >
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500 transition-colors duration-200 hover:underline">
                Create an account
              </Link>
            </p>
          </motion.div>
          
          {/* Security Note */}
          <motion.div 
            custom={6} 
            variants={formItemVariants} 
            initial="hidden" 
            animate="visible" 
            className="mt-8 pt-6 border-t border-gray-100"
          >
            <div className="flex items-center justify-center text-xs text-gray-500 space-x-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Secure login with 256-bit encryption</span>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginForm;