import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import TextInput from '../common/forms/TextInput';
import Button from '../common/buttons/Button';
import Card from '../common/layout/Card';
import Alert from '../common/feedback/Alert';
import LoadingSpinner from '../common/feedback/LoadingSpinner';
import { authAPI } from '../../services/api';

const ResetPasswordForm = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get token from URL query parameter
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get('token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      await authAPI.resetPassword(token, password);
      // Redirect to login with success message
      navigate('/login?reset=success');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to reset password. The link may be invalid or expired.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <Card title="Invalid Reset Link" className="w-full max-w-md">
          <Alert type="error" message="Invalid password reset link. Please request a new password reset." />
          <Button 
            onClick={() => navigate('/forgot-password')}
            fullWidth
            className="mt-4"
          >
            Request New Reset Link
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <Card title="Reset Your Password" className="w-full max-w-md">
        <form onSubmit={handleSubmit}>
          {error && <Alert type="error" message={error} className="mb-4" />}
          
          <TextInput
            label="New Password"
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Enter new password"
          />
          
          <TextInput
            label="Confirm New Password"
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="Confirm new password"
          />
          
          <Button 
            type="submit" 
            fullWidth 
            disabled={isLoading}
            className="mt-4"
          >
            {isLoading ? <LoadingSpinner size="small" color="white" /> : 'Reset Password'}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default ResetPasswordForm;