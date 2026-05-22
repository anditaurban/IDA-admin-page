'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DM_Sans } from 'next/font/google';
import Cookies from 'js-cookie';
import { useInstructorDashboard } from '@/hooks/useInstructorDashboard';

const googleSansAlt = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '700', '800'] });

interface ApiAllCourseItem {
  course_id: number;
  title: string;
  deskripsi: string;
  tech_stack: string[];
  level: string;
  price: number;
  discount_nominal: number;
  discount_percent: number;
  total_price: number;
  thumbnail: string;
  rating: string;
  students: number;
  category_name: string;
  author_name: string;
}

// ✨ Interface untuk Kategori
interface CategoryItem {
  category_id: number;
  category_name: string;
}

export default function AllCoursesPage() {
  const { activeOwnerId, isAuthChecking, performLogout } = useInstructorDashboard();

  // State Management: Data Tabel
  const [courses, setCourses] = useState<ApiAllCourseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // ✨ State Management: Data Kategori (Dropdown)
  const [categories, setCategories] = useState<CategoryItem[]>([]);

  // State Management: Filter & Pencarian
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');

  // Paginasi
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const LIMIT_PER_PAGE = 12;

  const RAW_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  const BASE_URL = RAW_BASE_URL.endsWith('/') ? RAW_BASE_URL.slice(0, -1) : RAW_BASE_URL;

  // ✨ Fungsi untuk mengambil List Kategori API
  useEffect(() => {
    if (isAuthChecking || !activeOwnerId) return;
    
    const fetchCategories = async () => {
      try {
        const token = Cookies.get('api_token') || process.env.NEXT_PUBLIC_API_TOKEN;
        const response = await fetch(`${BASE_URL}/list/course_category/${activeOwnerId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          const listData = data.listData || [];
          
          // Memfilter duplikasi nama kategori (jika ada data ganda dari backend)
          const uniqueCategories = Array.from(new Map(listData.map((item: CategoryItem) => [item.category_name, item])).values()) as CategoryItem[];
          
          setCategories(uniqueCategories);
        }
      } catch (error) {
        console.error("Gagal mengambil data kategori:", error);
      }
    };

    fetchCategories();
  }, [activeOwnerId, isAuthChecking, BASE_URL]);

  // ✨ Fungsi Utama untuk mengambil Data Tabel (Ditambah dukungan parameter Filter API)
  const fetchAllCourses = useCallback(async (page: number) => {
    if (isAuthChecking || !activeOwnerId) return;
    setIsLoading(true);
    setErrorMsg('');

    try {
      const token = Cookies.get('api_token') || process.env.NEXT_PUBLIC_API_TOKEN;
      
      // Merakit Query Parameter untuk Filter API
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (categoryFilter) queryParams.append('category_id', categoryFilter);
      if (levelFilter) queryParams.append('level', levelFilter);
      
      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
      const endpoint = `${BASE_URL}/table/all_course/${activeOwnerId}/${page}${queryString}`;

      const response = await fetch(endpoint, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401 || response.status === 403) {
        performLogout();
        return;
      }

      if (!response.ok) throw new Error('Gagal mengambil data kelas');

      const data = await response.json();
      
      const formattedCourses = (data.tableData || []).map((course: ApiAllCourseItem) => {
        let displayThumb = course.thumbnail || '';
        if (displayThumb && !displayThumb.startsWith('data:') && !displayThumb.startsWith('bg-')) {
          const filename = displayThumb.split('/').pop();
          displayThumb = `${BASE_URL}/thumbnail/course/${filename}`;
        }
        return { ...course, thumbnail: displayThumb };
      });
      
      setCourses(formattedCourses);
      setTotalRecords(data.totalRecords || 0);
      setTotalPages(data.totalPages || 1);
      setCurrentPage(data.currentPage || page);

    } catch (error) {
      console.error(error);
      setErrorMsg('Gagal terhubung ke server. Silakan coba lagi.');
      setCourses([]);
    } finally {
      setIsLoading(false);
    }
  }, [BASE_URL, activeOwnerId, isAuthChecking, performLogout, search, categoryFilter, levelFilter]);

  // ✨ Auto-Fetch dengan jeda (Debounce) saat filter/search/page berubah
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAllCourses(currentPage);
    }, 500); // Tunggu 500ms berhenti ngetik/memilih baru tembak API
    
    return () => clearTimeout(timer);
  }, [currentPage, search, categoryFilter, levelFilter, fetchAllCourses]);

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  };

  return (
    <main className="p-4 md:p-8 flex flex-col gap-6 lg:gap-8 max-w-7xl mx-auto w-full">
      {/* HEADER PAGE */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className={`text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white ${googleSansAlt.className}`}>
            Koleksi Semua Kelas
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Manajemen penuh seluruh kelas yang ada di bawah lembaga Anda.
          </p>
        </div>
      </div>

      {/* ✨ TOOLBAR: SEARCH & FILTER (Tinggi Presisi: 46px) */}
      <div className="bg-white dark:bg-[#111111] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3">
        
        {/* Search Bar */}
        <div className="flex-1 flex items-center h-11.5 bg-slate-50 dark:bg-[#161616] border border-slate-200 dark:border-slate-700 rounded-xl px-4 focus-within:ring-2 focus-within:ring-[#00BCD4]/50 transition-all">
          <span className="material-symbols-outlined text-slate-400 text-[20px]">search</span>
          <input
            type="text"
            placeholder="Cari nama kelas..."
            className="bg-transparent border-none focus:ring-0 text-sm font-medium w-full ml-3 outline-none dark:text-white placeholder:text-slate-400"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1); // Reset page ke 1 setiap mencari
            }}
          />
        </div>

        {/* Filters Wrapper */}
        <div className="flex flex-col sm:flex-row gap-3">
          
          {/* Dropdown: Kategori (Opacity Hack) */}
          <div className="relative h-11.5 w-full sm:w-55 bg-slate-50 dark:bg-[#161616] border border-slate-200 dark:border-slate-700 rounded-xl focus-within:ring-2 focus-within:ring-[#00BCD4]/50 transition-all">
            {/* Visual Layer: Tampilan yang dilihat oleh mata pengguna */}
            <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate pr-4">
                {categoryFilter 
                  ? categories.find(c => String(c.category_id) === String(categoryFilter))?.category_name 
                  : 'Semua Kategori'}
              </span>
              <span className="material-symbols-outlined text-slate-400 text-[20px]">expand_more</span>
            </div>

            {/* Functional Layer: Select bawaan yang dibikin tembus pandang (opacity-0) */}
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            >
              <option value="">Semua Kategori</option>
              {categories.map((cat) => (
                <option key={cat.category_id} value={cat.category_id}>
                  {cat.category_name}
                </option>
              ))}
            </select>
          </div>

          {/* Dropdown: Level (Opacity Hack) */}
          <div className="relative h-11.5 w-full sm:w-40 bg-slate-50 dark:bg-[#161616] border border-slate-200 dark:border-slate-700 rounded-xl focus-within:ring-2 focus-within:ring-[#00BCD4]/50 transition-all">
            {/* Visual Layer */}
            <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate pr-4">
                {levelFilter || 'Semua Level'}
              </span>
              <span className="material-symbols-outlined text-slate-400 text-[20px]">expand_more</span>
            </div>

            {/* Functional Layer */}
            <select
              value={levelFilter}
              onChange={(e) => {
                setLevelFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            >
              <option value="">Semua Level</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
          
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="bg-white dark:bg-[#111111] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-max text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#0a0a0a] border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-12 text-center">No</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider min-w-80 max-w-112.5">Info Kelas</th>
                {/* ✨ Kolom dipisah: Kategori dan Level */}
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider min-w-40">Kategori</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider min-w-32">Level</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider min-w-40">Harga</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider min-w-35">Statistik</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center min-w-50">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="size-10 border-4 border-slate-200 border-t-[#00BCD4] rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-500 font-medium animate-pulse">Memuat data kelas...</p>
                  </td>
                </tr>
              ) : errorMsg ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center bg-red-50/50 dark:bg-red-900/5">
                    <span className="material-symbols-outlined text-4xl text-red-400 mb-2 block">wifi_off</span>
                    <p className="text-red-500 font-medium mb-4">{errorMsg}</p>
                    <button onClick={() => fetchAllCourses(currentPage)} className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg text-sm font-bold transition-colors">
                      Coba Lagi
                    </button>
                  </td>
                </tr>
              ) : courses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-700 mb-2 block">inbox</span>
                    <p className="text-slate-500 font-medium">Belum ada kelas yang didaftarkan.</p>
                  </td>
                </tr>
              ) : (
                courses.map((course, index) => (
                  <tr key={course.course_id} className="hover:bg-slate-50/50 dark:hover:bg-[#161616] transition-colors group">
                    <td className="px-6 py-4 align-top text-center text-sm font-bold text-slate-500 dark:text-slate-400">
                      {(currentPage - 1) * LIMIT_PER_PAGE + index + 1}
                    </td>
                    <td className="px-6 py-4 align-top">
                      <div className="flex items-start gap-4">
                        <div className="size-16 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0 overflow-hidden relative border border-slate-100 dark:border-slate-700">
                          {course.thumbnail ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                          ) : (
                            /* ✨ UX Baru: Placeholder Inisial Judul Kelas */
                            <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-[#00BCD4]/10 to-[#00BCD4]/30 dark:from-cyan-900/40 dark:to-cyan-800/40">
                              <span className={`text-xl font-black text-[#00BCD4] dark:text-cyan-400 uppercase tracking-widest ${googleSansAlt.className}`}>
                                {course.title 
                                  ? (course.title.split(' ').length > 1 
                                      ? course.title.split(' ')[0][0] + course.title.split(' ')[1][0] 
                                      : course.title.substring(0, 2)).toUpperCase() 
                                  : 'C'}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm font-bold text-slate-900 dark:text-white mb-1.5 leading-snug ${googleSansAlt.className}`}>
                            {course.title}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-2.5 leading-relaxed">
                            {course.deskripsi || "Tidak ada deskripsi tersedia."}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {course.tech_stack?.slice(0, 3).map((tech, i) => (
                              <span key={i} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold rounded-md border border-slate-200 dark:border-slate-700">
                                {tech}
                              </span>
                            ))}
                            {course.tech_stack?.length > 3 && (
                              <span className="px-2 py-0.5 bg-[#00BCD4]/10 text-[#00BCD4] text-[10px] font-bold rounded-md border border-[#00BCD4]/20">
                                +{course.tech_stack.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* ✨ KOLOM BARU: HANYA KATEGORI */}
                    <td className="px-6 py-4 align-top">
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        {course.category_name}
                      </p>
                    </td>

                    {/* ✨ KOLOM BARU: HANYA LEVEL */}
                    <td className="px-6 py-4 align-top">
                      <span className={`w-max px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider border ${
                        course.level.toLowerCase() === 'beginner' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-500/30' :
                        course.level.toLowerCase() === 'intermediate' ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-500/30' :
                        'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-500/30'
                      }`}>
                        {course.level}
                      </span>
                    </td>

                    <td className="px-6 py-4 align-top">
                      <div className="flex flex-col gap-1">
                        <span className={`text-[15px] font-black ${course.total_price === 0 ? 'text-emerald-500' : 'text-slate-900 dark:text-white'}`}>
                          {course.total_price === 0 ? 'Gratis' : formatRupiah(course.total_price)}
                        </span>
                        {course.discount_percent > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400 line-through font-medium">
                              {formatRupiah(course.price)}
                            </span>
                            <span className="text-[10px] font-extrabold text-red-500 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 px-1.5 py-0.5 rounded-md">
                              -{course.discount_percent}%
                            </span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 align-top">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                          <span className="material-symbols-outlined text-[16px] text-[#00BCD4]">group</span>
                          {course.students} Siswa
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                          <span className="material-symbols-outlined text-[16px] text-amber-500">star</span>
                          {course.rating} Rating
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 align-top text-center">
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                        <button 
                          onClick={() => alert(`Fungsi Publikasi untuk kelas "${course.title}" (Khusus Headteam)`)}
                          title="Setujui & Publikasi ke LMS Utama" 
                          className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-500 text-emerald-600 hover:text-white dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-500 dark:hover:text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 border border-emerald-200 dark:border-emerald-800/50 hover:border-transparent"
                        >
                          <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
                          <span>Publikasi</span>
                        </button>
                        <button 
                          onClick={() => alert(`Kelas "${course.title}" ditahan.`)}
                          title="Tahan Kelas" 
                          className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-rose-500 text-slate-600 hover:text-white dark:bg-[#161616] dark:text-slate-400 dark:hover:bg-rose-600 dark:hover:text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 border border-slate-200 dark:border-slate-800 hover:border-transparent"
                        >
                          <span className="material-symbols-outlined text-[18px]">block</span>
                          <span className="sm:hidden lg:inline">Tahan</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINASI */}
        {!isLoading && courses.length > 0 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0a0a0a] flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-xs font-medium text-slate-500">
              Menampilkan <span className="font-bold text-slate-900 dark:text-white">{(currentPage - 1) * LIMIT_PER_PAGE + 1}</span> hingga <span className="font-bold text-slate-900 dark:text-white">{Math.min(currentPage * LIMIT_PER_PAGE, totalRecords)}</span> dari <span className="font-bold text-slate-900 dark:text-white">{totalRecords}</span> kelas
            </div>
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setCurrentPage(1)} 
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Halaman Pertama"
              >
                <span className="material-symbols-outlined text-[18px] block">keyboard_double_arrow_left</span>
              </button>
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} 
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Halaman Sebelumnya"
              >
                <span className="material-symbols-outlined text-[18px] block">chevron_left</span>
              </button>
              <div className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#111111] border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300">
                Hal {currentPage} / {totalPages}
              </div>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} 
                disabled={currentPage >= totalPages}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Halaman Berikutnya"
              >
                <span className="material-symbols-outlined text-[18px] block">chevron_right</span>
              </button>
              <button 
                onClick={() => setCurrentPage(totalPages)} 
                disabled={currentPage >= totalPages}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Halaman Terakhir"
              >
                <span className="material-symbols-outlined text-[18px] block">keyboard_double_arrow_right</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}