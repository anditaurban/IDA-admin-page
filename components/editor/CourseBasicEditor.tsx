'use client';

import React, { useRef } from 'react';
import { DM_Sans } from 'next/font/google';
import type { BasicCourseData } from '@/hooks/useCourseEditor';
import type { CourseCategory } from '@/hooks/useCourseCategories';
import type { DiscountMode } from '@/utils/coursePricing';
import { calculateTotalPrice, formatRibuan, normalizeNumberString } from '@/utils/coursePricing';

const googleSansAlt = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '700', '800'],
});

type CourseBasicEditorProps = {
  basicData: BasicCourseData;
  categories: CourseCategory[];
  levels: string[];
  isFetching: boolean;
  isCategoryLoading: boolean;
  isLevelLoading: boolean;
  isUploadingThumbnail: boolean;
  discountMode: DiscountMode;
  isEditing: boolean; // ✨ PROP BARU
  onEditToggle: () => void;      // ✨ PROP BARU
  onCancelToggle: () => void;    // ✨ PROP BARU
  onChange: (field: keyof BasicCourseData, value: string | boolean | number) => void;
  onDiscountModeChange: (mode: DiscountMode) => void;
  onThumbnailUpload: (file: File) => void;
  onFileError: (message: string) => void;
};

export default function CourseBasicEditor({
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

  const displayThumbnail = React.useMemo(() => {
    const rawBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || '';
    const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;
    
    // ✨ FIX: Gunakan const karena nilainya tidak ditimpa lagi
    const thumb = basicData.thumbnail;
    
    if (!thumb) return '';
    
    if (thumb.startsWith('data:') || thumb.startsWith('bg-')) return thumb;

    if (thumb.includes('/uploads/courses/')) {
      const filename = thumb.split('/').pop(); 
      return `${baseUrl}/thumbnail/course/${filename}`;
    }
    
    if (thumb.startsWith('http')) return thumb;

    return `${baseUrl}/thumbnail/course/${thumb}`;
    
  }, [basicData.thumbnail]);

  const isImageThumbnail = displayThumbnail.startsWith('http') || displayThumbnail.startsWith('data:image') || displayThumbnail.startsWith('/');
  const isCssThumbnail = displayThumbnail.startsWith('bg-');

  const parsedPrice = Number(normalizeNumberString(basicData.price)) || 0;
  const parsedDiscount = Number(normalizeNumberString(basicData.discount)) || 0;
  const finalPrice = Number(basicData.total_price || calculateTotalPrice(basicData.price, discountMode, basicData.discount)) || 0;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      onFileError('Format file tidak didukung. Harap pilih gambar JPG, PNG, atau WEBP.');
      e.target.value = '';
      return;
    }

    const MAX_SIZE_MB = 2;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      onFileError(`Ukuran gambar terlalu besar! Maksimal ${MAX_SIZE_MB}MB.`);
      e.target.value = '';
      return;
    }

    onThumbnailUpload(file);
    e.target.value = '';
  };

  return (
    <div className={`p-8 rounded-4xl border flex flex-col lg:flex-row gap-10 mb-10 transition-all duration-500 ${isEditing ? 'bg-white dark:bg-[#111111] border-slate-200/80 dark:border-slate-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]' : 'bg-transparent border-transparent'}`}>
      
      {/* KIRI: THUMBNAIL */}
      <div className="w-full lg:w-85 shrink-0">
        {isEditing && (
          <div className="flex items-center justify-between mb-3 animate-in fade-in">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Thumbnail Image (Maks 2MB)</label>
          </div>
        )}

        <input type="file" accept="image/png, image/jpeg, image/jpg, image/webp" className="hidden" ref={thumbnailInputRef} onChange={handleFileChange} />

        <div
          className={`group relative w-full aspect-4/3 rounded-3xl overflow-hidden shadow-sm bg-slate-100 dark:bg-slate-900 transition-all duration-300 ${
            isFetching || isUploadingThumbnail ? 'animate-pulse pointer-events-none' : ''
          } ${isEditing ? 'border border-slate-200 dark:border-slate-800 cursor-pointer hover:shadow-md' : 'border-0 pointer-events-none'}`}
          onClick={() => isEditing && thumbnailInputRef.current?.click()}
        >
          {isUploadingThumbnail && (
            <div className="absolute z-20 inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-[#00BCD4]">
              <span className="material-symbols-outlined text-4xl animate-spin mb-2">sync</span>
              <span className="text-xs font-bold uppercase tracking-wider">Mengunggah...</span>
            </div>
          )}

          {displayThumbnail ? (
            <div className={`absolute inset-0 bg-cover bg-center transition-transform duration-700 ${isEditing && 'group-hover:scale-105'} ${isCssThumbnail ? displayThumbnail : ''}`} style={isImageThumbnail ? { backgroundImage: `url(${displayThumbnail})` } : {}} />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 dark:text-slate-700">
              <span className="material-symbols-outlined text-5xl mb-2">add_photo_alternate</span>
              <span className="text-xs font-medium">Belum Ada Thumbnail</span>
            </div>
          )}

          {/* Overlay Hover HANYA MUNCUL JIKA EDITING */}
          {isEditing && (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-300 flex flex-col items-center justify-center">
              <div className="translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center gap-3">
                <div className="size-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30 shadow-xl">
                  <span className="material-symbols-outlined text-[24px]">cloud_upload</span>
                </div>
                <p className="font-bold text-xs text-white drop-shadow-md">Update Thumbnail</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* KANAN: FORM & INFORMASI KELAS */}
      <div className="flex-1 flex flex-col">
        
        {/* Judul Kelas */}
        <div className="mb-4 relative group">
          {isEditing && <label className="text-[11px] font-bold text-[#00BCD4] uppercase tracking-wider flex items-center gap-2 mb-2 opacity-80 animate-in fade-in">Judul Utama Kelas</label>}
          {isEditing ? (
            <textarea
              value={basicData.title}
              onChange={(e) => onChange('title', e.target.value)}
              rows={2}
              disabled={isFetching}
              className={`w-full bg-transparent border-0 p-0 text-3xl sm:text-4xl lg:text-[40px] font-extrabold text-slate-900 dark:text-white focus:ring-0 resize-none outline-none leading-[1.1] transition-all placeholder:text-slate-300 dark:placeholder:text-slate-700 disabled:opacity-50 ${googleSansAlt.className}`}
              placeholder="Ketik judul kelas di sini..."
            />
          ) : (
            <h2 className={`text-3xl sm:text-4xl lg:text-[40px] font-extrabold text-slate-900 dark:text-white leading-[1.1] ${googleSansAlt.className}`}>
              {basicData.title || <span className="text-slate-300">Judul belum diatur</span>}
            </h2>
          )}
        </div>

        {/* ✨ INFO BADGE & TOMBOL EDIT LOKAL */}
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 ${isFetching ? 'opacity-50' : ''}`}>
          
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-bold bg-slate-100 dark:bg-[#161616] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="material-symbols-outlined text-[14px]">person</span>
              {/* ✨ KODE BERSIH: Tanpa 'any' atau 'Record' */}
              {basicData.author_name || basicData.author || 'Instruktur'}
            </div>
            
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-bold bg-slate-100 dark:bg-[#161616] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="material-symbols-outlined text-[14px]">group</span>
              {basicData.students} Siswa
            </div>
          </div>

          {/* ✨ LOCAL ACTION: Tombol Edit / Batal */}
          <div className="animate-in fade-in zoom-in-95 duration-300">
            {isEditing ? (
              <button 
                onClick={onCancelToggle} 
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400 rounded-xl text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all border border-rose-200 dark:border-rose-500/30 active:scale-95"
              >
                <span className="material-symbols-outlined text-[16px]">close</span> Batal Edit
              </button>
            ) : (
              <button 
                onClick={onEditToggle} 
                className="flex items-center gap-1.5 px-4 py-2 bg-cyan-50 dark:bg-cyan-500/10 text-[#00BCD4] rounded-xl text-xs font-bold hover:bg-[#00BCD4] hover:text-white transition-all border border-cyan-200 dark:border-cyan-500/30 active:scale-95 group"
              >
                <span className="material-symbols-outlined text-[16px] group-hover:rotate-12 transition-transform">edit</span> Edit Info Kelas
              </button>
            )}
          </div>

        </div>

        {/* GRID ATAS: Meta Konfigurasi */}
        <div className="mt-auto grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* Kategori */}
          <div className={`flex flex-col gap-1.5 transition-all duration-300 ${isEditing ? 'p-4 rounded-2xl bg-[#fafafa] dark:bg-[#161616] border border-slate-200/60 dark:border-slate-800/60 focus-within:border-[#00BCD4]/50 focus-within:ring-2 focus-within:ring-[#00BCD4]/10' : 'p-2'}`}>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px]">category</span>
              Kategori
            </label>
            {isEditing ? (
              <select 
                value={basicData.category_id || ''} 
                onChange={(e) => onChange('category_id', e.target.value ? Number(e.target.value) : 1)} 
                disabled={isFetching || isCategoryLoading} 
                className="w-full bg-transparent border-0 p-0 text-sm font-bold text-slate-900 dark:text-white outline-none cursor-pointer focus:ring-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {categories.length > 0 ? categories.map((c) => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>) : <option value="">Belum tersedia</option>}
              </select>
            ) : (
              <span className="text-sm font-bold text-slate-900 dark:text-white">{basicData.category_name || 'Umum'}</span>
            )}
          </div>

          {/* Tingkat */}
          <div className={`flex flex-col gap-1.5 transition-all duration-300 ${isEditing ? 'p-4 rounded-2xl bg-[#fafafa] dark:bg-[#161616] border border-slate-200/60 dark:border-slate-800/60 focus-within:border-[#00BCD4]/50 focus-within:ring-2 focus-within:ring-[#00BCD4]/10' : 'p-2'}`}>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px]">stairs</span>
              Tingkat
            </label>
            {isEditing ? (
              <select 
                value={basicData.level} 
                onChange={(e) => onChange('level', e.target.value)} 
                disabled={isFetching || isLevelLoading} 
                className="w-full bg-transparent border-0 p-0 text-sm font-bold text-slate-900 dark:text-white outline-none cursor-pointer focus:ring-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {levels.map((level) => <option key={level} value={level}>{level}</option>)}
              </select>
            ) : (
              <span className="text-sm font-bold text-slate-900 dark:text-white">{basicData.level || 'Beginner'}</span>
            )}
          </div>

          {/* Harga Dasar */}
          <div className={`flex flex-col gap-1.5 transition-all duration-300 ${isEditing ? 'p-4 rounded-2xl bg-[#fafafa] dark:bg-[#161616] border border-slate-200/60 dark:border-slate-800/60 focus-within:border-[#00BCD4]/50 focus-within:ring-2 focus-within:ring-[#00BCD4]/10' : 'p-2'}`}>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px]">payments</span>
              Harga Dasar
            </label>
            {isEditing ? (
              <div className="flex items-center">
                <span className="text-sm font-bold text-slate-400 mr-1.5">Rp</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={!basicData.price || basicData.price === '0' ? '' : formatRibuan(basicData.price)}
                  onChange={(e) => onChange('price', normalizeNumberString(e.target.value))}
                  className="w-full bg-transparent border-0 p-0 text-sm font-bold outline-none focus:ring-0 placeholder:text-slate-300 text-slate-900 dark:text-white"
                  placeholder="0"
                />
              </div>
            ) : (
              <span className="text-sm font-bold text-slate-900 dark:text-white">Rp {formatRibuan(parsedPrice)}</span>
            )}
          </div>
        </div>

        {/* BOKS BAWAH: Diskon & Harga Akhir */}
        <div className="mt-4 flex flex-col md:flex-row gap-4">
          
          {/* Shape Diskon */}
          <div className={`flex-1 flex flex-col sm:flex-row sm:items-center gap-3 transition-all duration-500 ${isEditing ? 'p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/20' : 'px-2 py-4'}`}>
            
            <div className={`flex flex-col gap-2 ${isEditing ? 'sm:w-5/12' : ''}`}>
              <label className="text-[10px] font-bold text-rose-500 dark:text-rose-400 uppercase tracking-widest flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px]">loyalty</span>
                {isEditing ? 'Atur Diskon' : 'Diskon Diterapkan'}
              </label>
              
              {isEditing && (
                <div className="flex rounded-lg bg-white/70 dark:bg-[#111111] p-1 border border-rose-100 dark:border-rose-500/20 animate-in fade-in">
                  <button type="button" onClick={() => onDiscountModeChange('percent')} className={`flex-1 rounded-md px-2 py-1 text-[10px] font-bold transition-all ${discountMode === 'percent' ? 'bg-rose-500 text-white' : 'text-rose-500 hover:bg-rose-100'}`}>Persen</button>
                  <button type="button" onClick={() => onDiscountModeChange('nominal')} className={`flex-1 rounded-md px-2 py-1 text-[10px] font-bold transition-all ${discountMode === 'nominal' ? 'bg-rose-500 text-white' : 'text-rose-500 hover:bg-rose-100'}`}>Nominal</button>
                </div>
              )}
            </div>

            <div className={`relative flex items-center flex-1 transition-all ${isEditing ? 'bg-white/60 dark:bg-[#161616]/60 rounded-xl px-4 py-2 border border-rose-100 dark:border-rose-500/20' : ''}`}>
              {isEditing ? (
                <>
                  {discountMode === 'nominal' && <span className="text-sm font-bold text-rose-500/50 mr-2">Rp</span>}
                  <input
                    type="text"
                    inputMode="numeric"
                    value={!basicData.discount || basicData.discount === '0' ? '' : (discountMode === 'nominal' ? formatRibuan(basicData.discount) : basicData.discount)}
                    onChange={(e) => {
                      let val = normalizeNumberString(e.target.value);
                      if (discountMode === 'percent' && Number(val) > 100) val = '100';
                      onChange('discount', val);
                    }}
                    className={`w-full bg-transparent border-0 p-0 text-lg font-black text-rose-600 dark:text-rose-400 outline-none focus:ring-0 placeholder:text-rose-300 ${discountMode === 'percent' ? 'text-right' : 'text-left'}`}
                    placeholder="0"
                  />
                  {discountMode === 'percent' && <span className="text-lg font-bold text-rose-500/50 ml-2">%</span>}
                </>
              ) : (
                <span className="text-xl font-black text-rose-600 dark:text-rose-400">
                  {/* ✨ KODE UPDATE: Mengganti 'Tidak ada diskon' menjadi '0' */}
                  {parsedDiscount > 0 ? (discountMode === 'nominal' ? `Rp ${formatRibuan(parsedDiscount)}` : `${parsedDiscount}%`) : '0'}
                </span>
              )}
            </div>
          </div>

          {/* Shape Harga Akhir */}
          <div className={`md:w-[40%] flex flex-col justify-center rounded-2xl border px-5 py-4 transition-all duration-500 ${isEditing ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10' : 'border-transparent bg-transparent pl-2'}`}>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block mb-1.5">
              Estimasi Harga Jual
            </span>
            <div className="flex flex-col">
              {parsedPrice > 0 && finalPrice < parsedPrice && (
                <span className="text-xs font-bold text-slate-400 line-through decoration-rose-500/40 decoration-2 mb-0.5">
                  Rp {formatRibuan(parsedPrice)}
                </span>
              )}
              <span className={`font-black text-emerald-700 dark:text-emerald-400 leading-none tracking-tight ${isEditing ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-4xl'}`}>
                Rp {formatRibuan(finalPrice)}
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}