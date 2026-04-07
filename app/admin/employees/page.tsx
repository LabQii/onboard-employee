'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import {
  Plus, MagnifyingGlass, X, CaretDown, DotsThreeVertical, CalendarBlank,
  Envelope, PencilSimple, Trash, ArrowsClockwise, CheckCircle, Clock, UserMinus
} from '@phosphor-icons/react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Employee {
  id: string;
  full_name: string;
  email: string;
  department: string | null;
  role: string | null;
  start_date: string | null;
  created_at: string;
  hasPassword?: boolean;
  progress?: number;
}

// ─── Invite / Edit Modal ──────────────────────────────────────────────────────

function EmployeeModal({
  mode,
  initial,
  onClose,
  onSaved,
}: {
  mode: 'create' | 'edit';
  initial?: Partial<Employee>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [fullName, setFullName] = useState(initial?.full_name ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [department, setDepartment] = useState(initial?.department ?? '');
  const [role, setRole] = useState(initial?.role ?? '');
  const [startDate, setStartDate] = useState(initial?.start_date?.slice(0, 10) ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [deps, setDeps] = useState<{id: string, name: string}[]>([]);
  const [roles, setRoles] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    fetch('/api/admin/departments').then(res => res.json()).then(data => setDeps(data.departments || []));
    fetch('/api/admin/roles').then(res => res.json()).then(data => setRoles(data.roles || []));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) { setError('Nama dan email wajib diisi.'); return; }
    setLoading(true); setError('');

    const body = mode === 'create'
      ? { fullName, email, department, role, startDate }
      : { id: initial?.id, fullName, email, department, role, startDate };

    const res = await fetch('/api/admin/employees', {
      method: mode === 'create' ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || 'Terjadi kesalahan.'); setLoading(false); return; }
    onSaved(); onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-8 py-6 border-b border-[#E8EFF4]">
          <h2 className="font-bold text-[#1E3A5F] text-[1.1rem]">
            {mode === 'create' ? 'Undang Karyawan Baru' : 'Edit Data Karyawan'}
          </h2>
          <button onClick={onClose} className="text-[#9AADB8] hover:text-[#1E3A5F] transition-colors">
            <X weight="duotone" className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 flex flex-col gap-4">
          {/* Nama */}
          <div>
            <label className="text-[11px] font-bold text-[#5A7A8C] uppercase tracking-wider mb-1.5 block">Nama Lengkap</label>
            <input value={fullName} onChange={e => setFullName(e.target.value)} required
              placeholder="Nama lengkap karyawan..."
              className="w-full px-4 py-3 border border-[#D8E8F0] rounded-xl text-[13px] text-[#1E3A5F] font-medium focus:outline-none focus:border-[#1E4D6B] transition-all bg-white" />
          </div>

          {/* Email */}
          <div>
            <label className="text-[11px] font-bold text-[#5A7A8C] uppercase tracking-wider mb-1.5 block">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="email@perusahaan.com"
              disabled={mode === 'edit'}
              className="w-full px-4 py-3 border border-[#D8E8F0] rounded-xl text-[13px] text-[#1E3A5F] font-medium focus:outline-none focus:border-[#1E4D6B] transition-all disabled:bg-[#F8FAFC] disabled:text-[#9AADB8] bg-white" />
          </div>

          {/* Divisi */}
          <div>
            <label className="text-[11px] font-bold text-[#5A7A8C] uppercase tracking-wider mb-1.5 block">Divisi</label>
            <div className="relative">
              <select value={department} onChange={e => setDepartment(e.target.value)}
                className="w-full appearance-none px-4 py-3 border border-[#D8E8F0] rounded-xl text-[13px] text-[#1E3A5F] font-medium focus:outline-none focus:border-[#1E4D6B] transition-all bg-white">
                <option value="">Pilih divisi...</option>
                {deps.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
              </select>
              <CaretDown weight="duotone" className="w-4 h-4 text-[#9AADB8] absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Jabatan */}
          <div>
            <label className="text-[11px] font-bold text-[#5A7A8C] uppercase tracking-wider mb-1.5 block">Jabatan</label>
            <div className="relative">
              <select value={role} onChange={e => setRole(e.target.value)}
                className="w-full appearance-none px-4 py-3 border border-[#D8E8F0] rounded-xl text-[13px] text-[#1E3A5F] font-medium focus:outline-none focus:border-[#1E4D6B] transition-all bg-white">
                <option value="">Pilih jabatan...</option>
                {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
              </select>
              <CaretDown weight="duotone" className="w-4 h-4 text-[#9AADB8] absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Tanggal Mulai */}
          <div>
            <label className="text-[11px] font-bold text-[#5A7A8C] uppercase tracking-wider mb-1.5 block">Tanggal Mulai</label>
            <div className="relative">
              <CalendarBlank weight="duotone" className="w-4 h-4 text-[#9AADB8] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-[#D8E8F0] rounded-xl text-[13px] text-[#1E3A5F] font-medium focus:outline-none focus:border-[#1E4D6B] transition-all bg-white" />
            </div>
          </div>

          {error && <p className="text-[12px] text-red-500 font-medium bg-red-50 px-4 py-3 rounded-xl">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 border border-[#D8E8F0] rounded-xl text-[13px] font-bold text-[#5A7A8C] hover:bg-[#F8FAFC] transition-all">
              Batal
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-3 bg-[#1E4D6B] text-white rounded-xl text-[13px] font-bold hover:bg-[#236181] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Memproses…</>
                : mode === 'create' ? 'Kirim Undangan' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

function DeleteModal({ emp, onClose, onDeleted }: { emp: Employee; onClose: () => void; onDeleted: () => void }) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    await fetch(`/api/admin/employees?id=${emp.id}`, { method: 'DELETE' });
    onDeleted(); onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center">
        <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
          <Trash weight="duotone" className="w-7 h-7 text-red-500" />
        </div>
        <h2 className="font-bold text-[#1E3A5F] text-[1.1rem] mb-2">Hapus Karyawan?</h2>
        <p className="text-[13px] text-[#5A7A8C] mb-6 leading-relaxed">
          Anda akan menghapus <strong>{emp.full_name}</strong>.<br />
          Data ini tidak dapat dikembalikan.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-3 border border-[#D8E8F0] rounded-xl text-[13px] font-bold text-[#5A7A8C] hover:bg-[#F8FAFC] transition-all">
            Batal
          </button>
          <button onClick={handleDelete} disabled={loading}
            className="flex-1 py-3 bg-red-500 text-white rounded-xl text-[13px] font-bold hover:bg-red-600 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Trash weight="bold" className="w-4 h-4" />}
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Employee Card ─────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  'bg-[#1E4D6B]/10 text-[#1E4D6B]',
  'bg-amber-100 text-amber-700',
  'bg-emerald-100 text-emerald-700',
  'bg-purple-100 text-purple-700',
  'bg-rose-100 text-rose-700',
];

function EmployeeCard({
  emp, index,
  onEdit, onDelete, onResend,
}: {
  emp: Employee; index: number;
  onEdit: () => void; onDelete: () => void; onResend: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const initials = (emp.full_name ?? '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const colorClass = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const progress = emp.progress ?? 0;
  const hasActivated = !!emp.hasPassword;

  async function handleResend() {
    setResendLoading(true);
    await fetch('/api/admin/employees', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: emp.id }),
    });
    setResendLoading(false);
    setMenuOpen(false);
    onResend();
  }

  return (
    <Card className="flex flex-col relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-white bg-white/70 backdrop-blur-xl rounded-[2rem] p-7">
      {/* Menu */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={() => setMenuOpen(v => !v)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9AADB8] hover:bg-[#F0F7FB] hover:text-[#1E4D6B] transition-all opacity-0 group-hover:opacity-100"
        >
          <DotsThreeVertical weight="bold" className="w-5 h-5" />
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-9 z-20 bg-white border border-[#E8EFF4] rounded-xl shadow-lg py-1 w-44 overflow-hidden">
              <button onClick={() => { onEdit(); setMenuOpen(false); }}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-[13px] font-semibold text-[#1E3A5F] hover:bg-[#F0F7FB] transition-colors">
                <PencilSimple weight="duotone" className="w-4 h-4" /> Edit Data
              </button>
              {!hasActivated && (
                <button onClick={handleResend} disabled={resendLoading}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-[13px] font-semibold text-[#1E4D6B] hover:bg-[#F0F7FB] transition-colors">
                  {resendLoading ? <span className="w-3.5 h-3.5 border-2 border-[#1E4D6B]/30 border-t-[#1E4D6B] rounded-full animate-spin" /> : <ArrowsClockwise weight="bold" className="w-4 h-4" />}
                  Kirim Ulang
                </button>
              )}
              <hr className="my-1 border-[#E8EFF4]" />
              <button onClick={() => { onDelete(); setMenuOpen(false); }}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-[13px] font-semibold text-red-500 hover:bg-red-50 transition-colors">
                <Trash weight="duotone" className="w-4 h-4" /> Hapus
              </button>
            </div>
          </>
        )}
      </div>

      {/* Avatar & info */}
      <div className="flex flex-col items-center text-center mt-2 mb-6">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-xl mb-4 ${colorClass} ring-4 ring-white shadow-sm`}>
          {initials}
        </div>
        <h3 className="font-bold text-[1rem] text-[#1E3A5F] leading-tight mb-1">{emp.full_name}</h3>
        <p className="text-[12px] font-semibold text-[#5A7A8C] mb-1">{emp.role || '—'}</p>
        {emp.department && (
          <span className="text-[10px] uppercase tracking-[0.15em] font-bold text-[#1E4D6B] bg-[#EBF4FA] px-2.5 py-0.5 rounded-full">
            {emp.department}
          </span>
        )}
      </div>

      {/* Email */}
      <div className="flex items-center gap-2 mb-4 justify-center">
        <Envelope weight="duotone" className="w-4 h-4 text-[#9AADB8]" />
        <span className="text-[11px] text-[#5A7A8C] truncate max-w-[180px]">{emp.email}</span>
      </div>

      {/* Status aktivasi */}
      <div className="flex items-center justify-center gap-2 mb-4">
        {hasActivated ? (
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
            <CheckCircle weight="fill" className="w-3.5 h-3.5" /> Aktif
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
            <Clock weight="duotone" className="w-3.5 h-3.5" /> Menunggu Aktivasi
          </span>
        )}
      </div>

      {/* Progress */}
      <div className="mt-auto w-full border-t border-[#E8EFF4] pt-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[11px] font-bold text-[#9AADB8]">Progress Checklist</span>
          <span className={`text-[11px] font-bold ${progress === 100 ? 'text-emerald-500' : 'text-[#1E4D6B]'}`}>{progress}%</span>
        </div>
        <div className="w-full h-1.5 bg-[#E8EFF4] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${progress === 100 ? 'bg-emerald-500' : 'bg-[#1E4D6B]'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        {emp.start_date && (
          <p className="text-[10px] text-[#9AADB8] mt-2 text-center">
            Mulai: {new Date(emp.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        )}
      </div>
    </Card>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<Employee | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [toast, setToast] = useState('');

  const [deps, setDeps] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    fetch('/api/admin/departments').then(res => res.json()).then(data => setDeps(data.departments || []));
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (filterDept) params.set('division', filterDept);
    const res = await fetch(`/api/admin/employees?${params}`);
    const data = await res.json();
    setEmployees(data.employees ?? []);
    setLoading(false);
  }, [search, filterDept]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  const stats = {
    total: employees.length,
    active: employees.filter(e => e.hasPassword).length,
    pending: employees.filter(e => !e.hasPassword).length,
  };

  return (
    <div className="flex flex-col w-full min-h-full">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-[#1E4D6B] text-white px-5 py-3 rounded-2xl shadow-lg text-[13px] font-bold flex items-center gap-2 animate-in slide-in-from-right-4">
          <CheckCircle weight="fill" className="w-4 h-4 text-green-300" /> {toast}
        </div>
      )}

      {/* ── Header ── */}
      <div className="max-w-[1200px] mx-auto w-full px-10 pt-12 pb-8">
        <div className="relative bg-white p-8 lg:p-10 overflow-hidden rounded-[2.5rem] border border-[#F3F4F6] shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col md:flex-row items-center justify-between gap-10">
          
          {/* Subtle Blue Dots Decoration */}
          <div className="absolute top-0 right-0 w-[400px] h-[400px] opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#1E4D6B 2px, transparent 2px)', backgroundSize: '24px 24px' }} />
          <div className="absolute top-[-20%] right-[10%] w-[30%] h-[150%] bg-[#E8F2F9] rounded-full blur-3xl pointer-events-none opacity-60" />
          <div className="absolute bottom-[-50%] left-[-10%] w-[30%] h-[150%] bg-[#DCECF5] rounded-full blur-3xl pointer-events-none opacity-40" />

          <div className="relative z-10 flex-1 min-w-[280px]">
            <h1 className="text-[2.2rem] lg:text-[2.4rem] font-extrabold text-[#111827] mb-2 tracking-tight leading-tight">
              Karyawan
            </h1>
            <p className="text-[#6B7280] text-[15px] font-medium leading-relaxed max-w-lg">
              Kelola data karyawan dan progres onboarding.
            </p>
            {/* Stats */}
            <div className="flex items-center gap-3 mt-5">
              <span className="text-[11px] font-bold bg-[#F3F4F6] text-[#6B7280] px-3 py-1.5 rounded-md border border-[#E5E7EB] uppercase tracking-widest shrink-0">
                {stats.total} Total
              </span>
              <span className="text-[11px] font-bold bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-md border border-emerald-100 uppercase tracking-widest shrink-0">
                {stats.active} Aktif
              </span>
              <span className="text-[11px] font-bold bg-amber-50 text-amber-700 px-3 py-1.5 rounded-md border border-amber-100 uppercase tracking-widest shrink-0">
                {stats.pending} Menunggu
              </span>
            </div>
          </div>
          
          <div className="relative z-10 shrink-0">
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#1E3A5F] hover:bg-[#152e4d] shadow-sm transition-all text-white font-bold text-[13.5px]"
            >
              <Plus weight="bold" className="w-4 h-4 text-white/90" /> Undang Karyawan
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto w-full px-10 pb-12">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10 mb-8 mt-2">
          <div className="relative">
            <CaretDown weight="duotone" className="w-4 h-4 text-[#9AADB8] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={filterDept}
              onChange={e => setFilterDept(e.target.value)}
              className="appearance-none bg-white/70 backdrop-blur-xl border border-white rounded-xl px-4 py-3 pr-10 text-[13px] font-bold text-[#1E3A5F] focus:outline-none focus:border-[#1E4D6B] shadow-[0_4px_20px_rgb(0,0,0,0.02)] transition-all sm:w-48"
            >
              <option value="">Semua Divisi</option>
              {deps.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
            </select>
          </div>
          <div className="relative w-full sm:w-auto">
            <MagnifyingGlass weight="duotone" className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9AADB8]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari karyawan..."
              className="pl-10 pr-4 py-3 w-full sm:w-64 text-[13px] font-medium bg-white/70 backdrop-blur-xl border border-white rounded-xl focus:outline-none focus:border-[#1E4D6B] shadow-[0_4px_20px_rgb(0,0,0,0.02)] text-[#1E3A5F] placeholder:text-[#9AADB8] transition-all"
            />
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 bg-white/50 backdrop-blur-md rounded-[2rem] border border-white shadow-sm animate-pulse" />
            ))}
          </div>
        ) : employees.length === 0 ? (
          <div className="text-center py-24 flex flex-col items-center gap-4">
            <div className="w-20 h-20 bg-[#E8EFF4] rounded-full flex items-center justify-center">
              <UserMinus weight="duotone" className="w-10 h-10 text-[#9AADB8]" />
            </div>
            <div className="text-[#5A7A8C] text-[14px] font-bold tracking-tight">Belum ada karyawan terdaftar.</div>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-2 inline-flex items-center gap-2 px-6 py-3 bg-[#1E4D6B] text-white rounded-2xl text-[13px] font-bold hover:bg-[#236181] shadow-md transition-all hover:-translate-y-0.5"
            >
              <Plus weight="bold" className="w-4 h-4" /> Undang Karyawan Pertama
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {employees.map((emp, i) => (
              <EmployeeCard
                key={emp.id}
                emp={emp}
                index={i}
                onEdit={() => setEditTarget(emp)}
                onDelete={() => setDeleteTarget(emp)}
                onResend={() => showToast(`Undangan dikirim ulang ke ${emp.email}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreate && (
        <EmployeeModal
          mode="create"
          onClose={() => setShowCreate(false)}
          onSaved={() => { fetchData(); showToast('Undangan berhasil dikirim!'); }}
        />
      )}
      {editTarget && (
        <EmployeeModal
          mode="edit"
          initial={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => { fetchData(); showToast('Data karyawan diperbarui.'); }}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          emp={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => { fetchData(); showToast('Karyawan berhasil dihapus.'); }}
        />
      )}
    </div>
  );
}
