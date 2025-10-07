// Supabase service for authentication and user management
import { createClient } from '@supabase/supabase-js';

// Use environment variables or fallback to demo values
const supabaseUrl =
  (import.meta as any).env?.VITE_SUPABASE_URL || 'https://nqseztalzjcfucfeljkf.supabase.co';
const supabaseKey =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xc2V6dGFsempjZnVjZmVsamtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjgxNTIzMzQsImV4cCI6MjA0MzcyODMzNH0.LJkFBfZqtyDJpxFU2J1wXKz0hzR9_gEHZJkzHBP6dDA';

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  countryCode: string;
  dateOfBirth: string;
  gender: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactCountryCode: string;
  membershipType: string;
  joinDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SignupData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  countryCode: string;
  dateOfBirth: string;
  gender: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactCountryCode: string;
  membershipType: string;
}

export interface LoginData {
  email: string;
  password: string;
}

// Country codes for phone numbers
export const countryCodes = [
  { code: '+994', country: 'Azerbaijan', flag: '🇦🇿' },
  { code: '+1', country: 'United States', flag: '🇺🇸' },
  { code: '+1', country: 'Canada', flag: '🇨🇦' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+39', country: 'Italy', flag: '🇮🇹' },
  { code: '+34', country: 'Spain', flag: '🇪🇸' },
  { code: '+31', country: 'Netherlands', flag: '🇳🇱' },
  { code: '+46', country: 'Sweden', flag: '🇸🇪' },
  { code: '+47', country: 'Norway', flag: '🇳🇴' },
  { code: '+45', country: 'Denmark', flag: '🇩🇰' },
  { code: '+90', country: 'Turkey', flag: '🇹🇷' },
  { code: '+7', country: 'Russia', flag: '🇷🇺' },
  { code: '+86', country: 'China', flag: '🇨🇳' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
  { code: '+82', country: 'South Korea', flag: '🇰🇷' },
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
];

// Demo mode storage - persist in localStorage for better user experience
const getDemoUsers = (): { [email: string]: { password: string; profile: UserProfile } } => {
  try {
    const stored = localStorage.getItem('viking_demo_users');
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const saveDemoUsers = (users: { [email: string]: { password: string; profile: UserProfile } }) => {
  try {
    localStorage.setItem('viking_demo_users', JSON.stringify(users));
  } catch (error) {
    console.warn('Failed to save demo users to localStorage:', error);
  }
};

// Check if we're in demo mode (local development)
const isInDemoMode = (): boolean => {
  // Force demo mode for local development
  const hostname = window.location.hostname;
  const isDemo =
    hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('localhost');
  console.log('Demo mode check:', { hostname, isDemo });
  return isDemo;
};

// Get current demo users from localStorage
let demoUsers = getDemoUsers();

// Authentication functions
export const signUpUser = async (
  userData: SignupData,
): Promise<{ user: UserProfile | null; error: string | null }> => {
  try {
    console.log('Starting signup process...', { email: userData.email });

    // Check if we're in demo mode
    const isDemoMode = isInDemoMode();

    if (isDemoMode) {
      console.log('Demo mode: Creating mock user...');

      // Check if user already exists in demo storage
      if (demoUsers[userData.email]) {
        return { user: null, error: 'User with this email already exists' };
      }

      // Create mock user profile
      const mockUser: UserProfile = {
        id: 'demo-' + Date.now(),
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        countryCode: userData.countryCode,
        dateOfBirth: userData.dateOfBirth,
        gender: userData.gender,
        emergencyContactName: userData.emergencyContactName,
        emergencyContactPhone: userData.emergencyContactPhone,
        emergencyContactCountryCode: userData.emergencyContactCountryCode,
        membershipType: userData.membershipType,
        joinDate: new Date().toISOString(),
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Store user in demo storage with password
      demoUsers[userData.email] = {
        password: userData.password,
        profile: mockUser,
      };

      // Save to localStorage
      saveDemoUsers(demoUsers);

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log('Demo signup successful!', mockUser);
      console.log('Stored in demo storage:', demoUsers);
      return { user: mockUser, error: null };
    }

    // First, sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
    });

    if (authError) {
      console.error('Auth signup error:', authError);
      return { user: null, error: authError.message };
    }

    if (!authData.user) {
      return { user: null, error: 'Failed to create user account' };
    }

    console.log('Auth signup successful, creating profile...');

    // Create user profile in our custom table
    const userProfile = {
      id: authData.user.id,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phone: userData.phone,
      countryCode: userData.countryCode,
      dateOfBirth: userData.dateOfBirth,
      gender: userData.gender,
      emergencyContactName: userData.emergencyContactName,
      emergencyContactPhone: userData.emergencyContactPhone,
      emergencyContactCountryCode: userData.emergencyContactCountryCode,
      membershipType: userData.membershipType,
      joinDate: new Date().toISOString(),
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Insert user profile
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .insert([userProfile])
      .select()
      .single();

    if (profileError) {
      console.error('Profile creation error:', profileError);
      return { user: null, error: 'Failed to create user profile. Please try again.' };
    }

    console.log('Profile created successfully!', profileData);
    return { user: profileData as UserProfile, error: null };
  } catch (error: any) {
    console.error('Signup error:', error);

    // Check if it's a network error
    if (error.message?.includes('fetch') || error.name === 'NetworkError') {
      return {
        user: null,
        error: 'Network connection failed. Please check your internet connection and try again.',
      };
    }

    return { user: null, error: error.message || 'An unexpected error occurred during signup.' };
  }
};

export const signInUser = async (
  loginData: LoginData,
): Promise<{ user: UserProfile | null; error: string | null }> => {
  try {
    console.log('Starting signin process...', { email: loginData.email });

    // Check if we're in demo mode
    const isDemoMode = isInDemoMode();

    if (isDemoMode) {
      console.log('Demo mode: Checking credentials...');

      // Refresh demo users from localStorage
      demoUsers = getDemoUsers();
      console.log('Available demo users:', Object.keys(demoUsers));

      // Check if user exists and password matches
      const storedUser = demoUsers[loginData.email];

      if (!storedUser) {
        console.log('User not found in demo storage');
        return { user: null, error: 'Invalid email or password' };
      }

      if (storedUser.password !== loginData.password) {
        console.log('Password mismatch');
        return { user: null, error: 'Invalid email or password' };
      }

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      console.log('Demo signin successful!', storedUser.profile);
      return { user: storedUser.profile, error: null };
    }

    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: loginData.email,
      password: loginData.password,
    });

    if (authError) {
      console.error('Auth signin error:', authError);
      return { user: null, error: authError.message };
    }

    if (!authData.user) {
      return { user: null, error: 'Failed to sign in' };
    }

    console.log('Auth signin successful, fetching profile...');

    // Get user profile
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return { user: null, error: 'Failed to fetch user profile' };
    }

    console.log('Profile fetched successfully!', profileData);
    return { user: profileData as UserProfile, error: null };
  } catch (error: any) {
    console.error('Signin error:', error);

    // Check if it's a network error
    if (error.message?.includes('fetch') || error.name === 'NetworkError') {
      return {
        user: null,
        error: 'Network connection failed. Please check your internet connection and try again.',
      };
    }

    return { user: null, error: error.message || 'An unexpected error occurred during signin.' };
  }
};

export const signOutUser = async (): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Signout error:', error);
      return { error: error.message };
    }
    return { error: null };
  } catch (error) {
    console.error('Signout error:', error);
    return { error: 'An unexpected error occurred during signout' };
  }
};

export const getCurrentUser = async (): Promise<{
  user: UserProfile | null;
  error: string | null;
}> => {
  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      return { user: null, error: authError?.message || 'No user found' };
    }

    // Get user profile
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return { user: null, error: 'Failed to fetch user profile' };
    }

    return { user: profileData as UserProfile, error: null };
  } catch (error) {
    console.error('Get current user error:', error);
    return { user: null, error: 'An unexpected error occurred' };
  }
};

// Update user profile (for second step of signup and profile updates)
export const updateUserProfile = async (
  userId: string,
  updateData: Partial<UserProfile>,
): Promise<{ user: UserProfile | null; error: string | null }> => {
  try {
    console.log('Updating user profile...', { userId, updateData });

    // Check if we're in demo mode
    const isDemoMode = isInDemoMode();

    if (isDemoMode) {
      console.log('Running in demo mode - updating localStorage');

      // Find user by email in demo storage
      const userEmail = Object.keys(demoUsers).find(
        (email) =>
          demoUsers[email].profile.id === userId ||
          demoUsers[email].profile.email === updateData.email,
      );

      if (!userEmail) {
        return { user: null, error: 'User not found' };
      }

      // Update the user profile
      const currentProfile = demoUsers[userEmail].profile;
      const updatedProfile = {
        ...currentProfile,
        ...updateData,
        updatedAt: new Date().toISOString(),
      };

      demoUsers[userEmail].profile = updatedProfile;

      // Save to localStorage
      saveDemoUsers(demoUsers);

      console.log('Demo profile updated successfully!', updatedProfile);
      return { user: updatedProfile, error: null };
    }

    // Update profile in Supabase
    const { data: updatedData, error: updateError } = await supabase
      .from('user_profiles')
      .update({
        ...updateData,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Profile update error:', updateError);
      return { user: null, error: updateError.message };
    }

    console.log('Profile updated successfully!', updatedData);
    return { user: updatedData as UserProfile, error: null };
  } catch (error) {
    console.error('Update user profile error:', error);
    return { user: null, error: 'An unexpected error occurred' };
  }
};

// Format date for display (DD-MM-YYYY)
export const formatDateForDisplay = (dateString: string): string => {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

// Convert DD-MM-YYYY to YYYY-MM-DD for database storage
export const formatDateForStorage = (dateString: string): string => {
  const [day, month, year] = dateString.split('-');
  return `${year}-${month}-${day}`;
};

// Validate date format DD-MM-YYYY
export const validateDateFormat = (dateString: string): boolean => {
  const dateRegex = /^(\d{2})-(\d{2})-(\d{4})$/;
  if (!dateRegex.test(dateString)) return false;

  const [, day, month, year] = dateString.match(dateRegex)!;
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

  return (
    date.getDate() === parseInt(day) &&
    date.getMonth() === parseInt(month) - 1 &&
    date.getFullYear() === parseInt(year)
  );
};
