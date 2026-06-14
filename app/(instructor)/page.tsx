'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DM_Sans } from 'next/font/google';

import CreateCourseModal from '@/components/modal/CreateCourseModal';
import CourseCard from '@/components/dashboard/CourseCard';
import { useInstructorDashboard } from '@/hooks/useInstructorDashboard';

const googleSansAlt = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '700', '800'] });

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
    globalStats, 
    isStatsLoading,
    fetchStats,
    isAddModalOpen,
    setIsAddModalOpen,
    activeOwnerId,
    getDisplayName,
    isAuthChecking,
  } = useInstructorDashboard();

  useEffect(() => {
    if (activeOwnerId && !isAuthChecking) {
      fetchCourses(1, "", "", "");
      fetchStats(); // ✨ Panggil fungsi ini agar Card Stats merender animasi loading lalu menampilkan data
    }
  }, [activeOwnerId, isAuthChecking, fetchCourses, fetchStats]);

  // 4 Cards sesuai instruksi Head Team
  const instructorStats = [
    { id: 1, label: 'Total Siswa Aktif', value: globalStats.activeStudents, icon: 'group', color: 'text-blue-500', bg: 'bg-blue-50/80 dark:bg-blue-500/10', border: 'border-blue-100 dark:border-blue-500/20' },
    { id: 2, label: 'Total Kirim Tugas', value: globalStats.totalRecords, icon: 'upload_file', color: 'text-fuchsia-500', bg: 'bg-fuchsia-50/80 dark:bg-fuchsia-500/10', border: 'border-fuchsia-100 dark:border-fuchsia-500/20' },
    { id: 3, label: 'Belum Direview', value: globalStats.needsReviewCount, icon: 'pending_actions', color: 'text-amber-500', bg: 'bg-amber-50/80 dark:bg-amber-500/10', border: 'border-amber-100 dark:border-amber-500/20' },
    { id: 4, label: 'Sudah Dinilai', value: globalStats.gradedCount, icon: 'task_alt', color: 'text-emerald-500', bg: 'bg-emerald-50/80 dark:bg-emerald-500/10', border: 'border-emerald-100 dark:border-emerald-500/20' },
  ];

  // ✨ LOGIKA TRIGGER FETCH API (Jalan Otomatis saat Halaman Dimuat)
  useEffect(() => {
    if (activeOwnerId && !isAuthChecking) {
      fetchCourses(1, "", "", "");
      // Nanti tambahkan fungsi fetchStats() disini
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

        {/* ✨ STATS OVERVIEW (BAGIAN YANG DIUBAH) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {instructorStats.map((stat) => (
            <div 
              key={stat.id} 
              className={`bg-white dark:bg-[#111111] p-5 rounded-3xl border shadow-xs flex items-center gap-4 hover:-translate-y-1 transition-all duration-300 ${stat.border}`}
            >
              <div className={`size-12 rounded-full flex items-center justify-center shrink-0 ${stat.bg} ${stat.color}`}>
                <span className="material-symbols-outlined text-[24px]">{stat.icon}</span>
              </div>
              
              {/* Ubah min-w-0 menjadi flex-1 min-w-0 agar kontainer teks melebar penuh */}
              <div className="flex-1 min-w-0">
                {/* ✨ Hapus 'truncate', ganti dengan 'whitespace-normal break-words' agar teks otomatis ke bawah */}
                <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5 whitespace-normal wrap-break-words">
                  {stat.label}
                </p>
                <p className={`text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white truncate ${googleSansAlt.className}`}>
                  {isStatsLoading ? <span className="animate-pulse opacity-50">...</span> : stat.value}
                </p>
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