import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { sendInviteEmail } from '@/lib/email';
import { getServerSession } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';

// ─── GET: List semua karyawan ─────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const division = searchParams.get('division') || '';

  let query = supabase
    .from('profiles')
    .select('id, full_name, email, department, role, start_date, is_admin, created_at, avatar_url, password_hash')
    .eq('is_admin', false)
    .order('full_name');

  if (search) query = query.ilike('full_name', `%${search}%`);
  if (division) query = query.eq('department', division);

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Ambil data checklist untuk hitung progress
  const { data: allItems } = await supabase.from('checklist_items').select('id, department, role');
  const { data: allProgress } = await supabase.from('checklist_progress').select('user_id, completed').eq('completed', true);
  
  const employees = (data || []).map(emp => {
    const { password_hash, ...rest } = emp;
    
    // Filter item yang sesuai dengan karyawan ini
    // (Global: dept & role null) OR Match Dept OR Match Role
    const targetedItems = allItems?.filter(item => {
      const isGlobal = !item.department && !item.role;
      const matchDept = item.department && item.department === emp.department;
      const matchRole = item.role && item.role === emp.role;
      return isGlobal || matchDept || matchRole;
    }) || [];

    const total = targetedItems.length;
    const done = allProgress?.filter(p => p.user_id === emp.id).length || 0;
    const progress = total > 0 ? Math.round((done / total) * 100) : 0;

    return {
      ...rest,
      hasPassword: !!password_hash,
      progress
    };
  });

  return NextResponse.json({ employees });
}

// ─── POST: Undang karyawan baru ───────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { email, fullName, department, role, startDate } = await req.json();

    if (!email || !fullName) {
      return NextResponse.json({ error: 'Nama dan email wajib diisi.' }, { status: 400 });
    }

    // Cek apakah email sudah terdaftar
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Email sudah terdaftar.' }, { status: 409 });
    }

    // Generate invite token
    const inviteToken = randomBytes(32).toString('hex');
    const inviteExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(); // 48 jam

    // Generate UUID untuk user baru
    const newId = crypto.randomUUID();

    // Insert profile baru
    const { data: newProfile, error: insertErr } = await supabase
      .from('profiles')
      .insert({
        id: newId,
        email: email.toLowerCase().trim(),
        full_name: fullName.trim(),
        department: department || null,
        role: role || null,
        start_date: startDate || null,
        is_admin: false,
        invite_token: inviteToken,
        invite_expires_at: inviteExpiresAt,
      })
      .select()
      .single();

    if (insertErr) {
      return NextResponse.json({ error: `Gagal membuat profil: ${insertErr.message}` }, { status: 500 });
    }

    // Kirim email undangan
    await sendInviteEmail(email, fullName, inviteToken);

    return NextResponse.json({ success: true, employee: newProfile });
  } catch (err: any) {
    console.error('Create employee error:', err);
    return NextResponse.json({ error: err.message || 'Terjadi kesalahan.' }, { status: 500 });
  }
}

// ─── PUT: Update karyawan ─────────────────────────────────────────────────────
export async function PUT(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, fullName, email, department, role, startDate } = await req.json();
    if (!id) return NextResponse.json({ error: 'ID diperlukan.' }, { status: 400 });

    const updates: Record<string, any> = {};
    if (fullName !== undefined) updates.full_name = fullName;
    if (email !== undefined) updates.email = email.toLowerCase().trim();
    if (department !== undefined) updates.department = department;
    if (role !== undefined) updates.role = role;
    if (startDate !== undefined) updates.start_date = startDate || null;

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, employee: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── DELETE: Hapus karyawan ───────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID diperlukan.' }, { status: 400 });

  const { error } = await supabase.from('profiles').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

// ─── PATCH: Resend invite ─────────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'ID diperlukan.' }, { status: 400 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', id)
      .single();

    if (!profile) return NextResponse.json({ error: 'Karyawan tidak ditemukan.' }, { status: 404 });

    const inviteToken = randomBytes(32).toString('hex');
    const inviteExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    await supabase.from('profiles').update({
      invite_token: inviteToken,
      invite_expires_at: inviteExpiresAt,
    }).eq('id', id);

    await sendInviteEmail(profile.email, profile.full_name, inviteToken);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
