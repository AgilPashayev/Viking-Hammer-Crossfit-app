require('dotenv').config({ path: './env/.env.dev' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function checkUser() {
  try {
    const { data, error } = await supabase
      .from('users_profile')
      .select('*')
      .eq('email', 'agil83p@yahoo.com')
      .single();

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log('User data from database:');
    console.log(JSON.stringify(data, null, 2));
    console.log('\n--- Key fields ---');
    console.log('id:', data.id);
    console.log('name:', data.name);
    console.log('email:', data.email);
    console.log('firstName (if exists):', data.firstName);
    console.log('lastName (if exists):', data.lastName);
    console.log('first_name (if exists):', data.first_name);
    console.log('last_name (if exists):', data.last_name);
  } catch (err) {
    console.error('Caught error:', err);
  }
}

checkUser();
