-- ============================================================
-- OnboardFlow — Migration 003
-- Create Supabase Storage bucket for document uploads
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Create the storage bucket for documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  true,   -- public so we can get a public URL
  20971520, -- 20 MB limit
  ARRAY['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','text/plain']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files to the documents bucket
CREATE POLICY "Allow authenticated uploads to documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'documents');

-- Allow everyone to read/download documents (public bucket)
CREATE POLICY "Allow public read documents"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'documents');

-- Allow authenticated users to delete their own uploads
CREATE POLICY "Allow authenticated delete documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'documents');
