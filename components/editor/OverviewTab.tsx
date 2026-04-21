import React, { useState } from 'react';
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

type RoadmapStepType = typeof defaultLandingData.roadmap[0];

// ✨ FIX: Menjadikan courseSlug opsional dengan nilai default agar tidak error di TypeScript
export default function OverviewTab({ courseSlug = 'ngodingai' }: { courseSlug?: string }) {
  // ✨ STATE BARU UNTUK SUB-TABS INTERNAL ✨
  const [activeSubTab, setActiveSubTab] = useState<'description' | 'roadmap' | 'profile'>('description');

  const [formData, setFormData] = useState(() => {
    if (typeof window !== 'undefined') {
      // Data disimpan & dibaca secara terisolasi berdasarkan Slug kelas
      const savedData = localStorage.getItem(`db_course_landing_${courseSlug}`);
      if (savedData) return { ...defaultLandingData, ...JSON.parse(savedData) };
    }
    return defaultLandingData;
  });
  
  const [toolInput, setToolInput] = useState('');
  const [audienceInput, setAudienceInput] = useState('');

  const saveChanges = (newData: typeof formData) => {
    setFormData(newData);
    localStorage.setItem(`db_course_landing_${courseSlug}`, JSON.stringify(newData));
  };

  const handleChange = (field: string, value: string) => {
    saveChanges({ ...formData, [field]: value });
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>, field: 'tools' | 'audience', inputVal: string, setInputVal: React.Dispatch<React.SetStateAction<string>>) => {
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
    saveChanges({ ...formData, [field]: formData[field].filter((t: string) => t !== tagToRemove) });
  };

  const addRoadmapStep = () => {
    const newStep = { id: `r${Date.now()}`, title: 'Tahap Baru', description: 'Deskripsi tahap pembelajaran', items: ['Materi 1'] };
    saveChanges({ ...formData, roadmap: [...formData.roadmap, newStep] });
  };

  const updateRoadmap = (id: string, field: string, value: unknown) => {
    const updatedRoadmap = formData.roadmap.map((step: RoadmapStepType) => step.id === id ? { ...step, [field]: value } : step);
    saveChanges({ ...formData, roadmap: updatedRoadmap });
  };

  const removeRoadmapStep = (id: string) => {
    if(confirm("Hapus tahapan ini?")) {
        saveChanges({ ...formData, roadmap: formData.roadmap.filter((step: RoadmapStepType) => step.id !== id) });
    }
  };

  const subTabs = [
    { id: 'description', label: 'Deskripsi Kelas', icon: 'description', color: 'text-indigo-500' },
    { id: 'roadmap', label: 'Roadmap', icon: 'route', color: 'text-[#00BCD4]' },
    { id: 'profile', label: 'Profil Instruktur', icon: 'badge', color: 'text-emerald-500' },
  ] as const;

  return (
    <div className="animate-fade-in pb-10">
      
      {/* ====================================================
          SUB-TAB NAVIGATION (SEGMENTED CONTROL STYLE)
      ==================================================== */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
           <h2 className={`text-2xl font-extrabold text-slate-900 dark:text-white ${googleSansAlt.className}`}>Landing Page Kelas</h2>
           <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Lengkapi informasi yang akan dilihat oleh calon siswa Anda.</p>
        </div>

        <div className="inline-flex bg-slate-200/50 dark:bg-[#161616] p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 w-full sm:w-auto overflow-x-auto no-scrollbar">
          {subTabs.map((tab) => {
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap ${
                  isActive 
                  ? 'bg-white dark:bg-[#252525] text-slate-900 dark:text-white shadow-sm border border-slate-200/50 dark:border-slate-700/50' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border border-transparent'
                }`}
              >
                <span className={`material-symbols-outlined text-[18px] ${isActive ? tab.color : 'text-slate-400'}`}>
                  {tab.icon}
                </span>
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        
        {/* ====================================================
            SECTION 1: OVERVIEW & ABOUT (INDIGO THEME)
        ==================================================== */}
        {activeSubTab === 'description' && (
          <div className="bg-white dark:bg-[#111111] p-8 md:p-10 rounded-4xl border border-slate-200/80 dark:border-slate-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] flex flex-col gap-8 relative overflow-hidden">
            <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800/60 pb-6">
              <div className="size-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20 text-indigo-500">
                  <span className="material-symbols-outlined text-[24px]">description</span>
              </div>
              <div>
                <h3 className={`text-xl font-bold text-slate-900 dark:text-white ${googleSansAlt.className}`}>
                  Detail Penawaran Kelas
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Jelaskan nilai jual (selling point) dan detail kelas Anda.</p>
              </div>
            </div>

            <div className="space-y-3 group">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                Tentang Kelas <span className="text-red-400">*</span>
              </label>
              <textarea 
                rows={5} 
                value={formData.about} 
                onChange={(e) => handleChange('about', e.target.value)} 
                className="w-full bg-[#fafafa] dark:bg-[#161616] border border-slate-200/60 dark:border-slate-700/60 rounded-3xl px-6 py-5 text-sm font-medium text-slate-700 dark:text-slate-300 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-300 dark:focus:border-indigo-500/50 outline-none transition-all resize-none leading-relaxed placeholder:text-slate-400" 
                placeholder="Tuliskan deksripsi kelas secara menarik. Jelaskan masalah yang diselesaikan dan detail benefit mengambil kelas ini..." 
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Target Audience Input */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Siapa yang Cocok?</label>
                    <span className="text-[10px] text-slate-400 font-medium bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">Tekan Enter</span>
                  </div>
                  <div className="w-full bg-[#fafafa] dark:bg-[#161616] border border-slate-200/60 dark:border-slate-700/60 rounded-2xl p-3 flex flex-wrap gap-2.5 focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:border-indigo-300 dark:focus-within:border-indigo-500/50 transition-all cursor-text min-h-14 items-center" onClick={() => document.getElementById('audienceInput')?.focus()}>
                    {formData.audience.map((aud: string, index: number) => (
                      <span key={index} className="flex items-center gap-1.5 bg-white dark:bg-[#222] border border-slate-200/80 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm animate-in zoom-in-95 duration-200">
                        <span className="material-symbols-outlined text-[14px] text-indigo-500">group</span>{aud}
                        <button onClick={(e) => { e.stopPropagation(); removeTag('audience', aud); }} className="ml-1 text-slate-400 hover:text-red-500 transition-colors"><span className="material-symbols-outlined text-[16px] block">cancel</span></button>
                      </span>
                    ))}
                    <input 
                      id="audienceInput"
                      type="text" 
                      value={audienceInput} 
                      onChange={(e) => setAudienceInput(e.target.value)} 
                      onKeyDown={(e) => handleAddTag(e, 'audience', audienceInput, setAudienceInput)} 
                      placeholder={formData.audience.length === 0 ? "Ketik peran/profesi..." : "Tambah lagi..."} 
                      className="flex-1 bg-transparent border-none outline-none text-sm min-w-30 px-1 text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:ring-0" 
                    />
                  </div>
                </div>

                {/* Tech Stack Input */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Software / Tech Stack</label>
                    <span className="text-[10px] text-slate-400 font-medium bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">Tekan Enter</span>
                  </div>
                  <div className="w-full bg-[#fafafa] dark:bg-[#161616] border border-slate-200/60 dark:border-slate-700/60 rounded-2xl p-3 flex flex-wrap gap-2.5 focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:border-indigo-300 dark:focus-within:border-indigo-500/50 transition-all cursor-text min-h-14 items-center" onClick={() => document.getElementById('toolInput')?.focus()}>
                    {formData.tools.map((tool: string, index: number) => (
                      <span key={index} className="flex items-center gap-1.5 bg-white dark:bg-[#222] border border-slate-200/80 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm animate-in zoom-in-95 duration-200">
                        <span className="material-symbols-outlined text-[14px] text-indigo-500">terminal</span>{tool}
                        <button onClick={(e) => { e.stopPropagation(); removeTag('tools', tool); }} className="ml-1 text-slate-400 hover:text-red-500 transition-colors"><span className="material-symbols-outlined text-[16px] block">cancel</span></button>
                      </span>
                    ))}
                    <input 
                      id="toolInput"
                      type="text" 
                      value={toolInput} 
                      onChange={(e) => setToolInput(e.target.value)} 
                      onKeyDown={(e) => handleAddTag(e, 'tools', toolInput, setToolInput)} 
                      placeholder={formData.tools.length === 0 ? "Ketik tools/software..." : "Tambah tools..."} 
                      className="flex-1 bg-transparent border-none outline-none text-sm min-w-30 px-1 text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:ring-0" 
                    />
                  </div>
                </div>
            </div>
          </div>
        )}

        {/* ====================================================
            SECTION 2: ROADMAP (CYAN/TEAL THEME - TIMELINE UI)
        ==================================================== */}
        {activeSubTab === 'roadmap' && (
          <div className="bg-white dark:bg-[#111111] p-8 md:p-10 rounded-4xl border border-slate-200/80 dark:border-slate-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] flex flex-col gap-8 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-6 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-2xl bg-cyan-50 dark:bg-cyan-500/10 flex items-center justify-center border border-cyan-100 dark:border-cyan-500/20 text-[#00BCD4]">
                      <span className="material-symbols-outlined text-[24px]">route</span>
                  </div>
                  <div>
                    <h3 className={`text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 ${googleSansAlt.className}`}>
                      Roadmap Pembelajaran
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Susun tahapan materi secara berurutan agar siswa tahu jalur belajarnya.</p>
                  </div>
                </div>
                <button onClick={addRoadmapStep} className={`hidden md:flex px-5 py-2.5 bg-[#00BCD4] hover:bg-cyan-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-cyan-500/25 active:scale-95 transition-all items-center gap-2 ${googleSansAlt.className}`}>
                  <span className="material-symbols-outlined text-[20px]">add_circle</span> Tambah Tahap
                </button>
            </div>

            {/* TIMELINE CONTAINER */}
            <div className="relative before:absolute before:inset-y-2 before:left-5.75 md:before:left-6.75 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800/60 space-y-8 pl-1 pb-4">
              {formData.roadmap.map((step: RoadmapStepType, idx: number) => (
                  <div key={step.id} className="relative flex gap-5 md:gap-8 items-start group">
                    
                    {/* Timeline Indicator Node */}
                    <div className="relative z-10 size-11 md:size-14 shrink-0 bg-white dark:bg-[#111111] rounded-full flex items-center justify-center border-4 border-white dark:border-[#111111]">
                        <div className="size-full bg-cyan-50 dark:bg-cyan-500/10 text-[#00BCD4] font-extrabold text-sm md:text-base rounded-full flex items-center justify-center border border-cyan-200 dark:border-cyan-500/30 shadow-sm transition-all group-hover:scale-110 group-hover:bg-[#00BCD4] group-hover:text-white group-hover:border-[#00BCD4]">
                          {idx + 1}
                        </div>
                    </div>

                    {/* Editable Step Card */}
                    <div className="flex-1 bg-[#fafafa] dark:bg-[#161616] p-6 md:p-8 rounded-3xl border border-slate-200/60 dark:border-slate-700/60 relative transition-all group-hover:border-cyan-300 dark:group-hover:border-cyan-500/50 group-hover:shadow-[0_8px_30px_rgb(0,188,212,0.05)]">
                        
                        {/* Delete Button (Appears on Hover) */}
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button onClick={() => removeRoadmapStep(step.id)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 p-2 rounded-xl transition-all" title="Hapus Tahapan">
                            <span className="material-symbols-outlined text-[20px] block">delete</span>
                          </button>
                        </div>

                        <div className="space-y-4 md:space-y-5 max-w-[90%]">
                          {/* Title Input */}
                          <div>
                            <label className="text-[10px] font-bold text-[#00BCD4] uppercase tracking-widest block mb-1">Judul Tahapan</label>
                            <input 
                              type="text" 
                              value={step.title} 
                              onChange={(e) => updateRoadmap(step.id, 'title', e.target.value)} 
                              className={`w-full bg-transparent border-0 p-0 text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white focus:ring-0 outline-none placeholder:text-slate-300 ${googleSansAlt.className}`} 
                              placeholder="Misal: Pengenalan Dasar AI" 
                            />
                          </div>
                          
                          {/* Description Textarea */}
                          <div>
                            <textarea 
                              rows={2} 
                              value={step.description} 
                              onChange={(e) => updateRoadmap(step.id, 'description', e.target.value)} 
                              className="w-full bg-transparent border-0 p-0 text-sm font-medium text-slate-600 dark:text-slate-400 focus:ring-0 outline-none resize-none leading-relaxed placeholder:text-slate-400/50" 
                              placeholder="Jelaskan secara singkat apa yang akan dipelajari pada tahap ini..." 
                            />
                          </div>
                          
                          {/* Items / Checklist Input */}
                          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-2">
                                <span className="material-symbols-outlined text-[16px]">checklist</span> Poin-poin Materi
                              </label>
                              <div className="relative flex items-center">
                                <input 
                                  type="text" 
                                  value={step.items.join(', ')} 
                                  onChange={(e) => updateRoadmap(step.id, 'items', e.target.value.split(',').map(s=>s.trim()).filter(Boolean))} 
                                  className="w-full bg-white dark:bg-[#111111] text-sm font-medium px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-[#00BCD4]/20 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition-all placeholder:text-slate-300" 
                                  placeholder="Materi 1, Materi 2, Materi 3..." 
                                />
                              </div>
                              <p className="text-[10px] text-slate-400 mt-2 ml-1">Pisahkan antar materi dengan tanda koma (,)</p>
                          </div>
                        </div>
                    </div>
                  </div>
              ))}
            </div>

            {/* Mobile Add Button */}
            <button onClick={addRoadmapStep} className={`md:hidden mt-4 w-full flex justify-center px-5 py-3.5 bg-cyan-50 dark:bg-cyan-500/10 text-[#00BCD4] rounded-2xl text-sm font-bold active:scale-95 transition-all items-center gap-2 border border-cyan-100 dark:border-cyan-500/20 ${googleSansAlt.className}`}>
              <span className="material-symbols-outlined text-[20px]">add_circle</span> Tambah Tahapan Baru
            </button>

          </div>
        )}

        {/* ====================================================
            SECTION 3: INSTRUCTOR PROFILE (EMERALD THEME)
        ==================================================== */}
        {activeSubTab === 'profile' && (
          <div className="bg-white dark:bg-[#111111] p-8 md:p-10 rounded-4xl border border-slate-200/80 dark:border-slate-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] flex flex-col gap-8 relative overflow-hidden">
            <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800/60 pb-6">
              <div className="size-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center border border-emerald-100 dark:border-emerald-500/20 text-emerald-500">
                  <span className="material-symbols-outlined text-[24px]">badge</span>
              </div>
              <div>
                <h3 className={`text-xl font-bold text-slate-900 dark:text-white ${googleSansAlt.className}`}>
                  Profil Instruktur
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Data ini akan ditampilkan di halaman depan kelas Anda.</p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-start">
              
              {/* Visual Avatar Placeholder */}
              <div className="flex flex-col items-center gap-3 shrink-0 mx-auto md:mx-0">
                <div className="size-28 rounded-full bg-slate-100 dark:bg-[#161616] border-4 border-white dark:border-[#111111] shadow-lg flex items-center justify-center text-slate-300 dark:text-slate-700 relative overflow-hidden">
                    <span className="material-symbols-outlined text-[48px]">person</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Avatar</span>
              </div>

              {/* Input Fields */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Nama Lengkap / Gelar</label>
                    <input 
                      type="text" 
                      value={formData.instructor} 
                      onChange={(e) => handleChange('instructor', e.target.value)} 
                      className="w-full bg-[#fafafa] dark:bg-[#161616] border border-slate-200/60 dark:border-slate-700/60 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-300 dark:focus:border-emerald-500/50 outline-none transition-all" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Role Profesional</label>
                    <input 
                      type="text" 
                      value={formData.role} 
                      onChange={(e) => handleChange('role', e.target.value)} 
                      className="w-full bg-[#fafafa] dark:bg-[#161616] border border-slate-200/60 dark:border-slate-700/60 rounded-2xl px-5 py-3.5 text-sm font-medium text-slate-900 dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-300 dark:focus:border-emerald-500/50 outline-none transition-all" 
                    />
                  </div>
                  
                  <div className="md:col-span-2 space-y-2 mt-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Biodata Pendek</label>
                    <textarea 
                      rows={3} 
                      value={formData.bio} 
                      onChange={(e) => handleChange('bio', e.target.value)} 
                      className="w-full bg-[#fafafa] dark:bg-[#161616] border border-slate-200/60 dark:border-slate-700/60 rounded-2xl px-5 py-4 text-sm font-medium text-slate-700 dark:text-slate-300 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-300 dark:focus:border-emerald-500/50 outline-none transition-all resize-none leading-relaxed" 
                    />
                  </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}