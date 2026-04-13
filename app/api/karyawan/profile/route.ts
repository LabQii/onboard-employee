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
    .select('id, full_name, email, department, role, start_date, avatar_url, created_at')
    .eq('id', session.userId)
    .single();

  if (!profile) return NextResponse.json({ error: 'Profil tidak ditemukan.' }, { status: 404 });

  return NextResponse.json({ profile });
}
