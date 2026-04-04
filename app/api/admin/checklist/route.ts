import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const department = searchParams.get('department');

  if (!department) return NextResponse.json({ error: 'Department parameter is required' }, { status: 400 });

  const { data, error } = await supabase
    .from('checklist_items')
    .select('*')
    .eq('department', department)
    .order('created_at', { ascending: true }); // Using created_at for order

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { department, items } = await req.json();

    // Delete existing
    await supabase.from('checklist_items').delete().eq('department', department);

    // Insert new
    if (items && items.length > 0) {
      const { error } = await supabase.from('checklist_items').insert(items);
      if (error) throw error;
    }

    // Now auto-append these to all employees in this department (for future sync)
    // Wait, the progress rows should only be created when the employee is created, or we can sync it.
    // For now skip syncing old employees, just save the template successfully.

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
