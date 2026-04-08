import React, { useState, useEffect } from 'react';
import { DM_Sans } from 'next/font/google';

const googleSansAlt = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '700', '800'] });

const defaultSettingsData = {
  title: "NgodingAI: Master GenAI & LLMs",
  description: "Pelajari cara membangun aplikasi berbasis LLM menggunakan Python, OpenAI API, dan LangChain dari dasar hingga mahir.",
  thumbnail: "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1000&auto=format&fit=crop",
  level: "Pemula",
  price: "499000"
};

export default function BasicSettings() {
  const [formData, setFormData] = useState(defaultSettingsData);

  useEffect(() => {
    const savedData = localStorage.getItem('db_course_overview');
    if (savedData) {
      setFormData({ ...defaultSettingsData, ...JSON.parse(savedData) });
    }
  }, []);

  const saveChanges = (newData: typeof formData) => {
    setFormData(newData);
    const existingData = JSON.parse(localStorage.getItem('db_course_overview') || '{}');
    localStorage.setItem('db_course_overview', JSON.stringify({ ...existingData, ...newData }));
  };

  const handleChange = (field: string, value: string) => {
    saveChanges({ ...formData, [field]: value });
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="bg-white dark:bg-[#111111] p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-6 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-[#00BCD4]"></div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-[#00BCD4]">settings</span> 
          Pengaturan Dasar Kelas
        </h3>
        
        <div className="space-y-4">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Course Cover / Thumbnail URL</label>
          <div 
             className="relative w-full aspect-video md:aspect-21/9 bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer group/cover overflow-hidden bg-cover bg-center"
             style={{ backgroundImage: `url(${formData.thumbnail})` }}
             onClick={() => {
                const newUrl = prompt("Masukkan URL Thumbnail Kelas:", formData.thumbnail);
                if(newUrl) handleChange('thumbnail', newUrl);
             }}
          >
             <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/cover:opacity-100 transition-opacity flex flex-col items-center justify-center">
                 <span className="material-symbols-outlined text-[48px] mb-3 text-white scale-90 group-hover/cover:scale-100 transition-all">edit</span>
                 <p className="font-bold text-sm text-white">Ubah URL Gambar</p>
             </div>
          </div>
        </div>

        <div className="space-y-2 mt-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Judul Utama Kelas</label>
          <input type="text" value={formData.title} onChange={(e) => handleChange('title', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#00BCD4]/50 outline-none transition-all" />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Deskripsi Singkat (Subtitle)</label>
          <textarea rows={2} value={formData.description} onChange={(e) => handleChange('description', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-[#00BCD4]/50 outline-none transition-all resize-none" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
           <div className="space-y-2">
             <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tingkat Kesulitan</label>
             <select value={formData.level} onChange={(e) => handleChange('level', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#00BCD4]/50 outline-none transition-all appearance-none cursor-pointer">
                <option value="Pemula">Pemula</option>
                <option value="Menengah">Menengah</option>
                <option value="Mahir">Mahir</option>
             </select>
           </div>
           <div className="space-y-2">
             <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Harga Kelas (Rp)</label>
             <input type="number" value={formData.price} onChange={(e) => handleChange('price', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#00BCD4]/50 outline-none transition-all" />
           </div>
        </div>
      </div>
    </div>
  );
}