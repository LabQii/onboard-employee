'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Envelope, LockKey, Eye, EyeSlash } from '@phosphor-icons/react';
import Link from 'next/link';

export default function LoginForm() {
  const [email, setEmail] = useState('explore.codee@gmail.com');
  const [password, setPassword] = useState('anakindonesia');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [demoMode, setDemoMode] = useState<'admin' | 'karyawan'>('karyawan');

  const fillDemo = (mode: 'admin' | 'karyawan') => {
    setDemoMode(mode);
    if (mode === 'admin') {
      setEmail('admin@onboardflow.com');
      setPassword('Admin@2026');
    } else {
      setEmail('explore.codee@gmail.com');
      setPassword('anakindonesia');
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || 'Login gagal.');
      setLoading(false);
      return;
    }

    router.push(data.redirectTo || '/karyawan');
  }

  return (
    <div className="w-full flex flex-col items-center">
      <div className="mb-10 w-full flex items-start justify-between">
        <div>
          <h2 className="text-[1.8rem] font-bold text-[#111827] mb-1 tracking-tight">Selamat Datang</h2>
          <p className="text-[0.95rem] text-[#5A7A8C] font-medium tracking-tight opacity-80">Masuk untuk membaca dokumentasi</p>
        </div>

        {/* Demo Switcher */}
        <div className="flex flex-col gap-1.5 p-1 bg-[#F8FAFC] rounded-2xl border border-[#E8EFF4] min-w-[100px]">
          <button
            type="button"
            onClick={() => fillDemo('admin')}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${demoMode === 'admin' ? 'bg-[#1E4D6B] text-white shadow-md' : 'text-[#9AADB8] hover:bg-[#F1F5F9]'}`}
          >
            ADMIN
          </button>
          <button
            type="button"
            onClick={() => fillDemo('karyawan')}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${demoMode === 'karyawan' ? 'bg-[#1E4D6B] text-white shadow-md' : 'text-[#9AADB8] hover:bg-[#F1F5F9]'}`}
          >
            KARYAWAN
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm text-center font-medium">
            {error}
          </div>
        )}

        {/* Email */}
        <div>
          <label className="text-[10px] font-bold text-[#5A7A8C] uppercase tracking-widest mb-2.5 block">
            EMAIL KERJA
          </label>
          <div className="relative">
            <Envelope weight="regular" className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#9AADB8]" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="explore.codee@gmail.com"
              className="w-full pl-12 pr-4 py-4 border border-[#E2E8F0] rounded-xl text-[14px] text-[#1E3A5F] font-medium focus:outline-none focus:border-[#1E4D6B] focus:ring-4 focus:ring-[#1E4D6B]/5 transition-all placeholder:text-[#9AADB8]"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <label className="text-[10px] font-bold text-[#5A7A8C] uppercase tracking-widest">
              KATA SANDI
            </label>
            <Link href="#" className="text-[11px] font-bold text-[#1E4D6B] hover:underline">
              Lupa kata sandi?
            </Link>
          </div>
          <div className="relative">
            <LockKey weight="regular" className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#9AADB8]" />
            <input
              id="password"
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••••••"
              className="w-full pl-12 pr-12 py-4 border border-[#E2E8F0] rounded-xl text-[14px] text-[#1E3A5F] font-medium focus:outline-none focus:border-[#1E4D6B] focus:ring-4 focus:ring-[#1E4D6B]/5 transition-all placeholder:text-[#9AADB8]"
            />
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9AADB8] hover:text-[#1E4D6B] transition-colors"
            >
              {showPw ? <EyeSlash weight="regular" className="w-5 h-5" /> : <Eye weight="regular" className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 mt-2 bg-[#1E4D6B] text-white rounded-full font-bold text-[15px] hover:bg-[#163a52] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xl shadow-[#1E4D6B]/10 active:scale-[0.98]"
        >
          {loading ? (
            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Memproses...</>
          ) : 'Masuk'}
        </button>
      </form>

      <p className="mt-14 text-center text-[12px] text-[#9AADB8] font-medium pb-2">
        Belum punya akun?{' '}
        <span className="text-[#1E4D6B] font-bold cursor-pointer hover:underline">Hubungi admin HR Anda untuk mendapatkan undangan.</span>
      </p>
    </div>
  );
}
