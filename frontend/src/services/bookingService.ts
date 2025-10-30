/**
 * Class Booking Service
 * Handles all API calls for class bookings
 * WITH JWT AUTHENTICATION
 */

import { getAuthHeaders, handle401Error } from './authService';
import type { ScheduleEnrollment } from './classManagementService';

const API_BASE_URL = 'http://localhost:4001/api';

export interface BookingResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface MemberBooking {
  id: string;
  classId: string;
  className: string;
  classDescription: string;
  instructorId: string;
  instructorName: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  date: string;
  enrolledMembers?: ScheduleEnrollment[];
  maxCapacity: number;
  currentEnrollment: number;
  status: 'scheduled' | 'completed' | 'cancelled';
}

export const bookingService = {
  /**
   * Book a class for a member
   * Backend expects: POST /api/bookings with { userId, classId, dayOfWeek, startTime, bookingDate }
   */
  async bookClass(classId: string, memberId: string, bookingDate: string, startTime: string, dayOfWeek?: number): Promise<BookingResponse> {
    try {
      // Calculate dayOfWeek if not provided
      const calculatedDayOfWeek = dayOfWeek ?? new Date(bookingDate).getDay();
      
      // DEBUG: Log booking parameters
      console.log('🔍 BOOKING DEBUG - Frontend Service:');
      console.log('  classId:', classId);
      console.log('  bookingDate:', bookingDate);
      console.log('  startTime:', startTime);
      console.log('  calculatedDayOfWeek:', calculatedDayOfWeek, `(${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][calculatedDayOfWeek]})`);
      console.log('  Date object:', new Date(bookingDate));
      
      const response = await fetch(`${API_BASE_URL}/bookings`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ 
          userId: memberId, 
          classId,
          dayOfWeek: calculatedDayOfWeek,
          startTime,
          bookingDate 
        }),
      });
      
      if (response.status === 401) {
        handle401Error();
        return {
          success: false,
          message: 'Session expired. Please login again.',
        };
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          message: errorData.error || 'Failed to book class',
        };
      }
      
      const data = await response.json();
      return {
        success: true,
        message: 'Class booked successfully!',
        data: data.data
      };
    } catch (error) {
      console.error('Error booking class:', error);
      return {
        success: false,
        message: 'Failed to book class. Please try again.',
      };
    }
  },

  /**
   * Cancel a class booking
   * Backend expects: POST /api/bookings/:id/cancel with { userId }
   */
  async cancelBooking(bookingId: string, memberId: string, date?: string, time?: string): Promise<BookingResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ userId: memberId }),
      });
      
      if (response.status === 401) {
        handle401Error();
        return {
          success: false,
          message: 'Session expired. Please login again.',
        };
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          message: errorData.error || 'Failed to cancel booking',
        };
      }
      
      const data = await response.json();
      return {
        success: true,
        message: 'Booking cancelled successfully!',
        data
      };
    } catch (error) {
      console.error('Error cancelling booking:', error);
      return {
        success: false,
        message: 'Failed to cancel booking. Please try again.',
      };
    }
  },

  /**
   * Get all bookings for a member
   */
  async getMemberBookings(memberId: string): Promise<MemberBooking[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/members/${memberId}/bookings`, {
        headers: getAuthHeaders(),
      });
      
      if (response.status === 401) {
        handle401Error();
        return [];
      }
      
      const data = await response.json();
      return data.success ? data.data : [];
    } catch (error) {
      console.error('Error fetching member bookings:', error);
      return [];
    }
  },

  /**
   * Enroll in a specific schedule slot (alternative method)
   */
  async enrollInSlot(slotId: string, memberId: string): Promise<BookingResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/schedule/${slotId}/enroll`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ memberId }),
      });
      
      if (response.status === 401) {
        handle401Error();
        return {
          success: false,
          message: 'Session expired. Please login again.',
        };
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error enrolling in slot:', error);
      return {
        success: false,
        message: 'Failed to enroll. Please try again.',
      };
    }
  },
};
