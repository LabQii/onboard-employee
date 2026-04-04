'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

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
      <div className="mb-10 w-full">
        <h2 className="text-[1.6rem] font-bold text-[#111827] mb-2 tracking-tight">Selamat Datang</h2>
        <p className="text-sm text-[#5A7A8C] font-medium">Masuk untuk melanjutkan akses orientasi Anda.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm text-center font-medium">
            {error}
          </div>
        )}

        {/* Email */}
        <div>
          <label className="text-xs font-bold text-[#5A7A8C] uppercase tracking-wider mb-2 block">
            Email Kerja
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#9AADB8]" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="nama@perusahaan.com"
              className="w-full pl-11 pr-4 py-3.5 border border-[#D8E8F0] rounded-xl text-[13px] text-[#1E3A5F] font-medium focus:outline-none focus:border-[#1E4D6B] focus:ring-4 focus:ring-[#1E4D6B]/5 transition-all placeholder:text-[#9AADB8]"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-[#5A7A8C] uppercase tracking-wider">
              Kata Sandi
            </label>
            <Link href="#" className="text-xs font-semibold text-[#1E4D6B] hover:underline">
              Lupa kata sandi?
            </Link>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#9AADB8]" />
            <input
              id="password"
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full pl-11 pr-12 py-3.5 border border-[#D8E8F0] rounded-xl text-[13px] text-[#1E3A5F] font-medium focus:outline-none focus:border-[#1E4D6B] focus:ring-4 focus:ring-[#1E4D6B]/5 transition-all placeholder:text-[#9AADB8]"
            />
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9AADB8] hover:text-[#1E4D6B] transition-colors"
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 mt-2 bg-[#1E4D6B] text-white rounded-full font-bold text-[14px] hover:bg-[#236181] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-[#1E4D6B]/20"
        >
          {loading ? (
            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Memproses...</>
          ) : 'Masuk'}
        </button>
      </form>

      <p className="mt-12 text-center text-xs text-[#9AADB8] font-medium pb-2">
        Belum punya akun?{' '}
        <span className="text-[#1E4D6B] font-bold">Hubungi admin HR Anda untuk mendapatkan undangan.</span>
      </p>
    </div>
  );
}
