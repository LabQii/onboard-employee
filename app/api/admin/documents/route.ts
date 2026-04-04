import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: Ambil daftar dokumen
export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ documents: data });
}

// POST: Tambah dokumen baru ke DB
export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name, cloudinary_url, department, role, phase } = await req.json();

    const { data: doc, error: insertErr } = await supabase
      .from('documents')
      .insert({
        name,
        cloudinary_url,
        department: department || null,
        role: role || null,
        status: 'processing',
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    // Auto-create Checklist Item for this Document
    const { error: checklistErr } = await supabase
      .from('checklist_items')
      .insert({
        title: `Baca Dokumen: ${name}`,
        description: cloudinary_url, // Use description to link the URL
        phase: phase || 'Umum',
        department: department || null,
        role: role || null,
        priority: 'wajib',
      });

    if (checklistErr) console.error("Checklist dual-write error:", checklistErr.message);

    return NextResponse.json({ success: true, document: doc });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT: Edit dokumen
export async function PUT(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { id, name, department, role, phase, cloudinary_url } = await req.json();
    if (!id) throw new Error('ID is required');

    // Update documents table
    const { data: doc, error: docErr } = await supabase
      .from('documents')
      .update({ name, department: department || null, role: role || null })
      .eq('id', id)
      .select()
      .single();

    if (docErr) throw docErr;

    // Update associated checklist item
    if (cloudinary_url) {
      const { error: chkErr } = await supabase
        .from('checklist_items')
        .update({
          title: `Baca Dokumen: ${name}`,
          department: department || null,
          role: role || null,
          phase: phase || 'Umum',
        })
        .eq('description', cloudinary_url);
        
      if (chkErr) console.error("Edit checklist error:", chkErr.message);
    }
    
    return NextResponse.json({ success: true, document: doc });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: Hapus dokumen
export async function DELETE(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

  // Ambil URL form dokumen untuk menghapus checklist yang berasosiasi
  const { data: docInfo } = await supabase.from('documents').select('cloudinary_url').eq('id', id).single();

  const { error } = await supabase.from('documents').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (docInfo?.cloudinary_url) {
     await supabase.from('checklist_items').delete().eq('description', docInfo.cloudinary_url);
  }

  return NextResponse.json({ success: true });
}
