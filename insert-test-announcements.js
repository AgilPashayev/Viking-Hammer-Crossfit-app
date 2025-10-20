/**
 * Insert Test Announcements Directly into Database
 * This bypasses the foreign key constraint by using NULL for created_by
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './env/.env.dev' });

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://yxnewzmfmtwdgahbcbdq.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_KEY not found');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function insertTestAnnouncements() {
  console.log('\n🚀 Inserting Test Announcements...\n');

  const announcements = [
    {
      title: '🏋️ New CrossFit Class Schedule - FROM RECEPTION',
      content:
        'Exciting news! We have added new morning CrossFit classes starting next week. Check the schedule for details. This announcement was created to test the RECEPTION role functionality.',
      target_audience: 'members',
      priority: 'high',
      status: 'published',
      published_at: new Date().toISOString(),
      created_by: null, // NULL to bypass foreign key
    },
    {
      title: '⚔️ Sparta Challenge This Weekend - FROM SPARTA',
      content:
        'Join us for the ultimate Sparta Challenge this Saturday at 9 AM! Test your strength, endurance, and determination. Sign up at the front desk. Limited spots available! This announcement was created to test the SPARTA role functionality.',
      target_audience: 'members',
      priority: 'urgent',
      status: 'published',
      published_at: new Date().toISOString(),
      created_by: null, // NULL to bypass foreign key
    },
    {
      title: '📢 Welcome to Viking Hammer CrossFit!',
      content:
        'This is a general announcement for all members. You should see this in your Member Dashboard and as a popup notification. Click "Enable Push Notifications" to receive future updates on your device!',
      target_audience: 'all',
      priority: 'normal',
      status: 'published',
      published_at: new Date().toISOString(),
      created_by: null,
    },
  ];

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < announcements.length; i++) {
    const ann = announcements[i];
    console.log(
      `📢 [${i + 1}/${announcements.length}] Creating: "${ann.title.substring(0, 50)}..."`,
    );

    const { data, error } = await supabase.from('announcements').insert(ann).select().single();

    if (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      failCount++;
    } else {
      console.log(`   ✅ Success! ID: ${data.id}`);
      successCount++;
    }
  }

  console.log(`\n📊 Results:`);
  console.log(`   ✅ Created: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);

  if (successCount > 0) {
    console.log(`\n✅ Test announcements created successfully!`);
    console.log(`\n📝 Next Steps:`);
    console.log(`   1. Open browser: http://localhost:5173`);
    console.log(`   2. Login as MEMBER user`);
    console.log(`   3. Verify announcement popup modal appears immediately`);
    console.log(`   4. Check announcements in dashboard section`);
    console.log(`   5. Click "Enable Push Notifications"`);
    console.log(`   6. Click "Got it!" to close modal`);
    console.log(`   7. Refresh page - popup should NOT appear again\n`);
  }
}

// Run
insertTestAnnouncements().catch(console.error);
