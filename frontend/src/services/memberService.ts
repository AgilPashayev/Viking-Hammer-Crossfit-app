// frontend/src/services/memberService.ts
// Member management API service - connects MemberManagement component to backend
// WITH JWT AUTHENTICATION

import { getAuthHeaders, handle401Error } from './authService';

const API_BASE_URL = 'http://localhost:4001/api';

export interface Member {
  id: string;
  name: string;
  email: string;
  phone?: string;
  dob?: string;
  role: 'member' | 'instructor' | 'admin';
  status: 'active' | 'inactive';
  avatar_url?: string;
  created_at: string;
  updated_at?: string;
}

export interface CreateMemberData {
  name: string;
  email: string;
  phone?: string;
  dob?: string;
  role?: 'member';
  status?: 'active';
}

export interface UpdateMemberData {
  name?: string;
  email?: string;
  phone?: string;
  dob?: string;
  status?: string;
  avatar_url?: string;
}

/**
 * Get all members
 */
export async function getAllMembers(): Promise<Member[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/members`, {
      headers: getAuthHeaders(),
    });
    
    if (response.status === 401) {
      handle401Error();
      return [];
    }
    
    if (!response.ok) {
      throw new Error(`Failed to fetch members: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching members:', error);
    throw error;
  }
}

/**
 * Get member by ID
 */
export async function getMemberById(id: string): Promise<Member> {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      headers: getAuthHeaders(),
    });
    
    if (response.status === 401) {
      handle401Error();
      throw new Error('Session expired');
    }
    
    if (!response.ok) {
      throw new Error(`Failed to fetch member: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching member:', error);
    throw error;
  }
}

/**
 * Create new member
 */
export async function createMember(memberData: CreateMemberData): Promise<Member> {
  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        ...memberData,
        role: 'member',
        status: 'active'
      }),
    });
    
    if (response.status === 401) {
      handle401Error();
      throw new Error('Session expired');
    }
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to create member: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating member:', error);
    throw error;
  }
}

/**
 * Update member
 */
export async function updateMember(id: string, updates: UpdateMemberData): Promise<Member> {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    
    if (response.status === 401) {
      handle401Error();
      throw new Error('Session expired');
    }
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to update member: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating member:', error);
    throw error;
  }
}

/**
 * Delete member
 */
export async function deleteMember(id: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    
    if (response.status === 401) {
      handle401Error();
      throw new Error('Session expired');
    }
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to delete member: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error deleting member:', error);
    throw error;
  }
}

/**
 * Register member with password (for authentication)
 */
export async function registerMember(memberData: CreateMemberData & { password: string }): Promise<{ user: Member; token: string }> {
  try {
    const { name, email, password, phone } = memberData;
    const [firstName, ...lastNameParts] = name.split(' ');
    const lastName = lastNameParts.join(' ');
    
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        firstName,
        lastName,
        phone,
        role: 'member'
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to register member: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error registering member:', error);
    throw error;
  }
}

export const memberService = {
  getAllMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember,
  registerMember
};

export default memberService;
