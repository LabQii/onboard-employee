-- 1. Buat tabel divisi & roles
CREATE TABLE IF NOT EXISTS divisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  division_id uuid REFERENCES divisions(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS checklist_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  division_id uuid REFERENCES divisions(id) ON DELETE CASCADE,
  task_name text NOT NULL,
  description text,
  due_label text CHECK (due_label IN ('Hari 1','Minggu 1','Bulan 1')) DEFAULT 'Hari 1',
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS employee_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid, -- akan di-referensikan ke profiles
  template_id uuid REFERENCES checklist_templates(id) ON DELETE SET NULL,
  task_name text NOT NULL,
  is_completed bool DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  question text NOT NULL,
  answer text,
  created_at timestamptz DEFAULT now()
);

-- 2. Tambahkan kolom yang hilang
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS url text,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'processing',
  ADD COLUMN IF NOT EXISTS visibility text CHECK (visibility IN ('global','division','role')) DEFAULT 'global',
  ADD COLUMN IF NOT EXISTS division_id uuid REFERENCES divisions(id),
  ADD COLUMN IF NOT EXISTS role_id uuid REFERENCES roles(id);

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS division_id uuid REFERENCES divisions(id),
  ADD COLUMN IF NOT EXISTS role_id uuid REFERENCES roles(id),
  ADD COLUMN IF NOT EXISTS start_date date;

-- 3. FIX Semua RLS (Full Access untuk Admin/User Login)
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated full access documents" ON documents;
CREATE POLICY "Allow authenticated full access documents" ON documents FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated full access profiles" ON profiles;
CREATE POLICY "Allow authenticated full access profiles" ON profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE divisions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated full access divisions" ON divisions;
CREATE POLICY "Allow authenticated full access divisions" ON divisions FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated full access roles" ON roles;
CREATE POLICY "Allow authenticated full access roles" ON roles FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE checklist_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated full access checklist_templates" ON checklist_templates;
CREATE POLICY "Allow authenticated full access checklist_templates" ON checklist_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE employee_checklist_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated full access employee_checklist_items" ON employee_checklist_items;
CREATE POLICY "Allow authenticated full access employee_checklist_items" ON employee_checklist_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated full access chat_history" ON chat_history;
CREATE POLICY "Allow authenticated full access chat_history" ON chat_history FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. FIX Storage RLS
DROP POLICY IF EXISTS "Allow authenticated uploads to documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete documents" ON storage.objects;

CREATE POLICY "Allow authenticated uploads to documents" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documents');
CREATE POLICY "Allow public read documents" ON storage.objects FOR SELECT TO public USING (bucket_id = 'documents');
CREATE POLICY "Allow authenticated update documents" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'documents');
CREATE POLICY "Allow authenticated delete documents" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'documents');

-- 5. RELOAD SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
