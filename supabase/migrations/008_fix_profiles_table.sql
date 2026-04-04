-- ============================================================
-- FIX: Pastikan kolom baru di tabel 'profiles' ada
-- Masalah: "Could not find the 'division_id' column of 'profiles'"
-- ============================================================

-- Tambahkan kolom divisi, jabatan, dan tanggal mulai ke tabel profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS division_id uuid REFERENCES divisions(id),
  ADD COLUMN IF NOT EXISTS role_id     uuid REFERENCES roles(id),
  ADD COLUMN IF NOT EXISTS start_date  date;

-- Restart cache API Supabase agar perubahan langsung dikenali
NOTIFY pgrst, 'reload schema';
