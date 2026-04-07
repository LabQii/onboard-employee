'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { CloudArrowUp, MagnifyingGlass, FileText, Trash, PencilSimple, Eye, X, CaretDown, CheckCircle, Clock, XCircle, Users } from '@phosphor-icons/react';

// ─── Types ─────────────────────────────────────────────────────────────────

interface Document {
  id: string;
  name: string;
  department: string | null;
  role: string | null;
  file_url: string;
  created_at: string;
  status: 'indexed' | 'processing' | 'failed' | string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { label: string; color: string; dot: string }> = {
  indexed: { label: 'Terindeks', color: 'text-[#22C55E] bg-[#22C55E]/5', dot: 'bg-[#22C55E] shadow-[0_0_8px_#22C55E]' },
  processing: { label: 'Memproses', color: 'text-primary bg-primary/5', dot: 'bg-primary animate-pulse' },
  failed: { label: 'Gagal', color: 'text-red-500 bg-red-50', dot: 'bg-red-500' },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? STATUS_MAP.processing;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full ${s.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

// ─── Document Modal (Create & Edit) ─────────────────────────────────────────

function DocModal({
  editDoc,
  onClose,
  onSuccess,
}: {
  editDoc?: Document;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [step, setStep] = useState<'file' | 'form'>(editDoc ? 'form' : 'file');
  const [file, setFile] = useState<File | null>(null);
  const [docName, setDocName] = useState(editDoc?.name || '');

  // Targeting
  const [targetType, setTargetType] = useState<'all' | 'dept' | 'role'>(
    editDoc?.role ? 'role' : editDoc?.department ? 'dept' : 'all'
  );
  const [department, setDepartment] = useState(editDoc?.department || '');
  const [role, setRole] = useState(editDoc?.role || '');

  const [phase, setPhase] = useState('Hari');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [deps, setDeps] = useState<{ id: string, name: string }[]>([]);
  const [roles, setRoles] = useState<{ id: string, name: string }[]>([]);

  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/admin/departments').then(res => res.json()).then(data => setDeps(data.departments || []));
    fetch('/api/admin/roles').then(res => res.json()).then(data => setRoles(data.roles || []));
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setDocName(f.name.replace(/\.[^/.]+$/, ''));
    setStep('form');
  }

  async function handleConfirm() {
    if (!docName.trim()) return setError('Nama dokumen wajib diisi.');
    if (!editDoc && !file) return setError('File dokumen wajib diunggah.');
    if (targetType === 'dept' && !department) return setError('Silakan pilih divisi.');
    if (targetType === 'role' && !role) return setError('Silakan pilih jabatan.');

    setLoading(true);
    setError('');

    try {
      const payload = {
        name: docName.trim(),
        department: targetType === 'dept' ? department : null,
        role: targetType === 'role' ? role : null,
        phase: phase,
      };

      if (editDoc) {
        // Edit mode
        const res = await fetch('/api/admin/documents', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editDoc.id,
            ...payload,
            file_url: editDoc.file_url,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Gagal mengubah dokumen.');
      } else {
        // Create mode
        const formData = new FormData();
        formData.append('file', file!);
        formData.append('name', payload.name);
        if (payload.department) formData.append('department', payload.department);
        if (payload.role) formData.append('role', payload.role);
        formData.append('phase', payload.phase);

        const uploadRes = await fetch('/api/documents/upload', {
          method: 'POST',
          body: formData,
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || 'Gagal menyimpan dan memproses dokumen.');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message ?? 'Terjadi kesalahan. Coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-premium w-full max-w-md mx-4 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-neutral/10">
          <h2 className="font-bold text-[#1E3A5F] text-[1.1rem]">
            {editDoc ? 'Edit Dokumen' : 'Unggah Dokumen'}
          </h2>
          <button onClick={onClose} className="text-[#9AADB8] hover:text-[#1E3A5F] transition-colors">
            <X weight="duotone" className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8">
          {step === 'file' ? (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-neutral/20 rounded-2xl p-12 flex flex-col items-center gap-4 hover:border-primary/40 transition-all group"
            >
              <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CloudArrowUp weight="duotone" className="w-8 h-8 text-[#1E4D6B]" />
              </div>
              <div className="text-center">
                <p className="font-bold text-[#1E3A5F] text-[14px] mb-1">Pilih atau seret file</p>
                <p className="text-[12px] text-[#5A7A8C]">PDF, DOCX, TXT — maks 20 MB</p>
              </div>
            </button>
          ) : (
            <div className="flex flex-col gap-5 text-left">
              {!editDoc && file && (
                <div className="flex items-center gap-3 p-4 bg-[#F8FAFC] rounded-2xl">
                  <FileText weight="duotone" className="w-5 h-5 text-[#1E4D6B] shrink-0" />
                  <span className="text-[13px] font-bold text-[#1E3A5F] truncate flex-1">{file.name}</span>
                  <button onClick={() => { setFile(null); setStep('file'); }} className="text-[#9AADB8] hover:text-red-500 transition-colors">
                    <X weight="duotone" className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-[#5A7A8C] uppercase tracking-wider mb-2 block">Nama Dokumen</label>
                <input
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  className="w-full px-4 py-3 border border-neutral/20 rounded-xl text-[13px] text-[#1E3A5F] font-medium focus:outline-none focus:border-[#1E4D6B] transition-all bg-white"
                  placeholder="Nama dokumen..."
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#5A7A8C] uppercase tracking-wider mb-2 block">Kirimkan Ke</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'all', label: 'Semua' },
                    { id: 'dept', label: 'Divisi' },
                    { id: 'role', label: 'Jabatan' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTargetType(t.id as any)}
                      className={`py-2 px-1 rounded-xl text-[11px] font-bold border transition-all ${targetType === t.id
                          ? 'bg-[#1E4D6B] text-white border-[#1E4D6B] shadow-md shadow-[#1E4D6B]/20'
                          : 'bg-white text-[#5A7A8C] border-neutral/10 hover:border-[#1E4D6B]/30'
                        }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {targetType === 'dept' && (
                <div>
                  <label className="text-[11px] font-bold text-[#5A7A8C] uppercase tracking-wider mb-2 block">Pilih Divisi</label>
                  <div className="relative">
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full appearance-none px-4 py-3 border border-neutral/20 rounded-xl text-[13px] text-[#1E3A5F] font-medium focus:outline-none focus:border-[#1E4D6B] bg-white transition-all"
                    >
                      <option value="">-- Pilih Divisi --</option>
                      {deps.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
                    </select>
                    <CaretDown weight="duotone" className="w-4 h-4 text-[#9AADB8] absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              )}

              {targetType === 'role' && (
                <div>
                  <label className="text-[11px] font-bold text-[#5A7A8C] uppercase tracking-wider mb-2 block">Pilih Jabatan</label>
                  <div className="relative">
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full appearance-none px-4 py-3 border border-neutral/20 rounded-xl text-[13px] text-[#1E3A5F] font-medium focus:outline-none focus:border-[#1E4D6B] bg-white transition-all"
                    >
                      <option value="">-- Pilih Jabatan --</option>
                      {roles.map((r) => <option key={r.id} value={r.name}>{r.name}</option>)}
                    </select>
                    <CaretDown weight="duotone" className="w-4 h-4 text-[#9AADB8] absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-[#5A7A8C] uppercase tracking-wider mb-2 block">Fase Onboarding</label>
                <div className="relative">
                  <select
                    value={phase}
                    onChange={(e) => setPhase(e.target.value)}
                    className="w-full appearance-none px-4 py-3 border border-neutral/20 rounded-xl text-[13px] text-[#1E3A5F] font-medium focus:outline-none focus:border-[#1E4D6B] bg-white transition-all"
                  >
                    <option value="Hari">Hari</option>
                    <option value="Minggu">Minggu</option>
                    <option value="Bulan">Bulan</option>
                  </select>
                  <CaretDown weight="duotone" className="w-4 h-4 text-[#9AADB8] absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {error && <p className="text-[12px] text-red-500 font-medium">{error}</p>}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {step === 'form' && (
          <div className="px-8 pb-8 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 border border-neutral/20 rounded-xl text-[13px] font-bold text-[#5A7A8C] hover:bg-[#F8FAFC] transition-all"
            >
              Batal
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 py-3 bg-[#1E4D6B] text-white rounded-xl text-[13px] font-bold hover:bg-[#236181] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Menyimpan…</>
              ) : (
                <><CheckCircle weight="duotone" className="w-4 h-4" /> Simpan</>
              )}
            </button>
          </div>
        )}
      </div>
      {!editDoc && <input ref={fileRef} type="file" accept=".pdf,.docx,.txt,.doc" className="hidden" onChange={handleFileChange} />}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function DocumentsPage() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editDoc, setEditDoc] = useState<Document | undefined>();
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/documents');
      const data = await res.json();
      setDocs(data.documents || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  async function handleDelete(id: string) {
    if (!confirm('Hapus dokumen ini? (Juga akan menghapus tugas onboarding terkait)')) return;
    await fetch(`/api/documents/delete`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    setDocs((prev) => prev.filter((d) => d.id !== id));
  }

  const filtered = docs.filter((d) => {
    return !search || d.name.toLowerCase().includes(search.toLowerCase());
  });

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
              Dokumen Orientasi
            </h1>
            <p className="text-[#6B7280] text-[15px] font-medium leading-relaxed max-w-lg">
              Unggah dan kelola panduan perusahaan bagi karyawan baru
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-3 shrink-0 flex-wrap justify-end">
            <button
              onClick={() => { setEditDoc(undefined); setShowModal(true); }}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#1E3A5F] hover:bg-[#152e4d] shadow-sm transition-all text-white font-bold text-[13.5px]"
            >
              <CloudArrowUp weight="duotone" className="w-5 h-5 text-white/90" /> Unggah Dokumen
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto w-full px-10 pb-12">
        {/* Stat strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-20">
          {[
            { label: 'Prospek AI', count: docs.filter(d => d.status === 'processing').length, icon: Clock, color: 'text-[#276087]', bg: 'bg-[#E8EFF4]' },
            { label: 'Terindeks', count: docs.filter(d => d.status === 'indexed').length, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Gagal', count: docs.filter(d => d.status === 'failed').length, icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
          ].map((s) => (
            <Card key={s.label} className="bg-white/70 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex items-center gap-5 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all cursor-pointer p-6 shrink-0">
              <div className={`w-[60px] h-[60px] rounded-2xl flex items-center justify-center shrink-0 ${s.bg} ${s.color}`}>
                <s.icon weight="duotone" className="w-7 h-7" />
              </div>
              <div>
                <div className="text-[10px] text-[#9AADB8] font-bold mb-1 tracking-[0.15em] uppercase">{s.label}</div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-[1.8rem] text-[#1E3A5F] leading-none">{loading ? '…' : s.count}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-10 mb-6">
          <h2 className="text-[1.4rem] font-bold text-[#1E3A5F] tracking-tight">Koleksi Dokumen</h2>
          <div className="relative">
            <MagnifyingGlass weight="duotone" className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9AADB8]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari dokumen..."
              className="pl-10 pr-4 py-2.5 text-[13px] bg-white/70 backdrop-blur-xl border border-white rounded-xl focus:outline-none focus:border-[#1E4D6B] shadow-[0_4px_20px_rgb(0,0,0,0.02)] text-[#1E3A5F] placeholder:text-[#9AADB8] transition-all w-full sm:w-64 font-medium"
            />
          </div>
        </div>

        {/* Documents Table */}
        <Card className="shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-white bg-white/70 backdrop-blur-xl p-0 overflow-hidden rounded-3xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#E8EFF4] bg-[#F8FAFC]">
                  <th className="py-4 px-6 text-[10px] font-bold text-[#5A7A8C] uppercase tracking-[0.15em]">Nama Dokumen</th>
                  <th className="py-4 px-6 text-[10px] font-bold text-[#5A7A8C] uppercase tracking-[0.15em]">Target</th>
                  <th className="py-4 px-6 text-[10px] font-bold text-[#5A7A8C] uppercase tracking-[0.15em]">Tanggal Unggah</th>
                  <th className="py-4 px-6 text-[10px] font-bold text-[#5A7A8C] uppercase tracking-[0.15em]">Status AI</th>
                  <th className="py-4 px-6 text-[10px] font-bold text-[#5A7A8C] uppercase tracking-[0.15em] text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="py-16 text-center text-[13px] text-[#5A7A8C]">Memuat dokumen…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={5} className="py-16 text-center text-[13px] text-[#5A7A8C]">Belum ada dokumen yang diunggah.</td></tr>
                ) : (
                  filtered.map((doc) => (
                    <tr key={doc.id} className="border-b border-[#E8EFF4] hover:bg-[#F8FAFC] transition-colors group">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-[#EBF4FA] text-[#1E4D6B] rounded-xl flex items-center justify-center text-[10px] font-bold shrink-0 uppercase">
                            {doc.name.split('.').pop()?.slice(0, 3) ?? 'DOC'}
                          </div>
                          <span className="font-bold text-[13.5px] text-[#1E3A5F] max-w-[250px] truncate">{doc.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-[13px] text-[#5A7A8C]">
                        {doc.department ? (
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-[#9AADB8] uppercase tracking-[0.15em]">DIVISI</span>
                            <span className="font-bold text-[#1E4D6B] bg-[#EBF4FA] px-2.5 py-1 rounded-lg text-[11px] w-fit mt-1">{doc.department}</span>
                          </div>
                        ) : doc.role ? (
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-[#9AADB8] uppercase tracking-[0.15em]">JABATAN</span>
                            <span className="font-bold text-[#276087] bg-[#E8EFF4] px-2.5 py-1 rounded-lg text-[11px] w-fit mt-1">{doc.role}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg tracking-widest uppercase">Semua Karyawan</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-[13px] text-[#5A7A8C]">
                        {new Date(doc.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-4 px-6">
                        <StatusBadge status={doc.status} />
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end gap-2">
                          <a href={doc.file_url} target="_blank" rel="noreferrer" className="p-2.5 rounded-xl hover:bg-[#EBF4FA] text-[#9AADB8] hover:text-[#1E4D6B] transition-all" title="Lihat">
                            <Eye weight="duotone" className="w-5 h-5" />
                          </a>
                          <button
                            onClick={() => { setEditDoc(doc); setShowModal(true); }}
                            className="p-2.5 rounded-xl hover:bg-[#EBF4FA] text-[#9AADB8] hover:text-[#1E4D6B] transition-all"
                            title="Edit"
                          >
                            <PencilSimple weight="duotone" className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(doc.id)}
                            className="p-2.5 rounded-xl hover:bg-red-50 text-[#9AADB8] hover:text-red-500 transition-all"
                            title="Hapus"
                          >
                            <Trash weight="duotone" className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {showModal && (
        <DocModal
          editDoc={editDoc}
          onClose={() => { setShowModal(false); setEditDoc(undefined); }}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
}
