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
  console.log('🔧 Menjalankan migrasi database...\n');

  // Jalankan SQL untuk tambah kolom baru ke profiles
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
    // Coba alternatif: gunakan REST API langsung
    console.log('⚠️  RPC exec_sql tidak tersedia, coba cara lain...');
    
    // Cek apakah kolom sudah ada dengan select
    const { data: check } = await supabase
      .from('profiles')
      .select('email, password_hash, invite_token, invite_expires_at')
      .limit(1);
    
    if (check !== null) {
      console.log('✅ Kolom sudah ada di database!\n');
    } else {
      console.log('❌ Kolom belum ada. Jalankan SQL manual di Supabase Dashboard:\n');
      console.log('─'.repeat(60));
      console.log(`ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS email TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS password_hash TEXT,
  ADD COLUMN IF NOT EXISTS invite_token TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS invite_expires_at TIMESTAMPTZ;`);
      console.log('─'.repeat(60));
      console.log('\nBuka: https://app.supabase.com → SQL Editor → paste SQL di atas\n');
    }
  } else {
    console.log('✅ Migrasi kolom berhasil!\n');
  }

  // Seed admin account
  console.log('👤 Mengecek akun admin...');
  const { count } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('is_admin', true);

  if ((count ?? 0) > 0) {
    console.log(`✅ Admin sudah ada (${count} akun).\n`);
    
    // Cek apakah admin sudah punya email field
    const { data: admins } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('is_admin', true);

    console.log('📋 Daftar admin:');
    admins?.forEach(a => console.log(`  - ${a.full_name} | email: ${a.email || '(belum diset)'}`));
    
    if (admins?.some(a => !a.email)) {
      console.log('\n⚠️  Beberapa admin belum punya email. Update manual diperlukan.');
      console.log('   Atau hapus admin lama dan jalankan seed ulang.');
    }
  } else {
    console.log('🌱 Membuat akun admin pertama...');
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
      console.log('✅ Admin berhasil dibuat!\n');
      console.log('─'.repeat(40));
      console.log(`  Email    : ${adminEmail}`);
      console.log(`  Password : ${adminPassword}`);
      console.log('─'.repeat(40));
      console.log('⚠️  Segera ganti password setelah login pertama!\n');
    }
  }

  console.log('\n🚀 Setup selesai! Buka http://localhost:3000 untuk login.\n');
}

runMigration().catch(console.error);
