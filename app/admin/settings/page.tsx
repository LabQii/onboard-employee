'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Building2, User, KeyRound, Trash2, RefreshCw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

// ─── Section Card ────────────────────────────────────────────────────────────

function SectionCard({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <Card className="shadow-soft border-none">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
          <Icon className="w-4 h-4 text-[#1E4D6B]" />
        </div>
        <h2 className="font-bold text-[#1E3A5F] text-[1rem]">{title}</h2>
      </div>
      {children}
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const supabase = createClient();

  // Company name
  const [companyName, setCompanyName] = useState('OnboardFlow');
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

  useEffect(() => {
    // Fetch current admin profile from DB
    supabase.from('profiles').select('email, full_name').eq('is_admin', true).limit(1).then(({ data }) => {
      if (data?.[0]) {
        setAdminName(data[0].full_name ?? '');
        setAdminEmail(data[0].email ?? '');
      }
    });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      {/* Header */}
      <div className="relative bg-[#EBF4FA] px-10 pt-10 pb-20 overflow-hidden shrink-0">
        <div className="absolute top-[-50%] right-[-10%] w-[50%] h-[200%] bg-white rounded-full blur-3xl opacity-50 pointer-events-none" />
        <div className="relative z-10 max-w-[1200px] mx-auto w-full">
          <h1 className="text-[2.2rem] font-bold text-[#1E3A5F] mb-3 tracking-tight">Pengaturan</h1>
          <p className="text-[#5A7A8C] leading-relaxed font-medium text-[15px]">
            Konfigurasi portal, kelola aplikasi, dan atur profil admin.
          </p>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto w-full px-10 pb-12 mt-8 z-10 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 -mt-16">
          {/* ── Company Name ── */}
          <SectionCard icon={Building2} title="Nama Perusahaan">
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
          <SectionCard icon={User} title="Profil Admin">
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-[11px] font-bold text-[#5A7A8C] uppercase tracking-wider mb-1.5 block">Nama</label>
                <input
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full px-4 py-3 border border-[#E8EFF4] rounded-xl text-[13px] font-medium text-[#1E3A5F] focus:outline-none focus:border-[#1E4D6B] focus:ring-4 focus:ring-[#1E4D6B]/5 transition-all bg-white"
                  placeholder="Nama admin..."
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#5A7A8C] uppercase tracking-wider mb-1.5 block">Email</label>
                <input
                  value={adminEmail}
                  disabled
                  className="w-full px-4 py-3 border border-transparent rounded-xl text-[13px] font-medium text-[#5A7A8C] bg-[#F8FAFC] cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#5A7A8C] uppercase tracking-wider mb-1.5 flex items-center gap-2">
                  <KeyRound className="w-3 h-3" /> Password Baru
                  <span className="font-medium normal-case text-[#5A7A8C]/50">(kosongkan jika tidak diubah)</span>
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-[#E8EFF4] rounded-xl text-[13px] font-medium text-[#1E3A5F] focus:outline-none focus:border-[#1E4D6B] focus:ring-4 focus:ring-[#1E4D6B]/5 transition-all bg-white"
                  placeholder="Masukkan password baru..."
                />
              </div>
              <button
                onClick={saveProfile}
                disabled={savingProfile}
                className={`py-3 rounded-xl text-[13px] font-bold transition-all ${
                  profileSaved ? 'bg-[#22C55E] text-white' : 'bg-[#1E4D6B] text-white hover:bg-[#236181]'
                } disabled:opacity-60`}
              >
                {savingProfile ? 'Menyimpan…' : profileSaved ? '✓ Tersimpan' : 'Simpan Profil'}
              </button>
            </div>
          </SectionCard>

          {/* ── Danger Zone ── */}
          <div className="lg:col-span-2">
            <Card className="border-2 border-red-100 shadow-none bg-red-50">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
                  <Trash2 className="w-4 h-4 text-red-500" />
                </div>
                <h2 className="font-bold text-red-600 text-[1rem]">Zona Berbahaya</h2>
              </div>
              <p className="text-[12px] text-[#5A7A8C] font-medium mb-6">
                Tindakan di bawah ini bersifat permanen dan tidak dapat dibatalkan.
                Ketik <strong>HAPUS</strong> untuk mengaktifkan tombol hapus data.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  value={dangerConfirm}
                  onChange={(e) => setDangerConfirm(e.target.value)}
                  placeholder='Ketik "HAPUS" untuk konfirmasi...'
                  className="flex-1 px-4 py-3 border border-red-200 rounded-xl text-[13px] text-[#1E3A5F] focus:outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100 transition-all bg-white"
                />
                <button
                  onClick={handleDeleteAllData}
                  disabled={dangerConfirm !== 'HAPUS'}
                  className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-xl text-[13px] font-bold hover:bg-red-600 transition-all disabled:opacity-40 shrink-0"
                >
                  <Trash2 className="w-4 h-4" /> Hapus Semua Data Onboarding
                </button>
                <button
                  onClick={() => { if (confirm('Keluarkan semua sesi dan refresh aplikasi?')) location.reload(); }}
                  className="flex items-center gap-2 px-6 py-3 border border-red-200 text-red-500 rounded-xl text-[13px] font-bold hover:bg-red-100 transition-all shrink-0 bg-white"
                >
                  <RefreshCw className="w-4 h-4" /> Refresh Portal
                </button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
