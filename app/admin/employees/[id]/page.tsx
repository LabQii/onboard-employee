'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { ArrowLeft, CheckCircle2, Circle, MessageSquare, FileText, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  department: string | null;
  role: string | null;
  start_date: string | null;
}

interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
  completed_at: string | null;
  phase: string | null;
}

interface ChatMessage {
  id: string;
  question: string;
  created_at: string;
}

interface AccessibleDoc {
  id: string;
  name: string;
  department: string | null;
}

const DUE_LABEL_COLOR: Record<string, string> = {
  'Hari 1':   'bg-[#1E4D6B]/10 text-[#1E4D6B]',
  'Minggu 1': 'bg-[#A67B5B]/10 text-[#A67B5B]',
  'Bulan 1':  'bg-[#E5B67B]/20 text-[#B6817E]',
};

export default function EmployeeDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [docs, setDocs] = useState<AccessibleDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    async function fetchAll() {
      setLoading(true);

      // 1. Profile
      const { data: prof } = await supabase
        .from('profiles')
        .select('id, full_name, email, department, role, start_date')
        .eq('id', id)
        .single();
        
      setProfile(prof);

      // 2. Checklist items + progress
      if (prof) {
        // Fetch templates for employees department
        const { data: items } = await supabase
          .from('checklist_items')
          .select('id, title, phase, checklist_progress!left(completed, completed_at)')
          .eq('department', prof.department || 'Global');

        // Map checklist with progress
        const mappedChecklist = (items ?? []).map((t: any) => {
           // find the progress for this user (in a real scenario we'd eq user_id in the relation, but this works)
           const progressArr = t.checklist_progress || [];
           const progress = progressArr.length > 0 ? progressArr[0] : null;
           
           return {
             id: t.id,
             title: t.title,
             phase: t.phase,
             completed: progress?.completed ?? false,
             completed_at: progress?.completed_at ?? null
           };
        });
        
        setChecklist(mappedChecklist);
      }

      // 3. Last 10 chat messages
      const { data: chats } = await supabase
        .from('chat_history')
        .select('id, question, created_at')
        .eq('user_id', id)
        .order('created_at', { ascending: false })
        .limit(10);
      setChatHistory(chats ?? []);

      // 4. Documents accessible to this user (global OR department)
      if (prof) {
        let query = supabase.from('documents').select('id, name, department');
        if (prof.department) {
          query = query.or(`department.is.null,department.eq.${prof.department}`);
        } else {
          query = query.is('department', null);
        }
        const { data: accessDocs } = await query.order('created_at', { ascending: false });
        setDocs((accessDocs as AccessibleDoc[]) ?? []);
      }

      setLoading(false);
    }

    fetchAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const completedCount = checklist.filter((c) => c.completed).length;
  const totalCount = checklist.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const groupedChecklist = checklist.reduce<Record<string, ChecklistItem[]>>((acc, item) => {
    const label = item.phase ?? 'Umum';
    if (!acc[label]) acc[label] = [];
    acc[label].push(item);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="w-6 h-6 border-2 border-[#1E4D6B]/30 border-t-[#1E4D6B] rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-[#5A7A8C] text-[14px] font-medium">Karyawan tidak ditemukan.</p>
        <Link href="/admin/employees" className="text-[#1E4D6B] font-bold text-[13px] hover:underline">
          ← Kembali ke Daftar Karyawan
        </Link>
      </div>
    );
  }

  const initials = profile.full_name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'EMP';

  return (
    <div className="flex flex-col w-full min-h-full">
      {/* Header */}
      <div className="relative bg-[#EBF4FA] px-10 pt-10 pb-20 overflow-hidden shrink-0">
        <div className="absolute top-[-50%] right-[-10%] w-[50%] h-[200%] bg-white rounded-full blur-3xl opacity-50 pointer-events-none" />
        <div className="relative z-10 max-w-[1200px] mx-auto w-full">
          <Link
            href="/admin/employees"
            className="inline-flex items-center gap-2 text-[12px] font-bold text-[#5A7A8C] hover:text-[#1E4D6B] transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali ke Karyawan
          </Link>

          <div className="flex items-start gap-6">
            <div className="w-[72px] h-[72px] rounded-full bg-blue-50 text-[#1E4D6B] flex items-center justify-center font-bold text-[1.4rem] shadow-sm ring-8 ring-[#EBF4FA] shrink-0">
              {initials}
            </div>
            <div>
              <h1 className="text-[2rem] font-bold text-[#1E3A5F] tracking-tight">{profile.full_name}</h1>
              <p className="text-[#5A7A8C] font-medium text-[15px] mt-1">
                {profile.role || '—'} · {profile.department || '—'}
              </p>
              {profile.start_date && (
                <p className="text-[12px] text-[#9AADB8] mt-2 font-bold">
                  Didaftarkan: {new Date(profile.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto w-full px-10 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 -mt-8 relative z-20">
          {/* ── Left Column ── */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Checklist Progress */}
            <Card className="shadow-sm border border-[#E8EFF4] bg-white">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-[#1E3A5F] text-[1.1rem]">Checklist Onboarding</h2>
                <div className="flex items-center gap-3">
                  <div className="text-[12px] font-bold text-[#5A7A8C]">{completedCount}/{totalCount} selesai</div>
                  <span className={`text-[12px] font-bold px-3 py-1 rounded-lg ${progress === 100 ? 'bg-[#22C55E]/10 text-[#22C55E]' : 'bg-[#1E4D6B]/10 text-[#1E4D6B]'}`}>
                    {progress}%
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-[#E8EFF4] rounded-full mb-8 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${progress === 100 ? 'bg-[#22C55E]' : 'bg-[#1E4D6B]'}`}
                  style={{ width: `${progress}%` }}
                />
              </div>

              {totalCount === 0 ? (
                <p className="text-[13px] text-[#9AADB8] text-center py-8">Belum ada tugas di checklist karyawan ini.</p>
              ) : (
                Object.entries(groupedChecklist).map(([dueLabel, items]) => (
                  <div key={dueLabel} className="mb-6">
                    <div className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider mb-4 ${DUE_LABEL_COLOR[dueLabel] ?? 'bg-[#F8FAFC] text-[#5A7A8C]'}`}>
                      {dueLabel}
                    </div>
                    <div className="flex flex-col gap-2">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className={`flex items-center gap-4 p-4 rounded-2xl border text-left transition-all ${
                            item.completed
                              ? 'bg-[#22C55E]/5 border-[#22C55E]/20'
                              : 'bg-[#F8FAFC] border-transparent'
                          }`}
                        >
                          {item.completed
                            ? <CheckCircle2 className="w-5 h-5 text-[#22C55E] shrink-0" />
                            : <Circle className="w-5 h-5 text-[#C0CDD4] shrink-0" />
                          }
                          <span className={`text-[13px] font-medium flex-1 ${item.completed ? 'line-through text-[#9AADB8]' : 'text-[#1E3A5F]'}`}>
                            {item.title}
                          </span>
                          {item.completed_at && (
                            <span className="text-[10px] text-[#5A7A8C] font-bold uppercase whitespace-nowrap">
                              {new Date(item.completed_at).toLocaleDateString('id-ID')}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </Card>

            {/* Chat History */}
            <Card className="shadow-sm border border-[#E8EFF4] bg-white">
              <div className="flex items-center gap-3 mb-6">
                <MessageSquare className="w-5 h-5 text-[#1E4D6B]" />
                <h2 className="font-bold text-[#1E3A5F] text-[1.1rem]">10 Pertanyaan Terakhir ke AI</h2>
              </div>
              {chatHistory.length === 0 ? (
                <p className="text-[13px] text-[#9AADB8] text-center py-8">Belum ada riwayat pertanyaan ke Chatbot.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {chatHistory.map((msg, i) => (
                    <div key={msg.id} className="flex items-start gap-4 p-4 rounded-2xl bg-[#F8FAFC] border border-transparent">
                      <div className="w-6 h-6 rounded-full bg-white text-[#1E4D6B] flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 shadow-sm border border-[#E8EFF4]">
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-[13px] font-bold text-[#1E3A5F]">"{msg.question}"</p>
                        <p className="text-[10px] text-[#9AADB8] font-bold mt-1 uppercase">
                          {new Date(msg.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* ── Right Column ── */}
          <div className="flex flex-col gap-6">
            {/* Profile Info */}
            <Card className="shadow-sm border border-[#E8EFF4] bg-white">
              <div className="flex items-center gap-3 mb-5">
                <User className="w-5 h-5 text-[#1E4D6B]" />
                <h2 className="font-bold text-[#1E3A5F] text-[1rem]">Info Profil</h2>
              </div>
              <div className="flex flex-col gap-4">
                {[
                  { label: 'Email',         value: profile.email || '—' },
                  { label: 'Divisi',        value: profile.department || '—' },
                  { label: 'Jabatan',       value: profile.role || '—' },
                  { label: 'Tanggal Mulai', value: profile.start_date ? new Date(profile.start_date).toLocaleDateString('id-ID') : '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-start border-b border-[#E8EFF4] pb-3 last:border-0">
                    <span className="text-[10px] font-bold text-[#5A7A8C] uppercase tracking-wider">{label}</span>
                    <span className="text-[12px] font-bold text-[#1E3A5F] text-right max-w-[60%]">{value}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Accessible Documents */}
            <Card className="shadow-sm border border-[#E8EFF4] bg-white">
              <div className="flex items-center gap-3 mb-5">
                <FileText className="w-5 h-5 text-[#1E4D6B]" />
                <h2 className="font-bold text-[#1E3A5F] text-[1rem]">Dokumen Diakses</h2>
              </div>
              {docs.length === 0 ? (
                <p className="text-[12px] text-[#9AADB8] text-center py-6">Tidak ada dokumen.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {docs.slice(0, 8).map((doc) => (
                    <div key={doc.id} className="flex items-center gap-3 p-3 rounded-xl border border-[#E8EFF4] hover:bg-[#F8FAFC] transition-all">
                      <div className="w-7 h-7 bg-blue-50 text-[#1E4D6B] rounded-lg flex items-center justify-center text-[9px] font-bold uppercase shrink-0">
                        {doc.name.split('.').pop()?.slice(0, 3) ?? 'DOC'}
                      </div>
                      <span className="text-[12px] font-bold text-[#1E3A5F] truncate flex-1">{doc.name}</span>
                    </div>
                  ))}
                  {docs.length > 8 && (
                    <p className="text-[11px] text-[#9AADB8] font-bold text-center pt-2">+{docs.length - 8} dokumen lainnya</p>
                  )}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
