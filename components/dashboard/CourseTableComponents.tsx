import React from "react";
import Image from "next/image"; // ✨ FIX: Import komponen Image bawaan Next.js
import { DM_Sans } from "next/font/google";

const googleSansAlt = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "700", "800"] });

// ==========================================
// TIPE DATA (Mencegah Error 'any' ESLint)
// ==========================================
export interface CategoryItem {
  category_id: number;
  category_name: string;
}

export interface LevelItem {
  level_id: number;
  level_name: string;
}

export interface ApiAllCourseItem {
  course_id: number;
  title: string;
  deskripsi: string;
  tech_stack: string[];
  level_id: number;
  level_name: string;
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

// ==========================================
// 1. KOMPONEN FILTER BAR
// ==========================================
interface FilterBarProps {
  search: string;
  setSearch: (val: string) => void;
  categoryFilter: string;
  setCategoryFilter: (val: string) => void;
  levelFilter: string;
  setLevelFilter: (val: string) => void;
  categories: CategoryItem[];
  levels: LevelItem[];
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
}

export function CourseFilterBar({ search, setSearch, categoryFilter, setCategoryFilter, levelFilter, setLevelFilter, categories, levels, setCurrentPage }: FilterBarProps) {
  return (
    <div className="bg-white dark:bg-[#111111] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3">
      <div className="flex-1 flex items-center h-11.5 bg-slate-50 dark:bg-[#161616] border border-slate-200 dark:border-slate-700 rounded-xl px-4 focus-within:ring-2 focus-within:ring-[#00BCD4]/50 transition-all">
        <span className="material-symbols-outlined text-slate-400 text-[20px]">search</span>
        <input
          type="text"
          placeholder="Cari nama kelas..."
          className="bg-transparent border-none focus:ring-0 text-sm font-medium w-full ml-3 outline-none dark:text-white placeholder:text-slate-400"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative h-11.5 w-full sm:w-50 bg-slate-50 dark:bg-[#161616] border border-slate-200 dark:border-slate-700 rounded-xl focus-within:ring-2 focus-within:ring-[#00BCD4]/50 transition-all overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none">
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate pr-4">
              {categoryFilter ? categories.find((c) => String(c.category_id) === String(categoryFilter))?.category_name : "Semua Kategori"}
            </span>
            <span className="material-symbols-outlined text-slate-400 text-[20px]">expand_more</span>
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          >
            <option value="">Semua Kategori</option>
            {categories.map((cat) => (
              <option key={cat.category_id} value={cat.category_id}>{cat.category_name}</option>
            ))}
          </select>
        </div>

        <div className="relative h-11.5 w-full sm:w-35 bg-slate-50 dark:bg-[#161616] border border-slate-200 dark:border-slate-700 rounded-xl focus-within:ring-2 focus-within:ring-[#00BCD4]/50 transition-all overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none">
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate pr-4">
              {levelFilter ? levels.find((l) => String(l.level_id) === String(levelFilter))?.level_name : "Semua Level"}
            </span>
            <span className="material-symbols-outlined text-slate-400 text-[20px]">expand_more</span>
          </div>
          <select
            value={levelFilter}
            onChange={(e) => { setLevelFilter(e.target.value); setCurrentPage(1); }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          >
            <option value="">Semua Level</option>
            {levels.map((lvl) => (
              <option key={lvl.level_id} value={lvl.level_id}>{lvl.level_name}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 2. KOMPONEN TABEL DATA
// ==========================================
interface DataTableProps {
  courses: ApiAllCourseItem[];
  isLoading: boolean;
  errorMsg: string;
  currentPage: number;
  limitPerPage: number;
  openActionMenuId: number | null;
  setOpenActionMenuId: (id: number | null) => void;
  onRetry: () => void;
}

export function CourseDataTable({ courses, isLoading, errorMsg, currentPage, limitPerPage, openActionMenuId, setOpenActionMenuId, onRetry }: DataTableProps) {
  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(angka);
  };

  return (
    <div className="bg-white dark:bg-[#111111] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
      <div className="w-full overflow-x-auto bg-white dark:bg-[#111111] rounded-2xl shadow-sm">
        <table className="w-full text-left border-collapse table-fixed min-w-250">
          <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs uppercase text-slate-500 font-bold tracking-wider">
            <tr>
              <th className="w-14 px-4 py-4 text-center">No</th>
              <th className="w-87.5 px-4 py-4">Info Kelas</th>
              <th className="w-45 px-4 py-4">Kategori</th>
              <th className="w-30 px-4 py-4">Level</th>
              <th className="w-35 px-4 py-4">Harga</th>
              <th className="w-35 px-4 py-4">Statistik</th>
              <th className="w-20 px-4 py-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center">
                  <div className="size-10 border-4 border-slate-200 border-t-[#00BCD4] rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-slate-500 font-medium animate-pulse">Memuat data kelas...</p>
                </td>
              </tr>
            ) : errorMsg ? (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center bg-red-50/50 dark:bg-red-900/5">
                  <span className="material-symbols-outlined text-4xl text-red-400 mb-2 block">wifi_off</span>
                  <p className="text-red-500 font-medium mb-4">{errorMsg}</p>
                  <button onClick={onRetry} className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg text-sm font-bold transition-colors">
                    Coba Lagi
                  </button>
                </td>
              </tr>
            ) : courses.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center">
                  <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-700 mb-2 block">inbox</span>
                  <p className="text-slate-500 font-medium">Belum ada kelas yang ditemukan.</p>
                </td>
              </tr>
            ) : (
              courses.map((course, index) => (
                <tr key={course.course_id} className="hover:bg-slate-50/50 dark:hover:bg-[#161616] transition-colors group">
                  <td className="px-4 py-4 align-top text-center text-sm font-bold text-slate-500 dark:text-slate-400">
                    {(currentPage - 1) * limitPerPage + index + 1}
                  </td>
                  <td className="px-4 py-4 align-top overflow-hidden">
                    <div className="flex items-start gap-3">
                      <div className="size-14 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0 overflow-hidden relative border border-slate-100 dark:border-slate-700">
                        {course.thumbnail ? (
                          // ✨ FIX: Menggunakan next/image
                          <Image 
                            src={course.thumbnail} 
                            alt={course.title} 
                            fill
                            sizes="56px"
                            className="object-cover" 
                            unoptimized // Menghindari crash saat nge-fetch dari API eksternal
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-[#00BCD4]/10 to-[#00BCD4]/30 dark:from-cyan-900/40 dark:to-cyan-800/40">
                            <span className={`text-lg font-black text-[#00BCD4] dark:text-cyan-400 uppercase tracking-widest ${googleSansAlt.className}`}>
                              {course.title ? (course.title.split(" ").length > 1 ? course.title.split(" ")[0][0] + course.title.split(" ")[1][0] : course.title.substring(0, 2)).toUpperCase() : "C"}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold text-slate-900 dark:text-white mb-1 truncate ${googleSansAlt.className}`} title={course.title}>{course.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mb-2" title={course.deskripsi}>{course.deskripsi || "Tidak ada deskripsi."}</p>
                        <div className="flex flex-wrap gap-1.5 overflow-hidden h-5">
                          {course.tech_stack?.slice(0, 2).map((tech, i) => (
                            <span key={i} className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[9px] font-bold rounded border border-slate-200 dark:border-slate-700 truncate max-w-15">{tech}</span>
                          ))}
                          {course.tech_stack?.length > 2 && (
                            <span className="px-1.5 py-0.5 bg-[#00BCD4]/10 text-[#00BCD4] text-[9px] font-bold rounded border border-[#00BCD4]/20 shrink-0">+{course.tech_stack.length - 2}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top overflow-hidden">
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate" title={course.category_name}>{course.category_name}</p>
                  </td>
                  <td className="px-4 py-4 align-top overflow-hidden">
                    <span className={`inline-block max-w-full truncate px-2 py-1 rounded text-[9px] font-extrabold uppercase tracking-wider border ${course.level_name?.toLowerCase() === "beginner" ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800" : course.level_name?.toLowerCase() === "intermediate" ? "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800" : course.level_name?.toLowerCase() === "advanced" ? "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800" : "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"}`} title={course.level_name || "Uncategorized"}>
                      {course.level_name || "Uncategorized"}
                    </span>
                  </td>
                  <td className="px-4 py-4 align-top overflow-hidden">
                    <div className="flex flex-col gap-1 min-w-0">
                      <span className={`text-sm font-black truncate ${course.total_price === 0 ? "text-emerald-500" : "text-slate-900 dark:text-white"}`}>
                        {course.total_price === 0 ? "Gratis" : formatRupiah(course.total_price)}
                      </span>
                      {course.discount_percent > 0 && (
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-[10px] text-slate-400 line-through font-medium truncate">{formatRupiah(course.price)}</span>
                          <span className="text-[9px] shrink-0 font-extrabold text-red-500 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 px-1 py-0.5 rounded">-{course.discount_percent}%</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top overflow-hidden">
                    <div className="flex flex-col gap-1.5 min-w-0">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300 truncate">
                        <span className="material-symbols-outlined shrink-0 text-[14px] text-[#00BCD4]">group</span>
                        <span className="truncate">{course.students} Siswa</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300 truncate">
                        <span className="material-symbols-outlined shrink-0 text-[14px] text-amber-500">star</span>
                        <span className="truncate">{course.rating} Rating</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top text-center relative">
                    <button onClick={() => setOpenActionMenuId(openActionMenuId === course.course_id ? null : course.course_id)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-[#161616] dark:hover:text-slate-200 transition-colors">
                      <span className="material-symbols-outlined text-[20px] block">more_vert</span>
                    </button>
                    {openActionMenuId === course.course_id && (
                      <>
                        <div className="fixed inset-0 z-40 cursor-default" onClick={() => setOpenActionMenuId(null)} />
                        <div className="absolute right-12 top-4 z-50 w-36 bg-white dark:bg-[#161616] border border-slate-200 dark:border-slate-700/80 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                          <button onClick={() => { alert(`Publikasi kelas "${course.title}"`); setOpenActionMenuId(null); }} className="w-full flex items-center gap-2.5 px-4 py-3 text-xs font-bold text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/30 text-left">
                            <span className="material-symbols-outlined text-[16px]">cloud_upload</span> Publikasi
                          </button>
                          <button onClick={() => { alert(`Kelas "${course.title}" ditahan.`); setOpenActionMenuId(null); }} className="w-full flex items-center gap-2.5 px-4 py-3 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/30 text-left border-t border-slate-100 dark:border-slate-800">
                            <span className="material-symbols-outlined text-[16px]">block</span> Tahan
                          </button>
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==========================================
// 3. KOMPONEN PAGINASI
// ==========================================
interface PaginationProps {
  isLoading: boolean;
  coursesLength: number;
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  limitPerPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
}

export function CoursePagination({ isLoading, coursesLength, currentPage, totalPages, totalRecords, limitPerPage, setCurrentPage }: PaginationProps) {
  if (isLoading || coursesLength === 0) return null;

  return (
    <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0a0a0a] rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="text-xs font-medium text-slate-500">
        Menampilkan <span className="font-bold text-slate-900 dark:text-white">{(currentPage - 1) * limitPerPage + 1}</span> hingga <span className="font-bold text-slate-900 dark:text-white">{Math.min(currentPage * limitPerPage, totalRecords)}</span> dari <span className="font-bold text-slate-900 dark:text-white">{totalRecords}</span> kelas
      </div>
      <div className="flex items-center gap-1.5">
        <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors">
          <span className="material-symbols-outlined text-[18px] block">keyboard_double_arrow_left</span>
        </button>
        <button onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))} disabled={currentPage === 1} className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors">
          <span className="material-symbols-outlined text-[18px] block">chevron_left</span>
        </button>
        <div className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#111111] border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300">
          Hal {currentPage} / {totalPages}
        </div>
        <button onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))} disabled={currentPage >= totalPages} className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors">
          <span className="material-symbols-outlined text-[18px] block">chevron_right</span>
        </button>
        <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage >= totalPages} className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors">
          <span className="material-symbols-outlined text-[18px] block">keyboard_double_arrow_right</span>
        </button>
      </div>
    </div>
  );
}