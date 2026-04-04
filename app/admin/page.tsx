'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Users, TrendingUp, AlertTriangle, FileText, ArrowRight, Bell, Search } from 'lucide-react';
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
  color = 'primary',
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  alert?: boolean;
  color?: 'primary' | 'green' | 'red' | 'amber';
}) {
  const colorMap = {
    primary: 'text-primary bg-primary/10',
    green:   'text-[#22C55E] bg-[#22C55E]/10',
    red:     'text-red-500 bg-red-50',
    amber:   'text-amber-500 bg-amber-50',
  };
  return (
    <Card className={`hover:-translate-y-1 transition-all shadow-soft border-none ${alert ? 'ring-2 ring-red-200' : ''}`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {alert && (
          <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded-lg uppercase tracking-wider">
            Perlu Tindakan
          </span>
        )}
      </div>
      <div className="text-[2rem] font-bold text-tertiary tracking-tight leading-none mb-1">{value}</div>
      <div className="text-[11px] font-bold text-neutral-dark uppercase tracking-[0.12em] mt-2">{label}</div>
      {sub && <div className="text-[11px] text-neutral-dark font-medium mt-1">{sub}</div>}
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
      <div className="relative bg-app-soft px-10 pt-10 pb-20 overflow-hidden shrink-0">
        <div className="absolute top-[-50%] right-[-10%] w-[50%] h-[200%] bg-app-bg rounded-full blur-3xl opacity-50 pointer-events-none" />
        <div className="relative z-10 max-w-[1200px] mx-auto w-full flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="max-w-xl">
            <h1 className="text-[2.2rem] font-bold text-tertiary mb-3 tracking-tight">Ringkasan</h1>
            <p className="text-neutral-dark leading-relaxed font-medium text-[15px]">
              Pantau progres onboarding seluruh karyawan dari satu tempat.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin/documents">
              <Button variant="outline" size="md" className="gap-2">
                <FileText className="w-4 h-4 stroke-[2]" /> Dokumen
              </Button>
            </Link>
            <Link href="/admin/employees">
              <Button variant="primary" size="md" className="gap-2">
                <Users className="w-4 h-4 stroke-[2.5]" /> Karyawan
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto w-full px-10 pb-12">
        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 -mt-10 relative z-20">
          <StatCard
            icon={Users}
            label="Karyawan Aktif"
            value={loading ? '…' : stats.totalEmployees}
            sub="Sedang dalam onboarding"
            color="primary"
          />
          <StatCard
            icon={TrendingUp}
            label="Rata-rata Progres Checklist"
            value={loading ? '…' : `${stats.avgProgress}%`}
            sub="Keseluruhan karyawan"
            color="green"
          />
          <StatCard
            icon={AlertTriangle}
            label="Belum Login > 3 Hari"
            value={loading ? '…' : stats.inactiveEmployees}
            sub="Perlu tindak lanjut"
            color="red"
            alert={!loading && stats.inactiveEmployees > 0}
          />
          <StatCard
            icon={FileText}
            label="Dokumen Terindeks AI"
            value={loading ? '…' : stats.totalDocuments}
            sub="Siap dijawab chatbot"
            color="amber"
          />
        </div>

        {/* ── Karyawan Perlu Perhatian ── */}
        <div className="mt-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-[1.4rem] font-bold text-tertiary tracking-tight">Karyawan Perlu Perhatian</h2>
              <p className="text-[12px] text-neutral-dark font-medium mt-1">Progress &lt; 30% atau tidak login lebih dari 3 hari</p>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral" strokeWidth={2.5} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari karyawan..."
                className="pl-10 pr-4 py-2.5 text-[13px] bg-white border border-neutral/20 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 shadow-soft text-tertiary placeholder:text-neutral-dark/50 transition-all w-52"
              />
            </div>
          </div>

          <Card className="shadow-soft border-none p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-neutral/10 bg-app-soft/50">
                    <th className="py-4 px-6 text-[10px] font-bold text-neutral-dark uppercase tracking-[0.15em]">Nama</th>
                    <th className="py-4 px-6 text-[10px] font-bold text-neutral-dark uppercase tracking-[0.15em]">Divisi</th>
                    <th className="py-4 px-6 text-[10px] font-bold text-neutral-dark uppercase tracking-[0.15em]">Progress</th>
                    <th className="py-4 px-6 text-[10px] font-bold text-neutral-dark uppercase tracking-[0.15em]">Terakhir Login</th>
                    <th className="py-4 px-6 text-[10px] font-bold text-neutral-dark uppercase tracking-[0.15em]">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-16 text-center text-[13px] text-neutral-dark font-medium">
                        Memuat data…
                      </td>
                    </tr>
                  ) : filteredAttention.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-16 text-center text-[13px] text-neutral-dark font-medium">
                        ✓ Semua karyawan dalam kondisi baik
                      </td>
                    </tr>
                  ) : (
                    filteredAttention.map((emp) => (
                      <tr key={emp.id} className="border-b border-neutral/5 hover:bg-app-soft/30 transition-colors group">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[11px] font-bold shrink-0">
                              {emp.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                            </div>
                            <span className="font-bold text-[13.5px] text-tertiary">{emp.full_name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-[13px] text-neutral-dark">{emp.division}</td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-24 h-1.5 bg-neutral/10 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${emp.progress < 30 ? 'bg-red-400' : 'bg-primary'}`}
                                style={{ width: `${emp.progress}%` }}
                              />
                            </div>
                            <span className={`text-[12px] font-bold ${emp.progress < 30 ? 'text-red-500' : 'text-tertiary'}`}>
                              {emp.progress}%
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`text-[12px] font-medium ${!emp.last_login || new Date(emp.last_login) < new Date(Date.now() - 3 * 86400000) ? 'text-red-500' : 'text-neutral-dark'}`}>
                            {formatLastLogin(emp.last_login)}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <button className="flex items-center gap-2 text-[12px] font-bold text-primary hover:text-white hover:bg-primary px-3 py-1.5 rounded-lg border border-primary/20 hover:border-transparent transition-all">
                            <Bell className="w-3.5 h-3.5" />
                            Kirim Pengingat
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
            <h2 className="text-[1.4rem] font-bold text-tertiary tracking-tight">FAQ Terpopuler</h2>
            <span className="text-[10px] font-bold bg-app-bg text-primary px-3 py-1.5 rounded-lg uppercase tracking-widest">
              Dari AI Chatbot
            </span>
          </div>

          <Card className="shadow-soft border-none">
            {loading ? (
              <div className="py-12 text-center text-[13px] text-neutral-dark">Memuat FAQ…</div>
            ) : faqs.length === 0 ? (
              <div className="py-12 text-center text-[13px] text-neutral-dark">Belum ada riwayat chat</div>
            ) : (
              <div className="flex flex-col gap-2">
                {faqs.map((faq, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 rounded-2xl hover:bg-app-soft transition-all border border-transparent hover:border-neutral/5 cursor-pointer group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-[10px] font-bold bg-app-bg text-primary w-7 h-7 rounded-full flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                        {String(i + 1).padStart(2, '0')}
                      </div>
                      <div className="text-[13.5px] font-bold text-tertiary">{faq.question}</div>
                    </div>
                    <div className="text-[11px] font-bold text-neutral-dark opacity-60 group-hover:opacity-100 whitespace-nowrap ml-4">
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
