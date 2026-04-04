-- ============================================================
-- FIX: Pastikan semua kolom dokumen ada
-- Masalah: "Could not find the 'url' column of 'documents'"
-- ============================================================

-- Tambahkan kolom 'url' dan pastikan kolom dasar lainnya ada
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS url text,
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'processing',
  ADD COLUMN IF NOT EXISTS visibility text CHECK (visibility IN ('global','division','role')) DEFAULT 'global',
  ADD COLUMN IF NOT EXISTS division_id uuid REFERENCES divisions(id),
  ADD COLUMN IF NOT EXISTS role_id uuid REFERENCES roles(id);

-- Restart cache API Supabase agar perubahan langsung dikenali
NOTIFY pgrst, 'reload schema';
