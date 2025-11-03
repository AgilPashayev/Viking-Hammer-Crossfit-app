/**
 * Update Script: Fix Date Format in Subscription Notes
 * Changes existing subscription notes from "11/2/2025" to "Nov 2, 2025" format
 */

const { supabase } = require('./supabaseClient');

// Format date to "Nov 2, 2025" format
function formatDate(dateStr) {
  const date = new Date(dateStr);
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  return date.toLocaleDateString('en-US', options);
}

async function updateSubscriptionNotes() {
  console.log('🚀 Starting subscription notes format update...\n');

  try {
    // Get all subscriptions with notes containing date pattern like "11/2/2025"
    const { data: subscriptions, error: fetchError } = await supabase
      .from('memberships')
      .select('id, notes, created_at')
      .not('notes', 'is', null);

    if (fetchError) throw fetchError;

    console.log(`📊 Found ${subscriptions.length} subscriptions with notes\n`);

    let updated = 0;
    let skipped = 0;

    for (const sub of subscriptions) {
      // Check if notes contain old date format pattern (e.g., "11/2/2025" or "10/26/2025")
      const oldDatePattern = /(\d{1,2})\/(\d{1,2})\/(\d{4})/g;

      if (oldDatePattern.test(sub.notes)) {
        // Replace old format with new format
        const newNotes = sub.notes.replace(oldDatePattern, (match) => {
          // Parse the old date format
          const [month, day, year] = match.split('/');
          const date = new Date(year, month - 1, day);
          return formatDate(date);
        });

        // Update in database
        const { error: updateError } = await supabase
          .from('memberships')
          .update({ notes: newNotes })
          .eq('id', sub.id);

        if (updateError) {
          console.log(`❌ Error updating subscription ${sub.id}:`, updateError.message);
          skipped++;
        } else {
          console.log(`✅ Updated subscription ${sub.id}`);
          console.log(`   Old: ${sub.notes}`);
          console.log(`   New: ${newNotes}\n`);
          updated++;
        }
      } else {
        console.log(`⏭️  Skipped subscription ${sub.id} - no old date format found`);
        skipped++;
      }
    }

    console.log('\n📊 Update Summary:');
    console.log(`   ✅ Updated: ${updated} subscriptions`);
    console.log(`   ⏭️  Skipped: ${skipped} subscriptions`);
    console.log(`   📝 Total: ${subscriptions.length} subscriptions processed\n`);
    console.log('✅ Update complete!');
  } catch (error) {
    console.error('❌ Update failed:', error.message);
    process.exit(1);
  }
}

updateSubscriptionNotes();
