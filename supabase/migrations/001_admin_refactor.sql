-- ============================================================
-- OnboardFlow Admin Refactor — Migration 001
-- Run this in your Supabase SQL editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. Divisions table
CREATE TABLE IF NOT EXISTS divisions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,           -- optional: for multi-tenant support later
  name       text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 2. Roles table (per division)
CREATE TABLE IF NOT EXISTS roles (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  division_id uuid REFERENCES divisions(id) ON DELETE CASCADE,
  name        text NOT NULL,
  created_at  timestamptz DEFAULT now()
);

-- 3. Alter profiles to add division_id, role_id, start_date
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS division_id uuid REFERENCES divisions(id),
  ADD COLUMN IF NOT EXISTS role_id     uuid REFERENCES roles(id),
  ADD COLUMN IF NOT EXISTS start_date  date;

-- 4. Alter documents table for visibility system
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS visibility  text CHECK (visibility IN ('global','division','role')) DEFAULT 'global',
  ADD COLUMN IF NOT EXISTS division_id uuid REFERENCES divisions(id),
  ADD COLUMN IF NOT EXISTS role_id     uuid REFERENCES roles(id);

-- 5. Checklist templates (per division)
CREATE TABLE IF NOT EXISTS checklist_templates (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  division_id uuid REFERENCES divisions(id) ON DELETE CASCADE,
  task_name   text NOT NULL,
  description text,
  due_label   text CHECK (due_label IN ('Hari 1','Minggu 1','Bulan 1')) DEFAULT 'Hari 1',
  sort_order  int DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

-- 6. Employee checklist items (copied from template when employee is created)
CREATE TABLE IF NOT EXISTS employee_checklist_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES profiles(id) ON DELETE CASCADE,
  template_id  uuid REFERENCES checklist_templates(id) ON DELETE SET NULL,
  task_name    text NOT NULL,
  is_completed bool DEFAULT false,
  completed_at timestamptz,
  created_at   timestamptz DEFAULT now()
);

-- 7. Chat history table (if not exists — stores employee AI Q&A)
CREATE TABLE IF NOT EXISTS chat_history (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES profiles(id) ON DELETE CASCADE,
  question   text NOT NULL,
  answer     text,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- Seed some default divisions and roles for testing
-- ============================================================
INSERT INTO divisions (name) VALUES
  ('Engineering'),
  ('Finance'),
  ('Design'),
  ('Marketing'),
  ('Operations')
ON CONFLICT DO NOTHING;

-- Seed roles for Engineering
INSERT INTO roles (division_id, name)
SELECT id, 'Software Engineer' FROM divisions WHERE name = 'Engineering'
ON CONFLICT DO NOTHING;
INSERT INTO roles (division_id, name)
SELECT id, 'QA Engineer' FROM divisions WHERE name = 'Engineering'
ON CONFLICT DO NOTHING;

-- Seed roles for Design
INSERT INTO roles (division_id, name)
SELECT id, 'Product Designer' FROM divisions WHERE name = 'Design'
ON CONFLICT DO NOTHING;

-- Seed roles for Finance
INSERT INTO roles (division_id, name)
SELECT id, 'Financial Analyst' FROM divisions WHERE name = 'Finance'
ON CONFLICT DO NOTHING;

-- ============================================================
-- RLS: Enable row-level security on new tables
-- (You should add appropriate policies based on your auth setup)
-- ============================================================
ALTER TABLE divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read divisions and roles
CREATE POLICY "Allow authenticated read divisions"
  ON divisions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read roles"
  ON roles FOR SELECT TO authenticated USING (true);

-- Allow admins full access to checklist_templates (adjust based on your is_admin column)
CREATE POLICY "Allow authenticated read checklist_templates"
  ON checklist_templates FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated manage checklist_templates"
  ON checklist_templates FOR ALL TO authenticated USING (true);

-- Employees can read their own checklist items
CREATE POLICY "Allow users read own checklist items"
  ON employee_checklist_items FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Allow users update own checklist items"
  ON employee_checklist_items FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Employees can read/write their own chat history
CREATE POLICY "Allow users manage own chat history"
  ON chat_history FOR ALL TO authenticated
  USING (user_id = auth.uid());
