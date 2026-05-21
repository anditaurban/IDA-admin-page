'use client';

import Link from 'next/link'; // ✨ TAMBAHKAN INI
import React from 'react';
import { DM_Sans } from 'next/font/google';

const googleSansAlt = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '700', '800'] });

type DashboardSidebarProps = {
  activeMenu: string;
  setActiveMenu: (menu: string) => void;
  onLogout: (e: React.MouseEvent) => void;
  isOpen: boolean; // ✨ Status buka/tutup dari layout
  onClose: () => void; // ✨ Fungsi penutup dari layout
};

export default function DashboardSidebar({ activeMenu, setActiveMenu, onLogout, isOpen, onClose }: DashboardSidebarProps) {
  return (
    <>
      {/* ✨ OVERLAY HITAM TRANSPARAN KHUSUS MOBILE */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm z-40 lg:hidden animate-in fade-in"
        />
      )}

      {/* ✨ LOGIKA RESPONSIVE SIDEBAR */}
      <aside 
        className={`fixed lg:sticky top-0 left-0 h-screen z-50 w-64 bg-white dark:bg-[#111111] border-r border-slate-200 dark:border-slate-800 flex flex-col shadow-2xl lg:shadow-sm transition-transform duration-300 ease-in-out lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        `}
      >
        {/* Header Sidebar */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="size-8 bg-[#00BCD4] rounded-lg flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-white text-[18px]">school</span>
            </div>
            <span className={`text-lg font-extrabold text-slate-900 dark:text-white tracking-tight ${googleSansAlt.className}`}>
              InstructorHub<span className="text-[#00BCD4]">.</span>
            </span>
          </div>

          {/* Tombol X (Hanya muncul di Mobile) */}
          <button onClick={onClose} className="lg:hidden p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Navigasi Utama */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Main Menu</p>
          {[
            // ✨ Tambahkan properti href ke masing-masing menu
            { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', href: '/' },
            { id: 'courses', label: 'All Courses', icon: 'library_books', href: '/courses' },
            { id: 'students', label: 'Students', icon: 'group', href: '/students' },
            { id: 'revenue', label: 'Revenue', icon: 'payments', href: '/revenue' },
          ].map((menu) => (
            // ✨ Ubah <button> menjadi <Link>
            <Link
              key={menu.id}
              href={menu.href}
              onClick={() => setActiveMenu(menu.id)} // Ini sekarang berfungsi untuk menutup sidebar di mobile
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeMenu === menu.id
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                  : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <span className={`material-symbols-outlined text-[20px] ${activeMenu === menu.id ? 'text-[#00BCD4]' : ''}`}>
                {menu.icon}
              </span>
              {menu.label}
            </Link>
          ))}
        </nav>

        {/* Tombol Logout di Bawah */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-800">
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
            <span className="material-symbols-outlined text-[20px]">logout</span>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}