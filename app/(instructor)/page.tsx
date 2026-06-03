'use client';

import React, { useEffect } from 'react';
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
    currentPage,
    totalPages,
    totalItems,
    fetchCourses,
    isAddModalOpen,
    setIsAddModalOpen,
    activeOwnerId,
    getDisplayName,
    isAuthChecking,
  } = useInstructorDashboard();

  // ✨ LOGIKA TRIGGER FETCH API (Jalan Otomatis saat Halaman Dimuat)
  // Karena tidak ada filter, kita panggil API kosong (page 1) langsung saat auth selesai
  useEffect(() => {
    if (activeOwnerId && !isAuthChecking) {
      fetchCourses(1, "", "", "");
    }
  }, [activeOwnerId, isAuthChecking, fetchCourses]);

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
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
          {instructorStats.map((stat, index) => (
            <div 
              key={stat.id} 
              className={`bg-white dark:bg-[#111111] p-4 md:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3 md:gap-5 hover:-translate-y-1 transition-transform duration-300 ${
                index === 2 ? 'col-span-2 md:col-span-1' : 'col-span-1'
              }`}
            >
              <div className={`size-10 md:size-14 rounded-2xl flex items-center justify-center shrink-0 ${stat.bg} ${stat.color}`}>
                <span className="material-symbols-outlined text-[24px] md:text-[28px]">{stat.icon}</span>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5 truncate">{stat.label}</p>
                <p className={`text-lg md:text-2xl font-extrabold text-slate-900 dark:text-white truncate ${googleSansAlt.className}`}>{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* KELOLA KELAS */}
        <div className="flex flex-col gap-6 mt-4">
          <div className="flex flex-col border-b border-slate-200 dark:border-slate-800 pb-6 gap-6">
            
            {/* Header Title */}
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
          </div>

          {isLoading ? (
            <div className="col-span-full py-16 text-center">
              <div className="size-10 border-4 border-slate-200 border-t-[#00BCD4] rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-500 font-medium animate-pulse">Menghubungkan ke database server...</p>
            </div>
          ) : (
            <>
              {/* KELAS */}
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 md:gap-6">
                {courses.length === 0 ? (
                  <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                    <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">search_off</span>
                    <p className="text-slate-500 font-medium text-sm md:text-base">Anda belum memiliki kelas.</p>
                  </div>
                ) : (
                  courses.map((course) => <CourseCard key={course.id} course={course} />)
                )}
              </div>

              {/* PAGINATION */}
              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2 sm:gap-3">
                  
                  {/* ⏪ Tombol Ke Halaman Pertama */}
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => fetchCourses(1, "", "", "")}
                    title="Ke Halaman Pertama"
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#161616] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm block">keyboard_double_arrow_left</span>
                  </button>

                  {/* ◀️ Tombol Sebelumnya (Prev) */}
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => fetchCourses(currentPage - 1, "", "", "")}
                    title="Halaman Sebelumnya"
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#161616] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm block">chevron_left</span>
                  </button>

                  {/* 🔢 Indikator Halaman */}
                  <div className="px-4 py-2 rounded-xl bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-600 dark:text-slate-400">
                      Hal <span className="text-[#00BCD4]">{currentPage}</span> dari {totalPages}
                    </span>
                  </div>

                  {/* ▶️ Tombol Berikutnya (Next) */}
                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => fetchCourses(currentPage + 1, "", "", "")}
                    title="Halaman Berikutnya"
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#161616] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm block">chevron_right</span>
                  </button>

                  {/* ⏩ Tombol Ke Halaman Terakhir */}
                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => fetchCourses(totalPages, "", "", "")}
                    title="Ke Halaman Terakhir"
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#161616] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm block">keyboard_double_arrow_right</span>
                  </button>

                </div>
              )}
            </>
          )}
          
          <br/>

        <footer className="flex justify-center gap-6 pt-2">
          <p className="text-xs text-[#666685] font-medium">
            &copy; {currentYear} InstructorHub - PT Jago Inovasi Bisnis.
          </p>
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