// services/bookingService.js
// Class booking service with Supabase database operations

const { supabase } = require('../supabaseClient');

/**
 * Book a class slot for a user
 * Accepts EITHER scheduleSlotId OR (classId + dayOfWeek + startTime)
 */
async function bookClassSlot(userId, scheduleSlotIdOrData, bookingDate) {
  try {
    let scheduleSlotId = scheduleSlotIdOrData;

    // If scheduleSlotIdOrData is an object, look up the schedule slot
    if (typeof scheduleSlotIdOrData === 'object') {
      const { classId, dayOfWeek, startTime } = scheduleSlotIdOrData;

      // DEBUG: Log lookup parameters
      console.log('🔍 BOOKING DEBUG - Backend Service (Schedule Slot Lookup):');
      console.log('  classId:', classId);
      console.log(
        '  dayOfWeek:',
        dayOfWeek,
        `(${
          ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek]
        })`,
      );
      console.log('  startTime:', startTime);

      const { data: foundSlot, error: lookupError } = await supabase
        .from('schedule_slots')
        .select('id')
        .eq('class_id', classId)
        .eq('day_of_week', dayOfWeek)
        .eq('start_time', startTime)
        .eq('status', 'active')
        .single();

      if (lookupError || !foundSlot) {
        console.error('❌ BOOKING ERROR: Schedule slot not found');
        console.error(
          '  Searched for: classId=%s, dayOfWeek=%s, startTime=%s',
          classId,
          dayOfWeek,
          startTime,
        );
        console.error('  Lookup error:', lookupError);

        // Query to see what slots actually exist for this class
        const { data: debugSlots } = await supabase
          .from('schedule_slots')
          .select('id, class_id, day_of_week, start_time, end_time, status')
          .eq('class_id', classId);

        console.error('  Available slots for this class:', JSON.stringify(debugSlots, null, 2));

        return { error: 'Schedule slot not found for this class and time', status: 404 };
      }

      scheduleSlotId = foundSlot.id;
      console.log(
        `📍 Found schedule slot ${scheduleSlotId} for class ${classId} on day ${dayOfWeek} at ${startTime}`,
      );
    }

    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('users_profile')
      .select('id, name, status')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return { error: 'User not found', status: 404 };
    }

    if (user.status !== 'active') {
      return { error: 'User account is not active', status: 403 };
    }

    // Check if schedule slot exists and is active
    const { data: slot, error: slotError } = await supabase
      .from('schedule_slots')
      .select(
        `
        *,
        class:classes (id, name, max_capacity),
        bookings:class_bookings!schedule_slot_id (
          id,
          user_id,
          status,
          booking_date,
          booked_at,
          user:users_profile (id, name, email, status)
        )
      `,
      )
      .eq('id', scheduleSlotId)
      .single();

    if (slotError || !slot) {
      return { error: 'Schedule slot not found', status: 404 };
    }

    if (slot.status !== 'active') {
      return { error: 'This class slot is not available for booking', status: 400 };
    }

    // Check if user already booked this slot for this date
    const existingBooking = slot.bookings.find(
      (b) => b.user_id === userId && b.booking_date === bookingDate && b.status === 'confirmed',
    );

    if (existingBooking) {
      return { error: 'You are already booked for this class', status: 400 };
    }

    // Check capacity
    const confirmedBookings = slot.bookings.filter(
      (b) => b.booking_date === bookingDate && b.status === 'confirmed',
    ).length;

    const maxCapacity = slot.capacity || slot.class?.max_capacity || 0;

    if (maxCapacity && confirmedBookings >= maxCapacity) {
      return { error: 'This class is full', status: 400 };
    }

    // Create booking
    const { data: newBooking, error: bookingError } = await supabase
      .from('class_bookings')
      .insert({
        user_id: userId,
        schedule_slot_id: scheduleSlotId,
        booking_date: bookingDate,
        status: 'confirmed',
      })
      .select(
        `
        *,
        slot:schedule_slots (
          *,
          class:classes (name, duration_minutes),
          instructor:instructors (first_name, last_name)
        ),
  user:users_profile (id, name, email)
      `,
      )
      .single();

    if (bookingError) {
      console.error('Error creating booking:', bookingError);
      return { error: 'Failed to create booking', status: 500 };
    }

    const rosterResult = await getScheduleSlotRoster(scheduleSlotId);

    return {
      success: true,
      data: {
        booking: newBooking,
        roster: rosterResult.success ? rosterResult.data : [],
        capacity: maxCapacity,
      },
    };
  } catch (error) {
    console.error('Book class slot error:', error);
    return { error: 'Internal server error', status: 500 };
  }
}

/**
 * Cancel a booking
 */
async function cancelBooking(bookingId, userId) {
  try {
    // Get booking
    const { data: booking, error: fetchError } = await supabase
      .from('class_bookings')
      .select(
        `
        *,
        slot:schedule_slots (
          id,
          start_time,
          day_of_week,
          booking_date,
          class:classes (name, max_capacity)
        )
      `,
      )
      .eq('id', bookingId)
      .single();

    if (fetchError || !booking) {
      return { error: 'Booking not found', status: 404 };
    }

    // Verify booking belongs to user (or allow admin/reception/sparta to cancel)
    if (userId && booking.user_id !== userId) {
      // Check if requester is admin, reception, or sparta
      const { data: requester } = await supabase
        .from('users_profile')
        .select('role')
        .eq('id', userId)
        .single();

      if (!requester || !['admin', 'reception', 'sparta'].includes(requester.role)) {
        return { error: 'Unauthorized to cancel this booking', status: 403 };
      }
    }

    if (booking.status === 'cancelled') {
      return { error: 'Booking is already cancelled', status: 400 };
    }

    // Cancel booking
    const { error: cancelError } = await supabase
      .from('class_bookings')
      .update({
        status: 'cancelled',
        cancelled_at: new Date(),
      })
      .eq('id', bookingId);

    if (cancelError) {
      console.error('Error cancelling booking:', cancelError);
      return { error: 'Failed to cancel booking', status: 500 };
    }

    const rosterResult = booking.schedule_slot_id
      ? await getScheduleSlotRoster(booking.schedule_slot_id)
      : { success: true, data: [] };

    return {
      success: true,
      message: 'Booking cancelled successfully',
      data: {
        bookingId,
        roster: rosterResult.success ? rosterResult.data : [],
        capacity: booking.slot?.class?.max_capacity || null,
      },
    };
  } catch (error) {
    console.error('Cancel booking error:', error);
    return { error: 'Internal server error', status: 500 };
  }
}

/**
 * Get user's bookings
 */
async function getUserBookings(userId, filters = {}) {
  try {
    let query = supabase
      .from('class_bookings')
      .select(
        `
        *,
        slot:schedule_slots (
          *,
          class:classes (
            id,
            name,
            description,
            duration_minutes,
            difficulty
          ),
          instructor:instructors (
            id,
            first_name,
            last_name,
            email
          )
        )
      `,
      )
      .eq('user_id', userId)
      .order('booking_date', { ascending: false })
      .order('booked_at', { ascending: false });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.upcoming) {
      const today = new Date().toISOString().split('T')[0];
      query = query.gte('booking_date', today).eq('status', 'confirmed');
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching user bookings:', error);
      return { error: 'Failed to fetch bookings', status: 500 };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Get user bookings error:', error);
    return { error: 'Internal server error', status: 500 };
  }
}

/**
 * Get all bookings (admin view)
 */
async function getAllBookings(filters = {}) {
  try {
    let query = supabase
      .from('class_bookings')
      .select(
        `
        *,
        user:users_profile (
          id,
          name,
          email,
          phone
        ),
        slot:schedule_slots (
          *,
          class:classes (name, duration_minutes),
          instructor:instructors (first_name, last_name)
        )
      `,
      )
      .order('booking_date', { ascending: false });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.booking_date) {
      query = query.eq('booking_date', filters.booking_date);
    }

    if (filters.schedule_slot_id) {
      query = query.eq('schedule_slot_id', filters.schedule_slot_id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching all bookings:', error);
      return { error: 'Failed to fetch bookings', status: 500 };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Get all bookings error:', error);
    return { error: 'Internal server error', status: 500 };
  }
}

/**
 * Mark booking as attended
 */
async function markAttended(bookingId) {
  try {
    const { data, error } = await supabase
      .from('class_bookings')
      .update({ status: 'attended' })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) {
      console.error('Error marking booking as attended:', error);
      return { error: 'Failed to update booking status', status: 500 };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Mark attended error:', error);
    return { error: 'Internal server error', status: 500 };
  }
}

/**
 * Get roster for a specific schedule slot, including member details
 */
async function getScheduleSlotRoster(scheduleSlotId) {
  try {
    const { data, error } = await supabase
      .from('class_bookings')
      .select(
        `
        id,
        user_id,
        booking_date,
        booked_at,
        status,
        user:users_profile (
          id,
          name,
          email,
          status,
          phone
        )
      `,
      )
      .eq('schedule_slot_id', scheduleSlotId)
      .order('booking_date', { ascending: true })
      .order('booked_at', { ascending: false });

    if (error) {
      console.error('Error fetching schedule slot roster:', error);
      return { error: 'Failed to fetch roster', status: 500 };
    }

    const roster = (data || []).map((booking) => {
      const userRecord = booking.user || {};
      const derivedName = `${userRecord.first_name || ''} ${userRecord.last_name || ''}`.trim();
      const displayName = userRecord.name || derivedName || userRecord.email || 'Unknown Member';

      return {
        bookingId: booking.id,
        memberId: booking.user_id,
        name: displayName,
        email: userRecord.email || '',
        status: booking.status,
        bookingDate: booking.booking_date,
        bookedAt: booking.booked_at,
        phone: userRecord.phone || '',
      };
    });

    return { success: true, data: roster };
  } catch (error) {
    console.error('Get schedule slot roster error:', error);
    return { error: 'Internal server error', status: 500 };
  }
}

/**
 * Mark booking as no-show
 */
async function markNoShow(bookingId) {
  try {
    const { data, error } = await supabase
      .from('class_bookings')
      .update({ status: 'no_show' })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) {
      console.error('Error marking booking as no-show:', error);
      return { error: 'Failed to update booking status', status: 500 };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Mark no-show error:', error);
    return { error: 'Internal server error', status: 500 };
  }
}

module.exports = {
  bookClassSlot,
  cancelBooking,
  getUserBookings,
  getAllBookings,
  markAttended,
  markNoShow,
  getScheduleSlotRoster,
};
