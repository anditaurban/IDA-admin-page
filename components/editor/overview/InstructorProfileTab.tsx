'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import type { OverviewLandingData } from './overview.types';

type InstructorProfileTabProps = {
  courseId?: number | string | null;
  apiToken?: string;
  formData: OverviewLandingData;
  setFormData: React.Dispatch<React.SetStateAction<OverviewLandingData>>;
  fontClassName?: string;
};

export default function InstructorProfileTab({
  courseId,
  apiToken,
  formData,
  setFormData,
  fontClassName = '',
}: InstructorProfileTabProps) {
  // State manajemen proses API
  const [instructorId, setInstructorId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // State feedback UI
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string>("");

  const handleChange = (
    field: keyof Pick<OverviewLandingData, 'instructor' | 'role' | 'bio'>,
    value: string,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const showNotification = (msg: string, type: 'success' | 'error') => {
    if (type === 'success') {
       setSuccess(msg);
       setError(null);
    } else {
       setError(msg);
       setSuccess(null);
    }
    setTimeout(() => {
       setSuccess(null);
       setError(null);
    }, 4000);
  };

  // ==========================================
  // 1. GET LIST (Membaca Data Instruktur Terdaftar)
  // ==========================================
  const fetchInstructorData = useCallback(async () => {
    if (!courseId) return;

    setIsLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://dev.katib.cloud';
      const response = await fetch(`${baseUrl}/list/course_instructor/${courseId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${apiToken}`
        }
      });

      if (response.ok) {
        const json = await response.json();
        
        if (json.listData && json.listData.length > 0) {
          const data = json.listData[0];
          
          setInstructorId(Number(data.instructor_id));
          setFormData(prev => ({
            ...prev,
            instructor: data.nama || '',
            role: data.role || '',
            bio: data.biodata || ''
          }));
          
          if (data.photo) setPhotoUrl(data.photo);
        } else {
          setInstructorId(null);
        }
      }
    } catch (err: unknown) {
      console.error("[Instructor Profile] Gagal memuat data dari list:", err);
    } finally {
      setIsLoading(false);
    }
  }, [courseId, apiToken, setFormData]);

  useEffect(() => {
    fetchInstructorData();
  }, [fetchInstructorData]);

  // ==========================================
  // 2. ADD & UPDATE (Optimasi Proses Simpan)
  // ==========================================
  const saveInstructorProfile = async () => {
    if (!courseId) {
      showNotification('ID Kelas tidak valid atau belum terbaca.', 'error');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://dev.katib.cloud';
      
      // Ambil user_id dari user_profile di localStorage untuk verifikasi relasi database
      let sessionUserId = null;
      if (typeof window !== 'undefined') {
        const sessionStr = localStorage.getItem('user_profile');
        if (sessionStr) {
          const loggedInUser = JSON.parse(sessionStr);
          sessionUserId = loggedInUser.user_id || loggedInUser.id || loggedInUser.owner_id;
        }
      }

      // Tentukan Endpoint & Method secara presisi sesuai spesifikasi aksinya
      const targetUrl = instructorId 
        ? `${baseUrl}/update/course_instructor/${instructorId}` 
        : `${baseUrl}/add/course_instructor`;
      
      const method = instructorId ? 'PUT' : 'POST';
      
      // Susun struktur payload 4 data dasar + parameter pelengkap (Sanitasi Undefined)
      const payload = {
        course_id: Number(courseId),
        user_id: sessionUserId ? Number(sessionUserId) : undefined, 
        nama: formData.instructor || '',
        role: formData.role || '',
        biodata: formData.bio || '',
        photo: photoUrl || ''
      };

      // Log untuk membantu proses debugging di console browser
      console.log(`[Instructor Profile] Menjalankan aksi ${method} ke: ${targetUrl}`, payload);

      const response = await fetch(targetUrl, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${apiToken}`
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      console.log("[Instructor Profile] Respon balik dari Server:", result);

      if (!response.ok || !result.data?.success) {
         throw new Error(result.data?.message || result.message || "Gagal menyimpan perubahan ke server.");
      }

      showNotification(instructorId ? 'Profil instruktur berhasil diperbarui!' : 'Profil instruktur baru berhasil dibuat!', 'success');
      
      // Sinkronisasi ulang state komponen agar mendapatkan id terbaru dari server setelah POST
      await fetchInstructorData();

    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("[Instructor Profile Save Error]:", err.message);
        showNotification(err.message, 'error');
      } else {
        showNotification('Terjadi kesalahan sistem saat mencoba menyimpan.', 'error');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // ==========================================
  // 3. DELETE (Proses Hapus Instruktur Kelas)
  // ==========================================
  const deleteInstructorProfile = async () => {
    if (!instructorId) return;

    if (!confirm('Apakah Anda yakin ingin menghapus profil instruktur dari kelas ini?')) {
      return;
    }

    setIsDeleting(true);
    
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://dev.katib.cloud';
      const targetUrl = `${baseUrl}/delete/course_instructor/${instructorId}`;

      console.log(`[Instructor Profile] Menghapus data via PUT ke: ${targetUrl}`);

      const response = await fetch(targetUrl, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${apiToken}`
        }
      });

      const result = await response.json();
      console.log("[Instructor Profile] Respon hapus dari Server:", result);

      if (!response.ok || !result.data?.success) {
         throw new Error(result.data?.message || "Gagal menghapus data instruktur.");
      }

      showNotification('Profil instruktur berhasil dihapus.', 'success');
      
      // Bersihkan form input secara instan
      setInstructorId(null);
      setPhotoUrl("");
      setFormData(prev => ({
         ...prev,
         instructor: '',
         role: '',
         bio: ''
      }));

    } catch (err: unknown) {
      if (err instanceof Error) {
        showNotification(err.message, 'error');
      } else {
        showNotification('Terjadi kesalahan saat menghapus data.', 'error');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#111111] p-8 md:p-10 rounded-4xl border border-slate-200/80 dark:border-slate-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] flex flex-col gap-8 relative overflow-hidden">
      
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-sm z-20 flex items-center justify-center">
           <span className="material-symbols-outlined text-4xl text-emerald-500 animate-spin">sync</span>
        </div>
      )}

      <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800/60 pb-6">
        <div className="size-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center border border-emerald-100 dark:border-emerald-500/20 text-emerald-500">
          <span className="material-symbols-outlined text-[24px]">badge</span>
        </div>
        <div>
          <h3 className={`text-xl font-bold text-slate-900 dark:text-white ${fontClassName}`}>
            Profil Instruktur
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Data ini akan ditampilkan di halaman depan kelas Anda.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="flex flex-col items-center gap-3 shrink-0 mx-auto md:mx-0">
          <div className="size-28 rounded-full bg-slate-100 dark:bg-[#161616] border-4 border-white dark:border-[#111111] shadow-lg flex items-center justify-center text-slate-300 dark:text-slate-700 relative overflow-hidden">
            {photoUrl ? (
              <Image 
                src={photoUrl} 
                alt="Avatar" 
                fill
                className="object-cover" 
                unoptimized={true}
              />
            ) : (
              <span className="material-symbols-outlined text-[48px]">person</span>
            )}
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Avatar</span>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
              Nama Lengkap / Gelar
            </label>
            <input
              type="text"
              value={formData.instructor || ''}
              onChange={(e) => handleChange('instructor', e.target.value)}
              className="w-full bg-[#fafafa] dark:bg-[#161616] border border-slate-200/60 dark:border-slate-700/60 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-300 dark:focus:border-emerald-500/50 outline-none transition-all"
              placeholder="Nama instruktur..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
              Role Profesional
            </label>
            <input
              type="text"
              value={formData.role || ''}
              onChange={(e) => handleChange('role', e.target.value)}
              className="w-full bg-[#fafafa] dark:bg-[#161616] border border-slate-200/60 dark:border-slate-700/60 rounded-2xl px-5 py-3.5 text-sm font-medium text-slate-900 dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-300 dark:focus:border-emerald-500/50 outline-none transition-all"
              placeholder="Misal: Senior Web Developer"
            />
          </div>

          <div className="md:col-span-2 space-y-2 mt-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
              Biodata Pendek
            </label>
            <textarea
              rows={3}
              value={formData.bio || ''}
              onChange={(e) => handleChange('bio', e.target.value)}
              className="w-full bg-[#fafafa] dark:bg-[#161616] border border-slate-200/60 dark:border-slate-700/60 rounded-2xl px-5 py-4 text-sm font-medium text-slate-700 dark:text-slate-300 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-300 dark:focus:border-emerald-500/50 outline-none transition-all resize-none leading-relaxed"
              placeholder="Tuliskan latar belakang dan pengalaman mengajar singkat..."
            />
          </div>
        </div>
      </div>

      {/* Alert Error / Success */}
      {error && <div className="rounded-2xl bg-red-50 text-red-600 px-5 py-3 text-sm font-bold animate-in fade-in">{error}</div>}
      {success && <div className="rounded-2xl bg-emerald-50 text-emerald-600 px-5 py-3 text-sm font-bold animate-in fade-in">{success}</div>}

      {/* Tombol Aksi */}
      <div className="flex justify-between items-center mt-4 border-t border-slate-100 dark:border-slate-800 pt-6">
        <div>
          {instructorId ? (
             <button
                type="button"
                onClick={deleteInstructorProfile}
                disabled={isDeleting || isSaving}
                className={`inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all disabled:opacity-50 ${fontClassName}`}
             >
                <span className="material-symbols-outlined text-[20px]">
                  {isDeleting ? 'hourglass_empty' : 'delete'}
                </span>
                Hapus Instruktur
             </button>
          ) : (
             <div />
          )}
        </div>

        <button
          type="button"
          onClick={saveInstructorProfile}
          disabled={isSaving || isDeleting}
          className={`inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-600 active:scale-95 disabled:opacity-60 ${fontClassName}`}
        >
          <span className="material-symbols-outlined text-[20px]">
            {isSaving ? 'progress_activity' : 'save'}
          </span>
          {isSaving ? 'Menyimpan...' : instructorId ? 'Update Profil Instruktur' : 'Simpan Instruktur Baru'}
        </button>
      </div>

    </div>
  );
}