'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Plus, Trash2, GripVertical, Save, ChevronRight, ListChecks } from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

const DEPARTMENTS = [
  'Engineering', 'Product', 'Design', 'Marketing',
  'Finance', 'HR', 'Operations', 'Sales', 'Legal',
];

type DueLabel = 'Hari 1' | 'Minggu 1' | 'Bulan 1';

interface TemplateTask {
  id: string;          
  task_name: string;
  description: string;
  due_label: DueLabel;
}

const DUE_LABELS: DueLabel[] = ['Hari 1', 'Minggu 1', 'Bulan 1'];

const DUE_LABEL_STYLE: Record<DueLabel, string> = {
  'Hari 1':   'bg-[#1E4D6B]/10 text-[#1E4D6B]',
  'Minggu 1': 'bg-[#A67B5B]/10 text-[#A67B5B]',
  'Bulan 1':  'bg-[#E5B67B]/20 text-[#B6817E]',
};

function uid() {
  return `new-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// ─── Task Row Component ──────────────────────────────────────────────────────

function TaskRow({
  task,
  onChange,
  onDelete,
}: {
  task: TemplateTask;
  onChange: (id: string, updates: Partial<TemplateTask>) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-2xl border border-neutral/10 bg-white hover:border-[#1E4D6B]/20 shadow-sm transition-all group">
      <button className="mt-1 cursor-grab text-neutral/30 hover:text-neutral transition-colors shrink-0">
        <GripVertical className="w-4 h-4" />
      </button>

      <div className="flex-1 grid grid-cols-1 sm:grid-cols-[1fr_220px_120px] gap-3">
        {/* Task name */}
        <input
          value={task.task_name}
          onChange={(e) => onChange(task.id, { task_name: e.target.value })}
          placeholder="Nama tugas..."
          className="px-3 py-2 border border-neutral/15 rounded-xl text-[13px] font-medium text-[#1E3A5F] focus:outline-none focus:border-[#1E4D6B] focus:ring-4 focus:ring-[#1E4D6B]/5 transition-all placeholder:text-[#9AADB8]"
        />
        {/* Description */}
        <input
          value={task.description}
          onChange={(e) => onChange(task.id, { description: e.target.value })}
          placeholder="Deskripsi (opsional)..."
          className="px-3 py-2 border border-neutral/15 rounded-xl text-[12px] text-[#1E3A5F] focus:outline-none focus:border-[#1E4D6B] focus:ring-4 focus:ring-[#1E4D6B]/5 transition-all placeholder:text-[#9AADB8]"
        />
        {/* Due label */}
        <div className="flex gap-1.5">
          {DUE_LABELS.map((label) => (
            <button
              key={label}
              onClick={() => onChange(task.id, { due_label: label })}
              className={`flex-1 py-2 rounded-xl text-[10px] font-bold border transition-all whitespace-nowrap ${
                task.due_label === label
                  ? `${DUE_LABEL_STYLE[label]} border-transparent shadow-sm`
                  : 'border-[#D8E8F0] text-[#5A7A8C] hover:border-[#1E4D6B]/30'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => onDelete(task.id)}
        className="mt-1 p-1.5 rounded-lg text-[#9AADB8] hover:text-red-500 hover:bg-red-50 transition-all shrink-0 opacity-0 group-hover:opacity-100"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ChecklistTemplatePage() {
  const [selectedDivId, setSelectedDivId] = useState<string>(DEPARTMENTS[0]);
  const [tasks, setTasks] = useState<TemplateTask[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load tasks whenever selected department changes
  const loadTasks = useCallback(async (dept: string) => {
    if (!dept) return;
    setLoading(true);
    const res = await fetch(`/api/admin/checklist?department=${encodeURIComponent(dept)}`);
    const { items } = await res.json();
    setTasks(
      (items ?? []).map((t: any) => ({
        id: t.id,
        task_name: t.title ?? '',
        description: t.description ?? '',
        due_label: (t.phase as DueLabel) ?? 'Hari 1',
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    if (selectedDivId) loadTasks(selectedDivId);
  }, [selectedDivId, loadTasks]);

  function handleAdd() {
    setTasks((prev) => [
      ...prev,
      {
        id: uid(),
        task_name: '',
        description: '',
        due_label: 'Hari 1',
      },
    ]);
  }

  function handleChange(id: string, updates: Partial<TemplateTask>) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  }

  function handleDelete(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  async function handleSave() {
    if (!selectedDivId || saving) return;
    setSaving(true);
    setSaved(false);

    try {
      const toInsert = tasks
        .filter((t) => t.task_name.trim())
        .map((t) => ({
          department:  selectedDivId,
          title:       t.task_name.trim(),
          description: t.description.trim() || null,
          phase:       t.due_label,
          priority:    'wajib',
        }));

      const res = await fetch('/api/admin/checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          department: selectedDivId,
          items: toInsert
        })
      });

      if (!res.ok) throw new Error('API failed');

      // Reload to get fresh IDs
      await loadTasks(selectedDivId);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  }

  // Group tasks by due_label for display
  const grouped = DUE_LABELS.reduce<Record<string, TemplateTask[]>>((acc, label) => {
    acc[label] = tasks.filter((t) => t.due_label === label);
    return acc;
  }, {} as Record<string, TemplateTask[]>);

  return (
    <div className="flex flex-col w-full min-h-full">
      {/* Header */}
      <div className="relative bg-[#EBF4FA] px-10 pt-10 pb-20 overflow-hidden shrink-0">
        <div className="absolute top-[-50%] right-[-10%] w-[50%] h-[200%] bg-white rounded-full blur-3xl opacity-50 pointer-events-none" />
        <div className="relative z-10 max-w-[1200px] mx-auto w-full flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="max-w-xl">
            <h1 className="text-[2.2rem] font-bold text-[#1E3A5F] mb-3 tracking-tight">Template Checklist</h1>
            <p className="text-[#5A7A8C] leading-relaxed font-medium text-[15px]">
              Tentukan tugas onboarding per divisi. Checklist ini akan menjadi panduan karyawan baru.
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || !selectedDivId}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[13.5px] font-bold shadow-soft transition-all active:scale-[0.98] shrink-0 ${
              saved
                ? 'bg-[#22C55E] text-white'
                : 'bg-[#1E4D6B] text-white hover:bg-[#236181]'
            } disabled:opacity-60`}
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4 stroke-[2.5]" />
            )}
            {saved ? 'Tersimpan!' : saving ? 'Menyimpan…' : 'Simpan Template'}
          </button>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto w-full px-10 pb-12 -mt-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
          {/* ── Left Panel: Division List ── */}
          <Card className="shadow-lg border border-[#E8EFF4] p-0 overflow-hidden h-fit lg:sticky lg:top-4 bg-white">
            <div className="px-4 pt-5 pb-3 border-b border-[#E8EFF4] bg-[#F8FAFC]">
              <div className="flex items-center gap-2 px-2">
                <ListChecks className="w-4 h-4 text-[#1E3A5F]" />
                <span className="text-[11px] font-bold text-[#5A7A8C] uppercase tracking-wider">Divisi</span>
              </div>
            </div>
            <nav className="p-2">
              {DEPARTMENTS.map((dept) => (
                <button
                  key={dept}
                  onClick={() => setSelectedDivId(dept)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-[13px] font-bold transition-all ${
                    selectedDivId === dept
                      ? 'bg-blue-50 text-[#1E4D6B]'
                      : 'text-[#5A7A8C] hover:text-[#1E3A5F] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <span>{dept}</span>
                  {selectedDivId === dept && <ChevronRight className="w-4 h-4" />}
                </button>
              ))}
            </nav>
          </Card>

          {/* ── Right Panel: Tasks ── */}
          <div className="flex flex-col gap-4">
            {!selectedDivId ? (
              <Card className="shadow-sm border border-[#E8EFF4] flex items-center justify-center py-24 bg-white">
                <p className="text-[#9AADB8] text-[13px]">Pilih divisi untuk mengelola checklist.</p>
              </Card>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-[1.4rem] font-bold text-[#1E3A5F] tracking-tight border-b border-[#D8E8F0] pb-2 inline-block">{selectedDivId}</h2>
                    <p className="text-[12px] text-[#5A7A8C] mt-1">{tasks.length} tugas • Checklist orientasi</p>
                  </div>
                </div>

                {loading ? (
                  <Card className="shadow-sm border border-[#E8EFF4] bg-white flex items-center justify-center py-24">
                     <span className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  </Card>
                ) : (
                  <>
                    {/* Group by due label */}
                    {DUE_LABELS.map((label) => (
                      <div key={label}>
                        <div className={`inline-flex items-center gap-2 text-[10px] font-bold px-3 py-1.5 rounded-xl uppercase tracking-wider mb-3 ${DUE_LABEL_STYLE[label]}`}>
                          {label}
                          <span className="opacity-60">({grouped[label].length})</span>
                        </div>

                        <div className="flex flex-col gap-2">
                          {grouped[label].length === 0 ? (
                            <div className="text-[12px] text-[#9AADB8] italic px-4 py-3 border border-dashed border-[#D8E8F0] bg-white rounded-2xl text-center">
                              Belum ada tugas untuk {label}
                            </div>
                          ) : (
                            grouped[label].map((task) => (
                              <TaskRow
                                key={task.id}
                                task={task}
                                onChange={handleChange}
                                onDelete={handleDelete}
                              />
                            ))
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Add Task */}
                    <button
                      onClick={handleAdd}
                      className="w-full py-4 border-2 border-dashed border-[#B5DBEC] bg-white rounded-2xl text-[13px] font-bold text-[#1E4D6B] hover:text-white hover:bg-[#1E4D6B] hover:border-[#1E4D6B] transition-all flex items-center justify-center gap-2 mt-4 shadow-sm"
                    >
                      <Plus className="w-4 h-4" /> Tambah Tugas Baru
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
