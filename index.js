const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

async function run() {
  console.log('Starting seed script');

  console.log('Creating bucket "avatars" (if not exists)');
  try {
    await supabase.storage.createBucket('avatars', { public: true });
    console.log('Bucket avatars created or already exists');
  } catch (err) {
    // supabase.storage.createBucket throws if exists in some SDK versions; proceed
    console.log('Bucket create response/error (ignored if already exists):', err?.message || err);
  }

  console.log('Upserting plans...');
  try {
    const { data, error } = await supabase.from('plans').upsert(
      [
        { sku: 'SINGLE', name: 'Single Visit', price_cents: 500, duration_days: 1, visit_quota: 1 },
        {
          sku: 'MONTHLY12',
          name: 'Monthly (12 visits)',
          price_cents: 12000,
          duration_days: 30,
          visit_quota: 12,
        },
        {
          sku: 'UNLIMITED',
          name: 'Unlimited Monthly',
          price_cents: 25000,
          duration_days: 30,
          visit_quota: null,
        },
      ],
      { onConflict: 'sku' },
    );
    if (error) throw error;
    console.log('Plans upserted');
  } catch (err) {
    console.error('Plans upsert failed:', err?.message || err);
  }

  console.log('Upserting location...');
  try {
    const { data, error } = await supabase
      .from('locations')
      .upsert([{ name: 'Main Gym', address: '123 Fitness St' }], { onConflict: 'name' });
    if (error) throw error;
    console.log('Location upserted');
  } catch (err) {
    console.error('Location upsert failed:', err?.message || err);
  }

  console.log('Inserting test user profile (placeholder auth_uid)');
  try {
    const { data, error } = await supabase.from('users_profile').insert([
      {
        auth_uid: null,
        role: 'member',
        name: 'Test Member',
        phone: '+0000000000',
        status: 'active',
      },
    ]);
    if (error) throw error;
    console.log('Test user profile inserted (may be duplicate if run before)');
  } catch (err) {
    console.error('User profile insert failed:', err?.message || err);
  }

  console.log('Seed script finished');
}

run().catch((err) => {
  console.error('Seed script error:', err);
  process.exit(1);
});
