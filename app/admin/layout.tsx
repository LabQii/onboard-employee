'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/admin/Sidebar';
import { Bell, X } from '@phosphor-icons/react';
import { createClient } from '@/lib/supabase/client';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotif, setShowNotif] = useState(false);
  const [initials, setInitials] = useState('AD');

  const unreadCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    // Fetch admin profile initials
    async function fetchProfile() {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', session.user.id)
            .single();
          if (profile?.full_name) {
            const parts = profile.full_name.split(' ');
            setInitials(parts.map((p: string) => p[0]).join('').slice(0, 2).toUpperCase());
          }
        }
      } catch (e) { /* silent */ }
    }

    // Fetch notifications
    async function fetchNotifs() {
      try {
        const res = await fetch('/api/admin/notifications', { cache: 'no-store' });
        const data = await res.json();
        setNotifications(data.notifications || []);
        console.log('Fetched notifications:', data.notifications?.length);
      } catch (e) {
        console.error('Error fetching notifications:', e);
      }
    }

    fetchProfile();
    fetchNotifs();

    // Poll every 60 seconds for new notifications
    const interval = setInterval(fetchNotifs, 60000);
    
    return () => clearInterval(interval);
  }, []);

  async function markAllRead() {
    await fetch('/api/admin/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true })
    });
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EEF6FB] via-[#F8FAFC] flex text-[#1E3A5F] overflow-hidden">
      {/* Decorative Gradient Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#DCECF5] rounded-full blur-[120px] opacity-60" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#E0F0FA] rounded-full blur-[150px] opacity-70" />
      </div>

      <div className="relative z-10">
        <Sidebar />
      </div>
      
      <div className="flex-1 ml-64 flex flex-col h-screen relative z-10 overflow-hidden">
        {/* Top Navbar Global for Admin - Sticky and High Z-Index to float over content */}
        <div className="sticky top-0 z-[100] h-16 border-b border-[#E8EFF4] bg-white/80 backdrop-blur-xl flex items-center justify-center px-10 shrink-0 w-full">
            
          <div className="max-w-[1200px] w-full flex justify-between items-center relative z-10">
            <div className="w-4"></div>{/* Spacer */}
            
            <div className="flex-1"></div>
            
            <div className="flex items-center gap-5">
              {/* Bell with live notification count */}
              <div className="relative">
                <button
                  onClick={() => setShowNotif(!showNotif)}
                  className={`relative p-2.5 rounded-xl transition-all duration-300 ${showNotif ? 'bg-[#1E3A5F] text-white shadow-lg' : 'text-[#9AADB8] hover:bg-white hover:text-[#1E4D6B] hover:shadow-sm'}`}
                >
                  <Bell weight="duotone" className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                  )}
                </button>

                {showNotif && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowNotif(false)} />
                    <div className="absolute right-0 mt-6 w-80 bg-white rounded-2xl shadow-xl border border-[#F3F4F6] z-50 overflow-hidden">
                      <div className="px-5 py-4 border-b border-[#F3F4F6] flex items-center justify-between bg-[#FDFDFD]">
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
                          <div className="px-5 py-10 text-center text-[#9AADB8] text-[13px] font-medium">
                            Belum ada notifikasi
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              className={`px-5 py-4 border-b border-[#F9FAFB] last:border-0 hover:bg-[#F8FAFC] transition-colors cursor-pointer relative ${!n.is_read ? 'bg-blue-50/30' : ''}`}
                            >
                              {!n.is_read && (
                                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#1E4D6B] rounded-r" />
                              )}
                              <div className="flex flex-col gap-1 pl-1">
                                <div className="flex items-center gap-2">
                                  <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${n.type === 'hr_contact' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                                    {n.type === 'hr_contact' ? 'Hubungi HR' : 'Pengingat'}
                                  </span>
                                </div>
                                <p className="font-bold text-[#1E3A5F] text-[13px]">{n.title}</p>
                                <p className="text-[#5A7A8C] text-[12px] leading-relaxed">{n.message}</p>
                                <p className="text-[10px] text-[#9AADB8] font-bold mt-0.5 uppercase tracking-wider">
                                  {new Date(n.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} • {new Date(n.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Admin Avatar with real initials */}
              <div className="w-8 h-8 rounded-xl bg-[#1E3A5F] flex items-center justify-center font-bold text-xs text-white shadow-sm">
                {initials}
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
