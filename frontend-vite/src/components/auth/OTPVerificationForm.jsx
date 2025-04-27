import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import TextInput from '../common/forms/TextInput';
import Button from '../common/buttons/Button';
import Alert from '../common/feedback/Alert';
import LoadingSpinner from '../common/feedback/LoadingSpinner';

const OTPVerificationForm = () => {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [timer, setTimer] = useState(60); // 60 seconds countdown for resend
  const [canResend, setCanResend] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Extract registration data from location state
  const phone_number = location.state?.phone_number || '';
  const registration_id = location.state?.registration_id || '';
  
  // Log what we received for debugging
  useEffect(() => {
    console.log("Registration data received:", { 
      phone_number, 
      registration_id 
    });
  }, [phone_number, registration_id]);
  
  // Countdown timer for OTP resend
  useEffect(() => {
    if (timer > 0 && !canResend) {
      const interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
      
      return () => clearInterval(interval);
    } else if (timer === 0 && !canResend) {
      setCanResend(true);
    }
  }, [timer, canResend]);
  
  const handleChange = (e) => {
    // Only allow numbers
    const value = e.target.value.replace(/[^0-9]/g, '');
    
    if (value.length <= 6) {
      setOtp(value);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP code');
      return;
    }
    
    if (!phone_number) {
      setError('Missing phone number! Please return to registration');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Send verification request with proper data expected by backend
      const response = await authAPI.completeRegistration({
        registration_id,
        phone_number,
        otp
      });
      
      setSuccess('Your account has been verified successfully!');
      
      // Redirect to login page after a brief delay
      setTimeout(() => {
        navigate('/login', { state: { verificationSuccess: true } });
      }, 2000);
    } catch (err) {
      console.error('OTP Verification Error:', err);
      setError(err.response?.data?.error || 'Invalid OTP code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleResendOtp = async () => {
    if (!canResend) return;
    
    if (!registration_id) {
      setError('Missing registration information! Please return to registration');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Request OTP resend with proper data
      await authAPI.resendRegistrationOTP(registration_id);
      
      // Reset timer
      setTimer(60);
      setCanResend(false);
      setSuccess('A new verification code has been sent');
    } catch (err) {
      console.error('Resend OTP Error:', err);
      setError(err.response?.data?.error || 'Failed to resend verification code');
    } finally {
      setIsLoading(false);
    }
  };
  
  // If essential data is missing, display an error
  if (!phone_number || !registration_id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Alert 
            type="error" 
            message="Missing registration information! Please return to registration" 
          />
          <div className="flex justify-center">
            <Button
              onClick={() => navigate('/register')}
              variant="primary"
            >
              Return to Registration
            </Button>
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
            Verify Your Account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            We've sent a verification code to {phone_number}
          </p>
        </div>
        
        {error && <Alert type="error" message={error} />}
        {success && <Alert type="success" message={success} />}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <TextInput
              id="otp"
              name="otp"
              type="text"
              value={otp}
              onChange={handleChange}
              placeholder="Enter 6-digit code"
              required
              autoFocus
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              className="text-center text-2xl letter-spacing-wide"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-sm">
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="font-medium text-primary-600 hover:text-primary-500"
                  disabled={isLoading}
                >
                  Resend Code
                </button>
              ) : (
                <span className="text-gray-500">
                  Resend code in {timer}s
                </span>
              )}
            </div>
            
            <div className="text-sm">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="font-medium text-gray-600 hover:text-gray-500"
              >
                Back to Login
              </button>
            </div>
          </div>
          
          <div>
            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={otp.length !== 6 || isLoading}
            >
              {isLoading ? <LoadingSpinner size="small" color="white" /> : 'Verify'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OTPVerificationForm;