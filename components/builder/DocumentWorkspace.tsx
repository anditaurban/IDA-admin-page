import React, { useState, useRef } from 'react';
import { DM_Sans } from 'next/font/google';

const googleSansAlt = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '700', '800'] });

interface DocumentWorkspaceProps {
  title: string;
  setTitle: (val: string) => void;
  initialUrl?: string;
  initialDescription?: string;
  type?: 'document' | 'video' | 'article' | 'quiz'; // ✨ Tambahan tipe materi
  onSave: (payload: { url: string; description: string }) => void;
  onDelete: () => void;
}

export default function DocumentWorkspace({ 
  title, 
  setTitle, 
  initialUrl = "", 
  initialDescription = "", 
  type = 'document', // Default fallback
  onSave, 
  onDelete 
}: DocumentWorkspaceProps) {
  const [docUrl, setDocUrl] = useState(initialUrl);
  const [description, setDescription] = useState(initialDescription);
  const [confirmDelete, setConfirmDelete] = useState(false);
  
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isVideo = type === 'video';

  // ✨ FUNGSI 1: Auto Format Link GDrive, Docs, & YouTube ✨
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    
    // Auto-format Google Docs/Slides/Sheets (Menghilangkan UI Akun)
    const docsMatch = val.match(/docs\.google\.com\/(document|presentation|spreadsheets)\/d\/([a-zA-Z0-9_-]+)/);
    if (docsMatch) {
        val = `https://docs.google.com/${docsMatch[1]}/d/${docsMatch[2]}/embed`;
    } 
    // Auto-format Google Drive biasa
    else {
        const driveMatch = val.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
        if (driveMatch && !val.includes('/preview')) {
            val = `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
        }
    }
    
    // Auto-format YouTube (Mengubah watch?v= jadi /embed/)
    const ytMatch = val.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    if (ytMatch && !val.includes('/embed/')) {
        val = `https://www.youtube.com/embed/${ytMatch[1]}`;
    }
    
    setDocUrl(val);
  };

  // ✨ FUNGSI 2: Simulasi Upload File PDF Lokal ✨
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        setIsUploading(true);
        // Simulasi proses upload ke server
        setTimeout(() => {
            const objectUrl = URL.createObjectURL(file);
            setDocUrl(objectUrl);
            setIsUploading(false);
        }, 1500);
    }
    if (e.target) e.target.value = '';
  };

  // Tema warna dinamis berdasarkan tipe materi
  const themeColorClass = isVideo 
    ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' 
    : 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20';
  
  // (Variabel iconClass dihapus karena tidak digunakan untuk menghilangkan error ESLint)
  const buttonColorClass = isVideo ? 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/20' : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20';

  return (
    <div className="max-w-4xl w-full mx-auto px-6 md:px-16 py-12 pb-40 flex flex-col animate-fade-in">
      {/* BAGIAN KONTROL ATAS */}
      <div className="flex items-center justify-between mb-8">
         <div className={`flex items-center gap-2 font-bold text-sm tracking-wider uppercase px-3 py-1.5 rounded-lg ${themeColorClass}`}>
            <span className="material-symbols-outlined text-[18px]">
              {isVideo ? 'play_circle' : 'picture_as_pdf'}
            </span> 
            {isVideo ? 'Materi Video' : 'File Dokumen'}
         </div>
         
         <div className="flex items-center gap-3">
            {confirmDelete ? (
               <button onClick={onDelete} className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-500/20 animate-pulse">
                 <span className="material-symbols-outlined text-[16px]">warning</span> Yakin Hapus?
               </button>
            ) : (
               <button onClick={() => setConfirmDelete(true)} onMouseLeave={() => setConfirmDelete(false)} className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl text-xs font-bold transition-colors">
                 <span className="material-symbols-outlined text-[16px]">delete</span> Hapus Bab
               </button>
            )}
            <button onClick={() => onSave({ url: docUrl, description })} className={`flex items-center gap-2 px-5 py-2 text-white rounded-xl text-xs font-bold shadow-lg transition-all active:scale-95 ${buttonColorClass}`}>
               <span className="material-symbols-outlined text-[16px]">save</span> Simpan
            </button>
         </div>
      </div>

      {/* BAGIAN JUDUL MATERI */}
      <div className="group relative">
        <textarea 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
          placeholder={isVideo ? "Isi judul video di sini..." : "Isi judul dokumen di sini..."}
          className={`w-full bg-transparent text-3xl md:text-4xl lg:text-[42px] font-extrabold text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700 resize-none outline-none border-none focus:ring-0 overflow-hidden leading-[1.2] transition-colors group-hover:bg-slate-50 dark:group-hover:bg-slate-900/50 rounded-2xl p-4 -ml-4 ${googleSansAlt.className}`}
          rows={2}
        />
      </div>

      <div className="w-full h-0.5 bg-slate-200 dark:bg-slate-800/50 my-6"></div>

      {/* BAGIAN DESKRIPSI / INSTRUKSI */}
      <div className="mb-8 group">
         <textarea
           value={description}
           onChange={(e) => setDescription(e.target.value)}
           placeholder={isVideo ? "Tambahkan instruksi menonton untuk video ini..." : "Tambahkan instruksi bacaan untuk dokumen ini..."}
           className="w-full bg-transparent text-lg text-slate-600 dark:text-slate-300 placeholder:text-slate-300 dark:placeholder:text-slate-600 resize-none outline-none border-none focus:ring-0 leading-relaxed hover:bg-slate-50 dark:hover:bg-slate-900/50 rounded-2xl p-4 -ml-4 transition-colors min-h-25"
         />
      </div>

      {/* ✨ URL & PREVIEW KONTEN ✨ */}
      <div className="bg-white dark:bg-[#111111] p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-6">
         <div className="space-y-3">
           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
             <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block">
               {isVideo ? "URL Video (YouTube, Vimeo, dll)" : "URL Dokumen / Upload File"}
             </label>
             
             {/* Tombol Upload Lokal (Hanya tampil untuk dokumen) */}
             {!isVideo && (
               <button onClick={() => fileInputRef.current?.click()} className={`text-xs font-bold hover:bg-opacity-20 border px-4 py-2 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm w-full sm:w-auto active:scale-95 bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50`}>
                  <span className="material-symbols-outlined text-[16px]">upload_file</span> Unggah PDF Lokal
               </button>
             )}
             <input type="file" accept=".pdf" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
           </div>

           <div className="flex relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400">link</span>
              <input type="text" value={docUrl} onChange={handleUrlChange} placeholder={isVideo ? "Paste link YouTube di sini..." : "Paste link Google Drive di sini..."} className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-12 pr-4 py-4 text-sm font-medium focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all dark:text-white" />
           </div>
           
           {/* Peringatan Akses */}
           <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 p-3 rounded-xl flex items-start gap-2 mt-2">
              <span className="material-symbols-outlined text-blue-500 text-[18px] shrink-0">info</span>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                {isVideo 
                  ? <span>Sistem akan otomatis mengubah link YouTube Anda menjadi format <strong>embed</strong> agar dapat diputar langsung oleh siswa.</span>
                  : <span>Jika menggunakan Google Drive/Docs, pastikan hak akses link diatur ke <strong>&quot;Siapa saja yang memiliki tautan&quot; (Anyone with the link)</strong>. Sistem otomatis mengubahnya menjadi mode baca bersih.</span>
                }
              </p>
           </div>
         </div>
         
         {isUploading ? (
            <div className="relative w-full aspect-video bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-slate-500">
               <span className={`size-10 border-4 border-slate-200 border-t-${isVideo ? 'blue' : 'emerald'}-500 rounded-full animate-spin mb-3`}></span>
               <p className="font-bold text-sm">Mengunggah Dokumen...</p>
            </div>
         ) : docUrl ? (
            <div className="relative w-full aspect-4/3 md:aspect-16/10 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-lg animate-in fade-in zoom-in-95 duration-500">
               <iframe src={docUrl} className="absolute inset-0 w-full h-full bg-slate-100 dark:bg-slate-900" allowFullScreen></iframe>
            </div>
         ) : (
            <div className="relative w-full aspect-video bg-slate-100 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 group hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer" onClick={() => !isVideo && fileInputRef.current?.click()}>
               <span className={`material-symbols-outlined text-6xl mb-4 group-hover:scale-110 transition-transform ${isVideo ? 'group-hover:text-blue-500' : 'group-hover:text-emerald-500'}`}>
                 {isVideo ? 'smart_display' : 'cloud_upload'}
               </span>
               <p className="font-bold text-slate-600 dark:text-slate-300">Preview {isVideo ? 'video' : 'file'} akan muncul di sini</p>
               <p className="text-xs mt-1 text-slate-400">{isVideo ? 'Paste link YouTube Anda di atas' : 'Paste link Google Drive atau klik untuk Upload PDF lokal'}</p>
            </div>
         )}
      </div>
    </div>
  );
}