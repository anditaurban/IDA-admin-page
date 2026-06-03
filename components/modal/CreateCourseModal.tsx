'use client';

import React, { useEffect, useState } from 'react';
import { DM_Sans } from 'next/font/google';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/ToastProvider';

const googleSansAlt = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '700', '800'] });

const RAW_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
const BASE_URL = RAW_BASE_URL.endsWith('/') ? RAW_BASE_URL.slice(0, -1) : RAW_BASE_URL;

interface CreateCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (courseId: string) => void;
  ownerId: string | number;
  authorName: string;
  userId?: string | number;
}

interface UserProfile {
  id?: string | number;
  user_id?: string | number;
  owner_id?: string | number;
  customer_id?: string | number;
  name?: string;
  email?: string;
  [key: string]: unknown;
}

interface CourseCategory {
  category_id: number | string;
  owner_id: number | string;
  category_name: string;
}

interface CourseLevel {
  level_id: number | string;
  level_name: string;
}

function getStoredUserProfile(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const savedProfile = localStorage.getItem('user_profile');
    return savedProfile ? (JSON.parse(savedProfile) as UserProfile) : null;
  } catch (error) {
    console.error('Gagal membaca user_profile:', error);
    return null;
  }
}

function getResolvedUserId(userId?: string | number) {
  if (userId) return String(userId);
  const profile = getStoredUserProfile();
  const resolvedId = profile?.user_id ?? profile?.id ?? profile?.customer_id;
  return resolvedId ? String(resolvedId) : '';
}

function getResolvedAuthorName(authorName: string) {
  if (authorName && authorName.trim() && authorName !== 'Instruktur') return authorName.trim();
  const profile = getStoredUserProfile();
  if (profile?.name) return String(profile.name);
  if (profile?.email) return String(profile.email).split('@')[0];
  return 'Instruktur';
}

function buildAuthHeaders(token?: string): HeadersInit {
  const headers: HeadersInit = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function dedupeCategories(categories: CourseCategory[]) {
  const categoryMap = new Map<string, CourseCategory>();
  categories.forEach((category) => {
    const id = String(category.category_id || '').trim();
    const originalName = String(category.category_name || '').trim();
    const nameKey = originalName.toLowerCase(); 

    if (!id || !nameKey) return;
    
    if (!categoryMap.has(nameKey)) {
      categoryMap.set(nameKey, { 
        ...category, 
        category_id: id, 
        category_name: originalName
      });
    }
  });
  return Array.from(categoryMap.values());
}

export default function CreateCourseModal({
  isOpen,
  onClose,
  onSuccess,
  ownerId,
  authorName,
  userId,
}: CreateCourseModalProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [levelId, setLevelId] = useState('');

  // ✨ STATE: Harga & Diskon Profesional
  const [price, setPrice] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [discountNominal, setDiscountNominal] = useState('');
  const [discountMode, setDiscountMode] = useState<'percent' | 'nominal'>('percent');

  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [isCategoryLoading, setIsCategoryLoading] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  const [levels, setLevels] = useState<CourseLevel[]>([]);
  const [isLevelLoading, setIsLevelLoading] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUnauthorized = () => {
    Cookies.remove('auth_session', { path: '/' });
    Cookies.remove('api_token', { path: '/' });
    Cookies.remove('token', { path: '/' });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user_profile');
      localStorage.removeItem('instructor_owner_id');
    }
    showToast('error', 'Sesi login Anda telah berakhir. Silakan masuk kembali.');
    router.replace('/login');
  };

  // Reset form saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setPrice('');
      setDiscountPercent('');
      setDiscountNominal('');
      setDiscountMode('percent');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const fetchDropdownData = async () => {
      const cleanOwnerId = String(ownerId || '').trim();
      if (!BASE_URL || !cleanOwnerId) {
        setCategoryError('Konfigurasi API atau Owner ID tidak valid.');
        return;
      }

      try {
        setIsCategoryLoading(true);
        setIsLevelLoading(true);
        setCategoryError(null);

        const token = Cookies.get('api_token') || process.env.NEXT_PUBLIC_API_TOKEN || '';
        const headers = buildAuthHeaders(token);

        const catResponse = await fetch(`${BASE_URL}/list/course_category/${cleanOwnerId}`, {
          method: 'GET',
          headers,
        });

        if (catResponse.status === 401 || catResponse.status === 403) {
          handleUnauthorized();
          return;
        }

        if (catResponse.ok) {
          const catResult = await catResponse.json();
          const cleanCategories = dedupeCategories(catResult?.listData ?? []);
          setCategories(cleanCategories);
          if (cleanCategories.length > 0) {
            setCategoryId((prev) => {
              const isPrevStillAvailable = cleanCategories.some((c) => String(c.category_id) === String(prev));
              return isPrevStillAvailable ? prev : String(cleanCategories[0].category_id);
            });
          } else {
            setCategoryId('');
          }
        }

        const lvlResponse = await fetch(`${BASE_URL}/list/course_level/${cleanOwnerId}`, {
          method: 'GET',
          headers,
        });

        if (lvlResponse.ok) {
          const lvlResult = await lvlResponse.json();
          const fetchedLevels = lvlResult.data || [];
          setLevels(fetchedLevels);
          
          if (fetchedLevels.length > 0) {
            setLevelId((prev) => {
              const isPrevStillAvailable = fetchedLevels.some((l: CourseLevel) => String(l.level_id) === prev);
              return isPrevStillAvailable ? prev : String(fetchedLevels[0].level_id);
            });
          } else {
            setLevelId('');
          }
        }

      } catch (error) {
        console.error('Fetch dropdown data failed:', error);
        setCategoryError(error instanceof Error ? error.message : 'Gagal mengambil data kategori dan level.');
      } finally {
        setIsCategoryLoading(false);
        setIsLevelLoading(false);
      }
    };

    fetchDropdownData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, ownerId]);

  if (!isOpen) return null;

  const closeModal = () => {
    if (isSubmitting) return;
    onClose();
  };

  // ✨ FIX: Logika Kalkulasi Harga & Diskon Real-Time
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    const p = Number(rawVal) || 0;
    
    setPrice(rawVal);

    // Pertahankan persen, hitung ulang nominal
    const safePercentStr = String(discountPercent || '').replace(',', '.');
    const calcPercent = parseFloat(safePercentStr) || 0;
    const calcNominal = Math.round(p * (calcPercent / 100));

    setDiscountNominal(calcNominal > 0 ? String(calcNominal) : '');
  };

  const handleDiscountPercentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/,/g, '.').replace(/[^0-9.]/g, '');
    const parts = val.split('.');
    if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('');
    if (Number(val) > 100) val = '100';

    const localFormat = val.replace('.', ',');
    setDiscountPercent(localFormat);

    const p = Number(price) || 0;
    const calcPercent = parseFloat(val) || 0;
    const calcNominal = Math.round(p * (calcPercent / 100));
    setDiscountNominal(calcNominal > 0 ? String(calcNominal) : '');
  };

  const handleDiscountNominalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    setDiscountNominal(val);

    const p = Number(price) || 0;
    const calcNominal = Number(val) || 0;
    
    // Cegah error dibagi 0
    const calcPercent = p > 0 ? Number(((calcNominal / p) * 100).toFixed(2)) : 0;
    setDiscountPercent(calcPercent > 0 ? String(calcPercent).replace('.', ',') : '');
  };

  // Kalkulasi Total Harga Akhir
  const numericPrice = Number(price || 0);
  const numericDiscountNominal = Number(discountNominal || 0);
  const numericDiscountPercent = parseFloat(String(discountPercent || '0').replace(',', '.')) || 0;
  
  // Total harga tidak boleh minus
  const finalTotalPrice = Math.max(0, numericPrice - numericDiscountNominal);

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(angka);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanTitle = title.trim();
    const cleanCategoryId = categoryId.trim();
    const cleanLevelId = levelId.trim();
    const cleanOwnerId = String(ownerId || '').trim();
    const cleanUserId = getResolvedUserId(userId);
    const cleanAuthorName = getResolvedAuthorName(authorName);

    if (!BASE_URL) return showToast('error', 'Base URL API belum diset.');
    if (!cleanOwnerId) return showToast('error', 'Owner ID tidak ditemukan.');
    if (!cleanUserId) return showToast('error', 'User ID (Instruktur) tidak ditemukan. Silakan login ulang.');
    if (!cleanCategoryId) return showToast('error', 'Kategori kelas wajib dipilih.');
    if (!cleanTitle) return showToast('error', 'Judul kelas wajib diisi.');
    if (!cleanLevelId) return showToast('error', 'Level kelas wajib dipilih.');

    setIsSubmitting(true);

    try {
      const token = Cookies.get('api_token') || process.env.NEXT_PUBLIC_API_TOKEN || '';

      const formData = new FormData();
      formData.append('owner_id', cleanOwnerId);
      formData.append('user_id', cleanUserId); 
      formData.append('category_id', cleanCategoryId);
      formData.append('level_id', cleanLevelId);
      formData.append('title', cleanTitle);
      formData.append('author', cleanAuthorName);
      
      // ✨ FIX: Payload Harga, Diskon, dan Harga Akhir
      formData.append('price', String(numericPrice));
      formData.append('discount_nominal', String(numericDiscountNominal));
      formData.append('discount_percent', String(numericDiscountPercent));
      formData.append('total_price', String(finalTotalPrice));

      const response = await fetch(`${BASE_URL}/add/course`, {
        method: 'POST',
        headers: buildAuthHeaders(token),
        body: formData,
      });

      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        return;
      }

      const contentType = response.headers.get('content-type');
      const result = contentType?.includes('application/json') ? await response.json() : await response.text();

      if (!response.ok) {
        throw new Error(result?.message || `Gagal membuat kelas (Status ${response.status})`);
      }

      const responseData = typeof result === 'object' && result !== null && 'data' in result ? result.data : result;
      const isFailed = responseData?.success === false || result?.success === false;

      if (isFailed) {
        throw new Error(responseData?.message || 'Ditolak oleh server.');
      }

      const newCourseId = responseData?.id || responseData?.course_id || result?.insertId;

      if (!newCourseId) {
        throw new Error('Kelas berhasil dibuat, tetapi ID kelas tidak dikembalikan.');
      }

      showToast('success', 'Kelas baru berhasil dibuat.');
      onSuccess(String(newCourseId));
      
    } catch (error: unknown) {
      console.error('Create course failed:', error);
      showToast('error', error instanceof Error ? error.message : 'Gagal menyambung ke server API.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={closeModal} />

      <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl relative z-10 animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="h-2 w-full bg-[#00BCD4] shrink-0" />

        <div className="p-6 md:p-8 overflow-y-auto no-scrollbar">
          <div className="flex items-center justify-between mb-6">
            <h3 className={`text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 ${googleSansAlt.className}`}>
              <span className="material-symbols-outlined text-[#00BCD4]">bolt</span> Quick Create Kelas
            </h3>
            <button
              type="button"
              onClick={closeModal}
              disabled={isSubmitting}
              className="text-slate-400 hover:text-red-500 transition-colors p-1 bg-slate-100 dark:bg-slate-800 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined block text-[18px]">close</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* === DROPDOWN KATEGORI === */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Kategori</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  disabled={isSubmitting || isCategoryLoading || categories.length === 0}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#00BCD4]/50 disabled:opacity-70"
                >
                  {isCategoryLoading ? (
                    <option value="">Memuat...</option>
                  ) : categories.length > 0 ? (
                    categories.map((category) => (
                      <option key={category.category_id} value={String(category.category_id)}>
                        {category.category_name}
                      </option>
                    ))
                  ) : (
                    <option value="">Belum tersedia</option>
                  )}
                </select>
                {categoryError && <p className="mt-2 text-xs font-medium text-red-500">{categoryError}</p>}
              </div>

              {/* === DROPDOWN LEVEL === */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Level</label>
                <select
                  value={levelId}
                  onChange={(e) => setLevelId(e.target.value)}
                  disabled={isSubmitting || isLevelLoading || levels.length === 0}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#00BCD4]/50 disabled:opacity-70"
                >
                  {isLevelLoading ? (
                    <option value="">Memuat...</option>
                  ) : levels.length > 0 ? (
                    levels.map((lvl) => (
                      <option key={lvl.level_id} value={String(lvl.level_id)}>
                        {lvl.level_name}
                      </option>
                    ))
                  ) : (
                    <option value="">Belum tersedia</option>
                  )}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Judul Kelas</label>
              <input
                type="text"
                required
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
                placeholder="Misal: Front End Stack Masterclass"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-[#00BCD4]/50 outline-none transition-all disabled:opacity-70"
              />
            </div>

            {/* ✨ AREA HARGA & DISKON */}
            <div className="bg-slate-50 dark:bg-[#161616] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* 1. Harga Dasar */}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                    Harga Dasar (Rp)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={price ? new Intl.NumberFormat('id-ID').format(Number(price)) : ''}
                    onChange={handlePriceChange}
                    disabled={isSubmitting}
                    placeholder="Contoh: 150000"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-[#00BCD4]/50 outline-none transition-all disabled:opacity-70"
                  />
                </div>

                {/* 2. Diskon & Toggle */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-rose-500 dark:text-rose-400 uppercase tracking-wider">
                      Diskon (Opsional)
                    </label>
                    <div className="flex rounded-md bg-slate-200 dark:bg-slate-800 p-0.5 border border-slate-300 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => setDiscountMode("percent")}
                        className={`rounded px-2 py-0.5 text-[10px] font-bold transition-all ${discountMode === "percent" ? "bg-rose-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
                      >
                        %
                      </button>
                      <button
                        type="button"
                        onClick={() => setDiscountMode("nominal")}
                        className={`rounded px-2 py-0.5 text-[10px] font-bold transition-all ${discountMode === "nominal" ? "bg-rose-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
                      >
                        Rp
                      </button>
                    </div>
                  </div>
                  
                  <div className="relative flex items-center">
                    {discountMode === "nominal" && (
                      <span className="absolute left-4 text-sm font-bold text-slate-400">Rp</span>
                    )}
                    <input
                      type="text"
                      inputMode={discountMode === "percent" ? "decimal" : "numeric"}
                      disabled={isSubmitting || numericPrice === 0}
                      value={discountMode === "percent" ? discountPercent : (discountNominal ? new Intl.NumberFormat('id-ID').format(Number(discountNominal)) : '')}
                      onChange={discountMode === "percent" ? handleDiscountPercentChange : handleDiscountNominalChange}
                      placeholder={numericPrice === 0 ? "Isi harga dulu" : "0"}
                      className={`w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 text-sm font-bold text-rose-600 dark:text-rose-400 focus:ring-2 focus:ring-rose-500/50 outline-none transition-all disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-800 ${discountMode === "nominal" ? "pl-10 pr-4" : "pl-4 pr-10 text-right"}`}
                    />
                    {discountMode === "percent" && (
                      <span className="absolute right-4 text-sm font-bold text-slate-400">%</span>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. Harga Final Banner */}
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700/50 flex flex-col sm:flex-row items-center justify-between gap-2">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Harga Akhir Kelas:
                </span>
                <span className={`text-2xl font-black ${finalTotalPrice === 0 ? 'text-emerald-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {finalTotalPrice === 0 ? "GRATIS" : formatRupiah(finalTotalPrice)}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isCategoryLoading || isLevelLoading || categories.length === 0 || levels.length === 0}
              className={`w-full py-3.5 mt-2 bg-[#00BCD4] hover:bg-cyan-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-cyan-500/20 active:scale-95 transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed ${googleSansAlt.className}`}
            >
              {isSubmitting ? (
                <><span className="material-symbols-outlined animate-spin text-[18px]">sync</span> Memproses...</>
              ) : (
                <>Buat Kelas Sekarang <span className="material-symbols-outlined text-[18px]">arrow_forward</span></>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}