/**
 * Class Booking Service
 * Handles all API calls for class bookings
 */

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
  enrolledMembers: string[];
  maxCapacity: number;
  currentEnrollment: number;
  status: 'scheduled' | 'completed' | 'cancelled';
}

export const bookingService = {
  /**
   * Book a class for a member
   */
  async bookClass(classId: string, memberId: string, date: string, time: string): Promise<BookingResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/classes/${classId}/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ memberId, date, time }),
      });
      const data = await response.json();
      return data;
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
   */
  async cancelBooking(classId: string, memberId: string, date: string, time: string): Promise<BookingResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/classes/${classId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ memberId, date, time }),
      });
      const data = await response.json();
      return data;
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
      const response = await fetch(`${API_BASE_URL}/members/${memberId}/bookings`);
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ memberId }),
      });
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
