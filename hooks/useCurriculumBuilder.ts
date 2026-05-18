import { useState, useCallback } from 'react';
import Cookies from 'js-cookie';
import { useToast } from '@/components/ui/ToastProvider';

const RAW_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
const BASE_URL = RAW_BASE_URL.endsWith('/') ? RAW_BASE_URL.slice(0, -1) : RAW_BASE_URL;
const OWNER_ID = process.env.NEXT_PUBLIC_OWNER_ID || '';

// ✨ FIX: Tambahkan order_index agar kita bisa memaksa pengurutan
export interface ApiMaterial {
  material_id: number | string;
  title: string;
  type: string;
  content_html?: string | null;
  file_url?: string | null;
  order_index?: number; 
}

export interface ApiSection {
  section_id: number | string;
  title: string;
  order_index?: number;
  materials?: ApiMaterial[];
}

export interface Chapter {
  id: string;
  title: string;
  type: 'article' | 'document';
  status: 'published' | 'draft';
  content_html?: string;
  file_url?: string;
}

export interface Module {
  id: string;
  section: string;
  chapters: Chapter[];
}

export const useCurriculumBuilder = (courseSlug: string) => {
  const { showToast } = useToast();
  
  const [modules, setModules] = useState<Module[]>([]);
  const [courseTitle, setCourseTitle] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const getToken = useCallback(() => {
    return Cookies.get('api_token') || process.env.NEXT_PUBLIC_API_TOKEN || '';
  }, []);

  const fetchCourseInfo = useCallback(async () => {
    if (!BASE_URL || !courseSlug) return;
    try {
      const response = await fetch(`${BASE_URL}/detail/course/${courseSlug}`, {
        headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${getToken()}` }
      });
      if (response.ok) {
        const resJson = await response.json();
        if (resJson.detail?.title) setCourseTitle(resJson.detail.title);
      }
    } catch (error) {
      console.error("Gagal mengambil info kelas:", error);
    }
  }, [courseSlug, getToken]);

  const fetchCurriculum = useCallback(async () => {
    if (!BASE_URL || !courseSlug) {
        setIsLoading(false);
        return [];
    }
    
    setIsLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/detail/course_curriculum/${courseSlug}`, {
        headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${getToken()}` }
      });

      if (!response.ok) {
         setModules([]);
         return [];
      }
      
      const resJson = await response.json();

      if (resJson.status === 'success' && resJson.detail?.curriculum) {
        
        // ✨ ALGORITMA PENGURUTAN 1: Urutkan Section secara paksa berdasarkan order_index (atau section_id jika kosong)
        const rawSections = resJson.detail.curriculum as ApiSection[];
        rawSections.sort((a, b) => {
           const orderA = a.order_index ?? Number(a.section_id);
           const orderB = b.order_index ?? Number(b.section_id);
           return orderA - orderB;
        });

        const mappedModules: Module[] = rawSections.map((sec: ApiSection) => {
          
          // ✨ ALGORITMA PENGURUTAN 2: Urutkan Materials di dalam Section secara paksa
          const rawMaterials = sec.materials || [];
          rawMaterials.sort((a, b) => {
             const matOrderA = a.order_index ?? Number(a.material_id);
             const matOrderB = b.order_index ?? Number(b.material_id);
             return matOrderA - matOrderB;
          });

          return {
            id: String(sec.section_id),
            section: sec.title || `Bagian ${sec.section_id}`,
            chapters: rawMaterials.map((mat: ApiMaterial) => {
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
          };
        });
        
        setModules(mappedModules);
        return mappedModules;
      } else {
        setModules([]);
        return [];
      }
    } catch (error) {
      console.error(error);
      showToast('error', 'Gagal memuat kurikulum dari server.');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [courseSlug, getToken, showToast]);

  // (CATATAN: Biarkan fungsi handleAddSection, handleAddChapter, dsb yang ada di bawahnya tetap seperti sebelumnya, jangan dihapus)

  // ✨ UPGRADE 2: UX Loading & Fallback Pencari ID Otomatis
  const handleAddSection = async (onSuccess: (newSectionId: string) => void) => {
    setIsProcessing(true);
    showToast('loading', 'Menyiapkan bagian kelas baru...'); // Notifikasi UX
    
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
      
      // 1. Selalu paksa sinkronisasi kurikulum
      const freshModules = await fetchCurriculum(); 
      
      // 2. Coba tangkap ID dari berbagai kemungkinan format Backend
      const newSectionId = res.data?.section_id || res.detail?.section_id || res.section_id || res.id;
      
      if (newSectionId) {
         onSuccess(String(newSectionId));
      } else if (freshModules && freshModules.length > 0) {
         // 3. Fallback Ekstrem: Jika API tidak membalas ID, tangkap otomatis dari section paling bawah
         const lastSection = freshModules[freshModules.length - 1];
         onSuccess(lastSection.id);
      }
      
      showToast('success', 'Bagian baru berhasil ditambahkan.');
    } catch (error) {
      console.error(error);
      showToast('error', 'Gagal menambahkan bagian baru.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveSectionTitle = async (id: string, newTitle: string) => {
    const mod = modules.find(m => m.id === id);
    if (!mod || mod.section === newTitle) return true;

    try {
      const response = await fetch(`${BASE_URL}/update/course_section/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify({ title: newTitle || "Bagian Tanpa Nama" })
      });
      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      fetchCurriculum();
      return true;
    } catch (error) {
      console.error(error);
      showToast('error', 'Gagal menyimpan nama bagian.');
      return false;
    }
  };

  const handleDeleteSection = async (id: string) => {
    const mod = modules.find(m => m.id === id);
    if (mod && mod.chapters.length > 0) {
        showToast('error', 'Kosongkan isi bab terlebih dahulu untuk menghapus bagian ini.');
        return false;
    }
    
    setIsProcessing(true);
    try {
      const response = await fetch(`${BASE_URL}/delete/course_section/${id}`, {
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` }
      });
      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      showToast('success', 'Bagian berhasil dihapus.');
      fetchCurriculum();
      return true;
    } catch (error) {
      console.error(error);
      showToast('error', 'Gagal menghapus bagian.');
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  // ✨ UPGRADE 3: UX Loading & Fallback Pencari ID Otomatis
  const handleAddChapter = async (targetSectionId: string, type: 'article' | 'document', onSuccess: (newChapterId: string) => void) => {
    setIsProcessing(true);
    showToast('loading', 'Menyiapkan materi baru...'); // Notifikasi UX
    
    try {
      const mod = modules.find(m => m.id === targetSectionId);
      const orderIndex = mod ? mod.chapters.length + 1 : 1;
      const parsedSectionId = isNaN(Number(targetSectionId)) ? targetSectionId : Number(targetSectionId);
      const parsedOwnerId = isNaN(Number(OWNER_ID)) ? OWNER_ID : Number(OWNER_ID);
      const dynamicTitle = `${type === 'article' ? 'Artikel' : 'Dokumen'} ke-${orderIndex}`;

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
      
      // 1. Selalu paksa sinkronisasi kurikulum
      const freshModules = await fetchCurriculum(); 
      
      // 2. Coba tangkap ID
      const newChapterId = res.data?.material_id || res.detail?.material_id || res.material_id || res.id;
      
      if (newChapterId) {
         onSuccess(String(newChapterId));
      } else if (freshModules) {
         // 3. Fallback Ekstrem: Tangkap otomatis materi paling bawah di section tersebut
         const targetSection = freshModules.find(m => m.id === targetSectionId);
         if (targetSection && targetSection.chapters.length > 0) {
            onSuccess(targetSection.chapters[targetSection.chapters.length - 1].id);
         }
      }
      
      showToast('success', 'Materi baru berhasil ditambahkan.');
    } catch (error) {
      console.error(error);
      showToast('error', 'Gagal menambahkan materi baru.');
    } finally {
      setIsProcessing(false);
    }
  };

  // ✨ PERBAIKAN URL: Hapus courseSlug dari endpoint
  const handleSaveActiveChapter = async (activeChapterId: string, chapterTitle: string, payload: { content?: string, url?: string }) => {
      if (!chapterTitle.trim()) {
          showToast('error', 'Judul materi tidak boleh kosong!');
          return false;
      }
      
      setIsProcessing(true);
      try {
        const requestPayload = { 
          title: chapterTitle, 
          content_html: payload.content || '',
          file_url: payload.url || ''
        };

        // URL dikembalikan ke format normal: /update/course_material/{id}
        const response = await fetch(`${BASE_URL}/update/course_material/${activeChapterId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
          body: JSON.stringify(requestPayload)
        });

        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        showToast('success', 'Perubahan berhasil disimpan ke server!');
        fetchCurriculum();
        return true;
      } catch (error) {
        console.error(error);
        showToast('error', 'Gagal menyimpan perubahan materi.');
        return false;
      } finally {
        setIsProcessing(false);
      }
  };

  // ✨ PERBAIKAN URL: Hapus courseSlug dari endpoint
  const handleDeleteActiveChapter = async (activeChapterId: string) => {
      setIsProcessing(true);
      try {
        // URL dikembalikan ke format normal: /delete/course_material/{id}
        const response = await fetch(`${BASE_URL}/delete/course_material/${activeChapterId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` }
        });

        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        showToast('success', 'Materi berhasil dihapus.');
        fetchCurriculum();
        return true;
      } catch (error) {
        console.error(error);
        showToast('error', 'Gagal menghapus materi.');
        return false;
      } finally {
        setIsProcessing(false);
      }
  };

  return {
    modules, courseTitle, isLoading, isProcessing,
    fetchCourseInfo, fetchCurriculum,
    handleAddSection, handleSaveSectionTitle, handleDeleteSection,
    handleAddChapter, handleSaveActiveChapter, handleDeleteActiveChapter
  };
};