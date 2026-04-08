import React, { useState, useEffect } from 'react';
import { DM_Sans } from 'next/font/google';

const googleSansAlt = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '700', '800'] });

const defaultMaterials = [
  { id: "m1", type: "slide", title: "AI in Web Development", url: "https://drive.google.com/file/d/1IhECdethlLyijelFcFfW2AiAIgeotrG-/preview" },
  { id: "m2", type: "doc", title: "Prompt Engineering Sample", url: "https://drive.google.com/file/d/1WzoSJcjhItd398jyC1XmpnPUvDgocOr1/preview" },
  { id: "m3", type: "slide", title: "Web Development Intro", url: "https://drive.google.com/file/d/1TY2IU1oRVe6Bdhyc5az7y_Ps0w0j2LzC/preview" },
  { id: "m4", type: "slide", title: "Web Development Flow", url: "https://drive.google.com/file/d/179fLaymrUDKeWwwnHLxyv2loaUp_PrYE/preview" },
  { id: "m5", type: "slide", title: "Frontend Development Deep Dive", url: "https://drive.google.com/file/d/1xNHi8nlM0K0Kc4PcwazDSlt5MMOVbZOI/preview" },
  { id: "m6", type: "slide", title: "Backend Development Flow", url: "https://drive.google.com/file/d/1z0vgJGv7U1q5BujNM69Aiv_12dOcEdfl/preview" }
];

export default function MaterialsSettings() {
  const [materials, setMaterials] = useState<any[]>(defaultMaterials);
  
  // ✨ STATE BARU: Untuk melacak file mana yang sedang di-preview ✨
  const [activePreviewId, setActivePreviewId] = useState<string | null>(defaultMaterials[0]?.id || null);

  useEffect(() => {
    const savedData = localStorage.getItem('db_course_materials');
    if (savedData) {
        const parsed = JSON.parse(savedData);
        setMaterials(parsed);
        if (parsed.length > 0) setActivePreviewId(parsed[0].id);
    }
  }, []);

  const saveMaterials = (newMats: any[]) => {
    setMaterials(newMats);
    localStorage.setItem('db_course_materials', JSON.stringify(newMats));
  };

  const handleAddMaterial = () => {
    const title = prompt("Masukkan Nama Modul/File (Misal: Slide Presentasi Day 1):");
    if (!title) return;
    const url = prompt("Masukkan Tautan Dokumen (Google Drive PDF/Slide Preview URL):");
    if (!url) return;
    const type = prompt("Tipe File? (ketik 'slide' atau 'doc')") || 'doc';
    
    const newMaterial = { id: `m${Date.now()}`, type, title, url };
    saveMaterials([...materials, newMaterial]);
    setActivePreviewId(newMaterial.id); // Otomatis preview file yang baru ditambah
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Mencegah memicu onClick item (preview)
    if(confirm("Yakin hapus lampiran ini dari kelas?")) {
      const updatedMaterials = materials.filter(m => m.id !== id);
      saveMaterials(updatedMaterials);
      
      // Jika file yang dihapus sedang di-preview, alihkan ke file pertama
      if (activePreviewId === id) {
          setActivePreviewId(updatedMaterials.length > 0 ? updatedMaterials[0].id : null);
      }
    }
  };

  const activeMaterial = materials.find(m => m.id === activePreviewId);

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      
      {/* HEADER TAB */}
      <div className="flex items-center justify-between bg-white dark:bg-[#111111] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
         <div className="flex items-center gap-4">
             <div className="size-12 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 rounded-xl flex items-center justify-center">
                 <span className="material-symbols-outlined text-[24px]">folder_open</span>
             </div>
             <div>
                 <h3 className={`text-lg font-bold text-slate-900 dark:text-white ${googleSansAlt.className}`}>Lampiran File Kelas</h3>
                 <p className="text-xs text-slate-500">File referensi (Slide/PDF) untuk diunduh siswa.</p>
             </div>
         </div>
         <button onClick={handleAddMaterial} className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">add</span> Tambah File
         </button>
      </div>

      {/* ✨ LAYOUT DUA KOLOM: KIRI (DAFTAR) & KANAN (PREVIEW) ✨ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
         
         {/* KOLOM KIRI: DAFTAR FILE */}
         <div className="lg:col-span-4 space-y-3">
             <div className="bg-slate-50 dark:bg-[#111111] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3">
                 <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 px-2">Daftar Modul ({materials.length})</h4>
                 
                 {materials.length === 0 ? (
                    <p className="text-center text-slate-400 text-sm py-8 italic border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">Belum ada file lampiran.</p>
                 ) : (
                    materials.map((mat) => (
                      <button 
                        key={mat.id} 
                        onClick={() => setActivePreviewId(mat.id)}
                        className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all text-left group ${
                          activePreviewId === mat.id 
                          ? 'bg-indigo-50 border-indigo-200 shadow-sm dark:bg-indigo-900/20 dark:border-indigo-800' 
                          : 'bg-white border-transparent hover:bg-slate-100 hover:border-slate-200 dark:bg-slate-800/50 dark:hover:bg-slate-800'
                        }`}
                      >
                         <div className="flex items-center gap-3 overflow-hidden">
                            <span className={`material-symbols-outlined text-[24px] shrink-0 ${mat.type === 'slide' ? 'text-orange-500' : 'text-blue-500'}`}>
                               {mat.type === 'slide' ? 'slideshow' : 'description'}
                            </span>
                            <div className="flex-1 min-w-0">
                               <p className={`text-sm truncate transition-colors ${activePreviewId === mat.id ? 'font-bold text-indigo-900 dark:text-indigo-200' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                                 {mat.title}
                               </p>
                               <p className="text-[10px] text-slate-400 truncate uppercase tracking-widest mt-0.5">{mat.type === 'slide' ? 'Google Slides' : 'PDF Document'}</p>
                            </div>
                         </div>
                         <div 
                           onClick={(e) => handleDelete(mat.id, e)} 
                           className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                           title="Hapus File"
                         >
                            <span className="material-symbols-outlined text-[18px] block">delete</span>
                         </div>
                      </button>
                    ))
                 )}
             </div>
         </div>

         {/* KOLOM KANAN: AREA PREVIEW */}
         <div className="lg:col-span-8 bg-white dark:bg-[#111111] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4 relative overflow-hidden h-150 lg:sticky lg:top-24">
             <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500"></div>
             
             {activeMaterial ? (
                 <>
                   <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                       <div>
                           <h3 className={`text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 ${googleSansAlt.className}`}>
                             <span className="material-symbols-outlined text-indigo-500">preview</span> Live Preview
                           </h3>
                           <p className="text-xs text-slate-500 mt-1 truncate max-w-sm" title={activeMaterial.url}>{activeMaterial.url}</p>
                       </div>
                       <a href={activeMaterial.url} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5">
                           <span className="material-symbols-outlined text-[16px]">open_in_new</span> Buka di Tab Baru
                       </a>
                   </div>

                   <div className="flex-1 w-full bg-slate-100 dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 relative">
                       {/* Render Iframe dari URL GDrive */}
                       {activeMaterial.url.includes("google.com") ? (
                           <iframe 
                             src={activeMaterial.url} 
                             className="absolute inset-0 w-full h-full"
                             allowFullScreen
                             title={activeMaterial.title}
                           ></iframe>
                       ) : (
                           <div className="flex flex-col items-center justify-center h-full text-slate-400 p-6 text-center">
                              <span className="material-symbols-outlined text-4xl mb-2">broken_image</span>
                              <p className="font-bold text-sm">URL tidak valid atau tidak dapat dipreview.</p>
                              <p className="text-xs">Pastikan URL adalah format "preview" dari Google Drive.</p>
                           </div>
                       )}
                   </div>
                 </>
             ) : (
                 <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                    <span className="material-symbols-outlined text-6xl mb-4 opacity-20">find_in_page</span>
                    <p className="font-bold text-slate-600 dark:text-slate-300">Pilih file di daftar untuk melihat preview</p>
                    <p className="text-sm mt-1">Area ini akan menampilkan isi dokumen secara langsung.</p>
                 </div>
             )}
         </div>

      </div>
    </div>
  );
}