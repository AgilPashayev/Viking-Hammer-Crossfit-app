// frontend/src/components/ResetPassword.tsx
// Reset password with token from email link

import React, { useState, useEffect } from 'react';
import './ResetPassword.css';

const API_URL = 'http://localhost:4001/api';

interface ResetPasswordProps {
  token: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ResetPassword({ token, onSuccess, onCancel }: ResetPasswordProps) {
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [tokenValid, setTokenValid] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Validate reset token on mount
  useEffect(() => {
    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      setValidating(true);
      setError('');

      const response = await fetch(`${API_URL}/auth/reset-password/${token}`);
      const result = await response.json();

      if (!response.ok || !result.valid) {
        setError(result.error || 'Invalid or expired reset link');
        setTokenValid(false);
        setValidating(false);
        setLoading(false);
        return;
      }

      // Token is valid
      setTokenValid(true);
      setUserEmail(result.data.email);
      setValidating(false);
      setLoading(false);
    } catch (err) {
      console.error('Token validation error:', err);
      setError('Failed to validate reset link. Please try again.');
      setTokenValid(false);
      setValidating(false);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          newPassword: password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to reset password. Please try again.');
        setSubmitting(false);
        return;
      }

      // Success
      console.log('✅ Password reset successful');
      onSuccess();
    } catch (err) {
      console.error('Reset password error:', err);
      setError('Failed to reset password. Please try again.');
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading || validating) {
    return (
      <div className="reset-password-page">
        <div className="reset-password-container">
          <div className="reset-password-header">
            <h1>🔨 Viking Hammer CrossFit</h1>
            <h2>Reset Your Password</h2>
          </div>
          <div className="reset-password-body">
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Validating reset link...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state (invalid/expired token)
  if (error && !tokenValid) {
    return (
      <div className="reset-password-page">
        <div className="reset-password-container">
          <div className="reset-password-header error">
            <h1>🔨 Viking Hammer CrossFit</h1>
            <h2>Invalid Reset Link</h2>
          </div>
          <div className="reset-password-body">
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              <div>
                <p>{error}</p>
                <p className="error-hint">
                  Reset links expire after 1 hour for security reasons. Please request a new reset link.
                </p>
              </div>
            </div>
            <div className="reset-password-actions">
              <button className="btn-primary" onClick={onCancel}>
                Request New Link
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Reset form
  return (
    <div className="reset-password-page">
      <div className="reset-password-container">
        <div className="reset-password-header">
          <h1>🔨 Viking Hammer CrossFit</h1>
          <h2>Reset Your Password</h2>
          <p className="reset-password-subtitle">
            Create a new password for your account
          </p>
        </div>

        <div className="reset-password-body">
          <div className="account-info">
            <p>
              <strong>Account:</strong> {userEmail}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="reset-password-form">
            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                <p>{error}</p>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="password">
                New Password <span className="required">*</span>
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                minLength={6}
                autoFocus
                disabled={submitting}
              />
              <small className="form-hint">Minimum 6 characters</small>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">
                Confirm New Password <span className="required">*</span>
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                required
                minLength={6}
                disabled={submitting}
              />
            </div>

            <div className="security-tips">
              <h4>Password Tips:</h4>
              <ul>
                <li>Use at least 6 characters</li>
                <li>Mix uppercase and lowercase letters</li>
                <li>Include numbers and special characters</li>
                <li>Avoid common words or personal information</li>
              </ul>
            </div>

            <div className="reset-password-actions">
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? (
                  <>
                    <span className="spinner-small"></span> Resetting...
                  </>
                ) : (
                  '🔒 Reset Password'
                )}
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={onCancel}
                disabled={submitting}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
