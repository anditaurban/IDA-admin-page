"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { DM_Sans } from "next/font/google";
import Cookies from "js-cookie";
import { useToast } from "@/components/ui/ToastProvider";
import type { CourseItem } from "@/hooks/useInstructorDashboard";

// Perluas tipe CourseItem secara lokal
type ExtendedCourseItem = CourseItem & {
  price?: number | string;
  discount_percent?: number | string;
  total_price?: number | string;
};

const googleSansAlt = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
});

export default function CourseCard({
  course,
  onCourseDeleted,
}: {
  course: CourseItem;
  onCourseDeleted?: (id: string) => void;
}) {
  const extendedCourse = course as ExtendedCourseItem;
  const { showToast } = useToast();
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // ✨ STATE KHUSUS UNTUK GAMBAR BER-TOKEN
  const [authImgSrc, setAuthImgSrc] = useState<string | null>(null);
  const [authImgFailed, setAuthImgFailed] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // =========================================================
  // ✨ LOGIKA PENENTUAN URL GAMBAR
  // =========================================================
  const rawThumbnail = course?.thumbnail || "";
  const isCssThumbnail = rawThumbnail.startsWith("bg-");
  
  let targetUrl = rawThumbnail; 
  if (rawThumbnail && !isCssThumbnail && !rawThumbnail.startsWith("http")) {
    const rawBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "https://dev.katib.cloud";
    let baseUrl = rawBaseUrl.replace(/\/+$/, "");
    if (baseUrl.endsWith("/api")) baseUrl = baseUrl.slice(0, -4);
    
    const cleanPath = rawThumbnail.replace(/^\//, "");
    targetUrl = cleanPath.includes("/") ? `${baseUrl}/${cleanPath}` : `${baseUrl}/thumbnail/course/${cleanPath}`;
  }

  // =========================================================
  // ✨ PROSES FETCH GAMBAR DENGAN MENGIRIM TOKEN (BLOB OBJECT)
  // =========================================================
  useEffect(() => {
    if (!targetUrl || isCssThumbnail) return;

    let objectUrl: string | null = null;
    let isActive = true; // Mencegah memory leak saat komponen di-unmount

    const fetchImageWithToken = async () => {
      try {
        // Ambil token persis seperti saat fungsi Hapus Kelas
        const token = Cookies.get("api_token") || process.env.NEXT_PUBLIC_API_TOKEN || "";
        
        const response = await fetch(targetUrl, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}` // <- INI KUNCI UTAMANYA!
          }
        });

        if (!response.ok) throw new Error(`Server menolak dengan status ${response.status}`);
        
        // Ubah respons menjadi file lokal (Blob)
        const blob = await response.blob();
        
        if (isActive) {
          objectUrl = URL.createObjectURL(blob);
          setAuthImgSrc(objectUrl);
        }
      } catch (error) {
        console.error("Gagal menarik gambar dengan Token:", error);
        if (isActive) setAuthImgFailed(true);
      }
    };

    fetchImageWithToken();

    return () => {
      isActive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl); // Bersihkan memori
    };
  }, [targetUrl, isCssThumbnail]);

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      const rawBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "";
      const BASE_URL = rawBaseUrl.endsWith("/") ? rawBaseUrl.slice(0, -1) : rawBaseUrl;
      const token = Cookies.get("api_token") || process.env.NEXT_PUBLIC_API_TOKEN;

      const response = await fetch(`${BASE_URL}/delete/course/${course.id}`, {
        method: "PUT", 
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Gagal menghapus kelas");

      setIsDeleteModalOpen(false);
      showToast("success", "Kelas berhasil dihapus.");

      if (onCourseDeleted) {
        onCourseDeleted(String(course.id));
      }

    } catch (error) {
      console.error(error);
      showToast("error", "Gagal menghapus kelas. Coba lagi.");
    } finally {
      setIsDeleting(false);
    }
  };

  const actualTotalPrice = Number(extendedCourse.total_price ?? course.totalPrice ?? 0);
  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(angka);
  };
  const displayPrice = actualTotalPrice > 0 ? formatRupiah(actualTotalPrice) : "Gratis";

  const DeleteModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/80 backdrop-blur-md p-4">
      <div className="bg-white dark:bg-[#111111] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
        <div className="p-6 sm:p-8">
          <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 flex items-center justify-center mb-6 mx-auto">
            <span className="material-symbols-outlined text-[32px] text-red-500">
              delete_forever
            </span>
          </div>
          <h3 className="text-xl font-black text-slate-800 dark:text-white text-center mb-2">
            Yakin Hapus Kelas?
          </h3>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 text-center mb-6 leading-relaxed">
            Ini adalah tindakan yang <strong className="text-red-500 font-bold">sangat fatal</strong>. Anda akan kehilangan seluruh materi kelas ini selamanya.
          </p>
          <div className="mb-8 bg-slate-50 dark:bg-[#0a0a0a] p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2.5 uppercase tracking-wide">
              Ketik <span className="text-red-500 font-mono bg-red-100 dark:bg-red-500/20 px-2 py-0.5 rounded select-none">HAPUS</span> untuk konfirmasi:
            </label>
            <input
              type="text"
              autoFocus
              value={deleteConfirmationText}
              onChange={(e) => setDeleteConfirmationText(e.target.value)}
              className="w-full bg-white dark:bg-[#161616] border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-base font-bold text-slate-800 dark:text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"
              placeholder="Ketik HAPUS..."
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              disabled={isDeleting}
              onClick={() => setIsDeleteModalOpen(false)}
              className="flex-1 py-3.5 rounded-xl font-bold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={deleteConfirmationText !== "HAPUS" || isDeleting}
              onClick={handleConfirmDelete}
              className="flex-1 py-3.5 rounded-xl font-bold text-sm text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              {isDeleting ? <span className="material-symbols-outlined text-[20px] animate-spin">sync</span> : "Ya, Hapus"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="relative bg-white dark:bg-[#111111] rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl hover:border-cyan-200 dark:hover:border-slate-700 transition-all duration-300 group flex flex-col h-full">
        
        {/* ✨ AREA THUMBNAIL DINAMIS */}
        <div className="h-40 w-full relative bg-slate-800 border-b border-slate-200 dark:border-slate-800 overflow-hidden shrink-0">
          
          {isCssThumbnail ? (
            <div className={`w-full h-full ${rawThumbnail} opacity-90 group-hover:opacity-100 transition-transform duration-500 group-hover:scale-105`} />
          ) : authImgSrc ? (
            // Jika fetch sukses, tampilkan Blob Image
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={authImgSrc}
              alt={course.title || "Course Thumbnail"}
              className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-transform duration-500 ease-out group-hover:scale-105"
            />
          ) : authImgFailed ? (
            // Jika fetch gagal (404/500)
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="https://placehold.co/600x400/00BCD4/FFFFFF/png?text=No+Image&font=Montserrat"
              alt="No Image"
              className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-transform duration-500 ease-out group-hover:scale-105"
            />
          ) : targetUrl ? (
            // Sedang proses fetch
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
              <span className="material-symbols-outlined text-slate-400 animate-spin text-3xl">sync</span>
            </div>
          ) : (
            // Jika tidak ada thumbnail sama sekali
            <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-[#00BCD4]/10 to-[#00BCD4]/30 dark:from-cyan-900/40 dark:to-cyan-800/40 group-hover:scale-105 transition-transform duration-500">
              <span className={`text-5xl font-black text-[#00BCD4] dark:text-cyan-400 uppercase tracking-widest ${googleSansAlt.className}`}>
                {course.title 
                  ? (course.title.trim().split(/\s+/).length > 1 
                      ? course.title.trim().split(/\s+/)[0][0] + course.title.trim().split(/\s+/)[1][0] 
                      : course.title.trim().substring(0, 2)).toUpperCase() 
                  : 'C'}
              </span>
            </div>
          )}

          {/* UX Harga Diskon Badge */}
          {Number(extendedCourse.discount_percent) > 0 && (
            <div className="absolute top-3 right-3 z-10 bg-red-500 text-white text-[10px] font-extrabold px-2 py-1 rounded-md shadow-sm animate-in zoom-in">
              {Number(extendedCourse.discount_percent) % 1 !== 0 
                ? Number(extendedCourse.discount_percent).toFixed(1) 
                : extendedCourse.discount_percent}% OFF
            </div>
          )}

          {/* Badge Status & Batch */}
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
            <span
              className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border backdrop-blur-md flex items-center gap-1.5 ${
                course.status === "Published"
                  ? "bg-emerald-50/90 text-emerald-600 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800/50"
                  : "bg-amber-50/90 text-amber-600 border-amber-200 dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-800/50"
              }`}
            >
              <span
                className={`size-1.5 rounded-full ${course.status === "Published" ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`}
              />
              {course.status}
            </span>
            {course.batch && (
              <span className="bg-slate-900/80 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg w-max backdrop-blur-md">
                {course.batch}
              </span>
            )}
          </div>
        </div>

        {/* MENU 3 TITIK */}
        <div className="absolute top-3 right-3 z-10" ref={menuRef}>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
            className="p-1.5 bg-white/80 dark:bg-black/50 backdrop-blur-md rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors border border-transparent hover:border-slate-300 dark:hover:border-slate-600 shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px] block">
              more_vert
            </span>
          </button>

          {isMenuOpen && (
            <>
              {/* Invisible Overlay untuk klik di luar */}
              <div 
                className="fixed inset-0 z-40 cursor-default" 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(false);
                }} 
              />
              <div className="absolute right-0 mt-2 w-max bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsMenuOpen(false);
                    setIsDeleteModalOpen(true);
                    setDeleteConfirmationText("");
                  }}
                  className="w-full text-left px-4 py-2.5 text-[13px] font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    delete
                  </span>{" "}
                  Hapus Kelas
                </button>
              </div>
            </>
          )}
        </div>

        {/* CONTENT INFO */}
        <div className="p-6 flex flex-col flex-1">
          <h3
            className={`text-lg font-bold text-slate-900 dark:text-white leading-snug mb-3 group-hover:text-[#00BCD4] transition-colors line-clamp-2 ${googleSansAlt.className}`}
          >
            {course.title}
          </h3>
          <div className="mb-4 flex flex-col">
            {Number(extendedCourse.price) > actualTotalPrice && (
              <span className="text-xs text-slate-400 line-through">
                {formatRupiah(Number(extendedCourse.price))}
              </span>
            )}
            <span className={`text-[18px] font-black ${actualTotalPrice === 0 ? "text-emerald-500" : "text-emerald-600 dark:text-emerald-400"}`}>
              {actualTotalPrice > 0 ? displayPrice : "GRATIS"}
            </span>
          </div>
          <div className="mt-auto space-y-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
                <span className="material-symbols-outlined text-[18px]">group</span> {course.students} Siswa
              </div>
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium text-xs">
                <span className="material-symbols-outlined text-[16px]">calendar_today</span> {course.lastUpdated}
              </div>
            </div>
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <Link
                href={`/course-editor?course=${course.id}`}
                className={`flex-1 flex justify-center items-center gap-2 px-4 py-2.5 bg-[#00BCD4]/10 hover:bg-[#00BCD4] text-[#00BCD4] hover:text-white rounded-xl text-sm font-bold transition-all border border-[#00BCD4]/20 hover:border-[#00BCD4] active:scale-95 ${googleSansAlt.className}`}
              >
                <span className="material-symbols-outlined text-[18px]">edit</span> Edit Kelas
              </Link>
            </div>
          </div>
        </div>
      </div>
      {isMounted && isDeleteModalOpen && createPortal(<DeleteModal />, document.body)}
    </>
  );
}