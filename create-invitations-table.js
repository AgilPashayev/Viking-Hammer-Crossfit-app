// Quick migration runner - creates invitations table
const { supabase } = require('./supabaseClient');

async function createInvitationsTable() {
  console.log('🔄 Creating invitations table...\n');

  const sql = `
-- invitations table
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON public.invitations(status);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_expires_at ON public.invitations(expires_at);
  `;

  // Note: Supabase client doesn't support raw SQL execution directly
  // This table must be created via Supabase SQL Editor or CLI
  console.log('⚠️  Supabase client library does not support direct SQL execution.');
  console.log('📋 Please run the following SQL in your Supabase SQL Editor:\n');
  console.log(sql);
  console.log('\nOr use Supabase CLI: npx supabase db push');
}

createInvitationsTable();
