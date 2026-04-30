'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { DM_Sans } from 'next/font/google';

const googleSansAlt = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '700', '800'] });

export default function SessionGuard() {
  const router = useRouter();
  const [showExitModal, setShowExitModal] = useState(false);

  useEffect(() => {
    // 1. Masukkan state palsu ke history browser saat komponen dimuat
    // Tujuannya: Agar saat user klik "Back", mereka tidak keluar, tapi hanya membatalkan state palsu ini.
    history.pushState(null, '', window.location.href);

    const handlePopState = (event: PopStateEvent) => {
      // 2. Saat tombol Back ditekan, browser akan memicu event ini
      // Kita cegah user pergi, dan tampilkan Modal Custom kita
      event.preventDefault();
      setShowExitModal(true);
      
      // Kembalikan state palsu agar jika user cancel, tombol back tetap terproteksi lagi
      history.pushState(null, '', window.location.href);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const handleLogout = () => {
    // Hapus sesi secara keseluruhan sesuai standar sistem Auth kita
    Cookies.remove('auth_session');
    Cookies.remove('token');
    localStorage.removeItem('user_profile');
    localStorage.removeItem('instructor_owner_id');
    
    // Paksa pindah ke halaman login
    router.replace('/login');
  };

  const handleStay = () => {
    setShowExitModal(false);
  };

  if (!showExitModal) return null;

  // --- UI MODAL CUSTOM PROFESIONAL ---
  return (
    <div className={`fixed inset-0 z-9999 flex items-center justify-center p-4 animate-in fade-in duration-200 ${googleSansAlt.className}`}>
      
      {/* 1. Backdrop Blur & Darken */}
      <div 
        className="absolute inset-0 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={handleStay} // Klik area luar untuk batal
      ></div>

      {/* 2. Bubble Card Modal */}
      <div className="bg-white dark:bg-[#111111] w-full max-w-sm rounded-4xl shadow-2xl border border-slate-200 dark:border-slate-800 relative z-10 transform scale-100 transition-all animate-in zoom-in-95 duration-200 overflow-hidden">
        
        {/* Dekorasi Garis Header */}
        <div className="h-1.5 w-full bg-linear-to-r from-rose-500 to-red-600"></div>

        <div className="p-8 text-center">
          {/* Icon Keluar */}
          <div className="mx-auto mb-5 size-16 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center border border-red-100 dark:border-red-500/20">
            <span className="material-symbols-outlined text-3xl text-red-500 block animate-pulse">logout</span>
          </div>

          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">
            Keluar dari Dashboard?
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed font-medium">
            Sesi Anda masih aktif. Jika Anda keluar sekarang, Anda perlu memverifikasi ulang nomor WhatsApp untuk masuk kembali.
          </p>

          <div className="flex gap-3">
            <button 
              onClick={handleLogout}
              className="flex-1 px-4 py-3.5 bg-white dark:bg-transparent border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-all text-sm active:scale-95"
            >
              Ya, Keluar
            </button>
            <button 
              onClick={handleStay}
              className="flex-1 px-4 py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-2xl shadow-lg shadow-slate-900/20 dark:shadow-white/10 hover:bg-slate-800 dark:hover:bg-slate-200 transition-all text-sm active:scale-95"
            >
              Batal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}