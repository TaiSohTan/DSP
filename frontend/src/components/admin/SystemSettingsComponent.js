import React, { useState, useEffect } from 'react';
import Card from '../common/layout/Card';
import TextInput from '../common/forms/TextInput';
import Select from '../common/forms/Select';
import TextArea from '../common/forms/TextArea';
import Button from '../common/buttons/Button';
import Alert from '../common/feedback/Alert';
import LoadingSpinner from '../common/feedback/LoadingSpinner';
import { adminAPI } from '../../services/api';

const SystemSettingsComponent = () => {
  const [settings, setSettings] = useState({
    site_name: 'Secure Voting System',
    site_description: '',
    blockchain_provider_url: '',
    gas_limit: 3000000,
    otp_expiry_seconds: 600,
    max_failed_login_attempts: 5,
    lockout_duration_minutes: 30,
    vote_confirmation_method: 'EMAIL',
    maintenance_mode: false,
    allow_new_registrations: true,
    require_government_id_verification: true,
    enable_blockchain_verification: true,
    email_from_address: '',
    email_sender_name: '',
    sms_provider: 'TWILIO',
    sms_sender_id: '',
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const confirmationMethods = [
    { value: 'EMAIL', label: 'Email OTP' },
    { value: 'SMS', label: 'SMS OTP' },
    { value: 'BOTH', label: 'Both Email & SMS' },
  ];
  
  const smsProviders = [
    { value: 'TWILIO', label: 'Twilio' },
    { value: 'AWS_SNS', label: 'AWS SNS' },
    { value: 'CUSTOM', label: 'Custom Provider' },
  ];
  
  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const response = await adminAPI.getSystemSettings();
        setSettings(response.data);
      } catch (err) {
        setError('Failed to load system settings. Please try again.');
        console.error('Error fetching settings:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSettings();
  }, []);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: parseInt(value, 10)
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      await adminAPI.updateSystemSettings(settings);
      setSuccess('System settings updated successfully.');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update settings. Please try again.');
      console.error('Error updating settings:', err);
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">System Settings</h1>
      
      {error && <Alert type="error" message={error} className="mb-6" />}
      {success && <Alert type="success" message={success} className="mb-6" />}
      
      <form onSubmit={handleSubmit}>
        <Card title="Website Configuration" className="mb-8">
          <div className="p-4 grid gap-4">
            <TextInput
              label="Site Name"
              name="site_name"
              value={settings.site_name}
              onChange={handleChange}
              required
            />
            
            <TextArea
              label="Site Description"
              name="site_description"
              value={settings.site_description}
              onChange={handleChange}
              rows={3}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="maintenance_mode"
                    checked={settings.maintenance_mode}
                    onChange={handleChange}
                    className="h-4 w-4 text-primary-600 rounded border-gray-300"
                  />
                  <span className="ml-2 text-gray-700">Maintenance Mode</span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  When enabled, only administrators can access the site.
                </p>
              </div>
              
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="allow_new_registrations"
                    checked={settings.allow_new_registrations}
                    onChange={handleChange}
                    className="h-4 w-4 text-primary-600 rounded border-gray-300"
                  />
                  <span className="ml-2 text-gray-700">Allow New Registrations</span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  When disabled, new user registration is not allowed.
                </p>
              </div>
            </div>
          </div>
        </Card>
        
        <Card title="Blockchain Configuration" className="mb-8">
          <div className="p-4 grid gap-4">
            <TextInput
              label="Blockchain Provider URL"
              name="blockchain_provider_url"
              value={settings.blockchain_provider_url}
              onChange={handleChange}
              placeholder="e.g., https://mainnet.infura.io/v3/your-api-key"
            />
            
            <TextInput
              label="Gas Limit"
              name="gas_limit"
              type="number"
              value={settings.gas_limit}
              onChange={handleNumberChange}
            />
            
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="enable_blockchain_verification"
                  checked={settings.enable_blockchain_verification}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-600 rounded border-gray-300"
                />
                <span className="ml-2 text-gray-700">Enable Blockchain Verification</span>
              </label>
              <p className="text-xs text-gray-500 mt-1">
                When enabled, votes are verified against the blockchain for integrity.
              </p>
            </div>
          </div>
        </Card>
        
        <Card title="Security Settings" className="mb-8">
          <div className="p-4 grid gap-4">
            <TextInput
              label="OTP Expiry (seconds)"
              name="otp_expiry_seconds"
              type="number"
              value={settings.otp_expiry_seconds}
              onChange={handleNumberChange}
            />
            
            <TextInput
              label="Max Failed Login Attempts"
              name="max_failed_login_attempts"
              type="number"
              value={settings.max_failed_login_attempts}
              onChange={handleNumberChange}
            />
            
            <TextInput
              label="Account Lockout Duration (minutes)"
              name="lockout_duration_minutes"
              type="number"
              value={settings.lockout_duration_minutes}
              onChange={handleNumberChange}
            />
            
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="require_government_id_verification"
                  checked={settings.require_government_id_verification}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-600 rounded border-gray-300"
                />
                <span className="ml-2 text-gray-700">Require Government ID Verification</span>
              </label>
              <p className="text-xs text-gray-500 mt-1">
                When enabled, users must verify their identity with a government ID.
              </p>
            </div>
            
            <Select
              label="Vote Confirmation Method"
              name="vote_confirmation_method"
              value={settings.vote_confirmation_method}
              onChange={handleChange}
              options={confirmationMethods}
            />
          </div>
        </Card>
        
        <Card title="Notification Settings" className="mb-8">
          <div className="p-4 grid gap-4">
            <TextInput
              label="Email From Address"
              name="email_from_address"
              type="email"
              value={settings.email_from_address}
              onChange={handleChange}
              placeholder="noreply@yourdomain.com"
            />
            
            <TextInput
              label="Email Sender Name"
              name="email_sender_name"
              value={settings.email_sender_name}
              onChange={handleChange}
              placeholder="Your Voting System"
            />
            
            <Select
              label="SMS Provider"
              name="sms_provider"
              value={settings.sms_provider}
              onChange={handleChange}
              options={smsProviders}
            />
            
            <TextInput
              label="SMS Sender ID"
              name="sms_sender_id"
              value={settings.sms_sender_id}
              onChange={handleChange}
              placeholder="Your sender ID"
            />
          </div>
        </Card>
        
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.location.reload()}
          >
            Cancel
          </Button>
          
          <Button
            type="submit"
            variant="primary"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <LoadingSpinner size="small" color="white" className="mr-2" />
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SystemSettingsComponent;