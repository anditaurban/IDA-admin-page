import React from "react";
import Image from "next/image";
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
  deskripsi: string | null;
  tech_stack: string[] | null;
  level_id: number;
  level_name: string;
  price: number;
  discount_nominal: number;
  discount_percent: number;
  total_price: number;
  thumbnail: string;
  rating: string;
  students: number;
  status: string; // ✨ TAMBAHAN: Menyimpan status ("published", "draft", dll)
  category_name: string;
  author_name: string | null;
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
  // currentPage dan limitPerPage dihapus dari sini
  openActionMenuId: number | null;
  setOpenActionMenuId: (id: number | null) => void;
  onRetry: () => void;
  onUpdateStatus: (courseId: number, currentStatus: string) => void;
}

export function CourseDataTable({ 
  courses, 
  isLoading, 
  errorMsg, 
  // currentPage dan limitPerPage dihapus dari parameter ini
  openActionMenuId, 
  setOpenActionMenuId, 
  onRetry, 
  onUpdateStatus 
}: DataTableProps) {
  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(angka);
  };

  return (
    // ... sisa kode tabel persis seperti sebelumnya ...
    <div className="bg-white dark:bg-[#111111] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
      {/* Hapus paksaan min-w agar tabel menyesuaikan lebar layar 100% tanpa scroll */}
      <div className="w-full overflow-hidden bg-white dark:bg-[#111111] rounded-2xl shadow-sm">
        <table className="w-full text-left border-collapse table-fixed">
          <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs uppercase text-slate-500 font-bold tracking-wider">
            <tr>
              {/* Ukuran diubah menggunakan persentase agar total 100% */}
              <th className="w-[35%] px-3 py-4">Info Kelas</th>
              <th className="w-[15%] px-3 py-4">Kategori</th>
              <th className="w-[12%] px-3 py-4">Level</th>
              <th className="w-[15%] px-3 py-4">Harga</th>
              <th className="w-[15%] px-3 py-4">Statistik</th>
              <th className="w-[8%] px-3 py-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading ? (
              <tr>
                {/* colSpan diubah menjadi 6 */}
                <td colSpan={6} className="px-4 py-16 text-center">
                  <div className="size-10 border-4 border-slate-200 border-t-[#00BCD4] rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-slate-500 font-medium animate-pulse">Memuat data kelas...</p>
                </td>
              </tr>
            ) : errorMsg ? (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center bg-red-50/50 dark:bg-red-900/5">
                  <span className="material-symbols-outlined text-4xl text-red-400 mb-2 block">wifi_off</span>
                  <p className="text-red-500 font-medium mb-4">{errorMsg}</p>
                  <button onClick={onRetry} className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg text-sm font-bold transition-colors">
                    Coba Lagi
                  </button>
                </td>
              </tr>
            ) : courses.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center">
                  <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-700 mb-2 block">inbox</span>
                  <p className="text-slate-500 font-medium">Belum ada kelas yang ditemukan.</p>
                </td>
              </tr>
            ) : (
              courses.map((course) => (
                <tr key={course.course_id} className="hover:bg-slate-50/50 dark:hover:bg-[#161616] transition-colors group">
                  <td className="px-3 py-3 align-top overflow-hidden">
                    <div className="flex items-start gap-2.5">
                      {/* Ukuran thumbnail diringkas sedikit (size-12) agar menghemat ruang */}
                      <div className="size-12 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0 overflow-hidden relative border border-slate-100 dark:border-slate-700">
                        {course.thumbnail ? (
                          <Image 
                            src={course.thumbnail} 
                            alt={course.title} 
                            fill
                            sizes="48px"
                            className="object-cover" 
                            unoptimized 
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-[#00BCD4]/10 to-[#00BCD4]/30 dark:from-cyan-900/40 dark:to-cyan-800/40">
                            <span className={`text-base font-black text-[#00BCD4] dark:text-cyan-400 uppercase tracking-widest ${googleSansAlt.className}`}>
                              {course.title ? (course.title.split(" ").length > 1 ? course.title.split(" ")[0][0] + course.title.split(" ")[1][0] : course.title.substring(0, 2)).toUpperCase() : "C"}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col xl:flex-row xl:items-center gap-1 xl:gap-2 mb-1">
                          <p className={`text-sm font-bold text-slate-900 dark:text-white truncate ${googleSansAlt.className}`} title={course.title}>{course.title}</p>
                          <span className={`text-[9px] w-fit font-bold px-1.5 py-0.5 rounded shrink-0 ${course.status === 'published' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'}`}>
                            {course.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 overflow-hidden h-4 mt-1">
                          {course.tech_stack?.slice(0, 2).map((tech, i) => (
                            <span key={i} className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[8px] font-bold rounded border border-slate-200 dark:border-slate-700 truncate max-w-15">{tech}</span>
                          ))}
                          {course.tech_stack && course.tech_stack.length > 2 && (
                            <span className="px-1 py-0.5 bg-[#00BCD4]/10 text-[#00BCD4] text-[8px] font-bold rounded border border-[#00BCD4]/20 shrink-0">+{course.tech_stack.length - 2}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4 align-top overflow-hidden">
                    <p className="text-[13px] font-bold text-slate-700 dark:text-slate-300 truncate" title={course.category_name}>{course.category_name}</p>
                  </td>
                  <td className="px-3 py-4 align-top overflow-hidden">
                    <span className={`inline-block max-w-full truncate px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider border ${course.level_name?.toLowerCase() === "beginner" ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800" : course.level_name?.toLowerCase() === "intermediate" ? "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800" : course.level_name?.toLowerCase() === "advanced" ? "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800" : "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"}`} title={course.level_name || "Uncategorized"}>
                      {course.level_name || "Uncategorized"}
                    </span>
                  </td>
                  <td className="px-3 py-4 align-top overflow-hidden">
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className={`text-[13px] font-black truncate ${course.total_price === 0 ? "text-emerald-500" : "text-slate-900 dark:text-white"}`}>
                        {course.total_price === 0 ? "Gratis" : formatRupiah(course.total_price)}
                      </span>
                      {course.discount_percent > 0 && (
                        <div className="flex items-center gap-1 min-w-0">
                          <span className="text-[9px] text-slate-400 line-through font-medium truncate">{formatRupiah(course.price)}</span>
                          <span className="text-[8px] shrink-0 font-extrabold text-red-500 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 px-1 py-0.5 rounded">-{course.discount_percent}%</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-4 align-top overflow-hidden">
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 dark:text-slate-300 truncate">
                        <span className="material-symbols-outlined shrink-0 text-[12px] text-[#00BCD4]">group</span>
                        <span className="truncate">{course.students} Siswa</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 dark:text-slate-300 truncate">
                        <span className="material-symbols-outlined shrink-0 text-[12px] text-amber-500">star</span>
                        <span className="truncate">{course.rating} Rating</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4 align-top text-center relative">
                    <button onClick={() => setOpenActionMenuId(openActionMenuId === course.course_id ? null : course.course_id)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-[#161616] dark:hover:text-slate-200 transition-colors">
                      <span className="material-symbols-outlined text-[18px] block">more_vert</span>
                    </button>
                    {openActionMenuId === course.course_id && (
                      <>
                        <div className="fixed inset-0 z-40 cursor-default" onClick={() => setOpenActionMenuId(null)} />
                        <div className="absolute right-8 top-4 z-50 w-32 bg-white dark:bg-[#161616] border border-slate-200 dark:border-slate-700/80 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                          {course.status !== 'published' ? (
                            <button onClick={() => { onUpdateStatus(course.course_id, "published"); setOpenActionMenuId(null); }} className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-bold text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/30 text-left">
                              <span className="material-symbols-outlined text-[14px]">cloud_upload</span> Publikasi
                            </button>
                          ) : (
                            <button onClick={() => { onUpdateStatus(course.course_id, "draft"); setOpenActionMenuId(null); }} className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/30 text-left border-t border-slate-100 dark:border-slate-800">
                              <span className="material-symbols-outlined text-[14px]">block</span> Tahan
                            </button>
                          )}
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