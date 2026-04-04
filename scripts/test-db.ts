import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  const { data: p, error: pe } = await supabase.from('checklist_progress').select('*');
  console.log('Progress:', p, pe);
  
  const { data: c, error: ce } = await supabase.from('checklist_items').select('*');
  console.log('Items:', c, ce);
}
run();
