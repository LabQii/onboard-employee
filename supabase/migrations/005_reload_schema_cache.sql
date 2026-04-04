-- ============================================================
-- FIX: Refresh Supabase Schema Cache
-- Masalah: "Could not find the 'division_id' column of 'documents' in the schema cache"
-- ============================================================

-- Jalankan perintah ini untuk memaksa Supabase memperbarui cache skema database-nya.
-- Ini sering diperlukan setelah menambahkan kolom baru melalui alter table.
NOTIFY pgrst, 'reload schema';
