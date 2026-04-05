'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Users, TrendUp, Warning, FileText, ArrowRight, Bell, MagnifyingGlass } from '@phosphor-icons/react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

// ─── Types ─────────────────────────────────────────────────────────────────

interface DashboardStats {
  totalEmployees: number;
  avgProgress: number;
  inactiveEmployees: number;
  totalDocuments: number;
}

interface AttentionEmployee {
  id: string;
  full_name: string;
  division: string;
  progress: number;
  last_login: string | null;
}

interface FaqItem {
  question: string;
  count: number;
}

// ─── Sub-components ────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  alert = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  alert?: boolean;
}) {
  return (
    <Card className={`bg-white/70 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex flex-col hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all cursor-pointer p-6 shrink-0 min-w-[240px] ${alert ? 'ring-2 ring-red-200/50' : ''}`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-[60px] h-[60px] rounded-2xl flex items-center justify-center shrink-0 ${alert ? 'bg-red-50 text-red-500' : 'bg-[#E8EFF4] text-[#276087]'}`}>
          <Icon weight="duotone" className="w-7 h-7" />
        </div>
        {alert && (
          <span className="text-[9px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded-lg uppercase tracking-widest mt-1">
            Perlu Tindakan
          </span>
        )}
      </div>
      <div>
        <div className="text-[10px] text-[#9AADB8] font-bold mb-1 tracking-[0.15em] uppercase">{label}</div>
        <div className="flex items-center gap-3">
          <span className="font-bold text-[1.8rem] text-[#1E3A5F] leading-none">{value}</span>
        </div>
        {sub && <div className="text-[11px] text-[#5A7A8C] font-medium mt-2">{sub}</div>}
      </div>
    </Card>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const [supabase] = useState(() => createClient());

  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    avgProgress: 0,
    inactiveEmployees: 0,
    totalDocuments: 0,
  });
  const [attentionList, setAttentionList] = useState<AttentionEmployee[]>([]);
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch('/api/admin/dashboard');
        const data = await res.json();

        if (data.stats) setStats(data.stats);
        if (data.attentionList) setAttentionList(data.attentionList);
        if (data.faqs) setFaqs(data.faqs);

      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredAttention = attentionList.filter((e) =>
    e.full_name.toLowerCase().includes(search.toLowerCase())
  );

  function formatLastLogin(dateStr: string | null) {
    if (!dateStr) return 'Belum pernah';
    const d = new Date(dateStr);
    const diff = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Hari ini';
    if (diff === 1) return 'Kemarin';
    return `${diff} hari lalu`;
  }

  return (
    <div className="flex flex-col w-full min-h-full">
      {/* ── Header ── */}
      {/* ── Header ── */}
      <div className="max-w-[1200px] mx-auto w-full px-10 pt-12 pb-8">
        <div className="relative bg-gradient-to-br from-[#E8F2F9] via-[#F0F7FB] to-[#F8FAFC] p-8 lg:p-12 overflow-hidden rounded-[2.5rem] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[140%] bg-gradient-to-l from-white/80 to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[40%] h-[100%] bg-gradient-to-tr from-[#DCECF5]/50 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex-1 min-w-[280px]">
            <h1 className="text-[2.2rem] lg:text-[2.5rem] font-bold text-[#1E3A5F] mb-3 tracking-tight leading-tight">
              Ringkasan Dashboard
            </h1>
            <p className="text-[#5A7A8C] text-[15px] font-medium leading-relaxed max-w-lg">
              Pantau progres onboarding seluruh karyawan dari satu tempat.
            </p>
          </div>
          <div className="relative z-10 flex items-center gap-3 shrink-0">
            <Link href="/admin/documents">
              <button className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white/70 backdrop-blur-xl border border-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all text-[#1E3A5F] font-bold text-[13px]">
                <FileText weight="duotone" className="w-5 h-5" /> Dokumen
              </button>
            </Link>
            <Link href="/admin/employees">
              <button className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#1E4D6B] hover:bg-[#163850] shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all text-white font-bold text-[13px]">
                <Users weight="duotone" className="w-5 h-5" /> Karyawan
              </button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto w-full px-10 pb-12">
        {/* ── Stat Cards ── */}
        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-20">
          <StatCard
            icon={Users}
            label="Karyawan Aktif"
            value={loading ? '…' : stats.totalEmployees}
          />
          <StatCard
            icon={TrendUp}
            label="Progres Checklist"
            value={loading ? '…' : `${stats.avgProgress}%`}
          />
          <StatCard
            icon={Warning}
            label="Belum Login > 3 Hari"
            value={loading ? '…' : stats.inactiveEmployees}
            alert={!loading && stats.inactiveEmployees > 0}
          />
          <StatCard
            icon={FileText}
            label="Dokumen Terindeks AI"
            value={loading ? '…' : stats.totalDocuments}
          />
        </div>

        {/* ── Karyawan Perlu Perhatian ── */}
        <div className="mt-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-[1.4rem] font-bold text-[#1E3A5F] tracking-tight">Karyawan Perlu Perhatian</h2>
              <p className="text-[12px] text-[#5A7A8C] font-medium mt-1">Progress &lt; 30% atau tidak login lebih dari 3 hari</p>
            </div>
            <div className="relative">
              <MagnifyingGlass weight="duotone" className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9AADB8]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari karyawan..."
                className="pl-10 pr-4 py-2.5 text-[13px] bg-white/70 backdrop-blur-xl border border-white shadow-[0_4px_20px_rgb(0,0,0,0.02)] rounded-xl focus:outline-none focus:border-[#1E4D6B] focus:ring-4 focus:ring-[#1E4D6B]/5 text-[#1E3A5F] placeholder:text-[#9AADB8] transition-all w-full sm:w-56 font-medium"
              />
            </div>
          </div>

          <Card className="shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-white bg-white/70 backdrop-blur-xl p-0 overflow-hidden rounded-3xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#E8EFF4] bg-[#F8FAFC]">
                    <th className="py-4 px-6 text-[10px] font-bold text-[#9AADB8] uppercase tracking-[0.15em] whitespace-nowrap">Nama</th>
                    <th className="py-4 px-6 text-[10px] font-bold text-[#9AADB8] uppercase tracking-[0.15em] whitespace-nowrap">Divisi</th>
                    <th className="py-4 px-6 text-[10px] font-bold text-[#9AADB8] uppercase tracking-[0.15em] whitespace-nowrap">Progress</th>
                    <th className="py-4 px-6 text-[10px] font-bold text-[#9AADB8] uppercase tracking-[0.15em] whitespace-nowrap">Terakhir Login</th>
                    <th className="py-4 px-6 text-[10px] font-bold text-[#9AADB8] uppercase tracking-[0.15em] whitespace-nowrap">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-16 text-center text-[13px] text-[#5A7A8C] font-medium">
                        Memuat data…
                      </td>
                    </tr>
                  ) : filteredAttention.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-16 text-center text-[13px] text-[#5A7A8C] font-medium">
                        ✓ Semua karyawan dalam kondisi baik
                      </td>
                    </tr>
                  ) : (
                    filteredAttention.map((emp) => (
                      <tr key={emp.id} className="border-b border-[#E8EFF4] hover:bg-white transition-colors group">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-[#EBF4FA] text-[#1E4D6B] flex items-center justify-center text-[11px] font-bold shrink-0">
                              {emp.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                            </div>
                            <span className="font-bold text-[13.5px] text-[#1E3A5F]">{emp.full_name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-[13px] font-medium text-[#5A7A8C]">{emp.division}</td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-24 h-1.5 bg-[#E8EFF4] rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-700 ${emp.progress < 30 ? 'bg-red-400' : 'bg-[#1E4D6B]'}`}
                                style={{ width: `${emp.progress}%` }}
                              />
                            </div>
                            <span className={`text-[12px] font-bold ${emp.progress < 30 ? 'text-red-500' : 'text-[#1E3A5F]'}`}>
                              {emp.progress}%
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`text-[12px] font-bold ${!emp.last_login || new Date(emp.last_login) < new Date(Date.now() - 3 * 86400000) ? 'text-red-500 bg-red-50 px-2.5 py-1 rounded-lg tracking-wide' : 'text-[#5A7A8C] font-medium'}`}>
                            {formatLastLogin(emp.last_login)}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <button className="flex items-center gap-2 text-[11px] font-bold text-[#1E4D6B] hover:text-white hover:bg-[#1E4D6B] px-3.5 py-2 rounded-xl border border-[#D8E8F0] hover:border-transparent transition-all shadow-sm hover:shadow-md">
                            <Bell weight="duotone" className="w-4 h-4" />
                            Pengingat
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* ── FAQ Terpopuler ── */}
        <div className="mt-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[1.4rem] font-bold text-[#1E3A5F] tracking-tight">FAQ Terpopuler</h2>
            <span className="text-[9px] font-bold bg-[#EBF4FA] text-[#1E4D6B] px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-sm">
              Dari AI Chatbot
            </span>
          </div>

          <Card className="shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-white bg-white/70 backdrop-blur-xl p-4 rounded-3xl">
            {loading ? (
              <div className="py-12 text-center text-[13px] text-[#5A7A8C] font-medium">Memuat FAQ…</div>
            ) : faqs.length === 0 ? (
              <div className="py-12 text-center text-[13px] text-[#5A7A8C] font-medium">Belum ada riwayat chat</div>
            ) : (
              <div className="flex flex-col gap-2">
                {faqs.map((faq, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 rounded-2xl hover:bg-white transition-all border border-transparent hover:border-[#E8EFF4] hover:shadow-sm cursor-pointer group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-[10px] font-bold bg-[#EBF4FA] text-[#276087] group-hover:bg-[#276087] group-hover:text-white w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors shadow-sm">
                        {String(i + 1).padStart(2, '0')}
                      </div>
                      <div className="text-[13.5px] font-bold text-[#1E3A5F]">{faq.question}</div>
                    </div>
                    <div className="text-[11px] font-bold bg-[#F8FAFC] text-[#5A7A8C] group-hover:bg-[#EBF4FA] group-hover:text-[#1E4D6B] opacity-70 group-hover:opacity-100 px-3 py-1.5 rounded-lg transition-all ml-4 border border-[#E8EFF4] group-hover:border-[#D8E8F0] shadow-sm">
                      {faq.count}× ditanyakan
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
