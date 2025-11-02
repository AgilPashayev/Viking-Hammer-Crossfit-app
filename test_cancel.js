const { supabase } = require('./supabaseClient');

async function testCancelFlow() {
  const userId = 'fa187bf9-b825-44e8-8e5d-99c0188c5728'; // Agil
  const bookingId = 'fbccab4e-0420-4869-88bf-0e61f88064bd';

  console.log('🧪 TESTING CANCEL BOOKING FLOW');
  console.log('================================\n');

  // Step 1: Fetch the booking
  console.log('Step 1: Fetching booking from database...');
  const { data: booking, error: fetchError } = await supabase
    .from('class_bookings')
    .select(
      `
      *,
      slot:schedule_slots (
        id,
        start_time,
        day_of_week,
        class:classes (name, max_capacity)
      )
    `,
    )
    .eq('id', bookingId)
    .single();

  if (fetchError || !booking) {
    console.log('❌ Booking not found!');
    console.log('Error:', fetchError);
    return;
  }

  console.log('✅ Found booking:');
  console.log('  ID:', booking.id);
  console.log('  User ID:', booking.user_id);
  console.log('  Date:', booking.booking_date);
  console.log('  Status:', booking.status);
  console.log('  Slot:', booking.slot);

  // Step 2: Verify user owns booking
  if (booking.user_id !== userId) {
    console.log('❌ User does not own this booking!');
    return;
  }
  console.log('✅ User owns this booking');

  // Step 3: Check if already cancelled
  if (booking.status === 'cancelled') {
    console.log('⚠️ Booking is already cancelled');
    return;
  }
  console.log('✅ Booking is active');

  // Step 4: Cancel booking
  console.log('\nStep 4: Cancelling booking...');
  const { error: cancelError } = await supabase
    .from('class_bookings')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
    })
    .eq('id', bookingId);

  if (cancelError) {
    console.log('❌ Failed to cancel booking!');
    console.log('Error:', cancelError);
    return;
  }

  console.log('✅ Booking cancelled successfully!');

  // Step 5: Verify cancellation
  console.log('\nStep 5: Verifying cancellation...');
  const { data: verifyBooking } = await supabase
    .from('class_bookings')
    .select('id, status, cancelled_at')
    .eq('id', bookingId)
    .single();

  console.log('✅ Verified:');
  console.log(JSON.stringify(verifyBooking, null, 2));

  process.exit(0);
}

testCancelFlow().catch((err) => {
  console.error('💥 Error:', err);
  process.exit(1);
});
