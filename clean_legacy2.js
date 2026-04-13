const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data, error } = await supabase
    .from('checklist_items')
    .delete()
    .not('description', 'ilike', 'http%');
    
  if (error) console.error(error);
  else 
}
main();
