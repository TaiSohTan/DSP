import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import Button from '../common/buttons/Button';
import TextInput from '../common/forms/TextInput';
import TextArea from '../common/forms/TextArea';
import Checkbox from '../common/forms/Checkbox';
import Alert from '../common/feedback/Alert';
import LoadingSpinner from '../common/feedback/LoadingSpinner';
import Modal from '../common/feedback/Modal';

const SystemSettings = () => {
  const [settings, setSettings] = useState({
    general: {
      siteName: '',
      siteDescription: '',
      contactEmail: '',
      maintenanceMode: false,
      maintenanceMessage: '',
    },
    election: {
      minCandidates: 2,
      maxCandidates: 20,
      requireVerification: true,
      allowElectionEditing: true,
      timeBeforeStartToLock: 24, // hours
    },
    security: {
      sessionTimeout: 60, // minutes
      maxLoginAttempts: 5,
      passwordExpiryDays: 90,
      otpExpiryMinutes: 15,
      enforceStrongPasswords: true,
    }
  });

  const [originalSettings, setOriginalSettings] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('general');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Fetch system settings
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await adminAPI.getSystemSettings();
      
      // If the response contains all needed data, use it directly
      if (response.data && response.data.general && response.data.election && response.data.security) {
        setSettings(response.data);
        setOriginalSettings(response.data);
      } else {
        // Otherwise, merge with defaults
        const mergedSettings = {
          ...settings,
          ...(response.data || {}),
        };
        setSettings(mergedSettings);
        setOriginalSettings(mergedSettings);
      }
    } catch (err) {
      console.error('Error fetching system settings:', err);
      setError('Failed to load system settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleCheckboxChange = (section, field, e) => {
    const { checked } = e.target;
    handleInputChange(section, field, checked);
  };

  const handleTextChange = (section, field, e) => {
    const { value } = e.target;
    handleInputChange(section, field, value);
  };

  const handleNumberChange = (section, field, e) => {
    const value = parseInt(e.target.value) || 0;
    handleInputChange(section, field, value);
  };

  const validateSettings = () => {
    const errors = [];
    
    // General settings validation
    if (!settings.general.siteName.trim()) {
      errors.push('Site name is required');
    }
    
    if (!settings.general.contactEmail.trim()) {
      errors.push('Contact email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.general.contactEmail)) {
      errors.push('Please enter a valid contact email');
    }
    
    // Election settings validation
    if (settings.election.minCandidates < 2) {
      errors.push('Minimum candidates must be at least 2');
    }
    
    if (settings.election.maxCandidates < settings.election.minCandidates) {
      errors.push('Maximum candidates must be greater than or equal to minimum candidates');
    }
    
    if (errors.length > 0) {
      setError(errors.join('. '));
      return false;
    }
    
    setError(null);
    return true;
  };

  const handleSave = async () => {
    if (!validateSettings()) return;
    
    setShowPasswordModal(true);
  };

  const confirmSave = async () => {
    if (!confirmPassword.trim()) {
      setPasswordError('Please enter your password to confirm changes');
      return;
    }
    
    setPasswordError('');
    setShowPasswordModal(false);
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      await adminAPI.updateSystemSettings(settings, confirmPassword);
      setOriginalSettings(settings);
      setSuccess('System settings updated successfully');
      setConfirmPassword('');
    } catch (err) {
      console.error('Error saving system settings:', err);
      setError(err.response?.data?.detail || 'Failed to update system settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefaults = () => {
    setShowResetModal(true);
  };

  const confirmReset = async () => {
    setShowResetModal(false);
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await adminAPI.resetSystemSettings();
      
      if (response.data && response.data.general && response.data.election && response.data.security) {
        setSettings(response.data);
        setOriginalSettings(response.data);
      } else {
        // Handle case where reset returns incomplete data
        console.warn('Reset returned incomplete settings data', response.data);
      }
      
      setSuccess('System settings have been reset to defaults');
    } catch (err) {
      console.error('Error resetting system settings:', err);
      setError('Failed to reset settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const hasChanges = () => {
    return JSON.stringify(settings) !== JSON.stringify(originalSettings);
  };

  // Check if we have any settings data at all
  const hasSettingsData = Object.keys(settings).length > 0 && 
                         settings.general && 
                         settings.election && 
                         settings.security;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!hasSettingsData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert 
          type="error" 
          message="Could not load system settings. The server may be unavailable." 
        />
        <div className="mt-4 text-center">
          <Button 
            variant="primary" 
            onClick={fetchSettings}
            disabled={isLoading}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">System Settings</h1>
        
        <div className="flex space-x-4">
          {hasChanges() && (
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? <LoadingSpinner size="small" color="white" /> : 'Save Changes'}
            </Button>
          )}
          
          <Button
            variant="outline"
            onClick={handleResetToDefaults}
            disabled={isLoading || isSaving}
          >
            Reset to Defaults
          </Button>
        </div>
      </div>
      
      {error && <Alert type="error" message={error} className="mb-6" />}
      {success && <Alert type="success" message={success} className="mb-6" />}
      
      {/* Settings tabs */}
      <div className="bg-white rounded-lg shadow-md mb-8">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px overflow-x-auto">
            <button
              className={`px-6 py-3 font-medium text-sm whitespace-nowrap border-b-2 ${
                activeTab === 'general'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('general')}
            >
              General
            </button>
            <button
              className={`px-6 py-3 font-medium text-sm whitespace-nowrap border-b-2 ${
                activeTab === 'election'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('election')}
            >
              Election Settings
            </button>
            <button
              className={`px-6 py-3 font-medium text-sm whitespace-nowrap border-b-2 ${
                activeTab === 'security'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('security')}
            >
              Security
            </button>
          </nav>
        </div>
        
        <div className="p-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h2 className="text-lg font-medium">General Configuration</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextInput
                  label="Site Name"
                  id="siteName"
                  name="siteName"
                  value={settings.general.siteName}
                  onChange={(e) => handleTextChange('general', 'siteName', e)}
                  required
                />
                
                <TextInput
                  label="Contact Email"
                  id="contactEmail"
                  name="contactEmail"
                  type="email"
                  value={settings.general.contactEmail}
                  onChange={(e) => handleTextChange('general', 'contactEmail', e)}
                  required
                />
              </div>
              
              <TextArea
                label="Site Description"
                id="siteDescription"
                name="siteDescription"
                value={settings.general.siteDescription}
                onChange={(e) => handleTextChange('general', 'siteDescription', e)}
                rows={3}
              />
              
              <Checkbox
                id="maintenanceMode"
                name="maintenanceMode"
                checked={settings.general.maintenanceMode}
                onChange={(e) => handleCheckboxChange('general', 'maintenanceMode', e)}
                label="Enable Maintenance Mode"
                description="When enabled, only administrators can access the system"
              />
              
              {settings.general.maintenanceMode && (
                <TextArea
                  label="Maintenance Message"
                  id="maintenanceMessage"
                  name="maintenanceMessage"
                  value={settings.general.maintenanceMessage}
                  onChange={(e) => handleTextChange('general', 'maintenanceMessage', e)}
                  placeholder="This system is currently under maintenance. Please check back later."
                  rows={2}
                />
              )}
            </div>
          )}
          
          {/* Election Settings */}
          {activeTab === 'election' && (
            <div className="space-y-6">
              <h2 className="text-lg font-medium">Election Configuration</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextInput
                  label="Minimum Candidates"
                  id="minCandidates"
                  name="minCandidates"
                  type="number"
                  value={settings.election.minCandidates}
                  onChange={(e) => handleNumberChange('election', 'minCandidates', e)}
                  min={2}
                  required
                  helperText="Minimum number of candidates required for an election"
                />
                
                <TextInput
                  label="Maximum Candidates"
                  id="maxCandidates"
                  name="maxCandidates"
                  type="number"
                  value={settings.election.maxCandidates}
                  onChange={(e) => handleNumberChange('election', 'maxCandidates', e)}
                  min={settings.election.minCandidates}
                  required
                />
              </div>
              
              <TextInput
                label="Hours Before Election Start to Lock Editing"
                id="timeBeforeStartToLock"
                name="timeBeforeStartToLock"
                type="number"
                value={settings.election.timeBeforeStartToLock}
                onChange={(e) => handleNumberChange('election', 'timeBeforeStartToLock', e)}
                min={0}
                required
                helperText="Election details can't be edited this many hours before it starts (0 means no lock)"
              />
              
              <Checkbox
                id="requireVerification"
                name="requireVerification"
                checked={settings.election.requireVerification}
                onChange={(e) => handleCheckboxChange('election', 'requireVerification', e)}
                label="Require Voter Verification"
                description="Users must be verified to participate in elections"
              />
              
              <Checkbox
                id="allowElectionEditing"
                name="allowElectionEditing"
                checked={settings.election.allowElectionEditing}
                onChange={(e) => handleCheckboxChange('election', 'allowElectionEditing', e)}
                label="Allow Editing Elections"
                description="Administrators can edit election details after creation (subject to lock time)"
              />
            </div>
          )}
          
          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h2 className="text-lg font-medium">Security Configuration</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextInput
                  label="Session Timeout (minutes)"
                  id="sessionTimeout"
                  name="sessionTimeout"
                  type="number"
                  value={settings.security.sessionTimeout}
                  onChange={(e) => handleNumberChange('security', 'sessionTimeout', e)}
                  min={5}
                  max={1440}
                  required
                  helperText="User will be logged out after this period of inactivity"
                />
                
                <TextInput
                  label="Maximum Login Attempts"
                  id="maxLoginAttempts"
                  name="maxLoginAttempts"
                  type="number"
                  value={settings.security.maxLoginAttempts}
                  onChange={(e) => handleNumberChange('security', 'maxLoginAttempts', e)}
                  min={3}
                  required
                  helperText="Account will be locked after this many failed attempts"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextInput
                  label="Password Expiry (days)"
                  id="passwordExpiryDays"
                  name="passwordExpiryDays"
                  type="number"
                  value={settings.security.passwordExpiryDays}
                  onChange={(e) => handleNumberChange('security', 'passwordExpiryDays', e)}
                  min={0}
                  required
                  helperText="Days before users are required to change password (0 means never)"
                />
                
                <TextInput
                  label="OTP Expiry (minutes)"
                  id="otpExpiryMinutes"
                  name="otpExpiryMinutes"
                  type="number"
                  value={settings.security.otpExpiryMinutes}
                  onChange={(e) => handleNumberChange('security', 'otpExpiryMinutes', e)}
                  min={1}
                  max={60}
                  required
                  helperText="One-time verification codes expire after this many minutes"
                />
              </div>
              
              <Checkbox
                id="enforceStrongPasswords"
                name="enforceStrongPasswords"
                checked={settings.security.enforceStrongPasswords}
                onChange={(e) => handleCheckboxChange('security', 'enforceStrongPasswords', e)}
                label="Enforce Strong Passwords"
                description="Require passwords to contain uppercase, lowercase, numbers, and special characters"
              />
            </div>
          )}
        </div>
      </div>
      
      {/* Password Confirmation Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Confirm Changes"
        showCloseButton={true}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setShowPasswordModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={confirmSave}
            >
              Confirm
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p>Please enter your password to confirm changes to system settings:</p>
          
          <TextInput
            id="confirm-password"
            name="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Enter your password"
            error={passwordError}
            autoFocus
          />
        </div>
      </Modal>
      
      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        title="Reset to Defaults"
        showCloseButton={true}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setShowResetModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={confirmReset}
            >
              Reset All Settings
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-red-600 font-medium">Warning: This action cannot be undone!</p>
          <p>All system settings will be reset to their default values. This may impact the operation of your system.</p>
        </div>
      </Modal>
    </div>
  );
};

export default SystemSettings;