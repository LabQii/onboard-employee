'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Briefcase, UserList, Plus, Trash } from '@phosphor-icons/react';
import { createClient } from '@/lib/supabase/client';

// ─── Section Card ────────────────────────────────────────────────────────────

function SectionCard({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <Card className="shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-white bg-white/70 backdrop-blur-xl rounded-[2rem] p-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-[#E8EFF4] flex items-center justify-center">
          <Icon className="w-5 h-5 text-[#276087]" />
        </div>
        <h2 className="font-bold text-[#1E3A5F] text-[1.2rem]">{title}</h2>
      </div>
      {children}
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const supabase = createClient();

  // Departments & Roles
  const [departments, setDepartments] = useState<{ id: string, name: string }[]>([]);
  const [roles, setRoles] = useState<{ id: string, name: string }[]>([]);
  const [newDep, setNewDep] = useState('');
  const [newRole, setNewRole] = useState('');
  const [loadingDeps, setLoadingDeps] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);

  useEffect(() => {
    // Fetch deps & roles
    fetch('/api/admin/departments').then(res => res.json()).then(data => setDepartments(data.departments || []));
    fetch('/api/admin/roles').then(res => res.json()).then(data => setRoles(data.roles || []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addDepartment() {
    if (!newDep.trim()) return;
    setLoadingDeps(true);
    try {
      const res = await fetch('/api/admin/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newDep.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setDepartments(prev => [...prev, data.department]);
        setNewDep('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDeps(false);
    }
  }

  async function deleteDepartment(id: string) {
    if (!confirm('Hapus divisi ini?')) return;
    const res = await fetch(`/api/admin/departments?id=${id}`, { method: 'DELETE' });
    if (res.ok) setDepartments(prev => prev.filter(d => d.id !== id));
  }

  async function addRole() {
    if (!newRole.trim()) return;
    setLoadingRoles(true);
    try {
      const res = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newRole.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setRoles(prev => [...prev, data.role]);
        setNewRole('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRoles(false);
    }
  }

  async function deleteRole(id: string) {
    if (!confirm('Hapus jabatan ini?')) return;
    const res = await fetch(`/api/admin/roles?id=${id}`, { method: 'DELETE' });
    if (res.ok) setRoles(prev => prev.filter(r => r.id !== id));
  }

  return (
    <div className="flex flex-col w-full min-h-full">
      {/* ── Header ── */}
      <div className="max-w-[1200px] mx-auto w-full px-10 pt-12 pb-8">
        <div className="relative bg-white p-8 lg:p-10 overflow-hidden rounded-[2.5rem] border border-[#F3F4F6] shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col md:flex-row items-center justify-between gap-10">

          {/* Subtle Blue Dots Decoration */}
          <div className="absolute top-0 right-0 w-[400px] h-[400px] opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#1E4D6B 2px, transparent 2px)', backgroundSize: '24px 24px' }} />
          <div className="absolute top-[-20%] right-[10%] w-[30%] h-[150%] bg-[#E8F2F9] rounded-full blur-3xl pointer-events-none opacity-60" />
          <div className="absolute bottom-[-50%] left-[-10%] w-[30%] h-[150%] bg-[#DCECF5] rounded-full blur-3xl pointer-events-none opacity-40" />

          <div className="relative z-10 flex-1 min-w-[280px]">
            <h1 className="text-[2.2rem] lg:text-[2.4rem] font-extrabold text-[#111827] mb-2 tracking-tight leading-tight">
              Struktur Organisasi
            </h1>
            <p className="text-[#6B7280] text-[15px] font-medium leading-relaxed max-w-lg">
              Kelola daftar divisi dan jabatan yang tersedia untuk proses onboarding
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto w-full px-10 pb-12 mt-4 z-10 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* ── Manage Departments ── */}
          <SectionCard icon={Briefcase} title="Daftar Divisi">
            <div className="flex flex-col gap-5">
              <div className="relative flex items-center">
                <input
                  value={newDep}
                  onChange={(e) => setNewDep(e.target.value)}
                  placeholder="Tambahkan divisi baru..."
                  className="w-full pl-5 pr-14 py-3.5 border border-[#E8EFF4] rounded-2xl text-[13px] font-medium text-[#1E3A5F] focus:outline-none focus:border-[#1E4D6B] focus:ring-4 focus:ring-[#1E4D6B]/5 transition-all bg-white placeholder-[#9AADB8] shadow-[0_2px_10px_rgb(0,0,0,0.01)]"
                  onKeyDown={(e) => e.key === 'Enter' && addDepartment()}
                />
                <button
                  onClick={addDepartment}
                  disabled={loadingDeps || !newDep.trim()}
                  className="absolute right-2 w-9 h-9 rounded-xl bg-[#1E4D6B] text-white flex items-center justify-center hover:bg-[#236181] transition-all disabled:opacity-40 shadow-sm"
                >
                  <Plus weight="bold" className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-2.5 max-h-[450px] overflow-y-auto pr-1 custom-scrollbar">
                {departments.map((d) => (
                  <div key={d.id} className="flex items-center justify-between px-5 py-3.5 bg-white border border-[#E8EFF4] rounded-2xl group transition-all hover:border-[#1E4D6B]/30 hover:shadow-md">
                    <span className="text-[14px] font-semibold text-[#1E3A5F]">{d.name}</span>
                    <button onClick={() => deleteDepartment(d.id)} className="p-2 text-[#9AADB8] hover:bg-red-50 hover:text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all focus:opacity-100">
                      <Trash weight="duotone" className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {departments.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 px-4 border-2 border-dashed border-[#E8EFF4] rounded-2xl bg-[#F8FAFC]/50">
                    <Briefcase className="w-8 h-8 text-[#C0CDD4] mb-3" weight="duotone" />
                    <p className="text-[13px] text-[#5A7A8C] font-extrabold">Belum ada divisi</p>
                    <p className="text-[12px] text-[#C0CDD4] mt-1 text-center font-medium">Tambahkan divisi pertama Anda di atas.</p>
                  </div>
                )}
              </div>
            </div>
          </SectionCard>

          {/* ── Manage Roles ── */}
          <SectionCard icon={UserList} title="Daftar Jabatan">
            <div className="flex flex-col gap-5">
              <div className="relative flex items-center">
                <input
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  placeholder="Tambahkan jabatan baru..."
                  className="w-full pl-5 pr-14 py-3.5 border border-[#E8EFF4] rounded-2xl text-[13px] font-medium text-[#1E3A5F] focus:outline-none focus:border-[#1E4D6B] focus:ring-4 focus:ring-[#1E4D6B]/5 transition-all bg-white placeholder-[#9AADB8] shadow-[0_2px_10px_rgb(0,0,0,0.01)]"
                  onKeyDown={(e) => e.key === 'Enter' && addRole()}
                />
                <button
                  onClick={addRole}
                  disabled={loadingRoles || !newRole.trim()}
                  className="absolute right-2 w-9 h-9 rounded-xl bg-[#1E4D6B] text-white flex items-center justify-center hover:bg-[#236181] transition-all disabled:opacity-40 shadow-sm"
                >
                  <Plus weight="bold" className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-2.5 max-h-[450px] overflow-y-auto pr-1 custom-scrollbar">
                {roles.map((r) => (
                  <div key={r.id} className="flex items-center justify-between px-5 py-3.5 bg-white border border-[#E8EFF4] rounded-2xl group transition-all hover:border-[#1E4D6B]/30 hover:shadow-md">
                    <span className="text-[14px] font-semibold text-[#1E3A5F]">{r.name}</span>
                    <button onClick={() => deleteRole(r.id)} className="p-2 text-[#9AADB8] hover:bg-red-50 hover:text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all focus:opacity-100">
                      <Trash weight="duotone" className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {roles.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 px-4 border-2 border-dashed border-[#E8EFF4] rounded-2xl bg-[#F8FAFC]/50">
                    <UserList className="w-8 h-8 text-[#C0CDD4] mb-3" weight="duotone" />
                    <p className="text-[13px] text-[#5A7A8C] font-extrabold">Belum ada jabatan</p>
                    <p className="text-[12px] text-[#C0CDD4] mt-1 text-center font-medium">Tambahkan jabatan pertama Anda di atas.</p>
                  </div>
                )}
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
