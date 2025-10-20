import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import './AuthForm.css';
import {
  signUpUser,
  signInUser,
  countryCodes,
  validateDateFormat,
  formatDateForStorage,
  updateUserProfile,
} from '../services/supabaseService';
import { 
  createVerificationToken, 
  sendVerificationEmail 
} from '../services/emailVerificationService';

interface AuthFormProps {
  onLogin: (userData: any) => void;
  onNavigate?: (page: string) => void;
}

interface FormData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  countryCode?: string;
  dateOfBirth?: string;
  gender?: string;
}

const AuthForm: React.FC<AuthFormProps> = ({ onLogin, onNavigate }) => {
  const { addMember } = useData();
  const [isLogin, setIsLogin] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [maxSteps] = useState(2); // Only 2 steps now
  const [isLoading, setIsLoading] = useState(false);
  const [createdUser, setCreatedUser] = useState<any>(null); // Store user created in step 1
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    countryCode: '+994',
    dateOfBirth: '',
    gender: '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [rememberMe, setRememberMe] = useState<boolean>(false);

  const validateStep = (step: number): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (step === 1) {
      if (!formData.email) newErrors.email = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format';

      if (!formData.password) newErrors.password = 'Password is required';
      else if (formData.password.length < 6)
        newErrors.password = 'Password must be at least 6 characters';

      if (!isLogin) {
        if (!formData.firstName) newErrors.firstName = 'First name is required';
        if (!formData.lastName) newErrors.lastName = 'Last name is required';
      }
    }

    if (step === 2 && !isLogin) {
      if (!formData.phone) newErrors.phone = 'Phone number is required';
      else if (!/^\d{7,15}$/.test(formData.phone)) newErrors.phone = 'Invalid phone number format';

      if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
      else if (!validateDateFormat(formData.dateOfBirth))
        newErrors.dateOfBirth = 'Date must be in DD-MM-YYYY format';

      if (!formData.gender) newErrors.gender = 'Gender is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLogin) {
      if (!validateStep(1)) return;

      setIsLoading(true);

      try {
        console.log('🎯 === AUTHFORM: Initiating Login ===');
        console.log('📧 Form Email:', formData.email);
        console.log('🔑 Form Password:', formData.password);
        console.log('🔑 Form Password Length:', formData.password?.length);
        
        const loginPayload = {
          email: formData.email,
          password: formData.password,
        };
        console.log('📦 Sending to signInUser:', loginPayload);
        
        const { user, error } = await signInUser(loginPayload);

        console.log('📨 Response from signInUser:');
        console.log('  - User:', user ? 'RECEIVED' : 'NULL');
        console.log('  - Error:', error ? error : 'NONE');

        if (error) {
          console.error('❌ Login failed with error:', error);
          setErrors({ general: error });
          setIsLoading(false);
          return;
        }

        if (user) {
          console.log('✅ User data received, preparing userData object...');
          const userData = {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone || '',
            countryCode: user.countryCode || '',
            dateOfBirth: user.dateOfBirth || '',
            gender: user.gender || '',
            emergencyContactName: user.emergencyContactName || '',
            emergencyContactPhone: user.emergencyContactPhone || '',
            emergencyContactCountryCode: user.emergencyContactCountryCode || '',
            membershipType: user.membershipType,
            joinDate: user.joinDate,
            isAuthenticated: true,
          };

          console.log('👤 Prepared userData:', userData);
          setIsLoading(false);
          
          // Persist session if Remember Me is checked
          try {
            if (rememberMe) {
              console.log('💾 Saving to localStorage (Remember Me)');
              localStorage.setItem('viking_remembered_user', JSON.stringify(userData));
            } else {
              console.log('🗑️ Removing from localStorage (Remember Me off)');
              localStorage.removeItem('viking_remembered_user');
            }
          } catch (err) {
            console.error('⚠️ Storage error:', err);
          }
          
          console.log('📞 Calling onLogin callback with userData');
          onLogin(userData);
          console.log('🎯 === AUTHFORM: Login Complete ===');
        }
      } catch (error) {
        console.error('Login error:', error);
        setErrors({ general: 'An unexpected error occurred. Please try again.' });
        setIsLoading(false);
      }
    } else {
      // For signup, validate current step
      if (!validateStep(currentStep)) return;

      if (currentStep === 1) {
        // Step 1: Create basic account
        setIsLoading(true);

        try {
          const signupData = {
            email: formData.email!,
            password: formData.password!,
            firstName: formData.firstName!,
            lastName: formData.lastName!,
            phone: '', // Will be updated in step 2
            countryCode: '+994', // Default, will be updated in step 2
            dateOfBirth: '', // Will be updated in step 2
            gender: '', // Will be updated in step 2
            emergencyContactName: '',
            emergencyContactPhone: '',
            emergencyContactCountryCode: '+994',
            membershipType: 'Viking Warrior Basic',
          };

          const { user, error } = await signUpUser(signupData);

          if (error) {
            setErrors({ general: error });
            setIsLoading(false);
            return;
          }

          if (user) {
            // Store the created user for step 2
            setCreatedUser(user);
            setCurrentStep(2);
          }

          setIsLoading(false);
        } catch (error) {
          console.error('Signup error:', error);
          setErrors({ general: 'An unexpected error occurred. Please try again.' });
          setIsLoading(false);
        }
      } else {
        // Step 2: Update with additional information
        setIsLoading(true);

        try {
          if (!createdUser) {
            setErrors({ general: 'User creation failed. Please start over.' });
            setIsLoading(false);
            return;
          }

          // Update user profile with step 2 data
          const updateData = {
            phone: formData.phone!,
            countryCode: formData.countryCode!,
            dateOfBirth: formatDateForStorage(formData.dateOfBirth!),
            gender: formData.gender!,
          };

          const { user: updatedUser, error: updateError } = await updateUserProfile(
            createdUser.id,
            updateData,
          );

          if (updateError) {
            setErrors({ general: updateError });
            setIsLoading(false);
            return;
          }

          if (updatedUser) {
            const userData = {
              id: updatedUser.id,
              email: updatedUser.email,
              firstName: updatedUser.firstName,
              lastName: updatedUser.lastName,
              phone: updatedUser.phone || '',
              countryCode: updatedUser.countryCode || '',
              dateOfBirth: updatedUser.dateOfBirth || '',
              gender: updatedUser.gender || '',
              emergencyContactName: updatedUser.emergencyContactName || '',
              emergencyContactPhone: updatedUser.emergencyContactPhone || '',
              emergencyContactCountryCode: updatedUser.emergencyContactCountryCode || '',
              membershipType: updatedUser.membershipType,
              joinDate: updatedUser.joinDate,
              isAuthenticated: true,
            };

            // Add the new user to the centralized member list
            const memberData = {
              firstName: updatedUser.firstName,
              lastName: updatedUser.lastName,
              email: updatedUser.email,
              phone: updatedUser.phone || '',
              membershipType: updatedUser.membershipType,
              status: 'active' as 'active',
              joinDate: updatedUser.joinDate,
              role: 'member' as 'member',
              dateOfBirth: updatedUser.dateOfBirth,
              gender: updatedUser.gender,
            };
            addMember(memberData);

            // Send verification email
            console.log('📧 Sending verification email...');
            try {
              const { token, expiresAt, error: tokenError } = await createVerificationToken(
                updatedUser.id,
                updatedUser.email
              );

              if (tokenError || !token) {
                console.error('Failed to create verification token:', tokenError);
                // Continue with signup even if email verification fails
                alert('✅ Account created successfully!\n\n⚠️ Note: Email verification is not available in demo mode, but you can login now with your email and password.');
              } else {
                const emailResult = await sendVerificationEmail({
                  email: updatedUser.email,
                  firstName: updatedUser.firstName,
                  token: token,
                  expiresAt: expiresAt || ''
                });

                if (emailResult.success) {
                  alert('✅ ' + emailResult.message + '\n\nYou can login now with your email and password.');
                } else {
                  console.error('Failed to send verification email:', emailResult.error);
                  alert('✅ Account created successfully!\n\n⚠️ Note: Verification email could not be sent in demo mode, but you can login now with your email and password.');
                }
              }
            } catch (emailError) {
              console.error('Email verification error:', emailError);
              // Continue with signup
              alert('✅ Account created successfully! You can login now with your email and password.');
            }

            setIsLoading(false);
            onLogin(userData);
          }
        } catch (error) {
          console.error('Profile update error:', error);
          setErrors({ general: 'An unexpected error occurred. Please try again.' });
          setIsLoading(false);
        }
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setCurrentStep(1);
    setCreatedUser(null); // Reset created user
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phone: '',
      countryCode: '+994',
      dateOfBirth: '',
      gender: '',
    });
    setErrors({});
  };

  const formatDateInput = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');

    // Format as DD-MM-YYYY
    if (digits.length >= 8) {
      return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4, 8)}`;
    } else if (digits.length >= 4) {
      return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
    } else if (digits.length >= 2) {
      return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    }
    return digits;
  };

  const handleClearDemoData = () => {
    if (confirm('⚠️ This will clear ALL demo users and logout. Continue?')) {
      localStorage.removeItem('viking_demo_users');
      localStorage.removeItem('viking_current_user');
      localStorage.removeItem('viking_remembered_user');
      console.log('🧹 Demo data cleared successfully!');
      alert('✅ Demo data cleared! Please sign up as a new demo user.');
      window.location.reload();
    }
  };

  const renderLoginForm = () => {
    const isDemoMode =
      window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    return (
      <div className="auth-form-content">
        <div className="auth-header">
          <h2>Welcome Back, Viking!</h2>
          <p>Ready to unleash your inner warrior?</p>
        </div>

      <div className="form-group">
        <label htmlFor="email">Email *</label>
        <input
          type="email"
          id="email"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          placeholder="your@email.com"
          className={errors.email ? 'error' : ''}
          required
        />
        {errors.email && <span className="error-message">{errors.email}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="password">Password *</label>
        <input
          type="password"
          id="password"
          value={formData.password}
          onChange={(e) => handleInputChange('password', e.target.value)}
          placeholder="Enter your password"
          className={errors.password ? 'error' : ''}
          required
        />
        {errors.password && <span className="error-message">{errors.password}</span>}
      </div>

      <div className="remember-row">
        <label className="remember-checkbox">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          <span>Remember me</span>
        </label>
      </div>

      {errors.general && <div className="general-error">{errors.general}</div>}

      <button type="submit" className="submit-button" disabled={isLoading}>
        {isLoading ? 'Signing In...' : 'Login →'}
      </button>

      <p className="auth-switch">
        New warrior?{' '}
        <button type="button" onClick={toggleMode} className="link-button">
          Join the Viking Army
        </button>
      </p>

      {isDemoMode && (
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button
            type="button"
            onClick={handleClearDemoData}
            style={{
              padding: '8px 16px',
              background: '#ff4444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            🧹 Clear Demo Data & Start Fresh
          </button>
          <p style={{ fontSize: '11px', color: '#666', marginTop: '8px' }}>
            Having login issues? Click above to reset demo users.
          </p>
        </div>
      )}
    </div>
    );
  };

  const renderSignupStep1 = () => (
    <div className="auth-form-content">
      <div className="step-indicator">
        <div className="step-progress">
          <div className="progress-bar" style={{ width: '50%' }}></div>
        </div>
        <span className="step-text">Step 1 of 2: Account Setup</span>
      </div>

      <div className="auth-header">
        <h2>Join the Viking Army!</h2>
        <p>Create your warrior profile</p>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="firstName">First Name *</label>
          <input
            type="text"
            id="firstName"
            value={formData.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            placeholder="Erik"
            className={errors.firstName ? 'error' : ''}
            required
          />
          {errors.firstName && <span className="error-message">{errors.firstName}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="lastName">Last Name *</label>
          <input
            type="text"
            id="lastName"
            value={formData.lastName}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
            placeholder="Eriksson"
            className={errors.lastName ? 'error' : ''}
            required
          />
          {errors.lastName && <span className="error-message">{errors.lastName}</span>}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="email">Email *</label>
        <input
          type="email"
          id="email"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          placeholder="erik@example.com"
          className={errors.email ? 'error' : ''}
          required
        />
        {errors.email && <span className="error-message">{errors.email}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="password">Password *</label>
        <input
          type="password"
          id="password"
          value={formData.password}
          onChange={(e) => handleInputChange('password', e.target.value)}
          placeholder="Create a strong password"
          className={errors.password ? 'error' : ''}
          required
        />
        {errors.password && <span className="error-message">{errors.password}</span>}
      </div>

      {errors.general && <div className="general-error">{errors.general}</div>}

      <button type="submit" className="submit-button">
        Continue →
      </button>

      <p className="auth-switch">
        Already a Viking?{' '}
        <button type="button" onClick={toggleMode} className="link-button">
          Login here
        </button>
      </p>
    </div>
  );

  const renderSignupStep2 = () => (
    <div className="auth-form-content">
      <div className="step-indicator">
        <div className="step-progress">
          <div className="progress-bar" style={{ width: '100%' }}></div>
        </div>
        <span className="step-text">Step 2 of 2: Personal Information</span>
      </div>

      <div className="form-group">
        <label>Phone Number *</label>
        <div className="phone-input-container">
          <select
            value={formData.countryCode}
            onChange={(e) => handleInputChange('countryCode', e.target.value)}
            className="country-code-select"
            required
          >
            {countryCodes.map((country) => (
              <option key={country.code} value={country.code}>
                {country.flag} {country.code}
              </option>
            ))}
          </select>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, ''); // Only digits
              handleInputChange('phone', value);
            }}
            placeholder="509876543"
            className={errors.phone ? 'error phone-number-input' : 'phone-number-input'}
            required
          />
        </div>
        {errors.phone && <span className="error-message">{errors.phone}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="dateOfBirth">Date of Birth *</label>
        <input
          type="text"
          id="dateOfBirth"
          value={formData.dateOfBirth}
          onChange={(e) => {
            const formatted = formatDateInput(e.target.value);
            handleInputChange('dateOfBirth', formatted);
          }}
          placeholder="DD-MM-YYYY"
          maxLength={10}
          className={errors.dateOfBirth ? 'error' : ''}
          required
        />
        {errors.dateOfBirth && <span className="error-message">{errors.dateOfBirth}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="gender">Gender *</label>
        <select
          id="gender"
          value={formData.gender}
          onChange={(e) => handleInputChange('gender', e.target.value)}
          className={errors.gender ? 'error' : ''}
          required
        >
          <option value="">Select Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
        {errors.gender && <span className="error-message">{errors.gender}</span>}
      </div>

      {errors.general && <div className="general-error">{errors.general}</div>}

      <div className="form-actions">
        <button type="button" className="back-button" onClick={handlePrevStep}>
          ← Back
        </button>
        <button type="submit" className="submit-button" disabled={isLoading}>
          {isLoading ? 'Creating Account...' : 'Join Viking Hammer →'}
        </button>
      </div>
    </div>
  );

  const renderFormContent = () => {
    // Check if we're in demo mode
    const isDemoMode =
      window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    if (isLogin) {
      return (
        <>
          {isDemoMode && (
            <div className="demo-banner">
              🚀 <strong>Demo Mode Active!</strong> Use any email/password to test login
              functionality!
            </div>
          )}
          {renderLoginForm()}
        </>
      );
    }

    switch (currentStep) {
      case 1:
        return (
          <>
            {isDemoMode && (
              <div className="demo-banner">
                🚀 <strong>Demo Mode Active!</strong> You can use any email/password to test
                signup/login. No real database connection required!
              </div>
            )}
            {renderSignupStep1()}
          </>
        );
      case 2:
        return renderSignupStep2();
      default:
        return renderSignupStep1();
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="background-overlay"></div>
      </div>

      <div className="auth-form">
        <form onSubmit={handleSubmit}>{renderFormContent()}</form>
      </div>
    </div>
  );
};

export default AuthForm;
