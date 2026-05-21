"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { DM_Sans } from "next/font/google";
import Cookies from "js-cookie";
import { useToast } from "@/components/ui/ToastProvider";
import type { CourseItem } from "@/hooks/useInstructorDashboard";

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

  const displayThumbnail = React.useMemo(() => {
    const rawBaseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "";
    let baseUrl = rawBaseUrl.replace(/\/+$/, ""); // Bersihkan slash di akhir

    if (baseUrl.endsWith("/api")) {
      baseUrl = baseUrl.slice(0, -4);
    }

    const thumb = course?.thumbnail;

    if (!thumb) return "";
    if (
      thumb.startsWith("data:") ||
      thumb.startsWith("bg-") ||
      thumb.startsWith("http")
    )
      return thumb;

    const filename = thumb.split("/").pop();
    return `${baseUrl}/thumbnail/course/${filename}`;
  }, [course?.thumbnail]);

  // ✨ FIX LOGIKA: Selama string tidak kosong dan bukan kelas warna 'bg-', berarti ini adalah gambar asli
  const isCssThumbnail = displayThumbnail.startsWith("bg-");
  const isImageThumbnail = displayThumbnail.length > 0 && !isCssThumbnail;

  const { showToast } = useToast();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const menuRef = useRef<HTMLDivElement>(null);

  const [secureImageUrl, setSecureImageUrl] = useState<string>("");

  useEffect(() => {
    const fetchSecureImage = async () => {
      // Jika URL kosong atau berupa warna/base64, biarkan saja
      if (
        !displayThumbnail ||
        isCssThumbnail ||
        displayThumbnail.startsWith("data:")
      ) {
        setSecureImageUrl(displayThumbnail);
        return;
      }

      try {
        const token =
          Cookies.get("api_token") || process.env.NEXT_PUBLIC_API_TOKEN;

        // Ambil gambar secara manual MENGGUNAKAN TOKEN
        const response = await fetch(displayThumbnail, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const blob = await response.blob();
          const objectUrl = URL.createObjectURL(blob);
          setSecureImageUrl(objectUrl);
        }
      } catch (error) {
        console.error("Gagal meload gambar aman", error);
      }
    };

    fetchSecureImage();
  }, [displayThumbnail, isCssThumbnail]);

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

      // 1. Tutup modal dan munculkan toast
      setIsDeleteModalOpen(false);
      showToast("success", "Kelas berhasil dihapus.");

      // 2. ✨ RELOAD HALAMAN OTOMATIS ✨
      if (onCourseDeleted) {
        onCourseDeleted(String(course.id));
      }

      setTimeout(() => {
        window.location.reload();
      }, 500); 

    } catch (error) {
      console.error(error);
      showToast("error", "Gagal menghapus kelas. Coba lagi.");
    } finally {
      setIsDeleting(false);
    }
  };

  const displayPrice =
    course.totalPrice > 0
      ? `Rp ${new Intl.NumberFormat("id-ID").format(course.totalPrice)}`
      : "Gratis";

  const DeleteModal = () => (
    <div className="fixed inset-0 z-99999 flex items-center justify-center bg-slate-900/60 dark:bg-black/80 backdrop-blur-md p-4">
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
            Ini adalah tindakan yang{" "}
            <strong className="text-red-500 font-bold">sangat fatal</strong>.
            Anda akan kehilangan seluruh materi kelas ini selamanya.
          </p>

          <div className="mb-8 bg-slate-50 dark:bg-[#0a0a0a] p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2.5 uppercase tracking-wide">
              Ketik{" "}
              <span className="text-red-500 font-mono bg-red-100 dark:bg-red-500/20 px-2 py-0.5 rounded select-none">
                HAPUS
              </span>{" "}
              untuk konfirmasi:
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
              {isDeleting ? (
                <span className="material-symbols-outlined text-[20px] animate-spin">
                  sync
                </span>
              ) : (
                "Ya, Hapus"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="relative bg-white dark:bg-[#111111] rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl hover:border-cyan-200 dark:hover:border-slate-700 transition-all duration-300 group flex flex-col h-full">
        {/* THUMBNAIL */}
        <div className="h-36 bg-slate-100 dark:bg-slate-900 relative border-b border-slate-200 dark:border-slate-800 overflow-hidden shrink-0">

          {displayThumbnail ? (
            <div
              className={`absolute inset-0 bg-cover bg-center opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500 ${isCssThumbnail ? displayThumbnail : ""}`}
              /* ✨ FIX: Tambahkan tanda kutip tunggal '' di dalam url() */
              style={
                isImageThumbnail
                  ? { backgroundImage: `url('${secureImageUrl}')` }
                  : {}
              }
            />
          ) : (
            <div className="absolute inset-0 opacity-50 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500 bg-linear-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900" />
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
            <div className="absolute right-0 mt-2 w-max bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
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
          )}
        </div>

        {/* CONTENT INFO */}
        <div className="p-6 flex flex-col flex-1">
          <h3
            className={`text-lg font-bold text-slate-900 dark:text-white leading-snug mb-2 group-hover:text-[#00BCD4] transition-colors line-clamp-2 ${googleSansAlt.className}`}
          >
            {course.title}
          </h3>

          <div className="mb-4">
            <span className="text-[17px] font-black text-emerald-600 dark:text-emerald-400">
              {displayPrice}
            </span>
          </div>

          <div className="mt-auto space-y-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
                <span className="material-symbols-outlined text-[18px]">
                  group
                </span>{" "}
                {course.students} Siswa
              </div>
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium text-xs">
                <span className="material-symbols-outlined text-[16px]">
                  calendar_today
                </span>{" "}
                {course.lastUpdated}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <Link
                href={`/course-editor?course=${course.id}`}
                className={`flex-1 flex justify-center items-center gap-2 px-4 py-2.5 bg-[#00BCD4]/10 hover:bg-[#00BCD4] text-[#00BCD4] hover:text-white rounded-xl text-sm font-bold transition-all border border-[#00BCD4]/20 hover:border-[#00BCD4] active:scale-95 ${googleSansAlt.className}`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  edit
                </span>{" "}
                Edit Kelas
              </Link>
            </div>
          </div>
        </div>
      </div>

      {isMounted &&
        isDeleteModalOpen &&
        createPortal(<DeleteModal />, document.body)}
    </>
  );
}
