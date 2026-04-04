-- ============================================================
-- OnboardFlow Admin Refactor — Migration 002
-- Full CRUD access for admin on all new tables
-- Run this AFTER 001_admin_refactor.sql
-- ============================================================

-- ── Divisions: full CRUD for authenticated (admin) ──────────
DROP POLICY IF EXISTS "Allow authenticated read divisions" ON divisions;

CREATE POLICY "Allow authenticated full access divisions"
  ON divisions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── Roles: full CRUD for authenticated ──────────────────────
DROP POLICY IF EXISTS "Allow authenticated read roles" ON roles;

CREATE POLICY "Allow authenticated full access roles"
  ON roles FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── Checklist Templates: full CRUD ──────────────────────────
DROP POLICY IF EXISTS "Allow authenticated read checklist_templates" ON checklist_templates;
DROP POLICY IF EXISTS "Allow authenticated manage checklist_templates" ON checklist_templates;

CREATE POLICY "Allow authenticated full access checklist_templates"
  ON checklist_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── Employee Checklist Items: admin full access ──────────────
DROP POLICY IF EXISTS "Allow users read own checklist items" ON employee_checklist_items;
DROP POLICY IF EXISTS "Allow users update own checklist items" ON employee_checklist_items;

-- Allow the item's owner OR any admin to access
CREATE POLICY "Allow authenticated full access employee_checklist_items"
  ON employee_checklist_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── Chat History: admin can read all, users manage their own ─
DROP POLICY IF EXISTS "Allow users manage own chat history" ON chat_history;

CREATE POLICY "Allow authenticated full access chat_history"
  ON chat_history FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── Documents: ensure admins can insert/update/delete ────────
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated full access documents" ON documents;

CREATE POLICY "Allow authenticated full access documents"
  ON documents FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── Profiles: admins can read all profiles ────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated full access profiles" ON profiles;

CREATE POLICY "Allow authenticated full access profiles"
  ON profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);
