'use client';
import React, { useEffect } from 'react';
import Link from 'next/link';
import { SquaresFour, FileText, Users, User, Gear, SignOut, X } from '@phosphor-icons/react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  profile?: {
    name: string;
    email: string;
    initials: string;
  } | null;
}

export function Sidebar({ isOpen, onClose, profile }: SidebarProps) {
  const pathname = usePathname();

  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose?.();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const links = [
    { name: 'Ringkasan',  href: '/admin',             icon: SquaresFour, exact: true  },
    { name: 'Dokumen',    href: '/admin/documents',   icon: FileText,    exact: false },
    { name: 'Karyawan',   href: '/admin/employees',   icon: Users,       exact: false },
    { name: 'Struktur',   href: '/admin/settings',    icon: Gear,        exact: false },
  ];

  return (
    <>
      {}
      <div
        className={cn(
          'fixed inset-0 bg-black/50 backdrop-blur-sm z-[190] lg:hidden transition-opacity duration-300',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={cn(
          'w-64 bg-app-bg flex flex-col h-screen fixed left-0 top-0 z-[200] transition-transform duration-300 transform lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {}
        <div className="p-5 pb-2 min-h-[80px]">
          {}
          <div className="flex items-center justify-between mb-3 lg:hidden">
            <span className="text-[11px] font-bold text-tertiary/40 uppercase tracking-widest">Menu</span>
            <button
              onClick={onClose}
              aria-label="Tutup menu"
              className="p-1.5 rounded-xl text-tertiary/50 hover:bg-white/80 hover:text-tertiary transition-all"
            >
              <X className="w-5 h-5" weight="bold" />
            </button>
          </div>

          {}
          <div className="bg-white p-4 rounded-[1.5rem] border border-[#E8EFF4] shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex items-center gap-3 group/logo hover:shadow-[0_8px_30px_rgb(0,0,0,0.05)] transition-all cursor-default">
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
        </div>

        {}
        <nav className="flex-1 px-4 space-y-1.5 mt-2 overflow-y-auto">
          {links.map((itm) => {
            const isActive = itm.exact ? pathname === itm.href : pathname.startsWith(itm.href);
            const Icon = itm.icon;
            return (
              <Link
                key={itm.name}
                href={itm.href}
                onClick={onClose}
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

        {}
        <div className="p-6 mt-auto">
          <div className="bg-white/40 p-4 rounded-3xl border border-white/60 mb-4 shadow-soft">
            <div className="flex items-center gap-3 mb-4 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#1E3A5F] flex items-center justify-center font-bold text-sm text-white shadow-sm shrink-0">
                <User weight="bold" className="w-5 h-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[13px] font-bold text-[#1E3A5F] truncate">{profile?.name || 'Admin HR'}</span>
                <span className="text-[10px] text-[#5A7A8C] font-bold truncate">{profile?.email || 'admin@flow.com'}</span>
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
    </>
  );
}
