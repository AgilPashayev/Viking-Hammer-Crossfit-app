// frontend/src/components/ForgotPassword.tsx
// Request password reset link

import React, { useState } from 'react';
import './ForgotPassword.css';

const API_URL = 'http://localhost:4001/api';

interface ForgotPasswordProps {
  onBack: () => void;
}

export default function ForgotPassword({ onBack }: ForgotPasswordProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to send reset link. Please try again.');
        setLoading(false);
        return;
      }

      // Success - show confirmation message
      setSuccess(true);
      setLoading(false);
    } catch (err) {
      console.error('Forgot password error:', err);
      setError('Failed to send reset link. Please check your connection and try again.');
      setLoading(false);
    }
  };

  // Success state
  if (success) {
    return (
      <div className="forgot-password-page">
        <div className="forgot-password-container">
          <div className="forgot-password-header">
            <h1>🔨 Viking Hammer CrossFit</h1>
            <h2>Check Your Email</h2>
          </div>

          <div className="forgot-password-body">
            <div className="success-message">
              <span className="success-icon">✅</span>
              <div>
                <h3>Reset Link Sent!</h3>
                <p>
                  If an account exists with <strong>{email}</strong>, you'll receive a password
                  reset link shortly.
                </p>
                <p className="email-hint">
                  Please check your inbox (and spam folder) for an email from Viking Hammer
                  CrossFit.
                </p>
              </div>
            </div>

            <div className="security-note">
              <span>🔒</span>
              <p>
                For security reasons, the reset link will expire in <strong>1 hour</strong>.
              </p>
            </div>

            <div className="forgot-password-actions">
              <button className="btn-primary" onClick={onBack}>
                ← Back to Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Request form
  return (
    <div className="forgot-password-page">
      <div className="forgot-password-container">
        <div className="forgot-password-header">
          <h1>🔨 Viking Hammer CrossFit</h1>
          <h2>Reset Your Password</h2>
          <p className="forgot-password-subtitle">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <div className="forgot-password-body">
          <form onSubmit={handleSubmit} className="forgot-password-form">
            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                <p>{error}</p>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                required
                autoFocus
                disabled={loading}
              />
            </div>

            <div className="forgot-password-actions">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner-small"></span> Sending...
                  </>
                ) : (
                  '📧 Send Reset Link'
                )}
              </button>

              <button type="button" className="btn-secondary" onClick={onBack} disabled={loading}>
                ← Back to Sign In
              </button>
            </div>
          </form>

          <div className="forgot-password-info">
            <p>
              <strong>💡 Tip:</strong> If you don't receive an email within a few minutes, please
              check your spam folder.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
