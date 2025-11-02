const { supabase } = require('./supabaseClient');

async function testBooking() {
  const userId = 'fa187bf9-b825-44e8-8e5d-99c0188c5728'; // Agil
  const classId = '43281b95-69f0-4a0f-9f38-6c3937273ac4'; // Wrestling
  const dayOfWeek = 2; // Tuesday
  const startTime = '09:00:00';
  const bookingDate = '2025-11-04'; // Next Tuesday

  console.log('🧪 TESTING BOOKING FLOW');
  console.log('========================\n');

  // Step 1: Find schedule slot
  console.log('Step 1: Looking for schedule slot...');
  console.log('  classId:', classId);
  console.log('  dayOfWeek:', dayOfWeek);
  console.log('  startTime:', startTime);

  const { data: slot, error: slotError } = await supabase
    .from('schedule_slots')
    .select('id, class_id, day_of_week, start_time, status')
    .eq('class_id', classId)
    .eq('day_of_week', dayOfWeek)
    .eq('start_time', startTime)
    .eq('status', 'active')
    .single();

  if (slotError || !slot) {
    console.log('❌ Schedule slot not found!');
    console.log('Error:', slotError);

    // Debug: Show all slots for this class
    const { data: allSlots } = await supabase
      .from('schedule_slots')
      .select('*')
      .eq('class_id', classId);
    console.log('Available slots:', JSON.stringify(allSlots, null, 2));
    return;
  }

  console.log('✅ Found schedule slot:', slot.id);

  // Step 2: Check if booking already exists
  console.log('\nStep 2: Checking for existing booking...');
  const { data: existingBooking } = await supabase
    .from('class_bookings')
    .select('id, status')
    .eq('user_id', userId)
    .eq('schedule_slot_id', slot.id)
    .eq('booking_date', bookingDate)
    .maybeSingle();

  if (existingBooking) {
    console.log('⚠️ Booking already exists:', existingBooking);
    return;
  }
  console.log('✅ No existing booking found');

  // Step 3: Create booking
  console.log('\nStep 3: Creating booking...');
  const { data: newBooking, error: bookingError } = await supabase
    .from('class_bookings')
    .insert({
      user_id: userId,
      schedule_slot_id: slot.id,
      booking_date: bookingDate,
      status: 'confirmed',
    })
    .select()
    .single();

  if (bookingError) {
    console.log('❌ Failed to create booking!');
    console.log('Error:', bookingError);
    return;
  }

  console.log('✅ Booking created successfully!');
  console.log('Booking ID:', newBooking.id);
  console.log('Full booking:', JSON.stringify(newBooking, null, 2));

  // Step 4: Verify booking
  console.log('\nStep 4: Verifying booking...');
  const { data: verifyBooking } = await supabase
    .from('class_bookings')
    .select(
      `
      id,
      booking_date,
      status,
      user:users_profile(name, email),
      slot:schedule_slots(
        id,
        day_of_week,
        start_time,
        class:classes(name)
      )
    `,
    )
    .eq('id', newBooking.id)
    .single();

  console.log('✅ Verified booking:');
  console.log(JSON.stringify(verifyBooking, null, 2));

  process.exit(0);
}

testBooking().catch((err) => {
  console.error('💥 Error:', err);
  process.exit(1);
});
