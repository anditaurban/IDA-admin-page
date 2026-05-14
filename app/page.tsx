'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { DM_Sans, Inter } from 'next/font/google';
import Cookies from 'js-cookie';
import SessionGuard from '@/components/SessionGuard';
import { useToast } from '@/components/ui/ToastProvider';
import CreateCourseModal from '@/components/modal/CreateCourseModal';

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
  user_id?: number;
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
  id?: string | number;
  user_id?: string | number;
  owner_id?: string | number;
  email?: string;
  role?: string;
  name?: string;
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

  // State Modal & User Profile
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Base URL dari ENV
  const RAW_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  const BASE_URL = RAW_BASE_URL.endsWith('/') ? RAW_BASE_URL.slice(0, -1) : RAW_BASE_URL;
  const ENV_OWNER_ID = process.env.NEXT_PUBLIC_OWNER_ID || '';
  const ENV_API_TOKEN = process.env.NEXT_PUBLIC_API_TOKEN || '';

  /**
   * Prioritas ID pemilik/course:
   * 1. owner_id dari profile login
   * 2. user_id dari profile login
   * 3. id dari profile login
   * 4. ENV_OWNER_ID sebagai fallback development
   */
  const activeOwnerId = useMemo(() => {
    const profileOwnerId = userProfile?.owner_id ?? userProfile?.user_id ?? userProfile?.id;
    return profileOwnerId ? String(profileOwnerId) : ENV_OWNER_ID;
  }, [userProfile, ENV_OWNER_ID]);

  // Fungsi logout terpusat
  const performLogout = useCallback(() => {
    Cookies.remove('auth_session');
    Cookies.remove('api_token');
    Cookies.remove('token');
    localStorage.removeItem('user_profile');
    localStorage.removeItem('instructor_owner_id');
    router.replace('/login');
  }, [router]);

  // Proteksi root page: kalau belum login, langsung lempar ke /login
  useEffect(() => {
    const sessionToken = Cookies.get('auth_session');

    if (!sessionToken) {
      performLogout();
      return;
    }

    const savedProfile = localStorage.getItem('user_profile');

    if (!savedProfile) {
      showToast('error', 'Data profil login tidak ditemukan. Silakan masuk kembali.');
      performLogout();
      return;
    }

    try {
      const parsedProfile = JSON.parse(savedProfile) as UserProfile;
      setUserProfile(parsedProfile);
    } catch (error) {
      console.error('Gagal membaca user_profile:', error);
      showToast('error', 'Data sesi rusak. Silakan masuk kembali.');
      performLogout();
      return;
    } finally {
      setIsAuthChecking(false);
    }
  }, [performLogout, showToast]);

  // Ambil token aktif dari cookie login, fallback ENV untuk development
  const getActiveToken = useCallback(() => {
    return Cookies.get('api_token') || ENV_API_TOKEN;
  }, [ENV_API_TOKEN]);

  // Fetch courses berdasarkan activeOwnerId/user_id yang sedang login
  const fetchCourses = useCallback(
    async (page: number, search: string = '') => {
      if (isAuthChecking) return;

      setIsLoading(true);

      try {
        if (!BASE_URL || !activeOwnerId) throw new Error('ENV_OR_OWNER_ID_MISSING');

        const endpoint = search
          ? `${BASE_URL}/table/courses/${activeOwnerId}/${page}?search=${encodeURIComponent(search)}`
          : `${BASE_URL}/table/course/${activeOwnerId}/${page}`;

        const activeToken = getActiveToken();
        const headers: HeadersInit = {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        };

        if (activeToken) headers.Authorization = `Bearer ${activeToken}`;

        const response = await fetch(endpoint, { method: 'GET', headers });

        // Auto logout jika API menolak token/sesi
        if (response.status === 401 || response.status === 403) {
          showToast('error', 'Sesi login Anda telah berakhir. Silakan masuk kembali.');
          performLogout();
          return;
        }

        if (!response.ok) throw new Error(`API_ERROR: HTTP ${response.status}`);

        const data = await response.json();

        const formattedData: CourseItem[] = data.tableData?.map((item: ApiCourseItem) => {
          let displayThumb = item.thumbnail || '';

          if (
            displayThumb &&
            !displayThumb.startsWith('http') &&
            !displayThumb.startsWith('bg-') &&
            !displayThumb.startsWith('data:')
          ) {
            const cleanPath = displayThumb.startsWith('/') ? displayThumb.slice(1) : displayThumb;
            displayThumb = `${BASE_URL}/thumbnail/course/${cleanPath}`;
          }

          return {
            id: item.course_id,
            slug: String(item.course_id),
            title: item.title,
            status: 'Published',
            students: item.students || 0,
            lastUpdated: item.updated_at || 'Baru saja',
            progress: item.progress || 100,
            batch: item.category_name || 'Umum',
            thumbnail: displayThumb,
          };
        }) || [];

        setCourses(formattedData);
        setTotalPages(data.totalPages || 1);
        setCurrentPage(data.currentPage || page);
      } catch (error) {
        console.error('Gagal memuat data kelas dari API:', error);
        setCourses([]);
        setTotalPages(1);
        setCurrentPage(1);
      } finally {
        setIsLoading(false);
      }
    },
    [BASE_URL, activeOwnerId, getActiveToken, isAuthChecking, performLogout, showToast]
  );

  useEffect(() => {
    if (isAuthChecking || !activeOwnerId) return;

    const timer = setTimeout(() => {
      fetchCourses(1, searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, fetchCourses, isAuthChecking, activeOwnerId]);

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    performLogout();
  };

  const getDisplayName = () => {
    if (!userProfile) return 'Instruktur';
    if (userProfile.name) return String(userProfile.name);

    const emailName = userProfile.email ? userProfile.email.split('@')[0] : 'User';
    return emailName.charAt(0).toUpperCase() + emailName.slice(1);
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0a0a0a] text-slate-600 dark:text-slate-300">
        <div className="text-center">
          <div className="size-10 border-4 border-slate-200 border-t-[#00BCD4] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-bold">Memeriksa sesi login...</p>
        </div>
      </div>
    );
  }

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
              InstructorHub<span className="text-[#00BCD4]"></span>
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
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
            <span className="material-symbols-outlined text-[20px]"></span>
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
              <span className="absolute top-1.5 right-1.5 size-2.5 bg-red-500 border-2 border-white dark:border-[#111111] rounded-full" />
            </button>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />
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
            <div className="absolute top-[-50%] right-[-10%] w-[50%] h-[200%] bg-[#00BCD4]/20 blur-[100px] rounded-full pointer-events-none" />
            <div className="relative z-10 text-white">
              <h2 className={`text-3xl md:text-4xl font-extrabold tracking-tight mb-2 ${googleSansAlt.className}`}>
                Selamat datang, {getDisplayName()}! 👋
              </h2>
              <p className="text-slate-300 font-medium">Berikut adalah ringkasan performa kelas dan siswa Anda hari ini.</p>
            </div>
            <button onClick={() => setIsAddModalOpen(true)} className={`relative z-10 flex items-center gap-2 px-6 py-3.5 bg-[#00BCD4] hover:bg-[#00acc1] text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-cyan-500/30 active:scale-95 transition-all whitespace-nowrap ${googleSansAlt.className}`}>
              <span className="material-symbols-outlined text-[20px]"></span> Buat Kelas Baru
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
                <span className="material-symbols-outlined text-[#00BCD4]"></span> Kelola Kelas Anda
              </h2>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="flex-1 sm:flex-none flex items-center bg-white dark:bg-[#111111] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-[#00BCD4]/50 transition-all">
                  <span className="material-symbols-outlined text-slate-400 text-[18px]"></span>
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
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {courses.length === 0 ? (
                    <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                      <span className="material-symbols-outlined text-4xl text-slate-300 mb-2"></span>
                      <p className="text-slate-500 font-medium">Tidak ada kelas yang ditemukan untuk akun ini.</p>
                    </div>
                  ) : (
                    courses.map((course) => {
                      const isImageThumbnail = course.thumbnail?.startsWith('http') || course.thumbnail?.startsWith('data:');
                      const isCssThumbnail = course.thumbnail?.startsWith('bg-');

                      return (
                        <div key={course.id} className="bg-white dark:bg-[#111111] rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl hover:border-cyan-200 dark:hover:border-slate-700 transition-all duration-300 group flex flex-col">
                          <div className="h-32 bg-slate-100 dark:bg-slate-900 relative border-b border-slate-200 dark:border-slate-800 overflow-hidden">
                            {isImageThumbnail ? (
                              <Image src={course.thumbnail!} alt={course.title} fill unoptimized className="object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                            ) : (
                              <div className={`absolute inset-0 opacity-50 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500 ${isCssThumbnail ? course.thumbnail : 'bg-linear-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900'}`} />
                            )}

                            <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border backdrop-blur-md flex items-center gap-1.5 ${
                                course.status === 'Published'
                                  ? 'bg-emerald-50/90 text-emerald-600 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800/50'
                                  : 'bg-amber-50/90 text-amber-600 border-amber-200 dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-800/50'
                              }`}>
                                <span className={`size-1.5 rounded-full ${course.status === 'Published' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
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
                            <h3 className={`text-lg font-bold text-slate-900 dark:text-white leading-snug mb-4 group-hover:text-[#00BCD4] transition-colors line-clamp-2 ${googleSansAlt.className}`}>
                              {course.title}
                            </h3>

                            <div className="mt-auto space-y-4">
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
                                  <span className="material-symbols-outlined text-[18px]"></span> {course.students} Siswa
                                </div>
                                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium text-xs">
                                  <span className="material-symbols-outlined text-[16px]"></span> {course.lastUpdated}
                                </div>
                              </div>

                              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                                <Link href={`/course-editor?course=${course.id}`} className={`flex-1 flex justify-center items-center gap-2 px-4 py-2.5 bg-[#00BCD4]/10 hover:bg-[#00BCD4] text-[#00BCD4] hover:text-white rounded-xl text-sm font-bold transition-all border border-[#00BCD4]/20 hover:border-[#00BCD4] active:scale-95 ${googleSansAlt.className}`}>
                                  <span className="material-symbols-outlined text-[18px]"></span> Edit Kelas
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-3">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => fetchCourses(currentPage - 1, searchQuery)}
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#161616] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined text-sm block"></span>
                    </button>
                    <span className="text-sm font-bold text-slate-600 dark:text-slate-400 px-4">
                      Hal {currentPage} dari {totalPages}
                    </span>
                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => fetchCourses(currentPage + 1, searchQuery)}
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#161616] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined text-sm block"></span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </main>

        <CreateCourseModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={(newCourseId) => router.push(`/course-editor?course=${newCourseId}`)}
          ownerId={activeOwnerId}
          authorName={getDisplayName()}
        />
      </div>
    </div>
  );
}