-- RLS Policies (enabled on all tables)
alter table companies enable row level security;
alter table profiles enable row level security;
alter table documents enable row level security;
alter table chunks enable row level security;
alter table checklist_items enable row level security;
alter table checklist_progress enable row level security;
alter table chat_history enable row level security;

-- Basic admin policies (for demonstration)
-- Ideally this is fleshed out based on company_id, but for now we'll do simple authenticated access
DO $$
BEGIN
  create policy "Enable insert for authenticated users only" on profiles for insert with check (auth.uid() = id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  create policy "Enable read access for all users" on profiles for select using (true);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  create policy "Allow users to read own checklist" on checklist_progress for select using (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  create policy "Allow users to update own checklist" on checklist_progress for update using (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- match_documents function for vector similarity search
create or replace function match_documents(
  query_embedding vector(768),
  match_count int,
  filter_company_id uuid
)
returns table (
  id uuid,
  content text,
  similarity float
)
language sql stable
as $$
  select chunks.id, chunks.content,
    1 - (chunks.embedding <=> query_embedding) as similarity
  from chunks
  join documents on chunks.document_id = documents.id
  where documents.company_id = filter_company_id
  order by chunks.embedding <=> query_embedding
  limit match_count;
$$;
