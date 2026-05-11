'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { DM_Sans, Inter } from 'next/font/google';
import Cookies from 'js-cookie';
import SessionGuard from '@/components/SessionGuard';
import { useToast } from '@/components/ui/ToastProvider';

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
  batch?: string; 
  thumbnail?: string;
}

interface ApiCourseItem {
  course_id: number;
  owner_id?: number;
  category_id?: number;
  category_name?: string;
  title: string;
  level?: string;
  price?: number;
  thumbnail?: string;
  author?: string;
  rating?: string;
  students?: number;
  updated_at?: string;
  progress?: number;
}

interface UserProfile {
  email?: string;
  role?: string;
  owner_id?: string | number;
  [key: string]: unknown;
}

export default function InstructorDashboard() {
  const router = useRouter();
  const { showToast } = useToast();
  const [activeMenu, setActiveMenu] = useState('dashboard');
  
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // States Pagination & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // STATE MODAL & USER PROFILE
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // BASE URL DARI ENV
  const RAW_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  const BASE_URL = RAW_BASE_URL.endsWith('/') ? RAW_BASE_URL.slice(0, -1) : RAW_BASE_URL;
  const OWNER_ID = process.env.NEXT_PUBLIC_OWNER_ID || ''; 
  const ENV_API_TOKEN = process.env.NEXT_PUBLIC_API_TOKEN || '';

  // ✨ FUNGSI LOGOUT TERPUSAT
  const performLogout = useCallback(() => {
    Cookies.remove('auth_session');
    Cookies.remove('api_token');
    Cookies.remove('token'); // Bersihkan cookie usang jika ada
    localStorage.removeItem('user_profile');
    localStorage.removeItem('instructor_owner_id');
    router.replace('/login');
  }, [router]);

  // 1. PROTEKSI HALAMAN LOKAL & AMBIL DATA PROFIL
  useEffect(() => {
    const sessionToken = Cookies.get('auth_session');
    
    if (!sessionToken) {
      performLogout();
      return;
    }

    const savedProfile = localStorage.getItem('user_profile');
    if (savedProfile) {
      const timer = setTimeout(() => {
        setUserProfile(JSON.parse(savedProfile));
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [performLogout]);

  // ✨ KUNCI: AMBIL TOKEN YANG BENAR
  const getActiveToken = useCallback(() => {
    return Cookies.get('api_token') || ENV_API_TOKEN;
  }, [ENV_API_TOKEN]);

  // 2. FUNGSI FETCH COURSES DARI API (GET TABLE)
  const fetchCourses = useCallback(async (page: number, search: string = '') => {
    setIsLoading(true);
    try {
      if (!BASE_URL || !OWNER_ID) throw new Error("ENV_MISSING");

      const endpoint = search 
        ? `${BASE_URL}/table/courses/${OWNER_ID}/${page}?search=${encodeURIComponent(search)}`
        : `${BASE_URL}/table/course/${OWNER_ID}/${page}`;

      const activeToken = getActiveToken();
      const headers: HeadersInit = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      };
      
      if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;

      const response = await fetch(endpoint, { method: 'GET', headers });

      // AUTO-LOGOUT JIKA API MENOLAK
      if (response.status === 401 || response.status === 403) {
        showToast('error', 'Sesi login Anda telah berakhir. Silakan masuk kembali.');
        performLogout();
        return;
      }

      if (!response.ok) throw new Error(`API_ERROR: HTTP ${response.status}`);
      
      const data = await response.json();
      
      const formattedData: CourseItem[] = data.tableData?.map((item: ApiCourseItem) => ({
        id: item.course_id,
        slug: String(item.course_id), 
        title: item.title,
        status: 'Published', 
        students: item.students || 0,
        lastUpdated: 'Baru saja', 
        progress: 100, 
        batch: item.category_name || 'Umum', 
        thumbnail: item.thumbnail
      })) || [];

      setCourses(formattedData);
      setTotalPages(data.totalPages || 1);
      setCurrentPage(data.currentPage || 1);

    } catch (error) {
      console.error("Gagal memuat data kelas dari API:", error);
      setCourses([{
         id: 1, slug: '1', title: '[Simulasi] UI/UX Design Masterclass', 
         status: 'Draft', students: 0, lastUpdated: 'Baru saja', progress: 0, batch: 'Design'
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [BASE_URL, OWNER_ID, performLogout, showToast, getActiveToken]);

  useEffect(() => {
    const timer = setTimeout(() => fetchCourses(1, searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchCourses]);
  
  // 3. FUNGSI TAMBAH KELAS BARU KE API (POST)
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseTitle.trim()) return;
    setIsSubmitting(true);
    
    try {
      if (!BASE_URL || !OWNER_ID) throw new Error("ENV_MISSING");

      const endpoint = `${BASE_URL}/add/course`;
      const activeToken = getActiveToken();
      
      const headers: HeadersInit = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      };
      
      if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;

      const payload = {
         owner_id: Number(OWNER_ID),
         category_id: 1, 
         title: newCourseTitle,
         level: "Beginner",
         price: 0,
         thumbnail: "",
         author: getDisplayName()
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
      });

      if (response.status === 401 || response.status === 403) {
        showToast('error', 'Sesi login Anda telah berakhir. Silakan masuk kembali.');
        performLogout();
        return;
      }

      if (!response.ok) throw new Error("Gagal membuat kelas");
      const result = await response.json();

      setIsAddModalOpen(false);
      setNewCourseTitle('');
      showToast('success', 'Kelas berhasil dibuat!');
      
      const newCourseId = result.data?.course_id || result.data?.id || result.insertId || '1';
      router.push(`/course-editor?course=${newCourseId}`);

    } catch (error) {
      console.error("Error create course:", error);
      showToast('error', 'Gagal menyambung ke server untuk membuat kelas.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    performLogout();
  };

  const getDisplayName = () => {
    if (!userProfile) return 'Instruktur';
    const emailName = userProfile.email ? userProfile.email.split('@')[0] : 'User';
    return emailName.charAt(0).toUpperCase() + emailName.slice(1);
  };

  return (
    <div className={`flex min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a] ${inter.className}`}>
      <SessionGuard />
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-white dark:bg-[#111111] border-r border-slate-200 dark:border-slate-800 flex-col hidden lg:flex sticky top-0 h-screen shadow-sm">
        <div className="h-20 flex items-center px-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="size-8 bg-[#00BCD4] rounded-lg flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-white text-[18px]">school</span>
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

      {/* MAIN CONTENT AREA */}
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

          {/* KELOLA KELAS (Dari API) */}
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
                       placeholder="Cari nama kelas..." 
                       className="bg-transparent border-none focus:ring-0 text-sm w-full sm:w-48 ml-2 outline-none dark:text-white" 
                     />
                  </div>
               </div>
            </div>

            {isLoading ? (
               <div className="col-span-full py-16 text-center">
                 <div className="size-10 border-4 border-slate-200 border-t-[#00BCD4] rounded-full animate-spin mx-auto mb-4"></div>
                 <p className="text-slate-500 font-medium animate-pulse">Menghubungkan ke database server...</p>
               </div>
            ) : (
               <>
                 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                   {courses.length === 0 ? (
                      <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                         <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">search_off</span>
                         <p className="text-slate-500 font-medium">Tidak ada kelas yang ditemukan di database.</p>
                      </div>
                   ) : (
                     courses.map((course) => (
                       <div key={course.id} className="bg-white dark:bg-[#111111] rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl hover:border-cyan-200 dark:hover:border-slate-700 transition-all duration-300 group flex flex-col">
                         
                         <div className="h-32 bg-slate-100 dark:bg-slate-900 relative border-b border-slate-200 dark:border-slate-800 overflow-hidden">
                           {course.thumbnail && course.thumbnail.startsWith('http') ? (
                              <Image src={course.thumbnail} alt={course.title} fill unoptimized className="object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                           ) : (
                              <div className={`absolute inset-0 opacity-50 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500 ${course.thumbnail || 'bg-linear-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900'}`}></div>
                           )}
                           
                           <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border backdrop-blur-md flex items-center gap-1.5 ${
                                course.status === 'Published' 
                                ? 'bg-emerald-50/90 text-emerald-600 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800/50' 
                                : 'bg-amber-50/90 text-amber-600 border-amber-200 dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-800/50'
                              }`}>
                                 <span className={`size-1.5 rounded-full ${course.status === 'Published' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></span>
                                 {course.status}
                              </span>
                              {course.batch && (
                                <span className="bg-slate-900/80 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg w-max backdrop-blur-md">
                                  {course.batch}
                                </span>
                              )}
                           </div>
                         </div>

                         <div className="p-6 flex flex-col flex-1">
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">ID: {course.id}</p>
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

                             <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                                <Link href={`/course-editor?course=${course.id}`} className={`flex-1 flex justify-center items-center gap-2 px-4 py-2.5 bg-[#00BCD4]/10 hover:bg-[#00BCD4] text-[#00BCD4] hover:text-white rounded-xl text-sm font-bold transition-all border border-[#00BCD4]/20 hover:border-[#00BCD4] active:scale-95 ${googleSansAlt.className}`}>
                                  <span className="material-symbols-outlined text-[18px]">edit_square</span> Edit Kelas
                                </Link>
                             </div>
                           </div>
                         </div>
                       </div>
                     ))
                   )}
                 </div>

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
          </div>
        </main>

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
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Nama / Topik Kelas</label>
                        <input 
                          type="text" 
                          required autoFocus
                          value={newCourseTitle} 
                          onChange={(e) => setNewCourseTitle(e.target.value)} 
                          placeholder="Misal: Front End Stack Masterclass" 
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-[#00BCD4]/50 outline-none transition-all" 
                        />
                        <p className="text-[10px] text-slate-400 mt-2">Data ini akan dikirimkan ke database melalui API.</p>
                      </div>

                      <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className={`w-full py-3.5 mt-2 bg-[#00BCD4] hover:bg-cyan-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-cyan-500/20 active:scale-95 transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed ${googleSansAlt.className}`}
                      >
                         {isSubmitting ? (
                           <><span className="material-symbols-outlined animate-spin text-[18px]">sync</span> Memproses...</>
                         ) : (
                           <>Lanjutkan <span className="material-symbols-outlined text-[18px]">arrow_forward</span></>
                         )}
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