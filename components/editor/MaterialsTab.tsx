import React, { useState } from 'react';
import { DM_Sans } from 'next/font/google';
import Link from 'next/link';

const googleSansAlt = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '700', '800'] });

interface ChapterItem {
  type: 'video' | 'quiz' | 'article';
  title: string;
  status: 'published' | 'draft';
}

interface CurriculumModule {
  section: string;
  chapters: ChapterItem[];
}

export default function CurriculumSettings({ courseSlug }: { courseSlug: string }) {
  // ✨ FIX: Menghapus 'setCurriculum' karena komponen ini hanya bersifat read-only ✨
  const [curriculum] = useState<CurriculumModule[]>(() => {
     if (typeof window !== 'undefined') {
        const savedCurriculum = localStorage.getItem(`db_curriculum_${courseSlug}`);
        if (savedCurriculum) return JSON.parse(savedCurriculum);
     }
     return [];
  });

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="bg-linear-to-br from-[#00BCD4]/10 to-blue-500/10 border border-[#00BCD4]/20 p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="relative z-10">
            <h3 className={`text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white mb-2 ${googleSansAlt.className}`}>Pusat Penulisan Modul</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md leading-relaxed">
              Pengaturan kurikulum (Daftar Bab, Teks, Video, dan Kuis) dipisahkan dari pengaturan dasar kelas agar Anda dapat fokus menulis tanpa gangguan. 
            </p>
        </div>
        <Link 
          href={`/article-builder?course=${courseSlug}&chapter=1`} 
          className={`relative z-10 shrink-0 flex items-center gap-2 px-6 py-4 bg-[#00BCD4] hover:bg-[#00acc1] text-white rounded-2xl text-sm font-bold shadow-xl shadow-cyan-500/30 transition-all active:scale-95 ${googleSansAlt.className}`}
        >
          <span className="material-symbols-outlined text-[20px]">edit_square</span>
          Buka Curriculum Builder
        </Link>
      </div>

      <div className="bg-white dark:bg-[#111111] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h4 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-6 border-b border-slate-100 dark:border-slate-800 pb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-400">visibility</span> Ringkasan Roadmap Kurikulum
        </h4>
        
        {curriculum.length === 0 ? (
          <p className="text-slate-500 text-center py-8 text-sm italic">Belum ada materi yang dibuat. Klik tombol di atas untuk mulai.</p>
        ) : (
          <div className="space-y-4">
            {curriculum.map((mod, idx) => (
              <div key={idx} className="space-y-2">
                <p className="text-xs font-bold text-[#00BCD4] uppercase tracking-wider bg-cyan-50 dark:bg-cyan-900/20 inline-block px-3 py-1 rounded-lg">{mod.section}</p>
                <div className="pl-4 border-l-2 border-slate-100 dark:border-slate-800 space-y-2">
                  {mod.chapters.map((chap: ChapterItem, cIdx: number) => (
                    <div key={cIdx} className="flex items-center gap-3 text-sm bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700/50">
                        <span className={`material-symbols-outlined text-[18px] ${chap.type === 'video' ? 'text-blue-500' : chap.type === 'quiz' ? 'text-amber-500' : 'text-[#00BCD4]'}`}>
                          {chap.type === 'video' ? 'play_circle' : chap.type === 'quiz' ? 'quiz' : 'article'}
                        </span>
                        <span className="font-medium text-slate-700 dark:text-slate-300 flex-1">{chap.title}</span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${chap.status === 'published' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                          {chap.status}
                        </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}