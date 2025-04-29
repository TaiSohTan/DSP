import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import Button from '../common/buttons/Button';
import Alert from '../common/feedback/Alert';
import LoadingSpinner from '../common/feedback/LoadingSpinner';
import OTPInput from '../common/forms/OTPInput';

const OTPVerificationForm = () => {
  // Use an array of 6 digits for the OTP input
  const [otpDigits, setOtpDigits] = useState(Array(6).fill(''));
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
  
  // Get the complete OTP from all digits
  const getCompleteOtp = () => otpDigits.join('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const otp = getCompleteOtp();
    
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
      
      // Clear the OTP fields on error for better UX
      setOtpDigits(Array(6).fill(''));
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
      
      // Clear existing OTP entries
      setOtpDigits(Array(6).fill(''));
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
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Verify Your Account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            We've sent a verification code to <span className="font-medium">{phone_number}</span>
          </p>
        </div>
        
        {error && <Alert type="error" message={error} />}
        {success && <Alert type="success" message={success} />}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="flex flex-col items-center">
            <label htmlFor="otp-input-0" className="sr-only">
              Enter your verification code
            </label>
            
            <OTPInput 
              otpDigits={otpDigits} 
              setOtpDigits={setOtpDigits}
              disabled={isLoading}
            />
            
            <p className="mt-4 text-sm text-gray-500">
              Enter the 6-digit code sent to your device
            </p>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-sm">
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
                  disabled={isLoading}
                  aria-label="Resend verification code"
                >
                  Resend Code
                </button>
              ) : (
                <div className="text-gray-500">
                  Resend code in <span className="font-medium">{timer}s</span>
                </div>
              )}
            </div>
            
            <div className="text-sm">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="font-medium text-gray-600 hover:text-gray-500 transition-colors"
                aria-label="Back to login"
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
              disabled={getCompleteOtp().length !== 6 || isLoading}
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