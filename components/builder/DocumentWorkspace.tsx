import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DM_Sans } from 'next/font/google';

const googleSansAlt = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '700', '800'] });

interface DocumentWorkspaceProps {
  title: string;
  setTitle: (val: string) => void;
  initialUrl?: string;
  initialDescription?: string;
  type?: 'document' | 'video' | 'article' | 'quiz'; 
  onSave: (payload: { url: string; description: string; title?: string; content?: string }) => void;
  onDelete: () => void;
}

export default function DocumentWorkspace({ 
  title, 
  setTitle, 
  initialUrl = "", 
  initialDescription = "", 
  type = 'document', 
  onSave, 
  onDelete 
}: DocumentWorkspaceProps) {
  
  const [localTitle, setLocalTitle] = useState(title);
  const [docUrl, setDocUrl] = useState(initialUrl);
  const [description, setDescription] = useState(initialDescription);
  const [localFile, setLocalFile] = useState<{ name: string; type: string } | null>(null);
  
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // ✨ FIX TERBAIK: Derived State during Render (Standar React 18+)
  // Menggantikan useEffect untuk menyinkronkan data props tanpa double-render/error ESLint
  const [prevProps, setPrevProps] = useState({ title, initialUrl, initialDescription });
  if (
     title !== prevProps.title || 
     initialUrl !== prevProps.initialUrl || 
     initialDescription !== prevProps.initialDescription
  ) {
     setPrevProps({ title, initialUrl, initialDescription });
     setLocalTitle(title);
     setDocUrl(initialUrl);
     setDescription(initialDescription);
     setLocalFile(null); 
     setIsDirty(false);
  }

  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleTextareaRef = useRef<HTMLTextAreaElement>(null);
  const descTextareaRef = useRef<HTMLTextAreaElement>(null);

  const isVideo = type === 'video';

  const adjustTitleHeight = useCallback(() => {
    const textarea = titleTextareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, []);

  const adjustDescHeight = useCallback(() => {
    const textarea = descTextareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, []);

  useEffect(() => { adjustTitleHeight(); }, [localTitle, adjustTitleHeight]);
  useEffect(() => { adjustDescHeight(); }, [description, adjustDescHeight]);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    
    const docsMatch = val.match(/docs\.google\.com\/(document|presentation|spreadsheets)\/d\/([a-zA-Z0-9_-]+)/);
    if (docsMatch) {
        val = `https://docs.google.com/${docsMatch[1]}/d/${docsMatch[2]}/embed`;
    } 
    else {
        const driveMatch = val.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
        if (driveMatch && !val.includes('/preview')) {
            val = `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
        }
    }
    
    const ytMatch = val.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    if (ytMatch && !val.includes('/embed/')) {
        val = `https://www.youtube.com/embed/${ytMatch[1]}`;
    }

    const isDirectFile = val.match(/\.(pdf|ppt|pptx)$/i);
    if (isDirectFile && val.startsWith('http') && !val.includes('google.com') && !val.includes('docs.google.com/gview')) {
        val = `https://docs.google.com/gview?url=${encodeURIComponent(val)}&embedded=true`;
    }
    
    setDocUrl(val);
    setLocalFile(null); 
    setIsDirty(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        setIsUploading(true);
        setLocalFile({ name: file.name, type: file.type || '' });
        
        setTimeout(() => {
            let objectUrl = URL.createObjectURL(file);
            
            if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
                objectUrl = `${objectUrl}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`;
                setDocUrl(objectUrl); 
            } 
            else {
                setDocUrl(""); 
            }

            setIsDirty(true);
            setIsUploading(false);
        }, 1500);
    }
    if (e.target) e.target.value = '';
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setLocalTitle(e.target.value);
      setIsDirty(true);
  };

  const handleDescChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setDescription(e.target.value);
      setIsDirty(true);
  };

  useEffect(() => {
    if (!isDirty) return;

    const timer = setTimeout(() => {
      setTitle(localTitle); 
      onSave({ url: docUrl, description, content: description, title: localTitle });
      setIsDirty(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [localTitle, docUrl, description, isDirty, onSave, setTitle]);

  const handleManualSave = () => {
    setIsSaving(true);
    setTitle(localTitle); 
    onSave({ url: docUrl, description, content: description, title: localTitle });
    setIsDirty(false);
    setTimeout(() => setIsSaving(false), 500);
  };

  const themeColorClass = isVideo ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20';

  return (
    <div className="max-w-4xl w-full mx-auto px-6 md:px-16 py-12 pb-40 flex flex-col animate-fade-in">
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
            <button 
               disabled={isSaving}
               onClick={handleManualSave} 
               className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${isDirty ? 'bg-amber-400 hover:bg-amber-500 text-slate-900 shadow-amber-400/20 animate-pulse' : (isVideo ? 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/20 text-white' : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20 text-white')}`}
            >
               <span className={`material-symbols-outlined text-[16px] ${isSaving ? 'animate-spin' : ''}`}>
                  {isSaving ? 'sync' : isDirty ? 'save_as' : 'save'}
               </span> 
               {isSaving ? 'Menyimpan...' : isDirty ? 'Simpan (*)' : 'Tersimpan'}
            </button>
         </div>
      </div>

      <div className="group relative">
        <textarea 
          ref={titleTextareaRef}
          value={localTitle} 
          onChange={handleTitleChange} 
          placeholder={isVideo ? "Isi judul video di sini..." : "Isi judul dokumen di sini..."}
          className={`w-full bg-transparent text-3xl md:text-4xl lg:text-[42px] font-extrabold text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700 resize-none outline-none border-none focus:ring-0 overflow-hidden leading-[1.2] transition-colors group-hover:bg-slate-50 dark:group-hover:bg-slate-900/50 rounded-2xl p-4 -ml-4 ${googleSansAlt.className}`}
          rows={1}
        />
      </div>

      <div className="w-full h-0.5 bg-slate-200 dark:bg-slate-800/50 my-6"></div>

      <div className="mb-8 group">
         <textarea
           ref={descTextareaRef}
           value={description}
           onChange={handleDescChange}
           placeholder={isVideo ? "Tambahkan instruksi menonton untuk video ini..." : "Tambahkan instruksi bacaan untuk dokumen ini..."}
           className="w-full bg-transparent text-lg text-slate-600 dark:text-slate-300 placeholder:text-slate-300 dark:placeholder:text-slate-600 resize-none outline-none border-none focus:ring-0 leading-relaxed hover:bg-slate-50 dark:hover:bg-slate-900/50 rounded-2xl p-4 -ml-4 transition-colors min-h-25 overflow-hidden"
           rows={1}
         />
      </div>

      <div className="bg-white dark:bg-[#111111] p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-6">
         <div className="space-y-3">
           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
             <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block">
               {isVideo ? "URL Video (YouTube, Vimeo, dll)" : "URL Dokumen / Upload File"}
             </label>
             
             {!isVideo && (
               <button onClick={() => fileInputRef.current?.click()} className={`text-xs font-bold hover:bg-opacity-20 border px-4 py-2 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm w-full sm:w-auto active:scale-95 bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50`}>
                  <span className="material-symbols-outlined text-[16px]">upload_file</span> Unggah PDF
               </button>
             )}
             <input type="file" accept=".pdf,.ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
           </div>

           <div className="flex relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400">link</span>
              <input type="text" value={docUrl} onChange={handleUrlChange} placeholder={isVideo ? "Paste link YouTube di sini..." : "Paste link Google Drive di sini..."} className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-12 pr-4 py-4 text-sm font-medium focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all dark:text-white" />
           </div>
           
           <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 p-3 rounded-xl flex items-start gap-2 mt-2">
              <span className="material-symbols-outlined text-blue-500 text-[18px] shrink-0">info</span>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                {isVideo 
                  ? <span>Sistem akan otomatis mengubah link YouTube Anda menjadi format <strong>embed</strong> agar dapat diputar langsung oleh siswa.</span>
                  : <span>Jika menggunakan Google Drive/Docs, pastikan hak akses link diatur ke <strong>&quot;Siapa saja yang memiliki tautan&quot; (Anyone with the link)</strong>. Sistem otomatis mengubahnya menjadi mode presentasi menyeluruh.</span>
                }
              </p>
           </div>
         </div>
         
         {isUploading ? (
            <div className="relative w-full aspect-video bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-slate-500">
               <span className={`size-10 border-4 border-slate-200 border-t-${isVideo ? 'blue' : 'emerald'}-500 rounded-full animate-spin mb-3`}></span>
               <p className="font-bold text-sm">Mengunggah Dokumen...</p>
            </div>
         ) : localFile && localFile.name.match(/\.(ppt|pptx)$/i) ? (
            <div className="relative w-full aspect-4/3 md:aspect-16/10 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg flex items-center justify-center animate-in fade-in zoom-in-95 duration-500">
                <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 text-center max-w-sm">
                    <div className="text-6xl mb-4">📊</div>
                    <h2 className="text-slate-900 dark:text-white font-bold text-xl mb-2">File Terpilih</h2>
                    <p className="text-emerald-600 dark:text-emerald-400 font-medium text-sm mb-4 bg-emerald-50 dark:bg-emerald-900/20 py-2 px-3 rounded-lg truncate">
                       {localFile.name}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                       File presentasi tidak dapat ditinjau langsung dari komputer Anda. <br/><br/>
                       Silakan klik tombol <strong className="text-slate-700 dark:text-slate-200">Simpan</strong>.
                    </p>
                </div>
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
               <p className="text-xs mt-1 text-slate-400">{isVideo ? 'Paste link YouTube Anda di atas' : 'Paste link Google Drive atau klik untuk Upload Dokumen lokal'}</p>
            </div>
         )}
      </div>
    </div>
  );
}