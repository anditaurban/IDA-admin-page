'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import SessionGuard from '@/components/SessionGuard';
import { useInstructorDashboard } from '@/hooks/useInstructorDashboard';

export default function InstructorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // ✨ STATE BARU: Menyimpan status Sidebar (Khusus Mobile)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Ambil data dari hook terpusat kita
  const { userProfile, getDisplayName, performLogout } = useInstructorDashboard();

  // Highlight menu otomatis mengikuti URL saat ini
  const activeMenu = pathname.includes('/courses') ? 'courses' 
                   : pathname.includes('/students') ? 'students' 
                   : pathname.includes('/revenue') ? 'revenue' 
                   : 'dashboard';

  return (
    <div className="flex min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a]">
      {/* Cukup 1 penjaga sesi untuk semua halaman di dalam (instructor) */}
      <SessionGuard />

      {/* ✨ SIDEBAR: Masukkan prop isOpen dan onClose yang diminta TypeScript */}
      <DashboardSidebar 
        activeMenu={activeMenu} 
        setActiveMenu={() => {
          // Opsional: Jika user di mobile klik menu, otomatis tutup sidebar-nya
          setIsSidebarOpen(false); 
        }} 
        onLogout={(e) => { e.preventDefault(); performLogout(); }} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col relative min-w-0">
        {/* ✨ HEADER: Masukkan prop onMenuToggle */}
        <DashboardHeader 
          displayName={getDisplayName()} 
          role={userProfile?.role || 'Mentor'} 
          onMenuToggle={() => setIsSidebarOpen(true)}
        />

        {/* KONTEN HALAMAN DINAMIS MUNCUL DI SINI */}
        {children}
      </div>
    </div>
  );
}