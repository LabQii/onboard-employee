'use client';

import React from 'react';
import { Sidebar } from '@/components/admin/Sidebar';
import { Bell } from '@phosphor-icons/react';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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
         {/* Top Navbar Global for Admin */}
         <div className="h-16 border-b border-[#E8EFF4] bg-white/70 backdrop-blur-xl flex items-center justify-center px-10 shrink-0 relative w-full z-20">
             
           <div className="max-w-[1200px] w-full flex justify-between items-center relative z-10">
             <div className="w-4"></div>{/* Spacer */}
             
             {/* Center Spacer to push icons to the right */}
             <div className="flex-1"></div>
             
             <div className="flex items-center gap-5">
               <button className="text-[#9AADB8] hover:text-[#1E4D6B] transition-colors relative">
                 <Bell weight="duotone" className="w-5 h-5" />
                 <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-red-400 rounded-full" />
               </button>
               <div className="w-8 h-8 rounded-xl bg-[#EBF4FA] flex items-center justify-center font-bold text-xs text-[#1E4D6B]">
                 AD
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
