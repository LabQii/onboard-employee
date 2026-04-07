'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import {
  CheckSquare, FileText, PaperPlane, Bell, Phone,
  LockKey, MagnifyingGlass, SignOut, CheckCircle, Circle, User, X
} from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';

const AssistantIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="8" cy="11.5" r="1.5" fill="#276087" />
    <circle cx="12" cy="11.5" r="1.5" fill="#276087" />
    <circle cx="16" cy="11.5" r="1.5" fill="#276087" />
  </svg>
);

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
  const [showWelcome, setShowWelcome] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotif, setShowNotif] = useState(false);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Fetch data
  useEffect(() => {
    async function load() {
      try {
        const [profileRes, checklistRes, notifRes] = await Promise.all([
          fetch('/api/karyawan/profile'),
          fetch('/api/karyawan/checklist'),
          fetch('/api/karyawan/notifications', { cache: 'no-store' }),
        ]);
        if (profileRes.status === 401) { router.push('/'); return; }
        const { profile: p } = await profileRes.json();
        const { items } = await checklistRes.json();
        const { notifications: n } = await notifRes.json();

        setProfile(p);
        setChecklistItems(items ?? []);
        setNotifications(n ?? []);

        // Welcome Alert Logic: Only show once per session (after login)
        const isWelcomeShown = sessionStorage.getItem('onboard_welcome_shown');
        if (!isWelcomeShown) {
          setTimeout(() => {
            setShowWelcome(true);
            sessionStorage.setItem('onboard_welcome_shown', 'true');
            // Auto hide after 5 seconds
            setTimeout(() => setShowWelcome(false), 5000);
          }, 800);
        }
      } catch {
        router.push('/');
      } finally {
        setLoading(false);
      }
    }
    load();

    // Polling for notifications
    const fetchNotifs = async () => {
      try {
        const res = await fetch('/api/karyawan/notifications', { cache: 'no-store' });
        const data = await res.json();
        if (data.notifications) setNotifications(data.notifications);
      } catch (e) { console.error('Notif fetch error:', e); }
    };
    const interval = setInterval(fetchNotifs, 15000);
    window.addEventListener('focus', fetchNotifs);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', fetchNotifs);
    };
  }, [router]);

  async function markAllRead() {
    try {
      await fetch('/api/karyawan/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true })
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (e) { console.error('Mark read error:', e); }
  }

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
      const contextDocs = checklistItems.map(i => `- ${i.title} (Status: ${i.completed ? 'Selesai' : 'Belum'}, Keterangan: ${i.description || '-'})`).join('\n');
      const profileContext = `Nama: ${profile?.full_name || 'Karyawan'}\nDivisi: ${profile?.department || '-'}\nPeran: ${profile?.role || '-'}\nTanggal Masuk: ${profile?.start_date || '-'}\nDaftar Dokumen/Tugas Tersedia: \n${contextDocs || 'Belum ada'}`;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: text,
          department: profile?.department,
          role: profile?.role,
          profileContext
        })
      });

      if (!res.ok) throw new Error("Gagal memanggil backend RAG");

      const data = await res.json();
      setMessages(prev => [...prev, { role: 'bot', text: data.answer || data.error || 'Terjadi galat.' }]);
    } catch (error: any) {
      console.error('Groq Chat Error:', error);
      setMessages(prev => [...prev, { role: 'bot', text: `Terjadi kendala: ${error?.message || 'Pastikan API key valid.'}` }]);
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
    ? Math.max(0, Math.floor((Date.now() - new Date(profile.start_date).getTime()) / 86400000)) + 1
    : 1;

  const initials = profile?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#EEF6FB] via-[#F8FAFC] to-[#E3F0F8] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#1E4D6B]/20 border-t-[#1E4D6B] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-[#EEF6FB] via-[#F8FAFC] flex flex-col relative overflow-hidden">
      {/* Animated Welcome Alert */}
      <AnimatePresence>
        {showWelcome && (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            className="fixed top-24 right-6 z-[60] bg-white border border-[#E8EFF4] shadow-2xl rounded-2xl p-6 flex items-center gap-4 max-w-sm pointer-events-auto"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-[#1E4D6B] to-[#276087] rounded-xl flex items-center justify-center text-white shrink-0">
              <User weight="duotone" className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-[#1E3A5F] text-[14px]">Halo, {profile?.full_name?.split(' ')[0]}!</h4>
              <p className="text-[#9AADB8] text-[12px] font-medium">Senang melihatmu kembali. Yuk lanjutin tugasnya!</p>
            </div>
            <button onClick={() => setShowWelcome(false)} className="text-[#C0CDD4] hover:text-[#1E3A5F] ml-2">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Decorative Gradient Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#DCECF5] rounded-full blur-[120px] opacity-60" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#E0F0FA] rounded-full blur-[150px] opacity-70" />
      </div>

      {/* Top Navbar */}
      <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-xl border-b border-[#E8EFF4] shadow-sm' : 'bg-transparent backdrop-blur-sm'
        }`}>
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo - Modern Minimalist Style */}
          <div className="flex items-center gap-3 group/logo cursor-pointer">
            <div className="w-[34px] h-[34px] bg-gradient-to-br from-[#1E4D6B] to-[#276087] text-white font-extrabold text-[10px] rounded-full flex items-center justify-center shadow-md shadow-[#1E4D6B]/20 group-hover/logo:scale-110 transition-transform">
              OF
            </div>
            <div className="flex flex-col">
              <h1 className="font-extrabold text-[1.05rem] text-[#1E3A5F] tracking-tight leading-none">On Board</h1>
            </div>
          </div>

          {/* User & Notifications */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <button 
                onClick={() => setShowNotif(!showNotif)}
                className={`relative p-2.5 rounded-xl transition-all duration-300 ${showNotif ? 'bg-[#1E4D6B] text-white shadow-lg' : 'text-[#5A7A8C] hover:bg-white hover:text-[#1E4D6B] hover:shadow-sm'}`}
              >
                <Bell className="w-5 h-5 stroke-[2]" />
                {unreadCount > 0 && (
                  <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                )}
              </button>

              <AnimatePresence>
                {showNotif && (
                  <>
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setShowNotif(false)}
                      className="fixed inset-0 z-[60]"
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                      className="absolute right-0 mt-6 w-80 bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white z-[70] overflow-hidden"
                    >
                      <div className="px-5 py-4 border-b border-[#F3F4F6] flex items-center justify-between bg-white/50">
                        <div>
                          <h3 className="font-bold text-[#1E3A5F] text-[14px]">Notifikasi</h3>
                          {unreadCount > 0 && (
                            <p className="text-[11px] text-[#9AADB8] font-medium">{unreadCount} belum dibaca</p>
                          )}
                        </div>
                        <button
                          onClick={markAllRead}
                          className="text-[11px] font-bold text-[#1E4D6B] hover:underline"
                        >
                          Tandai dibaca
                        </button>
                      </div>
                      <div className="max-h-[350px] overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="px-5 py-10 text-center flex flex-col items-center gap-3">
                            <div className="w-12 h-12 bg-[#F9FAFB] rounded-full flex items-center justify-center text-[#E5E7EB]">
                              <Bell weight="duotone" className="w-6 h-6" />
                            </div>
                            <p className="text-[#9AADB8] text-[13px] font-medium">Belum ada notifikasi</p>
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              className={`px-5 py-4 border-b border-[#F9FAFB] last:border-0 hover:bg-white transition-colors cursor-pointer relative ${!n.is_read ? 'bg-blue-50/20' : ''}`}
                            >
                              {!n.is_read && (
                                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#1E4D6B] rounded-r" />
                              )}
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${n.type === 'hr_reminder' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                                    {n.type === 'hr_reminder' ? 'HR Reminder' : 'Info'}
                                  </span>
                                </div>
                                <p className="font-bold text-[#1E3A5F] text-[13px]">{n.title}</p>
                                <p className="text-[#5A7A8C] text-[12px] leading-relaxed">{n.message}</p>
                                <p className="text-[10px] text-[#9AADB8] font-bold mt-1 uppercase tracking-wider">
                                  {new Date(n.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} • {new Date(n.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            <div className="flex items-center gap-3 border-l border-[#E8EFF4] pl-4">
              <div className="text-right hidden sm:block">
                <div className="text-[14px] font-bold text-[#1E3A5F] leading-tight">{profile?.full_name || '—'}</div>
                <div className="text-[10px] text-[#9AADB8] font-bold mt-0.5">
                  {profile?.role || 'Karyawan'} {profile?.department ? ` - ${profile.department}` : ''}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#EBF4FA] text-[#1E4D6B] flex items-center justify-center font-extrabold text-[13px] border border-white shadow-sm">
                {initials}
              </div>
            </div>
            <button onClick={handleLogout} title="Keluar"
              className="text-[#9AADB8] hover:text-red-500 transition-colors">
              <SignOut weight="duotone" className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 pt-28 pb-12 w-full flex flex-col gap-6">
        {/* Simplified Header with 3 Cards */}
        <div className="flex flex-col gap-6">
          <div className="flex items-end justify-between px-2">
            <div className="flex flex-col gap-1">
              <h2 className="text-[1.6rem] font-extrabold text-[#1E3A5F] tracking-tight leading-none text-shadow-sm">Dashboard</h2>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold bg-white/80 text-[#1E4D6B] px-3.5 py-1.5 rounded-xl border border-[#E8EFF4] shadow-sm backdrop-blur-md">
                HARI KE-{daysSinceStart}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1: Progress */}
            <Card className="bg-white/70 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex items-center gap-5 p-6 hover:-translate-y-1 transition-all cursor-pointer">
              <div className="relative w-[60px] h-[60px] shrink-0">
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none" stroke="#E8EFF4" strokeWidth="3" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none" stroke="#1E4D6B" strokeWidth="3"
                    strokeDasharray={`${progress}, 100`} strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center font-bold text-[14px] text-[#1E3A5F]">{progress}%</span>
              </div>
              <div>
                <div className="text-[10px] text-[#9AADB8] font-bold mb-1 tracking-wider uppercase">Progres</div>
                <div className="font-bold text-[1.1rem] text-[#1E3A5F]">{progress === 100 ? 'Selesai!' : 'Sedang Berproses'}</div>
              </div>
            </Card>

            {/* Card 2: Remaining */}
            <Card className="bg-white/70 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex items-center gap-5 p-6 hover:-translate-y-1 transition-all cursor-pointer">
              <div className="w-[60px] h-[60px] rounded-2xl bg-[#E8EFF4] text-[#276087] flex items-center justify-center shrink-0">
                <CheckSquare weight="duotone" className="w-7 h-7" />
              </div>
              <div>
                <div className="text-[10px] text-[#9AADB8] font-bold mb-1 tracking-wider uppercase">Tugas Tersisa</div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-[1.5rem] text-[#1E3A5F] leading-none">{remaining}</span>
                  <span className="text-[9px] font-bold bg-[#E8EFF4] text-[#276087] px-2 py-0.5 rounded-lg">BELUM</span>
                </div>
              </div>
            </Card>

            {/* Card 3: Completed */}
            <Card className="bg-white/70 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex items-center gap-5 p-6 hover:-translate-y-1 transition-all cursor-pointer">
              <div className="w-[60px] h-[60px] rounded-2xl bg-[#E8EFF4] text-[#276087] flex items-center justify-center shrink-0">
                <CheckCircle weight="duotone" className="w-7 h-7" />
              </div>
              <div>
                <div className="text-[10px] text-[#9AADB8] font-bold mb-1 tracking-wider uppercase">Selesai</div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-[1.5rem] text-[#1E3A5F] leading-none">{completedItems}</span>
                  <span className="text-[9px] font-bold bg-[#E8EFF4] text-[#276087] px-2 py-0.5 rounded-lg">DARI {totalItems}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Dynamic Content */}
          <div className="flex-1 w-full flex flex-col gap-10">

            {/* Checklist Section */}
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-1 px-1">

                <h2 className="text-[1.6rem] font-extrabold text-[#1E3A5F] tracking-tight leading-none">Checklist Onboarding</h2>
              </div>

              {totalItems === 0 ? (
                <Card className="py-16 text-center">
                  <LockKey weight="duotone" className="w-8 h-8 text-[#C0CDD4] mx-auto mb-3" />
                  <p className="text-[13px] text-[#9AADB8] font-medium">Belum ada checklist. Admin akan segera menambahkan.</p>
                </Card>
              ) : (
                phases.map(phase => {
                  const phaseItems = checklistItems.filter(i => (i.phase || 'Umum') === phase);
                  const pDone = phaseItems.filter(i => i.completed).length;
                  const pPct = phaseItems.length > 0 ? Math.round((pDone / phaseItems.length) * 100) : 0;

                  return (
                    <Card key={phase} className="p-8 group/card hover:shadow-xl transition-all duration-300 border-white/80 bg-white/60">
                      <div className="flex items-end justify-between mb-8 border-b border-[#E8EFF4] pb-6">
                        <div>
                          <h3 className="font-bold text-[1.2rem] text-[#1E3A5F]">
                            {phase === 'Hari' ? 'Tugas Harian' : phase}
                          </h3>
                          <p className="text-[12px] font-bold text-[#9AADB8] mt-1 flex items-center gap-2">
                            <CheckCircle weight="duotone" className="w-4 h-4 text-[#1E4D6B]" />
                            {pDone} dari {phaseItems.length} selesai
                          </p>
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
                              <div className={`w-5 h-5 rounded-lg flex items-center justify-center border-2 transition-all shrink-0 ${item.completed
                                ? 'bg-[#1E4D6B] border-[#1E4D6B] text-white'
                                : 'border-[#C0CDD4] text-transparent group-hover:border-[#1E4D6B]'
                                }`}>
                                {item.completed
                                  ? <CheckCircle weight="fill" className="w-3.5 h-3.5" />
                                  : <Circle weight="light" className="w-3.5 h-3.5" />}
                              </div>
                              <div className="text-left flex-1 min-w-0 pr-4">
                                <span className={`font-bold text-[14px] block transition-all ${item.completed ? 'text-[#9AADB8] line-through' : 'text-[#1E3A5F]'}`}>
                                  {item.title.replace(/^Baca Dokumen:\s*/i, 'Baca : ')}
                                </span>
                                {item.description && item.description.startsWith('http') ? (
                                  <a
                                    href={item.description}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="mt-2 inline-flex items-center justify-center py-2 px-4 bg-white/50 hover:bg-[#1E4D6B] text-[#1E4D6B] hover:text-white rounded-lg text-[11px] font-bold transition-all border border-[#E8EFF4] hover:border-[#1E4D6B] shadow-sm"
                                  >
                                    <FileText weight="duotone" className="w-3.5 h-3.5 mr-1.5" /> Buka Dokumen
                                  </a>
                                ) : item.description ? (
                                  <span className="text-[11px] text-[#9AADB8] font-medium block mt-1">{item.description}</span>
                                ) : null}
                              </div>
                            </div>
                            <span className={`text-[9px] font-bold px-3 py-1 rounded-lg tracking-[0.15em] shrink-0 ml-2 ${item.priority === 'wajib'
                              ? 'bg-[#E8EFF4] text-[#276087]'
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


          </div>

          {/* Chatbot */}
          <div className="w-full lg:w-[420px] shrink-0 sticky top-24 z-10">
            <Card className="w-full h-[440px] sm:h-[600px] p-0 flex flex-col overflow-hidden bg-white/70 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              {/* Header chatbot */}
              <div className="bg-gradient-to-r from-[#1E4D6B] to-[#276087] p-5 text-white flex items-center justify-between shrink-0 shadow-sm border-b border-[#1A4560]/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <AssistantIcon className="w-5 h-5 text-white stroke-[1.5]" />
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
                        <AssistantIcon className="w-3.5 h-3.5 stroke-[1.5]" />
                      </div>
                    )}
                    <div className={`px-4 py-3 rounded-2xl text-[13px] leading-relaxed font-medium ${msg.role === 'bot'
                      ? 'bg-white text-[#1E3A5F] rounded-tl-sm shadow-sm border border-[#E8EFF4]'
                      : 'bg-[#1E4D6B] text-white rounded-tr-sm whitespace-pre-wrap'
                      }`}>
                      {msg.role === 'bot' ? (
                        <div className="flex flex-col gap-2">
                          <ReactMarkdown
                            components={{
                              p: ({ node, ...props }) => <p className="mb-1" {...props} />,
                              ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-1 space-y-1" {...props} />,
                              ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-1 space-y-1" {...props} />,
                              li: ({ node, ...props }) => <li className="" {...props} />,
                              strong: ({ node, ...props }) => <strong className="font-bold text-[#1E3A5F]" {...props} />
                            }}
                          >
                            {msg.text}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        msg.text
                      )}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex gap-3">
                    <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-sm border border-[#E8EFF4]">
                      <AssistantIcon className="w-3.5 h-3.5 text-[#1E4D6B] stroke-[1.5]" />
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
                    <PaperPlane weight="duotone" className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={async () => {
                    const btn = document.getElementById('contact-hr-btn');
                    if (btn) {
                      btn.innerText = 'Mengirim...';
                      btn.setAttribute('disabled', 'true');
                    }
                    try {
                      const res = await fetch('/api/karyawan/contact-hr', { method: 'POST' });
                      if (res.ok) {
                        if (btn) btn.innerText = '✓ Terkirim';
                        setTimeout(() => {
                          if (btn) {
                            btn.innerText = 'Hubungi HR Langsung';
                            btn.removeAttribute('disabled');
                          }
                        }, 3000);
                      }
                    } catch (e) {
                      if (btn) {
                        btn.innerText = 'Gagal';
                        setTimeout(() => {
                          if (btn) {
                            btn.innerText = 'Hubungi HR Langsung';
                            btn.removeAttribute('disabled');
                          }
                        }, 3000);
                      }
                    }
                  }}
                  id="contact-hr-btn"
                  className="w-full h-10 text-[12px] font-bold border border-[#D8E8F0] rounded-xl text-[#5A7A8C] hover:bg-[#F0F7FB] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Phone weight="duotone" className="w-4 h-4" /> Hubungi HR Langsung
                </button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
