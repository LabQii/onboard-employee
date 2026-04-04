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
  console.log('--- Wiping Existing Auth Users ---');
  
  // Ambil semua pengguna
  const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
  
  if (usersError) {
    console.error('Error fetching users:', usersError.message);
    return;
  }

  const users = usersData.users;
  for (const user of users) {
    console.log(`Menghapus pengguna: ${user.email} (${user.id})`);
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
    if (deleteError) {
       console.error(`Gagal menghapus pengguna ${user.email}:`, deleteError.message);
    }
  }

  console.log('--- Seeding New Role Accounts ---');
  
  // 1. Karyawan Baru (.gmail.com)
  console.log('Membuat Karyawan Baru: karyawan@gmail.com');
  const empRes = await supabase.auth.admin.createUser({
    email: 'karyawan@gmail.com',
    password: 'password123',
    email_confirm: true,
  });

  if (empRes.error) {
     console.error('Error Employee:', empRes.error.message);
  } else if (empRes.data.user) {
     const { error: profileError } = await supabase.from('profiles').upsert({
        id: empRes.data.user.id,
         full_name: 'Alex Rivera',
         role: 'Karyawan Baru',
         department: 'Product',
         is_admin: false,
     });
     if (profileError) console.error('Profile Error Employee:', profileError.message);
  }

  // 2. Admission HR Admin (.gmail.com)
  console.log('Membuat Admin HR: admin@gmail.com');
  const admRes = await supabase.auth.admin.createUser({
    email: 'admin@gmail.com',
    password: 'password123',
    email_confirm: true,
  });

  if (admRes.error) {
     console.error('Error Admin:', admRes.error.message);
  } else if (admRes.data.user) {
     const { error: profileError } = await supabase.from('profiles').upsert({
         id: admRes.data.user.id,
         full_name: 'Admin HR',
         role: 'Admission',
         department: 'HRD',
         is_admin: true,
     });
     if (profileError) console.error('Profile Error Admin:', profileError.message);
  }

  console.log('--- SEEDING COMPLETE ---');
  console.log('Kredensial Anda (Password sama): password123');
  console.log('1. Admin   : admin@gmail.com');
  console.log('2. Karyawan: karyawan@gmail.com');
}

main().catch(console.error);
