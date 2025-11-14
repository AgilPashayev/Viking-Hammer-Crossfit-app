require('dotenv').config({ path: './env/.env.dev', override: true, debug: true });
console.log('==== ENVIRONMENT VARIABLES ====');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_KEY:', process.env.SUPABASE_KEY);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
