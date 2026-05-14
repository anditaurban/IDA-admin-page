'use client';

import React from 'react';
import type { OverviewLandingData } from './overview.types';

type InstructorProfileTabProps = {
  formData: OverviewLandingData;
  setFormData: React.Dispatch<React.SetStateAction<OverviewLandingData>>;
  fontClassName?: string;
};

export default function InstructorProfileTab({
  formData,
  setFormData,
  fontClassName = '',
}: InstructorProfileTabProps) {
  const handleChange = (
    field: keyof Pick<OverviewLandingData, 'instructor' | 'role' | 'bio'>,
    value: string,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-white dark:bg-[#111111] p-8 md:p-10 rounded-4xl border border-slate-200/80 dark:border-slate-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] flex flex-col gap-8 relative overflow-hidden">
      <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800/60 pb-6">
        <div className="size-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center border border-emerald-100 dark:border-emerald-500/20 text-emerald-500">
          <span className="material-symbols-outlined text-[24px]">badge</span>
        </div>
        <div>
          <h3 className={`text-xl font-bold text-slate-900 dark:text-white ${fontClassName}`}>
            Profil Instruktur
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Data ini akan ditampilkan di halaman depan kelas Anda.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="flex flex-col items-center gap-3 shrink-0 mx-auto md:mx-0">
          <div className="size-28 rounded-full bg-slate-100 dark:bg-[#161616] border-4 border-white dark:border-[#111111] shadow-lg flex items-center justify-center text-slate-300 dark:text-slate-700 relative overflow-hidden">
            <span className="material-symbols-outlined text-[48px]">person</span>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Avatar</span>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
              Nama Lengkap / Gelar
            </label>
            <input
              type="text"
              value={formData.instructor}
              onChange={(e) => handleChange('instructor', e.target.value)}
              className="w-full bg-[#fafafa] dark:bg-[#161616] border border-slate-200/60 dark:border-slate-700/60 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-300 dark:focus:border-emerald-500/50 outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
              Role Profesional
            </label>
            <input
              type="text"
              value={formData.role}
              onChange={(e) => handleChange('role', e.target.value)}
              className="w-full bg-[#fafafa] dark:bg-[#161616] border border-slate-200/60 dark:border-slate-700/60 rounded-2xl px-5 py-3.5 text-sm font-medium text-slate-900 dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-300 dark:focus:border-emerald-500/50 outline-none transition-all"
            />
          </div>

          <div className="md:col-span-2 space-y-2 mt-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
              Biodata Pendek
            </label>
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
  );
}