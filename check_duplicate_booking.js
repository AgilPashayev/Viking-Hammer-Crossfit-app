require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function checkBooking() {
  const userId = 'fa187bf9-b825-44e8-8e5d-99c0188c5728';
  const slotId = 'd66a522b-77ed-46b1-891d-27e6360761f9';
  const bookingDate = '2025-11-04';

  console.log('🔍 Checking for existing bookings...');
  console.log('  user_id:', userId);
  console.log('  schedule_slot_id:', slotId);
  console.log('  booking_date:', bookingDate);
  console.log('');

  // Check all bookings (any status)
  const { data: allBookings, error: allError } = await supabase
    .from('class_bookings')
    .select('id, status, booking_date, booked_at')
    .eq('user_id', userId)
    .eq('schedule_slot_id', slotId)
    .eq('booking_date', bookingDate);

  if (allError) {
    console.error('❌ Error:', allError);
    return;
  }

  console.log('📋 All bookings for this slot/date:', allBookings.length);
  allBookings.forEach((b) => {
    console.log(`  - ID: ${b.id}, Status: ${b.status}, Booked: ${b.booked_at}`);
  });
  console.log('');

  // Check confirmed bookings only
  const { data: confirmedBookings, error: confirmedError } = await supabase
    .from('class_bookings')
    .select('id, status, booking_date, booked_at')
    .eq('user_id', userId)
    .eq('schedule_slot_id', slotId)
    .eq('booking_date', bookingDate)
    .eq('status', 'confirmed');

  console.log('✅ Confirmed bookings only:', confirmedBookings.length);
  if (confirmedBookings.length > 0) {
    confirmedBookings.forEach((b) => {
      console.log(`  - ID: ${b.id}, Status: ${b.status}, Booked: ${b.booked_at}`);
    });
  }
}

checkBooking()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
