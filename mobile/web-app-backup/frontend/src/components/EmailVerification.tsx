import React, { useState, useEffect } from 'react';
import { verifyEmailWithToken } from '../services/emailVerificationService';
import './EmailVerification.css';

interface EmailVerificationProps {
  onNavigate?: (page: string) => void;
}

const EmailVerification: React.FC<EmailVerificationProps> = ({ onNavigate }) => {
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const verifyEmail = async () => {
      // Get token from URL query parameter
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');

      if (!token) {
        setVerificationStatus('error');
        setMessage('Invalid verification link. No token provided.');
        setIsVerifying(false);
        return;
      }

      try {
        const result = await verifyEmailWithToken(token);

        if (result.success) {
          setVerificationStatus('success');
          setMessage(result.message);
          
          // Redirect to login after 3 seconds
          setTimeout(() => {
            if (onNavigate) {
              onNavigate('auth');
            }
          }, 3000);
        } else {
          setVerificationStatus('error');
          setMessage(result.message);
        }
      } catch (error: any) {
        setVerificationStatus('error');
        setMessage('An unexpected error occurred. Please try again.');
        console.error('Verification error:', error);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyEmail();
  }, [onNavigate]);

  const handleGoToLogin = () => {
    if (onNavigate) {
      onNavigate('auth');
    }
  };

  return (
    <div className="email-verification">
      <div className="verification-card">
        {isVerifying && (
          <div className="verification-loading">
            <div className="spinner"></div>
            <h2>Verifying Your Email...</h2>
            <p>Please wait while we confirm your email address.</p>
          </div>
        )}

        {!isVerifying && verificationStatus === 'success' && (
          <div className="verification-success">
            <div className="success-icon">✅</div>
            <h2>Email Verified Successfully!</h2>
            <p>{message}</p>
            <p className="redirect-message">Redirecting you to login...</p>
            <button className="btn btn-primary" onClick={handleGoToLogin}>
              Go to Login
            </button>
          </div>
        )}

        {!isVerifying && verificationStatus === 'error' && (
          <div className="verification-error">
            <div className="error-icon">❌</div>
            <h2>Verification Failed</h2>
            <p>{message}</p>
            <div className="error-actions">
              <button className="btn btn-primary" onClick={handleGoToLogin}>
                Back to Login
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={() => window.location.reload()}
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailVerification;
