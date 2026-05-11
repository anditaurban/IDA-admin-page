'use client';

import React, { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import { DM_Sans, Inter } from 'next/font/google';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Cookies from 'js-cookie';
import { useToast } from '@/components/ui/ToastProvider';

import OverviewTab from '@/components/editor/OverviewTab';
import MaterialsTab from '@/components/editor/MaterialsTab';
import VideosTab from '@/components/editor/VideosTab';
import AssignmentsTab from '@/components/editor/AssignmentsTab';
import ReviewsTab from '@/components/editor/ReviewsTab';

const inter = Inter({ subsets: ['latin'] });
const googleSansAlt = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '700', '800'] });

// --- KONFIGURASI API ---
const RAW_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
const BASE_URL = RAW_BASE_URL.endsWith('/') ? RAW_BASE_URL.slice(0, -1) : RAW_BASE_URL;

// Sinkronisasi tipe data lengkap dengan Backend API
interface BasicCourseData {
  title: string;
  thumbnail: string;
  level: string;
  price: string;
  discount: string;
  isPublished?: boolean;
  category_id?: number;
  category_name?: string;
  author?: string;
  rating?: string;
  students?: number;
}

const defaultBasicData: BasicCourseData = {
  title: "", 
  thumbnail: "",
  level: "Beginner",
  price: "0",
  discount: "0",
  isPublished: false,
  category_id: 1,
  category_name: "Umum",
  author: "Instruktur",
  rating: "0.0",
  students: 0
};

function CourseEditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const courseSlug = searchParams.get('course') || 'default-course';
  
  const [activeTab, setActiveTab] = useState<'overview' | 'materials' | 'videos' | 'assignments' | 'reviews'>('overview');
  const [basicData, setBasicData] = useState<BasicCourseData>(defaultBasicData);
  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  // ✨ STATE & REF UNTUK UPLOAD THUMBNAIL ✨
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);

  const getActiveToken = useCallback(() => {
    const cookieToken = Cookies.get('api_token');
    if (cookieToken && cookieToken.length > 20) {
        return cookieToken;
    }
    return process.env.NEXT_PUBLIC_API_TOKEN || '';
  }, []);

  const handleAuthError = useCallback(() => {
    Cookies.remove('auth_session');
    Cookies.remove('api_token');
    Cookies.remove('token');
    showToast('error', 'Sesi login Anda telah berakhir. Silakan masuk kembali.');
    router.replace('/login');
  }, [router, showToast]);

  useEffect(() => {
    const cachedData = localStorage.getItem(`db_course_basic_${courseSlug}`);
    if (cachedData) {
      try {
        setBasicData(prev => ({ ...prev, ...JSON.parse(cachedData) }));
      } catch(e) { 
        console.error("Cache error", e); 
      }
    }

    const fetchCourseDetail = async () => {
      setIsFetching(true);
      try {
        if (!BASE_URL) return;
        
        const token = getActiveToken();
        if (!token) {
          console.warn("⚠️ Token API tidak ditemukan.");
          return;
        }

        const response = await fetch(`${BASE_URL}/detail/course/${courseSlug}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.status === 401 || response.status === 403) {
           handleAuthError();
           return;
        }

        if (response.ok) {
          const resJson = await response.json();
          let apiData = null;
          
          if (resJson.tableData && Array.isArray(resJson.tableData)) {
             apiData = resJson.tableData.find((c: Record<string, unknown>) => String(c.course_id) === String(courseSlug)) || resJson.tableData[0];
          } else if (resJson.detail && Array.isArray(resJson.detail)) {
             apiData = resJson.detail[0];
          } else if (resJson.detail) {
             apiData = resJson.detail;
          } else if (resJson.data && Array.isArray(resJson.data)) {
             apiData = resJson.data[0];
          } else if (resJson.data) {
             apiData = resJson.data;
          } else if (Array.isArray(resJson)) {
             apiData = resJson[0];
          } else {
             apiData = resJson;
          }
          
          if (apiData) {
             const freshData: BasicCourseData = {
               title: apiData.title || '',
               thumbnail: apiData.thumbnail || '',
               level: apiData.level || 'Beginner',
               price: apiData.price ? String(apiData.price) : '0',
               discount: apiData.discount ? String(apiData.discount) : '0', 
               isPublished: apiData.status === 1 || apiData.is_active === true,
               category_id: apiData.category_id || 1,
               category_name: apiData.category_name || 'Umum',
               author: apiData.author || '',
               rating: apiData.rating ? String(apiData.rating) : '0.0',
               students: apiData.students ? Number(apiData.students) : 0
             };
   
             setBasicData(freshData);
          }
        }
      } catch (error) {
        console.error("Gagal mengambil detail course:", error);
      } finally {
        setIsFetching(false);
      }
    };

    fetchCourseDetail();
  }, [courseSlug, getActiveToken, handleAuthError]);

  const handleBasicChange = (field: keyof BasicCourseData, value: string | boolean | number) => {
    setBasicData(prev => ({ ...prev, [field]: value }));
  };

  // ✨ FUNGSI UPLOAD THUMBNAIL (Konsumsi API Endpoint) ✨
  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Cek format file yang didukung
    if (!file.type.startsWith('image/')) {
        showToast('error', 'Format file tidak didukung. Harap pilih gambar (JPG/PNG).');
        if (e.target) e.target.value = '';
        return;
    }

    // 2. Cek ukuran file (Maksimal 2MB = 2 * 1024 * 1024 bytes)
    const MAX_SIZE_MB = 2;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        showToast('error', `Ukuran gambar terlalu besar! Maksimal ${MAX_SIZE_MB}MB.`);
        if (e.target) e.target.value = '';
        return;
    }

    setIsUploadingThumbnail(true);

    try {
      const token = getActiveToken();
      if (!BASE_URL) throw new Error("Base URL tidak diset");

      // Menyiapkan Payload Multipart/Form-Data
      const formData = new FormData();
      formData.append('thumbnail', file); // changed to 'thumbnail' as requested

      // Panggil API Endpoint untuk Upload
      const response = await fetch(`${BASE_URL}/add/course`, { 
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
         const errText = await response.text();
         console.error("Upload Error Response:", errText);
         throw new Error(`Upload gagal (Status ${response.status})`);
      }

      const resData = await response.json();
      
      const uploadedUrl = resData.data?.url || resData.url || resData.file_url || resData.thumbnail;

      if (uploadedUrl) {
         handleBasicChange('thumbnail', uploadedUrl);
         showToast('success', 'Gambar berhasil diunggah ke server!');
      } else {
         throw new Error('Respon server tidak memiliki tautan/URL gambar.');
      }
    } catch (error) {
      console.error("Thumbnail upload failed:", error);
      showToast('error', 'Gagal memproses gambar. Pastikan endpoint server tersedia.');
    } finally {
      setIsUploadingThumbnail(false);
      // Bersihkan nilai input agar file yang sama bisa dipilih lagi jika dihapus
      if (e.target) e.target.value = '';
    }
  };

  const handlePublishToServer = async () => {
    setIsSaving(true);
    try {
      if (!BASE_URL) throw new Error("API URL tidak diset");
      
      const token = getActiveToken();
      if (!token) {
        showToast('error', 'Token API tidak tersedia.');
        return;
      }
      
      const payload = {
        title: basicData.title,
        thumbnail: basicData.thumbnail,
        level: basicData.level,
        price: Number(basicData.price),
        discount: Number(basicData.discount),
        category_id: basicData.category_id,
        author: basicData.author,
        status: 1, 
        is_active: true
      };

      const response = await fetch(`${BASE_URL}/update/course/${courseSlug}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.status === 401 || response.status === 403) {
         showToast('error', 'Gagal update ke server (401). Pastikan token valid.');
         return; 
      }

      if (response.ok) {
        handleBasicChange('isPublished', true);
        showToast('success', 'Perubahan berhasil disimpan & dipublikasikan ke Server!');
      } else {
        throw new Error("Gagal update ke server");
      }
    } catch (error) {
      console.error(error);
      showToast('error', 'Gagal menyambung ke server API. Pastikan endpoint tersedia.');
    } finally {
      setIsSaving(false);
    }
  };

  const formatRibuan = (angka: string | number) => {
    if (!angka) return '';
    return new Intl.NumberFormat('id-ID').format(Number(angka));
  };

  const parsedPrice = parseInt(String(basicData.price).replace(/\D/g, '') || '0', 10);
  const parsedDiscount = parseInt(String(basicData.discount).replace(/\D/g, '') || '0', 10);
  const finalPrice = parsedPrice - (parsedPrice * parsedDiscount / 100);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'web' },
    { id: 'materials', label: 'Materials', icon: 'menu_book' },
    { id: 'videos', label: 'Videos', icon: 'videocam' },
    { id: 'assignments', label: 'Assignments', icon: 'task' },
    { id: 'reviews', label: 'Student Feedback', icon: 'reviews' },
  ] as const;

  // ✨ LOGIC SMART THUMBNAIL RENDERER ✨
  const isImageThumbnail = basicData.thumbnail.startsWith('http') || basicData.thumbnail.startsWith('data:image') || basicData.thumbnail.startsWith('/');
  const isCssThumbnail = basicData.thumbnail && !isImageThumbnail;

  return (
    <div className={`min-h-screen bg-[#f4f5f7] dark:bg-[#050505] ${inter.className} pb-32 selection:bg-[#00BCD4]/30`}>
      
      {/* --- HEADER --- */}
      <header className="h-18 bg-white/70 dark:bg-[#0a0a0a]/70 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-5">
          <Link 
            href="/" 
            className="group flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all text-slate-500 hover:text-slate-900 dark:hover:text-white" 
            title="Kembali ke Dashboard"
          >
            <span className="material-symbols-outlined text-[20px] transition-colors">arrow_back</span>
            <span className="hidden sm:inline text-sm font-bold">Beranda</span>
          </Link>
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800"></div>
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#00BCD4] uppercase tracking-widest mb-0.5">
              <span className="material-symbols-outlined text-[14px]">tune</span>
              <span>Workspace Editor</span>
            </div>
            <h1 className={`text-sm font-bold text-slate-900 dark:text-white ${googleSansAlt.className}`}>
              ID: {courseSlug}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
           {!basicData.isPublished && (
             <div className="hidden sm:flex px-3.5 py-1.5 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full text-[11px] font-bold border border-amber-200 dark:border-amber-500/20 items-center gap-2">
               <span className="size-2 rounded-full bg-amber-500 animate-pulse"></span> Draft Mode
             </div>
           )}
           <button 
             onClick={handlePublishToServer} 
             disabled={isSaving || isFetching || !basicData.title || isUploadingThumbnail}
             className={`flex items-center gap-2 px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-full text-sm font-bold shadow-lg shadow-slate-900/10 dark:shadow-white/10 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed ${googleSansAlt.className}`}
           >
             {isSaving ? (
               <><span className="material-symbols-outlined text-[18px] animate-spin">sync</span> Menyimpan...</>
             ) : (
               <><span className="material-symbols-outlined text-[18px]">publish</span> Publish Kelas</>
             )}
           </button>
        </div>
      </header>

      <main className="max-w-260 mx-auto px-6 py-10">
        
        {/* --- HERO BASIC DATA CARD --- */}
        <div className="bg-white dark:bg-[#111111] p-8 rounded-4xl border border-slate-200/80 dark:border-slate-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] flex flex-col lg:flex-row gap-10 mb-10">
           
           {/* THUMBNAIL EDITOR */}
           <div className="w-full lg:w-85 shrink-0">
             <div className="flex items-center justify-between mb-3">
               <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Thumbnail Image (Maks 2MB)</label>
             </div>

             {/* Input Tipe File Tersembunyi */}
             <input 
               type="file" 
               accept="image/png, image/jpeg, image/jpg, image/webp" 
               className="hidden" 
               ref={thumbnailInputRef} 
               onChange={handleThumbnailUpload} 
             />

             <div 
               className={`group relative w-full aspect-4/3 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm bg-slate-100 dark:bg-slate-900 cursor-pointer ${(isFetching || isUploadingThumbnail) ? 'animate-pulse pointer-events-none' : ''}`}
               onClick={() => thumbnailInputRef.current?.click()}
             >
               {/* Jika Sedang Upload Gambar */}
               {isUploadingThumbnail && (
                 <div className="absolute z-20 inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-[#00BCD4]">
                    <span className="material-symbols-outlined text-4xl animate-spin mb-2">sync</span>
                    <span className="text-xs font-bold uppercase tracking-wider">Memproses...</span>
                 </div>
               )}

               {/* ✨ Render Smart Thumbnail ✨ */}
               {basicData.thumbnail ? (
                 <div 
                   className={`absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105 ${isCssThumbnail ? basicData.thumbnail : ''}`} 
                   style={isImageThumbnail ? { backgroundImage: `url(${basicData.thumbnail})` } : {}} 
                 />
               ) : (
                 <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 dark:text-slate-700">
                    <span className="material-symbols-outlined text-5xl mb-2">add_photo_alternate</span>
                    <span className="text-xs font-medium">Klik untuk Upload Gambar</span>
                 </div>
               )}

               <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-300 flex flex-col items-center justify-center">
                   <div className="translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center gap-3">
                      <div className="size-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30 shadow-xl">
                        <span className="material-symbols-outlined text-[24px]">cloud_upload</span>
                      </div>
                      <p className="font-bold text-xs text-white drop-shadow-md">Ganti Thumbnail Lokal</p>
                   </div>
               </div>
             </div>
           </div>
           
           <div className="flex-1 flex flex-col">
              {/* TITLE EDITOR */}
              <div className="mb-4 relative group">
                <label className="text-[11px] font-bold text-[#00BCD4] uppercase tracking-wider flex items-center gap-2 mb-2 opacity-80">
                  Judul Utama Kelas
                  {isFetching && <span className="material-symbols-outlined text-[14px] animate-spin">sync</span>}
                </label>
                <textarea 
                  value={basicData.title} 
                  onChange={(e) => handleBasicChange('title', e.target.value)} 
                  rows={2}
                  disabled={isFetching}
                  className={`w-full bg-transparent border-0 p-0 text-3xl sm:text-4xl lg:text-[40px] font-extrabold text-slate-900 dark:text-white focus:ring-0 resize-none outline-none leading-[1.1] transition-all placeholder:text-slate-300 dark:placeholder:text-slate-700 disabled:opacity-50 ${googleSansAlt.className}`} 
                  placeholder={isFetching ? "Sedang mengambil data..." : "Ketik judul kelas di sini..."} 
                />
                <div className="absolute -inset-x-4 -inset-y-2 rounded-2xl border-2 border-transparent group-focus-within:border-slate-100 dark:group-focus-within:border-slate-800/50 -z-10 transition-colors pointer-events-none"></div>
              </div>

              {/* COURSE METADATA BADGES (Dari API) */}
              <div className={`flex flex-wrap items-center gap-2 mb-8 ${isFetching ? 'opacity-50' : ''}`}>
                <div className="bg-[#00BCD4]/10 text-[#00BCD4] text-[10px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-lg border border-[#00BCD4]/20 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">category</span>
                  {basicData.category_name}
                </div>
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-bold bg-slate-100 dark:bg-[#161616] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="material-symbols-outlined text-[14px]">person</span> {basicData.author || 'Instruktur'}
                </div>
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-bold bg-slate-100 dark:bg-[#161616] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="material-symbols-outlined text-[14px] text-amber-500" style={{fontVariationSettings: "'FILL' 1"}}>star</span> {basicData.rating}
                </div>
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-bold bg-slate-100 dark:bg-[#161616] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="material-symbols-outlined text-[14px]">group</span> {basicData.students} Siswa
                </div>
              </div>
              
              <div className="mt-auto grid grid-cols-1 sm:grid-cols-3 gap-4">
                 {/* Level */}
                 <div className={`flex flex-col gap-1.5 p-4 rounded-2xl bg-[#fafafa] dark:bg-[#161616] border border-slate-200/60 dark:border-slate-800/60 focus-within:border-[#00BCD4]/50 focus-within:ring-2 focus-within:ring-[#00BCD4]/10 transition-all ${isFetching ? 'opacity-50 animate-pulse' : ''}`}>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px]">stairs</span> Tingkat
                    </label>
                    <select 
                      value={basicData.level} 
                      onChange={(e) => handleBasicChange('level', e.target.value)} 
                      disabled={isFetching}
                      className="w-full bg-transparent border-0 p-0 text-sm font-bold text-slate-900 dark:text-white outline-none cursor-pointer focus:ring-0 disabled:cursor-not-allowed"
                    >
                      <option value="Beginner">🟢 Beginner</option>
                      <option value="Intermediate">🟡 Intermediate</option>
                      <option value="Advanced">🔴 Advanced</option>
                    </select>
                 </div>
                 
                 {/* Price */}
                 <div className={`flex flex-col gap-1.5 p-4 rounded-2xl bg-[#fafafa] dark:bg-[#161616] border border-slate-200/60 dark:border-slate-800/60 focus-within:border-[#00BCD4]/50 focus-within:ring-2 focus-within:ring-[#00BCD4]/10 transition-all ${parsedDiscount > 0 ? 'row-span-2 sm:row-span-1' : ''} ${isFetching ? 'opacity-50 animate-pulse' : ''}`}>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px]">payments</span> Harga Dasar (Rp)
                    </label>
                    <input 
                      type="text" 
                      inputMode="numeric"
                      value={formatRibuan(basicData.price)} 
                      onChange={(e) => handleBasicChange('price', e.target.value.replace(/\D/g, ''))} 
                      disabled={isFetching}
                      className={`w-full bg-transparent border-0 p-0 text-sm font-bold outline-none focus:ring-0 placeholder:text-slate-300 transition-all disabled:cursor-not-allowed ${parsedDiscount > 0 ? 'text-slate-400 dark:text-slate-500 line-through decoration-slate-400/50' : 'text-slate-900 dark:text-white'}`} 
                      placeholder="Contoh: 150000" 
                    />
                    
                    {parsedDiscount > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 animate-in fade-in slide-in-from-top-1">
                        <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest block mb-0.5">Harga Akhir</span>
                        <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                          Rp {formatRibuan(finalPrice)}
                        </span>
                      </div>
                    )}
                 </div>

                 {/* Discount */}
                 <div className={`flex flex-col gap-1.5 p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/20 focus-within:border-rose-300 dark:focus-within:border-rose-500/50 focus-within:ring-2 focus-within:ring-rose-500/10 transition-all ${isFetching ? 'opacity-50 animate-pulse' : ''}`}>
                    <label className="text-[10px] font-bold text-rose-500 dark:text-rose-400 uppercase tracking-widest flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px]">loyalty</span> Diskon
                    </label>
                    <div className="relative flex items-center">
                      <input 
                        type="text" 
                        inputMode="numeric"
                        maxLength={3}
                        value={basicData.discount} 
                        onChange={(e) => {
                          let val = e.target.value.replace(/\D/g, '');
                          if (Number(val) > 100) val = '100';
                          handleBasicChange('discount', val);
                        }} 
                        disabled={isFetching}
                        className="w-full bg-transparent border-0 p-0 text-sm font-bold text-rose-600 dark:text-rose-400 outline-none focus:ring-0 placeholder:text-rose-300 disabled:cursor-not-allowed" 
                        placeholder="0" 
                      />
                      <span className="text-sm font-bold text-rose-500/50 pointer-events-none">%</span>
                    </div>
                 </div>

              </div>
           </div>
        </div>

        {/* --- PILL NAVIGATION TABS --- */}
        <div className="sticky top-22 z-40 mb-8 flex justify-center sm:justify-start">
          <div className="flex items-center gap-1 p-1.5 bg-[#1a1a2e]/85 dark:bg-[#0a0a14]/85 backdrop-blur-2xl rounded-2xl border border-white/15 dark:border-white/10 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.4),0_0_30px_rgba(255,255,255,0.15)] dark:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.8),0_0_30px_rgba(255,255,255,0.05)] overflow-x-auto no-scrollbar w-full sm:w-max transition-all duration-300">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap overflow-hidden ${
                    isActive 
                    ? 'text-white shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-white/5 dark:hover:bg-white/5'
                  }`}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-white/10 dark:bg-white/10 rounded-xl border border-white/20 -z-10"></div>
                  )}
                  <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* --- TAB CONTENTS --- */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'materials' && <MaterialsTab courseSlug={courseSlug} />}
          {activeTab === 'videos' && <VideosTab />}
          {activeTab === 'assignments' && <AssignmentsTab />}
          {activeTab === 'reviews' && <ReviewsTab />}
        </div>
      </main>
    </div>
  );
}

export default function CourseEditorPage() {
    return (
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center min-h-screen bg-[#f4f5f7] dark:bg-[#050505] text-slate-500 gap-4">
            <span className="material-symbols-outlined text-[32px] animate-spin">progress_activity</span>
            <p className="text-sm font-medium">Memuat Workspace...</p>
          </div>
        }>
            <CourseEditorContent />
        </Suspense>
    )
}