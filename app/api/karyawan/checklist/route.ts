import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: ambil semua checklist item user
export async function GET() {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Get user profile first to know their department
  const { data: profile } = await supabase
    .from('profiles')
    .select('department')
    .eq('id', session.userId)
    .single();

  const userDept = profile?.department;

  let query = supabase
    .from('checklist_items')
    .select(`
      id, title, description, phase, priority,
      checklist_progress!left(completed, completed_at)
    `);

  // If user has a department, get items for their department
  if (userDept) {
    query = query.eq('department', userDept);
  } else {
    // If no department assigned, maybe return nothing or globals
    return NextResponse.json({ items: [] });
  }

  const { data: items } = await query
    .order('phase')
    .order('priority');

  // Flatten: gabungkan dengan status progress milik user ini
  const enriched = (items ?? []).map((item: any) => {
    const progress = Array.isArray(item.checklist_progress)
      ? item.checklist_progress.find((p: any) => true)
      : item.checklist_progress;

    return {
      id: item.id,
      title: item.title,
      description: item.description,
      phase: item.phase,
      priority: item.priority,
      completed: progress?.completed ?? false,
      completed_at: progress?.completed_at ?? null,
    };
  });

  return NextResponse.json({ items: enriched });
}

// POST: toggle status checklist item
export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { itemId, completed } = await req.json();
  if (!itemId) return NextResponse.json({ error: 'itemId diperlukan.' }, { status: 400 });

  const { error } = await supabase
    .from('checklist_progress')
    .upsert({
      user_id: session.userId,
      checklist_item_id: itemId,
      completed: !!completed,
      completed_at: completed ? new Date().toISOString() : null,
    }, { onConflict: 'user_id,checklist_item_id' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
