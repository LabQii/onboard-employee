import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function runMigration() {
  

  
  const migrationSQL = `
    ALTER TABLE profiles
      ADD COLUMN IF NOT EXISTS email TEXT,
      ADD COLUMN IF NOT EXISTS password_hash TEXT,
      ADD COLUMN IF NOT EXISTS invite_token TEXT,
      ADD COLUMN IF NOT EXISTS invite_expires_at TIMESTAMPTZ;

    -- Tambah unique constraint bila belum ada
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'profiles_email_unique'
      ) THEN
        ALTER TABLE profiles ADD CONSTRAINT profiles_email_unique UNIQUE (email);
      END IF;
    END$$;

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'profiles_invite_token_unique'
      ) THEN
        ALTER TABLE profiles ADD CONSTRAINT profiles_invite_token_unique UNIQUE (invite_token);
      END IF;
    END$$;
  `;

  const { error: migErr } = await supabase.rpc('exec_sql', { sql: migrationSQL }).single();
  if (migErr) {
    
    
    
    
    const { data: check } = await supabase
      .from('profiles')
      .select('email, password_hash, invite_token, invite_expires_at')
      .limit(1);
    
    if (check !== null) {
      
    } else {
      console.log(`ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS email TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS password_hash TEXT,
  ADD COLUMN IF NOT EXISTS invite_token TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS invite_expires_at TIMESTAMPTZ;`);
    }
  } else {
    
  }

  
  
  const { count } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('is_admin', true);

  if ((count ?? 0) > 0) {
    const { data: admins } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('is_admin', true);

    
    
    
    if (admins?.some(a => !a.email)) {
      
      
    }
  } else {
    
    const adminEmail = 'admin@onboardflow.com';
    const adminPassword = 'Admin@2026';
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    const adminId = crypto.randomUUID();

    const { error: seedErr } = await supabase.from('profiles').insert({
      id: adminId,
      email: adminEmail,
      full_name: 'Admin HR',
      password_hash: passwordHash,
      is_admin: true,
    });

    if (seedErr) {
      console.error('❌ Gagal seed admin:', seedErr.message);
    } else {
      
    }
  }

  
}

runMigration().catch(console.error);
