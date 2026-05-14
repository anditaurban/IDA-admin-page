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
  const resolvedId = profile?.user_id ?? profile?.id ?? profile?.customer_id ?? profile?.owner_id;

  return resolvedId ? String(resolvedId) : '';
}

function getResolvedAuthorName(authorName: string) {
  if (authorName && authorName.trim() && authorName !== 'Instruktur') return authorName.trim();

  const profile = getStoredUserProfile();
  if (profile?.name) return String(profile.name);
  if (profile?.email) return String(profile.email).split('@')[0];

  return authorName || 'Instruktur';
}

function resetFileInput(inputRef: React.RefObject<HTMLInputElement | null>) {
  if (inputRef.current) inputRef.current.value = '';
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

  // State Form
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('1');
  const [level, setLevel] = useState<CourseLevel>('Beginner');
  const [price, setPrice] = useState('');

  // State File & Status
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    };
  }, [thumbnailPreview]);

  if (!isOpen) return null;

  const closeModal = () => {
    if (isSubmitting) return;
    onClose();
  };

  const clearForm = () => {
    setTitle('');
    setCategoryId('1');
    setLevel('Beginner');
    setPrice('');
    setThumbnailFile(null);
    setThumbnailPreview('');
    resetFileInput(fileInputRef);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanTitle = title.trim();
    const cleanCategoryId = categoryId.trim();
    const cleanOwnerId = String(ownerId || '').trim();
    const cleanUserId = getResolvedUserId(userId);
    const cleanAuthorName = getResolvedAuthorName(authorName);
    const numericPrice = Number(price || 0);

    if (!BASE_URL) return showToast('error', 'Base URL API belum diset. Cek NEXT_PUBLIC_API_BASE_URL.');
    if (!cleanOwnerId) return showToast('error', 'Owner ID tidak ditemukan. Silakan login ulang.');
    if (!cleanUserId) return showToast('error', 'User ID tidak ditemukan. Silakan login ulang.');
    if (!cleanCategoryId) return showToast('error', 'Kategori kelas wajib dipilih.');
    if (!cleanTitle) return showToast('error', 'Judul kelas wajib diisi.');
    if (!COURSE_LEVELS.includes(level)) return showToast('error', 'Level kelas tidak valid.');
    if (Number.isNaN(numericPrice) || numericPrice < 0) return showToast('error', 'Harga kelas tidak valid.');
    if (!thumbnailFile) return showToast('error', 'Harap unggah thumbnail kelas.');

    setIsSubmitting(true);

    try {
      const token = Cookies.get('api_token') || process.env.NEXT_PUBLIC_API_TOKEN || '';

      const formData = new FormData();
      formData.append('owner_id', cleanOwnerId);
      formData.append('user_id', cleanUserId);
      formData.append('category_id', cleanCategoryId);
      formData.append('title', cleanTitle);
      formData.append('level', level);
      formData.append('price', String(numericPrice));
      formData.append('author', cleanAuthorName);
      formData.append('thumbnail', thumbnailFile);

      const headers: HeadersInit = {
        Accept: 'application/json',
      };

      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(`${BASE_URL}/add/course`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        return;
      }

      const contentType = response.headers.get('content-type');
      const result = contentType?.includes('application/json') ? await response.json() : await response.text();

      if (!response.ok) {
        console.error('Create Course Error:', result);
        const errorMessage = typeof result === 'object' && result !== null && 'message' in result
          ? String(result.message)
          : `Gagal membuat kelas (Status ${response.status})`;
        throw new Error(errorMessage);
      }

      if (typeof result === 'object' && result !== null) {
        const responseData = 'data' in result ? result.data as { success?: boolean; id?: string | number; course_id?: string | number; message?: string } : null;
        const isFailed = responseData?.success === false || ('success' in result && result.success === false);

        if (isFailed) {
          throw new Error(responseData?.message || 'Ditolak oleh server.');
        }

        const newCourseId = responseData?.id || responseData?.course_id || ('insertId' in result ? result.insertId : null);

        if (!newCourseId) {
          throw new Error('Kelas berhasil dibuat, tetapi ID kelas tidak ditemukan dari response API.');
        }

        showToast('success', 'Kelas baru berhasil dibuat.');
        clearForm();
        onSuccess(String(newCourseId));
        return;
      }

      throw new Error('Response server tidak valid.');
    } catch (error: unknown) {
      console.error('Create course failed:', error);
      const errorMsg = error instanceof Error ? error.message : 'Gagal menyambung ke server API.';
      showToast('error', errorMsg);
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
            {/* Kategori & Level */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Kategori</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#00BCD4]/50 disabled:opacity-70"
                >
                  <option value="1">Web Development</option>
                </select>
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

            {/* Judul Kelas */}
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

            {/* Harga Dasar */}
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

            {/* Upload Thumbnail */}
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
              disabled={isSubmitting}
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
