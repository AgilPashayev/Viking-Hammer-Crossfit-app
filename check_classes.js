const { supabase } = require('./supabaseClient');

(async () => {
  try {
    const { data: classes, error } = await supabase
      .from('classes')
      .select(
        `
        id, 
        name, 
        status, 
        schedule_slots(
          id, 
          day_of_week, 
          start_time, 
          end_time, 
          status
        )
      `,
      )
      .order('name');

    if (error) {
      console.error('Error:', error);
      process.exit(1);
    }

    console.log('=== CLASSES WITH SCHEDULE SLOTS ===\n');

    classes.forEach((c) => {
      console.log(`📋 ${c.name} (${c.id})`);
      console.log(`   Status: ${c.status}`);
      console.log(`   Schedule Slots: ${c.schedule_slots.length}`);

      if (c.schedule_slots.length > 0) {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        c.schedule_slots.forEach((s) => {
          console.log(
            `     - ${days[s.day_of_week]} ${s.start_time} - ${s.end_time} [${s.status}]`,
          );
        });
      }
      console.log('');
    });

    console.log('\n=== SUMMARY ===');
    console.log('Total classes:', classes.length);
    console.log('Active classes:', classes.filter((c) => c.status === 'active').length);
    const totalSlots = classes.reduce((sum, c) => sum + c.schedule_slots.length, 0);
    console.log('Total schedule slots:', totalSlots);
  } catch (err) {
    console.error('Unexpected error:', err);
  }

  process.exit(0);
})();
