'use client';

import React, { useEffect, useRef, useState } from 'react';
import { DM_Sans } from 'next/font/google';
import Image from 'next/image';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/ToastProvider';

const googleSansAlt = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '700', '800'] });

const RAW_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
const BASE_URL = RAW_BASE_URL.endsWith('/') ? RAW_BASE_URL.slice(0, -1) : RAW_BASE_URL;

const COURSE_LEVELS = ['Beginner', 'Intermediate', 'Advanced'] as const;
type CourseLevel = (typeof COURSE_LEVELS)[number];

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

// ✨ FIX 1: Hapus fallback owner_id agar user_id murni milik Instruktur
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

function resetFileInput(inputRef: React.RefObject<HTMLInputElement | null>) {
  if (inputRef.current) inputRef.current.value = '';
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
    const name = String(category.category_name || '').trim();
    if (!id || !name) return;
    if (!categoryMap.has(id)) {
      categoryMap.set(id, { ...category, category_id: id, category_name: name });
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
  const [level, setLevel] = useState<CourseLevel>('Beginner');
  const [price, setPrice] = useState('');

  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [isCategoryLoading, setIsCategoryLoading] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // ✨ FIX 3: Reset form data setiap kali modal dibuka (mencegah Ghost Data)
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setLevel('Beginner');
      setPrice('');
      setThumbnailFile(null);
      setThumbnailPreview('');
      resetFileInput(fileInputRef);
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    };
  }, [thumbnailPreview]);

  useEffect(() => {
    if (!isOpen) return;

    const fetchCategories = async () => {
      const cleanOwnerId = String(ownerId || '').trim();
      if (!BASE_URL || !cleanOwnerId) {
        setCategoryError('Konfigurasi API atau Owner ID tidak valid.');
        return;
      }

      try {
        setIsCategoryLoading(true);
        setCategoryError(null);

        const token = Cookies.get('api_token') || process.env.NEXT_PUBLIC_API_TOKEN || '';
        
        // ✨ FIX 2: Tambahkan limit=100 agar semua kategori instruktur terbawa
        const response = await fetch(`${BASE_URL}/table/course_category/${cleanOwnerId}/1?limit=100`, {
          method: 'GET',
          headers: buildAuthHeaders(token),
        });

        if (response.status === 401 || response.status === 403) {
          handleUnauthorized();
          return;
        }

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result?.message || `Gagal mengambil kategori (Status ${response.status})`);
        }

        const cleanCategories = dedupeCategories(result?.tableData ?? []);
        setCategories(cleanCategories);

        if (cleanCategories.length > 0) {
          setCategoryId((prev) => {
            const isPrevStillAvailable = cleanCategories.some((c) => String(c.category_id) === String(prev));
            return isPrevStillAvailable ? prev : String(cleanCategories[0].category_id);
          });
        } else {
          setCategoryId('');
        }
      } catch (error) {
        console.error('Fetch course categories failed:', error);
        setCategoryError(error instanceof Error ? error.message : 'Gagal mengambil kategori kelas.');
      } finally {
        setIsCategoryLoading(false);
      }
    };

    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, ownerId]);

  if (!isOpen) return null;

  const closeModal = () => {
    if (isSubmitting) return;
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      showToast('error', 'Format file tidak didukung. Harap pilih gambar JPG, PNG, atau WEBP.');
      resetFileInput(fileInputRef);
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showToast('error', 'Ukuran gambar terlalu besar. Maksimal 2MB.');
      resetFileInput(fileInputRef);
      return;
    }

    if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    setPrice(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanTitle = title.trim();
    const cleanCategoryId = categoryId.trim();
    const cleanOwnerId = String(ownerId || '').trim();
    const cleanUserId = getResolvedUserId(userId);
    const cleanAuthorName = getResolvedAuthorName(authorName);
    const numericPrice = Number(price || 0);

    if (!BASE_URL) return showToast('error', 'Base URL API belum diset.');
    if (!cleanOwnerId) return showToast('error', 'Owner ID tidak ditemukan.');
    if (!cleanUserId) return showToast('error', 'User ID (Instruktur) tidak ditemukan. Silakan login ulang.');
    if (!cleanCategoryId) return showToast('error', 'Kategori kelas wajib dipilih.');
    if (!cleanTitle) return showToast('error', 'Judul kelas wajib diisi.');
    if (!COURSE_LEVELS.includes(level)) return showToast('error', 'Level kelas tidak valid.');
    if (!thumbnailFile) return showToast('error', 'Harap unggah thumbnail kelas.');

    setIsSubmitting(true);

    try {
      const token = Cookies.get('api_token') || process.env.NEXT_PUBLIC_API_TOKEN || '';

      const formData = new FormData();
      formData.append('owner_id', cleanOwnerId);
      formData.append('user_id', cleanUserId); // ✨ SUDAH AMAN & PASTI ID INSTRUKTUR
      formData.append('category_id', cleanCategoryId);
      formData.append('title', cleanTitle);
      formData.append('level', level);
      formData.append('price', String(numericPrice));
      formData.append('total_price', String(numericPrice));
      formData.append('author', cleanAuthorName);
      formData.append('thumbnail', thumbnailFile);

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
        throw new Error('Kelas berhasil dibuat, tetapi ID kelas tidak dikembalikan oleh server.');
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

      <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-slate-800 w-full max-w-xl rounded-3xl shadow-2xl relative z-10 animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="h-2 w-full bg-[#00BCD4] shrink-0" />

        <div className="p-6 md:p-8 overflow-y-auto no-scrollbar">
          <div className="flex items-center justify-between mb-6">
            <h3 className={`text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 ${googleSansAlt.className}`}>
              <span className="material-symbols-outlined text-[#00BCD4]">add_circle</span> Buat Kelas Baru
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
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Kategori</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  disabled={isSubmitting || isCategoryLoading || categories.length === 0}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#00BCD4]/50 disabled:opacity-70"
                >
                  {isCategoryLoading ? (
                    <option value="">Memuat kategori...</option>
                  ) : categories.length > 0 ? (
                    categories.map((category) => (
                      <option key={category.category_id} value={String(category.category_id)}>
                        {category.category_name}
                      </option>
                    ))
                  ) : (
                    <option value="">Kategori belum tersedia</option>
                  )}
                </select>

                {categoryError && (
                  <p className="mt-2 text-xs font-medium text-red-500">{categoryError}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Level</label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value as CourseLevel)}
                  disabled={isSubmitting}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#00BCD4]/50 disabled:opacity-70"
                >
                  <option value="Beginner">🟢 Beginner</option>
                  <option value="Intermediate">🟡 Intermediate</option>
                  <option value="Advanced">🔴 Advanced</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Nama / Topik Kelas</label>
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

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Harga Dasar (Rp)</label>
              <input
                type="text"
                inputMode="numeric"
                value={price ? new Intl.NumberFormat('id-ID').format(Number(price)) : ''}
                onChange={handlePriceChange}
                disabled={isSubmitting}
                placeholder="Contoh: 150000 (Kosongkan jika gratis)"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-[#00BCD4]/50 outline-none transition-all disabled:opacity-70"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Thumbnail Kelas (JPG/PNG/WEBP, Maks 2MB)</label>
              <input
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
                disabled={isSubmitting}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
                className="w-full aspect-video bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative overflow-hidden group shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {thumbnailPreview ? (
                  <>
                    <Image src={thumbnailPreview} alt="Preview Thumbnail" fill className="object-cover" unoptimized />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-xs font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">image</span> Ganti Gambar
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 mb-2 group-hover:text-[#00BCD4] transition-colors">add_photo_alternate</span>
                    <span className="text-xs font-medium text-slate-500">Klik untuk upload gambar</span>
                  </>
                )}
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isCategoryLoading || categories.length === 0}
              className={`w-full py-3.5 mt-4 bg-[#00BCD4] hover:bg-cyan-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-cyan-500/20 active:scale-95 transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed ${googleSansAlt.className}`}
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[18px]">sync</span> Memproses Data...
                </>
              ) : (
                <>
                  Buat Kelas <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}