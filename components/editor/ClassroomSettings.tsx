import React, { useState, useEffect } from 'react';
import { DM_Sans } from 'next/font/google';

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

// ✨ FIX: Data Default Lengkap Tersinkron dengan curriculum.json ✨
const defaultCurriculum: CurriculumData = {
  batches: [
    { id: "batch_7", name: "Batch 7 (Januari 2026)" },
    { id: "batch_6", name: "Batch 6 (Desember 2025)" },
    { id: "batch_5", name: "Batch 5 (Desember 2025)" },
    { id: "batch_4", name: "Batch 4 (November 2025)" },
    { id: "batch_3", name: "Batch 3 (Oktober 2025)" },
    { id: "batch_2", name: "Batch 2 (Juni 2025)" },
    { id: "batch_1", name: "Batch 1 (Mei 2025)" }
  ],
  content: {
    batch_1: [
      { id: "b1d1", type: "gdrive", title: "Day 1 - 20 Mei 2025", url: "1RILbQsHLA_E1YT6JFndO5Hwxw6pn26fi", duration: "02:05:54" },
      { id: "b1d2", type: "gdrive", title: "Day 2 - 21 Mei 2025", url: "1ZxkDSbyiRgd5b-HAs51kgAwEkVyXlygr", duration: "01:59:40" },
      { id: "b1d3", type: "gdrive", title: "Day 3 - 22 Mei 2025", url: "1VWWyAfsrkbIY9WnmYEJ99exbnS7WbTbs", duration: "02:16:25" }
    ],
    batch_2: [
      { id: "b2d1", type: "gdrive", title: "Day 1 - 17 Juni 2025", url: "1OpcyZTAQy9LDNVU_MhQ-ycsqdptj76En", duration: "02:39:01" },
      { id: "b2d2", type: "gdrive", title: "Day 2 - 18 Juni 2025", url: "1_Vq6757EvZ7mtiZ5le1P_lJTl4vdcfZx", duration: "02:10:15" },
      { id: "b2d3", type: "gdrive", title: "Day 3 - 19 Juni 2025", url: "1n-CZCdcnbT041lIq1rHwPfGQtp5Fcr0R", duration: "02:38:17" }
    ],
    batch_3: [
      { id: "b3d1", type: "gdrive", title: "Day 1 - 20 Oktober 2025", url: "1BV0XRdaDx10rHSXv_5nPQH5urlJJyB0v", duration: "02:01:45" },
      { id: "b3d2", type: "gdrive", title: "Day 2 - 22 Oktober 2025", url: "1bH4p5WcpMpOmojdgRSDoPxhXLd7Omhbd", duration: "02:06:34" },
      { id: "b3d3", type: "gdrive", title: "Day 3 - 24 Oktober 2025", url: "1z42xBpGFo87KtE2dZxWKVQMbcL2LdoAU", duration: "01:56:24" }
    ],
    batch_4: [
      { id: "b4d1", type: "gdrive", title: "Back-End Dev - 1 Nov 2025", url: "17tZ_aqQYqxd9Lv9B1iCgekmSxB5XI7JN", duration: "01:40:10" },
      { id: "b4d2", type: "gdrive", title: "Front-End Dev - 1 Nov 2025", url: "1D-XW4VQgfUAq07m1CdLx6uly7cqSduBc", duration: "01:19:28" }
    ],
    batch_5: [
      { id: "b5d1", type: "gdrive", title: "Day 1 - 1 Des 2025", url: "1OMfi_jjUXSPovEet84_pTyWht8oco5tm", duration: "02:02:35" },
      { id: "b5d2", type: "gdrive", title: "Day 2 - 3 Des 2025", url: "1CX1NuiZ4ZFIEmwUi1A2YW8ausnHnKYiG", duration: "02:03:37" },
      { id: "b5d3", type: "gdrive", title: "Day 3 - 5 Des 2025", url: "10jgdsGuikQgGFLFElaWyiaB5ZRx84qOa", duration: "02:16:27" }
    ],
    batch_6: [
      { id: "b6d1", type: "gdrive", title: "Day 1 - 16 Des 2025", url: "1FjvYPdbGL77LunYwFDJk2GktKccDwmRp", duration: "02:03:33" },
      { id: "b6d2", type: "gdrive", title: "Day 2 - 18 Des 2025", url: "1avYJwZrnaiRrgEiomyN9biMLhEevG6sc", duration: "02:02:02" },
      { id: "b6d3a", type: "gdrive", title: "Day 3A - 19 Des 2025", url: "1Eb83b1xAHGjmghEUoMYCwpecy1DkDWRY", duration: "00:51:42" },
      { id: "b6d3b", type: "gdrive", title: "Day 3B - 19 Des 2025", url: "1Pvqf7_p637cswuhEMNw8vazWrVzClNXT", duration: "02:12:45" }
    ],
    batch_7: [
      { id: "b7d1", type: "gdrive", title: "Day 1 - 12 Jan 2026", url: "1rVIDr55jXejpwJ3EQYzA_H6dzyE96wtv", duration: "01:52:46" },
      { id: "b7d2", type: "gdrive", title: "Day 2 - 14 Jan 2026", url: "17AjylJqFSPI7utiInJSLB12VOPdliYLM", duration: "01:41:26" },
      { id: "b7d3", type: "gdrive", title: "Day 3 - 16 Jan 2026", url: "1UgYYP4E7kzbut4Q_rkqeJ7YF6Smwi_dt", duration: "03:02:27" }
    ]
  }
};

export default function ClassroomSettings() {
  const [data, setData] = useState<CurriculumData>(defaultCurriculum);
  const [activeBatch, setActiveBatch] = useState<string>("batch_7");

  useEffect(() => {
    const savedData = localStorage.getItem('db_course_classroom');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setData(parsed);
      if(parsed.batches && parsed.batches.length > 0) setActiveBatch(parsed.batches[0].id);
    }
  }, []);

  const saveData = (newData: CurriculumData) => {
    setData(newData);
    localStorage.setItem('db_course_classroom', JSON.stringify(newData));
  };

  const handleAddVideo = () => {
    const title = prompt("Judul Sesi (Contoh: Day 1 - 20 Mei):");
    if (!title) return;
    const url = prompt("ID Google Drive Video:");
    if (!url) return;
    const duration = prompt("Durasi (Contoh: 02:05:54):") || "00:00:00";

    const newVideo: VideoItem = { id: `vid_${Date.now()}`, type: "gdrive", title, url, duration };
    const newContent = { ...data.content };
    if (!newContent[activeBatch]) newContent[activeBatch] = [];
    newContent[activeBatch] = [...newContent[activeBatch], newVideo];
    
    saveData({ ...data, content: newContent });
  };

  const handleDeleteVideo = (vidId: string) => {
    if(confirm("Hapus rekaman ini?")) {
       const newContent = { ...data.content };
       if (newContent[activeBatch]) {
           newContent[activeBatch] = newContent[activeBatch].filter((v: VideoItem) => v.id !== vidId);
       }
       saveData({ ...data, content: newContent });
    }
  };

  const activeVideos = data.content[activeBatch] || [];

  return (
    <div className="space-y-6 animate-fade-in pb-20 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
      
      {/* KIRI: DAFTAR BATCH */}
      <div className="md:col-span-4 bg-white dark:bg-[#111111] p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
         <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
             <h3 className={`text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 ${googleSansAlt.className}`}>
               <span className="material-symbols-outlined text-red-500">video_library</span> Angkatan
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
                 Rekaman Sesi Kelas
               </h3>
               <p className="text-xs text-slate-500">Kelola video GDrive untuk {data.batches.find(b => b.id === activeBatch)?.name}</p>
           </div>
           <button onClick={handleAddVideo} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-500/20 transition-all flex items-center gap-2">
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
                      <img src="https://upload.wikimedia.org/wikipedia/commons/d/da/Google_Drive_logo.png" alt="GDrive" className="w-5 h-5 object-contain" />
                   </div>
                   <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{vid.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                         <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">schedule</span> {vid.duration}</span>
                         <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">link</span> ID: {vid.url}</span>
                      </p>
                   </div>
                   <button onClick={() => handleDeleteVideo(vid.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors opacity-0 group-hover:opacity-100 shrink-0">
                      <span className="material-symbols-outlined text-[20px] block">delete</span>
                   </button>
                </div>
             ))
           )}
        </div>
      </div>
    </div>
  );
}