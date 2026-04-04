import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function addAdmin() {
  const email = 'admin@admin.com';
  const password = 'password';
  const passwordHash = await bcrypt.hash(password, 12);

  // Check if admin@admin.com already exists
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single();

  if (existing) {
    // Update existing
    await supabase.from('profiles').update({ password_hash: passwordHash, is_admin: true }).eq('id', existing.id);
    console.log('✅ Admin sudah di-update!');
  } else {
    // Insert new
    await supabase.from('profiles').insert({
      id: randomUUID(),
      email: email,
      full_name: 'Super Admin',
      password_hash: passwordHash,
      is_admin: true,
    });
    console.log('✅ Admin baru berhasil dibuat!');
  }

  console.log(`
  Silakan login dengan:
  Email    : ${email}
  Password : ${password}
  `);
}

addAdmin().catch(console.error);
