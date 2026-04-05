'use client';

import LoginForm from '@/components/auth/LoginForm';
import { Star } from '@phosphor-icons/react';


export default function LoginPage() {
  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-[#EBF4FA] p-4 lg:p-8 relative">
      <div className="w-full max-w-[960px] bg-white rounded-[2rem] overflow-hidden flex flex-col md:flex-row shadow-2xl z-10">
        
        {/* Left Panel */}
        <div className="w-full md:w-[42%] bg-[#1E4D6B] p-10 flex flex-col relative overflow-hidden text-white">
          <div className="absolute top-[-20%] right-[-30%] w-[150%] h-[150%] bg-[#22516A] rounded-[100%] opacity-50 pointer-events-none" />
          <div className="absolute bottom-[-10%] left-[-20%] w-[100%] h-[100%] bg-[#36799C] rounded-[100%] opacity-40 pointer-events-none" />
          
          {/* Logo */}
          <div className="relative z-10 w-12 h-12 bg-white rounded-full flex items-center justify-center font-bold text-lg text-[#1E4D6B] mb-10">
            O
          </div>

          <div className="relative z-10 mt-6">
            <h1 className="text-3xl font-bold leading-tight mb-3 tracking-tight">On-Boarding.</h1>
            <p className="text-[#B5DBEC] text-sm font-light leading-relaxed opacity-90">
              Platform orientasi terpusat untuk membantu masa transisi peran baru Anda secara terstruktur dan efisien.
            </p>
          </div>

          <div className="relative z-10 mt-auto">
            <div className="bg-white/10 border border-white/20 rounded-2xl p-5 backdrop-blur-sm">
              <Star weight="duotone" className="w-8 h-8 text-[#E5B67B] mb-3" />
              <p className="text-sm font-bold text-white mb-1">Akses Eksklusif</p>
              <p className="text-xs text-[#B5DBEC] font-light leading-relaxed italic">
                "Proses administrasi karyawan terintegrasi dengan mulus. Saya merasa diarahkan dengan baik sejak hari pertama."
              </p>
              <p className="text-[10px] font-bold text-white mt-2">— Sarah J., Desainer Produk</p>
            </div>
          </div>
        </div>

        {/* Right Panel - Form (White) */}
        <div className="w-full md:w-[58%] p-10 lg:px-14 lg:py-12 flex flex-col justify-center bg-white relative z-10">
          <LoginForm />
        </div>

      </div>
    </main>
  );
}
