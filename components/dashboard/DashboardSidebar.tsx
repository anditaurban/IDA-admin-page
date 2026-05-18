'use client';

import React from 'react';
import { DM_Sans } from 'next/font/google';

const googleSansAlt = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '700', '800'] });

type DashboardSidebarProps = {
  activeMenu: string;
  setActiveMenu: (menu: string) => void;
  onLogout: (e: React.MouseEvent) => void;
};

export default function DashboardSidebar({ activeMenu, setActiveMenu, onLogout }: DashboardSidebarProps) {
  return (
    <aside className="w-64 bg-white dark:bg-[#111111] border-r border-slate-200 dark:border-slate-800 flex-col hidden lg:flex sticky top-0 h-screen shadow-sm">
      <div className="h-20 flex items-center px-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="size-8 bg-[#00BCD4] rounded-lg flex items-center justify-center shadow-md">
            <span className="material-symbols-outlined text-white text-[18px]">school</span>
          </div>
          <span className={`text-lg font-extrabold text-slate-900 dark:text-white tracking-tight ${googleSansAlt.className}`}>
            InstructorHub<span className="text-[#00BCD4]">.</span>
          </span>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Main Menu</p>
        {[
          { id: 'dashboard', label: 'Dashboard Utama', icon: 'dashboard' },
          { id: 'students', label: 'Daftar Siswa', icon: 'group' },
          { id: 'revenue', label: 'Pendapatan', icon: 'payments' },
        ].map((menu) => (
          <button
            key={menu.id}
            onClick={() => setActiveMenu(menu.id)}
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
          </button>
        ))}
      </nav>

      <div className="p-6 border-t border-slate-200 dark:border-slate-800">
        <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
          <span className="material-symbols-outlined text-[20px]">logout</span>
          Keluar Panel
        </button>
      </div>
    </aside>
  );
}