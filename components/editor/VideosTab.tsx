import React, { useState } from 'react';
import Image from 'next/image';
import { DM_Sans } from 'next/font/google';
import { useToast } from '@/components/ui/ToastProvider';

const googleSansAlt = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '700', '800'] });

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
}

interface CurriculumData {
  batches: Batch[];
  content: Record<string, VideoItem[]>;
}

// Data Default (Sama dengan format curriculum.json)
const defaultCurriculum: CurriculumData = {
  batches: [
    { id: "batch_7", name: "Batch 7 (Januari 2026)" },
    { id: "batch_6", name: "Batch 6 (Desember 2025)" },
  ],
  content: {
    batch_6: [
      { id: "b6d1", type: "gdrive", title: "Day 1 - 16 Des 2025", url: "1FjvYPdbGL77LunYwFDJk2GktKccDwmRp", duration: "02:03:33" },
      { id: "b6d2", type: "gdrive", title: "Day 2 - 18 Des 2025", url: "1avYJwZrnaiRrgEiomyN9biMLhEevG6sc", duration: "02:02:02" },
    ],
    batch_7: [
      { id: "b7d1", type: "gdrive", title: "Day 1 - 12 Jan 2026", url: "1rVIDr55jXejpwJ3EQYzA_H6dzyE96wtv", duration: "01:52:46" },
      { id: "b7d2", type: "gdrive", title: "Day 2 - 14 Jan 2026", url: "17AjylJqFSPI7utiInJSLB12VOPdliYLM", duration: "01:41:26" },
    ]
  }
};

export default function VideosTab() {
  const { showToast } = useToast();
  
  const [data, setData] = useState<CurriculumData>(() => {
    if (typeof window !== 'undefined') {
      const savedData = localStorage.getItem('db_course_classroom');
      if (savedData) return JSON.parse(savedData);
    }
    return defaultCurriculum;
  });

  const [activeBatch, setActiveBatch] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const savedData = localStorage.getItem('db_course_classroom');
      if (savedData) {
         const parsed = JSON.parse(savedData);
         if (parsed.batches && parsed.batches.length > 0) return parsed.batches[0].id;
      }
    }
    return "batch_7";
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [sessionName, setSessionName] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoDuration, setVideoDuration] = useState('01:30:00');

  const saveData = (newData: CurriculumData) => {
    setData(newData);
    localStorage.setItem('db_course_classroom', JSON.stringify(newData));
  };

  const activeVideos = data.content[activeBatch] || [];

  // Ekstrak ID GDrive otomatis dari URL panjang
  const extractGDriveId = (url: string) => {
    const match = url.match(/(?:d\/|id=)([\w-]+)/);
    return match ? match[1] : url; 
  };

  const openAddModal = () => {
    setModalMode('add');
    // Auto "Day X" berdasarkan jumlah video di batch aktif
    setSessionName(`Day ${activeVideos.length + 1}`); 
    setSessionDate(new Date().toISOString().split('T')[0]); 
    setVideoUrl('');
    setVideoDuration('01:30:00');
    setIsModalOpen(true);
  };

  const openEditModal = (vid: VideoItem) => {
    setModalMode('edit');
    setEditingId(vid.id);
    
    const parts = vid.title.split(' - ');
    setSessionName(parts[0] || vid.title);
    setSessionDate(''); 
    setVideoUrl(vid.url);
    setVideoDuration(vid.duration);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionName) return showToast('error', 'Judul Sesi harus diisi!');
    if (!videoUrl) return showToast('error', 'Link GDrive harus diisi!');

    let finalTitle = sessionName;
    if (sessionDate) {
      const dateObj = new Date(sessionDate);
      const formattedDate = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
      finalTitle = `${sessionName} - ${formattedDate}`;
    }

    const finalUrlId = extractGDriveId(videoUrl);

    const newVideo: VideoItem = { 
      id: modalMode === 'add' ? `vid_${Date.now()}` : (editingId as string), 
      type: "gdrive", 
      title: finalTitle, 
      url: finalUrlId, 
      duration: videoDuration || '00:00:00'
    };

    const newContent = { ...data.content };
    if (!newContent[activeBatch]) newContent[activeBatch] = [];

    if (modalMode === 'add') {
      newContent[activeBatch] = [...newContent[activeBatch], newVideo];
      showToast('success', 'Sesi berhasil ditambahkan!');
    } else {
      newContent[activeBatch] = newContent[activeBatch].map(v => v.id === editingId ? newVideo : v);
      showToast('success', 'Perubahan berhasil disimpan!');
    }
    
    saveData({ ...data, content: newContent });
    setIsModalOpen(false);
  };

  const handleDeleteVideo = (vidId: string) => {
    if(confirm("Hapus rekaman sesi ini permanen?")) {
       const newContent = { ...data.content };
       if (newContent[activeBatch]) {
           newContent[activeBatch] = newContent[activeBatch].filter((v: VideoItem) => v.id !== vidId);
       }
       saveData({ ...data, content: newContent });
       showToast('success', 'Sesi dihapus.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
      
      {/* KIRI: DAFTAR BATCH */}
      <div className="md:col-span-4 bg-white dark:bg-[#111111] p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
         <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
             <h3 className={`text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 ${googleSansAlt.className}`}>
               <span className="material-symbols-outlined text-red-500">video_library</span> Angkatan Kelas
             </h3>
             <button className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded-md transition-colors"><span className="material-symbols-outlined text-[18px] block">add</span></button>
         </div>
         <div className="space-y-2">
            {data.batches.map(batch => (
               <button 
                 key={batch.id} 
                 onClick={() => setActiveBatch(batch.id)}
                 className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all border ${activeBatch === batch.id ? 'bg-red-50 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-400' : 'bg-slate-50 border-transparent text-slate-600 hover:bg-slate-100 dark:bg-slate-900/50 dark:text-slate-400 dark:hover:bg-slate-800'}`}
               >
                  {batch.name}
               </button>
            ))}
         </div>
      </div>

      {/* KANAN: DAFTAR REKAMAN SESSION */}
      <div className="md:col-span-8 bg-white dark:bg-[#111111] p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500"></div>
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
           <div>
               <h3 className={`text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1 ${googleSansAlt.className}`}>
                 Daftar Rekaman Sesi (Recordings)
               </h3>
               <p className="text-xs text-slate-500">Kelola video untuk {data.batches.find(b => b.id === activeBatch)?.name}</p>
           </div>
           <button onClick={openAddModal} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-500/20 transition-all flex items-center gap-2">
               <span className="material-symbols-outlined text-[16px]">add_circle</span> Tambah Sesi
           </button>
        </div>

        <div className="space-y-3">
           {activeVideos.length === 0 ? (
             <p className="text-center text-slate-400 text-sm py-8 italic border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">Belum ada rekaman untuk angkatan ini.</p>
           ) : (
             activeVideos.map((vid: VideoItem) => (
                <div key={vid.id} className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 group transition-all hover:border-red-300 dark:hover:border-red-900/50">
                   <div className="size-10 bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-center shrink-0">
                      <Image src="https://upload.wikimedia.org/wikipedia/commons/d/da/Google_Drive_logo.png" alt="GDrive" width={20} height={20} className="object-contain" unoptimized={true} />
                   </div>
                   <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{vid.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                         <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">schedule</span> {vid.duration}</span>
                         <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">link</span> ID: {vid.url}</span>
                      </p>
                   </div>
                   
                   <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button onClick={() => openEditModal(vid)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors" title="Edit Data">
                         <span className="material-symbols-outlined text-[20px] block">edit</span>
                      </button>
                      <button onClick={() => handleDeleteVideo(vid.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors" title="Hapus Permanen">
                         <span className="material-symbols-outlined text-[20px] block">delete</span>
                      </button>
                   </div>
                </div>
             ))
           )}
        </div>
      </div>

      {/* MODAL FORM SESI VIDEO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsModalOpen(false)}></div>
           <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl shadow-2xl relative z-10 animate-in zoom-in-95 duration-200 overflow-hidden">
              <div className="h-2 w-full bg-red-500"></div>
              <div className="p-6 md:p-8">
                 <div className="flex items-center justify-between mb-6">
                    <h3 className={`text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 ${googleSansAlt.className}`}>
                      <span className="material-symbols-outlined text-red-500">{modalMode === 'add' ? 'add_circle' : 'edit_square'}</span> 
                      {modalMode === 'add' ? 'Tambah Sesi Rekaman' : 'Edit Sesi Rekaman'}
                    </h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                      <span className="material-symbols-outlined block text-[18px]">close</span>
                    </button>
                 </div>

                 <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Judul / Sesi</label>
                        <input type="text" required value={sessionName} onChange={(e) => setSessionName(e.target.value)} placeholder="Misal: Day 4" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500/50 outline-none transition-all" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Tanggal Pelaksanaan</label>
                        <input type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500/50 outline-none transition-all" />
                        {modalMode === 'edit' && !sessionDate && <span className="text-[9px] text-slate-400 mt-1 block">Abaikan jika tidak ingin mengubah tanggal.</span>}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                         Tautan Google Drive <span className="text-red-500 font-normal normal-case">ID otomatis diekstrak</span>
                      </label>
                      <input type="text" required value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://drive.google.com/file/d/xxxxxx/view" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500/50 outline-none transition-all" />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Durasi Video (HH:MM:SS)</label>
                      <input type="text" value={videoDuration} onChange={(e) => setVideoDuration(e.target.value)} placeholder="01:30:00" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500/50 outline-none transition-all" />
                    </div>

                    <button type="submit" className={`w-full py-3.5 mt-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-500/20 active:scale-95 transition-all ${googleSansAlt.className}`}>
                       {modalMode === 'add' ? 'Simpan Rekaman' : 'Simpan Perubahan'}
                    </button>
                 </form>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}