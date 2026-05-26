import { useState, useCallback } from 'react';
import Cookies from 'js-cookie';
import { useSearchParams } from 'next/navigation';
import { useToast } from '@/components/ui/ToastProvider';

const RAW_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
const BASE_URL = RAW_BASE_URL.endsWith('/') ? RAW_BASE_URL.slice(0, -1) : RAW_BASE_URL;

export interface VideoDetail {
  video_id?: number; 
  video_url: string;
  video_title: string;
  platform_type: string;
  video_duration: string;
}

export interface BatchSection {
  batch_id?: number; 
  owner_id?: number;
  course_id?: number;
  batch_period: string;
  batch_name: string;
  videos: VideoDetail[];
}

export const useVideosTab = (propCourseSlug: string = '') => {
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  
  // Mengambil ID Kelas dari URL (prioritas) atau dari Props
  // Jika URL adalah /course-editor?course=28, maka activeCourseId = 28
  const urlCourseId = searchParams.get('course');
  const activeCourseId = urlCourseId || propCourseSlug;

  const [batches, setBatches] = useState<BatchSection[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper Pengambil Token
  const getActiveToken = useCallback(() => {
    return Cookies.get('api_token') || process.env.NEXT_PUBLIC_API_TOKEN || '';
  }, []);

  // Helper Pengambil Owner ID 
  const getActiveOwnerId = useCallback(() => {
    const cookieOwnerId = Cookies.get('owner_id') || Cookies.get('api_owner_id');
    return cookieOwnerId || process.env.NEXT_PUBLIC_OWNER_ID || '4409';
  }, []);

  // 🔄 FETCH DATA DENGAN PAGINASI
  const fetchBatches = useCallback(async (page: number = 1, isBackground = false) => {
    if (!activeCourseId) {
      setIsLoading(false);
      return;
    }

    if (!isBackground) setIsLoading(true);
    
    try {
      if (!BASE_URL) throw new Error('ENV_MISSING');
      
      // ✨ FORMAT ENDPOINT SESUAI ARAHAN: <<baseUrl>>/table/course_video/28/<<currentPage>>
      const endpoint = `${BASE_URL}/table/course_video/${activeCourseId}/${page}`;
      const response = await fetch(endpoint, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${getActiveToken()}`
        }
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const resJson = await response.json();
      
      // ✨ INTEGRASI RESPONSE JSON KE STATE
      const tableData = Array.isArray(resJson.tableData) ? resJson.tableData : [];
      setBatches(tableData);
      
      setCurrentPage(Number(resJson.currentPage || page));
      setTotalPages(Number(resJson.totalPages || 1));
      setTotalRecords(Number(resJson.totalRecords || 0));

    } catch (error) {
      console.error("Gagal memuat daftar batch:", error);
      if (!isBackground) showToast('error', 'Gagal memuat daftar sesi pembelajaran.');
      setBatches([]);
      setTotalRecords(0);
      setTotalPages(1);
    } finally {
      if (!isBackground) setIsLoading(false);
    }
  }, [activeCourseId, showToast, getActiveToken]);

  // 📝 SUBMIT DATA (ADD & EDIT)
  const submitBatch = async (payloadData: Partial<BatchSection>, modalMode: 'add' | 'edit') => {
    setIsSubmitting(true);
    try {
      if (!BASE_URL) throw new Error('ENV_MISSING');

      // Pembersihan payload video (hapus video_id jika undefined/baru agar DB tidak menolak)
      const sanitizedVideos = (payloadData.videos || []).map(vid => {
        const cleanVid = { ...vid };
        if (!cleanVid.video_id) delete cleanVid.video_id; 
        return cleanVid;
      });

      const payload = {
        owner_id: Number(getActiveOwnerId()), 
        course_id: Number(activeCourseId),
        batch_name: payloadData.batch_name,
        batch_period: payloadData.batch_period,
        videos: sanitizedVideos 
      };

      const endpoint = modalMode === 'add' 
        ? `${BASE_URL}/add/course_video` 
        : `${BASE_URL}/update/course_video/${payloadData.batch_id}`;

      const method = modalMode === 'add' ? 'POST' : 'PUT';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getActiveToken()}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      showToast('success', modalMode === 'add' ? 'Sesi baru berhasil ditambahkan!' : 'Sesi berhasil diperbarui!');
      
      // Reload tabel agar mendapat data terbaru dari server
      await fetchBatches(currentPage, true); 
      return true;
    } catch (error: unknown) {
      console.error("Gagal menyimpan batch:", error);
      showToast('error', 'Gagal menyimpan sesi ke server.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🗑️ DELETE DATA
  const deleteBatch = async (batchId: string) => {
    if (!confirm("Hapus sesi ini beserta seluruh video di dalamnya secara permanen?")) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`${BASE_URL}/delete/course_video/${batchId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getActiveToken()}`
        }
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      showToast('success', 'Sesi berhasil dihapus permanen.');
      
      // Management Paginasi: Mundur 1 halaman jika menghapus data terakhir di halaman ini
      const targetPage = (batches.length === 1 && currentPage > 1) ? currentPage - 1 : currentPage;
      await fetchBatches(targetPage);
    } catch (error) {
      console.error("Gagal menghapus batch:", error);
      showToast('error', 'Gagal menghapus sesi. Coba lagi.');
      setIsLoading(false);
    }
  };

  return {
    batches, isLoading, isSubmitting, currentPage, totalPages, totalRecords,
    fetchBatches, submitBatch, deleteBatch
  };
};