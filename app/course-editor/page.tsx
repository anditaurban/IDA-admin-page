"use client";

import React, {
  Suspense,
  useCallback,
  useState,
  useEffect,
  useSyncExternalStore,
} from "react";
import { DM_Sans, Inter } from "next/font/google";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Cookies from "js-cookie";

import OverviewTab from "@/components/editor/OverviewTab";
import MaterialsTab from "@/components/editor/MaterialsTab";
import VideosTab from "@/components/editor/VideosTab";
import AssignmentsTab from "@/components/editor/AssignmentsTab";
import ReviewsTab from "@/components/editor/ReviewsTab";
import CourseBasicEditor from "@/components/editor/CourseBasicEditor";
import CourseTabNavigation, {
  CourseEditorTab,
} from "@/components/editor/CourseTabNavigation";
import { useCourseEditor } from "@/hooks/useCourseEditor";
import { useCourseCategories } from "@/hooks/useCourseCategories";
import { useCourseLevels } from "@/hooks/useCourseLevels";
import { useToast } from "@/components/ui/ToastProvider";

const inter = Inter({ subsets: ["latin"] });
const googleSansAlt = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
});

let cachedOwnerId: string | null = null;
const emptySubscribe = () => () => {};

function getResolvedOwnerId() {
  if (typeof window === "undefined") return "";
  if (cachedOwnerId !== null) return cachedOwnerId;

  const savedOwnerId = localStorage.getItem("instructor_owner_id");
  if (savedOwnerId) {
    cachedOwnerId = savedOwnerId;
    return cachedOwnerId;
  }

  const profileRaw = localStorage.getItem("user_profile");
  if (!profileRaw) return "";

  try {
    const profile = JSON.parse(profileRaw) as Record<string, unknown>;
    const resolvedOwnerId = profile.owner_id || profile.user_id || profile.id;
    cachedOwnerId = resolvedOwnerId ? String(resolvedOwnerId) : "";
    return cachedOwnerId;
  } catch {
    return "";
  }
}

function CourseEditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const courseSlug = searchParams.get("course") || "default-course";

  const urlTab = searchParams.get("tab");
  
  // ✨ FIX: Berikan tipe <CourseEditorTab> pada useState dan asersi (as CourseEditorTab) pada urlTab
  const [activeTab, setActiveTab] = useState<CourseEditorTab>(
    (urlTab as CourseEditorTab) || "overview"
  );

  // ✨ TAMBAHKAN INI: Agar ketika pindah halaman dari Article Builder, tab-nya langsung otomatis pindah ke Materials tanpa perlu refresh manual
  useEffect(() => {
    if (urlTab) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab(urlTab as CourseEditorTab);
    }
  }, [urlTab]);
  // ✨ STATE BARU: View vs Edit Mode
  const [isEditing, setIsEditing] = useState(false);

  const ownerId = useSyncExternalStore(
    emptySubscribe,
    getResolvedOwnerId,
    () => "",
  );

  const handleAuthError = useCallback(() => {
    Cookies.remove("auth_session");
    Cookies.remove("api_token");
    Cookies.remove("token");
    showToast(
      "error",
      "Sesi login Anda telah berakhir. Silakan masuk kembali.",
    );
    router.replace("/login");
  }, [router, showToast]);

  const { categories, isCategoryLoading } = useCourseCategories({
    ownerId,
    onUnauthorized: handleAuthError,
  });

  const { levels, isLevelLoading } = useCourseLevels({
    ownerId,
    onUnauthorized: handleAuthError,
  });

  const {
    basicData,
    isFetching,
    isSaving,
    isUploadingThumbnail,
    discountMode,
    resolvedCourseId,
    getActiveToken,
    handleBasicChange,
    switchDiscountMode,
    saveCourseChanges,
    updateThumbnail,
    discardChanges,
  } = useCourseEditor({
    courseSlug,
    categories,
    showToast,
    onUnauthorized: handleAuthError,
    currentOwnerId: ownerId,
  });

  const headerCourseTitle =
    basicData.title?.trim() ||
    (isFetching ? "Memuat judul kelas..." : courseSlug);

  // ... (kode atas tetap sama)

  // ✨ HANDLER: Simpan (Global Action)
  const handleSaveClick = async () => {
    await saveCourseChanges();
    setIsEditing(false); // Otomatis kembali ke Mode Lihat setelah sukses simpan
  };

  return (
    <div
      className={`min-h-screen bg-[#f4f5f7] dark:bg-[#050505] ${inter.className} pb-32 selection:bg-[#00BCD4]/30`}
    >
      <header className="h-18 bg-white/70 dark:bg-[#0a0a0a]/70 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between px-6 sticky top-0 z-50">
        {/* ✨ KEMBALIKAN BAGIAN KIRI INI (Link Back & Judul) */}
        <div className="flex items-center gap-5">
          <Link
            href="/"
            className="group flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all text-slate-500 hover:text-slate-900 dark:hover:text-white"
            title="Kembali ke Dashboard"
          >
            <span className="material-symbols-outlined text-[20px] transition-colors">
              arrow_back
            </span>
            <span className="hidden sm:inline text-sm font-bold">Beranda</span>
          </Link>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />

          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#00BCD4] uppercase tracking-widest mb-0.5">
              <span className="material-symbols-outlined text-[14px]">
                tune
              </span>
              <span>Workspace Editor</span>
            </div>
            <h1
              className={`text-sm font-bold text-slate-900 dark:text-white ${googleSansAlt.className}`}
              title={headerCourseTitle}
            >
              {headerCourseTitle}
            </h1>
          </div>
        </div>

        {/* ✨ AREA TOMBOL HEADER: Hanya ada Global Save */}
        <div className="flex items-center gap-4">
          {!basicData.isPublished && (
            <div className="hidden sm:flex px-3.5 py-1.5 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full text-[11px] font-bold border border-amber-200 dark:border-amber-500/20 items-center gap-2">
              <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
              Draft Mode
            </div>
          )}

          <button
            onClick={handleSaveClick}
            disabled={
              isSaving || isFetching || !basicData.title || isUploadingThumbnail
            }
            className={`flex items-center gap-2 px-6 py-2.5 bg-[#00BCD4] hover:bg-cyan-500 text-white rounded-full text-sm font-bold shadow-lg shadow-cyan-500/20 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed ${googleSansAlt.className}`}
          >
            {isSaving ? (
              <>
                <span className="material-symbols-outlined text-[18px] animate-spin">
                  sync
                </span>{" "}
                Menyimpan...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">
                  save
                </span>{" "}
                Simpan Perubahan
              </>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-260 mx-auto px-6 py-10">
        {/* ✨ PASS FUNGSI TOGGLE EDIT KE KOMPONEN BAWAH */}
        <CourseBasicEditor
          basicData={basicData}
          courseSlug={courseSlug}
          categories={categories}
          levels={levels}
          isFetching={isFetching}
          isCategoryLoading={isCategoryLoading}
          isLevelLoading={isLevelLoading}
          isUploadingThumbnail={isUploadingThumbnail}
          discountMode={discountMode}
          isEditing={isEditing}
          onEditToggle={() => setIsEditing(true)}
          onCancelToggle={() => {
            discardChanges();
            setIsEditing(false);
          }}
          onChange={handleBasicChange}
          onDiscountModeChange={switchDiscountMode}
          onThumbnailUpload={updateThumbnail}
          onFileError={(message: string) => showToast("error", message)}
        />

        <CourseTabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {!isFetching && activeTab === "overview" && (
            <OverviewTab
              key={String(resolvedCourseId || courseSlug)}
              courseId={resolvedCourseId}
              courseSlug={courseSlug}
              apiToken={getActiveToken()}
              initialData={{
                deskripsi: basicData.deskripsi || "",
                tech_stack: basicData.tech_stack || [],
                target_audience: basicData.target_audience || [],
                instructor: basicData.author || "",
              }}
            />
          )}

          {!isFetching && activeTab === "materials" && (
            <MaterialsTab courseSlug={courseSlug} />
          )}
          {!isFetching && activeTab === "videos" && <VideosTab />}
          {!isFetching && activeTab === "assignments" && <AssignmentsTab />}
          {!isFetching && activeTab === "reviews" && <ReviewsTab />}
        </div>
      </main>
    </div>
  );
}

export default function CourseEditorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#f4f5f7] dark:bg-[#050505] text-slate-500 gap-4">
          <span className="material-symbols-outlined text-[32px] animate-spin">
            progress_activity
          </span>
          <p className="text-sm font-medium">Memuat Workspace...</p>
        </div>
      }
    >
      <CourseEditorContent />
    </Suspense>
  );
}