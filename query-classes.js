// Query classes from Supabase database
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xokfciglqzdbimkxrgaj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhva2ZjaWdscXpkYmlta3hyZ2FqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk0NDQwNjMsImV4cCI6MjA0NTAyMDA2M30.7XnsBUxtG52R9DQMq-vIhHBLWqSV9sdLzNb-6Ck_mHY'
);

async function queryClasses() {
  console.log('\n=== QUERYING SUPABASE DATABASE ===\n');
  
  const { data, error } = await supabase
    .from('classes')
    .select('id, name, description, duration_minutes, max_capacity, status, category, difficulty, created_at')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
  
  console.log(`✅ Total Classes Found: ${data.length}\n`);
  console.log('='.repeat(80));
  console.log('\n');
  
  if (data.length === 0) {
    console.log('⚠️  NO CLASSES IN DATABASE\n');
  } else {
    data.forEach((cls, index) => {
      console.log(`${index + 1}. ${cls.name}`);
      console.log(`   ID:          ${cls.id}`);
      console.log(`   Status:      ${cls.status}`);
      console.log(`   Category:    ${cls.category || 'N/A'}`);
      console.log(`   Difficulty:  ${cls.difficulty || 'N/A'}`);
      console.log(`   Duration:    ${cls.duration_minutes} minutes`);
      console.log(`   Capacity:    ${cls.max_capacity} people`);
      console.log(`   Created:     ${new Date(cls.created_at).toLocaleString()}`);
      if (cls.description) {
        const desc = cls.description.length > 70 
          ? cls.description.substring(0, 70) + '...' 
          : cls.description;
        console.log(`   Description: ${desc}`);
      }
      console.log('');
    });
  }
  
  console.log('='.repeat(80));
  console.log('\n');
}

queryClasses().catch(err => {
  console.error('❌ FATAL ERROR:', err.message);
  process.exit(1);
});
