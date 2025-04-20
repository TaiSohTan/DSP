import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import TextInput from '../common/forms/TextInput';
import Button from '../common/buttons/Button';
import Card from '../common/layout/Card';
import Alert from '../common/feedback/Alert';
import LoadingSpinner from '../common/feedback/LoadingSpinner';
import { authAPI } from '../../services/api';

const OTPVerificationForm = () => {
  const [otp, setOtp] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [registrationId, setRegistrationId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [resendDisabled, setResendDisabled] = useState(true);
  const [resendCountdown, setResendCountdown] = useState(30); // 30 second cooldown for resend
  const navigate = useNavigate();
  const location = useLocation();

  // Extract registration data from location state or query params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const regId = params.get('registrationId') || location.state?.registrationId;
    const phone = params.get('phoneNumber') || location.state?.phoneNumber;

    if (regId && phone) {
      setRegistrationId(regId);
      setPhoneNumber(phone);
    } else {
      setError("Missing registration information. Please go back and register again.");
    }
  }, [location]);

  // Countdown timer for OTP expiration
  useEffect(() => {
    if (!timeLeft) return;

    const intervalId = setInterval(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [timeLeft]);

  // Countdown timer for resend button
  useEffect(() => {
    if (resendDisabled && resendCountdown > 0) {
      const intervalId = setInterval(() => {
        setResendCountdown(resendCountdown - 1);
      }, 1000);

      return () => clearInterval(intervalId);
    } else if (resendCountdown === 0) {
      setResendDisabled(false);
    }
  }, [resendDisabled, resendCountdown]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Complete the registration with the OTP
      await authAPI.completeRegistration(registrationId, phoneNumber, otp);

      setSuccess("Registration completed successfully!");
      
      // Navigate to login page after short delay
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: "Registration completed successfully! You can now log in." 
          }
        });
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to verify OTP. Please try again or request a new code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsResending(true);
    setError(null);
    setSuccess(null);

    try {
      // Call the resend OTP endpoint
      const response = await authAPI.resendOTP(registrationId);
      
      // Reset the OTP field
      setOtp('');
      
      // Reset the timer
      setTimeLeft(600); // 10 minutes
      
      // Disable resend button with countdown
      setResendDisabled(true);
      setResendCountdown(30); // 30 seconds cooldown
      
      setSuccess("A new verification code has been sent to your phone.");
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend verification code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  if (!registrationId || !phoneNumber) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <Card title="Verification Error" className="w-full max-w-md">
          <Alert type="error" message="Missing registration information. Please go back and register again." />
          <Button onClick={() => navigate('/register')} className="mt-4" fullWidth>
            Back to Registration
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <Card title="Verify Your Phone Number" className="w-full max-w-md">
        <p className="mb-4 text-center text-gray-600">
          We've sent a verification code to <span className="font-semibold">{phoneNumber}</span>
        </p>
        
        {error && <Alert type="error" message={error} className="mb-4" />}
        {success && <Alert type="success" message={success} className="mb-4" />}
        
        <form onSubmit={handleSubmit}>
          <TextInput
            label="Verification Code"
            id="otp"
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
            placeholder="Enter 6-digit code"
            autoComplete="one-time-code"
          />
          
          <div className="mt-2 text-center text-sm text-gray-500">
            Code expires in: {formatTime(timeLeft)}
          </div>
          
          <Button 
            type="submit" 
            fullWidth 
            disabled={isLoading || !otp}
            className="mt-4"
          >
            {isLoading ? <LoadingSpinner size="small" color="white" /> : 'Verify & Complete Registration'}
          </Button>
          
          <div className="mt-4 text-center">
            <button 
              type="button" 
              className={`text-sm ${resendDisabled ? 'text-gray-400 cursor-not-allowed' : 'text-primary-600 hover:text-primary-800'}`}
              onClick={handleResendOTP}
              disabled={isResending || resendDisabled}
            >
              {resendDisabled 
                ? `Resend code in ${resendCountdown}s` 
                : isResending 
                  ? 'Sending...' 
                  : "Didn't receive the code? Resend"}
            </button>
          </div>
          
          <div className="mt-6 text-center">
            <button 
              type="button" 
              className="text-gray-500 hover:text-gray-700 text-sm"
              onClick={() => navigate('/register')}
            >
              Start over with a new registration
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default OTPVerificationForm;