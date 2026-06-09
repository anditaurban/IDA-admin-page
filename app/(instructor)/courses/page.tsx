"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DM_Sans } from "next/font/google";
import Cookies from "js-cookie";

import { useInstructorDashboard } from "@/hooks/useInstructorDashboard";

// Import komponen UI yang baru saja kita pisahkan
import {
  CourseFilterBar,
  CourseDataTable,
  CoursePagination,
  CategoryItem,
  LevelItem,
  ApiAllCourseItem
} from "@/components/dashboard/CourseTableComponents";

const googleSansAlt = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
});

const RAW_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";
const BASE_URL = RAW_BASE_URL.endsWith("/") ? RAW_BASE_URL.slice(0, -1) : RAW_BASE_URL;

export default function AllCoursesPage() {
  const { activeOwnerId, isAuthChecking, performLogout } = useInstructorDashboard();

  // --- STATE: Data Tabel & UI ---
  const [courses, setCourses] = useState<ApiAllCourseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [openActionMenuId, setOpenActionMenuId] = useState<number | null>(null);

  // --- STATE: Master Data (Dropdown) ---
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [levels, setLevels] = useState<LevelItem[]>([]);

  // --- STATE: Filters & Pagination ---
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const LIMIT_PER_PAGE = 12;

  // --- EFFECT: Debounce Search ---
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // --- EFFECT: Fetch Master Data (Kategori & Level) ---
  useEffect(() => {
    if (isAuthChecking || !activeOwnerId) return;

    const fetchMasterData = async () => {
      try {
        const token = Cookies.get("api_token") || process.env.NEXT_PUBLIC_API_TOKEN;
        const headers = { Authorization: `Bearer ${token}` };

        const [catRes, lvlRes] = await Promise.all([
          fetch(`${BASE_URL}/list/course_category/${activeOwnerId}`, { headers }),
          fetch(`${BASE_URL}/list/course_level/${activeOwnerId}`, { headers })
        ]);

        if (catRes.ok) {
          const catData = await catRes.json();
          const uniqueCategories = Array.from(
            new Map((catData.listData || []).map((item: CategoryItem) => [item.category_name, item])).values()
          ) as CategoryItem[];
          setCategories(uniqueCategories);
        }

        if (lvlRes.ok) {
          const lvlData = await lvlRes.json();
          setLevels(lvlData.data || []);
        }
      } catch (error) {
        console.error("Gagal mengambil data master:", error);
      }
    };
    fetchMasterData();
  }, [activeOwnerId, isAuthChecking]);

  // --- FUNCTION: Fetch Data Tabel ---
  const fetchAllCourses = useCallback(async () => {
    if (isAuthChecking || !activeOwnerId) return;
    setIsLoading(true);
    setErrorMsg("");

    try {
      const token = Cookies.get("api_token") || process.env.NEXT_PUBLIC_API_TOKEN;
      const queryParams = new URLSearchParams();
      
      // Mengamankan pagination
      queryParams.append("limit", String(LIMIT_PER_PAGE));
      queryParams.append("per_page", String(LIMIT_PER_PAGE));

      // 🔥 1. PARAMETER SAPU JAGAT (Agar Backend Pasti Menangkapnya)
      if (debouncedSearch) {
        queryParams.append("search", debouncedSearch);
        queryParams.append("keyword", debouncedSearch);
      }
      if (categoryFilter) {
        queryParams.append("category_id", categoryFilter);
        const catName = categories.find(c => String(c.category_id) === String(categoryFilter))?.category_name;
        if (catName) queryParams.append("category", catName);
      }
      if (levelFilter) {
        queryParams.append("level_id", levelFilter);
        queryParams.append("level", levelFilter); // API lama sering pakai nama field 'level'
      }

      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";
      const endpoint = `${BASE_URL}/table/all_course/${activeOwnerId}/${currentPage}${queryString}`;

      const response = await fetch(endpoint, {
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      });

      if (response.status === 401 || response.status === 403) {
        performLogout();
        return;
      }
      if (!response.ok) throw new Error("Gagal mengambil data kelas");

      const data = await response.json();
      
      // Ambil dan olah gambar thumbnail
      let formattedCourses = (data.tableData || []).map((course: ApiAllCourseItem) => {
        let displayThumb = course.thumbnail || "";
        if (displayThumb && !displayThumb.startsWith("data:") && !displayThumb.startsWith("bg-") && !displayThumb.startsWith("http")) {
          const filename = displayThumb.split("/").pop();
          displayThumb = `${BASE_URL}/thumbnail/course/${filename}`;
        }
        return { ...course, thumbnail: displayThumb };
      });

      // 🔥 2. FRONTEND FAILSAFE FILTER (Saringan Lapis Kedua Mutlak)
      if (debouncedSearch) {
        const s = debouncedSearch.toLowerCase();
        formattedCourses = formattedCourses.filter((c: ApiAllCourseItem) => c.title.toLowerCase().includes(s));
      }
      if (categoryFilter) {
        const catName = categories.find(c => String(c.category_id) === String(categoryFilter))?.category_name;
        if (catName) {
          formattedCourses = formattedCourses.filter((c: ApiAllCourseItem) => c.category_name === catName);
        }
      }
      if (levelFilter) {
        formattedCourses = formattedCourses.filter((c: ApiAllCourseItem) => String(c.level_id) === String(levelFilter));
      }

      setCourses(formattedCourses);
      setTotalRecords(data.totalRecords || 0);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error(error);
      setErrorMsg("Gagal terhubung ke server. Silakan coba lagi.");
      setCourses([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeOwnerId, isAuthChecking, performLogout, debouncedSearch, categoryFilter, levelFilter, currentPage, categories]);

  // --- EFFECT: Trigger Fetch Data Tabel ---
  useEffect(() => {
    fetchAllCourses();
  }, [fetchAllCourses]);


  // ✨ FUNCTION: Handler Update Status Kelas (Publikasi / Tahan)
  const handleUpdateStatus = async (courseId: number, targetStatus: string) => {
    try {
      const token = Cookies.get("api_token") || process.env.NEXT_PUBLIC_API_TOKEN;
      
      // Catatan: Gunakan metode PUT atau POST sesuai dengan desain API Backend Anda.
      // Di sini saya asumsikan menggunakan metode PUT untuk update data spesifik.
      const response = await fetch(`${BASE_URL}/update/course/status/${courseId}`, {
        method: "PUT", 
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: targetStatus })
      });

      const result = await response.json();

      // Memeriksa response format seperti yang Anda berikan sebelumnya
      if (response.ok && result.data?.success) {
        alert(result.data.message || `Status berhasil diubah menjadi ${targetStatus}`);
        
        // Refetch tabel agar UI ter-update dengan data status terbaru
        fetchAllCourses();
      } else {
        alert("Gagal memperbarui status. Periksa kembali jaringan atau konfigurasi Anda.");
      }
    } catch (error) {
      console.error("Gagal update status:", error);
      alert("Terjadi kesalahan sistem saat mencoba memperbarui status.");
    }
  };

  return (
    <main className="p-4 md:p-8 flex flex-col gap-6 lg:gap-8 max-w-7xl mx-auto w-full">
      {/* HEADER */}
      <div>
        <h1 className={`text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white ${googleSansAlt.className}`}>
          Koleksi Semua Kelas
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Manajemen penuh seluruh kelas yang ada di bawah lembaga Anda.
        </p>
      </div>

      {/* TOOLBAR FILTER */}
      <CourseFilterBar
        search={search}
        setSearch={setSearch}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        levelFilter={levelFilter}
        setLevelFilter={setLevelFilter}
        categories={categories}
        levels={levels}
        setCurrentPage={setCurrentPage}
      />

      {/* TABLE DATA */}
      <CourseDataTable
        courses={courses}
        isLoading={isLoading}
        errorMsg={errorMsg}
        // currentPage={currentPage}
        // limitPerPage={LIMIT_PER_PAGE}
        openActionMenuId={openActionMenuId}
        setOpenActionMenuId={setOpenActionMenuId}
        onRetry={fetchAllCourses}
        onUpdateStatus={handleUpdateStatus} // ✨ Mengirimkan props function ke tabel
      />

      {/* PAGINATION */}
      <CoursePagination
        isLoading={isLoading}
        coursesLength={courses.length}
        currentPage={currentPage}
        totalPages={totalPages}
        totalRecords={totalRecords}
        limitPerPage={LIMIT_PER_PAGE}
        setCurrentPage={setCurrentPage}
      />
    </main>
  );
}