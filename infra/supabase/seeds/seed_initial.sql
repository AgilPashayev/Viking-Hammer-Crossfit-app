-- seed_initial.sql
-- Insert basic plans, a test location and placeholder profiles (note: auth users must exist separately)

INSERT INTO public.plans (sku, name, price_cents, duration_days, visit_quota)
VALUES
('SINGLE','Single Visit',500,1,1),
('MONTHLY12','Monthly (12 visits)',12000,30,12),
('UNLIMITED','Unlimited Monthly',25000,30,null)
ON CONFLICT (sku) DO NOTHING;

INSERT INTO public.locations (name, address)
VALUES ('Main Gym','123 Fitness St') ON CONFLICT DO NOTHING;

-- Example user profile (replace auth_uid after creating auth user)
INSERT INTO public.users_profile (auth_uid, role, name, phone, status)
VALUES (null, 'member', 'Test Member', '+0000000000', 'active')
RETURNING id;
