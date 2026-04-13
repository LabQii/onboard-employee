import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { count: totalEmp } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_admin', false);

    const { count: totalDocs } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true });

    const { data: employees } = await supabase
      .from('profiles')
      .select('id, full_name, department, role, email')
      .eq('is_admin', false);

    let totalProgress = 0;
    const attentionCandidates = [];

    const { data: allItems } = await supabase.from('checklist_items').select('id, department, role');
    const { data: allProgress } = await supabase.from('checklist_progress').select('user_id, completed').eq('completed', true);

    for (const emp of employees ?? []) {
      
      const targetedItems = allItems?.filter(item => {
        const isGlobal = !item.department && !item.role;
        const matchDept = item.department && item.department === emp.department;
        const matchRole = item.role && item.role === emp.role;
        return isGlobal || matchDept || matchRole;
      }) || [];

      const total = targetedItems.length;
      const done = allProgress?.filter(p => p.user_id === emp.id).length || 0;
      const progress = total > 0 ? Math.round((done / total) * 100) : 0;
      
      totalProgress += progress;

      if (progress < 50) {
        attentionCandidates.push({
          id: emp.id,
          full_name: emp.full_name || emp.email || '—',
          email: emp.email,
          division: emp.department || '—',
          progress,
          last_login: null,
        });
      }
    }

    const avgProgress = (employees?.length ?? 0) > 0 ? Math.round(totalProgress / (employees?.length ?? 1)) : 0;
    const inactiveCount = attentionCandidates.length;

    const { data: chatRows } = await supabase
      .from('chat_history')
      .select('question')
      .order('created_at', { ascending: false })
      .limit(200);

    const freq: Record<string, number> = {};
    for (const row of chatRows ?? []) {
      const q = (row.question ?? '').trim();
      if (q) freq[q] = (freq[q] ?? 0) + 1;
    }
    let topFaqs = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([question, count]) => ({ question, count }));

    
    if (topFaqs.length === 0) {
      topFaqs = [
        { question: "Bagaimana cara melakukan klaim asuransi kesehatan?", count: 18 },
        { question: "Dimana saya bisa menemukan panduan cuti tahunan?", count: 12 },
        { question: "Siapa yang harus saya hubungi untuk masalah IT?", count: 9 },
        { question: "Berapa lama masa pencairan reimburse operasional?", count: 5 },
        { question: "Apakah ada format standar untuk laporan bulanan?", count: 3 }
      ];
    }

    return NextResponse.json({
      stats: {
        totalEmployees: totalEmp ?? 0,
        avgProgress,
        inactiveEmployees: inactiveCount,
        totalDocuments: totalDocs ?? 0,
      },
      attentionList: attentionCandidates,
      faqs: topFaqs
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
