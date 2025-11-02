require('dotenv').config({ path: 'env/.env.dev' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  console.log('\n🔍 CHECKING ALL CLASSES IN DATABASE...\n');

  const { data: classes, error } = await supabase
    .from('classes')
    .select('id, name, status')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }

  console.log(`📊 Total classes found: ${classes.length}\n`);
  classes.forEach((cls, i) => {
    console.log(`${i + 1}. ${cls.name} (${cls.status}) - ID: ${cls.id}`);
  });

  // Check schedule slots for each class
  console.log('\n🗓️ CHECKING SCHEDULE SLOTS...\n');
  for (const cls of classes) {
    const { data: slots } = await supabase
      .from('schedule_slots')
      .select('*')
      .eq('class_id', cls.id);

    console.log(`${cls.name}: ${slots?.length || 0} schedule slots`);
    if (slots && slots.length > 0) {
      slots.forEach((slot) => {
        console.log(`  - Day ${slot.day_of_week}: ${slot.start_time} - ${slot.end_time}`);
      });
    }
  }

  process.exit(0);
})();
