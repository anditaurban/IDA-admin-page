'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DM_Sans, Inter } from 'next/font/google';
import Cookies from 'js-cookie';

// 1. TAMBAHKAN IMPORT INI DI BAGIAN ATAS
import SessionGuard from '@/components/SessionGuard';

const inter = Inter({ subsets: ['latin'] });
const googleSansAlt = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '700', '800'] });

// Default dummy stats untuk visualisasi
const instructorStats = [
  { id: 1, label: 'Total Siswa Aktif', value: '1,248', icon: 'groups', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { id: 2, label: 'Pendapatan Bulan Ini', value: 'Rp 14.5M', icon: 'account_balance_wallet', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { id: 3, label: 'Rata-rata Rating', value: '4.8 / 5.0', icon: 'star', color: 'text-amber-500', bg: 'bg-amber-500/10' },
];

interface CourseItem {
  id: string | number;
  slug: string;
  title: string;
  status: string;
  students: number;
  lastUpdated: string;
  progress: number;
}

// ✨ FIX: Menambahkan interface untuk tipe User Profile agar tidak menggunakan 'any'
interface UserProfile {
  email?: string;
  role?: string;
  owner_id?: string | number;
  [key: string]: unknown;
}

export default function InstructorDashboard() {
  const router = useRouter();
  const [activeMenu, setActiveMenu] = useState('dashboard');
  
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // STATE MODAL & USER PROFILE
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState('');
  
  // ✨ FIX: Menggunakan interface UserProfile alih-alih any
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // ✨ FIX: PROTEKSI HALAMAN LOKAL & AMBIL DATA PROFIL
  useEffect(() => {
    const sessionToken = Cookies.get('auth_session') || Cookies.get('token');
    
    // Jika tidak ada token login, paksa pindah ke halaman login
    if (!sessionToken) {
      router.replace('/login');
      return;
    }

    // Jika ada token, ambil profil dari localStorage
    const savedProfile = localStorage.getItem('user_profile');
    if (savedProfile) {
      // ✨ FIX ESLINT: Menggunakan setTimeout untuk mendefer setState
      const timer = setTimeout(() => {
        setUserProfile(JSON.parse(savedProfile));
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [router]);

  // FUNGSI SINKRONISASI LOCALSTORAGE UNTUK KELAS
  useEffect(() => {
    const loadCoursesFromStorage = () => {
      try {
        const allKeys = Object.keys(localStorage);
        const courseKeys = allKeys.filter(key => key.startsWith('db_course_basic_'));
        
        let loadedCourses: CourseItem[] = [];

        if (courseKeys.length > 0) {
          loadedCourses = courseKeys.map((key) => {
             const data = JSON.parse(localStorage.getItem(key) || '{}');
             const slug = key.replace('db_course_basic_', '');
             
             let progress = 45; // Default progress
             const curriculumStr = localStorage.getItem(`db_course_classroom_${slug}`);
             if (curriculumStr && curriculumStr !== '[]') {
                progress = 100; // Mock: Jika ada data kelas, progress naik
             }

             return {
                id: slug,
                slug: slug,
                title: data.title || 'Untitled Course',
                status: data.isPublished ? 'Published' : 'Draft',
                students: Math.floor(Math.random() * 500), 
                lastUpdated: 'Baru saja diperbarui',
                progress: progress,
             };
          });
        } else {
           loadedCourses = [
              {
                 id: 1,
                 slug: 'ngodingai',
                 title: 'NgodingAI: Master GenAI & LLMs',
                 status: 'Published',
                 students: 842,
                 lastUpdated: '2 jam yang lalu',
                 progress: 100,
              }
           ];
        }

        setCourses(loadedCourses);
        setIsLoading(false);
      } catch (error) {
        console.error("Gagal memuat data kelas:", error);
        setIsLoading(false);
      }
    };

    // ✨ FIX ESLINT: Mendefer eksekusi awal agar tidak terjadi sync state update
    const initTimer = setTimeout(() => {
      loadCoursesFromStorage();
    }, 0);

    window.addEventListener('storage', loadCoursesFromStorage);
    
    return () => {
      clearTimeout(initTimer);
      window.removeEventListener('storage', loadCoursesFromStorage);
    };
  }, []);
  
  const generateSlug = (title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  };

  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseTitle.trim()) return;
    
    const slug = generateSlug(newCourseTitle);
    
    const newCourseData = {
       title: newCourseTitle,
       slug: slug,
       thumbnail: "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1000&auto=format&fit=crop",
       level: "Pemula",
       price: "0",
       discount: "0",
       isPublished: false
    };
    
    localStorage.setItem(`db_course_basic_${slug}`, JSON.stringify(newCourseData));

    setIsAddModalOpen(false);
    setNewCourseTitle('');
    
    router.push(`/course-editor?course=${slug}`);
  };

  // ✨ FIX: FUNGSI LOGOUT
  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    // Hapus semua jejak otentikasi
    Cookies.remove('auth_session');
    Cookies.remove('token');
    localStorage.removeItem('user_profile');
    localStorage.removeItem('instructor_owner_id');
    
    // Arahkan ke halaman login
    router.replace('/login');
  };

  const filteredCourses = courses.filter(course => 
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    course.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Mengambil nama depan dari email/username (misal: fayyadh@... -> Fayyadh)
  const getDisplayName = () => {
    if (!userProfile) return 'Instruktur';
    const emailName = userProfile.email ? userProfile.email.split('@')[0] : 'User';
    return emailName.charAt(0).toUpperCase() + emailName.slice(1);
  };

  return (
    <div className={`flex min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a] ${inter.className}`}>
      
      {/* 2. PANGGIL KOMPONEN SESSION GUARD DI SINI (Tepat di bawah pembuka div utama) */}
      <SessionGuard />
      
      {/* =========================================
          SIDEBAR NAVIGATION
      ========================================= */}
      <aside className="w-64 bg-white dark:bg-[#111111] border-r border-slate-200 dark:border-slate-800 flex-col hidden lg:flex sticky top-0 h-screen shadow-sm">
        <div className="h-20 flex items-center px-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="size-8 bg-slate-900 dark:bg-white rounded-lg flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-white dark:text-slate-900 text-[18px]">school</span>
            </div>
            <span className={`text-lg font-extrabold text-slate-900 dark:text-white tracking-tight ${googleSansAlt.className}`}>
              Instructor<span className="text-[#00BCD4]">Hub</span>
            </span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
           <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Main Menu</p>
           {[
             { id: 'dashboard', label: 'Dashboard Utama', icon: 'dashboard' },
             { id: 'students', label: 'Daftar Siswa', icon: 'group' },
             { id: 'revenue', label: 'Pendapatan', icon: 'payments' },
           ].map(menu => (
             <button 
               key={menu.id} 
               onClick={() => setActiveMenu(menu.id)}
               className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                 activeMenu === menu.id 
                 ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' 
                 : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-700 dark:hover:text-slate-300'
               }`}
             >
                <span className={`material-symbols-outlined text-[20px] ${activeMenu === menu.id ? 'text-[#00BCD4]' : ''}`}>{menu.icon}</span>
                {menu.label}
             </button>
           ))}
        </nav>

        <div className="p-6 border-t border-slate-200 dark:border-slate-800">
           <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
              <span className="material-symbols-outlined text-[20px]">logout</span>
              Keluar Panel
           </button>
        </div>
      </aside>

      {/* =========================================
          MAIN CONTENT AREA
      ========================================= */}
      <div className="flex-1 flex flex-col relative min-w-0">
        <header className="h-20 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 md:px-10 sticky top-0 z-30">
          <h1 className={`text-xl font-bold text-slate-900 dark:text-white ${googleSansAlt.className}`}>
            Dashboard Instruktur
          </h1>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[24px]">notifications</span>
              <span className="absolute top-1.5 right-1.5 size-2.5 bg-red-500 border-2 border-white dark:border-[#111111] rounded-full"></span>
            </button>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800"></div>
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="text-right hidden sm:block">
                {/* ✨ FIX: Menampilkan nama dan role dinamis dari API Login */}
                <p className={`text-sm font-bold text-slate-900 dark:text-white leading-tight ${googleSansAlt.className}`}>
                  {getDisplayName()}
                </p>
                <p className="text-[10px] font-bold text-[#00BCD4] uppercase tracking-wider">
                  {userProfile?.role || 'Mentor'}
                </p>
              </div>
              <div className="size-10 rounded-full bg-slate-200 dark:bg-slate-800 border-2 border-[#00BCD4] overflow-hidden relative">
                 <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-bold uppercase">
                   {getDisplayName().substring(0, 2)}
                 </div>
              </div>
            </div>
          </div>
        </header>

        <main className="p-6 md:p-10 flex flex-col gap-10 max-w-7xl w-full mx-auto">
          
          {/* WELCOME SECTION */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 p-8 bg-linear-to-r from-[#1b2636] to-slate-800 rounded-3xl shadow-xl relative overflow-hidden">
            <div className="absolute top-[-50%] right-[-10%] w-[50%] h-[200%] bg-[#00BCD4]/20 blur-[100px] rounded-full pointer-events-none"></div>
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 gap-4">
               <h2 className={`text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 ${googleSansAlt.className}`}>
                 <span className="material-symbols-outlined text-[#00BCD4]">library_books</span> Kelola Kelas Anda
               </h2>
               
               <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="flex-1 sm:flex-none flex items-center bg-white dark:bg-[#111111] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-[#00BCD4]/50 transition-all">
                     <span className="material-symbols-outlined text-slate-400 text-[18px]">search</span>
                     <input 
                       type="text" 
                       value={searchQuery}
                       onChange={(e) => setSearchQuery(e.target.value)}
                       placeholder="Cari kelas..." 
                       className="bg-transparent border-none focus:ring-0 text-sm w-full sm:w-48 ml-2 outline-none dark:text-white" 
                     />
                  </div>
               </div>
            </div>

            {isLoading ? (
               <div className="col-span-full py-16 text-center">
                 <div className="size-10 border-4 border-slate-200 border-t-[#00BCD4] rounded-full animate-spin mx-auto mb-4"></div>
                 <p className="text-slate-500 font-medium animate-pulse">Memuat data kelas...</p>
               </div>
            ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                 {filteredCourses.length === 0 ? (
                    <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                       <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">search_off</span>
                       <p className="text-slate-500 font-medium">Tidak ada kelas yang sesuai dengan pencarian Anda.</p>
                    </div>
                 ) : (
                   filteredCourses.map((course) => (
                     <div key={course.id} className="bg-white dark:bg-[#111111] rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl hover:border-cyan-200 dark:hover:border-slate-700 transition-all duration-300 group flex flex-col">
                       
                       <div className="h-32 bg-slate-100 dark:bg-slate-900 relative border-b border-slate-200 dark:border-slate-800 overflow-hidden">
                         <div className="absolute inset-0 bg-linear-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900 opacity-50 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"></div>
                         <div className="absolute top-4 left-4 z-10">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border backdrop-blur-md flex items-center gap-1.5 ${
                              course.status === 'Published' 
                              ? 'bg-emerald-50/90 text-emerald-600 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800/50' 
                              : 'bg-amber-50/90 text-amber-600 border-amber-200 dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-800/50'
                            }`}>
                               <span className={`size-1.5 rounded-full ${course.status === 'Published' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></span>
                               {course.status}
                            </span>
                         </div>
                       </div>

                       <div className="p-6 flex flex-col flex-1">
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">ID: {course.slug}</p>
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
                                <div className={`h-full rounded-full transition-all ${course.progress === 100 ? 'bg-emerald-500' : 'bg-[#00BCD4]'}`} style={{ width: `${course.progress}%` }}></div>
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
                   ))
                 )}
               </div>
            )}
          </div>
        </main>

        {/* =========================================
            MODAL BUAT KELAS BARU
        ========================================= */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsAddModalOpen(false)}></div>
             
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
                          required autoFocus
                          value={newCourseTitle} 
                          onChange={(e) => setNewCourseTitle(e.target.value)} 
                          placeholder="Misal: Mahir Next.js dalam 30 Hari" 
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-[#00BCD4]/50 outline-none transition-all" 
                        />
                        <p className="text-[10px] text-slate-400 mt-2">Sistem akan otomatis membuatkan Class ID berdasarkan nama ini.</p>
                      </div>
                      
                      {newCourseTitle && (
                        <div className="bg-cyan-50 dark:bg-cyan-900/10 p-3 rounded-xl border border-cyan-100 dark:border-cyan-900/30">
                          <p className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider mb-1">Class ID (Slug) Otomatis:</p>
                          <p className="text-sm font-mono text-slate-600 dark:text-slate-300 truncate">{generateSlug(newCourseTitle)}</p>
                        </div>
                      )}

                      <button type="submit" className={`w-full py-3.5 mt-2 bg-[#00BCD4] hover:bg-cyan-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-cyan-500/20 active:scale-95 transition-all flex justify-center items-center gap-2 ${googleSansAlt.className}`}>
                         Lanjutkan ke Editor <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                      </button>
                   </form>
                </div>
             </div>
          </div>
        )}
        
      </div>
    </div>
  );
}