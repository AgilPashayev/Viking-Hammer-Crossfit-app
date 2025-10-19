// apply-sparta-migration.js
// Applies sparta role to database using Supabase client

const { supabase } = require('./supabaseClient');

async function applySpartaMigration() {
  console.log('🔨 Applying Sparta Role Migration...\n');

  try {
    // Execute the SQL migration using Supabase RPC or raw SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: `
        -- Drop existing constraint
        ALTER TABLE public.users_profile 
          DROP CONSTRAINT IF EXISTS users_profile_role_check;

        -- Add new constraint with sparta role
        ALTER TABLE public.users_profile 
          ADD CONSTRAINT users_profile_role_check 
          CHECK (role IN ('admin','reception','member','sparta'));
      `,
    });

    if (error) {
      console.error('❌ Migration failed:', error.message);
      console.log(
        '\n📝 Note: If RPC function does not exist, manually run this SQL in Supabase dashboard:',
      );
      console.log(`
ALTER TABLE public.users_profile 
  DROP CONSTRAINT IF EXISTS users_profile_role_check;

ALTER TABLE public.users_profile 
  ADD CONSTRAINT users_profile_role_check 
  CHECK (role IN ('admin','reception','member','sparta'));
      `);
      return false;
    }

    console.log('✅ Migration applied successfully!');
    console.log('✅ Sparta role is now available in the database');
    return true;
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    return false;
  }
}

// Run migration
applySpartaMigration()
  .then((success) => {
    if (success) {
      console.log('\n🎉 Sparta role migration complete!');
      process.exit(0);
    } else {
      console.log('\n⚠️  Migration had issues. Check console output.');
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
  });
