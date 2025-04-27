import React, { useState } from 'react';
import TextInput from '../common/forms/TextInput';
import Button from '../common/buttons/Button';
import Card from '../common/layout/Card';
import Alert from '../common/feedback/Alert';
import LoadingSpinner from '../common/feedback/LoadingSpinner';
import api from '../../services/api';

const SecuritySettings = () => {
  const [passwords, setPasswords] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setPasswords({
      ...passwords,
      [name]: value
    });
  };
  
  const validatePasswords = () => {
    if (passwords.new_password !== passwords.confirm_password) {
      setError('New passwords do not match');
      return false;
    }
    
    if (passwords.new_password.length < 8) {
      setError('New password must be at least 8 characters long');
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePasswords()) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      await api.post('/users/change-password/', {
        current_password: passwords.current_password,
        new_password: passwords.new_password
      });
      
      setSuccess('Password changed successfully');
      setPasswords({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to change password. Please check your current password.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Security Settings</h1>
      
      <Card title="Change Password" className="max-w-md mx-auto">
        {error && <Alert type="error" message={error} className="mb-4" />}
        {success && <Alert type="success" message={success} className="mb-4" />}
        
        <form onSubmit={handleSubmit}>
          <TextInput
            label="Current Password"
            id="current_password"
            name="current_password"
            type="password"
            value={passwords.current_password}
            onChange={handleChange}
            required
          />
          
          <TextInput
            label="New Password"
            id="new_password"
            name="new_password"
            type="password"
            value={passwords.new_password}
            onChange={handleChange}
            required
            helperText="Password must be at least 8 characters long"
          />
          
          <TextInput
            label="Confirm New Password"
            id="confirm_password"
            name="confirm_password"
            type="password"
            value={passwords.confirm_password}
            onChange={handleChange}
            required
          />
          
          <Button
            type="submit"
            variant="primary"
            fullWidth
            className="mt-6"
            disabled={isLoading}
          >
            {isLoading ? <LoadingSpinner size="small" color="white" /> : 'Change Password'}
          </Button>
        </form>
      </Card>
      
      <Card title="Two-Factor Authentication" className="max-w-md mx-auto mt-8">
        <div className="text-center py-4">
          <h3 className="text-lg font-medium mb-2">Coming Soon</h3>
          <p className="text-gray-600">
            Enhanced security with two-factor authentication will be available soon.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default SecuritySettings;