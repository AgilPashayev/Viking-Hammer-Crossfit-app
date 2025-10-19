-- 20251019_invitations.sql
-- Add invitations table for member invitation system

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
  sent_by uuid, -- reception/admin who sent the invitation
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON public.invitations(status);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_expires_at ON public.invitations(expires_at);

-- Add trigger for updated_at
CREATE TRIGGER update_invitations_updated_at BEFORE UPDATE ON public.invitations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE public.invitations IS 'Member invitation tracking with multi-channel delivery support';
