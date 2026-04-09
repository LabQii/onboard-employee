'use client';

import Link from 'next/link';
import { Bell, MagnifyingGlass } from '@phosphor-icons/react';

export function UserNavbar() {
  return (
    <header className="bg-white px-8 py-4 flex items-center justify-between border-b border-neutral/20 shadow-sm sticky top-0 z-50">
      <div className="flex items-center justify-center gap-2.5">
        <div className="w-9 h-9 flex items-center justify-center group/logo hover:scale-105 transition-all cursor-pointer">
          <img 
            src="/logo.png" 
            alt="Logo" 
            className="w-full h-full object-contain"
          />
        </div>
        <span className="font-extrabold text-[1.4rem] text-tertiary tracking-tight">On Board</span>
      </div>

      <nav className="hidden md:flex items-center gap-8 font-medium text-sm text-neutral-dark">
        <Link href="/onboarding" className="text-primary border-b-2 border-primary pb-1">Panduan Saya</Link>
        <Link href="#" className="hover:text-primary transition-colors">Dokumen</Link>
        <Link href="#" className="hover:text-primary transition-colors">Tim & Kontak</Link>
      </nav>

      <div className="flex items-center gap-6">
        <button className="text-neutral-dark hover:text-primary transition-colors">
          <MagnifyingGlass weight="duotone" className="w-5 h-5" />
        </button>
        <button className="text-neutral-dark hover:text-primary transition-colors relative">
          <Bell weight="duotone" className="w-5 h-5" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>
        
        <div className="h-8 w-px bg-neutral/20"></div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <div className="text-sm font-semibold text-tertiary">Budi Santoso</div>
            <div className="text-xs text-secondary">Engineer</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
            BS
          </div>
        </div>
      </div>
    </header>
  );
}
