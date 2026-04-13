'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { LockKey, Eye, EyeSlash, CheckCircle, XCircle } from '@phosphor-icons/react';

function SetPasswordContent() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token') || '';

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [tokenStatus, setTokenStatus] = useState<'loading' | 'valid' | 'invalid'>('loading');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) { setTokenStatus('invalid'); return; }
    fetch(`/api/auth/set-password?token=${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.valid) {
          setTokenStatus('valid');
          setFullName(d.fullName || '');
          setEmail(d.email || '');
        } else {
          setTokenStatus('invalid');
        }
      })
      .catch(() => setTokenStatus('invalid'));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError('Konfirmasi password tidak cocok.'); return; }
    if (password.length < 8) { setError('Password minimal 8 karakter.'); return; }

    setLoading(true);
    setError('');

    const res = await fetch('/api/auth/set-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();

    if (!res.ok) { setError(data.error || 'Terjadi kesalahan.'); setLoading(false); return; }
    router.push(data.redirectTo || '/karyawan');
  }

  const strength = password.length >= 12 ? 3 : password.length >= 8 ? 2 : password.length > 0 ? 1 : 0;
  const strengthLabel = ['', 'Lemah', 'Cukup', 'Kuat'][strength];
  const strengthColor = ['', 'bg-red-400', 'bg-amber-400', 'bg-green-400'][strength];

  if (tokenStatus === 'loading') {
    return (
      <div className="min-h-screen bg-[#EBF4FA] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#1E4D6B]/20 border-t-[#1E4D6B] rounded-full animate-spin" />
      </div>
    );
  }

  if (tokenStatus === 'invalid') {
    return (
      <div className="min-h-screen bg-[#EBF4FA] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center">
          <XCircle weight="duotone" className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-[#1E3A5F] mb-2">Link Tidak Valid</h1>
          <p className="text-[#5A7A8C] text-sm leading-relaxed">
            Link undangan sudah kedaluwarsa atau tidak valid.<br />
            Hubungi admin HR untuk mendapatkan link baru.
          </p>
          <a href="/" className="mt-6 inline-block text-[#1E4D6B] font-bold text-sm hover:underline">
            ← Kembali ke Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EBF4FA] flex items-center justify-center p-4">
      <div className="w-full max-w-[960px] bg-white rounded-[2rem] overflow-hidden flex flex-col md:flex-row shadow-2xl">
        {/* Left Panel */}
        <div className="w-full md:w-[42%] bg-[#1E4D6B] p-10 flex flex-col relative overflow-hidden text-white">
          <div className="absolute top-[-20%] right-[-30%] w-[150%] h-[150%] bg-[#22516A] rounded-[100%] opacity-50 pointer-events-none" />
          <div className="absolute bottom-[-10%] left-[-20%] w-[100%] h-[100%] bg-[#36799C] rounded-[100%] opacity-40 pointer-events-none" />
          
          <div className="relative z-10 w-16 h-16 mb-10 flex items-center justify-center bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20 shadow-xl group hover:scale-105 transition-transform duration-300">
            {mounted ? (
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="w-10 h-10 object-contain drop-shadow-md animate-in zoom-in duration-500"
              />
            ) : (
              <div className="w-full h-full opacity-0" />
            )}
          </div>
          <div className="relative z-10 mt-6">
            <h1 className="text-3xl font-bold leading-tight mb-3 tracking-tight">Selamat Datang!</h1>
            <p className="text-[#B5DBEC] text-sm font-light leading-relaxed opacity-90">
              Atur kata sandi untuk mengaktifkan akun anda
            </p>
          </div>
          <div className="relative z-10 mt-5">
            <div className="bg-white/10 border border-white/20 rounded-2xl p-5 backdrop-blur-sm">
              <p className="text-sm font-bold text-white mb-1">Selanjutnya</p>
              <p className="text-xs text-[#B5DBEC] font-light leading-relaxed">
                Setelah mengatur kata sandi, anda langsung bisa mengakses dashboard onboarding anda
              </p>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-full md:w-[58%] p-10 lg:px-14 lg:py-12 flex flex-col justify-center">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#1E3A5F] mb-1 tracking-tight">Atur Kata Sandi</h2>
            {fullName && (
              <p className="text-sm text-[#5A7A8C] font-medium">
                Halo, <span className="font-bold text-[#1E4D6B]">{fullName}</span>! ({email})
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium">
                {error}
              </div>
            )}

            {/* Password */}
            <div>
              <label className="text-xs font-bold text-[#5A7A8C] uppercase tracking-wider mb-2 block">
                Kata Sandi Baru
              </label>
              <div className="relative">
                <LockKey weight="duotone" className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#9AADB8]" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="Minimal 8 karakter"
                  className="w-full pl-11 pr-12 py-3.5 border border-[#D8E8F0] rounded-xl text-[13px] text-[#1E3A5F] font-medium focus:outline-none focus:border-[#1E4D6B] focus:ring-4 focus:ring-[#1E4D6B]/5 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9AADB8] hover:text-[#1E4D6B] transition-colors"
                >
                  {showPw ? <EyeSlash weight="duotone" className="w-5 h-5" /> : <Eye weight="duotone" className="w-5 h-5" />}
                </button>
              </div>
              {/* Strength bar */}
              {password.length > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex gap-1 flex-1">
                    {[1, 2, 3].map(i => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${strength >= i ? strengthColor : 'bg-[#E8EFF4]'}`}
                      />
                    ))}
                  </div>
                  <span className={`text-[11px] font-bold ${strength === 1 ? 'text-red-400' : strength === 2 ? 'text-amber-500' : 'text-green-500'}`}>
                    {strengthLabel}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-xs font-bold text-[#5A7A8C] uppercase tracking-wider mb-2 block">
                Konfirmasi Kata Sandi
              </label>
              <div className="relative">
                <LockKey weight="duotone" className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#9AADB8]" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                  placeholder="Ulangi kata sandi"
                  className={`w-full pl-11 pr-4 py-3.5 border rounded-xl text-[13px] font-medium focus:outline-none focus:ring-4 transition-all ${confirm && confirm !== password
                    ? 'border-red-300 focus:border-red-400 focus:ring-red-100 text-red-500'
                    : 'border-[#D8E8F0] focus:border-[#1E4D6B] focus:ring-[#1E4D6B]/5 text-[#1E3A5F]'
                    }`}
                />
                {confirm && confirm === password && (
                  <CheckCircle weight="duotone" className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-green-500" />
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !password || !confirm}
              className="w-full py-3.5 bg-[#1E4D6B] text-white rounded-xl font-bold text-[14px] hover:bg-[#236181] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Mengaktifkan…</>
              ) : 'Aktifkan Akun & Masuk →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#EBF4FA] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#1E4D6B]/20 border-t-[#1E4D6B] rounded-full animate-spin" />
      </div>
    }>
      <SetPasswordContent />
    </Suspense>
  );
}
