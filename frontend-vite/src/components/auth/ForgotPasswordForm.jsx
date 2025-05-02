import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../../services/api';
import TextInput from '../common/forms/TextInput';
import Button from '../common/buttons/Button';
import Alert from '../common/feedback/Alert';
import LoadingSpinner from '../common/feedback/LoadingSpinner';

const ForgotPasswordForm = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();
  
  const handleChange = (e) => {
    setEmail(e.target.value);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Send password reset request - fixed to use the correct method name
      await authAPI.resetPasswordRequest(email);
      
      setSuccess(
        'A password reset link has been sent to your email address. ' +
        'Please check your inbox and follow the instructions to reset your password.'
      );
      
      // Optionally redirect to reset password page after a delay
      setTimeout(() => {
        navigate('/reset-password', { state: { email } });
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send reset link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Reset Your Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>
        
        {error && <Alert type="error" message={error} />}
        {success && <Alert type="success" message={success} />}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm">
            <TextInput
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={handleChange}
              placeholder="Email address"
              required
              autoFocus
              fullWidth
              className="mx-auto"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                Back to login
              </Link>
            </div>
            
            <div className="text-sm">
              <Link to="/register" className="font-medium text-gray-600 hover:text-gray-500">
                Need an account?
              </Link>
            </div>
          </div>
          
          <div>
            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={!email || isLoading}
            >
              {isLoading ? <LoadingSpinner size="small" color="white" /> : 'Send Reset Link'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordForm;