'use client';

import React, { useState, useEffect, Suspense, useCallback, useRef } from 'react';
import { DM_Sans, Inter } from 'next/font/google';
import { useToast } from '@/components/ui/ToastProvider';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link'; 
import Cookies from 'js-cookie';

import ArticleWorkspace from '@/components/builder/ArticleWorkspace';
import DocumentWorkspace from '@/components/builder/DocumentWorkspace';

const inter = Inter({ subsets: ['latin'] });
const googleSansAlt = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '700', '800'] });

const RAW_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
const BASE_URL = RAW_BASE_URL.endsWith('/') ? RAW_BASE_URL.slice(0, -1) : RAW_BASE_URL;

const OWNER_ID = process.env.NEXT_PUBLIC_OWNER_ID || '';

// Sesuai dengan Rencana Database Backend Anda
interface ApiMaterial {
  material_id: number | string;
  title: string;
  type: string; // Backend mungkin mengirim 'article', 'document', 'video', dll
  content_html?: string | null;
  file_url?: string | null;
}

interface ApiSection {
  section_id: number | string;
  title: string;
  materials?: ApiMaterial[];
}

interface Chapter {
  id: string;
  title: string;
  type: 'article' | 'document'; // Frontend secara ketat HANYA menggunakan dua ini
  status: 'published' | 'draft';
  content_html?: string;
  file_url?: string;
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
  
  const courseSlug = searchParams.get('course') || 'default-course';
  const chapterQueryId = searchParams.get('chapter') || '';

  const [modules, setModules] = useState<Module[]>([]);
  const [courseTitle, setCourseTitle] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // States UI
  const [expandedSection, setExpandedSection] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [openSectionMenuId, setOpenSectionMenuId] = useState<string | null>(null); 

  // States Workspace (Editor Aktif)
  const [activeChapter, setActiveChapter] = useState(chapterQueryId);
  const [activeType, setActiveType] = useState<'article' | 'document'>('article');
  const [chapterTitle, setChapterTitle] = useState('');
  const [workspaceData, setWorkspaceData] = useState<Record<string, unknown> | null>(null);
  
  const articleHTMLRef = useRef<string>("");
  const sectionMenuRef = useRef<HTMLDivElement>(null);

  const getToken = useCallback(() => {
    return Cookies.get('api_token') || process.env.NEXT_PUBLIC_API_TOKEN || '';
  }, []);

  // --- 1. FETCH INFO KELAS (JUDUL) ---
  const fetchCourseInfo = useCallback(async () => {
    try {
      if (!BASE_URL) return;
      const response = await fetch(`${BASE_URL}/detail/course/${courseSlug}`, {
        headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${getToken()}` }
      });
      if (response.ok) {
        const resJson = await response.json();
        if (resJson.detail?.title) {
          setCourseTitle(resJson.detail.title);
        }
      }
    } catch (error) {
      console.error("Gagal mengambil info kelas:", error);
    }
  }, [courseSlug, getToken]);

  // --- 2. FETCH CURRICULUM ---
  const fetchCurriculum = useCallback(async () => {
    setIsLoading(true);
    try {
      if (!BASE_URL) return;
      
      const response = await fetch(`${BASE_URL}/detail/course_curriculum/${courseSlug}`, {
        headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${getToken()}` }
      });

      if (!response.ok) {
         setModules([]);
         return;
      }
      
      const resJson = await response.json();

      if (resJson.status === 'success' && resJson.detail?.curriculum) {
        const mappedModules: Module[] = resJson.detail.curriculum.map((sec: ApiSection) => ({
          id: String(sec.section_id),
          section: sec.title || `Bagian ${sec.section_id}`,
          chapters: (sec.materials || []).map((mat: ApiMaterial) => {
            // ✨ FITUR SANITIZER EXPERT ✨
            // Jika backend ngeyel mengirim 'video' atau tipe lain, paksa menjadi 'document' di UI Frontend
            const strictType: 'article' | 'document' = mat.type === 'article' ? 'article' : 'document';
            
            return {
              id: String(mat.material_id),
              title: mat.title || `Materi ${mat.material_id}`,
              type: strictType,
              status: (mat.content_html || mat.file_url) ? 'published' : 'draft',
              content_html: mat.content_html || '',
              file_url: mat.file_url || ''
            };
          })
        }));
        
        setModules(mappedModules);
      } else {
        setModules([]);
      }
    } catch (error) {
      console.error(error);
      showToast('error', 'Gagal memuat kurikulum dari server.');
    } finally {
      setIsLoading(false);
    }
  }, [courseSlug, getToken, showToast]);

  useEffect(() => {
    fetchCourseInfo();
    fetchCurriculum();
  }, [fetchCourseInfo, fetchCurriculum]);

  // --- 3. LOGIC AUTO-SELECT & UPDATE WORKSPACE ---
  useEffect(() => {
    if (modules.length === 0) {
       setWorkspaceData(null);
       return;
    }

    if (!activeChapter && modules[0]?.chapters.length > 0) {
       const firstChapterId = modules[0].chapters[0].id;
       setActiveChapter(firstChapterId);
       router.replace(`?course=${courseSlug}&chapter=${firstChapterId}`);
       return;
    }

    let currentInfo: Chapter | undefined = undefined;
    for (const mod of modules) {
      const found = mod.chapters.find((c) => c.id === activeChapter);
      if (found) {
        currentInfo = found;
        break;
      }
    }

    if (currentInfo) {
       setActiveType(currentInfo.type);
       setChapterTitle(currentInfo.title);
       setWorkspaceData({
          content: currentInfo.content_html || '',
          url: currentInfo.file_url || '',
          description: '' 
       });
    } else {
       setWorkspaceData(null);
    }
  }, [modules, activeChapter, courseSlug, router]);

  // --- 4. LOGIC EXPAND SIDEBAR ---
  useEffect(() => {
     if (activeChapter && modules.length > 0) {
        const parentSection = modules.find(m => m.chapters.some(c => c.id === activeChapter));
        if (parentSection) {
           setExpandedSection(parentSection.id);
        }
     }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChapter]); 

  // Handle klik di luar pop-up menu section
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.section-menu-container')) {
        setOpenSectionMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChapterChange = (id: string) => {
      setActiveChapter(id);
      router.push(`?course=${courseSlug}&chapter=${id}`);
  };

  // --- API ACTIONS ---

  const handleAddSection = async () => {
    setIsProcessing(true);
    try {
      const parsedOwnerId = isNaN(Number(OWNER_ID)) ? OWNER_ID : Number(OWNER_ID);
      const parsedCourseId = isNaN(Number(courseSlug)) ? courseSlug : Number(courseSlug);

      const sectionCount = modules.length + 1;
      const payload = { 
        owner_id: parsedOwnerId || 1, 
        course_id: parsedCourseId, 
        title: `Bagian ${sectionCount}`,
        order_index: sectionCount
      };

      const response = await fetch(`${BASE_URL}/add/course_section`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      const res = await response.json();
      
      if (res.data?.success && res.data?.section_id) {
         await fetchCurriculum(); 
         setEditingSectionId(String(res.data.section_id));
         setExpandedSection(String(res.data.section_id)); 
         showToast('success', 'Bagian baru berhasil ditambahkan.');
      }
    } catch (error) {
      console.error(error);
      showToast('error', 'Gagal menambahkan bagian baru. Pastikan ID Kelas Valid.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveSectionTitle = async (id: string, newTitle: string) => {
    setEditingSectionId(null);
    const mod = modules.find(m => m.id === id);
    if (!mod || mod.section === newTitle) return;

    try {
      const response = await fetch(`${BASE_URL}/update/course_section/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify({ title: newTitle || "Bagian Tanpa Nama" })
      });
      
      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      fetchCurriculum();
    } catch (error) {
      console.error(error);
      showToast('error', 'Gagal menyimpan nama bagian.');
    }
  };

  const handleDeleteSection = async (id: string) => {
    const mod = modules.find(m => m.id === id);
    if (mod && mod.chapters.length > 0) return showToast('error', 'Kosongkan isi bab terlebih dahulu untuk menghapus bagian ini.');
    
    setIsProcessing(true);
    try {
      const response = await fetch(`${BASE_URL}/delete/course_section/${id}`, {
        method: 'PUT', 
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${getToken()}` 
        }
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      showToast('success', 'Bagian berhasil dihapus.');
      fetchCurriculum();
    } catch (error) {
      console.error(error);
      showToast('error', 'Gagal menghapus bagian. Pastikan rute DELETE diizinkan oleh server.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddChapter = async (targetSectionId: string, type: 'article' | 'document') => {
    setIsProcessing(true);
    try {
      const mod = modules.find(m => m.id === targetSectionId);
      const orderIndex = mod ? mod.chapters.length + 1 : 1;
      
      const parsedSectionId = isNaN(Number(targetSectionId)) ? targetSectionId : Number(targetSectionId);
      const parsedOwnerId = isNaN(Number(OWNER_ID)) ? OWNER_ID : Number(OWNER_ID);

      const typeLabel = type === 'article' ? 'Artikel' : 'Dokumen';
      const dynamicTitle = `${typeLabel} ke-${orderIndex}`;

      const payload = { 
        section_id: parsedSectionId, 
        owner_id: parsedOwnerId || 1, 
        title: dynamicTitle,
        type: type,
        order_index: orderIndex
      };

      const response = await fetch(`${BASE_URL}/add/course_material`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      const res = await response.json();
      
      if (res.data?.success && res.data?.material_id) {
         await fetchCurriculum(); 
         setExpandedSection(targetSectionId); 
         setActiveType(type);
         handleChapterChange(String(res.data.material_id));
         showToast('success', 'Materi baru berhasil ditambahkan.');
      }
    } catch (error) {
      console.error(error);
      showToast('error', 'Gagal menambahkan materi baru. Cek console log.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveActiveChapter = async (payload: { content?: string, url?: string }) => {
      if (!chapterTitle.trim()) return showToast('error', 'Judul materi tidak boleh kosong!');
      
      setIsProcessing(true);
      try {
        const requestPayload = { 
          title: chapterTitle, 
          content_html: payload.content || '',
          file_url: payload.url || ''
        };

        const response = await fetch(`${BASE_URL}/update/course_material/${activeChapter}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
          body: JSON.stringify(requestPayload)
        });

        if (!response.ok) throw new Error(`API Error: ${response.status}`);

        showToast('success', 'Perubahan berhasil disimpan ke server!');
        fetchCurriculum();
      } catch (error) {
        console.error(error);
        showToast('error', 'Gagal menyimpan perubahan materi.');
      } finally {
        setIsProcessing(false);
      }
  };

  const handleDeleteActiveChapter = async () => {
      setIsProcessing(true);
      try {
        const response = await fetch(`${BASE_URL}/delete/course_material/${activeChapter}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}` 
          }
        });

        if (!response.ok) throw new Error(`API Error: ${response.status}`);

        showToast('success', 'Materi berhasil dihapus.');
        
        let nextId = '';
        for (const m of modules) { 
           const otherChap = m.chapters.find(c => c.id !== activeChapter);
           if (otherChap) { nextId = otherChap.id; break; } 
        }
        if (nextId) {
            handleChapterChange(nextId);
        } else {
            setActiveChapter('');
            setWorkspaceData(null);
        }

        fetchCurriculum();
      } catch (error) {
        console.error("Fetch Error Detail:", error);
        showToast('error', 'Gagal menghapus materi. Pastikan rute DELETE diizinkan oleh server CORS.');
      } finally {
        setIsProcessing(false);
      }
  };

  let activeModuleInfo: Chapter | undefined = undefined;
  for (const mod of modules) {
    const found = mod.chapters.find((c) => c.id === activeChapter);
    if (found) { activeModuleInfo = found; break; }
  }

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
          <div className="hidden lg:flex flex-col justify-center ml-2 max-w-37.5 sm:max-w-75">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#00BCD4] uppercase tracking-widest mb-0.5"><span className="material-symbols-outlined text-[14px]">school</span><span>Canvas Builder</span></div>
            <p className={`text-sm font-bold text-slate-800 dark:text-slate-200 truncate ${googleSansAlt.className}`} title={courseTitle || `ID: ${courseSlug}`}>
               {courseTitle || 'Memuat Judul Kelas...'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden lg:inline text-xs font-medium text-slate-400">Sinkron dengan Server</span>
          <button disabled={isProcessing} onClick={() => fetchCurriculum()} className={`flex items-center gap-2 px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full text-sm font-bold transition-all hover:opacity-90 active:scale-95 shadow-md disabled:opacity-50 ${googleSansAlt.className}`}>
            <span className={`material-symbols-outlined text-[18px] ${isProcessing || isLoading ? 'animate-spin' : ''}`}>sync</span><span className="hidden sm:inline">Refresh API</span><span className="sm:hidden">Refresh</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        <aside className={`absolute md:relative z-30 h-full w-72 md:w-80 bg-[#f8fafc] dark:bg-[#111111] border-r border-slate-200/60 dark:border-slate-800/60 flex flex-col transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:hidden md:w-0 md:border-none'}`}>
          <div className="p-5 flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-[#0a0a0a]">
            <h2 className={`text-sm font-extrabold text-slate-800 dark:text-white uppercase tracking-wider ${googleSansAlt.className}`}>Kurikulum</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto px-3 py-4 custom-scrollbar relative">
            {isLoading ? (
               <div className="flex justify-center py-10"><span className="material-symbols-outlined animate-spin text-slate-400 text-3xl">progress_activity</span></div>
            ) : (
              <div className="space-y-3">
              {modules.map((mod, modIdx) => {
                const isExpanded = expandedSection === mod.id;
                return (
                  <div key={`section-${mod.id}-${modIdx}`} className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 transition-all group/section relative">
                    <div className="w-full flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors pr-2 h-11 rounded-t-2xl">
                      {editingSectionId === mod.id ? (
                        <div className="flex-1 px-4 min-w-0"><input autoFocus defaultValue={mod.section} onBlur={(e) => handleSaveSectionTitle(mod.id, e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSaveSectionTitle(mod.id, e.currentTarget.value); if (e.key === 'Escape') setEditingSectionId(null); }} className="w-full bg-transparent border-b border-[#00BCD4] outline-none text-xs font-bold uppercase tracking-wider text-[#00BCD4] dark:text-cyan-400 py-1" /></div>
                      ) : (
                        <button onDoubleClick={() => setEditingSectionId(mod.id)} onClick={() => setExpandedSection(isExpanded ? '' : mod.id)} className="flex-1 min-w-0 h-full flex items-center px-4 outline-none text-left cursor-pointer">
                          <p className={`text-xs font-bold uppercase tracking-wider truncate mr-2 transition-colors ${isExpanded ? 'text-[#00BCD4]' : 'text-slate-600 dark:text-slate-400'}`}>{mod.section}</p>
                        </button>
                      )}
                      {!editingSectionId && (
                        <div className="shrink-0 flex items-center gap-1">
                          <div className="relative section-menu-container">
                            <button onClick={(e) => { e.stopPropagation(); setOpenSectionMenuId(openSectionMenuId === mod.id ? null : mod.id); }} className={`p-1 rounded-md flex items-center justify-center transition-colors ${openSectionMenuId === mod.id ? 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-white' : 'text-slate-400 hover:bg-slate-200 hover:text-slate-800 dark:hover:bg-slate-700 dark:hover:text-white opacity-0 group-hover/section:opacity-100'}`}>
                               <span className="material-symbols-outlined text-[16px] block">more_vert</span>
                            </button>
                            {openSectionMenuId === mod.id && (
                              <div ref={sectionMenuRef} className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 py-2 origin-top-right animate-in fade-in zoom-in-95 duration-200">
                                 <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tambah Materi</div>
                                 <button onClick={(e) => { e.stopPropagation(); handleAddChapter(mod.id, 'article'); setOpenSectionMenuId(null); }} className="w-full text-left px-4 py-2 text-sm font-medium hover:bg-cyan-50 hover:text-cyan-600 dark:hover:bg-slate-700 flex items-center gap-3"><span className="material-symbols-outlined text-[16px] text-cyan-500">article</span> Artikel Teks</button>
                                 <button onClick={(e) => { e.stopPropagation(); handleAddChapter(mod.id, 'document'); setOpenSectionMenuId(null); }} className="w-full text-left px-4 py-2 text-sm font-medium hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-slate-700 flex items-center gap-3"><span className="material-symbols-outlined text-[16px] text-emerald-500">picture_as_pdf</span> File Dokumen / Link</button>
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
                    <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-750 opacity-100 pb-3 px-3' : 'max-h-0 opacity-0'}`}>
                      <div className="space-y-1 mt-1 border-t border-slate-100 dark:border-slate-800 pt-2">
                        {mod.chapters.length === 0 ? (
                          <div className="py-4 px-3 text-center border border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50 m-2">
                             <span className="material-symbols-outlined text-slate-300 text-2xl mb-1">post_add</span>
                             <p className="text-xs font-medium text-slate-500 leading-relaxed">Bagian ini belum memiliki materi.<br/>Gunakan menu titik tiga (⋮) di atas untuk menambahkan.</p>
                          </div>
                        ) : (
                          mod.chapters.map((chapter, chapIdx) => (
                            <button key={`chap-${chapter.id}-${chapIdx}`} onClick={() => handleChapterChange(chapter.id)} className={`w-full text-left flex items-center justify-between gap-3 p-2.5 rounded-xl transition-all group cursor-pointer ${activeChapter === chapter.id ? 'bg-[#00BCD4]/10 dark:bg-cyan-900/20 shadow-sm border border-[#00BCD4]/30' : 'hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'}`}>
                              <div className="flex items-center gap-2.5 overflow-hidden">
                                <span className={`material-symbols-outlined text-[18px] ${activeChapter === chapter.id ? 'text-[#00BCD4]' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`}>
                                   {chapter.type === 'article' ? 'article' : 'picture_as_pdf'}
                                </span>
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
            )}

            <button onClick={handleAddSection} disabled={isProcessing} className="w-full py-3 mt-4 mb-24 rounded-xl text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-[#00BCD4] hover:bg-[#00BCD4]/5 border-2 border-transparent hover:border-dashed hover:border-[#00BCD4]/30 transition-all flex items-center justify-center gap-2 group disabled:opacity-50">
               <span className="material-symbols-outlined text-[18px] group-hover:rotate-90 transition-transform duration-300">add</span> Tambah Bagian Baru
            </button>
          </div>
        </aside>

        <main className="flex-1 relative flex flex-col bg-white dark:bg-[#0a0a0a] overflow-y-auto custom-scrollbar scroll-smooth">
          {activeModuleInfo && workspaceData !== null ? (
            <>
              {activeType === 'article' && <ArticleWorkspace key={`article-${activeChapter}`} title={chapterTitle} setTitle={setChapterTitle} initialContent={workspaceData.content as string || ''} onContentUpdate={(html: string) => articleHTMLRef.current = html} onSave={handleSaveActiveChapter} onDelete={handleDeleteActiveChapter} />}
              {activeType === 'document' && <DocumentWorkspace key={`document-${activeChapter}`} type={activeType} title={chapterTitle} setTitle={setChapterTitle} initialUrl={workspaceData.url as string || ''} initialDescription={workspaceData.description as string || ''} onSave={handleSaveActiveChapter} onDelete={handleDeleteActiveChapter} />}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
               {isLoading ? (
                 <span className="material-symbols-outlined text-[40px] animate-spin mb-3">sync</span>
               ) : (
                 <>
                   <span className="material-symbols-outlined text-6xl mb-4 opacity-20">inventory_2</span>
                   <p className="font-bold">Belum ada bab yang dipilih atau dibuat.</p>
                   <p className="text-sm mt-1">Pilih bab dari daftar materi di menu sebelah kiri.</p>
                 </>
               )}
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