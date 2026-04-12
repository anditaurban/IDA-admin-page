'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { DM_Sans, Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });
const googleSansAlt = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '700', '800'] });

// --- DUMMY DATA UNTUK DASHBOARD ---
const instructorStats = [
  { id: 1, label: 'Total Siswa Aktif', value: '1,248', icon: 'groups', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { id: 2, label: 'Pendapatan Bulan Ini', value: 'Rp 14.5M', icon: 'account_balance_wallet', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { id: 3, label: 'Rata-rata Rating', value: '4.8 / 5.0', icon: 'star', color: 'text-amber-500', bg: 'bg-amber-500/10' },
];

const initialCourses = [
  {
    id: 1,
    slug: 'ngodingai',
    title: 'NgodingAI: Belajar ngoding pakai AI, bangun project website dalam waktu singkat',
    status: 'Published',
    students: 842,
    lastUpdated: '2 jam yang lalu',
    progress: 100,
  }
];

export default function InstructorDashboard() {
  const [courses, setCourses] = useState(initialCourses);
  
  // ✨ STATE UNTUK MODAL TAMBAH KELAS ✨
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState('');

  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseTitle.trim()) return;

    const newSlug = newCourseTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const newCourse = {
      id: Date.now(),
      slug: newSlug,
      title: newCourseTitle,
      status: 'Draft',
      students: 0,
      lastUpdated: 'Baru saja',
      progress: 0,
    };

    setCourses([newCourse, ...courses]);
    setIsAddModalOpen(false);
    setNewCourseTitle('');
    // Di dunia nyata, di sini Anda bisa melempar user ke halaman: router.push(`/course-editor?course=${newSlug}`)
  };

  return (
    <div className={`min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a] relative ${inter.className}`}>
      
      {/* =========================================
          TOP NAVIGATION
      ========================================= */}
      <header className="h-16 bg-white dark:bg-[#111111] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 sticky top-0 z-30">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="size-8 bg-[#00BCD4] rounded-lg flex items-center justify-center shadow-md shadow-cyan-500/20">
              <span className="material-symbols-outlined text-white text-[18px]">school</span>
            </div>
            <span className={`text-lg font-extrabold text-slate-900 dark:text-white tracking-tight ${googleSansAlt.className}`}>
              Instructor<span className="text-[#00BCD4]">Hub</span>
            </span>
          </div>
          
          <nav className="hidden md:flex items-center gap-1 ml-4 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            <Link href="/" className="px-4 py-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-sm font-bold shadow-sm transition-colors">Dashboard</Link>
            <Link href="#" className="px-4 py-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg text-sm font-bold transition-colors">Kelas Saya</Link>
            <Link href="#" className="px-4 py-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg text-sm font-bold transition-colors">Siswa & Review</Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <button className="relative p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
            <span className="material-symbols-outlined text-[24px]">notifications</span>
            <span className="absolute top-1.5 right-1.5 size-2.5 bg-red-500 border-2 border-white dark:border-[#111111] rounded-full"></span>
          </button>
          <div className="h-8 w-px bg-slate-200 dark:bg-slate-800"></div>
          <div className="flex items-center gap-3 cursor-pointer">
            <div className="text-right hidden sm:block">
              <p className={`text-sm font-bold text-slate-900 dark:text-white leading-tight ${googleSansAlt.className}`}>Andita Permata</p>
              <p className="text-[10px] font-bold text-[#00BCD4] uppercase tracking-wider">Expert Mentor</p>
            </div>
            <div className="size-10 rounded-full bg-slate-200 dark:bg-slate-800 border-2 border-[#00BCD4] overflow-hidden relative">
               <Image src="/assets/certificates/ttd.jpg" alt="Profile" fill sizes="40px" className="object-cover opacity-50" />
            </div>
          </div>
        </div>
      </header>

      {/* =========================================
          MAIN DASHBOARD CONTENT
      ========================================= */}
      <main className="max-w-7xl mx-auto px-6 py-10 flex flex-col gap-10">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className={`text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2 ${googleSansAlt.className}`}>
              Selamat datang kembali, Andita! 👋
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Berikut adalah ringkasan performa kelas dan siswa Anda hari ini.</p>
          </div>
          {/* ✨ TOMBOL PEMICU MODAL ✨ */}
          <button onClick={() => setIsAddModalOpen(true)} className={`flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-sm font-bold shadow-lg hover:opacity-90 active:scale-95 transition-all ${googleSansAlt.className}`}>
            <span className="material-symbols-outlined text-[20px]">add</span> Buat Kelas Baru
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {instructorStats.map((stat) => (
            <div key={stat.id} className="bg-white dark:bg-[#111111] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-5 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
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

        <div className="flex flex-col gap-6 mt-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
             <h2 className={`text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 ${googleSansAlt.className}`}>
               <span className="material-symbols-outlined text-[#00BCD4]">library_books</span> Kelola Kelas Anda
             </h2>
             <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center bg-white dark:bg-[#111111] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2">
                   <span className="material-symbols-outlined text-slate-400 text-[18px]">search</span>
                   <input type="text" placeholder="Cari kelas..." className="bg-transparent border-none focus:ring-0 text-sm w-40 ml-2 outline-none dark:text-white" />
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div key={course.id} className="bg-white dark:bg-[#111111] rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl hover:border-cyan-200 dark:hover:border-slate-600 transition-all duration-300 group flex flex-col">
                <div className="h-32 bg-slate-100 dark:bg-slate-900 relative border-b border-slate-200 dark:border-slate-800">
                  <div className="absolute inset-0 bg-linear-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                  <div className="absolute top-4 left-4">
                     <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border backdrop-blur-md flex items-center gap-1.5 ${
                       course.status === 'Published' 
                       ? 'bg-emerald-50/80 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50' 
                       : 'bg-amber-50/80 text-amber-600 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50'
                     }`}>
                       <span className={`size-1.5 rounded-full ${course.status === 'Published' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></span>
                       {course.status}
                     </span>
                  </div>
                </div>

                <div className="p-6 flex flex-col flex-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Class ID: {course.slug}</p>
                  <h3 className={`text-lg font-bold text-slate-900 dark:text-white leading-snug mb-4 group-hover:text-[#00BCD4] transition-colors line-clamp-2 ${googleSansAlt.className}`}>
                    {course.title}
                  </h3>
                  
                  <div className="mt-auto space-y-4">
                    <div className="flex items-center justify-between text-sm">
                       <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
                         <span className="material-symbols-outlined text-[18px]">group</span> {course.students} Siswa
                       </div>
                       <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium text-xs">
                         <span className="material-symbols-outlined text-[16px]">update</span> {course.lastUpdated}
                       </div>
                    </div>

                    <div className="space-y-1.5">
                       <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                         <span>Kelengkapan Kurikulum</span>
                         <span>{course.progress}%</span>
                       </div>
                       <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                         <div className={`h-full rounded-full transition-all ${course.progress === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${course.progress}%` }}></div>
                       </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                       <Link href={`/course-editor?course=${course.slug}`} className={`flex-1 flex justify-center items-center gap-2 px-4 py-2.5 bg-[#00BCD4]/10 hover:bg-[#00BCD4] text-[#00BCD4] hover:text-white rounded-xl text-sm font-bold transition-all border border-[#00BCD4]/20 hover:border-[#00BCD4] active:scale-95 ${googleSansAlt.className}`}>
                         <span className="material-symbols-outlined text-[18px]">edit_square</span> Edit Kelas
                       </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* ✨ MODAL TAMBAH KELAS (GLASSMORPHISM UI) ✨ */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           {/* Backdrop */}
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsAddModalOpen(false)}></div>
           
           {/* Modal Box */}
           <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl shadow-2xl relative z-10 animate-in zoom-in-95 duration-200 overflow-hidden">
              <div className="h-2 w-full bg-[#00BCD4]"></div>
              <div className="p-6 md:p-8">
                 <div className="flex items-center justify-between mb-6">
                    <h3 className={`text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 ${googleSansAlt.className}`}>
                      <span className="material-symbols-outlined text-[#00BCD4]">add_circle</span> Buat Kelas Baru
                    </h3>
                    <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                      <span className="material-symbols-outlined block text-[18px]">close</span>
                    </button>
                 </div>

                 <form onSubmit={handleCreateCourse} className="space-y-5">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Nama Kelas Utama</label>
                      <input 
                        type="text" 
                        required
                        value={newCourseTitle}
                        onChange={(e) => setNewCourseTitle(e.target.value)}
                        placeholder="Contoh: Master UI/UX Design..." 
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-[#00BCD4]/50 outline-none transition-all"
                      />
                      <p className="text-[10px] text-slate-400 mt-2">Sistem akan otomatis membuatkan Class ID berdasarkan nama ini.</p>
                    </div>

                    <button type="submit" className={`w-full py-3.5 bg-[#00BCD4] hover:bg-cyan-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-cyan-500/20 active:scale-95 transition-all ${googleSansAlt.className}`}>
                       Lanjutkan ke Editor
                    </button>
                 </form>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}