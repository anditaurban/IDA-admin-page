"use client";

import React, { useRef, useState, useEffect } from "react";
import { DM_Sans } from "next/font/google";

import type { BasicCourseData } from "@/hooks/useCourseEditor";
import type { CourseCategory } from "@/hooks/useCourseCategories";
import type { DiscountMode } from "@/utils/coursePricing";

import {
  calculateTotalPrice,
  formatRibuan,
  normalizeNumberString,
} from "@/utils/coursePricing";

const googleSansAlt = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
});

type CourseBasicEditorProps = {
  courseSlug: string;
  basicData: BasicCourseData;
  categories: CourseCategory[];
  levels: string[];
  isFetching: boolean;
  isCategoryLoading: boolean;
  isLevelLoading: boolean;
  isUploadingThumbnail: boolean;
  discountMode: DiscountMode;
  isEditing: boolean;
  onEditToggle: () => void;
  onCancelToggle: () => void;
  onChange: (
    field: keyof BasicCourseData,
    value: string | boolean | number,
  ) => void;
  onDiscountModeChange: (mode: DiscountMode) => void;
  onThumbnailUpload: (file: File) => void;
  onFileError: (message: string) => void;
};

export default function CourseBasicEditor({
  courseSlug,
  basicData,
  categories,
  levels,
  isFetching,
  isCategoryLoading,
  isLevelLoading,
  isUploadingThumbnail,
  discountMode,
  isEditing,
  onEditToggle,
  onCancelToggle,
  onChange,
  onDiscountModeChange,
  onThumbnailUpload,
  onFileError,
}: CourseBasicEditorProps) {
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  // State untuk menampung gambar preview instan
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  
  // State untuk melacak ID kelas sebelumnya (Pola resmi React pengganti useEffect)
  const [prevSlug, setPrevSlug] = useState(courseSlug);

  // ✨ FIX 1: POLA ANTI-BOCOR MEMORI (Tanpa useEffect)
  // Jika instruktur pindah ke kelas lain, reset preview langsung di fase render
  if (courseSlug !== prevSlug) {
    setPrevSlug(courseSlug);
    setLocalPreview(null);
  }

  // ✨ FIX 2: LOGIKA PENENTUAN URL DENGAN ANTI-CACHE
  const displayThumbnail = React.useMemo(() => {
    const rawBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "";
    let baseUrl = rawBaseUrl.replace(/\/+$/, "");

    if (baseUrl.endsWith("/api")) {
      baseUrl = baseUrl.slice(0, -4);
    }

    const thumb = basicData.thumbnail;

    if (!thumb) return "";
    if (
      thumb.startsWith("data:") ||
      thumb.startsWith("bg-") ||
      thumb.startsWith("http") ||
      thumb.startsWith("blob:")
    ) {
      return thumb;
    }

    const filename = thumb.split("/").pop();
    // Tambahkan '?t=' agar browser selalu memuat gambar terbaru
    return `${baseUrl}/thumbnail/course/${filename}?t=${new Date().getTime()}`;
  }, [basicData.thumbnail]);

  const isCssThumbnail = displayThumbnail.startsWith("bg-");
  const isImageThumbnail = displayThumbnail.length > 0 && !isCssThumbnail;

  const [secureImageUrl, setSecureImageUrl] = useState<string>("");

  // ✨ FIX 3: LOGIKA FETCH GAMBAR BEBAS CORS (Tanpa Header Auth)
  useEffect(() => {
    const fetchSecureImage = async () => {
      if (
        !displayThumbnail ||
        isCssThumbnail ||
        displayThumbnail.startsWith("data:") ||
        displayThumbnail.startsWith("blob:")
      ) {
        setSecureImageUrl(displayThumbnail);
        return;
      }

      try {
        const response = await fetch(displayThumbnail);

        if (response.ok) {
          const blob = await response.blob();
          const objectUrl = URL.createObjectURL(blob);
          setSecureImageUrl(objectUrl);
        } else {
          setSecureImageUrl(displayThumbnail);
        }
      } catch {
        setSecureImageUrl(displayThumbnail);
      }
    };

    fetchSecureImage();
  }, [displayThumbnail, isCssThumbnail]);

  const parsedPrice = Number(normalizeNumberString(basicData.price)) || 0;

  type ExtendedData = BasicCourseData & {
    discount_percent?: string | number;
    discount_nominal?: string | number;
    total_price?: string | number;
    discount?: string | number;
  };
  const safeData = basicData as ExtendedData;

  const apiPercent = Number(safeData.discount_percent) || 0;
  const apiNominal = Number(safeData.discount_nominal) || 0;
  const genericDiscount = Number(
    normalizeNumberString(String(safeData.discount || 0)),
  );

  const displayPercent =
    apiPercent > 0
      ? apiPercent
      : discountMode === "percent"
        ? genericDiscount
        : 0;
  const displayNominal =
    apiNominal > 0
      ? apiNominal
      : discountMode === "nominal"
        ? genericDiscount
        : 0;

  const currentEditDiscount =
    discountMode === "percent"
      ? String(displayPercent)
      : String(displayNominal);

  const currentModeForCalc = isEditing
    ? discountMode
    : displayPercent > 0
      ? "percent"
      : "nominal";
  const currentValueForCalc = isEditing
    ? currentEditDiscount
    : String(displayPercent > 0 ? displayPercent : displayNominal);

  const calculatedFinal = calculateTotalPrice(
    basicData.price,
    currentModeForCalc,
    currentValueForCalc,
  );

  const finalPrice = calculatedFinal > 0 ? calculatedFinal : parsedPrice;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      onFileError(
        "Format file tidak didukung. Harap pilih gambar JPG, PNG, atau WEBP.",
      );
      e.target.value = "";
      return;
    }

    const MAX_SIZE_MB = 2;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      onFileError(`Ukuran gambar terlalu besar! Maksimal ${MAX_SIZE_MB}MB.`);
      e.target.value = "";
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setLocalPreview(objectUrl);

    onThumbnailUpload(file);
    e.target.value = "";
  };

  return (
    <div
      className={`p-8 rounded-4xl border flex flex-col lg:flex-row gap-10 mb-8 transition-all duration-500 ${isEditing ? "bg-white dark:bg-[#111111] border-slate-200/80 dark:border-slate-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]" : "bg-transparent border-transparent"}`}
    >
      {/* KIRI: THUMBNAIL */}
      <div className="w-full lg:w-85 shrink-0">
        {isEditing && (
          <div className="flex items-center justify-between mb-3 animate-in fade-in">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Thumbnail Image (Maks 2MB)
            </label>
          </div>
        )}

        <input
          type="file"
          accept="image/png, image/jpeg, image/jpg, image/webp"
          className="hidden"
          ref={thumbnailInputRef}
          onChange={handleFileChange}
        />

        {/* Kotak Gambar Thumbnail */}
        <div
          className={`group relative w-full aspect-4/3 rounded-3xl overflow-hidden shadow-sm bg-slate-100 dark:bg-slate-900 transition-all duration-300 ${
            isFetching || isUploadingThumbnail
              ? "animate-pulse pointer-events-none"
              : ""
          } ${isEditing ? "border border-slate-200 dark:border-slate-800 cursor-pointer hover:shadow-md" : "border-0 pointer-events-none"}`}
          onClick={() => isEditing && thumbnailInputRef.current?.click()}
        >
          {isUploadingThumbnail && (
            <div className="absolute z-20 inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-[#00BCD4]">
              <span className="material-symbols-outlined text-4xl animate-spin mb-2">
                sync
              </span>
              <span className="text-xs font-bold uppercase tracking-wider">
                Mengunggah...
              </span>
            </div>
          )}

          {displayThumbnail ? (
            <div
              className={`absolute inset-0 bg-cover bg-center transition-transform duration-700 ${isEditing && "group-hover:scale-105"}`}
              style={{
                backgroundImage: localPreview
                  ? `url('${localPreview}')`
                  : isImageThumbnail && secureImageUrl
                    ? `url('${secureImageUrl}')`
                    : "none",
              }}
            />
          ) : (
            /* UX Baru: Placeholder Inisial Judul Kelas di Editor */
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-linear-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 transition-all duration-500">
              <span
                className={`text-6xl lg:text-7xl font-black text-slate-300 dark:text-slate-600/80 uppercase tracking-widest drop-shadow-sm transition-all ${googleSansAlt.className}`}
              >
                {basicData.title
                  ? (basicData.title.trim().split(/\s+/).length > 1
                      ? basicData.title.trim().split(/\s+/)[0][0] +
                        basicData.title.trim().split(/\s+/)[1][0]
                      : basicData.title.trim().substring(0, 2)
                    ).toUpperCase()
                  : "C"}
              </span>

              {!isEditing && (
                <span className="absolute bottom-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-widest uppercase bg-white/50 dark:bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm">
                  Belum Ada Thumbnail
                </span>
              )}
            </div>
          )}

          {isEditing && (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-300 flex flex-col items-center justify-center">
              <div className="translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center gap-3">
                <div className="size-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30 shadow-xl">
                  <span className="material-symbols-outlined text-[24px]">
                    cloud_upload
                  </span>
                </div>
                <p className="font-bold text-xs text-white drop-shadow-md">
                  Update Thumbnail
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* KANAN: FORM & INFORMASI KELAS */}
      <div className="flex-1 flex flex-col">
        <div className="mb-4 relative group">
          {isEditing && (
            <label className="text-[11px] font-bold text-[#00BCD4] uppercase tracking-wider flex items-center gap-2 mb-2 opacity-80 animate-in fade-in">
              Judul Utama Kelas
            </label>
          )}
          {isEditing ? (
            <textarea
              value={basicData.title}
              onChange={(e) => onChange("title", e.target.value)}
              rows={2}
              disabled={isFetching}
              className={`w-full bg-transparent border-0 p-0 text-3xl sm:text-4xl lg:text-[40px] font-extrabold text-slate-900 dark:text-white focus:ring-0 resize-none outline-none leading-[1.1] transition-all placeholder:text-slate-300 dark:placeholder:text-slate-700 disabled:opacity-50 ${googleSansAlt.className}`}
              placeholder="Ketik judul kelas di sini..."
            />
          ) : (
            <h2
              className={`text-3xl sm:text-4xl lg:text-[40px] font-extrabold text-slate-900 dark:text-white leading-[1.1] ${googleSansAlt.className}`}
            >
              {basicData.title || (
                <span className="text-slate-300">Judul belum diatur</span>
              )}
            </h2>
          )}
        </div>

        <div
          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 ${isFetching ? "opacity-50" : ""}`}
        >
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-bold bg-slate-100 dark:bg-[#161616] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="material-symbols-outlined text-[14px]">
                person
              </span>
              {basicData.author_name || basicData.author || "Instruktur"}
            </div>
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-bold bg-slate-100 dark:bg-[#161616] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="material-symbols-outlined text-[14px]">
                group
              </span>
              {basicData.students} Siswa
            </div>
          </div>

          <div className="animate-in fade-in zoom-in-95 duration-300">
            {isEditing ? (
              <button
                onClick={onCancelToggle}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400 rounded-xl text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all border border-rose-200 dark:border-rose-500/30 active:scale-95"
              >
                <span className="material-symbols-outlined text-[16px]">
                  close
                </span>{" "}
                Batal Edit
              </button>
            ) : (
              <button
                onClick={onEditToggle}
                className="flex items-center gap-1.5 px-4 py-2 bg-cyan-50 dark:bg-cyan-500/10 text-[#00BCD4] rounded-xl text-xs font-bold hover:bg-[#00BCD4] hover:text-white transition-all border border-cyan-200 dark:border-cyan-500/30 active:scale-95 group"
              >
                <span className="material-symbols-outlined text-[16px] group-hover:rotate-12 transition-transform">
                  edit
                </span>{" "}
                Edit Info Kelas
              </button>
            )}
          </div>
        </div>

        <div className="mt-auto grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            className={`flex flex-col gap-1.5 transition-all duration-300 ${isEditing ? "p-4 rounded-2xl bg-[#fafafa] dark:bg-[#161616] border border-slate-200/60 dark:border-slate-800/60 focus-within:border-[#00BCD4]/50 focus-within:ring-2 focus-within:ring-[#00BCD4]/10" : "p-2"}`}
          >
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px]">
                category
              </span>
              Kategori
            </label>
            {isEditing ? (
              <select
                value={basicData.category_id || ""}
                onChange={(e) =>
                  onChange(
                    "category_id",
                    e.target.value ? Number(e.target.value) : 1,
                  )
                }
                disabled={isFetching || isCategoryLoading}
                className="w-full bg-transparent border-0 p-0 text-sm font-bold text-slate-900 dark:text-white outline-none cursor-pointer focus:ring-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {categories.length > 0 ? (
                  categories.map((c) => (
                    <option key={c.category_id} value={c.category_id}>
                      {c.category_name}
                    </option>
                  ))
                ) : (
                  <option value="">Belum tersedia</option>
                )}
              </select>
            ) : (
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {basicData.category_name || "Umum"}
              </span>
            )}
          </div>

          <div
            className={`flex flex-col gap-1.5 transition-all duration-300 ${isEditing ? "p-4 rounded-2xl bg-[#fafafa] dark:bg-[#161616] border border-slate-200/60 dark:border-slate-800/60 focus-within:border-[#00BCD4]/50 focus-within:ring-2 focus-within:ring-[#00BCD4]/10" : "p-2"}`}
          >
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px]">
                stairs
              </span>
              Tingkat
            </label>
            {isEditing ? (
              <select
                value={basicData.level}
                onChange={(e) => onChange("level", e.target.value)}
                disabled={isFetching || isLevelLoading}
                className="w-full bg-transparent border-0 p-0 text-sm font-bold text-slate-900 dark:text-white outline-none cursor-pointer focus:ring-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {levels.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {basicData.level || "Beginner"}
              </span>
            )}
          </div>

          <div
            className={`relative flex flex-col items-start justify-center flex-1 transition-all duration-300 ${isEditing ? "p-4 rounded-2xl bg-[#fafafa] dark:bg-[#161616] border border-slate-200/60 dark:border-slate-800/60 focus-within:border-[#00BCD4]/50 focus-within:ring-2 focus-within:ring-[#00BCD4]/10" : "p-2"}`}
          >
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px]">
                payments
              </span>
              Harga Dasar
            </label>
            {isEditing ? (
              <div className="flex items-center w-full mt-0.5">
                <span className="text-sm font-bold text-slate-400 mr-1.5">
                  Rp
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={
                    !basicData.price || basicData.price === "0"
                      ? ""
                      : formatRibuan(basicData.price)
                  }
                  onChange={(e) =>
                    onChange("price", normalizeNumberString(e.target.value))
                  }
                  className="w-full bg-transparent border-0 p-0 text-sm font-bold outline-none focus:ring-0 placeholder:text-slate-300 text-slate-900 dark:text-white"
                  placeholder="0"
                />
              </div>
            ) : (
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                Rp {formatRibuan(parsedPrice)}
              </span>
            )}
          </div>
        </div>

        {/* ================= MULAI BLOK DISKON & HARGA ================= */}
        <div className="mt-4 flex flex-col md:flex-row gap-4">
          {/* KOTAK KIRI: ATUR DISKON */}
          <div
            className={`flex-1 flex flex-col sm:flex-row sm:items-center gap-3 transition-all duration-500 ${isEditing ? "p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/20" : "px-2 py-4"}`}
          >
            <div
              className={`flex flex-col gap-2 ${isEditing ? "sm:w-5/12" : ""}`}
            >
              <label className="text-[10px] font-bold text-rose-500 dark:text-rose-400 uppercase tracking-widest flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px]">
                  loyalty
                </span>
                {isEditing ? "Atur Diskon" : "Diskon Diterapkan"}
              </label>
              {isEditing && (
                <div className="flex rounded-lg bg-white/70 dark:bg-[#111111] p-1 border border-rose-100 dark:border-rose-500/20 animate-in fade-in">
                  <button
                    type="button"
                    onClick={() => onDiscountModeChange("percent")}
                    className={`flex-1 rounded-md px-2 py-1 text-[10px] font-bold transition-all ${discountMode === "percent" ? "bg-rose-500 text-white" : "text-rose-500 hover:bg-rose-100"}`}
                  >
                    Persen
                  </button>
                  <button
                    type="button"
                    onClick={() => onDiscountModeChange("nominal")}
                    className={`flex-1 rounded-md px-2 py-1 text-[10px] font-bold transition-all ${discountMode === "nominal" ? "bg-rose-500 text-white" : "text-rose-500 hover:bg-rose-100"}`}
                  >
                    Nominal
                  </button>
                </div>
              )}
            </div>

            <div
              className={`relative flex items-center flex-1 transition-all ${isEditing ? "bg-white/60 dark:bg-[#161616]/60 rounded-xl px-4 py-2 border border-rose-100 dark:border-rose-500/20" : ""}`}
            >
              {isEditing ? (
                <>
                  {discountMode === "nominal" && (
                    <span className="text-sm font-bold text-rose-500/50 mr-2">
                      Rp
                    </span>
                  )}
                  <input
                    type="text"
                    inputMode="numeric"
                    value={
                      !currentEditDiscount || currentEditDiscount === "0"
                        ? ""
                        : discountMode === "nominal"
                          ? formatRibuan(currentEditDiscount)
                          : currentEditDiscount
                    }
                    onChange={(e) => {
                      let val = normalizeNumberString(e.target.value);
                      if (discountMode === "percent" && Number(val) > 100)
                        val = "100";

                      if (discountMode === "nominal") {
                        onChange("discount_nominal", val);
                      } else {
                        onChange("discount_percent", val);
                      }
                    }}
                    className={`w-full bg-transparent border-0 p-0 text-lg font-black text-rose-600 dark:text-rose-400 outline-none focus:ring-0 placeholder:text-rose-300 ${discountMode === "percent" ? "text-right" : "text-left"}`}
                    placeholder="0"
                  />
                  {discountMode === "percent" && (
                    <span className="text-lg font-bold text-rose-500/50 ml-2">
                      %
                    </span>
                  )}
                </>
              ) : (
                <div className="flex items-center">
                  {displayPercent > 0 || displayNominal > 0 ? (
                    <div className="inline-flex items-center gap-1.5 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-md px-3 py-1.5 w-max shadow-sm">
                      <span className="material-symbols-outlined text-[16px] text-rose-500">
                        sell
                      </span>
                      <span className="text-xs font-bold text-rose-600 dark:text-rose-400 tracking-wide">
                        {displayPercent > 0
                          ? `${displayPercent}%`
                          : `Rp ${formatRibuan(displayNominal)}`}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xl font-black text-slate-300 dark:text-slate-700">
                      0
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* KOTAK KANAN: ESTIMASI HARGA JUAL */}
          <div
            className={`md:w-[40%] flex flex-col justify-center rounded-2xl border px-5 py-4 transition-all duration-500 ${isEditing ? "border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10" : "border-transparent bg-transparent pl-2"}`}
          >
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block mb-1.5">
              Estimasi Harga Jual
            </span>
            <div className="flex flex-col">
              {parsedPrice > 0 && finalPrice < parsedPrice && (
                <span className="text-xs font-bold text-slate-400 line-through decoration-rose-500/40 decoration-2 mb-0.5">
                  Rp {formatRibuan(parsedPrice)}
                </span>
              )}
              <span
                className={`font-black text-emerald-700 dark:text-emerald-400 leading-none tracking-tight ${isEditing ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl"}`}
              >
                Rp {formatRibuan(finalPrice)}
              </span>
            </div>
          </div>
        </div>
        {/* ================= AKHIR BLOK DISKON & HARGA ================= */}
      </div>
    </div>
  );
}