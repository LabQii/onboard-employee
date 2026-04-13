'use client';

import React, { useState, useEffect } from 'react';
import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-[#F1F5F9] p-4 sm:p-6 lg:p-8 font-[family-name:var(--font-geist-sans)]">
      <div className="w-full max-w-[1000px] bg-white rounded-[1.8rem] sm:rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row shadow-[0_20px_50px_rgba(0,0,0,0.1)] z-10">

        {}
        <div className="w-full md:w-[45%] bg-[#1E4D6B] px-8 py-10 md:p-12 flex flex-col items-center md:items-start text-center md:text-left relative overflow-hidden text-white min-h-[260px] md:min-h-[500px]">
          {}
          <div className="absolute top-[-10%] right-[-10%] w-[120%] h-[120%] bg-[#22516A] rounded-full opacity-40 pointer-events-none" />
          <div className="absolute top-[20%] right-[-40%] w-[100%] h-[100%] bg-[#36799C] rounded-full opacity-20 pointer-events-none" />
          <div className="absolute bottom-[-20%] left-[-20%] w-[80%] h-[80%] bg-[#276087] rounded-full opacity-30 pointer-events-none" />

          {}
          <div className="relative z-10 w-16 h-16 sm:w-20 sm:h-20 mb-6 md:mb-12 flex items-center justify-center bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20 shadow-xl group hover:scale-105 transition-transform duration-300">
            {mounted ? (
              <img
                src="/logo.png"
                alt="Logo"
                className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-md animate-in zoom-in duration-500"
              />
            ) : (
              <div className="w-full h-full opacity-0" />
            )}
          </div>

          <div className="relative z-10 mb-4 md:mb-10 text-center md:text-left">
            <h1 className="text-[2rem] sm:text-[2.5rem] font-bold leading-tight mb-2 tracking-tight">On Board</h1>
            <p className="text-[#B5DBEC] text-[0.9rem] sm:text-[0.95rem] font-medium leading-relaxed max-w-[280px] mx-auto md:mx-0">
              Panduan onboarding untuk membantu Anda beradaptasi dengan mudah
            </p>
          </div>

          {}
          <div className="relative z-10 w-full hidden md:block">
            <div className="bg-white/10 border border-white/20 rounded-[2rem] p-7 backdrop-blur-md shadow-2xl">
              <p className="text-sm font-bold text-white mb-2">Noted!</p>
              <p className="text-[0.85rem] text-[#D1E9F4] font-medium leading-relaxed italic mb-4 opacity-90">
                &quot;Masa depan tergantung pada apa yang kamu lakukan hari ini&quot;
              </p>
              <p className="text-[10px] font-bold text-white tracking-widest uppercase">— Muhammad Iqbal Firmansyah 2026</p>
            </div>
          </div>
        </div>

        {}
        <div className="w-full md:w-[55%] p-8 sm:p-10 lg:px-20 lg:py-16 flex flex-col justify-center bg-white relative z-10">
          <LoginForm />
        </div>

      </div>

      {}
      <div className="fixed bottom-6 left-6 z-20">
        <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center shadow-lg">
          <span className="text-white font-bold text-[10px]">N</span>
        </div>
      </div>
    </main>
  );
}
