/**
 * Class Data Transformer
 * Converts backend API response (snake_case) to frontend interface (camelCase)
 */

import type { GymClass, Instructor, ScheduleSlot, ScheduleEnrollment } from './classManagementService';

/**
 * Transform class data from API format to frontend format
 */
export function transformClassFromAPI(apiClass: any): GymClass {
  // Extract instructor IDs from the nested structure
  const extractInstructorIds = (classInstructors: any[]): string[] => {
    if (!classInstructors || !Array.isArray(classInstructors)) return [];
    return classInstructors
      .map((ci: any) => {
        const instructor = ci.instructor;
        if (!instructor) return null;
        
        // Return instructor ID
        return instructor.id || ci.instructor_id;
      })
      .filter(Boolean);
  };

  // Extract instructor names from the nested structure
  const extractInstructorNames = (classInstructors: any[]): string[] => {
    if (!classInstructors || !Array.isArray(classInstructors)) return [];
    return classInstructors
      .map((ci: any) => {
        const instructor = ci.instructor;
        if (!instructor) return null;
        
        // Return instructor name
        if (instructor.first_name && instructor.last_name) {
          return `${instructor.first_name} ${instructor.last_name}`;
        }
        if (instructor.name) {
          return instructor.name;
        }
        return null;
      })
      .filter(Boolean);
  };

  // Map day_of_week string to number for class schedules
  const mapDayOfWeek = (day: string | number | undefined): number => {
    if (typeof day === 'number') return day;
    if (!day) return 1;

    const dayMap: Record<string, number> = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    };

    const normalized = String(day).trim().toLowerCase();
    return dayMap[normalized] ?? 1;
  };

  // Transform schedule slots if they exist
  const normalizeRoster = (bookings: any[] | undefined): ScheduleEnrollment[] => {
    if (!bookings || !Array.isArray(bookings)) return [];

    return bookings
      .filter(Boolean)
      .map((booking: any) => {
        const user = booking.user || {};
        const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
        const resolvedName = user.name || fullName || user.email || 'Unknown Member';

        return {
          bookingId: booking.id,
          memberId: booking.user_id,
          name: resolvedName,
          email: user.email || '',
          phone: user.phone || '',
          status: booking.status || 'confirmed',
          bookingDate: booking.booking_date || '',
          bookedAt: booking.booked_at || null,
        } as ScheduleEnrollment;
      });
  };

  const transformSchedule = (scheduleSlots: any[] | undefined) => {
    if (!scheduleSlots || !Array.isArray(scheduleSlots)) return [];
    
    return scheduleSlots.map((slot: any) => ({
      dayOfWeek: mapDayOfWeek(slot.day_of_week ?? slot.dayOfWeek),
      startTime: slot.start_time || slot.startTime || '09:00',
      endTime: slot.end_time || slot.endTime || '10:00',
      enrolledMembers: normalizeRoster(
        slot.class_bookings || slot.enrolled_members || slot.enrolledMembers,
      ),
    }));
  };

  // Calculate current enrollment from bookings
  const calculateEnrollment = (bookings: any[] | undefined): number => {
    if (!bookings || !Array.isArray(bookings)) return 0;
    // Count only confirmed bookings
    return bookings.filter((b: any) => b.status === 'confirmed' || b.status === 'attended').length;
  };

  return {
    id: apiClass.id,
    name: apiClass.name || '',
    description: apiClass.description || '',
    duration: apiClass.duration_minutes || apiClass.duration || 60,
    maxCapacity: apiClass.max_capacity || apiClass.maxCapacity || 20,
    currentEnrollment: calculateEnrollment(apiClass.class_bookings),
    instructors: extractInstructorIds(apiClass.class_instructors),
    instructorNames: extractInstructorNames(apiClass.class_instructors),
    schedule: transformSchedule(apiClass.schedule_slots),
    equipment: apiClass.equipment_needed || apiClass.equipment || [],
    difficulty: apiClass.difficulty || 'Beginner',
    category: apiClass.category || 'Mixed',
    price: apiClass.price || 0,
    status: apiClass.status || 'active',
  };
}

/**
 * Transform instructor data from API format to frontend format
 */
export function transformInstructorFromAPI(apiInstructor: any): Instructor {
  // Combine first and last name
  const getName = () => {
    if (apiInstructor.name) return apiInstructor.name;
    const firstName = apiInstructor.first_name || apiInstructor.firstName || '';
    const lastName = apiInstructor.last_name || apiInstructor.lastName || '';
    return `${firstName} ${lastName}`.trim() || 'Unknown';
  };

  // Ensure availability is an array
  const getAvailability = () => {
    const avail = apiInstructor.availability;
    if (!avail) return [];
    if (Array.isArray(avail)) return avail;
    if (typeof avail === 'string') {
      try {
        const parsed = JSON.parse(avail);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  // Ensure specialization is an array
  const getSpecialization = () => {
    const spec = apiInstructor.specialties || apiInstructor.specialization;
    if (!spec) return [];
    if (Array.isArray(spec)) return spec;
    if (typeof spec === 'string') {
      try {
        const parsed = JSON.parse(spec);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  // Ensure certifications is an array
  const getCertifications = () => {
    const certs = apiInstructor.certifications;
    if (!certs) return [];
    if (Array.isArray(certs)) return certs;
    if (typeof certs === 'string') {
      try {
        const parsed = JSON.parse(certs);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  return {
    id: apiInstructor.id,
    name: getName(),
    email: apiInstructor.email || '',
    specialization: getSpecialization(),
    availability: getAvailability(),
    rating: apiInstructor.rating || 0,
    experience: apiInstructor.years_experience || apiInstructor.experience || 0,
    phone: apiInstructor.phone || '',
    status: apiInstructor.status || 'active',
    certifications: getCertifications(),
    bio: apiInstructor.bio || '',
    avatarUrl: apiInstructor.avatar_url || apiInstructor.avatarUrl || '',
  };
}

/**
 * Transform schedule slot data from API format to frontend format
 */
export function transformScheduleFromAPI(apiSchedule: any): ScheduleSlot {
  // Map day_of_week string to number
  const mapDayOfWeek = (day: string | number): number => {
    if (typeof day === 'number') return day;
    
    const dayMap: Record<string, number> = {
      'Sunday': 0,
      'Monday': 1,
      'Tuesday': 2,
      'Wednesday': 3,
      'Thursday': 4,
      'Friday': 5,
      'Saturday': 6,
    };
    
    // Case-insensitive lookup
    const normalizedDay = day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();
    return dayMap[normalizedDay] || 1;
  };

  const normalizeRoster = (bookings: any[] | undefined): ScheduleEnrollment[] => {
    if (!bookings || !Array.isArray(bookings)) return [];

    return bookings
      .filter(Boolean)
      .map((booking: any) => {
        const user = booking.user || {};
        const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
        const resolvedName = user.name || fullName || user.email || 'Unknown Member';

        return {
          bookingId: booking.id,
          memberId: booking.user_id,
          name: resolvedName,
          email: user.email || '',
          phone: user.phone || '',
          status: booking.status || 'confirmed',
          bookingDate: booking.booking_date || '',
          bookedAt: booking.booked_at || null,
        } as ScheduleEnrollment;
      });
  };

  return {
    id: apiSchedule.id,
    classId: apiSchedule.class_id || apiSchedule.classId || '',
    instructorId: apiSchedule.instructor_id || apiSchedule.instructorId || '',
    dayOfWeek: mapDayOfWeek(apiSchedule.day_of_week || apiSchedule.dayOfWeek),
    startTime: apiSchedule.start_time || apiSchedule.startTime || '09:00',
    endTime: apiSchedule.end_time || apiSchedule.endTime || '10:00',
    date: apiSchedule.specific_date || apiSchedule.date || new Date().toISOString().split('T')[0],
    enrolledMembers: normalizeRoster(
      apiSchedule.class_bookings || apiSchedule.enrolled_members || apiSchedule.enrolledMembers,
    ),
    status: apiSchedule.status || 'scheduled',
  };
}

/**
 * Transform class data from frontend format to API format (for POST/PUT)
 */
export function transformClassToAPI(gymClass: Partial<GymClass>): any {
  // Map day number to day name for API
  const mapDayOfWeek = (day: number): string => {
    const dayMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return dayMap[day] || 'Monday';
  };

  // Transform schedule array to API format
  const schedule_slots = (gymClass.schedule || []).map(slot => ({
    day_of_week: mapDayOfWeek(slot.dayOfWeek),  // Convert number to day name
    start_time: slot.startTime,
    end_time: slot.endTime,
    status: 'active'
  }));

  return {
    name: gymClass.name,
    description: gymClass.description,
    duration_minutes: gymClass.duration,
    max_capacity: gymClass.maxCapacity,
    equipment_needed: gymClass.equipment || [],
    difficulty: gymClass.difficulty,
    category: gymClass.category,
    price: gymClass.price || 0,
    status: gymClass.status || 'active',
    instructorIds: gymClass.instructors || [],
    schedule_slots: schedule_slots,  // Add schedule data
  };
}

/**
 * Transform instructor data from frontend format to API format (for POST/PUT)
 */
export function transformInstructorToAPI(instructor: Partial<Instructor>): any {
  const nameParts = (instructor.name || '').split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  return {
    first_name: firstName,
    last_name: lastName,
    email: instructor.email,
    phone: instructor.phone,
    specialties: instructor.specialization || [],
    certifications: instructor.certifications || [],
    bio: instructor.bio || '',
    years_experience: instructor.experience || 0,
    avatar_url: instructor.avatarUrl || null,
    availability: instructor.availability || [],
    status: instructor.status || 'active',
  };
}

/**
 * Transform schedule slot from frontend format to API format (for POST/PUT)
 */
export function transformScheduleToAPI(slot: Partial<ScheduleSlot>): any {
  // Map day number to day name
  const mapDayOfWeek = (day: number | undefined): string => {
    const dayMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return dayMap[day ?? 1];  // Use nullish coalescing to handle 0 (Sunday)
  };

  return {
    class_id: slot.classId,
    instructor_id: slot.instructorId,
    day_of_week: mapDayOfWeek(slot.dayOfWeek),
    start_time: slot.startTime,
    end_time: slot.endTime,
    specific_date: slot.date,
    status: slot.status || 'active',  // Use 'active' instead of 'scheduled'
  };
}
