import React, { useState } from 'react';
import api from '../../services/api';

const SecurityComponent = () => {
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  
  const [otpEnabled, setOtpEnabled] = useState(false);
  const [otpSetupVisible, setOtpSetupVisible] = useState(false);
  const [otpQrCode, setOtpQrCode] = useState('');
  const [otpSecret, setOtpSecret] = useState('');
  const [otpVerificationCode, setOtpVerificationCode] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handlePasswordChange = (e) => {
    setPasswordForm({
      ...passwordForm,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setError('New passwords do not match.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await api.changePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password
      });
      
      setSuccess('Password changed successfully!');
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to change password. Please try again.');
      console.error('Error changing password:', err);
    } finally {
      setLoading(false);
    }
  };

  const setupOtp = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.setupOtp();
      setOtpQrCode(response.data.qr_code);
      setOtpSecret(response.data.secret);
      setOtpSetupVisible(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to setup 2FA. Please try again.');
      console.error('Error setting up 2FA:', err);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setLoading(true);
    setError(null);

    try {
      await api.verifyOtp(otpVerificationCode);
      setOtpEnabled(true);
      setSuccess('Two-factor authentication enabled successfully!');
      setOtpSetupVisible(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to verify code. Please try again.');
      console.error('Error verifying OTP:', err);
    } finally {
      setLoading(false);
    }
  };

  const disableOtp = async () => {
    setLoading(true);
    setError(null);

    try {
      await api.disableOtp();
      setOtpEnabled(false);
      setSuccess('Two-factor authentication disabled successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to disable 2FA. Please try again.');
      console.error('Error disabling OTP:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Password Change Section */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Change Password</h2>
          <p className="mt-1 text-gray-600">Ensure your account is using a secure password.</p>
        </div>

        {error && (
          <div className="m-6">
            <div className="bg-red-50 border-l-4 border-red-500 p-4">
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="m-6">
            <div className="bg-green-50 border-l-4 border-green-500 p-4">
              <p className="text-green-700">{success}</p>
            </div>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="p-6 space-y-6">
          <div>
            <label htmlFor="current_password" className="block text-sm font-medium text-gray-700 mb-1">
              Current Password
            </label>
            <input
              type="password"
              name="current_password"
              id="current_password"
              value={passwordForm.current_password}
              onChange={handlePasswordChange}
              required
              className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              name="new_password"
              id="new_password"
              value={passwordForm.new_password}
              onChange={handlePasswordChange}
              required
              className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              name="confirm_password"
              id="confirm_password"
              value={passwordForm.confirm_password}
              onChange={handlePasswordChange}
              required
              className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Two-Factor Authentication Section */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Two-Factor Authentication</h2>
          <p className="mt-1 text-gray-600">Add additional security to your account by enabling 2FA.</p>
        </div>

        <div className="p-6">
          {otpEnabled ? (
            <div className="space-y-6">
              <div className="flex items-center space-x-2">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                  Enabled
                </span>
                <span className="text-sm text-gray-500">
                  Two-factor authentication is enabled for your account.
                </span>
              </div>

              <div>
                <button
                  type="button"
                  onClick={disableOtp}
                  disabled={loading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  {loading ? 'Disabling...' : 'Disable 2FA'}
                </button>
              </div>
            </div>
          ) : otpSetupVisible ? (
            <div className="space-y-6">
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-medium mb-2">Setup Instructions</h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-4">
                  <li>Install an authenticator app on your mobile device (Google Authenticator, Authy, Microsoft Authenticator, etc.)</li>
                  <li>Scan the QR code below or manually enter the provided secret key</li>
                  <li>Enter the 6-digit verification code from your authenticator app</li>
                </ol>

                <div className="flex flex-col items-center justify-center mb-4">
                  {otpQrCode && (
                    <div className="bg-white p-2 border rounded mb-2">
                      <img src={`data:image/png;base64,${otpQrCode}`} alt="QR Code for OTP" className="w-48 h-48" />
                    </div>
                  )}
                  {otpSecret && (
                    <div className="text-center">
                      <p className="text-sm text-gray-700 mb-1">Manual entry key:</p>
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">{otpSecret}</code>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <input
                    type="text"
                    value={otpVerificationCode}
                    onChange={(e) => setOtpVerificationCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="focus:ring-primary-500 focus:border-primary-500 block shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                  <button
                    type="button"
                    onClick={verifyOtp}
                    disabled={loading || otpVerificationCode.length !== 6}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    {loading ? 'Verifying...' : 'Verify & Enable'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center space-x-2">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                  Not Enabled
                </span>
                <span className="text-sm text-gray-500">
                  Two-factor authentication is not enabled for your account.
                </span>
              </div>

              <p className="text-sm text-gray-700">
                Two-factor authentication adds an extra layer of security to your account by requiring 
                a verification code in addition to your password when signing in.
              </p>

              <div>
                <button
                  type="button"
                  onClick={setupOtp}
                  disabled={loading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  {loading ? 'Setting up...' : 'Setup Two-Factor Authentication'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SecurityComponent;