-- ============================================================
-- FIX: Row-Level Security (RLS) di tabel 'documents'
-- Masalah: "new row violates row-level security policy for table documents"
-- ============================================================

-- 1. Aktifkan RLS di tabel documents
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- 2. Hapus policy lama dengan nama yang sama jika ada
DROP POLICY IF EXISTS "Allow authenticated full access documents" ON documents;

-- 3. Buat policy baru yang memberikan akses penuh (CRUD) ke user yang sudah login
CREATE POLICY "Allow authenticated full access documents"
  ON documents 
  FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);
