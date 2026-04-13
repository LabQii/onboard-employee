export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);


export async function GET() {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  
  const { data: profile } = await supabase
    .from('profiles')
    .select('department, role')
    .eq('id', session.userId)
    .single();

  const userDept = profile?.department;
  const userRole = profile?.role;

  let query = supabase
    .from('checklist_items')
    .select(`
      id, title, description, phase, priority,
      checklist_progress!left(completed, completed_at)
    `);

  
  const filters = ['and(department.is.null,role.is.null)'];
  if (userDept) filters.push(`department.eq.${userDept}`);
  if (userRole) filters.push(`role.eq.${userRole}`);

  query = query.or(filters.join(','));

  const { data: items } = await query
    .order('phase')
    .order('priority');

  
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
