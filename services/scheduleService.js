// services/scheduleService.js
// Schedule management service with Supabase database operations

const { supabase } = require('../supabaseClient');

/**
 * Get all schedule slots with optional filters
 */
async function getAllScheduleSlots(filters = {}) {
  try {
    let query = supabase
      .from('schedule_slots')
      .select(
        `
        *,
        class:classes (
          id,
          name,
          description,
          duration_minutes,
          difficulty,
          max_capacity
        ),
        instructor:instructors (
          id,
          first_name,
          last_name,
          email
        ),
        bookings:class_bookings (
          id,
          user_id,
          status
        )
      `,
      )
      .order('day_of_week')
      .order('start_time');

    if (filters.day_of_week) {
      query = query.eq('day_of_week', filters.day_of_week);
    }
    if (filters.class_id) {
      query = query.eq('class_id', filters.class_id);
    }
    if (filters.instructor_id) {
      query = query.eq('instructor_id', filters.instructor_id);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching schedule slots:', error);
      return { error: 'Failed to fetch schedule slots', status: 500 };
    }

    // Calculate current enrollment for each slot
    const slotsWithEnrollment = data.map((slot) => ({
      ...slot,
      current_enrollment: slot.bookings.filter((b) => b.status === 'confirmed').length,
      available_spots: slot.capacity - slot.bookings.filter((b) => b.status === 'confirmed').length,
    }));

    return { success: true, data: slotsWithEnrollment };
  } catch (error) {
    console.error('Get all schedule slots error:', error);
    return { error: 'Internal server error', status: 500 };
  }
}

/**
 * Get weekly schedule
 */
async function getWeeklySchedule() {
  try {
    const { data, error } = await supabase
      .from('schedule_slots')
      .select(
        `
        *,
        class:classes (
          id,
          name,
          duration_minutes,
          difficulty,
          color
        ),
        instructor:instructors (
          id,
          first_name,
          last_name
        ),
        bookings:class_bookings (
          id,
          status
        )
      `,
      )
      .eq('is_recurring', true)
      .eq('status', 'active')
      .order('day_of_week')
      .order('start_time');

    if (error) {
      console.error('Error fetching weekly schedule:', error);
      return { error: 'Failed to fetch weekly schedule', status: 500 };
    }

    // Group by day of week
    const scheduleByDay = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
      Sunday: [],
    };

    data.forEach((slot) => {
      scheduleByDay[slot.day_of_week].push({
        ...slot,
        current_enrollment: slot.bookings.filter((b) => b.status === 'confirmed').length,
      });
    });

    return { success: true, data: scheduleByDay };
  } catch (error) {
    console.error('Get weekly schedule error:', error);
    return { error: 'Internal server error', status: 500 };
  }
}

/**
 * Get schedule slot by ID
 */
async function getScheduleSlotById(slotId) {
  try {
    const { data, error } = await supabase
      .from('schedule_slots')
      .select(
        `
        *,
        class:classes (*),
        instructor:instructors (*),
        bookings:class_bookings (
          id,
          user_id,
          status,
          booked_at,
          user:users_profile (
            id,
            name,
            email
          )
        )
      `,
      )
      .eq('id', slotId)
      .single();

    if (error || !data) {
      return { error: 'Schedule slot not found', status: 404 };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Get schedule slot by ID error:', error);
    return { error: 'Internal server error', status: 500 };
  }
}

/**
 * Create new schedule slot
 */
async function createScheduleSlot(slotData) {
  try {
    const {
      class_id,
      instructor_id,
      day_of_week,
      start_time,
      end_time,
      capacity,
      is_recurring = true,
      specific_date,
      location_id,
      notes,
    } = slotData;

    // Validate class exists
    const { data: classExists } = await supabase
      .from('classes')
      .select('id')
      .eq('id', class_id)
      .single();

    if (!classExists) {
      return { error: 'Class not found', status: 404 };
    }

    // Check for schedule conflicts
    let conflictQuery = supabase
      .from('schedule_slots')
      .select('id')
      .eq('day_of_week', day_of_week)
      .eq('status', 'active')
      .or(`start_time.lte.${start_time},end_time.gte.${start_time}`)
      .or(`start_time.lte.${end_time},end_time.gte.${end_time}`);

    if (instructor_id) {
      conflictQuery = conflictQuery.eq('instructor_id', instructor_id);
    }

    const { data: conflicts } = await conflictQuery;

    if (conflicts && conflicts.length > 0) {
      return {
        error: 'Schedule conflict detected. Instructor or room is already booked at this time.',
        status: 400,
      };
    }

    const { data: newSlot, error } = await supabase
      .from('schedule_slots')
      .insert({
        class_id,
        instructor_id,
        day_of_week,
        start_time,
        end_time,
        capacity,
        is_recurring,
        specific_date,
        location_id,
        notes,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating schedule slot:', error);
      return { error: 'Failed to create schedule slot', status: 500 };
    }

    return { success: true, data: newSlot };
  } catch (error) {
    console.error('Create schedule slot error:', error);
    return { error: 'Internal server error', status: 500 };
  }
}

/**
 * Update schedule slot
 */
async function updateScheduleSlot(slotId, updates) {
  try {
    const { id, created_at, updated_at, ...allowedUpdates } = updates;

    const { data, error } = await supabase
      .from('schedule_slots')
      .update({ ...allowedUpdates, updated_at: new Date() })
      .eq('id', slotId)
      .select()
      .single();

    if (error) {
      console.error('Error updating schedule slot:', error);
      return { error: 'Failed to update schedule slot', status: 500 };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Update schedule slot error:', error);
    return { error: 'Internal server error', status: 500 };
  }
}

/**
 * Delete schedule slot
 */
async function deleteScheduleSlot(slotId) {
  try {
    // Check if slot has confirmed bookings
    const { data: confirmedBookings } = await supabase
      .from('class_bookings')
      .select('id')
      .eq('schedule_slot_id', slotId)
      .eq('status', 'confirmed')
      .limit(1);

    if (confirmedBookings && confirmedBookings.length > 0) {
      return {
        error: 'Cannot delete schedule slot with confirmed bookings. Cancel bookings first.',
        status: 400,
      };
    }

    const { error } = await supabase.from('schedule_slots').delete().eq('id', slotId);

    if (error) {
      console.error('Error deleting schedule slot:', error);
      return { error: 'Failed to delete schedule slot', status: 500 };
    }

    return { success: true, message: 'Schedule slot deleted successfully' };
  } catch (error) {
    console.error('Delete schedule slot error:', error);
    return { error: 'Internal server error', status: 500 };
  }
}

/**
 * Cancel schedule slot
 */
async function cancelScheduleSlot(slotId, reason) {
  try {
    // Update slot status
    const { error: updateError } = await supabase
      .from('schedule_slots')
      .update({
        status: 'cancelled',
        notes: reason || 'Cancelled',
        updated_at: new Date(),
      })
      .eq('id', slotId);

    if (updateError) {
      return { error: 'Failed to cancel schedule slot', status: 500 };
    }

    // Cancel all confirmed bookings for this slot
    const { error: bookingError } = await supabase
      .from('class_bookings')
      .update({
        status: 'cancelled',
        cancelled_at: new Date(),
      })
      .eq('schedule_slot_id', slotId)
      .eq('status', 'confirmed');

    if (bookingError) {
      console.warn('Warning: Failed to cancel some bookings:', bookingError);
    }

    return { success: true, message: 'Schedule slot and bookings cancelled successfully' };
  } catch (error) {
    console.error('Cancel schedule slot error:', error);
    return { error: 'Internal server error', status: 500 };
  }
}

module.exports = {
  getAllScheduleSlots,
  getWeeklySchedule,
  getScheduleSlotById,
  createScheduleSlot,
  updateScheduleSlot,
  deleteScheduleSlot,
  cancelScheduleSlot,
};
