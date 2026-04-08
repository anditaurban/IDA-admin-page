import React, { useState, useEffect } from 'react';
import { DM_Sans } from 'next/font/google';

const googleSansAlt = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '700', '800'] });

interface VideoWorkspaceProps {
  title: string;
  setTitle: (val: string) => void;
  initialUrl?: string;
  initialDescription?: string;
  onSave: (payload: any) => void;
  onDelete: () => void;
}

export default function VideoWorkspace({ title, setTitle, initialUrl = "", initialDescription = "", onSave, onDelete }: VideoWorkspaceProps) {
  const [videoUrl, setVideoUrl] = useState(initialUrl);
  const [description, setDescription] = useState(initialDescription);
  const [confirmDelete, setConfirmDelete] = useState(false);
  
  useEffect(() => { 
    setVideoUrl(initialUrl); 
    setDescription(initialDescription || "");
  }, [initialUrl, initialDescription]);

  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp); 
    return (match && match[2].length === 11) ? match[2] : null;
  };
  
  const videoId = getYoutubeId(videoUrl);

  return (
    <div className="max-w-4xl w-full mx-auto px-6 md:px-16 py-12 pb-40 flex flex-col animate-fade-in">
      
      {/* --- BAGIAN KONTROL ATAS --- */}
      <div className="flex items-center justify-between mb-8">
         <div className="flex items-center gap-2 text-blue-500 font-bold text-sm tracking-wider uppercase bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg">
            <span className="material-symbols-outlined text-[18px]">play_circle</span> Video Materi
         </div>
         
         <div className="flex items-center gap-3">
            {confirmDelete ? (
               <button onClick={onDelete} className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-500/20 animate-pulse"><span className="material-symbols-outlined text-[16px]">warning</span> Yakin Hapus?</button>
            ) : (
               <button onClick={() => setConfirmDelete(true)} onMouseLeave={() => setConfirmDelete(false)} className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl text-xs font-bold transition-colors"><span className="material-symbols-outlined text-[16px]">delete</span> Hapus Bab</button>
            )}
            {/* Mengirim URL dan Deskripsi ke fungsi Save */}
            <button onClick={() => onSave({ url: videoUrl, description })} className="flex items-center gap-2 px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-95">
               <span className="material-symbols-outlined text-[16px]">save</span> Simpan
            </button>
         </div>
      </div>

      {/* --- BAGIAN JUDUL MATERI --- */}
      <div className="group relative">
        <textarea 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
          placeholder="Isi judul video di sini..."
          className={`w-full bg-transparent text-3xl md:text-4xl lg:text-[42px] font-extrabold text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700 resize-none outline-none border-none focus:ring-0 overflow-hidden leading-[1.2] transition-colors group-hover:bg-slate-50 dark:group-hover:bg-slate-900/50 rounded-2xl p-4 -ml-4 ${googleSansAlt.className}`}
          rows={2}
        />
      </div>

      {/* ✨ GARIS PEMISAH MODERN (GRADIENT DIVIDER) ✨ */}
      <div className="w-full h-0.5 bg-linear-to-r from-slate-200 via-slate-100 to-transparent dark:from-slate-800 dark:via-slate-800/50 my-6"></div>

      {/* --- BAGIAN DESKRIPSI / INSTRUKSI --- */}
      <div className="mb-8 group">
         <textarea
           value={description}
           onChange={(e) => setDescription(e.target.value)}
           placeholder="Tambahkan deskripsi atau instruksi untuk video ini..."
           className="w-full bg-transparent text-lg text-slate-600 dark:text-slate-300 placeholder:text-slate-300 dark:placeholder:text-slate-600 resize-none outline-none border-none focus:ring-0 leading-relaxed hover:bg-slate-50 dark:hover:bg-slate-900/50 rounded-2xl p-4 -ml-4 transition-colors min-h-25"
         />
      </div>

      {/* --- URL & PREVIEW KONTEN --- */}
      <div className="bg-white dark:bg-[#111111] p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-6">
         <div className="space-y-2">
           <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block">URL Video (YouTube)</label>
           <div className="flex relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400">link</span>
              <input type="text" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="Paste link YouTube di sini..." className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-12 pr-4 py-4 text-sm font-medium focus:ring-2 focus:ring-blue-500/50 outline-none transition-all dark:text-white" />
           </div>
         </div>
         {videoId ? (
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-lg animate-in fade-in zoom-in-95 duration-500">
               <iframe src={`https://www.youtube.com/embed/${videoId}`} className="absolute inset-0 w-full h-full" allowFullScreen></iframe>
            </div>
         ) : (
            <div className="relative w-full aspect-video bg-slate-100 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 group hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
               <span className="material-symbols-outlined text-6xl mb-4 group-hover:scale-110 transition-transform group-hover:text-blue-500">cloud_upload</span>
               <p className="font-bold text-slate-600 dark:text-slate-300">Preview akan muncul di sini</p>
               <p className="text-xs mt-1 text-slate-400">Masukan URL YouTube di atas</p>
            </div>
         )}
      </div>
    </div>
  );
}