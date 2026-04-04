-- ============================================================
-- FIX: Storage RLS — jalankan di Supabase SQL Editor
-- Masalah: "new row violates row-level security policy"
-- ============================================================

-- Hapus policy lama kalau ada (agar tidak duplikat)
DROP POLICY IF EXISTS "Allow authenticated uploads to documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete documents" ON storage.objects;

-- Izinkan semua operasi (untuk admin — bisa diperketat nanti)
CREATE POLICY "Allow authenticated uploads to documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Allow public read documents"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'documents');

CREATE POLICY "Allow authenticated update documents"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'documents');

CREATE POLICY "Allow authenticated delete documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'documents');
