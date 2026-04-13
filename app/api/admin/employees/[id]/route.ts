import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession();
  if (!session?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const { data: employee, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, department, role, start_date, is_admin, created_at, avatar_url, invite_token, invite_expires_at, password_hash')
    .eq('id', id)
    .single();

  if (error || !employee) return NextResponse.json({ error: 'Karyawan tidak ditemukan.' }, { status: 404 });

  
  const { count: total } = await supabase
    .from('checklist_progress')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', id);

  const { count: done } = await supabase
    .from('checklist_progress')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', id)
    .eq('completed', true);

  const progress = total && total > 0 ? Math.round(((done ?? 0) / total) * 100) : 0;

  return NextResponse.json({
    employee: {
      ...employee,
      password_hash: undefined, 
      hasPassword: !!employee.password_hash,
      progress,
    },
  });
}
