import React, { useState } from 'react';
import './AuthForm.css';

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
  dateOfBirth?: string;
  gender?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  membershipType?: string;
}

const AuthForm: React.FC<AuthFormProps> = ({ onLogin, onNavigate }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    membershipType: 'Viking Warrior Basic',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

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
      if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
      if (!formData.gender) newErrors.gender = 'Gender is required';
    }

    if (step === 3 && !isLogin) {
      if (!formData.emergencyContactName)
        newErrors.emergencyContactName = 'Emergency contact name is required';
      if (!formData.emergencyContactPhone)
        newErrors.emergencyContactPhone = 'Emergency contact phone is required';
      if (!formData.membershipType) newErrors.membershipType = 'Membership type is required';
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

      // Simulate API call for login
      setTimeout(() => {
        const userData = {
          id: 'vh-' + Date.now(),
          email: formData.email,
          firstName: 'Erik',
          lastName: 'Andersson',
          phone: '+46 70 123 4567',
          membershipType: 'Viking Warrior Premium',
          joinDate: new Date().toISOString(),
          isAuthenticated: true,
        };

        setIsLoading(false);
        onLogin(userData);
      }, 1500);
    } else {
      // For signup, validate current step
      if (!validateStep(currentStep)) return;

      if (currentStep < 3) {
        setCurrentStep(currentStep + 1);
      } else {
        // Final step - submit signup
        setIsLoading(true);

        // Simulate API call for signup
        setTimeout(() => {
          const userData = {
            id: 'vh-' + Date.now(),
            email: formData.email,
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
            dateOfBirth: formData.dateOfBirth,
            gender: formData.gender,
            emergencyContact: {
              name: formData.emergencyContactName,
              phone: formData.emergencyContactPhone,
            },
            membershipType: formData.membershipType,
            joinDate: new Date().toISOString(),
            isAuthenticated: true,
          };

          setIsLoading(false);
          onLogin(userData);
        }, 2000);
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
    setErrors({});
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phone: '',
      dateOfBirth: '',
      gender: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      membershipType: 'Viking Warrior Basic',
    });
  };

  const renderLoginForm = () => (
    <div className="auth-form-content">
      <div className="form-group">
        <label htmlFor="email">Email Address</label>
        <input
          type="email"
          id="email"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          placeholder="your.email@example.com"
          className={errors.email ? 'error' : ''}
        />
        {errors.email && <span className="error-message">{errors.email}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="password">Password</label>
        <input
          type="password"
          id="password"
          value={formData.password}
          onChange={(e) => handleInputChange('password', e.target.value)}
          placeholder="Enter your password"
          className={errors.password ? 'error' : ''}
        />
        {errors.password && <span className="error-message">{errors.password}</span>}
      </div>

      <button type="submit" className="submit-button" disabled={isLoading}>
        {isLoading ? (
          <span className="loading-spinner">⚡ Logging in...</span>
        ) : (
          '🔨 Login to Viking Hammer'
        )}
      </button>

      <div className="forgot-password">
        <a href="#" onClick={(e) => e.preventDefault()}>
          Forgot your password?
        </a>
      </div>
    </div>
  );

  const renderSignupStep1 = () => (
    <div className="auth-form-content">
      <div className="step-indicator">
        <div className="step-progress">
          <div className="progress-bar" style={{ width: '33.33%' }}></div>
        </div>
        <span className="step-text">Step 1 of 3: Account Details</span>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="firstName">First Name</label>
          <input
            type="text"
            id="firstName"
            value={formData.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            placeholder="Erik"
            className={errors.firstName ? 'error' : ''}
          />
          {errors.firstName && <span className="error-message">{errors.firstName}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="lastName">Last Name</label>
          <input
            type="text"
            id="lastName"
            value={formData.lastName}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
            placeholder="Andersson"
            className={errors.lastName ? 'error' : ''}
          />
          {errors.lastName && <span className="error-message">{errors.lastName}</span>}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="email">Email Address</label>
        <input
          type="email"
          id="email"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          placeholder="erik.andersson@email.com"
          className={errors.email ? 'error' : ''}
        />
        {errors.email && <span className="error-message">{errors.email}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="password">Password</label>
        <input
          type="password"
          id="password"
          value={formData.password}
          onChange={(e) => handleInputChange('password', e.target.value)}
          placeholder="Create a strong password"
          className={errors.password ? 'error' : ''}
        />
        {errors.password && <span className="error-message">{errors.password}</span>}
      </div>

      <button type="submit" className="submit-button">
        Continue to Personal Info →
      </button>
    </div>
  );

  const renderSignupStep2 = () => (
    <div className="auth-form-content">
      <div className="step-indicator">
        <div className="step-progress">
          <div className="progress-bar" style={{ width: '66.66%' }}></div>
        </div>
        <span className="step-text">Step 2 of 3: Personal Information</span>
      </div>

      <div className="form-group">
        <label htmlFor="phone">Phone Number</label>
        <input
          type="tel"
          id="phone"
          value={formData.phone}
          onChange={(e) => handleInputChange('phone', e.target.value)}
          placeholder="+46 70 123 4567"
          className={errors.phone ? 'error' : ''}
        />
        {errors.phone && <span className="error-message">{errors.phone}</span>}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="dateOfBirth">Date of Birth</label>
          <input
            type="date"
            id="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
            className={errors.dateOfBirth ? 'error' : ''}
          />
          {errors.dateOfBirth && <span className="error-message">{errors.dateOfBirth}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="gender">Gender</label>
          <select
            id="gender"
            value={formData.gender}
            onChange={(e) => handleInputChange('gender', e.target.value)}
            className={errors.gender ? 'error' : ''}
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
            <option value="Prefer not to say">Prefer not to say</option>
          </select>
          {errors.gender && <span className="error-message">{errors.gender}</span>}
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="back-button" onClick={handlePrevStep}>
          ← Back
        </button>
        <button type="submit" className="submit-button">
          Continue to Emergency Contact →
        </button>
      </div>
    </div>
  );

  const renderSignupStep3 = () => (
    <div className="auth-form-content">
      <div className="step-indicator">
        <div className="step-progress">
          <div className="progress-bar" style={{ width: '100%' }}></div>
        </div>
        <span className="step-text">Step 3 of 3: Emergency Contact & Membership</span>
      </div>

      <div className="form-section">
        <h4>Emergency Contact</h4>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="emergencyContactName">Contact Name</label>
            <input
              type="text"
              id="emergencyContactName"
              value={formData.emergencyContactName}
              onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
              placeholder="Anna Andersson"
              className={errors.emergencyContactName ? 'error' : ''}
            />
            {errors.emergencyContactName && (
              <span className="error-message">{errors.emergencyContactName}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="emergencyContactPhone">Contact Phone</label>
            <input
              type="tel"
              id="emergencyContactPhone"
              value={formData.emergencyContactPhone}
              onChange={(e) => handleInputChange('emergencyContactPhone', e.target.value)}
              placeholder="+46 70 987 6543"
              className={errors.emergencyContactPhone ? 'error' : ''}
            />
            {errors.emergencyContactPhone && (
              <span className="error-message">{errors.emergencyContactPhone}</span>
            )}
          </div>
        </div>
      </div>

      <div className="form-section">
        <h4>Membership Plan</h4>
        <div className="membership-options">
          {[
            {
              value: 'Viking Warrior Basic',
              price: '299 SEK/month',
              features: ['Gym Access', '2 Classes/week', 'Basic Equipment'],
            },
            {
              value: 'Viking Warrior Standard',
              price: '499 SEK/month',
              features: ['Gym Access', '5 Classes/week', 'All Equipment', 'Nutrition Plan'],
            },
            {
              value: 'Viking Warrior Premium',
              price: '799 SEK/month',
              features: [
                'Unlimited Access',
                'All Classes',
                'Personal Training',
                'Meal Plans',
                'Recovery Services',
              ],
            },
          ].map((plan) => (
            <div
              key={plan.value}
              className={`membership-option ${
                formData.membershipType === plan.value ? 'selected' : ''
              }`}
              onClick={() => handleInputChange('membershipType', plan.value)}
            >
              <div className="plan-header">
                <h5>{plan.value}</h5>
                <span className="plan-price">{plan.price}</span>
              </div>
              <ul className="plan-features">
                {plan.features.map((feature, index) => (
                  <li key={index}>✓ {feature}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {errors.membershipType && <span className="error-message">{errors.membershipType}</span>}
      </div>

      <div className="form-actions">
        <button type="button" className="back-button" onClick={handlePrevStep}>
          ← Back
        </button>
        <button type="submit" className="submit-button" disabled={isLoading}>
          {isLoading ? (
            <span className="loading-spinner">⚡ Creating Account...</span>
          ) : (
            '🔨 Join Viking Hammer CrossFit'
          )}
        </button>
      </div>
    </div>
  );

  const renderStepContent = () => {
    if (isLogin) return renderLoginForm();

    switch (currentStep) {
      case 1:
        return renderSignupStep1();
      case 2:
        return renderSignupStep2();
      case 3:
        return renderSignupStep3();
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
        <div className="auth-header">
          <div className="auth-logo">
            <h1>🔨 Viking Hammer CrossFit</h1>
          </div>
          <div className="auth-title">
            <h2>{isLogin ? 'Welcome Back, Warrior!' : 'Join the Viking Army!'}</h2>
            <p>
              {isLogin
                ? 'Sign in to access your training dashboard and continue your fitness journey.'
                : 'Start your transformation today and become the strongest version of yourself.'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="auth-form-container">
          {renderStepContent()}
        </form>

        <div className="auth-footer">
          <p>
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              className="toggle-button"
              onClick={toggleMode}
              disabled={isLoading}
            >
              {isLogin ? 'Sign up here' : 'Sign in here'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
