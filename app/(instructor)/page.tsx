'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { DM_Sans } from 'next/font/google';

import CreateCourseModal from '@/components/modal/CreateCourseModal';
import CourseCard from '@/components/dashboard/CourseCard';
import { useInstructorDashboard } from '@/hooks/useInstructorDashboard';

const googleSansAlt = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '700', '800'] });

const instructorStats = [
  { id: 1, label: 'Total Siswa Aktif', value: '1,248', icon: 'groups', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { id: 2, label: 'Pendapatan Bulan Ini', value: 'Rp 14.5M', icon: 'account_balance_wallet', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { id: 3, label: 'Rata-rata Rating', value: '4.8 / 5.0', icon: 'star', color: 'text-amber-500', bg: 'bg-amber-500/10' },
];

export default function InstructorDashboardContent() {
  const router = useRouter();
  const currentYear = new Date().getFullYear(); 

  const {
    courses,
    isLoading,
    searchQuery,
    setSearchQuery,
    currentPage,
    totalPages,
    totalItems, // ✨ AMBIL DATA JUMLAH KELAS
    fetchCourses,
    isAddModalOpen,
    setIsAddModalOpen,
    activeOwnerId,
    getDisplayName,
    isAuthChecking,
  } = useInstructorDashboard();

  if (isAuthChecking) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh] text-slate-600 dark:text-slate-300">
        <div className="text-center">
          <div className="size-10 border-4 border-slate-200 border-t-[#00BCD4] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-bold">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <main className="p-6 md:p-10 flex flex-col gap-10 max-w-7xl w-full mx-auto">
        {/* WELCOME SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 p-8 bg-linear-to-r from-[#1b2636] to-slate-800 rounded-3xl shadow-xl relative overflow-hidden">
          <div className="absolute top-[-50%] right-[-10%] w-[50%] h-[200%] bg-[#00BCD4]/20 blur-[100px] rounded-full pointer-events-none" />
          <div className="relative z-10 text-white">
            <h2 className={`text-3xl md:text-4xl font-extrabold tracking-tight mb-2 ${googleSansAlt.className}`}>
              Selamat datang, {getDisplayName()}! 👋
            </h2>
            <p className="text-slate-300 font-medium">Berikut adalah ringkasan performa kelas dan siswa Anda hari ini.</p>
          </div>
          <button onClick={() => setIsAddModalOpen(true)} className={`relative z-10 flex items-center gap-2 px-6 py-3.5 bg-[#00BCD4] hover:bg-[#00acc1] text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-cyan-500/30 active:scale-95 transition-all whitespace-nowrap ${googleSansAlt.className}`}>
            <span className="material-symbols-outlined text-[20px]">add</span> Buat Kelas Baru
          </button>
        </div>

        {/* STATS OVERVIEW */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {instructorStats.map((stat) => (
            <div key={stat.id} className="bg-white dark:bg-[#111111] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-5 hover:-translate-y-1 transition-transform duration-300">
              <div className={`size-14 rounded-2xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                <span className="material-symbols-outlined text-[28px]">{stat.icon}</span>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{stat.label}</p>
                <p className={`text-2xl font-extrabold text-slate-900 dark:text-white ${googleSansAlt.className}`}>{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* KELOLA KELAS */}
        <div className="flex flex-col gap-6 mt-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-slate-200 dark:border-slate-800 pb-4 gap-4">
            
            {/* ✨ UX: Judul dan Resume Jumlah Kelas digabung agar terbaca runut */}
            {/* ✨ UX: Judul dan Resume Jumlah Kelas digabung agar terbaca runut */}
            <div>
              <h2 className={`text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 ${googleSansAlt.className}`}>
                <span className="material-symbols-outlined text-[#00BCD4]">school</span> Kelola Kelas Anda
              </h2>
              {!isLoading && (
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1.5 animate-in fade-in">
                  Jumlah kelas Anda sebanyak <span className="font-bold text-[#00BCD4] dark:text-cyan-400">{totalItems}</span> kelas
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="flex-1 sm:flex-none flex items-center bg-white dark:bg-[#111111] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-[#00BCD4]/50 transition-all">
                <span className="material-symbols-outlined text-slate-400 text-[18px]">search</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama kelas..."
                  className="bg-transparent border-none focus:ring-0 text-sm w-full sm:w-48 ml-2 outline-none dark:text-white"
                />
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="col-span-full py-16 text-center">
              <div className="size-10 border-4 border-slate-200 border-t-[#00BCD4] rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-500 font-medium animate-pulse">Menghubungkan ke database server...</p>
            </div>
          ) : (
            <>
              {/* ✨ KELAS DENGAN MAX LIMIT 9 (3x3 GRID) */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {courses.length === 0 ? (
                  <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                    <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">inbox</span>
                    <p className="text-slate-500 font-medium">Tidak ada kelas yang ditemukan untuk akun ini.</p>
                  </div>
                ) : (
                  courses.map((course) => <CourseCard key={course.id} course={course} />)
                )}
              </div>

              {/* ✨ BUNGKUS DENGAN PENGECEKAN totalPages > 1 */}
              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-3">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => fetchCourses(currentPage - 1, searchQuery)}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#161616] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-sm block">chevron_left</span>
                  </button>
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-400 px-4">
                    Hal {currentPage} dari {totalPages}
                  </span>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => fetchCourses(currentPage + 1, searchQuery)}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#161616] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-sm block">chevron_right</span>
                  </button>
                </div>
              )}
            </>
          )}
          
          <footer className="mt-2 border-t border-slate-200 dark:border-slate-800 pt-4 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
            &copy; {currentYear} InstructorHub - PT Jago Inovasi Bisnis.
          </footer>

        </div>
      </main>

      <CreateCourseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={(newCourseId) => router.push(`/course-editor?course=${newCourseId}`)}
        ownerId={activeOwnerId}
        authorName={getDisplayName()}
      />
    </>
  );
}