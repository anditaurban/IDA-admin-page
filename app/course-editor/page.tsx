'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { DM_Sans, Inter } from 'next/font/google';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/components/ui/ToastProvider';

import OverviewTab from '@/components/editor/OverviewTab';
import MaterialsTab from '@/components/editor/MaterialsTab';
import VideosTab from '@/components/editor/VideosTab';
import AssignmentsTab from '@/components/editor/AssignmentsTab';

const inter = Inter({ subsets: ['latin'] });
const googleSansAlt = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '700', '800'] });

const defaultBasicData = {
  title: "NgodingAI: Master GenAI & LLMs",
  thumbnail: "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1000&auto=format&fit=crop",
  level: "Pemula",
  price: "499000",
  discount: "0" 
};

function CourseEditorContent() {
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const courseSlug = searchParams.get('course') || 'ngodingai';
  
  // FIX: Tambahkan state isMounted untuk mengatasi Hydration Error
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Abaikan peringatan linter untuk baris ini karena ini adalah pola standar
    // yang disengaja untuk melakukan "hydration bailout" di Next.js.
    // eslint-disable-next-line
    setIsMounted(true);
  }, []);

  const [activeTab, setActiveTab] = useState<'overview' | 'materials' | 'videos' | 'assignments'>('overview');

  const [basicData, setBasicData] = useState(() => {
    if (typeof window !== 'undefined') {
       const savedData = localStorage.getItem('db_course_basic');
       return savedData ? { ...defaultBasicData, ...JSON.parse(savedData) } : defaultBasicData;
    }
    return defaultBasicData;
  });

  const handleBasicChange = (field: string, value: string) => {
    const newData = { ...basicData, [field]: value };
    setBasicData(newData);
    localStorage.setItem('db_course_basic', JSON.stringify(newData));
  };

  // Helper untuk format rupiah dengan titik
  const formatRibuan = (angka: string | number) => {
    if (!angka) return '';
    return new Intl.NumberFormat('id-ID').format(Number(angka));
  };

  // Kalkulasi Harga Akhir
  const parsedPrice = parseInt(basicData.price || '0', 10);
  const parsedDiscount = parseInt(basicData.discount || '0', 10);
  const finalPrice = parsedPrice - (parsedPrice * parsedDiscount / 100);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'web' },
    { id: 'materials', label: 'Materials', icon: 'menu_book' },
    { id: 'videos', label: 'Videos', icon: 'videocam' },
    { id: 'assignments', label: 'Assignments', icon: 'assignment' },
  ];

  // FIX: Tunda render UI yang bergantung pada localStorage sampai client siap
  // Ini memastikan HTML dari Server persis sama dengan HTML awal di Client
  if (!isMounted) {
    return null; 
  }

  return (
    <div className={`min-h-screen bg-[#f4f5f7] dark:bg-[#050505] ${inter.className} pb-32 selection:bg-[#00BCD4]/30`}>
      
      {/* --- MODERN GLASS HEADER --- */}
      <header className="h-18 bg-white/70 dark:bg-[#0a0a0a]/70 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-5">
          <Link 
            href="/instructor" 
            className="group flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all text-slate-500 hover:text-slate-900 dark:hover:text-white" 
            title="Kembali ke Beranda"
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
              {courseSlug}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="hidden sm:flex px-3.5 py-1.5 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full text-[11px] font-bold border border-amber-200 dark:border-amber-500/20 items-center gap-2">
             <span className="size-2 rounded-full bg-amber-500 animate-pulse"></span> Draft Mode
           </div>
           <button 
             onClick={() => showToast('success', 'Semua pengaturan tersimpan!')} 
             className={`flex items-center gap-2 px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-full text-sm font-bold shadow-lg shadow-slate-900/10 dark:shadow-white/10 active:scale-95 transition-all ${googleSansAlt.className}`}
           >
             <span className="material-symbols-outlined text-[18px]">publish</span>
             Publish Kelas
           </button>
        </div>
      </header>

      <main className="max-w-260 mx-auto px-6 py-10">
        
        {/* --- HERO BASIC DATA CARD --- */}
        <div className="bg-white dark:bg-[#111111] p-8 rounded-4xl border border-slate-200/80 dark:border-slate-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] flex flex-col lg:flex-row gap-10 mb-10">
           
           {/* THUMBNAIL EDITOR */}
           <div className="w-full lg:w-85 shrink-0">
             <div className="flex items-center justify-between mb-3">
               <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Thumbnail</label>
             </div>
             <div 
               className="group relative w-full aspect-4/3 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm bg-slate-100 dark:bg-slate-900 cursor-pointer"
               onClick={() => { const newUrl = prompt("Masukkan URL Thumbnail Kelas:", basicData.thumbnail); if(newUrl) handleBasicChange('thumbnail', newUrl); }}
             >
               {/* Image Background */}
               <div 
                 className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" 
                 style={{ backgroundImage: `url(${basicData.thumbnail})` }} 
               />
               
               {/* Hover Overlay */}
               <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex flex-col items-center justify-center">
                   <div className="translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center gap-3">
                      <div className="size-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30 shadow-xl">
                        <span className="material-symbols-outlined text-[24px]">add_photo_alternate</span>
                      </div>
                      <p className="font-bold text-xs text-white drop-shadow-md">Ganti Thumbnail</p>
                   </div>
               </div>
             </div>
           </div>
           
           {/* TEXT INPUTS & METRICS */}
           <div className="flex-1 flex flex-col">
              <div className="mb-8 relative group">
                <label className="text-[11px] font-bold text-[#00BCD4] uppercase tracking-wider block mb-2 opacity-80">Judul Utama Kelas</label>
                <textarea 
                  value={basicData.title} 
                  onChange={(e) => handleBasicChange('title', e.target.value)} 
                  rows={2}
                  className={`w-full bg-transparent border-0 p-0 text-3xl sm:text-4xl lg:text-[40px] font-extrabold text-slate-900 dark:text-white focus:ring-0 resize-none outline-none leading-[1.1] transition-all placeholder:text-slate-300 dark:placeholder:text-slate-700 ${googleSansAlt.className}`} 
                  placeholder="Ketik judul kelas di sini..." 
                />
                {/* Subtle border that appears on focus/hover to indicate it's editable */}
                <div className="absolute -inset-x-4 -inset-y-2 rounded-2xl border-2 border-transparent group-focus-within:border-slate-100 dark:group-focus-within:border-slate-800/50 -z-10 transition-colors pointer-events-none"></div>
              </div>
              
              <div className="mt-auto grid grid-cols-1 sm:grid-cols-3 gap-4">
                 
                 {/* Level Box */}
                 <div className="flex flex-col gap-1.5 p-4 rounded-2xl bg-[#fafafa] dark:bg-[#161616] border border-slate-200/60 dark:border-slate-800/60 focus-within:border-[#00BCD4]/50 focus-within:ring-2 focus-within:ring-[#00BCD4]/10 transition-all">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px]">stairs</span> Tingkat
                    </label>
                    <select 
                      value={basicData.level} 
                      onChange={(e) => handleBasicChange('level', e.target.value)} 
                      className="w-full bg-transparent border-0 p-0 text-sm font-bold text-slate-900 dark:text-white outline-none cursor-pointer focus:ring-0"
                    >
                      <option value="Pemula">🟢 Pemula</option>
                      <option value="Menengah">🟡 Menengah</option>
                      <option value="Mahir">🔴 Mahir</option>
                    </select>
                 </div>
                 
                 {/* Price Box */}
                 <div className={`flex flex-col gap-1.5 p-4 rounded-2xl bg-[#fafafa] dark:bg-[#161616] border border-slate-200/60 dark:border-slate-800/60 focus-within:border-[#00BCD4]/50 focus-within:ring-2 focus-within:ring-[#00BCD4]/10 transition-all ${parsedDiscount > 0 ? 'row-span-2 sm:row-span-1' : ''}`}>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px]">payments</span> Harga Dasar (Rp)
                    </label>
                    <input 
                      type="text" 
                      inputMode="numeric"
                      value={formatRibuan(basicData.price)} 
                      onChange={(e) => handleBasicChange('price', e.target.value.replace(/\D/g, ''))} 
                      className={`w-full bg-transparent border-0 p-0 text-sm font-bold outline-none focus:ring-0 placeholder:text-slate-300 transition-all ${parsedDiscount > 0 ? 'text-slate-400 dark:text-slate-500 line-through decoration-slate-400/50' : 'text-slate-900 dark:text-white'}`} 
                      placeholder="499.000" 
                    />
                    
                    {/* Hasil Kalkulasi Harga Diskon */}
                    {parsedDiscount > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 animate-in fade-in slide-in-from-top-1">
                        <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest block mb-0.5">Harga Akhir</span>
                        <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                          Rp {formatRibuan(finalPrice)}
                        </span>
                      </div>
                    )}
                 </div>

                 {/* Discount Box */}
                 <div className="flex flex-col gap-1.5 p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/20 focus-within:border-rose-300 dark:focus-within:border-rose-500/50 focus-within:ring-2 focus-within:ring-rose-500/10 transition-all">
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
                        className="w-full bg-transparent border-0 p-0 text-sm font-bold text-rose-600 dark:text-rose-400 outline-none focus:ring-0 placeholder:text-rose-300" 
                        placeholder="0" 
                      />
                      <span className="text-sm font-bold text-rose-500/50 pointer-events-none">%</span>
                    </div>
                 </div>

              </div>
           </div>
        </div>

        {/* --- MODERN PILL NAVIGATION TABS --- */}
        <div className="sticky top-22 z-40 mb-8 flex justify-center sm:justify-start">
          <div className="flex items-center gap-1 p-1.5 bg-[#1a1a2e]/85 dark:bg-[#0a0a14]/85 backdrop-blur-2xl rounded-2xl border border-white/15 dark:border-white/10 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.4),0_0_30px_rgba(255,255,255,0.15)] dark:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.8),0_0_30px_rgba(255,255,255,0.05)] overflow-x-auto no-scrollbar w-full sm:w-max transition-all duration-300">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'overview' | 'materials' | 'videos' | 'assignments')}
                  className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap overflow-hidden ${
                    isActive 
                    ? 'text-white shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-white/5 dark:hover:bg-white/5'
                  }`}
                >
                  {/* Active Indicator Background */}
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