import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await req.json();

  if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

  const { data: doc } = await supabase
    .from('documents')
    .select('file_path, file_url')
    .eq('id', id)
    .single();

  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  
  if (doc.file_path) {
    const { error: storageError } = await supabase.storage.from('documents').remove([doc.file_path]);
    if (storageError) console.error("Error deleting from storage:", storageError.message);
  }

  
  if (doc.file_url) {
    await supabase.from('checklist_items').delete().eq('description', doc.file_url);
  }

  
  await supabase.from('documents').delete().eq('id', id);

  return NextResponse.json({ success: true });
}
