import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import TextInput from '../common/forms/TextInput';
import Button from '../common/buttons/Button';
import Card from '../common/layout/Card';
import Alert from '../common/feedback/Alert';
import LoadingSpinner from '../common/feedback/LoadingSpinner';
import { authAPI } from '../../services/api';

const ForgotPasswordForm = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await authAPI.requestPasswordReset(email);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to process your request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <Card title="Reset Your Password" className="w-full max-w-md">
        {!success ? (
          <form onSubmit={handleSubmit}>
            {error && <Alert type="error" message={error} className="mb-4" />}
            
            <p className="mb-4 text-gray-600">
              Enter your email address and we'll send you instructions to reset your password.
            </p>
            
            <TextInput
              label="Email"
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
            
            <Button 
              type="submit" 
              fullWidth 
              disabled={isLoading}
              className="mt-4"
            >
              {isLoading ? <LoadingSpinner size="small" color="white" /> : 'Send Reset Instructions'}
            </Button>
            
            <p className="mt-4 text-center text-sm text-gray-600">
              <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                Back to Login
              </Link>
            </p>
          </form>
        ) : (
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <h3 className="mt-2 text-lg font-semibold text-gray-900">Check your email</h3>
            <p className="mt-2 text-gray-600">
              We've sent password reset instructions to {email}
            </p>
            <div className="mt-6">
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                Return to login
              </Link>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ForgotPasswordForm;