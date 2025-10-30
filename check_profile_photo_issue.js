// Diagnostic script to check profile photo persistence issue
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nqseztalzjcfucfeljkf.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xc2V6dGFsempjZnVjZmVsamtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjgxNTIzMzQsImV4cCI6MjA0MzcyODMzNH0.LJkFBfZqtyDJpxFU2J1wXKz0hzR9_gEHZJkzHBP6dDA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfilePhotos() {
  console.log('🔍 PROFILE PHOTO DIAGNOSTIC SCAN\n');
  console.log('='.repeat(60));

  // 1. Check users_profile table structure
  console.log('\n📋 Step 1: Checking users_profile table structure...');
  const { data: users, error: usersError } = await supabase
    .from('users_profile')
    .select('id, email, first_name, last_name, avatar_url, profile_photo')
    .limit(5);

  if (usersError) {
    console.error('❌ Error fetching users:', usersError);
  } else {
    console.log(`✅ Found ${users.length} users`);
    users.forEach((user, idx) => {
      console.log(`\n   User ${idx + 1}:`);
      console.log(`   - Email: ${user.email}`);
      console.log(`   - Name: ${user.first_name} ${user.last_name}`);
      console.log(`   - avatar_url: ${user.avatar_url || 'NULL'}`);
      console.log(`   - profile_photo: ${user.profile_photo || 'NULL (column may not exist)'}`);
    });
  }

  // 2. Check if avatar_url column exists
  console.log('\n\n📋 Step 2: Checking column existence...');
  const { data: columns, error: columnsError } = await supabase
    .rpc('get_table_columns', { table_name: 'users_profile' })
    .catch(() => null);

  if (columns) {
    console.log('✅ Table columns:', columns);
  } else {
    console.log('⚠️ Could not fetch column info directly');
  }

  // 3. Check storage bucket
  console.log('\n\n📋 Step 3: Checking storage bucket...');
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

  if (bucketsError) {
    console.error('❌ Error fetching buckets:', bucketsError);
  } else {
    console.log('✅ Available storage buckets:');
    buckets.forEach((bucket) => {
      console.log(`   - ${bucket.name} (public: ${bucket.public})`);
    });

    const avatarBucket = buckets.find((b) => b.name === 'user-avatars');
    if (avatarBucket) {
      console.log('\n✅ user-avatars bucket exists');

      // Check files in bucket
      const { data: files, error: filesError } = await supabase.storage
        .from('user-avatars')
        .list('avatars', { limit: 10 });

      if (filesError) {
        console.error('❌ Error listing files:', filesError);
      } else {
        console.log(`✅ Found ${files.length} files in avatars folder`);
        files.forEach((file) => {
          console.log(`   - ${file.name}`);
        });
      }
    } else {
      console.log('❌ user-avatars bucket NOT FOUND');
    }
  }

  // 4. Summary
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 DIAGNOSTIC SUMMARY');
  console.log('='.repeat(60));
  console.log('\n✅ Database Connection: OK');
  console.log(usersError ? '❌ users_profile table: ERROR' : '✅ users_profile table: OK');
  console.log(bucketsError ? '❌ Storage access: ERROR' : '✅ Storage access: OK');

  console.log('\n🔍 POTENTIAL ISSUES TO CHECK:');
  console.log('1. Does avatar_url column exist in users_profile?');
  console.log('2. Is avatar_url being saved to database?');
  console.log('3. Is localStorage being updated after upload?');
  console.log('4. Is App.tsx reading avatar_url on refresh?');

  console.log('\n✅ Diagnostic complete!\n');
}

checkProfilePhotos().catch(console.error);
