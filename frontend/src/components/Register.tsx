// frontend/src/components/Register.tsx
// Registration page for invitation-based signup

import React, { useState, useEffect } from 'react';
import './Register.css';

const API_URL = 'http://localhost:4001/api';

interface RegisterProps {
  token: string;
  onSuccess: (userData: any, authToken: string) => void;
  onCancel: () => void;
}

interface InvitationData {
  email: string;
  userName?: string;
  phone?: string;
}

export default function Register({ token, onSuccess, onCancel }: RegisterProps) {
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [invitationData, setInvitationData] = useState<InvitationData | null>(null);

  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  // Validate invitation token on mount
  useEffect(() => {
    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      setValidating(true);
      setError('');

      const response = await fetch(`${API_URL}/invitations/${token}`);
      const result = await response.json();

      if (!response.ok || !result.valid) {
        setError(result.error || 'Invalid or expired invitation link');
        setValidating(false);
        setLoading(false);
        return;
      }

      // Set invitation data
      setInvitationData(result.data);

      // Pre-fill name if available
      if (result.data.userName) {
        const nameParts = result.data.userName.split(' ');
        setFirstName(nameParts[0] || '');
        setLastName(nameParts.slice(1).join(' ') || '');
      }

      // Pre-fill phone if available
      if (result.data.phone) {
        setPhone(result.data.phone);
      }

      setValidating(false);
      setLoading(false);
    } catch (err) {
      console.error('Token validation error:', err);
      setError('Failed to validate invitation. Please try again.');
      setValidating(false);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!firstName.trim() || !lastName.trim()) {
      setError('Please enter your full name');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!agreeToTerms) {
      setError('Please agree to the terms and conditions');
      return;
    }

    try {
      setSubmitting(true);

      // Register using invitation token
      const response = await fetch(`${API_URL}/invitations/${token}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim() || undefined,
          dateOfBirth: dateOfBirth || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Registration failed. Please try again.');
        setSubmitting(false);
        return;
      }

      // Registration successful - auto-login
      console.log('✅ Registration successful');
      
      // Call success handler with user data and token
      onSuccess(result.data.user, result.data.token);
    } catch (err) {
      console.error('Registration error:', err);
      setError('Registration failed. Please try again.');
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading || validating) {
    return (
      <div className="register-page">
        <div className="register-container">
          <div className="register-header">
            <h1>🔨 Viking Hammer CrossFit</h1>
            <h2>Complete Your Registration</h2>
          </div>
          <div className="register-body">
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Validating invitation...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state (invalid/expired token)
  if (error && !invitationData) {
    return (
      <div className="register-page">
        <div className="register-container">
          <div className="register-header error">
            <h1>🔨 Viking Hammer CrossFit</h1>
            <h2>Invalid Invitation</h2>
          </div>
          <div className="register-body">
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              <p>{error}</p>
            </div>
            <div className="register-actions">
              <button className="btn-secondary" onClick={onCancel}>
                Return to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Registration form
  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-header">
          <h1>🔨 Viking Hammer CrossFit</h1>
          <h2>Complete Your Registration</h2>
          <p className="register-subtitle">
            Welcome! Create your account to join our community.
          </p>
        </div>

        <div className="register-body">
          {invitationData && (
            <div className="invitation-info">
              <p>
                <strong>Email:</strong> {invitationData.email}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="register-form">
            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                <p>{error}</p>
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">
                  First Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label htmlFor="lastName">
                  Last Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number (optional)</label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1234567890"
              />
            </div>

            <div className="form-group">
              <label htmlFor="dateOfBirth">Date of Birth (optional)</label>
              <input
                type="date"
                id="dateOfBirth"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">
                Password <span className="required">*</span>
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                minLength={6}
              />
              <small className="form-hint">Minimum 6 characters</small>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">
                Confirm Password <span className="required">*</span>
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                required
                minLength={6}
              />
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  required
                />
                <span>
                  I agree to the <a href="/terms" target="_blank">Terms of Service</a> and{' '}
                  <a href="/privacy" target="_blank">Privacy Policy</a>
                </span>
              </label>
            </div>

            <div className="register-actions">
              <button
                type="submit"
                className="btn-primary"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="spinner-small"></span> Creating Account...
                  </>
                ) : (
                  '🚀 Create My Account'
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

        <div className="register-footer">
          <p>Already have an account? <a href="#" onClick={onCancel}>Sign In</a></p>
        </div>
      </div>
    </div>
  );
}
