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
  
  
  
  const authResponse = await supabase.auth.admin.createUser({
    email: 'admin@onboardflow.com',
    password: 'admin123',
    email_confirm: true,
  });

  if (authResponse.error) {
    if (authResponse.error.message.includes('already been registered')) {
        
    } else {
        console.error('Error creating auth user:', authResponse.error.message);
        return;
    }
  } else {
    
  }

  
  
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
       
       
       
       
    }
  }
}

main().catch(console.error);
