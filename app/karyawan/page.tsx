'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import {
  CheckSquare, FileText, Send, Bell, Bot, PhoneCall,
  Lock, Search, LogOut, CheckCircle2, Circle, User
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  department: string | null;
  role: string | null;
  start_date: string | null;
  avatar_url: string | null;
}

interface Document {
  id: string;
  name: string;
  cloudinary_url: string;
  department: string | null;
  created_at: string;
}

interface ChecklistItem {
  id: string;
  title: string;
  description: string | null;
  phase: string | null;
  priority: string | null;
  completed: boolean;
  completed_at: string | null;
}

interface Message { role: 'bot' | 'user'; text: string; }

const QUICK_QUESTIONS = ['Kapan gajian?', 'Cara klaim asuransi?', 'Kontak HR?'];

export default function EmployeeDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', text: 'Halo! Saya asisten onboarding Anda. Ada yang bisa saya bantu?' }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  // Fetch data
  useEffect(() => {
    async function load() {
      try {
        const [profileRes, checklistRes, docsRes] = await Promise.all([
          fetch('/api/karyawan/profile'),
          fetch('/api/karyawan/checklist'),
          fetch('/api/karyawan/documents'),
        ]);
        if (profileRes.status === 401) { router.push('/'); return; }
        const { profile: p } = await profileRes.json();
        const { items } = await checklistRes.json();
        const { documents } = await docsRes.json();
        
        setProfile(p);
        setChecklistItems(items ?? []);
        setDocuments(documents ?? []);
      } catch {
        router.push('/');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  // Scroll listener
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Toggle checklist
  const toggleItem = useCallback(async (itemId: string, current: boolean) => {
    // Optimistic update
    setChecklistItems(prev => prev.map(i => i.id === itemId ? { ...i, completed: !current } : i));
    await fetch('/api/karyawan/checklist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, completed: !current }),
    });
  }, []);

  // Logout
  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  }

  // Chat send
  async function sendChat(text: string) {
    if (!text.trim()) return;
    const userMsg: Message = { role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'bot', text: data.answer || 'Maaf, saya tidak bisa menjawab sekarang.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'bot', text: 'Koneksi bermasalah. Coba lagi.' }]);
    } finally {
      setChatLoading(false);
    }
  }

  // Stats
  const totalItems = checklistItems.length;
  const completedItems = checklistItems.filter(i => i.completed).length;
  const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  const remaining = totalItems - completedItems;

  // Group by phase
  const phases = Array.from(new Set(checklistItems.map(i => i.phase || 'Umum')));

  // Days since start
  const daysSinceStart = profile?.start_date
    ? Math.max(0, Math.floor((Date.now() - new Date(profile.start_date).getTime()) / 86400000))
    : 0;

  const initials = profile?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#1E4D6B]/20 border-t-[#1E4D6B] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC]">
      {/* Top Navbar */}
      <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/90 backdrop-blur-xl border-b border-[#E8EFF4] shadow-sm' : 'bg-[#F8FAFC]/80 backdrop-blur-sm'
      }`}>
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#1E4D6B] text-white font-bold text-[10px] rounded-lg flex items-center justify-center">OF</div>
            <h1 className="font-bold text-[1rem] text-[#1E3A5F] tracking-tight">OnboardFlow</h1>
          </div>

          {/* Tabs */}
          <div className="hidden md:flex items-center gap-8 text-[13px] font-bold text-[#5A7A8C] h-full">
             <div className="h-full relative px-2 flex items-center text-[#1E4D6B]">
               Dashboard Onboarding
               <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#1E4D6B] rounded-t-full" />
             </div>
          </div>

          {/* User */}
          <div className="flex items-center gap-4">
            <button className="relative text-[#5A7A8C] hover:text-[#1E4D6B] transition-colors">
              <Bell className="w-5 h-5 stroke-[2]" />
              <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-red-400 rounded-full" />
            </button>
            <div className="flex items-center gap-3 border-l border-[#E8EFF4] pl-4">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-bold text-[#1E3A5F] leading-tight">{profile?.full_name || '—'}</div>
                <div className="text-[10px] text-[#9AADB8] font-bold">{profile?.role || profile?.department || 'Karyawan'}</div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-[#EBF4FA] text-[#1E4D6B] flex items-center justify-center font-bold text-xs">
                {initials}
              </div>
            </div>
            <button onClick={handleLogout} title="Keluar"
              className="text-[#9AADB8] hover:text-red-500 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 pt-24 pb-12 w-full flex flex-col gap-8">
        {/* Welcome Block */}
        <div className="relative bg-[#EBF4FA] p-10 lg:p-14 overflow-hidden rounded-[2.5rem]">
          <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[140%] bg-white/40 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-xl">
            <h1 className="text-[2.5rem] font-bold text-[#1E3A5F] mb-2 tracking-tight leading-tight">
              Selamat Datang, {profile?.full_name?.split(' ')[0]}!
            </h1>
            <p className="text-[#5A7A8C] text-lg mb-8 font-medium">
              {daysSinceStart === 0 ? 'Hari pertama perjalanan Anda!' : `Hari ke-${daysSinceStart} di OnboardFlow`}
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="bg-white px-4 py-2 rounded-full text-[13px] font-bold text-[#1E3A5F] shadow-sm">
                📋 {profile?.department || 'Divisi belum ditentukan'}
              </div>
              {profile?.role && (
                <div className="bg-white px-4 py-2 rounded-full text-[13px] font-bold text-[#1E3A5F] shadow-sm">
                  💼 {profile.role}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Progress */}
          <Card className="flex items-center gap-5 hover:-translate-y-1 transition-all cursor-pointer">
            <div className="relative w-[68px] h-[68px] shrink-0">
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none" stroke="#E8EFF4" strokeWidth="3" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none" stroke="#1E4D6B" strokeWidth="3"
                  strokeDasharray={`${progress}, 100`} strokeLinecap="round" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center font-bold text-[15px] text-[#1E3A5F]">{progress}%</span>
            </div>
            <div>
              <div className="text-[10px] text-[#9AADB8] font-bold mb-1 tracking-[0.15em] uppercase">Progres Onboarding</div>
              <div className="font-bold text-[1.2rem] text-[#1E3A5F] tracking-tight">
                {progress === 100 ? 'Selesai! 🎉' : progress > 50 ? 'Hampir Selesai' : 'Sedang Berproses'}
              </div>
            </div>
          </Card>

          {/* Tasks remaining */}
          <Card className="flex items-center gap-5 hover:-translate-y-1 transition-all cursor-pointer">
            <div className="w-[68px] h-[68px] rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <CheckSquare className="w-7 h-7 stroke-[1.8]" />
            </div>
            <div>
              <div className="text-[10px] text-[#9AADB8] font-bold mb-1 tracking-[0.15em] uppercase">Tugas Tersisa</div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-[1.8rem] text-[#1E3A5F] leading-none">{remaining}</span>
                {remaining > 0 && (
                  <span className="text-[9px] font-bold bg-red-50 text-red-500 px-2 py-0.5 rounded-lg tracking-widest mt-1">BELUM SELESAI</span>
                )}
              </div>
            </div>
          </Card>

          {/* Completed */}
          <Card className="flex items-center gap-5 hover:-translate-y-1 transition-all cursor-pointer">
            <div className="w-[68px] h-[68px] rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-7 h-7 stroke-[1.8]" />
            </div>
            <div>
              <div className="text-[10px] text-[#9AADB8] font-bold mb-1 tracking-[0.15em] uppercase">Selesai</div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-[1.8rem] text-[#1E3A5F] leading-none">{completedItems}</span>
                <span className="text-[9px] font-bold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-lg tracking-widest mt-1">
                  dari {totalItems}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Content */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Dynamic Content */}
          <div className="flex-1 w-full flex flex-col gap-10">
            
            {/* Checklist Section */}
            <div className="flex flex-col gap-6">
              <h2 className="text-[1.3rem] font-bold text-[#1E3A5F] tracking-tight px-1">
                📋 Checklist Onboarding
              </h2>

            {totalItems === 0 ? (
              <Card className="py-16 text-center">
                <Lock className="w-8 h-8 text-[#C0CDD4] mx-auto mb-3" />
                <p className="text-[13px] text-[#9AADB8] font-medium">Belum ada checklist. Admin akan segera menambahkan.</p>
              </Card>
            ) : (
              phases.map(phase => {
                const phaseItems = checklistItems.filter(i => (i.phase || 'Umum') === phase);
                const pDone = phaseItems.filter(i => i.completed).length;
                const pPct = phaseItems.length > 0 ? Math.round((pDone / phaseItems.length) * 100) : 0;

                return (
                  <Card key={phase} className="p-8">
                    <div className="flex items-end justify-between mb-6">
                      <div>
                        <h3 className="font-bold text-[1.1rem] text-[#1E3A5F]">{phase}</h3>
                        <p className="text-[11px] font-bold text-[#9AADB8] mt-0.5">{pDone}/{phaseItems.length} selesai</p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 w-[40%]">
                        <span className="text-[11px] font-bold text-[#1E4D6B]">{pPct}%</span>
                        <div className="w-full h-1.5 bg-[#E8EFF4] rounded-full overflow-hidden">
                          <div className="h-full bg-[#1E4D6B] rounded-full transition-all duration-700" style={{ width: `${pPct}%` }} />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      {phaseItems.map(item => (
                        <button
                          key={item.id}
                          onClick={() => toggleItem(item.id, item.completed)}
                          className="flex items-center justify-between p-4 rounded-2xl hover:bg-[#F8FAFC] transition-all group focus:outline-none w-full text-left"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-5 h-5 rounded-lg flex items-center justify-center border-2 transition-all shrink-0 ${
                              item.completed
                                ? 'bg-[#1E4D6B] border-[#1E4D6B] text-white'
                                : 'border-[#C0CDD4] text-transparent group-hover:border-[#1E4D6B]'
                            }`}>
                              {item.completed
                                ? <CheckCircle2 className="w-3 h-3" />
                                : <Circle className="w-3 h-3" />}
                            </div>
                            <div className="text-left">
                              <span className={`font-bold text-[14px] block transition-all ${item.completed ? 'text-[#9AADB8] line-through' : 'text-[#1E3A5F]'}`}>
                                {item.title}
                              </span>
                              {item.description && (
                                <span className="text-[11px] text-[#9AADB8] font-medium">{item.description}</span>
                              )}
                            </div>
                          </div>
                          <span className={`text-[9px] font-bold px-3 py-1 rounded-lg tracking-[0.15em] shrink-0 ml-2 ${
                            item.priority === 'wajib'
                              ? 'bg-amber-50 text-amber-600'
                              : 'bg-[#EBF4FA] text-[#1E4D6B]'
                          }`}>
                            {(item.priority || 'opsional').toUpperCase()}
                          </span>
                        </button>
                      ))}
                    </div>
                  </Card>
                );
              })
            )}
            </div>

            {/* Documents Section */}
            <div className="flex flex-col gap-6">
              <h2 className="text-[1.3rem] font-bold text-[#1E3A5F] tracking-tight px-1 mt-4">
                📚 Dokumen Perusahaan
              </h2>
                
                {documents.length === 0 ? (
                  <Card className="py-16 text-center">
                    <FileText className="w-8 h-8 text-[#C0CDD4] mx-auto mb-3" />
                    <p className="text-[13px] text-[#9AADB8] font-medium">Belum ada dokumen yang tersedia untuk Anda.</p>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {documents.map((doc) => (
                      <Card key={doc.id} className="p-5 flex flex-col justify-between hover:border-[#1E4D6B]/30 hover:shadow-md transition-all group">
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-10 h-10 bg-blue-50 text-[#1E4D6B] rounded-xl flex items-center justify-center font-bold text-[10px] uppercase shrink-0">
                            {doc.name.split('.').pop()?.slice(0, 3) || 'DOC'}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-[13px] text-[#1E3A5F] truncate w-full" title={doc.name}>{doc.name}</h3>
                            <p className="text-[10px] font-bold text-[#9AADB8] mt-1 tracking-widest uppercase">
                              {doc.department ? doc.department : 'Global'}
                            </p>
                          </div>
                        </div>
                        <a 
                          href={doc.cloudinary_url}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full py-2.5 bg-[#F8FAFC] group-hover:bg-[#1E4D6B] text-[#5A7A8C] group-hover:text-white rounded-xl text-center text-[12px] font-bold transition-all border border-[#E8EFF4] group-hover:border-[#1E4D6B]"
                        >
                          Lihat Dokumen
                        </a>
                      </Card>
                    ))}
                  </div>
                )}
            </div>
            
            {/* Directory Intro Section */}
            <Card className="py-12 mt-4 text-center border-dashed border-2 border-[#E8EFF4] bg-transparent shadow-none">
               <p className="text-[#9AADB8] text-[13px] font-bold">Fitur Direktori Tim segera hadir.</p>
            </Card>

          </div>

          {/* Chatbot */}
          <div className="w-full lg:w-[420px] shrink-0 sticky top-24">
            <Card className="w-full h-[calc(100vh-140px)] min-h-[560px] p-0 flex flex-col overflow-hidden">
              {/* Header chatbot */}
              <div className="bg-[#1E4D6B] p-5 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white stroke-[1.5]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[14px]">Asisten Onboarding</h3>
                    <div className="text-[9px] font-bold tracking-[0.15em] flex items-center gap-1.5 uppercase opacity-70">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_6px_#4ADE80]" /> Online
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-6 bg-[#F8FAFC] flex flex-col gap-4">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''} max-w-[90%] ${msg.role === 'user' ? 'self-end' : ''}`}>
                    {msg.role === 'bot' && (
                      <div className="w-7 h-7 rounded-lg bg-white text-[#1E4D6B] flex items-center justify-center shrink-0 shadow-sm border border-[#E8EFF4]">
                        <Bot className="w-3.5 h-3.5 stroke-[1.5]" />
                      </div>
                    )}
                    <div className={`px-4 py-3 rounded-2xl text-[13px] leading-relaxed font-medium ${
                      msg.role === 'bot'
                        ? 'bg-white text-[#1E3A5F] rounded-tl-sm shadow-sm border border-[#E8EFF4]'
                        : 'bg-[#1E4D6B] text-white rounded-tr-sm'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex gap-3">
                    <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-sm border border-[#E8EFF4]">
                      <Bot className="w-3.5 h-3.5 text-[#1E4D6B] stroke-[1.5]" />
                    </div>
                    <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm border border-[#E8EFF4] flex gap-1 items-center">
                      {[0, 1, 2].map(i => (
                        <span key={i} className="w-2 h-2 bg-[#9AADB8] rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                  </div>
                )}
                {/* Quick questions */}
                {messages.length === 1 && (
                  <div className="mt-auto flex flex-wrap gap-2">
                    {QUICK_QUESTIONS.map(q => (
                      <button key={q} onClick={() => sendChat(q)}
                        className="text-[11px] px-3 py-2 bg-white text-[#1E4D6B] border border-[#D8E8F0] rounded-full hover:bg-[#1E4D6B] hover:text-white transition-all font-bold shadow-sm">
                        {q}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="p-5 bg-white shrink-0 border-t border-[#E8EFF4]">
                <div className="relative mb-3">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChat(chatInput)}
                    placeholder="Tanyakan sesuatu..."
                    className="w-full h-12 pl-4 pr-12 text-[13px] bg-[#F8FAFC] border border-[#E8EFF4] rounded-xl focus:ring-4 focus:ring-[#1E4D6B]/8 focus:border-[#1E4D6B] transition-all font-medium text-[#1E3A5F] placeholder:text-[#9AADB8] focus:outline-none"
                  />
                  <button
                    onClick={() => sendChat(chatInput)}
                    disabled={!chatInput.trim() || chatLoading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-[#1E4D6B] hover:bg-[#1E4D6B] hover:text-white rounded-lg transition-all disabled:opacity-30"
                  >
                    <Send className="w-4 h-4" strokeWidth={2.5} />
                  </button>
                </div>
                <button className="w-full h-10 text-[12px] font-bold border border-[#D8E8F0] rounded-xl text-[#5A7A8C] hover:bg-[#F0F7FB] transition-all flex items-center justify-center gap-2">
                  <PhoneCall className="w-4 h-4" /> Hubungi HR Langsung
                </button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
