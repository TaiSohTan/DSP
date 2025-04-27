import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { authAPI } from '../../services/api';
import TextInput from '../common/forms/TextInput';
import Button from '../common/buttons/Button';
import Alert from '../common/feedback/Alert';
import LoadingSpinner from '../common/feedback/LoadingSpinner';

const ResetPasswordForm = () => {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [tokenValid, setTokenValid] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useParams();
  
  // Get token from URL query params if not in URL path
  const searchParams = new URLSearchParams(location.search);
  const queryToken = searchParams.get('token');
  const resetToken = token || queryToken;
  
  // Verify token on component mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!resetToken) {
        setError('No reset token provided');
        setIsVerifying(false);
        return;
      }
      
      try {
        // Verify the token with the API
        await authAPI.verifyResetToken({ token: resetToken });
        setTokenValid(true);
      } catch (err) {
        setError('This password reset link is invalid or has expired. Please request a new one.');
      } finally {
        setIsVerifying(false);
      }
    };
    
    verifyToken();
  }, [resetToken]);
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  
  const validatePassword = () => {
    // Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    // Check password strength (at least 8 chars, with a number and special char)
    const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      setError('Password must be at least 8 characters and include a number and a special character');
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePassword()) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Send password reset request
      await authAPI.resetPassword({
        token: resetToken,
        new_password: formData.password
      });
      
      setSuccess('Your password has been reset successfully!');
      
      // Redirect to login page after a delay
      setTimeout(() => {
        navigate('/login', { state: { passwordResetSuccess: true } });
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Show loading state while verifying token
  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600">Verifying your request...</p>
        </div>
      </div>
    );
  }
  
  // Show error if token is invalid
  if (!tokenValid && error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Password Reset Failed
          </h2>
          <div className="mt-4">
            <Alert type="error" message={error} />
            <div className="mt-6 text-center">
              <button
                onClick={() => navigate('/forgot-password')}
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Request a new password reset link
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Reset Your Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your new password below
          </p>
        </div>
        
        {error && <Alert type="error" message={error} />}
        {success && <Alert type="success" message={success} />}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div className="mb-4">
              <TextInput
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                placeholder="New Password"
                required
                autoFocus
              />
              <p className="mt-1 text-xs text-gray-500">
                Password must be at least 8 characters and include a number and a special character.
              </p>
            </div>
            
            <div>
              <TextInput
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm New Password"
                required
              />
            </div>
          </div>
          
          <div>
            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={!formData.password || !formData.confirmPassword || isLoading}
            >
              {isLoading ? <LoadingSpinner size="small" color="white" /> : 'Reset Password'}
            </Button>
          </div>
          
          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Back to login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordForm;