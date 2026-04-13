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

  
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single();

  if (existing) {
    
    await supabase.from('profiles').update({ password_hash: passwordHash, is_admin: true }).eq('id', existing.id);
    
  } else {
    
    await supabase.from('profiles').insert({
      id: randomUUID(),
      email: email,
      full_name: 'Super Admin',
      password_hash: passwordHash,
      is_admin: true,
    });
    
  }

  console.log(`
  Silakan login dengan:
  Email    : ${email}
  Password : ${password}
  `);
}

addAdmin().catch(console.error);
