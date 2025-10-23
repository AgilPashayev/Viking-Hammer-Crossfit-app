// frontend/src/services/authService.ts
// Centralized authentication service for backend JWT authentication

const API_BASE_URL = 'http://localhost:4001/api';

interface SignInResponse {
  user: any;
  token: string;
}

interface AuthResponse {
  success: boolean;
  data?: SignInResponse;
  error?: string;
}

/**
 * Sign in user with backend JWT authentication
 */
export async function signIn(email: string, password: string): Promise<AuthResponse> {
  try {
    console.log('🔐 [AuthService] Signing in:', email);

    const response = await fetch(`${API_BASE_URL}/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    console.log('📡 [AuthService] Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ [AuthService] Sign in failed:', errorData);
      return {
        success: false,
        error: errorData.error || 'Sign in failed',
      };
    }

    const data = await response.json();
    console.log('✅ [AuthService] Sign in successful');

    // Store token and user data
    if (data.token) {
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userData', JSON.stringify(data.user));
      console.log('💾 [AuthService] Token and user data stored in localStorage');
    }

    return {
      success: true,
      data: {
        user: data.user,
        token: data.token,
      },
    };
  } catch (error) {
    console.error('❌ [AuthService] Network error during sign in:', error);
    return {
      success: false,
      error: 'Network error. Please check your connection.',
    };
  }
}

/**
 * Sign up new user with backend JWT authentication
 */
export async function signUp(userData: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: string;
}): Promise<AuthResponse> {
  try {
    console.log('📝 [AuthService] Signing up:', userData.email);

    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    console.log('📡 [AuthService] Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ [AuthService] Sign up failed:', errorData);
      return {
        success: false,
        error: errorData.error || 'Sign up failed',
      };
    }

    const data = await response.json();
    console.log('✅ [AuthService] Sign up successful');

    // Store token and user data
    if (data.token) {
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userData', JSON.stringify(data.user));
      console.log('💾 [AuthService] Token and user data stored in localStorage');
    }

    return {
      success: true,
      data: {
        user: data.user,
        token: data.token,
      },
    };
  } catch (error) {
    console.error('❌ [AuthService] Network error during sign up:', error);
    return {
      success: false,
      error: 'Network error. Please check your connection.',
    };
  }
}

/**
 * Get JWT token from localStorage
 */
export function getToken(): string | null {
  return localStorage.getItem('authToken');
}

/**
 * Get authentication headers for API requests
 */
export function getAuthHeaders(): HeadersInit {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Get current user data from localStorage
 */
export function getCurrentUser(): any | null {
  try {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('❌ [AuthService] Error parsing user data:', error);
    return null;
  }
}

/**
 * Check if user is authenticated (has valid token)
 */
export function isAuthenticated(): boolean {
  const token = getToken();
  if (!token) {
    return false;
  }

  try {
    // Decode JWT token (format: header.payload.signature)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiry = payload.exp * 1000; // Convert to milliseconds

    // Check if token is expired
    if (Date.now() >= expiry) {
      console.warn('⚠️ [AuthService] Token expired');
      logout(); // Clear expired token
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ [AuthService] Error decoding token:', error);
    logout(); // Clear invalid token
    return false;
  }
}

/**
 * Logout user (clear token and user data)
 */
export function logout(): void {
  console.log('👋 [AuthService] Logging out');
  localStorage.removeItem('authToken');
  localStorage.removeItem('userData');
  // Also clear any legacy storage keys
  localStorage.removeItem('viking_current_user');
  localStorage.removeItem('viking_remembered_user');
}

/**
 * Handle 401 Unauthorized responses
 * Redirects to login page and clears auth data
 */
export function handle401Error(): void {
  console.warn('⚠️ [AuthService] 401 Unauthorized - Session expired');
  logout();
  window.location.href = '/'; // Redirect to login page
}

/**
 * Get user role from stored user data
 */
export function getUserRole(): string | null {
  const user = getCurrentUser();
  return user?.role || null;
}

/**
 * Check if current user has admin role (reception or sparta)
 */
export function isAdmin(): boolean {
  const role = getUserRole();
  return role === 'sparta' || role === 'reception';
}

/**
 * Check if current user has sparta role
 */
export function isSparta(): boolean {
  const role = getUserRole();
  return role === 'sparta';
}

export default {
  signIn,
  signUp,
  getToken,
  getAuthHeaders,
  getCurrentUser,
  isAuthenticated,
  logout,
  handle401Error,
  getUserRole,
  isAdmin,
  isSparta,
};
