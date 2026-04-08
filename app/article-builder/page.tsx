'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { DM_Sans, Inter } from 'next/font/google';
import { useToast } from '@/components/ui/ToastProvider';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link'; 

import ArticleWorkspace from '@/components/builder/ArticleWorkspace';
import VideoWorkspace from '@/components/builder/VideoWorkspace';
import QuizWorkspace from '@/components/builder/QuizWorkspace';

const inter = Inter({ subsets: ['latin'] });
const googleSansAlt = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '700', '800'] });

interface Chapter {
  id: string;
  title: string;
  type: 'article' | 'video' | 'quiz';
  status: string;
}

interface Module {
  id: string;
  section: string;
  chapters: Chapter[];
}

function BuilderContent() {
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const courseSlug = searchParams.get('course') || 'ngodingai';
  const chapterId = searchParams.get('chapter') || '1';

  const [modules, setModules] = useState<Module[]>([
    { id: 'sec-1', section: 'Bagian 1: Persiapan', chapters: [{ id: '1', title: 'Bab 1: Pengenalan Web & AI', type: 'article', status: 'published' }] }
  ]);

  const updateModulesAndSave = (newModules: Module[]) => {
    setModules(newModules);
    localStorage.setItem(`db_curriculum_${courseSlug}`, JSON.stringify(newModules));
  };

  useEffect(() => {
      const savedCurriculum = localStorage.getItem(`db_curriculum_${courseSlug}`);
      if (savedCurriculum) setModules(JSON.parse(savedCurriculum));
  }, [courseSlug]);

  const [expandedSection, setExpandedSection] = useState<string>('sec-1');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [openSectionMenuId, setOpenSectionMenuId] = useState<string | null>(null); 
  
  const sectionMenuRef = useRef<HTMLDivElement>(null); 
  const articleHTMLRef = useRef<string>("<p>Mulai ketik materi kelas Anda di sini...</p>");

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sectionMenuRef.current && !sectionMenuRef.current.contains(event.target as Node)) setOpenSectionMenuId(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✨ FIX: Menggunakan for...of agar TypeScript tidak menganggap tipe "never" ✨
  let activeModuleInfo: Chapter | undefined = undefined;
  for (const mod of modules) {
    const found = mod.chapters.find((c) => c.id === chapterId);
    if (found) {
      activeModuleInfo = found;
      break;
    }
  }

  const [activeChapter, setActiveChapter] = useState(chapterId);
  const [activeType, setActiveType] = useState<'article'|'video'|'quiz'>(activeModuleInfo?.type || 'article');
  const [chapterTitle, setChapterTitle] = useState(activeModuleInfo?.title || '');
  const [workspaceData, setWorkspaceData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
     // ✨ FIX: Metode loop konvensional agar TypeScript menganalisa tipenya dengan benar ✨
     let currentInfo: Chapter | undefined = undefined;
     let currentSectionId = '';
     for (const mod of modules) {
       const found = mod.chapters.find((c) => c.id === activeChapter);
       if (found) {
         currentInfo = found;
         currentSectionId = mod.id;
         break;
       }
     }

     if (currentInfo) {
        setActiveType(currentInfo.type);
        setChapterTitle(currentInfo.title);
        if(!editingSectionId) setExpandedSection(currentSectionId);
        
        const savedData = localStorage.getItem(`db_content_${courseSlug}_${activeChapter}`);
        if (savedData) setWorkspaceData(JSON.parse(savedData));
        else setWorkspaceData(null); 
     }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChapter, modules]);

  const handleChapterChange = (id: string) => {
      setActiveChapter(id);
      router.push(`?course=${courseSlug}&chapter=${id}`);
  };

  const handleAddSection = () => {
    const newSectionId = `sec-${Date.now()}`;
    const newModules: Module[] = [...modules, { id: newSectionId, section: `Bagian Baru ${modules.length + 1}`, chapters: [] }];
    updateModulesAndSave(newModules);
    setEditingSectionId(newSectionId);
    setExpandedSection(newSectionId);
  };

  const handleSaveSectionTitle = (id: string, newTitle: string) => {
    const newModules = modules.map(mod => mod.id === id ? { ...mod, section: newTitle || "Bagian Tanpa Nama" } : mod);
    updateModulesAndSave(newModules);
    setEditingSectionId(null);
  };

  const handleDeleteSection = (id: string) => {
    const mod = modules.find(m => m.id === id);
    if (mod && mod.chapters.length > 0) return showToast('error', 'Kosongkan bab di dalam bagian ini terlebih dahulu.');
    const newModules = modules.filter(m => m.id !== id);
    updateModulesAndSave(newModules);
    showToast('success', 'Bagian berhasil dihapus.');
  };

  const handleAddChapter = (targetSectionId: string, type: 'article' | 'video' | 'quiz') => {
    const newChapterId = `${Date.now()}`;
    const newChapterTitle = type === 'article' ? 'Artikel Baru' : type === 'video' ? 'Video Baru' : 'Kuis Baru';
    
    const newModules = modules.map(mod => 
      mod.id === targetSectionId 
        ? { ...mod, chapters: [...mod.chapters, { id: newChapterId, title: newChapterTitle, type, status: 'draft' }] } 
        : mod
    );
    updateModulesAndSave(newModules);
    setExpandedSection(targetSectionId); 
    handleChapterChange(newChapterId);
  };

  const handleSaveActiveChapter = (payload: Record<string, unknown>) => {
      if (!chapterTitle.trim()) return showToast('error', 'Judul materi tidak boleh kosong!');
      
      const newModules = modules.map(mod => ({
        ...mod,
        chapters: mod.chapters.map(c => c.id === activeChapter ? { ...c, title: chapterTitle, status: 'published' } : c)
      }));
      updateModulesAndSave(newModules);

      const dataToSave = { title: chapterTitle, type: activeType, ...payload, updatedAt: new Date().toISOString() };
      localStorage.setItem(`db_content_${courseSlug}_${activeChapter}`, JSON.stringify(dataToSave));
      
      showToast('success', 'Perubahan berhasil disimpan!');
  };

  const handleDeleteActiveChapter = () => {
      let nextId = '';
      const newModules = modules.map(mod => ({ ...mod, chapters: mod.chapters.filter(c => c.id !== activeChapter) }));
      for (const m of newModules) { if (m.chapters.length > 0) { nextId = m.chapters[0].id; break; } }
      
      updateModulesAndSave(newModules); 
      localStorage.removeItem(`db_content_${courseSlug}_${activeChapter}`); 

      if (nextId) handleChapterChange(nextId);
      showToast('success', 'Bab berhasil dihapus permanen.');
  };

  return (
    <div className={`flex flex-col h-screen bg-[#fafafa] dark:bg-[#0a0a0a] ${inter.className}`}>
      <header className="h-16 shrink-0 bg-white dark:bg-[#0a0a0a] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 z-40 sticky top-0 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href={`/course-editor?course=${courseSlug}`} className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800 transition-colors" title="Kembali ke Pengaturan Kelas">
            <span className="material-symbols-outlined text-[20px] block">arrow_back</span>
            <span className="hidden sm:inline text-sm font-bold">Course Hub</span>
          </Link>
          <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 hidden md:block mx-1"></div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`hidden md:flex items-center justify-center p-2 rounded-xl transition-all duration-200 ${isSidebarOpen ? 'bg-cyan-50 text-[#00BCD4] dark:bg-cyan-900/30' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
            <span className="material-symbols-outlined text-[22px] block">{isSidebarOpen ? 'view_sidebar' : 'menu'}</span>
          </button>
          <div className="hidden lg:flex flex-col justify-center ml-2">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#00BCD4] uppercase tracking-widest mb-0.5"><span className="material-symbols-outlined text-[14px]">school</span><span>Canvas Builder</span></div>
            <p className={`text-sm font-bold text-slate-800 dark:text-slate-200 truncate ${googleSansAlt.className}`}>{courseSlug.toUpperCase()}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden lg:inline text-xs font-medium text-slate-400">Sinkron dengan Student App</span>
          <button onClick={() => showToast('success', 'Sinkronisasi berhasil!')} className={`flex items-center gap-2 px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full text-sm font-bold transition-all hover:opacity-90 active:scale-95 shadow-md ${googleSansAlt.className}`}>
            <span className="material-symbols-outlined text-[18px]">cloud_sync</span><span className="hidden sm:inline">Publish Semua</span><span className="sm:hidden">Publish</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        <aside className={`absolute md:relative z-30 h-full w-72 md:w-80 bg-[#f8fafc] dark:bg-[#111111] border-r border-slate-200/60 dark:border-slate-800/60 flex flex-col transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:hidden md:w-0 md:border-none'}`}>
          <div className="p-5 flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-[#0a0a0a]">
            <h2 className={`text-sm font-extrabold text-slate-800 dark:text-white uppercase tracking-wider ${googleSansAlt.className}`}>Kurikulum</h2>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-4 custom-scrollbar relative">
            <div className="space-y-3">
            {modules.map((mod) => {
              const isExpanded = expandedSection === mod.id;
              return (
                <div key={mod.id} className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 transition-all group/section relative">
                  <div className="w-full flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors pr-2 h-11 rounded-t-2xl">
                    {editingSectionId === mod.id ? (
                      <div className="flex-1 px-4 min-w-0"><input autoFocus defaultValue={mod.section} onBlur={(e) => handleSaveSectionTitle(mod.id, e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSaveSectionTitle(mod.id, e.currentTarget.value); if (e.key === 'Escape') setEditingSectionId(null); }} className="w-full bg-transparent border-b border-[#00BCD4] outline-none text-xs font-bold uppercase tracking-wider text-[#00BCD4] dark:text-cyan-400 py-1" /></div>
                    ) : (
                      <button onDoubleClick={() => setEditingSectionId(mod.id)} onClick={() => setExpandedSection(isExpanded ? '' : mod.id)} className="flex-1 min-w-0 h-full flex items-center px-4 outline-none text-left">
                        <p className={`text-xs font-bold uppercase tracking-wider truncate mr-2 transition-colors ${isExpanded ? 'text-[#00BCD4]' : 'text-slate-600 dark:text-slate-400'}`}>{mod.section}</p>
                      </button>
                    )}
                    {!editingSectionId && (
                      <div className="shrink-0 flex items-center gap-1">
                        <div className="relative">
                          <button onClick={(e) => { e.stopPropagation(); setOpenSectionMenuId(openSectionMenuId === mod.id ? null : mod.id); }} className={`p-1 rounded-md flex items-center justify-center transition-colors ${openSectionMenuId === mod.id ? 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-white' : 'text-slate-400 hover:bg-slate-200 hover:text-slate-800 dark:hover:bg-slate-700 dark:hover:text-white opacity-0 group-hover/section:opacity-100'}`}>
                             <span className="material-symbols-outlined text-[16px] block">more_vert</span>
                          </button>
                          {openSectionMenuId === mod.id && (
                            <div ref={sectionMenuRef} className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 py-2 origin-top-right animate-in fade-in zoom-in-95 duration-200">
                               <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tambah Materi</div>
                               <button onClick={(e) => { e.stopPropagation(); handleAddChapter(mod.id, 'article'); setOpenSectionMenuId(null); }} className="w-full text-left px-4 py-2 text-sm font-medium hover:bg-cyan-50 hover:text-cyan-600 dark:hover:bg-slate-700 flex items-center gap-3"><span className="material-symbols-outlined text-[16px] text-cyan-500">article</span> Artikel Teks</button>
                               <button onClick={(e) => { e.stopPropagation(); handleAddChapter(mod.id, 'video'); setOpenSectionMenuId(null); }} className="w-full text-left px-4 py-2 text-sm font-medium hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-700 flex items-center gap-3"><span className="material-symbols-outlined text-[16px] text-blue-500">play_circle</span> Video Materi</button>
                               <button onClick={(e) => { e.stopPropagation(); handleAddChapter(mod.id, 'quiz'); setOpenSectionMenuId(null); }} className="w-full text-left px-4 py-2 text-sm font-medium hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-slate-700 flex items-center gap-3"><span className="material-symbols-outlined text-[16px] text-amber-500">quiz</span> Kuis Evaluasi</button>
                               <div className="h-px w-full bg-slate-100 dark:bg-slate-700/50 my-2"></div>
                               <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Pengaturan Bagian</div>
                               <button onClick={(e) => { e.stopPropagation(); setEditingSectionId(mod.id); setOpenSectionMenuId(null); }} className="w-full text-left px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3"><span className="material-symbols-outlined text-[16px]">edit</span> Ubah Nama</button>
                               <button onClick={(e) => { e.stopPropagation(); handleDeleteSection(mod.id); setOpenSectionMenuId(null); }} className="w-full text-left px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3"><span className="material-symbols-outlined text-[16px]">delete</span> Hapus Bagian</button>
                            </div>
                          )}
                        </div>
                        <button onClick={() => setExpandedSection(isExpanded ? '' : mod.id)} className="p-1 rounded-md flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors">
                          <span className={`material-symbols-outlined text-[18px] transition-transform duration-300 ${isExpanded ? 'rotate-180 text-[#00BCD4]' : ''}`}>expand_more</span>
                        </button>
                      </div>
                    )}
                  </div>
                  {/* ✨ FIX TAILWIND: max-h-[800px] -> max-h-200 ✨ */}
                  <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-200 opacity-100 pb-3 px-3' : 'max-h-0 opacity-0'}`}>
                    <div className="space-y-1 mt-1 border-t border-slate-100 dark:border-slate-800 pt-2">
                      {mod.chapters.length === 0 ? (
                        <div className="py-4 px-3 text-center border border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50 m-2">
                           <span className="material-symbols-outlined text-slate-300 text-2xl mb-1">post_add</span>
                           <p className="text-xs font-medium text-slate-500 leading-relaxed">Bagian ini belum memiliki materi.<br/>Gunakan menu titik tiga (⋮) di atas untuk menambahkan.</p>
                        </div>
                      ) : (
                        mod.chapters.map((chapter) => (
                          <button key={chapter.id} onClick={() => handleChapterChange(chapter.id)} className={`w-full text-left flex items-center justify-between gap-3 p-2.5 rounded-xl transition-all group ${activeChapter === chapter.id ? 'bg-[#00BCD4]/10 dark:bg-cyan-900/20 shadow-sm border border-[#00BCD4]/30' : 'hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'}`}>
                            <div className="flex items-center gap-2.5 overflow-hidden">
                              <span className={`material-symbols-outlined text-[18px] ${activeChapter === chapter.id ? 'text-[#00BCD4]' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`}>{chapter.type === 'article' ? 'article' : chapter.type === 'video' ? 'play_circle' : 'quiz'}</span>
                              <p className={`text-xs font-medium truncate ${activeChapter === chapter.id ? 'text-[#00BCD4] font-bold' : 'text-slate-600 dark:text-slate-400'}`}>{chapter.title}</p>
                            </div>
                            <span className={`size-1.5 rounded-full shrink-0 ${chapter.status === 'draft' ? 'bg-amber-400' : 'bg-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity'}`}></span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
            <button onClick={handleAddSection} className="w-full py-3 mt-4 mb-24 rounded-xl text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-[#00BCD4] hover:bg-[#00BCD4]/5 border-2 border-transparent hover:border-dashed hover:border-[#00BCD4]/30 transition-all flex items-center justify-center gap-2 group">
               <span className="material-symbols-outlined text-[18px] group-hover:rotate-90 transition-transform duration-300">add</span> Tambah Bagian Baru
            </button>
          </div>
        </aside>

        <main className="flex-1 relative flex flex-col bg-white dark:bg-[#0a0a0a] overflow-y-auto custom-scrollbar scroll-smooth">
          {activeModuleInfo ? (
            <>
              {activeType === 'article' && <ArticleWorkspace key={activeChapter} title={chapterTitle} setTitle={setChapterTitle} initialContent={workspaceData?.content as string || ''} onContentUpdate={(html: string) => articleHTMLRef.current = html} onSave={handleSaveActiveChapter} onDelete={handleDeleteActiveChapter} />}
              {activeType === 'video' && <VideoWorkspace key={activeChapter} title={chapterTitle} setTitle={setChapterTitle} initialUrl={workspaceData?.url as string || ''} onSave={handleSaveActiveChapter} onDelete={handleDeleteActiveChapter} />}
              {/* ✨ FIX: Menghapus "as any[]" dan menggantinya dengan tipe "Array<Record<string, unknown>>" yang aman ✨ */}
              {activeType === 'quiz' && <QuizWorkspace key={activeChapter} title={chapterTitle} setTitle={setChapterTitle} initialQuestions={(workspaceData?.questions as Array<Record<string, unknown>>) || []} onSave={handleSaveActiveChapter} onDelete={handleDeleteActiveChapter} />}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
               <span className="material-symbols-outlined text-6xl mb-4 opacity-20">inventory_2</span>
               <p className="font-bold">Belum ada bab yang dibuat.</p>
               <p className="text-sm mt-1">Gunakan ikon titik tiga (⋮) pada daftar bagian di kiri.</p>
            </div>
          )}
        </main>
        {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm z-20 md:hidden"></div>}
      </div>
    </div>
  );
}

export default function Page() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen bg-[#0a0a0a] text-white">Loading Editor Hub...</div>}>
            <BuilderContent />
        </Suspense>
    )
}