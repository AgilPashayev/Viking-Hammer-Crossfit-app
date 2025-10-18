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
  avatar_url?: string;
  profilePhoto?: string;
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
    console.log('🔍 getDemoUsers: Fetching from localStorage...');
    const stored = localStorage.getItem('viking_demo_users');
    console.log('🔍 getDemoUsers: Raw stored value:', stored ? `EXISTS (${stored.length} chars)` : 'NULL');
    
    if (!stored) {
      console.log('🔍 getDemoUsers: No stored data, returning empty object');
      return {};
    }
    
    const parsed = JSON.parse(stored);
    console.log('🔍 getDemoUsers: Parsed successfully');
    console.log('🔍 getDemoUsers: Found', Object.keys(parsed).length, 'users');
    console.log('🔍 getDemoUsers: User emails:', Object.keys(parsed));
    return parsed;
  } catch (error) {
    console.error('🔍 getDemoUsers: ERROR parsing localStorage:', error);
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
      // Use September 15, 2025 as default registration date
      const registrationDate = new Date('2025-09-15T00:00:00Z').toISOString();
      
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
        joinDate: registrationDate,
        isActive: true,
        createdAt: registrationDate,
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
    // Use September 15, 2025 as default registration date
    const registrationDate = new Date('2025-09-15T00:00:00Z').toISOString();
    
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
      joinDate: registrationDate,
      isActive: true,
      createdAt: registrationDate,
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
    console.log('🔐 === SIGNIN PROCESS STARTED ===');
    console.log('📧 Email:', loginData.email);
    console.log('🔑 Password length:', loginData.password?.length);
    console.log('🔑 Password value:', loginData.password);

    // Check if we're in demo mode
    const isDemoMode = isInDemoMode();
    console.log('🏠 Demo mode active:', isDemoMode);

    if (isDemoMode) {
      console.log('✅ Demo mode: Checking credentials...');

      // Refresh demo users from localStorage
      demoUsers = getDemoUsers();
      console.log('📦 Retrieved demo users from localStorage');
      console.log('👥 Available demo users:', Object.keys(demoUsers));
      console.log('📊 Total users count:', Object.keys(demoUsers).length);

      // Log the full localStorage content for debugging
      const rawStorage = localStorage.getItem('viking_demo_users');
      console.log('🗄️ Raw localStorage value:', rawStorage ? 'EXISTS' : 'NULL');
      if (rawStorage) {
        console.log('📏 Raw storage length:', rawStorage.length);
      }

      // Check if user exists and password matches
      const storedUser = demoUsers[loginData.email];
      console.log('🔍 Looking for user:', loginData.email);
      console.log('🔍 User found in storage:', storedUser ? 'YES' : 'NO');

      if (!storedUser) {
        console.error('❌ User not found in demo storage');
        console.log('📋 Available emails:', Object.keys(demoUsers));
        return { user: null, error: 'Invalid email or password' };
      }

      console.log('✅ User found! Checking password...');
      console.log('🔐 Stored password:', storedUser.password);
      console.log('🔐 Provided password:', loginData.password);
      console.log('🔐 Passwords match:', storedUser.password === loginData.password);
      console.log('🔐 Password comparison (strict):', storedUser.password === loginData.password);
      console.log('🔐 Password comparison (loose):', storedUser.password == loginData.password);
      console.log('🔐 Stored password type:', typeof storedUser.password);
      console.log('🔐 Provided password type:', typeof loginData.password);

      if (storedUser.password !== loginData.password) {
        console.error('❌ Password mismatch!');
        console.log('Expected:', `"${storedUser.password}"`);
        console.log('Received:', `"${loginData.password}"`);
        return { user: null, error: 'Invalid email or password' };
      }

      // Simulate network delay
      console.log('⏳ Simulating network delay...');
      await new Promise((resolve) => setTimeout(resolve, 800));

      console.log('🎉 Demo signin successful!');
      console.log('👤 Profile data:', storedUser.profile);
      console.log('🔐 === SIGNIN PROCESS COMPLETE ===');
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
        avatar_url: updateData.profilePhoto || updateData.avatar_url || currentProfile.avatar_url,
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
        avatar_url: updateData.profilePhoto || updateData.avatar_url,
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

// ==================== MEMBERSHIP PLANS API ====================

export interface MembershipPlanDB {
  id: number;
  sku: string;
  name: string;
  price_cents: number;
  duration_days: number;
  visit_quota?: number;
  created_at: string;
  // Extended fields (stored as JSON or additional columns if schema is extended)
  metadata?: {
    type?: string;
    currency?: string;
    description?: string;
    features?: string[];
    limitations?: string[];
    isActive?: boolean;
    isPopular?: boolean;
    discountPercentage?: number;
  };
}

export interface MembershipPlanInput {
  name: string;
  type: string;
  price: number;
  currency: string;
  description: string;
  features: string[];
  limitations: string[];
  duration: string;
  entryLimit?: number;
  isActive: boolean;
  isPopular: boolean;
  discountPercentage: number;
}

// Fetch all membership plans from Supabase
export const fetchMembershipPlans = async (): Promise<{ plans: MembershipPlanDB[]; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch membership plans:', error);
      return { plans: [], error: error.message };
    }

    return { plans: data || [], error: null };
  } catch (error) {
    console.error('Unexpected error fetching plans:', error);
    return { plans: [], error: 'An unexpected error occurred' };
  }
};

// Create a new membership plan
export const createMembershipPlan = async (planData: MembershipPlanInput): Promise<{ plan: MembershipPlanDB | null; error: string | null }> => {
  try {
    // Generate SKU from plan name
    const sku = `plan_${planData.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
    
    // Convert price to cents
    const priceCents = Math.round(planData.price * 100);
    
    // Parse duration (e.g., "30 days" -> 30)
    const durationDays = parseInt(planData.duration.split(' ')[0]) || 30;

    const dbPlan = {
      sku,
      name: planData.name,
      price_cents: priceCents,
      duration_days: durationDays,
      visit_quota: planData.entryLimit || null,
      metadata: {
        type: planData.type,
        currency: planData.currency,
        description: planData.description,
        features: planData.features,
        limitations: planData.limitations,
        isActive: planData.isActive,
        isPopular: planData.isPopular,
        discountPercentage: planData.discountPercentage,
      },
    };

    const { data, error } = await supabase
      .from('plans')
      .insert([dbPlan])
      .select()
      .single();

    if (error) {
      console.error('Failed to create membership plan:', error);
      return { plan: null, error: error.message };
    }

    return { plan: data, error: null };
  } catch (error) {
    console.error('Unexpected error creating plan:', error);
    return { plan: null, error: 'An unexpected error occurred' };
  }
};

// Update an existing membership plan
export const updateMembershipPlan = async (planId: number, planData: Partial<MembershipPlanInput>): Promise<{ plan: MembershipPlanDB | null; error: string | null }> => {
  try {
    const updates: any = {};

    if (planData.name) updates.name = planData.name;
    if (planData.price !== undefined) updates.price_cents = Math.round(planData.price * 100);
    if (planData.duration) updates.duration_days = parseInt(planData.duration.split(' ')[0]) || 30;
    if (planData.entryLimit !== undefined) updates.visit_quota = planData.entryLimit || null;

    // Update metadata
    const metadata: any = {};
    if (planData.type) metadata.type = planData.type;
    if (planData.currency) metadata.currency = planData.currency;
    if (planData.description !== undefined) metadata.description = planData.description;
    if (planData.features) metadata.features = planData.features;
    if (planData.limitations) metadata.limitations = planData.limitations;
    if (planData.isActive !== undefined) metadata.isActive = planData.isActive;
    if (planData.isPopular !== undefined) metadata.isPopular = planData.isPopular;
    if (planData.discountPercentage !== undefined) metadata.discountPercentage = planData.discountPercentage;

    if (Object.keys(metadata).length > 0) {
      // Fetch current metadata and merge
      const { data: currentPlan } = await supabase
        .from('plans')
        .select('metadata')
        .eq('id', planId)
        .single();

      updates.metadata = {
        ...(currentPlan?.metadata || {}),
        ...metadata,
      };
    }

    const { data, error } = await supabase
      .from('plans')
      .update(updates)
      .eq('id', planId)
      .select()
      .single();

    if (error) {
      console.error('Failed to update membership plan:', error);
      return { plan: null, error: error.message };
    }

    return { plan: data, error: null };
  } catch (error) {
    console.error('Unexpected error updating plan:', error);
    return { plan: null, error: 'An unexpected error occurred' };
  }
};

// Delete a membership plan
export const deleteMembershipPlan = async (planId: number): Promise<{ success: boolean; error: string | null }> => {
  try {
    const { error } = await supabase
      .from('plans')
      .delete()
      .eq('id', planId);

    if (error) {
      console.error('Failed to delete membership plan:', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Unexpected error deleting plan:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
};

// Upload profile photo to Supabase Storage
export const uploadProfilePhoto = async (
  userId: string,
  file: File
): Promise<{ url: string | null; error: string | null }> => {
  try {
    console.log('📸 Uploading profile photo for user:', userId);

    // Check if we're in demo mode
    if (isInDemoMode()) {
      console.log('Demo mode: Simulating photo upload...');
      
      // Convert file to base64 for demo mode
      const reader = new FileReader();
      return new Promise((resolve) => {
        reader.onload = (e) => {
          const base64 = e.target?.result as string;
          
          // Store in localStorage with user data
          const demoUsers = getDemoUsers();
          const userEmail = Object.keys(demoUsers).find(
            email => demoUsers[email].profile.id === userId
          );
          
          if (userEmail && demoUsers[userEmail]) {
            demoUsers[userEmail].profile = {
              ...demoUsers[userEmail].profile,
              avatar_url: base64
            };
            saveDemoUsers(demoUsers);
            console.log('✅ Demo mode: Photo saved to localStorage');
          }
          
          resolve({ url: base64, error: null });
        };
        reader.onerror = () => {
          resolve({ url: null, error: 'Failed to read file' });
        };
        reader.readAsDataURL(file);
      });
    }

    // Create unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('user-avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return { url: null, error: uploadError.message };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('user-avatars')
      .getPublicUrl(filePath);

    // Update user profile with avatar URL
    const { error: updateError } = await supabase
      .from('users_profile')
      .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (updateError) {
      console.error('Profile update error:', updateError);
      return { url: null, error: updateError.message };
    }

    console.log('✅ Profile photo uploaded successfully:', publicUrl);
    return { url: publicUrl, error: null };
  } catch (error: any) {
    console.error('Unexpected error uploading photo:', error);
    return { url: null, error: error.message || 'Failed to upload photo' };
  }
};

// Get user profile by ID
export const getUserProfile = async (
  userId: string
): Promise<{ user: UserProfile | null; error: string | null }> => {
  try {
    console.log('👤 Fetching user profile:', userId);

    // Check if we're in demo mode
    if (isInDemoMode()) {
      const demoUsers = getDemoUsers();
      const userEmail = Object.keys(demoUsers).find(
        email => demoUsers[email].profile.id === userId
      );
      
      if (userEmail && demoUsers[userEmail]) {
        return { user: demoUsers[userEmail].profile, error: null };
      }
      
      return { user: null, error: 'User not found' };
    }

    const { data, error } = await supabase
      .from('users_profile')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Fetch profile error:', error);
      return { user: null, error: error.message };
    }

    return { user: data as UserProfile, error: null };
  } catch (error: any) {
    console.error('Unexpected error fetching profile:', error);
    return { user: null, error: error.message || 'Failed to fetch profile' };
  }
};


