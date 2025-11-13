// frontend/src/components/Register.tsx
// Registration page for invitation-based signup

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  users_profile?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    dob?: string;
    status: string;
    membership_type?: string;
  };
}

export default function Register({ token, onSuccess, onCancel }: RegisterProps) {
  const { t, i18n } = useTranslation();

  // Set Azerbaijani as default ONLY if no language is saved in localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('viking-hammer-language');
    if (!savedLanguage && i18n.language !== 'az') {
      // Only set to Azerbaijani if user has never chosen a language
      i18n.changeLanguage('az').catch((err) => {
        console.error('Failed to change language:', err);
      });
      localStorage.setItem('viking-hammer-language', 'az');
    }
    // If savedLanguage exists, i18n will automatically use it from LanguageDetector
  }, [i18n]);

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
        setError(result.error || t('register.errors.invalidToken'));
        setValidating(false);
        setLoading(false);
        return;
      }

      // Set invitation data
      setInvitationData(result.data);

      // Check if user profile exists with name (member created by admin)
      if (result.data.users_profile && result.data.users_profile.name) {
        // User already has profile - pre-fill all data
        const nameParts = result.data.users_profile.name.split(' ');
        setFirstName(nameParts[0] || '');
        setLastName(nameParts.slice(1).join(' ') || '');

        if (result.data.users_profile.phone) {
          setPhone(result.data.users_profile.phone);
        }

        if (result.data.users_profile.dob) {
          setDateOfBirth(result.data.users_profile.dob);
        }
      } else {
        // Fallback to invitation data
        if (result.data.userName) {
          const nameParts = result.data.userName.split(' ');
          setFirstName(nameParts[0] || '');
          setLastName(nameParts.slice(1).join(' ') || '');
        }

        if (result.data.phone) {
          setPhone(result.data.phone);
        }
      }

      setValidating(false);
      setLoading(false);
    } catch (err) {
      console.error('Token validation error:', err);
      setError(t('register.errors.validationFailed'));
      setValidating(false);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Check if user profile already exists (invited member with pre-filled data)
    const hasExistingProfile = invitationData?.users_profile && invitationData.users_profile.name;

    // Validation - less strict for existing profiles (only password required)
    if (!hasExistingProfile && (!firstName.trim() || !lastName.trim())) {
      setError(t('register.errors.enterFullName'));
      return;
    }

    if (password.length < 6) {
      setError(t('register.errors.passwordLength'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('register.errors.passwordMismatch'));
      return;
    }

    if (!agreeToTerms) {
      setError(t('register.errors.agreeToTermsRequired'));
      return;
    }

    try {
      setSubmitting(true);

      // For existing members, only send password
      // For new users, send all fields
      const registrationData = hasExistingProfile
        ? { password }
        : {
            password,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            phone: phone.trim() || undefined,
            dateOfBirth: dateOfBirth || undefined,
          };

      // Register using invitation token
      const response = await fetch(`${API_URL}/invitations/${token}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || t('register.errors.registrationFailed'));
        setSubmitting(false);
        return;
      }

      // Registration successful - auto-login
      console.log('✅', t('register.success.registrationComplete'));

      // Call success handler with user data and token
      onSuccess(result.data.user, result.data.token);
    } catch (err) {
      console.error('Registration error:', err);
      setError(t('register.errors.registrationFailed'));
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
            <h2>{t('register.title')}</h2>
          </div>
          <div className="register-body">
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>{t('register.validatingInvitation')}</p>
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
            <h2>{t('register.invalidInvitation')}</h2>
          </div>
          <div className="register-body">
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              <p>{error}</p>
            </div>
            <div className="register-actions">
              <button className="btn-secondary" onClick={onCancel}>
                {t('register.actions.returnHome')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Registration form
  const hasExistingProfile = invitationData?.users_profile && invitationData.users_profile.name;

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-header">
          <h1>🔨 Viking Hammer CrossFit</h1>
          <h2>{hasExistingProfile ? t('register.titlePassword') : t('register.title')}</h2>
          <p className="register-subtitle">
            {hasExistingProfile ? t('register.subtitlePassword') : t('register.subtitle')}
          </p>
        </div>

        <div className="register-body">
          {invitationData && (
            <div className="invitation-info">
              {hasExistingProfile && invitationData.users_profile ? (
                <>
                  <p>
                    <strong>{t('register.invitationInfo.name')}:</strong>{' '}
                    {invitationData.users_profile.name}
                  </p>
                  <p>
                    <strong>{t('register.invitationInfo.email')}:</strong> {invitationData.email}
                  </p>
                  {invitationData.users_profile.membership_type && (
                    <p>
                      <strong>{t('register.invitationInfo.membership')}:</strong>{' '}
                      {invitationData.users_profile.membership_type}
                    </p>
                  )}
                </>
              ) : (
                <p>
                  <strong>{t('register.invitationInfo.email')}:</strong> {invitationData.email}
                </p>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="register-form">
            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                <p>{error}</p>
              </div>
            )}

            {/* Only show name/phone/DOB fields for NEW users without existing profile */}
            {!hasExistingProfile && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="firstName">
                      {t('register.form.firstName')}{' '}
                      <span className="required">{t('register.form.required')}</span>
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder={t('register.form.firstNamePlaceholder')}
                      required
                      autoFocus
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="lastName">
                      {t('register.form.lastName')}{' '}
                      <span className="required">{t('register.form.required')}</span>
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder={t('register.form.lastNamePlaceholder')}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="phone">{t('register.form.phone')}</label>
                  <input
                    type="tel"
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t('register.form.phonePlaceholder')}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="dateOfBirth">{t('register.form.dateOfBirth')}</label>
                  <input
                    type="date"
                    id="dateOfBirth"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label htmlFor="password">
                {t('register.form.password')}{' '}
                <span className="required">{t('register.form.required')}</span>
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('register.form.passwordPlaceholder')}
                required
                minLength={6}
              />
              <small className="form-hint">{t('register.form.passwordHint')}</small>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">
                {t('register.form.confirmPassword')}{' '}
                <span className="required">{t('register.form.required')}</span>
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('register.form.confirmPasswordPlaceholder')}
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
                  {t('register.form.agreeToTermsPrefix')}{' '}
                  <a href="/terms" target="_blank">
                    {t('register.form.termsOfService')}
                  </a>{' '}
                  {t('register.form.agreeToTermsMiddle')}{' '}
                  <a href="/privacy" target="_blank">
                    {t('register.form.privacyPolicy')}
                  </a>{' '}
                  {t('register.form.agreeToTermsSuffix')}
                </span>
              </label>
            </div>

            <div className="register-actions">
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? (
                  <>
                    <span className="spinner-small"></span> {t('register.actions.creating')}
                  </>
                ) : (
                  t('register.actions.createAccount')
                )}
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={onCancel}
                disabled={submitting}
              >
                {t('register.actions.cancel')}
              </button>
            </div>
          </form>
        </div>

        <div className="register-footer">
          <p>
            {t('register.footer.alreadyHaveAccount')}{' '}
            <a href="#" onClick={onCancel}>
              {t('register.footer.signIn')}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
