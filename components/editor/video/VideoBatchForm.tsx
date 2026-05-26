import React, { useState, useRef, useEffect } from 'react';
import { DM_Sans } from 'next/font/google';
import { BatchSection, VideoDetail } from '@/hooks/useVideosTab';
import Image from 'next/image';

const googleSansAlt = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '700'] });

interface VideoBatchFormProps {
  modalMode: 'add' | 'edit';
  initialData?: BatchSection | null;
  isSubmitting: boolean;
  onSubmit: (data: Partial<BatchSection>) => void;
  onClose: () => void;
}

type FormVideo = VideoDetail & { _localId: string };

const getEmbedUrl = (url: string) => {
  if (!url || !url.startsWith('http')) return '';
  return url.replace(/\/view.*$/, '/preview');
};

export function VideoBatchForm({ modalMode, initialData, isSubmitting, onSubmit, onClose }: VideoBatchFormProps) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const formContainerRef = useRef<HTMLFormElement>(null);

  const [batchName, setBatchName] = useState(initialData?.batch_name || '');
  const [batchPeriod, setBatchPeriod] = useState(initialData?.batch_period || '');

  const [videos, setVideos] = useState<FormVideo[]>(() => {
    if (initialData?.videos && initialData.videos.length > 0) {
      return initialData.videos.map((v) => ({
        ...v,
        platform_type: 'gdrive', 
        _localId: Math.random().toString(36).substring(2, 9),
      }));
    }
    return [
      {
        _localId: Math.random().toString(36).substring(2, 9),
        platform_type: 'gdrive',
        video_title: '',
        video_url: '',
        video_duration: '',
      },
    ];
  });

  // ✨ LOGIKA UKURAN MODAL DINAMIS
  // Cek apakah ada minimal 1 video yang sudah memiliki URL
  const hasAnyVideoUrl = videos.some(vid => vid.video_url.trim().length > 0);

  const handleAddVideo = () => {
    setVideos([
      ...videos,
      {
        _localId: Math.random().toString(36).substring(2, 9),
        platform_type: 'gdrive',
        video_title: '',
        video_url: '',
        video_duration: '',
      },
    ]);

    setTimeout(() => {
      if (formContainerRef.current) {
        formContainerRef.current.scrollTo({
          top: formContainerRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }
    }, 100);
  };

  const handleRemoveVideo = (localIdToRemove: string) => {
    if (videos.length === 1) return;
    setVideos(videos.filter((v) => v._localId !== localIdToRemove));
  };

  const handleVideoChange = (localId: string, field: keyof VideoDetail, value: string) => {
    setVideos(
      videos.map((v) => (v._localId === localId ? { ...v, [field]: value } : v))
    );
  };

  const formatDurationInput = (value: string) => {
    const numbersOnly = value.replace(/\D/g, '');
    const limited = numbersOnly.substring(0, 6);
    
    if (limited.length <= 2) return limited;
    if (limited.length <= 4) return `${limited.substring(0, 2)}:${limited.substring(2)}`;
    return `${limited.substring(0, 2)}:${limited.substring(2, 4)}:${limited.substring(4, 6)}`;
  };

  const handleDurationChange = (localId: string, rawValue: string) => {
    const formattedTime = formatDurationInput(rawValue);
    handleVideoChange(localId, 'video_duration', formattedTime);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedVideos: VideoDetail[] = videos.map((v) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _localId, ...rest } = v;
      return { ...rest, platform_type: 'gdrive' };
    });

    onSubmit({
      batch_id: initialData?.batch_id,
      batch_name: batchName,
      batch_period: batchPeriod,
      videos: cleanedVideos,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 perspective-1000">
      <div 
        className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm transition-opacity duration-300" 
        onClick={!isSubmitting ? onClose : undefined}
      ></div>
      
      {/* ✨ EFEK ELASTIS: max-w berubah dinamis antara 4xl (ramping) dan 7xl (lebar) disertai transisi mulus */}
      <div className={`bg-white dark:bg-[#111111] border border-slate-200 dark:border-slate-800 w-full ${hasAnyVideoUrl ? 'max-w-7xl' : 'max-w-4xl'} rounded-4xl shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]`}>
        
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-[#111111] z-20">
          <h3 className={`text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 ${googleSansAlt.className}`}>
            <span className="material-symbols-outlined text-cyan-500">
              {modalMode === 'add' ? 'library_add' : 'edit_document'}
            </span>
            {modalMode === 'add' ? 'Tambah Sesi & Video' : 'Edit Sesi'}
          </h3>
          <button type="button" onClick={onClose} disabled={isSubmitting} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50">
            <span className="material-symbols-outlined block">close</span>
          </button>
        </div>

        <form id="batch-form" ref={formContainerRef} onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 scroll-smooth relative">
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider border-l-4 border-cyan-500 pl-3 transition-colors">
              Informasi Sesi
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-[#161616] p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 transition-colors">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">NAMA SESI</label>
                <input 
                  type="text" required placeholder="Contoh: NgodingAi Session 8"
                  value={batchName} onChange={(e) => setBatchName(e.target.value)} 
                  className="w-full bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm dark:text-white outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">PERIODE</label>
                <input 
                  type="text" required placeholder="Contoh: Januari 2026"
                  value={batchPeriod} onChange={(e) => setBatchPeriod(e.target.value)} 
                  className="w-full bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm dark:text-white outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all" 
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider border-l-4 border-cyan-500 pl-3">Daftar Video</h4>
              <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full transition-colors">{videos.length} Video</span>
            </div>

            <div className="space-y-4">
              {videos.map((vid, index) => (
                <div key={vid._localId} className="relative p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#161616] border border-slate-200 dark:border-slate-800 shadow-sm group animate-in fade-in slide-in-from-bottom-4 duration-500 transition-colors">
                  <div className="absolute -top-3 -left-3 size-8 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold flex items-center justify-center rounded-full text-xs shadow-md border-2 border-white dark:border-[#111] transition-colors">{index + 1}</div>
                  
                  {videos.length > 1 && (
                    <button type="button" onClick={() => handleRemoveVideo(vid._localId)} className="absolute top-4 right-4 p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10 rounded-lg transition-colors z-10" title="Hapus Video Ini">
                      <span className="material-symbols-outlined text-[18px] block">delete</span>
                    </button>
                  )}

                  <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 mt-2">
                    {/* Sisi Kiri: Input Data */}
                    <div className="flex-1 space-y-4 transition-all duration-500">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="md:col-span-12 space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-500">JUDUL VIDEO</label>
                          <input type="text" required placeholder="Contoh: Day-1 Front-end" value={vid.video_title} onChange={(e) => handleVideoChange(vid._localId, 'video_title', e.target.value)} className="w-full bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-cyan-500 transition-colors" />
                        </div>
                        
                        <div className="md:col-span-4 space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-500">PLATFORM</label>
                          <div className="w-full bg-slate-100 dark:bg-[#222] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-500 font-medium flex items-center gap-2 select-none cursor-not-allowed transition-colors">
                            <Image src="https://upload.wikimedia.org/wikipedia/commons/d/da/Google_Drive_logo.png" alt="Drive" width={16} height={16} className="object-contain" unoptimized />
                            Google Drive
                          </div>
                        </div>

                        <div className="md:col-span-5 space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-500">LINK VIDEO / URL</label>
                          <input type="text" required placeholder="https://drive.google.com/..." value={vid.video_url} onChange={(e) => handleVideoChange(vid._localId, 'video_url', e.target.value)} className="w-full bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-cyan-500 transition-colors font-mono" />
                        </div>

                        <div className="md:col-span-3 space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-500">DURASI</label>
                          <input 
                            type="text" 
                            required 
                            placeholder="00:00:00" 
                            maxLength={8}
                            value={vid.video_duration} 
                            onChange={(e) => handleDurationChange(vid._localId, e.target.value)} 
                            className="w-full bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-cyan-500 transition-colors text-center tracking-widest font-mono placeholder:tracking-normal" 
                          />
                        </div>
                      </div>
                    </div>

                    {/* ✨ Sisi Kanan: Preview (Muncul secara dramatis dengan efek slide & fade in) */}
                    {vid.video_url && (
                      <div className="w-full lg:w-72 xl:w-120 shrink-0 animate-in slide-in-from-right-8 fade-in zoom-in-95 duration-500 fill-mode-forwards">
                        <label className="text-[11px] font-bold text-slate-500 block mb-1.5">PREVIEW VIDEO</label>
                        <div className="w-full aspect-video bg-slate-100 dark:bg-[#0a0a0a] rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden relative shadow-inner">
                          {vid.video_url.startsWith('http') ? (
                            <iframe 
                              src={getEmbedUrl(vid.video_url)} 
                              className="w-full h-full absolute inset-0 bg-slate-100 dark:bg-[#080808]" 
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                              allowFullScreen
                              loading="lazy"
                            ></iframe>
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2 bg-slate-50 dark:bg-[#080808] transition-colors">
                              <span className="material-symbols-outlined text-4xl">link_off</span>
                              <span className="text-xs text-center px-4 font-medium">Link tidak valid</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button type="button" onClick={handleAddVideo} className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-[#161616] hover:text-cyan-500 hover:border-cyan-300 transition-all active:scale-95">
              <span className="material-symbols-outlined text-[20px]">add_circle</span> Tambah Video Lagi
            </button>
          </div>
          <div className="pb-4"></div>
        </form>

        <div className="px-6 py-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#111111] shrink-0 z-20 transition-colors">
          <button 
            type="submit" 
            form="batch-form" 
            disabled={isSubmitting} 
            className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-xl font-bold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            {isSubmitting ? (
              <><span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span> Menyimpan Data...</>
            ) : (
              <><span className="material-symbols-outlined text-[20px]">save</span> Simpan Semua Sesi & Video</>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}