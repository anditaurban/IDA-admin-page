'use client';

import React, { useState } from 'react';
import { updateCourseDescription } from './overview.api';
import type { OverviewLandingData } from './overview.types';

type DescriptionClassTabProps = {
  courseId: number | string | null;
  formData: OverviewLandingData;
  setFormData: React.Dispatch<React.SetStateAction<OverviewLandingData>>;
  apiToken?: string;
  fontClassName?: string;
};

export default function DescriptionClassTab({
  courseId,
  formData,
  setFormData,
  apiToken,
  fontClassName = '',
}: DescriptionClassTabProps) {
  const [toolInput, setToolInput] = useState('');
  const [audienceInput, setAudienceInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const updateField = (field: keyof OverviewLandingData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addTag = (
    e: React.KeyboardEvent<HTMLInputElement>,
    field: 'tech_stack' | 'target_audience',
    inputValue: string,
    setInputValue: React.Dispatch<React.SetStateAction<string>>,
  ) => {
    if (e.key !== 'Enter' && e.key !== ',') return;

    e.preventDefault();
    const newTag = inputValue.trim().replace(/,$/, '');

    if (!newTag) return;

    setFormData((prev) => {
      if (prev[field].includes(newTag)) return prev;
      return { ...prev, [field]: [...prev[field], newTag] };
    });

    setInputValue('');
  };

  const removeTag = (field: 'tech_stack' | 'target_audience', tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((tag) => tag !== tagToRemove),
    }));
  };

  const saveDescription = async () => {
    if (!courseId) {
      setError('course_id belum valid. Pastikan parent mengirim courseId ke OverviewTab.');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      await updateCourseDescription({
        courseId,
        apiToken,
        payload: {
          deskripsi: formData.deskripsi,
          tech_stack: formData.tech_stack,
          target_audience: formData.target_audience,
        },
      });

      setSuccess('Deskripsi kelas berhasil disimpan.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan deskripsi kelas.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#111111] p-8 md:p-10 rounded-4xl border border-slate-200/80 dark:border-slate-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] flex flex-col gap-8 relative overflow-hidden">
      <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800/60 pb-6">
        <div className="size-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20 text-indigo-500">
          <span className="material-symbols-outlined text-[24px]">description</span>
        </div>
        <div>
          <h3 className={`text-xl font-bold text-slate-900 dark:text-white ${fontClassName}`}>
            Detail Penawaran Kelas
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Jelaskan nilai jual dan detail kelas yang akan dilihat calon siswa.
          </p>
        </div>
      </div>

      <div className="space-y-3 group">
        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
          Tentang Kelas <span className="text-red-400">*</span>
        </label>
        <textarea
          rows={5}
          value={formData.deskripsi}
          onChange={(e) => updateField('deskripsi', e.target.value)}
          className="w-full bg-[#fafafa] dark:bg-[#161616] border border-slate-200/60 dark:border-slate-700/60 rounded-3xl px-6 py-5 text-sm font-medium text-slate-700 dark:text-slate-300 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-300 dark:focus:border-indigo-500/50 outline-none transition-all resize-none leading-relaxed placeholder:text-slate-400"
          placeholder="Tuliskan deskripsi kelas secara menarik. Jelaskan masalah yang diselesaikan dan benefit mengikuti kelas ini..."
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <TagInput
          id="targetAudienceInput"
          label="Siapa yang Cocok?"
          icon="group"
          tags={formData.target_audience}
          inputValue={audienceInput}
          setInputValue={setAudienceInput}
          placeholder={formData.target_audience.length === 0 ? 'Ketik peran/profesi...' : 'Tambah lagi...'}
          onAddTag={(e) => addTag(e, 'target_audience', audienceInput, setAudienceInput)}
          onRemoveTag={(tag) => removeTag('target_audience', tag)}
        />

        <TagInput
          id="techStackInput"
          label="Software / Tech Stack"
          icon="terminal"
          tags={formData.tech_stack}
          inputValue={toolInput}
          setInputValue={setToolInput}
          placeholder={formData.tech_stack.length === 0 ? 'Ketik tools/software...' : 'Tambah tools...'}
          onAddTag={(e) => addTag(e, 'tech_stack', toolInput, setToolInput)}
          onRemoveTag={(tag) => removeTag('tech_stack', tag)}
        />
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
          {success}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={saveDescription}
          disabled={isSaving}
          className={`inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 ${fontClassName}`}
        >
          <span className="material-symbols-outlined text-[20px]">
            {isSaving ? 'progress_activity' : 'save'}
          </span>
          {isSaving ? 'Menyimpan...' : 'Simpan Deskripsi Kelas'}
        </button>
      </div>
    </div>
  );
}

type TagInputProps = {
  id: string;
  label: string;
  icon: string;
  tags: string[];
  inputValue: string;
  setInputValue: React.Dispatch<React.SetStateAction<string>>;
  placeholder: string;
  onAddTag: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onRemoveTag: (tag: string) => void;
};

function TagInput({
  id,
  label,
  icon,
  tags,
  inputValue,
  setInputValue,
  placeholder,
  onAddTag,
  onRemoveTag,
}: TagInputProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
          {label}
        </label>
        <span className="text-[10px] text-slate-400 font-medium bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
          Tekan Enter
        </span>
      </div>

      <div
        className="w-full bg-[#fafafa] dark:bg-[#161616] border border-slate-200/60 dark:border-slate-700/60 rounded-2xl p-3 flex flex-wrap gap-2.5 focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:border-indigo-300 dark:focus-within:border-indigo-500/50 transition-all cursor-text min-h-14 items-center"
        onClick={() => document.getElementById(id)?.focus()}
      >
        {tags.map((tag, index) => (
          <span
            key={`${tag}-${index}`}
            className="flex items-center gap-1.5 bg-white dark:bg-[#222] border border-slate-200/80 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm animate-in zoom-in-95 duration-200"
          >
            <span className="material-symbols-outlined text-[14px] text-indigo-500">{icon}</span>
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveTag(tag);
              }}
              className="ml-1 text-slate-400 hover:text-red-500 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px] block">cancel</span>
            </button>
          </span>
        ))}

        <input
          id={id}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={onAddTag}
          placeholder={placeholder}
          className="flex-1 bg-transparent border-none outline-none text-sm min-w-30 px-1 text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:ring-0"
        />
      </div>
    </div>
  );
}