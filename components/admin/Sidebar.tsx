'use client';
import Link from 'next/link';
import { LayoutDashboard, FileText, Users, Settings, LogOut, ListChecks } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const pathname = usePathname();

  const links = [
    { name: 'Ringkasan',          href: '/admin',                    icon: LayoutDashboard, exact: true },
    { name: 'Dokumen',             href: '/admin/documents',          icon: FileText,        exact: false },
    { name: 'Karyawan',            href: '/admin/employees',          icon: Users,           exact: false },
    { name: 'Pengaturan',          href: '/admin/settings',           icon: Settings,        exact: false },
  ];

  return (
    <aside className="w-64 bg-app-bg flex flex-col h-screen fixed left-0 top-0 z-40">
      {/* Header */}
      <div className="p-8 pb-10">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 bg-tertiary rounded-xl flex items-center justify-center font-bold text-xs text-white shadow-inner">
            OF
          </div>
          <h1 className="font-bold text-[1.4rem] tracking-tight text-tertiary leading-none">
            OnboardFlow
          </h1>
        </div>
        <div className="flex items-center gap-2 ml-12 opacity-40">
           <span className="w-1 h-1 rounded-full bg-tertiary"></span>
           <p className="text-[10px] font-bold tracking-[0.2em] text-tertiary uppercase">
             HR PORTAL
           </p>
        </div>
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
                className={cn(
                  'w-5 h-5 stroke-[2] shrink-0 transition-colors',
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
              <span className="text-[10px] text-tertiary/50 font-bold truncate">admin@flow.com</span>
            </div>
          </div>
          
          <form action="/auth/logout" method="post">
            <button
              type="submit"
              className="flex items-center justify-center gap-2 px-4 py-3 w-full rounded-2xl text-tertiary border border-neutral/10 bg-white hover:bg-red-50 hover:border-red-100 hover:text-red-500 transition-all text-[12px] font-bold shadow-sm active:scale-[0.98]"
            >
              <LogOut className="w-4 h-4 stroke-[2.5]" />
              Keluar Sesi
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
