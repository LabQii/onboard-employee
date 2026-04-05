'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Buildings, UserCircle, Key, Trash, ArrowsClockwise, Briefcase, UserList, Plus } from '@phosphor-icons/react';
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

  // Company name
  const [companyName, setCompanyName] = useState('On-Boarding');
  const [savingCompany, setSavingCompany] = useState(false);
  const [companySaved, setCompanySaved] = useState(false);

  // Admin profile
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // Danger zone
  const [dangerConfirm, setDangerConfirm] = useState('');

  // Departments & Roles
  const [departments, setDepartments] = useState<{id: string, name: string}[]>([]);
  const [roles, setRoles] = useState<{id: string, name: string}[]>([]);
  const [newDep, setNewDep] = useState('');
  const [newRole, setNewRole] = useState('');
  const [loadingDeps, setLoadingDeps] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);

  useEffect(() => {
    // Fetch current admin profile from DB
    supabase.from('profiles').select('email, full_name').eq('is_admin', true).limit(1).then(({ data }) => {
      if (data?.[0]) {
        setAdminName(data[0].full_name ?? '');
        setAdminEmail(data[0].email ?? '');
      }
    });

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

  async function saveCompany() {
    setSavingCompany(true);
    // In a real app, upsert to a `company` table with company_id
    await new Promise((r) => setTimeout(r, 600)); // UI demo
    setSavingCompany(false);
    setCompanySaved(true);
    setTimeout(() => setCompanySaved(false), 2500);
  }

  async function saveProfile() {
    setSavingProfile(true);
    try {
      // API call to update profile securely
      await fetch('/api/auth/set-password', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ email: adminEmail, fullName: adminName, password: newPassword }),
      });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleDeleteAllData() {
    if (dangerConfirm !== 'HAPUS') return alert('Ketik HAPUS untuk konfirmasi.');
    if (!confirm('Ini akan menghapus SEMUA data onboarding. Tidak dapat dibatalkan!')) return;
    
    // API deletion would be better, but we do it gracefully here
    await supabase.from('checklist_progress').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('checklist_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('chat_history').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    setDangerConfirm('');
    alert('Sebagian data onboarding telah dihapus.');
  }

  return (
    <div className="flex flex-col w-full min-h-full">
      {/* ── Header ── */}
      <div className="max-w-[1200px] mx-auto w-full px-10 pt-12 pb-8">
        <div className="relative bg-gradient-to-br from-[#E8F2F9] via-[#F0F7FB] to-[#F8FAFC] p-8 lg:p-12 overflow-hidden rounded-[2.5rem] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[140%] bg-gradient-to-l from-white/80 to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[40%] h-[100%] bg-gradient-to-tr from-[#DCECF5]/50 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex-1 min-w-[280px]">
            <h1 className="text-[2.2rem] lg:text-[2.5rem] font-bold text-[#1E3A5F] mb-3 tracking-tight leading-tight">
              Pengaturan
            </h1>
            <p className="text-[#5A7A8C] text-[15px] font-medium leading-relaxed max-w-lg">
              Konfigurasi portal, kelola aplikasi, dan atur profil admin.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto w-full px-10 pb-12 mt-4 z-10 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* ── Company Name ── */}
          <SectionCard icon={Buildings} title="Nama Perusahaan">
            <div className="flex flex-col gap-4">
              <input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-4 py-3 border border-[#E8EFF4] rounded-xl text-[14px] font-medium text-[#1E3A5F] focus:outline-none focus:border-[#1E4D6B] focus:ring-4 focus:ring-[#1E4D6B] transition-all bg-white"
                placeholder="Nama perusahaan..."
              />
              <button
                onClick={saveCompany}
                disabled={savingCompany}
                className={`py-3 rounded-xl text-[13px] font-bold transition-all ${
                  companySaved
                    ? 'bg-[#22C55E] text-white'
                    : 'bg-[#1E4D6B] text-white hover:bg-[#236181]'
                } disabled:opacity-60`}
              >
                {savingCompany ? 'Menyimpan…' : companySaved ? '✓ Tersimpan' : 'Simpan'}
              </button>
            </div>
          </SectionCard>

          {/* ── Admin Profile ── */}
          <SectionCard icon={UserCircle} title="Profil Admin">
            <div className="flex flex-col gap-5">
              <div>
                <label className="text-[11px] font-bold text-[#5A7A8C] uppercase tracking-wider mb-2 block">Nama</label>
                <input
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full px-4 py-3 border border-white/50 bg-white/70 backdrop-blur-xl rounded-xl text-[13px] font-medium text-[#1E3A5F] focus:outline-none focus:border-[#1E4D6B] shadow-[0_4px_20px_rgb(0,0,0,0.02)] transition-all"
                  placeholder="Nama admin..."
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#5A7A8C] uppercase tracking-wider mb-2 block">Email</label>
                <input
                  value={adminEmail}
                  disabled
                  className="w-full px-4 py-3 border border-transparent rounded-xl text-[13px] font-medium text-[#9AADB8] bg-[#F8FAFC]/50 backdrop-blur-xl cursor-not-allowed shadow-[0_4px_20px_rgb(0,0,0,0.01)]"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#5A7A8C] uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Key weight="duotone" className="w-4 h-4 text-[#9AADB8]" /> Password Baru
                  <span className="font-medium normal-case text-[#9AADB8]/60 ml-auto mr-1">(kosongkan jika tidak diubah)</span>
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-white/50 bg-white/70 backdrop-blur-xl rounded-xl text-[13px] font-medium text-[#1E3A5F] focus:outline-none focus:border-[#1E4D6B] shadow-[0_4px_20px_rgb(0,0,0,0.02)] transition-all"
                  placeholder="Masukkan password baru..."
                />
              </div>
              <button
                onClick={saveProfile}
                disabled={savingProfile}
                className={`py-3 mt-2 rounded-xl text-[13px] font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 ${
                  profileSaved ? 'bg-[#22C55E] text-white' : 'bg-[#1E4D6B] text-white hover:bg-[#236181]'
                } disabled:opacity-60 disabled:hover:translate-y-0 disabled:shadow-none`}
              >
                {savingProfile ? 'Menyimpan…' : profileSaved ? '✓ Tersimpan' : 'Simpan Profil'}
              </button>
            </div>
          </SectionCard>

          {/* ── Manage Departments ── */}
          <SectionCard icon={Briefcase} title="Kelola Divisi">
            <div className="flex flex-col gap-4">
              <div className="flex gap-2">
                <input
                  value={newDep}
                  onChange={(e) => setNewDep(e.target.value)}
                  placeholder="Nama divisi baru..."
                  className="flex-1 px-4 py-2.5 border border-[#E8EFF4] rounded-xl text-[13px] font-medium text-[#1E3A5F] focus:outline-none focus:border-[#1E4D6B] transition-all bg-white"
                />
                <button
                  onClick={addDepartment}
                  disabled={loadingDeps || !newDep.trim()}
                  className="w-10 h-10 rounded-xl bg-[#1E4D6B] text-white flex items-center justify-center hover:bg-[#236181] transition-all disabled:opacity-40"
                >
                  <Plus weight="bold" className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                {departments.map((d) => (
                  <div key={d.id} className="flex items-center justify-between p-3 bg-[#F8FAFC] border border-[#E8EFF4] rounded-xl group transition-all hover:border-red-100">
                    <span className="text-[13px] font-bold text-[#1E3A5F]">{d.name}</span>
                    <button onClick={() => deleteDepartment(d.id)} className="p-1.5 text-[#9AADB8] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                      <Trash weight="duotone" className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {departments.length === 0 && <p className="text-center py-4 text-[12px] text-[#9AADB8] font-medium">Belum ada divisi.</p>}
              </div>
            </div>
          </SectionCard>

          {/* ── Manage Roles ── */}
          <SectionCard icon={UserList} title="Kelola Jabatan">
            <div className="flex flex-col gap-4">
              <div className="flex gap-2">
                <input
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  placeholder="Nama jabatan baru..."
                  className="flex-1 px-4 py-2.5 border border-[#E8EFF4] rounded-xl text-[13px] font-medium text-[#1E3A5F] focus:outline-none focus:border-[#1E4D6B] transition-all bg-white"
                />
                <button
                  onClick={addRole}
                  disabled={loadingRoles || !newRole.trim()}
                  className="w-10 h-10 rounded-xl bg-[#1E4D6B] text-white flex items-center justify-center hover:bg-[#236181] transition-all disabled:opacity-40"
                >
                  <Plus weight="bold" className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                {roles.map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-3 bg-[#F8FAFC] border border-[#E8EFF4] rounded-xl group transition-all hover:border-red-100">
                    <span className="text-[13px] font-bold text-[#1E3A5F]">{r.name}</span>
                    <button onClick={() => deleteRole(r.id)} className="p-1.5 text-[#9AADB8] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                      <Trash weight="duotone" className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {roles.length === 0 && <p className="text-center py-4 text-[12px] text-[#9AADB8] font-medium">Belum ada jabatan.</p>}
              </div>
            </div>
          </SectionCard>

          {/* ── Danger Zone ── */}
          <div className="lg:col-span-2 mt-4">
            <Card className="rounded-[2.5rem] shadow-[0_8px_30px_rgb(220,38,38,0.06)] border border-red-100 bg-red-50/50 backdrop-blur-xl p-10">
              <div className="flex items-center gap-5 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                  <Trash weight="duotone" className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h2 className="font-bold text-red-600 text-[1.4rem]">Zona Berbahaya</h2>
                  <p className="text-[14px] text-[#5A7A8C] font-medium mt-1">
                    Tindakan di bawah ini bersifat permanen dan tidak dapat dibatalkan.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-5 bg-white/60 p-6 rounded-2xl border border-white">
                <input
                  value={dangerConfirm}
                  onChange={(e) => setDangerConfirm(e.target.value)}
                  placeholder='Ketik "HAPUS" untuk konfirmasi riset...'
                  className="flex-1 px-5 py-3.5 border border-red-200 rounded-xl text-[13px] font-bold text-[#1E3A5F] focus:outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100 transition-all bg-white shadow-[0_4px_20px_rgb(0,0,0,0.02)] w-full"
                />
                <button
                  onClick={handleDeleteAllData}
                  disabled={dangerConfirm !== 'HAPUS'}
                  className="flex items-center justify-center gap-2 px-8 py-3.5 bg-red-500 text-white rounded-xl text-[13px] font-bold hover:bg-red-600 transition-all shadow-md hover:shadow-lg disabled:opacity-40 disabled:hover:shadow-none w-full sm:w-auto shrink-0"
                >
                  <Trash weight="bold" className="w-4 h-4" /> Riset Semua Data Onboarding
                </button>
                <div className="w-full sm:w-[1px] h-[1px] sm:h-12 bg-red-100 shrink-0 mx-2" />
                <button
                  onClick={() => { if (confirm('Keluarkan semua sesi dan refresh aplikasi?')) location.reload(); }}
                  className="flex items-center justify-center gap-2 px-8 py-3.5 border-2 border-red-100 text-red-500 rounded-xl text-[13px] font-bold hover:bg-red-50 hover:border-red-200 transition-all shadow-sm w-full sm:w-auto shrink-0 bg-white"
                >
                  <ArrowsClockwise weight="duotone" className="w-4 h-4" /> Refresh Portal
                </button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
