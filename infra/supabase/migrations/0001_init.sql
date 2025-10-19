-- 0001_init.sql
-- Initial schema for Viking Hammer Gym

-- users_profile
CREATE TABLE IF NOT EXISTS public.users_profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_uid uuid, -- reference to auth.users.id (managed by Supabase Auth)
  role text NOT NULL CHECK (role IN ('admin','reception','member','sparta')),
  name text,
  phone text,
  dob date,
  avatar_url text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- plans
CREATE TABLE IF NOT EXISTS public.plans (
  id bigserial PRIMARY KEY,
  sku text UNIQUE NOT NULL,
  name text NOT NULL,
  price_cents integer NOT NULL DEFAULT 0,
  duration_days integer NOT NULL DEFAULT 30,
  visit_quota integer,
  created_at timestamptz DEFAULT now()
);

-- memberships
CREATE TABLE IF NOT EXISTS public.memberships (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES public.users_profile(id) ON DELETE CASCADE,
  plan_id bigint REFERENCES public.plans(id) ON DELETE SET NULL,
  start_date date,
  end_date date,
  remaining_visits integer,
  status text DEFAULT 'active',
  notes text,
  created_at timestamptz DEFAULT now()
);

-- locations
CREATE TABLE IF NOT EXISTS public.locations (
  id bigserial PRIMARY KEY,
  name text NOT NULL,
  address text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- checkins
CREATE TABLE IF NOT EXISTS public.checkins (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES public.users_profile(id) ON DELETE SET NULL,
  membership_id bigint REFERENCES public.memberships(id) ON DELETE SET NULL,
  scanned_by uuid, -- auth user who scanned (could be reception staff)
  ts timestamptz DEFAULT now(),
  method text, -- QR/BARCODE/FRONTDESK
  location_id bigint REFERENCES public.locations(id),
  notes text
);

-- qr_tokens
CREATE TABLE IF NOT EXISTS public.qr_tokens (
  token text PRIMARY KEY,
  user_id uuid REFERENCES public.users_profile(id) ON DELETE CASCADE,
  membership_id bigint REFERENCES public.memberships(id) ON DELETE CASCADE,
  expires_at timestamptz,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

-- announcements
CREATE TABLE IF NOT EXISTS public.announcements (
  id bigserial PRIMARY KEY,
  title text,
  body text,
  published boolean DEFAULT false,
  published_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- notifications_outbox
CREATE TABLE IF NOT EXISTS public.notifications_outbox (
  id bigserial PRIMARY KEY,
  recipient_user_id uuid REFERENCES public.users_profile(id),
  payload jsonb,
  channel text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id bigserial PRIMARY KEY,
  actor uuid,
  action text,
  target jsonb,
  ts timestamptz DEFAULT now()
);
