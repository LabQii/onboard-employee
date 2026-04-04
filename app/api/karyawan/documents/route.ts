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

  // Get user profile first to know their department
  const { data: profile } = await supabase
    .from('profiles')
    .select('department')
    .eq('id', session.userId)
    .single();

  const userDept = profile?.department;

  // We want documents where department is NULL (Global) OR department = userDept
  let query = supabase.from('documents').select('*');
  
  if (userDept) {
    query = query.or(`department.is.null,department.eq.${userDept}`);
  } else {
    query = query.is('department', null);
  }

  const { data: docs } = await query.order('created_at', { ascending: false });

  return NextResponse.json({ documents: docs ?? [] });
}
