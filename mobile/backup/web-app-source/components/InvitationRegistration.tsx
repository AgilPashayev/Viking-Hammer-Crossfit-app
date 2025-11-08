import React, { useState, useEffect } from 'react';
import './InvitationRegistration.css';

interface InvitationData {
  email: string;
  phone?: string;
  delivery_method: string;
  status: string;
  expires_at: string;
}

interface InvitationRegistrationProps {
  token: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const InvitationRegistration: React.FC<InvitationRegistrationProps> = ({
  token,
  onSuccess,
  onCancel,
}) => {
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [invitationData, setInvitationData] = useState<InvitationData | null>(null);

  // Form fields
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
    phone: '',
    dateOfBirth: '',
  });

  // Validate invitation token on mount
  useEffect(() => {
    validateToken();
  }, [token]);

  const validateToken = async () => {
    setValidating(true);
    setError('');

    try {
      const response = await fetch(`http://localhost:4001/api/invitations/${token}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error || 'Invalid or expired invitation link');
        setValidating(false);
        setLoading(false);
        return;
      }

      setInvitationData(result.data);
      setFormData((prev) => ({
        ...prev,
        phone: result.data.phone || '',
      }));
      setValidating(false);
      setLoading(false);
    } catch (err) {
      setError('Failed to validate invitation. Please check your internet connection.');
      setValidating(false);
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const validateForm = (): boolean => {
    if (!formData.firstName.trim()) {
      setError('First name is required');
      return false;
    }
    if (!formData.lastName.trim()) {
      setError('Last name is required');
      return false;
    }
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (formData.dateOfBirth && new Date(formData.dateOfBirth) > new Date()) {
      setError('Date of birth cannot be in the future');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`http://localhost:4001/api/invitations/${token}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          dateOfBirth: formData.dateOfBirth || null,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error || 'Registration failed. Please try again.');
        setSubmitting(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err) {
      setError('Failed to complete registration. Please try again.');
      setSubmitting(false);
    }
  };

  if (validating) {
    return (
      <div className="invitation-registration-container">
        <div className="invitation-card">
          <div className="loading-spinner"></div>
          <p className="validating-text">Validating invitation...</p>
        </div>
      </div>
    );
  }

  if (error && !invitationData) {
    return (
      <div className="invitation-registration-container">
        <div className="invitation-card">
          <div className="error-icon">⚠️</div>
          <h2 className="error-title">Invalid Invitation</h2>
          <p className="error-message">{error}</p>
          <button onClick={onCancel} className="btn-secondary">
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="invitation-registration-container">
        <div className="invitation-card success-card">
          <div className="success-icon">✓</div>
          <h2 className="success-title">Registration Successful!</h2>
          <p className="success-message">Your account has been created. Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="invitation-registration-container">
      <div className="invitation-card">
        <div className="invitation-header">
          <h2>Complete Your Registration</h2>
          <p className="invitation-subtitle">You've been invited to join Viking Hammer CrossFit</p>
        </div>

        {invitationData && (
          <div className="invitation-info">
            <div className="info-row">
              <span className="info-label">Email:</span>
              <span className="info-value">{invitationData.email}</span>
            </div>
            <div className="info-note">
              ✓ Your email has been pre-verified through this invitation
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="registration-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">
                First Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                placeholder="John"
                required
                disabled={submitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="lastName">
                Last Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                placeholder="Doe"
                required
                disabled={submitting}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="+994 XX XXX XX XX"
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="dateOfBirth">Date of Birth</label>
            <input
              type="date"
              id="dateOfBirth"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleInputChange}
              max={new Date().toISOString().split('T')[0]}
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              Password <span className="required">*</span>
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="At least 6 characters"
              minLength={6}
              required
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">
              Confirm Password <span className="required">*</span>
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="Re-enter password"
              minLength={6}
              required
              disabled={submitting}
            />
          </div>

          {error && (
            <div className="error-alert">
              <span className="error-icon">⚠️</span>
              <span className="error-text">{error}</span>
            </div>
          )}

          <div className="form-actions">
            <button type="button" onClick={onCancel} className="btn-cancel" disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={submitting}>
              {submitting ? (
                <>
                  <div className="btn-spinner"></div>
                  <span>Creating Account...</span>
                </>
              ) : (
                'Complete Registration'
              )}
            </button>
          </div>
        </form>

        <div className="registration-footer">
          <p className="footer-text">
            By registering, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default InvitationRegistration;
