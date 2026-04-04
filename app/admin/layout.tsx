import React from 'react';
import { Sidebar } from '@/components/admin/Sidebar';
import { Bell } from 'lucide-react';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex text-tertiary">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col h-screen overflow-hidden">
         {/* Top Navbar Global for Admin */}
         <div className="h-16 border-b border-neutral/10 bg-[#F4FAFD] flex items-center justify-center px-10 shrink-0 relative w-full overflow-hidden">
             
           <div className="max-w-[1200px] w-full flex justify-between items-center relative z-10">
             <div className="w-4"></div>{/* Spacer */}
             
             <div className="flex items-center gap-8 font-semibold text-[13px] text-neutral-dark">
               <Link href="/admin" className="text-tertiary border-b-2 border-primary pb-1 font-bold">Dashboard</Link>
               <Link href="#" className="hover:text-tertiary transition-colors">Tasks</Link>
               <Link href="#" className="hover:text-tertiary transition-colors">Resources</Link>
               <Link href="#" className="hover:text-tertiary transition-colors">Help</Link>
             </div>
             
             <div className="flex items-center gap-5">
               <button className="text-neutral-dark hover:text-primary transition-colors"><Bell className="w-5 h-5 stroke-[1.5]" /></button>
               <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-bold text-xs text-white border border-white">
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
