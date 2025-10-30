/**
 * Class Management Service
 * Handles all API calls for classes, instructors, and schedules
 * WITH JWT AUTHENTICATION
 */

import {
  transformClassFromAPI,
  transformClassToAPI,
  transformInstructorFromAPI,
  transformInstructorToAPI,
  transformScheduleFromAPI,
  transformScheduleToAPI,
} from './classTransformer';
import { getAuthHeaders, handle401Error } from './authService';

const API_BASE_URL = 'http://localhost:4001/api';

// ========== INTERFACES ==========

export interface ScheduleEnrollment {
  bookingId: string;
  memberId: string;
  name: string;
  email: string;
  phone?: string;
  status: 'confirmed' | 'cancelled' | 'attended' | 'no_show';
  bookingDate: string;
  bookedAt?: string | null;
}

export interface GymClass {
  id: string;
  name: string;
  description: string;
  duration: number;
  maxCapacity: number;
  currentEnrollment: number;
  instructors: string[];
  instructorNames?: string[]; // Optional field for instructor names
  schedule: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    enrolledMembers?: ScheduleEnrollment[];
  }[];
  equipment: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  category: 'Cardio' | 'Strength' | 'Flexibility' | 'Mixed' | 'Specialized';
  price: number;
  status: 'active' | 'inactive' | 'full';
}

export interface Instructor {
  id: string;
  name: string;
  email: string;
  specialization: string[];
  availability: string[];
  rating: number;
  experience: number;
  phone: string;
  status: 'active' | 'inactive' | 'busy';
  certifications?: string[];
  bio?: string;
  avatarUrl?: string;
}

export interface ScheduleSlot {
  id: string;
  classId: string;
  instructorId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  date: string;
  enrolledMembers: ScheduleEnrollment[];
  status: 'scheduled' | 'completed' | 'cancelled';
}

// ========== CLASSES API ==========

export const classService = {
  // Get all classes
  async getAll(): Promise<GymClass[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/classes`, {
        headers: getAuthHeaders(),
      });
      
      // Handle 401 Unauthorized
      if (response.status === 401) {
        handle401Error();
        return [];
      }
      
      const result = await response.json();
      
      // Handle both response formats for backward compatibility
      const data = result.success ? result.data : (Array.isArray(result) ? result : []);
      
      // Transform each class from API format to frontend format
      return data.map(transformClassFromAPI);
    } catch (error) {
      console.error('Error fetching classes:', error);
      return [];
    }
  },

  // Get single class
  async getById(id: string): Promise<GymClass | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/classes/${id}`, {
        headers: getAuthHeaders(),
      });
      
      if (response.status === 401) {
        handle401Error();
        return null;
      }
      
      const result = await response.json();
      const data = result.success ? result.data : result;
      return data ? transformClassFromAPI(data) : null;
    } catch (error) {
      console.error('Error fetching class:', error);
      return null;
    }
  },

  // Create new class
  async create(gymClass: Partial<GymClass>): Promise<{ success: boolean; data?: GymClass; message?: string }> {
    try {
      const apiData = transformClassToAPI(gymClass);
      const response = await fetch(`${API_BASE_URL}/classes`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(apiData),
      });
      
      if (response.status === 401) {
        handle401Error();
        return { success: false, message: 'Session expired. Please login again.' };
      }
      
      const result = await response.json();
      
      if (result.success || result.id) {
        const classData = result.data || result;
        return {
          success: true,
          data: transformClassFromAPI(classData),
        };
      }
      
      return { success: false, message: result.message || 'Failed to create class' };
    } catch (error) {
      console.error('Error creating class:', error);
      return { success: false, message: 'Failed to create class' };
    }
  },

  // Update class
  async update(id: string, gymClass: Partial<GymClass>): Promise<{ success: boolean; data?: GymClass; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/classes/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(gymClass),
      });
      
      if (response.status === 401) {
        handle401Error();
        return { success: false, message: 'Session expired. Please login again.' };
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating class:', error);
      return { success: false, message: 'Failed to update class' };
    }
  },

  // Delete class
  async delete(id: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/classes/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      
      if (response.status === 401) {
        handle401Error();
        return { success: false, message: 'Session expired. Please login again.' };
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error deleting class:', error);
      return { success: false, message: 'Failed to delete class' };
    }
  },
};

// ========== INSTRUCTORS API ==========

export const instructorService = {
  // Get all instructors
  async getAll(): Promise<Instructor[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/instructors`, {
        headers: getAuthHeaders(),
      });
      
      if (response.status === 401) {
        handle401Error();
        return [];
      }
      
      const result = await response.json();
      const data = result.success ? result.data : (Array.isArray(result) ? result : []);
      return data.map(transformInstructorFromAPI);
    } catch (error) {
      console.error('Error fetching instructors:', error);
      return [];
    }
  },

  // Get single instructor
  async getById(id: string): Promise<Instructor | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/instructors/${id}`, {
        headers: getAuthHeaders(),
      });
      
      if (response.status === 401) {
        handle401Error();
        return null;
      }
      
      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('Error fetching instructor:', error);
      return null;
    }
  },

  // Create new instructor
  async create(instructor: Partial<Instructor>): Promise<{ success: boolean; data?: Instructor; message?: string }> {
    try {
      const apiData = transformInstructorToAPI(instructor);
      const response = await fetch(`${API_BASE_URL}/instructors`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(apiData),
      });
      
      if (response.status === 401) {
        handle401Error();
        return { success: false, message: 'Session expired. Please login again.' };
      }
      
      const result = await response.json();
      
      if (result.success || result.id) {
        const instructorData = result.data || result;
        return {
          success: true,
          data: transformInstructorFromAPI(instructorData),
        };
      }
      
      return { success: false, message: result.message || 'Failed to create instructor' };
    } catch (error) {
      console.error('Error creating instructor:', error);
      return { success: false, message: 'Failed to create instructor' };
    }
  },

  // Update instructor
  async update(id: string, instructor: Partial<Instructor>): Promise<{ success: boolean; data?: Instructor; message?: string }> {
    try {
      const apiData = transformInstructorToAPI(instructor);
      const response = await fetch(`${API_BASE_URL}/instructors/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(apiData),
      });
      
      if (response.status === 401) {
        handle401Error();
        return { success: false, message: 'Session expired. Please login again.' };
      }
      
      const result = await response.json();
      
      if (result.success || result.id) {
        const instructorData = result.data || result;
        return {
          success: true,
          data: transformInstructorFromAPI(instructorData),
        };
      }
      
      return { success: false, message: result.message || 'Failed to update instructor' };
    } catch (error) {
      console.error('Error updating instructor:', error);
      return { success: false, message: 'Failed to update instructor' };
    }
  },

  // Delete instructor
  async delete(id: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/instructors/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      
      if (response.status === 401) {
        handle401Error();
        return { success: false, message: 'Session expired. Please login again.' };
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error deleting instructor:', error);
      return { success: false, message: 'Failed to delete instructor' };
    }
  },
};

// ========== SCHEDULE API ==========

export const scheduleService = {
  // Get all schedule slots
  async getAll(filters?: { date?: string; classId?: string; instructorId?: string }): Promise<ScheduleSlot[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.date) params.append('date', filters.date);
      if (filters?.classId) params.append('classId', filters.classId);
      if (filters?.instructorId) params.append('instructorId', filters.instructorId);
      
      const response = await fetch(`${API_BASE_URL}/schedule?${params.toString()}`, {
        headers: getAuthHeaders(),
      });
      
      if (response.status === 401) {
        handle401Error();
        return [];
      }
      
      const result = await response.json();
      const data = result.success ? result.data : (Array.isArray(result) ? result : []);
      return data.map(transformScheduleFromAPI);
    } catch (error) {
      console.error('Error fetching schedule:', error);
      return [];
    }
  },

  // Get weekly schedule
  async getWeekly(startDate?: string): Promise<Record<number, ScheduleSlot[]>> {
    try {
      const params = startDate ? `?startDate=${startDate}` : '';
      const response = await fetch(`${API_BASE_URL}/schedule/weekly${params}`, {
        headers: getAuthHeaders(),
      });
      
      if (response.status === 401) {
        handle401Error();
        return {};
      }
      
      const data = await response.json();
      return data.success ? data.data : {};
    } catch (error) {
      console.error('Error fetching weekly schedule:', error);
      return {};
    }
  },

  // Create schedule slot
  async create(slot: Partial<ScheduleSlot>): Promise<{ success: boolean; data?: ScheduleSlot; message?: string }> {
    try {
      const apiData = transformScheduleToAPI(slot);
      const response = await fetch(`${API_BASE_URL}/schedule`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(apiData),
      });
      
      if (response.status === 401) {
        handle401Error();
        return { success: false, message: 'Session expired. Please login again.' };
      }
      
      const result = await response.json();
      
      if (result.success || result.id) {
        const scheduleData = result.data || result;
        return {
          success: true,
          data: transformScheduleFromAPI(scheduleData),
        };
      }
      
      return { success: false, message: result.message || 'Failed to create schedule slot' };
    } catch (error) {
      console.error('Error creating schedule slot:', error);
      return { success: false, message: 'Failed to create schedule slot' };
    }
  },

  // Update schedule slot
  async update(id: string, slot: Partial<ScheduleSlot>): Promise<{ success: boolean; data?: ScheduleSlot; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/schedule/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(slot),
      });
      
      if (response.status === 401) {
        handle401Error();
        return { success: false, message: 'Session expired. Please login again.' };
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating schedule slot:', error);
      return { success: false, message: 'Failed to update schedule slot' };
    }
  },

  // Delete schedule slot
  async delete(id: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/schedule/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      
      if (response.status === 401) {
        handle401Error();
        return { success: false, message: 'Session expired. Please login again.' };
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error deleting schedule slot:', error);
      return { success: false, message: 'Failed to delete schedule slot' };
    }
  },

  // Enroll member in schedule slot
  async enrollMember(slotId: string, memberId: string): Promise<{ success: boolean; data?: ScheduleSlot; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/schedule/${slotId}/enroll`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ memberId }),
      });
      
      if (response.status === 401) {
        handle401Error();
        return { success: false, message: 'Session expired. Please login again.' };
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error enrolling member:', error);
      return { success: false, message: 'Failed to enroll member' };
    }
  },

  // Get enrolled members for a schedule slot
  async getRoster(slotId: string): Promise<ScheduleEnrollment[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/schedule/${slotId}/bookings`, {
        headers: getAuthHeaders(),
      });

      if (response.status === 401) {
        handle401Error();
        return [];
      }

      const data = await response.json();
      return data.success ? data.data : [];
    } catch (error) {
      console.error('Error fetching roster:', error);
      return [];
    }
  },
};

// Export all services
export default {
  classes: classService,
  instructors: instructorService,
  schedule: scheduleService,
};
