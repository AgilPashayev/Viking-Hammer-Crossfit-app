// deploy-invitations-table.js
// Deploy invitations table to Supabase using RPC function approach

const { supabase } = require('./supabaseClient');

async function deployMigrations() {
  console.log('🚀 Starting database migration deployment...\n');

  try {
    // Step 1: Create invitations table
    console.log('📦 Step 1: Creating invitations table...');

    const createInvitationsSQL = `
CREATE TABLE IF NOT EXISTS public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users_profile(id) ON DELETE CASCADE,
  invitation_token text UNIQUE NOT NULL,
  email text NOT NULL,
  phone text,
  delivery_method text CHECK (delivery_method IN ('email', 'sms', 'whatsapp', 'in-app')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'accepted', 'expired', 'failed')),
  invitation_message text,
  expires_at timestamptz NOT NULL,
  sent_at timestamptz,
  accepted_at timestamptz,
  sent_by text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON public.invitations(status);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_expires_at ON public.invitations(expires_at);
    `.trim();

    // Try using rpc - if it fails, provide manual SQL
    let invitationsCreated = false;
    try {
      // Check if table already exists
      const { data: checkData, error: checkError } = await supabase
        .from('invitations')
        .select('id')
        .limit(1);

      if (!checkError || checkError.code !== 'PGRST204') {
        console.log('✅ invitations table already exists');
        invitationsCreated = true;
      }
    } catch (e) {
      // Table doesn't exist, we need to create it
    }

    if (!invitationsCreated) {
      console.log(
        '\n❌ Cannot create table automatically - Supabase JS client requires service role key for DDL',
      );
      console.log('\n📋 MANUAL SQL REQUIRED - Run in Supabase SQL Editor:');
      console.log('═══════════════════════════════════════════════════════════\n');
      console.log(createInvitationsSQL);
      console.log('\n═══════════════════════════════════════════════════════════\n');
    }

    // Step 2: Extend users_profile table
    console.log('\n📦 Step 2: Checking users_profile columns...');

    const extendUsersProfileSQL = `
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users_profile' AND column_name = 'membership_type'
  ) THEN
    ALTER TABLE users_profile ADD COLUMN membership_type text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users_profile' AND column_name = 'company'
  ) THEN
    ALTER TABLE users_profile ADD COLUMN company text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users_profile' AND column_name = 'join_date'
  ) THEN
    ALTER TABLE users_profile ADD COLUMN join_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users_profile' AND column_name = 'last_check_in'
  ) THEN
    ALTER TABLE users_profile ADD COLUMN last_check_in timestamptz;
  END IF;
END $$;
    `.trim();

    console.log('\n📋 MANUAL SQL REQUIRED - Run in Supabase SQL Editor:');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log(extendUsersProfileSQL);
    console.log('\n═══════════════════════════════════════════════════════════\n');

    console.log('\n✅ SQL statements prepared.');
    console.log('\n🎯 NEXT STEPS:');
    console.log(
      '1. Go to: https://nqseztalzjcfucfeljkf.supabase.co/project/nqseztalzjcfucfeljkf/sql',
    );
    console.log('2. Copy the SQL statements above');
    console.log('3. Paste and run them in the SQL Editor');
    console.log('4. Come back and run: node verify-migration.js');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  }
}

deployMigrations();
