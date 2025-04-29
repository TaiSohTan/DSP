import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Alert from '../common/feedback/Alert';
import Button from '../common/buttons/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { authAPI } from '../../services/api';

const RegisterForm = () => {
    const [fullName, setFullName] = useState(''); 
    const [email, setEmail] = useState('');
    const [governmentId, setGovernmentId] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const navigate = useNavigate();

    // Animation variants
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

    // Password strength checker
    const checkPasswordStrength = (pass) => {
      let score = 0;
      
      // Length check
      if (pass.length >= 8) score += 1;
      if (pass.length >= 12) score += 1;
      
      // Complexity checks
      if (/[A-Z]/.test(pass)) score += 1; // Has uppercase
      if (/[0-9]/.test(pass)) score += 1; // Has number
      if (/[^A-Za-z0-9]/.test(pass)) score += 1; // Has special char
      
      setPasswordStrength(score);
    };

    // Handle password input change
    const handlePasswordChange = (e) => {
      const newPassword = e.target.value;
      setPassword(newPassword);
      checkPasswordStrength(newPassword);
      
      // Clear password error if both fields are filled
      if (newPassword && confirmPassword && newPassword === confirmPassword) {
        setPasswordError('');
      } else if (confirmPassword && newPassword !== confirmPassword) {
        setPasswordError('Passwords do not match.');
      }
    };

    // Handle confirm password input change
    const handleConfirmPasswordChange = (e) => {
      const value = e.target.value;
      setConfirmPassword(value);
      
      // Check if passwords match when both fields are filled
      if (password && value && password !== value) {
        setPasswordError('Passwords do not match.');
      } else {
        setPasswordError('');
      }
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      
      // Validate passwords match
      if (password !== confirmPassword) {
        setPasswordError('Passwords do not match.');
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Submit registration form
        const response = await authAPI.register({
          email,
          password,
          full_name: fullName,
          government_id: governmentId,
          phone_number: phoneNumber,
          confirm_password: confirmPassword,
        });
        
        // Extract registration ID and redirect to OTP verification page with correct property names
        const { registration_id, phone_number } = response.data;
        
        // Use the exact property names expected by OTPVerificationForm
        navigate('/verify', {
          state: {
            registration_id: registration_id,
            phone_number: phone_number
          }
        });
      } catch (err) {
        // Process registration errors
        if (err.response?.data) {
          // Format backend validation errors
          const errorData = err.response.data;
          if (typeof errorData === 'object' && !errorData.error) {
            const formattedError = Object.keys(errorData)
              .map(key => `${key.charAt(0).toUpperCase() + key.slice(1)}: ${errorData[key].join(' ')}`)
              .join('\n');
            setError(formattedError);
          } else {
            // Direct error message from the backend
            setError(errorData.error || 'Registration failed! Please try again.');
          }
        } else {
          setError('Registration failed! Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    // Get the password strength label and color
    const getPasswordStrengthInfo = () => {
      switch (passwordStrength) {
        case 0:
          return { label: 'Very weak', color: 'bg-red-500', width: '20%' };
        case 1:
          return { label: 'Weak', color: 'bg-red-400', width: '20%' };
        case 2:
          return { label: 'Fair', color: 'bg-yellow-500', width: '40%' };
        case 3:
          return { label: 'Good', color: 'bg-yellow-400', width: '60%' };
        case 4:
          return { label: 'Strong', color: 'bg-green-400', width: '80%' };
        case 5:
          return { label: 'Very strong', color: 'bg-green-500', width: '100%' };
        default:
          return { label: 'Very weak', color: 'bg-red-500', width: '20%' };
      }
    };

    const passwordStrengthInfo = getPasswordStrengthInfo();

    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-50">
        <motion.div 
          className="w-full max-w-xl"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 px-8 pt-8 pb-10 relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-blue-500 via-primary-500 to-purple-500"></div>
            
            {/* Decorative elements */}
            <div className="absolute opacity-5 top-20 right-0 w-40 h-40 bg-blue-500 rounded-full -mr-20"></div>
            <div className="absolute opacity-5 bottom-20 left-0 w-60 h-60 bg-primary-500 rounded-full -ml-32"></div>

            {/* Logo & Header */}
            <div className="text-center mb-8 relative">
              <div className="mx-auto h-20 w-20 bg-gradient-to-br from-blue-600 to-primary-400 rounded-full flex items-center justify-center shadow-lg mb-4 transform hover:scale-105 transition-all duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-primary-600 mb-1">Create an Account</h2>
              <p className="text-gray-500">Fill in your details to get started with secure voting</p>
            </div>

            {/* Error Alerts */}
            <AnimatePresence>
              {(error || passwordError) && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="mb-6"
                >
                  {error && <Alert type="error" message={error} className="mb-3" />}
                  {passwordError && <Alert type="error" message={passwordError} />}
                </motion.div>
              )}
            </AnimatePresence>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Two-column layout for top fields */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <motion.div custom={1} variants={formItemVariants} initial="hidden" animate="visible">
                  <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name<span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 group-hover:text-primary-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input
                      className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition duration-200 group-hover:border-primary-300"
                      id="full_name"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      placeholder="Your Full Name"
                      autoComplete="name"
                    />
                  </div>
                </motion.div>
                
                <motion.div custom={2} variants={formItemVariants} initial="hidden" animate="visible">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address<span className="text-red-500">*</span>
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
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="you@example.com"
                      autoComplete="email"
                    />
                  </div>
                </motion.div>
              </div>
              
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <motion.div custom={3} variants={formItemVariants} initial="hidden" animate="visible">
                  <label htmlFor="government_id" className="block text-sm font-medium text-gray-700 mb-1">
                    Government ID<span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 group-hover:text-primary-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                      </svg>
                    </div>
                    <input
                      className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition duration-200 group-hover:border-primary-300"
                      id="government_id"
                      type="text"
                      value={governmentId}
                      onChange={(e) => setGovernmentId(e.target.value)}
                      required
                      placeholder="DLXXXXXX"
                      autoComplete="off"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Enter your government issued ID number</p>
                </motion.div>
                
                <motion.div custom={4} variants={formItemVariants} initial="hidden" animate="visible">
                  <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number<span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 group-hover:text-primary-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <input
                      className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition duration-200 group-hover:border-primary-300"
                      id="phone_number"
                      type="text"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required
                      placeholder="+XX XXX XXX XXXX"
                      autoComplete="tel"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Used for OTP verification</p>
                </motion.div>
              </div>
              
              <motion.div custom={5} variants={formItemVariants} initial="hidden" animate="visible">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password<span className="text-red-500">*</span>
                </label>
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
                    onChange={handlePasswordChange}
                    required
                    placeholder="Create a password"
                    autoComplete="new-password"
                  />
                </div>
                
                {/* Password strength indicator */}
                {password && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">Password strength:</span>
                      <span className={`text-xs font-medium ${
                        passwordStrength >= 4 ? 'text-green-600' : 
                        passwordStrength >= 3 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {passwordStrengthInfo.label}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <motion.div 
                        className={`h-1.5 rounded-full ${passwordStrengthInfo.color}`} 
                        initial={{ width: "0%" }}
                        animate={{ width: passwordStrengthInfo.width }}
                        transition={{ duration: 0.5 }}
                      ></motion.div>
                    </div>
                    <div className="mt-1.5 text-xs text-gray-500 space-y-1">
                      <p className="flex items-center">
                        <span className={`inline-block w-3 h-3 rounded-full mr-1.5 ${password.length >= 8 ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                        At least 8 characters
                      </p>
                      <p className="flex items-center">
                        <span className={`inline-block w-3 h-3 rounded-full mr-1.5 ${/[A-Z]/.test(password) ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                        At least 1 uppercase letter
                      </p>
                      <p className="flex items-center">
                        <span className={`inline-block w-3 h-3 rounded-full mr-1.5 ${/[0-9]/.test(password) ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                        At least 1 number
                      </p>
                      <p className="flex items-center">
                        <span className={`inline-block w-3 h-3 rounded-full mr-1.5 ${/[^A-Za-z0-9]/.test(password) ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                        At least 1 special character
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
              
              <motion.div custom={6} variants={formItemVariants} initial="hidden" animate="visible">
                <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password<span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 group-hover:text-primary-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    className={`appearance-none block w-full pl-10 pr-3 py-3 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition duration-200 group-hover:border-primary-300 ${
                      passwordError ? 'border-red-300 bg-red-50' : 'border-gray-200'
                    }`}
                    id="confirm_password"
                    type="password"
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    required
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                  />
                </div>
                {confirmPassword && password === confirmPassword && (
                  <div className="mt-1 flex items-center text-xs text-green-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Passwords match
                  </div>
                )}
              </motion.div>
              
              <motion.div custom={7} variants={formItemVariants} initial="hidden" animate="visible" className="pt-4">
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  isLoading={isLoading}
                  variant="primary"
                  size="lg"
                  fullWidth
                  className="relative overflow-hidden group"
                >
                  <span className="relative z-10">Create Account</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-primary-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Button>
              </motion.div>
            </form>

            <motion.div 
              custom={8} 
              variants={formItemVariants} 
              initial="hidden" 
              animate="visible" 
              className="mt-8 text-center"
            >
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500 transition-colors duration-200 hover:underline">
                  Sign in
                </Link>
              </p>
            </motion.div>
            
            {/* Privacy Note */}
            <motion.div 
              custom={9} 
              variants={formItemVariants} 
              initial="hidden" 
              animate="visible" 
              className="mt-8 pt-6 border-t border-gray-100"
            >
              <div className="text-xs text-gray-500 text-center">
                <p className="mb-2">By creating an account, you agree to our</p>
                <div className="flex justify-center space-x-3">
                  <a href="#" className="text-primary-600 hover:underline">Terms of Service</a>
                  <span>•</span>
                  <a href="#" className="text-primary-600 hover:underline">Privacy Policy</a>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    );
};

export default RegisterForm;