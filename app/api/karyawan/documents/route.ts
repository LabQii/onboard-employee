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

  // Get user profile first to know their department and role
  const { data: profile } = await supabase
    .from('profiles')
    .select('department, role')
    .eq('id', session.userId)
    .single();

  const userDept = profile?.department;
  const userRole = profile?.role;

  // We want documents where:
  // 1. department is NULL AND role is NULL (Global)
  // 2. OR department matches userDept
  // 3. OR role matches userRole
  let query = supabase.from('documents').select('*');
  
  const filters = ['and(department.is.null,role.is.null)'];
  if (userDept) filters.push(`department.eq.${userDept}`);
  if (userRole) filters.push(`role.eq.${userRole}`);

  query = query.or(filters.join(','));

  const { data: docs } = await query.order('created_at', { ascending: false });

  return NextResponse.json({ documents: docs ?? [] });
}
