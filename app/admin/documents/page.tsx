'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { UploadCloud, Search, FileText, Trash2, Eye, X, ChevronDown, CheckCircle, Clock, XCircle } from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────

const DEPARTMENTS = [
  'Engineering', 'Product', 'Design', 'Marketing',
  'Finance', 'HR', 'Operations', 'Sales', 'Legal',
];

interface Document {
  id: string;
  name: string;
  department: string | null;
  cloudinary_url: string;
  created_at: string;
  status: 'indexed' | 'processing' | 'failed' | string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { label: string; color: string; dot: string }> = {
  indexed:    { label: 'Terindeks',  color: 'text-[#22C55E] bg-[#22C55E]/5', dot: 'bg-[#22C55E] shadow-[0_0_8px_#22C55E]' },
  processing: { label: 'Memproses',  color: 'text-primary bg-primary/5',      dot: 'bg-primary animate-pulse' },
  failed:     { label: 'Gagal',      color: 'text-red-500 bg-red-50',         dot: 'bg-red-500' },
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

// ─── Upload Modal ────────────────────────────────────────────────────────────

function UploadModal({
  onClose,
  onUploaded,
}: {
  onClose: () => void;
  onUploaded: () => void;
}) {
  const [step, setStep] = useState<'file' | 'form'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [docName, setDocName] = useState('');
  const [department, setDepartment] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setDocName(f.name.replace(/\.[^/.]+$/, ''));
    setStep('form');
  }

  async function handleConfirm() {
    if (!file || !docName.trim()) return setError('Nama dokumen wajib diisi.');

    setUploading(true);
    setError('');

    try {
      // 1. Upload file to Cloudinary via Next.js API
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        throw new Error(uploadData.error || 'Gagal upload ke Cloudinary.');
      }
      const publicUrl = uploadData.secure_url;

      // 2. Insert document record into DB via API
      const dbRes = await fetch('/api/admin/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: docName.trim(),
          cloudinary_url: publicUrl,
          department: department || null,
        }),
      });
      
      const dbData = await dbRes.json();
      if (!dbRes.ok) throw new Error(dbData.error || 'Gagal menyimpan ke database.');
      const doc = dbData.document;

      // 3. Trigger ingest-document API
      await fetch('/api/ingest-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_id: doc.id, cloudinary_url: publicUrl }),
      });

      onUploaded();
      onClose();
    } catch (err: any) {
      setError(err.message ?? 'Terjadi kesalahan. Coba lagi.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-premium w-full max-w-md mx-4 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-neutral/10">
          <h2 className="font-bold text-[#1E3A5F] text-[1.1rem]">Unggah Dokumen</h2>
          <button onClick={onClose} className="text-[#9AADB8] hover:text-[#1E3A5F] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8">
          {step === 'file' ? (
            /* ── Step 1: File picker ── */
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-neutral/20 rounded-2xl p-12 flex flex-col items-center gap-4 hover:border-primary/40 transition-all group"
            >
              <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <UploadCloud className="w-7 h-7 text-[#1E4D6B]" />
              </div>
              <div className="text-center">
                <p className="font-bold text-[#1E3A5F] text-[14px] mb-1">Pilih atau seret file</p>
                <p className="text-[12px] text-[#5A7A8C]">PDF, DOCX, TXT — maks 20 MB</p>
              </div>
            </button>
          ) : (
            /* ── Step 2: Form ── */
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-3 p-4 bg-[#F8FAFC] rounded-2xl">
                <FileText className="w-5 h-5 text-[#1E4D6B] shrink-0" />
                <span className="text-[13px] font-bold text-[#1E3A5F] truncate flex-1">{file?.name}</span>
                <button onClick={() => { setFile(null); setStep('file'); }} className="text-[#9AADB8] hover:text-red-500 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#5A7A8C] uppercase tracking-wider mb-2 block">Nama Dokumen</label>
                <input
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  className="w-full px-4 py-3 border border-neutral/20 rounded-xl text-[13px] text-[#1E3A5F] font-medium focus:outline-none focus:border-[#1E4D6B] focus:ring-4 focus:ring-[#1E4D6B]/5 transition-all"
                  placeholder="Nama dokumen..."
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#5A7A8C] uppercase tracking-wider mb-2 block">Target Divisi (Opsional)</label>
                <div className="relative">
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full appearance-none px-4 py-3 border border-neutral/20 rounded-xl text-[13px] text-[#1E3A5F] font-medium focus:outline-none focus:border-[#1E4D6B] focus:ring-4 focus:ring-[#1E4D6B]/5 transition-all bg-white"
                  >
                    <option value="">Untuk Semua Divisi (Global)</option>
                    {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#9AADB8] absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
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
              disabled={uploading}
              className="flex-1 py-3 bg-[#1E4D6B] text-white rounded-xl text-[13px] font-bold hover:bg-[#236181] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {uploading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Mengunggah…</>
              ) : (
                <><UploadCloud className="w-4 h-4" /> Konfirmasi Upload</>
              )}
            </button>
          </div>
        )}
      </div>
      <input ref={fileRef} type="file" accept=".pdf,.docx,.txt,.doc" className="hidden" onChange={handleFileChange} />
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function DocumentsPage() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
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
    if (!confirm('Hapus dokumen ini?')) return;
    await fetch(`/api/admin/documents?id=${id}`, { method: 'DELETE' });
    setDocs((prev) => prev.filter((d) => d.id !== id));
  }

  const filtered = docs.filter((d) => {
    return !search || d.name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="flex flex-col w-full min-h-full bg-white">
      {/* Header */}
      <div className="relative bg-[#EBF4FA] px-10 pt-10 pb-20 overflow-hidden shrink-0">
        <div className="absolute top-[-50%] right-[-10%] w-[50%] h-[200%] bg-white rounded-full blur-3xl opacity-50 pointer-events-none" />
        <div className="relative z-10 max-w-[1200px] mx-auto w-full flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="max-w-xl">
            <h1 className="text-[2.2rem] font-bold text-[#1E3A5F] mb-3 tracking-tight">Dokumen Orientasi</h1>
            <p className="text-[#5A7A8C] leading-relaxed font-medium text-[15px]">
              Unggah dan kelola panduan perusahaan bagi karyawan baru.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-[#1E4D6B] text-white rounded-xl text-[13.5px] font-bold shadow-lg shadow-[#1E4D6B]/20 hover:bg-[#236181] transition-all active:scale-[0.98] shrink-0"
          >
            <UploadCloud className="w-4 h-4 stroke-[2.5]" />
            Unggah Dokumen
          </button>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto w-full px-10 pb-12">
        {/* Stat strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 -mt-10 relative z-20">
          {[
            { label: 'Memproses', count: docs.filter(d => d.status === 'processing').length, icon: Clock,         color: 'text-[#1E4D6B]',    bg: 'border-l-[#1E4D6B]' },
            { label: 'Terindeks', count: docs.filter(d => d.status === 'indexed').length,    icon: CheckCircle,   color: 'text-[#22C55E]',    bg: 'border-l-[#22C55E]' },
            { label: 'Gagal',     count: docs.filter(d => d.status === 'failed').length,     icon: XCircle,       color: 'text-red-500',      bg: 'border-l-red-400' },
          ].map((s) => (
            <Card key={s.label} className={`flex items-center gap-4 bg-white border border-[#E8EFF4] border-l-4 ${s.bg} py-5 px-6`}>
              <s.icon className={`w-7 h-7 ${s.color} shrink-0`} />
              <div>
                <div className="text-[1.8rem] font-bold text-[#1E3A5F] leading-none">{loading ? '…' : s.count}</div>
                <div className="text-[10px] font-bold text-[#5A7A8C] uppercase tracking-wider mt-1">{s.label}</div>
              </div>
            </Card>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center justify-end mt-8 mb-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9AADB8]" strokeWidth={2.5} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari dokumen..."
              className="pl-10 pr-4 py-2.5 text-[13px] bg-white border border-[#D8E8F0] rounded-xl focus:outline-none focus:border-[#1E4D6B] shadow-sm text-[#1E3A5F] placeholder:text-[#9AADB8] transition-all w-64"
            />
          </div>
        </div>

        {/* Documents Table */}
        <Card className="shadow-sm border border-[#E8EFF4] bg-white p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#E8EFF4] bg-[#F8FAFC]">
                  <th className="py-4 px-6 text-[10px] font-bold text-[#5A7A8C] uppercase tracking-wider">Nama Dokumen</th>
                  <th className="py-4 px-6 text-[10px] font-bold text-[#5A7A8C] uppercase tracking-wider">Divisi</th>
                  <th className="py-4 px-6 text-[10px] font-bold text-[#5A7A8C] uppercase tracking-wider">Tanggal Unggah</th>
                  <th className="py-4 px-6 text-[10px] font-bold text-[#5A7A8C] uppercase tracking-wider">Status AI</th>
                  <th className="py-4 px-6 text-[10px] font-bold text-[#5A7A8C] uppercase tracking-wider text-right">Aksi</th>
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
                          <div className="w-9 h-9 bg-blue-50 text-[#1E4D6B] rounded-xl flex items-center justify-center text-[10px] font-bold shrink-0 uppercase">
                            {doc.name.split('.').pop()?.slice(0, 3) ?? 'DOC'}
                          </div>
                          <span className="font-bold text-[13px] text-[#1E3A5F] max-w-[250px] truncate">{doc.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-[13px] text-[#5A7A8C]">
                        {doc.department ? (
                          <span className="font-bold text-[#1E4D6B] bg-[#EBF4FA] px-2.5 py-1 rounded-md text-[11px] uppercase tracking-wider">{doc.department}</span>
                        ) : 'Global (Semua)'}
                      </td>
                      <td className="py-4 px-6 text-[13px] text-[#5A7A8C]">
                        {new Date(doc.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-4 px-6">
                        <StatusBadge status={doc.status} />
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end gap-2">
                          <a href={doc.cloudinary_url} target="_blank" rel="noreferrer" className="p-2 rounded-lg hover:bg-blue-50 text-[#9AADB8] hover:text-[#1E4D6B] transition-all">
                            <Eye className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => handleDelete(doc.id)}
                            className="p-2 rounded-lg hover:bg-red-50 text-[#9AADB8] hover:text-red-500 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
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
        <UploadModal
          onClose={() => setShowModal(false)}
          onUploaded={fetchData}
        />
      )}
    </div>
  );
}
