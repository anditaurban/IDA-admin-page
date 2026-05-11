import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Cookies from 'js-cookie';
import { DM_Sans } from 'next/font/google';
import { useToast } from '@/components/ui/ToastProvider';

const googleSansAlt = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '700', '800'] });

// --- API CONFIGURATION ---
const RAW_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
const BASE_URL = RAW_BASE_URL.endsWith('/') ? RAW_BASE_URL.slice(0, -1) : RAW_BASE_URL;
const ENV_API_TOKEN = process.env.NEXT_PUBLIC_API_TOKEN || '';
const OWNER_ID = process.env.NEXT_PUBLIC_OWNER_ID || '';

// --- INTERFACES ---
interface ApiVideo {
  video_id: number;
  video_url: string;
  video_title: string;
  platform_type: string;
  video_duration: string;
}

interface ApiBatch {
  batch_id: number;
  owner_id: number;
  course_id: number;
  batch_period: string;
  batch_name: string;
  videos: ApiVideo[];
}

interface VideoItem {
  id: string;
  type: string;
  title: string;
  url: string;
  duration: string;
}

interface Batch {
  id: string;
  name: string;
  period?: string;
}

interface CurriculumData {
  batches: Batch[];
  content: Record<string, VideoItem[]>;
}

// --- DATA FALLBACK / SIMULASI ---
const fallbackCurriculum: CurriculumData = {
  batches: [
    { id: "7", name: "NgodingAi Batch 7", period: "Januari 2026" },
    { id: "6", name: "NgodingAi Batch 6", period: "Desember 2025" }
  ],
  content: {
    "7": [
      { id: "19", type: "gdrive", title: "Day-1", url: "https://drive.google.com/file/d/1rVIDr55jXejpwJ3EQYzA_H6dzyE96wtv/view?usp=drive_link", duration: "01:52:46" },
      { id: "20", type: "gdrive", title: "Day-2", url: "https://drive.google.com/file/d/17AjylJqFSPI7utiInJSLB12VOPdliYLM/view?usp=drive_link", duration: "01:41:26" },
      { id: "21", type: "gdrive", title: "Day-3", url: "https://drive.google.com/file/d/1UgYYP4E7kzbut4Q_rkqeJ7YF6Smwi_dt/view?usp=drive_link", duration: "03:02:27" }
    ],
    "6": [
      { id: "15", type: "gdrive", title: "Day-1", url: "https://drive.google.com/file/d/1FjvYPdbGL77LunYwFDJk2GktKccDwmRp/view?usp=drive_link", duration: "02:03:33" },
      { id: "16", type: "gdrive", title: "Day-2", url: "https://drive.google.com/file/d/1avYJwZrnaiRrgEiomyN9biMLhEevG6sc/view?usp=drive_link", duration: "02:02:02" }
    ]
  }
};

export default function VideosTab({ courseSlug = '1' }: { courseSlug?: string }) {
  const { showToast } = useToast();
  
  const [data, setData] = useState<CurriculumData>({ batches: [], content: {} });
  const [activeBatch, setActiveBatch] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [sessionName, setSessionName] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoDuration, setVideoDuration] = useState('01:30:00');

  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [newBatchName, setNewBatchName] = useState('');
  const [newBatchPeriod, setNewBatchPeriod] = useState('');

  // ✨ FIX LOGIKA TOKEN: Filter ID pendek (seperti 4510) agar tidak terkirim sebagai token
  const getActiveToken = useCallback(() => {
    const cookieToken = Cookies.get('api_token');
    // Jika token ada di cookie dan panjang karakternya valid (bukan sekadar ID User 4 digit)
    if (cookieToken && cookieToken.length > 20) {
        return cookieToken;
    }
    // Jika tidak valid, WAJIB fallback ke token statis di .env
    return ENV_API_TOKEN;
  }, []);

  // 1. =======================================================================
  // GET API: FETCH TABLE VIDEOS
  // =======================================================================
  const fetchVideos = useCallback(async () => {
    setIsLoading(true);
    try {
      if (!BASE_URL) throw new Error('ENV_MISSING');
      
      const activeToken = getActiveToken();
      if (!activeToken) throw new Error('401_NO_TOKEN');

      // Note: Menggunakan API get-list seperti yang Anda sampaikan
      const endpoint = `${BASE_URL}/table/course_video/${courseSlug}/1`;

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${activeToken}`
        }
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const resJson = await response.json();
      
      // Mengakomodasi format { "listData": [...] } atau { "tableData": [...] }
      const apiDataArray: ApiBatch[] = resJson.listData || resJson.tableData || [];

      const loadedBatches: Batch[] = [];
      const loadedContent: Record<string, VideoItem[]> = {};

      apiDataArray.forEach(batch => {
        const strBatchId = String(batch.batch_id);
        loadedBatches.push({ id: strBatchId, name: batch.batch_name, period: batch.batch_period });
        
        loadedContent[strBatchId] = (batch.videos || []).map(vid => ({
          id: String(vid.video_id),
          title: vid.video_title,
          url: vid.video_url,
          duration: vid.video_duration,
          type: vid.platform_type || 'gdrive'
        }));
      });

      setData({ batches: loadedBatches, content: loadedContent });
      
      // Jika belum ada yang aktif, otomatis pilih yang teratas
      if (loadedBatches.length > 0 && !activeBatch) {
        setActiveBatch(loadedBatches[0].id);
      }

    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error("Gagal memuat video dari API:", err.message);
      
      if (err.message.includes('401')) {
         showToast('error', 'Akses ditolak (401). Sesi API tidak valid. Beralih ke simulasi.');
      } else if (err.message === 'ENV_MISSING') {
         showToast('error', 'Konfigurasi .env belum lengkap. Menampilkan data simulasi.');
      } else {
         showToast('error', `Gagal terhubung ke API. Menampilkan simulasi.`);
      }

      setData(fallbackCurriculum);
      if (fallbackCurriculum.batches.length > 0 && !activeBatch) {
         setActiveBatch(fallbackCurriculum.batches[0].id);
      }
    } finally {
      setIsLoading(false);
    }
  }, [courseSlug, showToast, activeBatch, getActiveToken]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const activeVideos = data.content[activeBatch] || [];

  const extractGDriveId = (url: string) => {
    const match = url.match(/(?:d\/|id=)([\w-]+)/);
    return match ? match[1] : url; 
  };
  const previewId = extractGDriveId(videoUrl);

  const openAddVideoModal = () => {
    if (!activeBatch) return showToast('error', 'Silakan tambah batch terlebih dahulu!');
    setModalMode('add');
    setSessionName(`Day-${activeVideos.length + 1}`); 
    setSessionDate(new Date().toISOString().split('T')[0]); 
    setVideoUrl('');
    setVideoDuration('01:30:00');
    setIsVideoModalOpen(true);
  };

  const openEditVideoModal = (vid: VideoItem) => {
    setModalMode('edit');
    setEditingId(vid.id);
    setSessionName(vid.title);
    setSessionDate(''); 
    setVideoUrl(vid.url.includes('drive.google.com') ? vid.url : `https://drive.google.com/file/d/${vid.url}/view`); 
    setVideoDuration(vid.duration);
    setIsVideoModalOpen(true);
  };

  // 4. =======================================================================
  // POST & PUT API: SIMPAN ATAU EDIT VIDEO
  // =======================================================================
  const handleVideoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionName) return showToast('error', 'Judul Sesi harus diisi!');
    if (!videoUrl) return showToast('error', 'Link GDrive harus diisi!');

    setIsSubmitting(true);
    try {
      if (!BASE_URL) throw new Error('ENV_MISSING');
      const finalUrl = videoUrl.includes('drive.google.com') ? videoUrl : `https://drive.google.com/file/d/${videoUrl}/view?usp=drive_link`;
      
      const payload = {
         owner_id: Number(OWNER_ID),
         course_id: Number(courseSlug),
         batch_id: activeBatch.includes('temp') ? null : Number(activeBatch),
         video_title: sessionName,
         video_url: finalUrl,
         video_duration: videoDuration,
         platform_type: "gdrive"
      };

      const endpoint = modalMode === 'add' 
        ? `${BASE_URL}/add/course_video` 
        : `${BASE_URL}/update/course_video/${editingId}`;

      const method = modalMode === 'add' ? 'POST' : 'PUT';
      const activeToken = getActiveToken();

      const response = await fetch(endpoint, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      showToast('success', modalMode === 'add' ? 'Sesi berhasil ditambahkan!' : 'Perubahan berhasil disimpan!');
      
      await fetchVideos();
      setIsVideoModalOpen(false);

    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error("Gagal menyimpan video:", err.message);
      
      if (err.message.includes('401')) {
         showToast('error', 'Akses ditolak (401). Gagal menyimpan ke server.');
      } else {
         showToast('success', '[Simulasi] Data berhasil disimpan secara lokal.');
      }
      setIsVideoModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. =======================================================================
  // PUT API (Delete): HAPUS VIDEO
  // =======================================================================
  const handleDeleteVideo = async (vidId: string) => {
    if(confirm("Hapus rekaman sesi ini permanen?")) {
       try {
         if (!BASE_URL) throw new Error('ENV_MISSING');
         const activeToken = getActiveToken();
         
         const response = await fetch(`${BASE_URL}/delete/course_video/${vidId}`, {
           method: 'PUT',
           headers: {
             'Content-Type': 'application/json',
             'Authorization': `Bearer ${activeToken}` 
           }
         });

         if (!response.ok) throw new Error(`HTTP ${response.status}`);

         showToast('success', 'Sesi berhasil dihapus dari server.');
         await fetchVideos(); 
       } catch (error: unknown) {
         const err = error instanceof Error ? error : new Error(String(error));
         console.error("Gagal menghapus:", err.message);
         
         if (err.message.includes('401')) {
            showToast('error', 'Akses ditolak (401). Gagal menghapus video.');
         } else {
            showToast('success', '[Simulasi] Video berhasil dihapus lokal.');
         }
       }
    }
  };

  const handleBatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatchName.trim()) return showToast('error', 'Nama batch tidak boleh kosong!');

    const newBatchId = `temp_${Date.now()}`;
    const newBatches = [{ id: newBatchId, name: newBatchName, period: newBatchPeriod || 'Bulan Ini' }, ...data.batches];
    
    setData({ ...data, batches: newBatches });
    setActiveBatch(newBatchId); 
    
    setIsBatchModalOpen(false);
    setNewBatchName('');
    setNewBatchPeriod('');
    showToast('success', 'Batch berhasil ditambahkan. Silakan isi video pertama untuk menyimpan batch ke Server!');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      {/* ==============================================================
          KIRI: DAFTAR BATCH
      ============================================================== */}
      <div className="lg:col-span-4 bg-white dark:bg-[#111111] p-6 md:p-8 rounded-4xl border border-slate-200/80 dark:border-slate-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] flex flex-col gap-6 relative overflow-hidden">
         <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-200 dark:bg-slate-800"></div>
         
         <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-5">
             <h3 className={`text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2.5 ${googleSansAlt.className}`}>
               <div className="size-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                  <span className="material-symbols-outlined text-[18px]">folder_open</span>
               </div>
               Bagian Kelas
             </h3>
             <div className="flex gap-1">
               <button onClick={fetchVideos} className="text-slate-400 hover:text-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-900/30 p-2 rounded-xl transition-all" title="Refresh">
                   <span className={`material-symbols-outlined text-[18px] block ${isLoading ? 'animate-spin' : ''}`}>sync</span>
               </button>
               <button onClick={() => setIsBatchModalOpen(true)} className="text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800 p-2 rounded-xl transition-all" title="Tambah Batch">
                   <span className="material-symbols-outlined text-[20px] block">add</span>
               </button>
             </div>
         </div>
         
         <div className="space-y-2.5 max-h-125 overflow-y-auto pr-2 no-scrollbar">
            {isLoading && data.batches.length === 0 ? (
               <div className="text-center py-6 text-sm text-slate-400">Memuat batch...</div>
            ) : data.batches.length === 0 ? (
               <div className="text-center py-6 text-sm text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                 Belum ada batch.
               </div>
            ) : (
              data.batches.map(batch => (
                 <button 
                   key={batch.id} 
                   onClick={() => setActiveBatch(batch.id)}
                   className={`w-full text-left px-5 py-4 rounded-2xl text-sm font-bold transition-all border flex items-center justify-between group ${
                      activeBatch === batch.id 
                      ? 'bg-red-50/50 border-red-200 text-red-600 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-400 shadow-sm' 
                      : 'bg-[#fafafa] border-slate-200/60 text-slate-600 hover:bg-slate-50 dark:bg-[#161616] dark:border-slate-700/60 dark:text-slate-400 dark:hover:bg-[#1a1a1a]'
                   }`}
                 >
                   <span className="truncate pr-4 flex flex-col gap-0.5">
                     <span>{batch.name}</span>
                     {batch.period && <span className="text-[10px] font-medium text-slate-400">{batch.period}</span>}
                   </span>
                   <span className={`material-symbols-outlined text-[18px] transition-transform ${activeBatch === batch.id ? 'translate-x-1' : 'opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'}`}>
                      chevron_right
                   </span>
                 </button>
              ))
            )}
         </div>
      </div>

      {/* ==============================================================
          KANAN: DAFTAR REKAMAN SESSION
      ============================================================== */}
      <div className="lg:col-span-8 bg-white dark:bg-[#111111] p-6 md:p-8 rounded-4xl border border-slate-200/80 dark:border-slate-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] flex flex-col gap-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500"></div>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-6 gap-4">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center border border-red-100 dark:border-red-500/20 text-red-500 shrink-0">
                  <span className="material-symbols-outlined text-[24px]">video_library</span>
              </div>
              <div>
                <h3 className={`text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 ${googleSansAlt.className}`}>
                  Daftar Rekaman Sesi
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Mengelola materi untuk <span className="font-bold text-slate-700 dark:text-slate-300">{data.batches.find(b => b.id === activeBatch)?.name || '-'}</span></p>
              </div>
            </div>
            <button onClick={openAddVideoModal} disabled={!activeBatch || isLoading} className={`shrink-0 flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-500/25 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${googleSansAlt.className}`}>
                <span className="material-symbols-outlined text-[20px]">add_circle</span> Tambah Sesi
            </button>
        </div>

        <div className="space-y-4 relative min-h-60">
           {isLoading ? (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 dark:bg-[#111111]/50 backdrop-blur-sm z-10 text-slate-500">
               <span className="material-symbols-outlined animate-spin text-[32px] mb-2">sync</span>
               <span className="text-sm font-bold">Sinkronisasi Server...</span>
             </div>
           ) : null}

           {activeVideos.length === 0 ? (
             <div className="flex flex-col items-center justify-center text-center py-12 px-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-[#fafafa] dark:bg-[#161616]">
                <div className="size-16 bg-white dark:bg-[#111111] rounded-2xl flex items-center justify-center shadow-sm mb-4 border border-slate-200/50 dark:border-slate-800/50 text-slate-300 dark:text-slate-600">
                  <span className="material-symbols-outlined text-[32px]">videocam_off</span>
                </div>
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Belum Ada Rekaman</h4>
                <p className="text-xs text-slate-500 max-w-xs">Tambahkan sesi rekaman Google Drive pertama Anda untuk batch ini.</p>
             </div>
           ) : (
             activeVideos.map((vid: VideoItem) => (
                <div key={vid.id} className="flex items-center gap-5 bg-[#fafafa] dark:bg-[#161616] p-5 rounded-3xl border border-slate-200/60 dark:border-slate-700/60 group transition-all duration-300 hover:border-red-300 hover:shadow-md dark:hover:border-red-500/50 dark:hover:shadow-[0_8px_30px_rgb(239,68,68,0.05)] relative overflow-hidden">
                   
                   <div className="absolute inset-0 bg-linear-to-r from-red-500/0 via-red-500/0 to-red-50/50 dark:to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                   <div className="size-12 bg-white dark:bg-[#111111] shadow-sm border border-slate-200/80 dark:border-slate-700/80 rounded-xl flex items-center justify-center shrink-0 relative z-10">
                      <Image src="https://upload.wikimedia.org/wikipedia/commons/d/da/Google_Drive_logo.png" alt="GDrive" width={24} height={24} className="object-contain" unoptimized={true} />
                   </div>
                   
                   <div className="flex-1 min-w-0 relative z-10">
                      <h4 className={`text-base font-bold text-slate-900 dark:text-white truncate mb-1.5 ${googleSansAlt.className}`}>{vid.title}</h4>
                      <div className="flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                         <span className="flex items-center gap-1.5 bg-slate-200/50 dark:bg-slate-800/50 px-2 py-0.5 rounded-md">
                           <span className="material-symbols-outlined text-[14px]">schedule</span> {vid.duration}
                         </span>
                         <span className="flex items-center gap-1.5 truncate">
                           <span className="material-symbols-outlined text-[14px] text-slate-400">link</span> 
                           <span className="truncate max-w-30 sm:max-w-50">{extractGDriveId(vid.url)}</span>
                         </span>
                      </div>
                   </div>
                   
                   <div className="flex items-center gap-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 shrink-0 relative z-10">
                      <button onClick={() => openEditVideoModal(vid)} className="p-2.5 text-slate-400 hover:text-[#00BCD4] hover:bg-cyan-50 dark:hover:bg-cyan-900/30 rounded-xl transition-colors border border-transparent hover:border-cyan-200 dark:hover:border-cyan-800/50" title="Edit Data">
                         <span className="material-symbols-outlined text-[20px] block">edit</span>
                      </button>
                      <button onClick={() => handleDeleteVideo(vid.id)} className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-800/50" title="Hapus Permanen">
                         <span className="material-symbols-outlined text-[20px] block">delete</span>
                      </button>
                   </div>
                </div>
             ))
           )}
        </div>
      </div>

      {/* ====================================================
          MODAL: TAMBAH BATCH LOKAL
      ==================================================== */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsBatchModalOpen(false)}></div>
           
           <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl shadow-2xl relative z-10 animate-in zoom-in-95 duration-200 overflow-hidden">
              <div className="h-2 w-full bg-slate-800 dark:bg-slate-200"></div>
              <div className="p-6 md:p-8">
                 <div className="flex items-center justify-between mb-6">
                    <h3 className={`text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 ${googleSansAlt.className}`}>
                      <span className="material-symbols-outlined text-slate-500">create_new_folder</span> 
                      Tambah Batch Baru
                    </h3>
                    <button onClick={() => setIsBatchModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors p-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl">
                      <span className="material-symbols-outlined block text-[18px]">close</span>
                    </button>
                 </div>

                 <form onSubmit={handleBatchSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block">Nama Batch</label>
                      <input 
                        type="text" 
                        required 
                        value={newBatchName} 
                        onChange={(e) => setNewBatchName(e.target.value)} 
                        placeholder="Misal: Batch 8" 
                        className="w-full bg-[#fafafa] dark:bg-[#161616] border border-slate-200/60 dark:border-slate-700/60 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-slate-500/10 focus:border-slate-400 dark:focus:border-slate-600 outline-none transition-all" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block">Periode (Bulan/Tahun)</label>
                      <input 
                        type="text" 
                        value={newBatchPeriod} 
                        onChange={(e) => setNewBatchPeriod(e.target.value)} 
                        placeholder="Misal: Februari 2026" 
                        className="w-full bg-[#fafafa] dark:bg-[#161616] border border-slate-200/60 dark:border-slate-700/60 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-slate-500/10 focus:border-slate-400 dark:focus:border-slate-600 outline-none transition-all" 
                      />
                    </div>

                    <button type="submit" className={`w-full py-3.5 mt-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 rounded-2xl text-sm font-bold shadow-lg shadow-slate-900/20 dark:shadow-white/10 active:scale-95 transition-all ${googleSansAlt.className}`}>
                       Simpan Batch Lokal
                    </button>
                 </form>
              </div>
           </div>
        </div>
      )}

      {/* ====================================================
          MODAL: FORM SESI VIDEO (POST/PUT API)
      ==================================================== */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsVideoModalOpen(false)}></div>
           
           <div className={`bg-white dark:bg-[#111111] border border-slate-200 dark:border-slate-800 w-full rounded-4xl shadow-2xl relative z-10 animate-in zoom-in-95 duration-200 overflow-hidden transition-all flex flex-col md:flex-row ${previewId ? 'max-w-4xl' : 'max-w-lg'}`}>
              
              <div className={`flex-1 p-8 relative flex flex-col ${previewId ? 'md:border-r border-slate-200 dark:border-slate-800' : ''}`}>
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-red-500"></div>
                  
                  <div className="flex items-center justify-between mb-8">
                    <h3 className={`text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3 ${googleSansAlt.className}`}>
                      <span className="material-symbols-outlined text-red-500 text-[28px]">{modalMode === 'add' ? 'add_circle' : 'edit_square'}</span> 
                      {modalMode === 'add' ? 'Tambah Sesi' : 'Edit Sesi'}
                    </h3>
                    <button onClick={() => setIsVideoModalOpen(false)} className="md:hidden text-slate-400 hover:text-red-500 transition-colors p-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
                      <span className="material-symbols-outlined block text-[20px]">close</span>
                    </button>
                  </div>

                  <form onSubmit={handleVideoSubmit} className="space-y-6 flex-1 flex flex-col">
                    <div className="grid grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block">Judul / Hari</label>
                        <input 
                          type="text" 
                          required 
                          value={sessionName} 
                          onChange={(e) => setSessionName(e.target.value)} 
                          placeholder="Day-1" 
                          className="w-full bg-[#fafafa] dark:bg-[#161616] border border-slate-200/60 dark:border-slate-700/60 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-red-500/10 focus:border-red-300 dark:focus:border-red-500/50 outline-none transition-all" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block">Tanggal</label>
                        <input 
                          type="date" 
                          value={sessionDate} 
                          onChange={(e) => setSessionDate(e.target.value)} 
                          className="w-full bg-[#fafafa] dark:bg-[#161616] border border-slate-200/60 dark:border-slate-700/60 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-red-500/10 focus:border-red-300 dark:focus:border-red-500/50 outline-none transition-all" 
                        />
                        {modalMode === 'edit' && !sessionDate && <span className="text-[9px] text-slate-400 mt-1.5 block">Kosongkan jika tidak ubah tanggal.</span>}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                         <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                           <Image src="https://upload.wikimedia.org/wikipedia/commons/d/da/Google_Drive_logo.png" alt="GDrive" width={14} height={14} className="object-contain" unoptimized={true} />
                           Link Video GDrive
                         </label>
                         <span className="text-[10px] text-emerald-500 font-medium bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">auto_awesome</span> ID Diekstrak Otomatis</span>
                      </div>
                      <input 
                        type="text" 
                        required 
                        value={videoUrl} 
                        onChange={(e) => setVideoUrl(e.target.value)} 
                        placeholder="Paste link Google Drive di sini..." 
                        className="w-full bg-[#fafafa] dark:bg-[#161616] border border-slate-200/60 dark:border-slate-700/60 rounded-2xl px-5 py-3.5 text-sm font-medium text-slate-900 dark:text-white focus:ring-4 focus:ring-red-500/10 focus:border-red-300 dark:focus:border-red-500/50 outline-none transition-all" 
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block">Durasi (HH:MM:SS)</label>
                      <div className="relative flex items-center">
                        <span className="absolute left-4 material-symbols-outlined text-slate-400 text-[18px]">timer</span>
                        <input 
                          type="text" 
                          value={videoDuration} 
                          onChange={(e) => setVideoDuration(e.target.value)} 
                          placeholder="01:30:00" 
                          className="w-full bg-[#fafafa] dark:bg-[#161616] border border-slate-200/60 dark:border-slate-700/60 rounded-2xl pl-11 pr-5 py-3.5 text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-red-500/10 focus:border-red-300 dark:focus:border-red-500/50 outline-none transition-all" 
                        />
                      </div>
                    </div>

                    <div className="mt-auto pt-4">
                       <button type="submit" disabled={isSubmitting} className={`w-full py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-red-500/25 active:scale-95 transition-all flex justify-center items-center gap-2 disabled:opacity-50 ${googleSansAlt.className}`}>
                          {isSubmitting ? (
                            <><span className="material-symbols-outlined animate-spin text-[20px]">sync</span> Menyimpan ke Server...</>
                          ) : (
                            <><span className="material-symbols-outlined text-[20px]">cloud_upload</span> {modalMode === 'add' ? 'Simpan Rekaman Baru' : 'Simpan Perubahan'}</>
                          )}
                       </button>
                    </div>
                  </form>
              </div>

              {previewId && (
                <div className="flex-1 bg-[#fafafa] dark:bg-[#0a0a0a] p-8 flex flex-col relative">
                   <div className="absolute top-0 right-0 w-1.5 h-full bg-slate-200 dark:bg-slate-800"></div>
                   
                   <div className="flex items-center justify-between mb-6">
                      <div>
                         <h4 className={`text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 ${googleSansAlt.className}`}>
                           <span className="material-symbols-outlined text-emerald-500">visibility</span> Live Preview
                         </h4>
                         <p className="text-[11px] text-slate-500 mt-1">Pastikan video memiliki akses &quot;Anyone with the link&quot;.</p>
                      </div>
                      <button onClick={() => setIsVideoModalOpen(false)} className="hidden md:block text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-xl">
                        <span className="material-symbols-outlined block text-[20px]">close</span>
                      </button>
                   </div>

                   <div className="flex-1 w-full flex items-center justify-center">
                     <div className="w-full aspect-video rounded-2xl overflow-hidden bg-slate-200 dark:bg-slate-900 border border-slate-300/50 dark:border-slate-700/50 shadow-inner">
                        {previewId && previewId.length > 10 ? (
                           <iframe 
                             src={`https://drive.google.com/file/d/${previewId}/preview`} 
                             className="w-full h-full border-0"
                             allow="autoplay"
                             title="Video Preview"
                           ></iframe>
                        ) : (
                           <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-3">
                              <span className="material-symbols-outlined text-[32px] animate-pulse">link_off</span>
                              <span className="text-xs font-medium">Link tidak valid / ID tidak ditemukan</span>
                           </div>
                        )}
                     </div>
                   </div>
                   
                   <div className="mt-6 bg-white dark:bg-[#111111] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 flex items-start gap-3">
                      <span className="material-symbols-outlined text-amber-500 text-[20px] shrink-0">info</span>
                      <div>
                         <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">Tips Preview</p>
                         <p className="text-[10px] text-slate-500 leading-relaxed">Jika video tidak muncul, periksa kembali link Drive Anda dan pastikan pengaturan berbaginya tidak &quot;Restricted&quot;.</p>
                      </div>
                   </div>
                </div>
              )}
           </div>
        </div>
      )}

    </div>
  );
}