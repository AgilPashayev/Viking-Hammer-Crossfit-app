-- 20251018_classes_instructors_schedule.sql
-- Add classes, instructors, and schedule tables for gym operations

-- instructors table
CREATE TABLE IF NOT EXISTS public.instructors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text UNIQUE,
  phone text,
  specialties text[], -- Array of specializations (e.g., ['Yoga', 'HIIT', 'Strength'])
  certifications text[], -- Array of certifications
  bio text,
  years_experience integer DEFAULT 0,
  avatar_url text,
  availability jsonb, -- Store availability schedule as JSON
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- classes table
CREATE TABLE IF NOT EXISTS public.classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  duration_minutes integer NOT NULL DEFAULT 60,
  difficulty text CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced', 'All Levels')),
  category text, -- e.g., 'Cardio', 'Strength', 'Flexibility', 'Mixed'
  max_capacity integer DEFAULT 20,
  equipment_needed text[], -- Array of equipment required
  image_url text,
  color text, -- For UI display (hex color)
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- class_instructors junction table (many-to-many)
CREATE TABLE IF NOT EXISTS public.class_instructors (
  id bigserial PRIMARY KEY,
  class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE,
  instructor_id uuid REFERENCES public.instructors(id) ON DELETE CASCADE,
  is_primary boolean DEFAULT false, -- Mark primary instructor
  created_at timestamptz DEFAULT now(),
  UNIQUE(class_id, instructor_id)
);

-- schedule_slots table
CREATE TABLE IF NOT EXISTS public.schedule_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  instructor_id uuid REFERENCES public.instructors(id) ON DELETE SET NULL,
  day_of_week text NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
  start_time time NOT NULL,
  end_time time NOT NULL,
  capacity integer NOT NULL DEFAULT 20,
  is_recurring boolean DEFAULT true, -- If true, repeats weekly
  specific_date date, -- For one-time classes
  location_id bigint REFERENCES public.locations(id),
  status text DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'completed')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- class_bookings table
CREATE TABLE IF NOT EXISTS public.class_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users_profile(id) ON DELETE CASCADE NOT NULL,
  schedule_slot_id uuid REFERENCES public.schedule_slots(id) ON DELETE CASCADE NOT NULL,
  booking_date date NOT NULL, -- Actual date of the class
  status text DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'attended', 'no_show')),
  booked_at timestamptz DEFAULT now(),
  cancelled_at timestamptz,
  notes text,
  UNIQUE(user_id, schedule_slot_id, booking_date)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_instructors_status ON public.instructors(status);
CREATE INDEX IF NOT EXISTS idx_classes_status ON public.classes(status);
CREATE INDEX IF NOT EXISTS idx_schedule_slots_class ON public.schedule_slots(class_id);
CREATE INDEX IF NOT EXISTS idx_schedule_slots_instructor ON public.schedule_slots(instructor_id);
CREATE INDEX IF NOT EXISTS idx_schedule_slots_day ON public.schedule_slots(day_of_week);
CREATE INDEX IF NOT EXISTS idx_class_bookings_user ON public.class_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_class_bookings_slot ON public.class_bookings(schedule_slot_id);
CREATE INDEX IF NOT EXISTS idx_class_bookings_date ON public.class_bookings(booking_date);

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_instructors_updated_at BEFORE UPDATE ON public.instructors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON public.classes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedule_slots_updated_at BEFORE UPDATE ON public.schedule_slots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE public.instructors IS 'Gym instructors and their information';
COMMENT ON TABLE public.classes IS 'Class definitions (types of classes offered)';
COMMENT ON TABLE public.class_instructors IS 'Maps which instructors can teach which classes';
COMMENT ON TABLE public.schedule_slots IS 'Scheduled class sessions (weekly recurring or one-time)';
COMMENT ON TABLE public.class_bookings IS 'Member bookings for scheduled classes';
