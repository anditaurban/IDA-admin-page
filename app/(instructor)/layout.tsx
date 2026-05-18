'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import SessionGuard from '@/components/SessionGuard';
import { useInstructorDashboard } from '@/hooks/useInstructorDashboard';

export default function InstructorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Ambil data dari hook terpusat kita
  const { userProfile, getDisplayName, performLogout } = useInstructorDashboard();

  // Highlight menu otomatis mengikuti URL saat ini
  const activeMenu = pathname.includes('/students') ? 'students' 
                   : pathname.includes('/revenue') ? 'revenue' 
                   : 'dashboard';

  return (
    <div className="flex min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a]">
      {/* Cukup 1 penjaga sesi untuk semua halaman di dalam (instructor) */}
      <SessionGuard />

      {/* Sidebar Statis */}
      <DashboardSidebar 
        activeMenu={activeMenu} 
        setActiveMenu={() => {}} // Sengaja dikosongkan karena nanti Sidebar yang akan pakai <Link> Next.js
        onLogout={(e) => { e.preventDefault(); performLogout(); }} 
      />

      <div className="flex-1 flex flex-col relative min-w-0">
        {/* Header Statis */}
        <DashboardHeader 
          displayName={getDisplayName()} 
          role={userProfile?.role || 'Mentor'} 
        />

        {/* KONTEN HALAMAN DINAMIS MUNCUL DI SINI */}
        {children}
      </div>
    </div>
  );
}