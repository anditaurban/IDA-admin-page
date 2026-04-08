import React, { useState, useEffect } from 'react';
import { DM_Sans } from 'next/font/google';

const googleSansAlt = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '700', '800'] });

const defaultLandingData = {
  about: "Belajar ngoding pakai AI, bangun project website dalam waktu singkat, bebas berkreasi tanpa hambatan coding manual!",
  tools: ["VS Code", "Python 3.10+", "OpenAI API Key"],
  audience: ["Python Developer", "Data Scientist", "AI Enthusiast"],
  instructor: "Andita Permata Rahmawati",
  role: "AI Researcher",
  bio: "Dosen Ilmu Komputer. Web Developer Praktisi. Spesialis Pengembangan Aplikasi Web & Arsitektur Sistem.",
  roadmap: [
    { id: 'r1', title: 'Pengenalan AI dalam Coding', description: 'Memahami dasar-dasar AI untuk programming dan setup tools modern.', items: ['Apa itu AI dalam programming?', 'Prompt Engineering 101', 'Instalasi VS Code'] },
    { id: 'r2', title: 'Membuat Project dengan AI', description: 'Hands-on membuat website lengkap dengan fitur CRUD dan API.', items: ['Wireframe dengan AI', 'Generate HTML & Tailwind', 'Node.js + Express API'] }
  ]
};

export default function LandingPageSettings() {
  const [formData, setFormData] = useState(defaultLandingData);
  const [toolInput, setToolInput] = useState('');
  const [audienceInput, setAudienceInput] = useState('');

  useEffect(() => {
    const savedData = localStorage.getItem('db_course_landing');
    if (savedData) setFormData({ ...defaultLandingData, ...JSON.parse(savedData) });
  }, []);

  const saveChanges = (newData: typeof formData) => {
    setFormData(newData);
    localStorage.setItem('db_course_landing', JSON.stringify(newData));
  };

  const handleChange = (field: string, value: string) => {
    saveChanges({ ...formData, [field]: value });
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>, field: 'tools' | 'audience', inputVal: string, setInputVal: any) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = inputVal.trim().replace(/,$/, '');
      if (newTag && !formData[field].includes(newTag)) {
        saveChanges({ ...formData, [field]: [...formData[field], newTag] });
      }
      setInputVal('');
    }
  };

  const removeTag = (field: 'tools' | 'audience', tagToRemove: string) => {
    saveChanges({ ...formData, [field]: formData[field].filter(t => t !== tagToRemove) });
  };

  // --- LOGIKA ROADMAP BUILDER ---
  const addRoadmapStep = () => {
    const newStep = { id: `r${Date.now()}`, title: 'Tahap Baru', description: 'Deskripsi tahap pembelajaran', items: ['Materi 1'] };
    saveChanges({ ...formData, roadmap: [...formData.roadmap, newStep] });
  };

  const updateRoadmap = (id: string, field: string, value: any) => {
    const updatedRoadmap = formData.roadmap.map(step => step.id === id ? { ...step, [field]: value } : step);
    saveChanges({ ...formData, roadmap: updatedRoadmap });
  };

  const removeRoadmapStep = (id: string) => {
    if(confirm("Hapus tahapan ini?")) {
        saveChanges({ ...formData, roadmap: formData.roadmap.filter(step => step.id !== id) });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      
      {/* 1. Deskripsi & Target Peserta */}
      <div className="bg-white dark:bg-[#111111] p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500"></div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-indigo-500">description</span> Deskripsi Penawaran
        </h3>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tentang Kelas (About)</label>
          <textarea rows={4} value={formData.about} onChange={(e) => handleChange('about', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all resize-none leading-relaxed" placeholder="Jelaskan secara detail benefit mengambil kelas ini..." />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                 <span>Siapa yang Cocok? (Target Audience)</span>
                 <span className="text-[9px] font-normal normal-case">Tekan <kbd className="bg-slate-200 dark:bg-slate-700 px-1 rounded">Enter</kbd></span>
              </label>
              <div className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-2 flex flex-wrap gap-2 focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all">
                 {formData.audience.map((aud, index) => (
                   <span key={index} className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm animate-in zoom-in-95 duration-200">
                     <span className="material-symbols-outlined text-[14px] text-indigo-500">group</span>{aud}
                     <button onClick={() => removeTag('audience', aud)} className="ml-1 text-slate-400 hover:text-red-500 transition-colors"><span className="material-symbols-outlined text-[14px]">close</span></button>
                   </span>
                 ))}
                 <input type="text" value={audienceInput} onChange={(e) => setAudienceInput(e.target.value)} onKeyDown={(e) => handleAddTag(e, 'audience', audienceInput, setAudienceInput)} placeholder="Siapa yang cocok?" className="flex-1 bg-transparent border-none outline-none text-sm min-w-37.5 px-2 text-slate-700 dark:text-slate-300 placeholder:text-slate-400" />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                 <span>Tech Stacks / Software</span>
                 <span className="text-[9px] font-normal normal-case">Tekan <kbd className="bg-slate-200 dark:bg-slate-700 px-1 rounded">Enter</kbd></span>
              </label>
              <div className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-2 flex flex-wrap gap-2 focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all">
                 {formData.tools.map((tool, index) => (
                   <span key={index} className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm animate-in zoom-in-95 duration-200">
                     <span className="material-symbols-outlined text-[14px] text-indigo-500">code</span>{tool}
                     <button onClick={() => removeTag('tools', tool)} className="ml-1 text-slate-400 hover:text-red-500 transition-colors"><span className="material-symbols-outlined text-[14px]">close</span></button>
                   </span>
                 ))}
                 <input type="text" value={toolInput} onChange={(e) => setToolInput(e.target.value)} onKeyDown={(e) => handleAddTag(e, 'tools', toolInput, setToolInput)} placeholder="Ketik tools..." className="flex-1 bg-transparent border-none outline-none text-sm min-w-37.5 px-2 text-slate-700 dark:text-slate-300 placeholder:text-slate-400" />
              </div>
            </div>
        </div>
      </div>

      {/* ✨ 2. ROADMAP BUILDER (SANGAT CANGGIH & DINAMIS) ✨ */}
      <div className="bg-white dark:bg-[#111111] p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-cyan-500"></div>
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-cyan-500">timeline</span> Roadmap Pembelajaran
              </h3>
              <p className="text-xs text-slate-500">Susun tahapan materi (*Timeline*) yang akan dilihat calon siswa.</p>
            </div>
            <button onClick={addRoadmapStep} className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-1.5">
               <span className="material-symbols-outlined text-[16px]">add</span> Tambah Tahap
            </button>
        </div>

        <div className="space-y-4">
           {formData.roadmap.map((step, idx) => (
              <div key={step.id} className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 relative group transition-all hover:border-cyan-300 dark:hover:border-cyan-700/50">
                 <div className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => removeRoadmapStep(step.id)} className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 p-1.5 rounded-md"><span className="material-symbols-outlined text-[18px] block">delete</span></button>
                 </div>
                 <div className="flex gap-4">
                    <div className="size-10 shrink-0 bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400 font-bold rounded-xl flex items-center justify-center border border-cyan-200 dark:border-cyan-800/50">
                       0{idx + 1}
                    </div>
                    <div className="flex-1 space-y-3">
                       <input type="text" value={step.title} onChange={(e) => updateRoadmap(step.id, 'title', e.target.value)} className="w-full bg-transparent border-b border-slate-200 dark:border-slate-700 pb-1 text-lg font-bold text-slate-900 dark:text-white focus:border-cyan-500 outline-none" placeholder="Judul Tahapan..." />
                       <textarea rows={2} value={step.description} onChange={(e) => updateRoadmap(step.id, 'description', e.target.value)} className="w-full bg-transparent text-sm text-slate-600 dark:text-slate-400 outline-none resize-none leading-relaxed" placeholder="Deskripsi tahapan..." />
                       
                       <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Poin-Poin Materi (Pisahkan dengan Koma)</label>
                          <input type="text" value={step.items.join(', ')} onChange={(e) => updateRoadmap(step.id, 'items', e.target.value.split(',').map(s=>s.trim()).filter(Boolean))} className="w-full bg-slate-50 dark:bg-slate-900 text-sm p-2 rounded-lg outline-none focus:ring-1 focus:ring-cyan-500 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300" placeholder="Materi 1, Materi 2, Materi 3" />
                       </div>
                    </div>
                 </div>
              </div>
           ))}
        </div>
      </div>

      {/* 3. Profil Instruktur */}
      <div className="bg-white dark:bg-[#111111] p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
        <div className="md:col-span-2">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-emerald-500">person</span> 
            Profil Penulis / Instruktur
          </h3>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nama Lengkap / Gelar</label>
          <input type="text" value={formData.instructor} onChange={(e) => handleChange('instructor', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all" />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Jabatan Profesional (Role)</label>
          <input type="text" value={formData.role} onChange={(e) => handleChange('role', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all" />
        </div>
        <div className="md:col-span-2 space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Biodata Instruktur</label>
          <textarea rows={3} value={formData.bio} onChange={(e) => handleChange('bio', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all resize-none" />
        </div>
      </div>

    </div>
  );
}