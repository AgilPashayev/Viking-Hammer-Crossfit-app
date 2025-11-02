const { supabase } = require('./supabaseClient');

(async () => {
  try {
    // Get all bookings with class details
    const { data: bookings, error } = await supabase
      .from('class_bookings')
      .select(
        `
        id,
        booking_date,
        status,
        booked_at,
        user:users_profile(id, name, email),
        slot:schedule_slots(
          id,
          day_of_week,
          start_time,
          class:classes(id, name)
        )
      `,
      )
      .order('booking_date', { ascending: false });

    if (error) {
      console.error('Error:', error);
      process.exit(1);
    }

    console.log('=== ALL BOOKINGS ===\n');

    if (bookings.length === 0) {
      console.log('❌ No bookings found in the database.\n');
    } else {
      bookings.forEach((b, idx) => {
        console.log(`${idx + 1}. Booking ID: ${b.id}`);
        console.log(`   User: ${b.user?.name} (${b.user?.email})`);
        console.log(`   Class: ${b.slot?.class?.name}`);
        console.log(`   Date: ${b.booking_date}`);
        console.log(`   Time: ${b.slot?.start_time}`);
        console.log(`   Status: ${b.status}`);
        console.log(`   Booked at: ${b.booked_at}`);
        console.log('');
      });
    }

    console.log('=== SUMMARY ===');
    console.log('Total bookings:', bookings.length);
    console.log('Confirmed:', bookings.filter((b) => b.status === 'confirmed').length);
    console.log('Cancelled:', bookings.filter((b) => b.status === 'cancelled').length);
    console.log('Attended:', bookings.filter((b) => b.status === 'attended').length);
    console.log('No-show:', bookings.filter((b) => b.status === 'no-show').length);
  } catch (err) {
    console.error('Unexpected error:', err);
  }

  process.exit(0);
})();
