// services/bookingService.js
// Class booking service with Supabase database operations

const { supabase } = require('../supabaseClient');

/**
 * Book a class slot for a user
 */
async function bookClassSlot(userId, scheduleSlotId, bookingDate) {
  try {
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
        bookings:class_bookings!schedule_slot_id (id, status, booking_date)
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

    if (confirmedBookings >= slot.capacity) {
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
        user:users_profile (name, email)
      `,
      )
      .single();

    if (bookingError) {
      console.error('Error creating booking:', bookingError);
      return { error: 'Failed to create booking', status: 500 };
    }

    return { success: true, data: newBooking };
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
      .select('*, slot:schedule_slots(start_time, day_of_week, booking_date)')
      .eq('id', bookingId)
      .single();

    if (fetchError || !booking) {
      return { error: 'Booking not found', status: 404 };
    }

    // Verify booking belongs to user (or allow admin to cancel)
    if (booking.user_id !== userId) {
      // Check if requester is admin
      const { data: requester } = await supabase
        .from('users_profile')
        .select('role')
        .eq('id', userId)
        .single();

      if (!requester || requester.role !== 'admin') {
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

    return { success: true, message: 'Booking cancelled successfully' };
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
      .order('created_at', { ascending: false });

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
};
