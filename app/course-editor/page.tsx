'use client';

import React, { useState, Suspense } from 'react';
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

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'web' },
    { id: 'materials', label: 'Materials', icon: 'menu_book' },
    { id: 'videos', label: 'Videos', icon: 'videocam' },
    { id: 'assignments', label: 'Assignments', icon: 'assignment' },
  ];

  return (
    <div className={`min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a] ${inter.className} pb-32`}>
      <header className="h-16 bg-white dark:bg-[#111111] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/instructor" className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" title="Kembali ke Dashboard">
            <span className="material-symbols-outlined text-[24px] block">arrow_back</span>
          </Link>
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700"></div>
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-[#00BCD4] uppercase tracking-widest mb-0.5">
              <span className="material-symbols-outlined text-[14px]">settings</span> Editor Kelas
            </div>
            <h1 className={`text-sm font-bold text-slate-900 dark:text-white ${googleSansAlt.className}`}>
              {courseSlug.toUpperCase()}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <span className="px-3 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg text-xs font-bold border border-amber-200 dark:border-amber-800/50 flex items-center gap-1.5">
             <span className="size-1.5 rounded-full bg-amber-500 animate-pulse"></span> Draft
           </span>
           <button onClick={() => showToast('success', 'Semua pengaturan tersimpan!')} className={`px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full text-sm font-bold shadow-md hover:opacity-90 active:scale-95 transition-all ${googleSansAlt.className}`}>
             Publish Kelas
           </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="bg-white dark:bg-[#111111] p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-8 mb-12 relative overflow-hidden group">
           <div className="absolute top-0 left-0 w-1.5 h-full bg-[#00BCD4]"></div>
           <div className="w-full md:w-80 shrink-0">
             <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">Course Thumbnail</label>
             <div 
               className="relative w-full aspect-video bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:border-[#00BCD4] transition-all cursor-pointer overflow-hidden bg-cover bg-center shadow-inner"
               style={{ backgroundImage: `url(${basicData.thumbnail})` }}
               onClick={() => { const newUrl = prompt("Masukkan URL Thumbnail Kelas:", basicData.thumbnail); if(newUrl) handleBasicChange('thumbnail', newUrl); }}
             >
               <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center backdrop-blur-sm">
                   <span className="material-symbols-outlined text-[32px] mb-2 text-white">edit_square</span>
                   <p className="font-bold text-xs text-white">Ubah Gambar</p>
               </div>
             </div>
           </div>
           
           <div className="flex-1 flex flex-col justify-center">
              <div className="mb-6">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Judul Kelas</label>
                <input type="text" value={basicData.title} onChange={(e) => handleBasicChange('title', e.target.value)} className={`w-full bg-transparent border-b border-slate-200 dark:border-slate-700 pb-2 text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white focus:border-[#00BCD4] outline-none transition-all ${googleSansAlt.className}`} placeholder="Judul utama kelas..." />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Tingkat Kesulitan</label>
                    <select value={basicData.level} onChange={(e) => handleBasicChange('level', e.target.value)} className="w-full bg-transparent text-sm font-bold text-slate-900 dark:text-white outline-none cursor-pointer appearance-none">
                      <option value="Pemula">🟢 Pemula</option>
                      <option value="Menengah">🟡 Menengah</option>
                      <option value="Mahir">🔴 Mahir</option>
                    </select>
                 </div>
                 
                 <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Harga (Rp)</label>
                    <input type="number" value={basicData.price} onChange={(e) => handleBasicChange('price', e.target.value)} className="w-full bg-transparent text-sm font-bold text-slate-900 dark:text-white outline-none" placeholder="Misal: 499000" />
                 </div>

                 <div className="bg-red-50 dark:bg-red-900/10 p-3 rounded-xl border border-red-100 dark:border-red-900/30 relative">
                    <label className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">local_offer</span> Diskon
                    </label>
                    <div className="relative">
                      <input 
                        type="number" 
                        min="0" max="100"
                        value={basicData.discount} 
                        onChange={(e) => handleBasicChange('discount', e.target.value)} 
                        className="w-full bg-transparent text-sm font-bold text-red-600 dark:text-red-400 outline-none pr-6" 
                        placeholder="0" 
                      />
                      <span className="absolute right-0 top-0 bottom-0 flex items-center text-sm font-bold text-red-400 pointer-events-none">%</span>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        <div className="flex items-center gap-2 mb-8 overflow-x-auto no-scrollbar border-b border-slate-200 dark:border-slate-800 pb-px sticky top-16 z-30 bg-[#fafafa] dark:bg-[#0a0a0a] pt-4">
          {tabs.map((tab) => (
             <button
               key={tab.id}
               // ✨ FIX: Menghapus "as any" dan mendefinisikan tipenya secara eksplisit ✨
               onClick={() => setActiveTab(tab.id as 'overview' | 'materials' | 'videos' | 'assignments')}
               className={`flex items-center gap-2 px-6 py-3.5 border-b-2 transition-all font-bold text-sm whitespace-nowrap ${
                 activeTab === tab.id 
                 ? 'border-[#00BCD4] text-[#00BCD4] bg-cyan-50/50 dark:bg-cyan-900/10 rounded-t-xl' 
                 : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300 dark:hover:text-slate-200 dark:hover:border-slate-600'
               }`}
             >
                <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                {tab.label}
             </button>
          ))}
        </div>

        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'materials' && <MaterialsTab courseSlug={courseSlug} />}
        {activeTab === 'videos' && <VideosTab />}
        {activeTab === 'assignments' && <AssignmentsTab />}
      </main>
    </div>
  );
}

export default function CourseEditorPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen bg-[#0a0a0a] text-white">Loading Editor Hub...</div>}>
            <CourseEditorContent />
        </Suspense>
    )
}