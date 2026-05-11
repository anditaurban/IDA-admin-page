import React, { useState, useEffect, useCallback } from 'react';
import { DM_Sans } from 'next/font/google';
import Link from 'next/link';
import Cookies from 'js-cookie';

const googleSansAlt = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '700', '800'] });

const RAW_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
const BASE_URL = RAW_BASE_URL.endsWith('/') ? RAW_BASE_URL.slice(0, -1) : RAW_BASE_URL;

interface ApiMaterial {
  material_id: number | string;
  title: string;
  type: 'article' | 'document' | 'video' | 'quiz';
  content_html?: string | null;
  file_url?: string | null;
}

interface ApiSection {
  section_id: number | string;
  title: string;
  materials?: ApiMaterial[];
}

interface ChapterItem {
  type: 'video' | 'quiz' | 'article' | 'document';
  title: string;
  status: 'published' | 'draft';
}

interface CurriculumModule {
  section: string;
  chapters: ChapterItem[];
}

export default function MaterialsTab({ courseSlug }: { courseSlug?: string }) {
  const slug = courseSlug || 'default-course';
  const [curriculum, setCurriculum] = useState<CurriculumModule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurriculum = useCallback(async () => {
    setIsLoading(true);
    try {
      if (!BASE_URL) return;
      const token = Cookies.get('api_token') || process.env.NEXT_PUBLIC_API_TOKEN || '';

      const response = await fetch(`${BASE_URL}/detail/course_curriculum/${slug}`, {
        headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const resJson = await response.json();
        if (resJson.status === 'success' && resJson.detail?.curriculum) {
          
          // Mapping data backend ke format UI
          const mappedData: CurriculumModule[] = resJson.detail.curriculum.map((sec: ApiSection) => ({
            section: sec.title,
            chapters: (sec.materials || []).map((mat: ApiMaterial) => ({
              title: mat.title,
              type: mat.type,
              status: (mat.content_html || mat.file_url) ? 'published' : 'draft' 
            }))
          }));

          setCurriculum(mappedData);
        }
      }
    } catch (error) {
      console.error("Error fetching curriculum for tab:", error);
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchCurriculum();
  }, [fetchCurriculum]);

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
          href={`/article-builder?course=${slug}`} 
          className={`relative z-10 shrink-0 flex items-center gap-2 px-6 py-4 bg-[#00BCD4] hover:bg-[#00acc1] text-white rounded-2xl text-sm font-bold shadow-xl shadow-cyan-500/30 transition-all active:scale-95 ${googleSansAlt.className}`}
        >
          <span className="material-symbols-outlined text-[20px]">edit_square</span>
          Buka Curriculum Builder
        </Link>
      </div>

      <div className="bg-white dark:bg-[#111111] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
          <h4 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-slate-400">visibility</span> Ringkasan Roadmap Kurikulum
          </h4>
          <button onClick={fetchCurriculum} className="text-slate-400 hover:text-[#00BCD4] transition-colors p-1" title="Refresh Roadmap">
            <span className={`material-symbols-outlined text-[18px] ${isLoading ? 'animate-spin' : ''}`}>sync</span>
          </button>
        </div>
        
        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
                <div className="h-10 w-full bg-slate-100 dark:bg-slate-900/50 rounded-xl ml-4"></div>
                <div className="h-10 w-3/4 bg-slate-100 dark:bg-slate-900/50 rounded-xl ml-4"></div>
              </div>
            ))}
          </div>
        ) : curriculum.length === 0 ? (
          <p className="text-slate-500 text-center py-8 text-sm italic">Belum ada materi yang dibuat. Klik tombol di atas untuk mulai membangun kurikulum.</p>
        ) : (
          <div className="space-y-4">
            {curriculum.map((mod, idx) => (
              <div key={idx} className="space-y-2">
                <p className="text-xs font-bold text-[#00BCD4] uppercase tracking-wider bg-cyan-50 dark:bg-cyan-900/20 inline-block px-3 py-1 rounded-lg">{mod.section}</p>
                <div className="pl-4 border-l-2 border-slate-100 dark:border-slate-800 space-y-2">
                  {mod.chapters.map((chap: ChapterItem, cIdx: number) => (
                    <div key={cIdx} className="flex items-center gap-3 text-sm bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700/50">
                        <span className={`material-symbols-outlined text-[18px] ${chap.type === 'video' ? 'text-blue-500' : chap.type === 'quiz' ? 'text-amber-500' : chap.type === 'document' ? 'text-emerald-500' : 'text-[#00BCD4]'}`}>
                          {chap.type === 'video' ? 'play_circle' : chap.type === 'quiz' ? 'quiz' : chap.type === 'document' ? 'picture_as_pdf' : 'article'}
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