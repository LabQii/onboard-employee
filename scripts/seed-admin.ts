import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(URL, SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function main() {
  console.log('Seeding HRD Admin user...');
  
  // Minimal 6 character password for Supabase Auth default configuration.
  const authResponse = await supabase.auth.admin.createUser({
    email: 'admin@onboardflow.com',
    password: 'admin123',
    email_confirm: true,
  });

  if (authResponse.error) {
    if (authResponse.error.message.includes('already been registered')) {
        console.log('Admin user already exists in auth.');
    } else {
        console.error('Error creating auth user:', authResponse.error.message);
        return;
    }
  } else {
    console.log('Admin user created successfully in Auth layer.');
  }

  // Next, map them to the profile schema and enforce HRD rules mapping `is_admin = true`.
  // Fetch the user ID by email to ensure we have the correct identifier.
  const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
  const adminUser = usersData?.users.find(u => u.email === 'admin@onboardflow.com');

  if (adminUser) {
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
         id: adminUser.id,
         full_name: 'HR Admin',
         role: 'HRD',
         department: 'Human Resources',
         is_admin: true,
      });

    if (profileError) {
      console.error('Error escalating privileges to profile:', profileError.message);
    } else {
       console.log('Successfully bound profiles.is_admin = true. You can now login.');
       console.log('\n--- CREDENTIALS ---');
       console.log('Email:', 'admin@onboardflow.com');
       console.log('Password:', 'admin123');
    }
  }
}

main().catch(console.error);
