'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { SquaresFour, FileText, Users, Gear, SignOut } from '@phosphor-icons/react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const links = [
    { name: 'Ringkasan',          href: '/admin',                    icon: SquaresFour, exact: true },
    { name: 'Dokumen',             href: '/admin/documents',          icon: FileText,        exact: false },
    { name: 'Karyawan',            href: '/admin/employees',          icon: Users,           exact: false },
    { name: 'Struktur',            href: '/admin/settings',           icon: Gear,        exact: false },
  ];

  return (
    <aside className="w-64 bg-app-bg flex flex-col h-screen fixed left-0 top-0 z-40">
      {/* Header - Minimalist Logo Card */}
      <div className="p-6 pb-2 min-h-[110px]">
        {mounted ? (
          <div className="bg-white p-4 rounded-[1.5rem] border border-[#E8EFF4] shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex items-center gap-3 group/logo hover:shadow-[0_8px_30px_rgb(0,0,0,0.05)] transition-all cursor-default animate-in fade-in duration-300">
            <div className="w-10 h-10 flex items-center justify-center group-hover/logo:scale-105 transition-transform">
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <h1 className="font-extrabold text-[1.4rem] tracking-tight text-[#1E3A5F] leading-none">
                On Board
              </h1>
            </div>
          </div>
        ) : (
          <div className="w-full h-full opacity-0" />
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1.5 mt-2">
        {links.map((itm) => {
          const isActive = itm.exact ? pathname === itm.href : pathname.startsWith(itm.href);
          const Icon = itm.icon;
          return (
            <Link
              key={itm.name}
              href={itm.href}
              className={cn(
                'flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all font-bold text-[13.5px]',
                isActive
                  ? 'bg-white shadow-soft text-tertiary'
                  : 'text-tertiary/50 hover:text-tertiary hover:bg-white/50'
              )}
            >
              <Icon
                weight="duotone"
                className={cn(
                  'w-5 h-5 shrink-0 transition-colors',
                  isActive ? 'text-primary' : 'text-tertiary/40'
                )}
              />
              <span>{itm.name}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(91,164,207,0.6)]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-6 mt-auto">
        <div className="bg-white/40 p-4 rounded-3xl border border-white/60 mb-4 shadow-soft">
          <div className="flex items-center gap-3 mb-4 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-tertiary flex items-center justify-center shrink-0 shadow-lg shadow-tertiary/10">
              <span className="text-xs font-bold text-white uppercase tracking-tighter">HR</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[13px] font-bold text-tertiary truncate">Admin HR</span>
              <span className="text-[10px] text-tertiary/70 font-bold truncate">admin@flow.com</span>
            </div>
          </div>
          
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="flex items-center justify-center gap-2 px-4 py-3 w-full rounded-2xl text-tertiary border border-neutral/10 bg-white hover:bg-neutral/5 hover:border-neutral/20 hover:text-red-500 transition-all text-[12px] font-bold shadow-sm active:scale-[0.98]"
            >
              <SignOut weight="duotone" className="w-4 h-4" />
              Keluar Sesi
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
