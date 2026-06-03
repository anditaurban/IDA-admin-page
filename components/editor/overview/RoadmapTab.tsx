'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  addCourseRoadmap,
  deleteCourseRoadmap,
  getCourseRoadmaps,
  updateCourseRoadmap,
} from './overview.api';
import RichTextEditor from './RichTextEditor';
import type { CourseRoadmapApiItem, RoadmapStep } from './overview.types';

type RoadmapTabProps = {
  courseId: number | string | null;
  apiToken?: string;
  fontClassName?: string;
};

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item: unknown) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    const cleanValue = value.trim();
    if (!cleanValue) return [];

    try {
      const parsed: unknown = JSON.parse(cleanValue);

      if (Array.isArray(parsed)) {
        return parsed.map((item: unknown) => String(item).trim()).filter(Boolean);
      }
    } catch {
      // fallback split comma
    }

    return cleanValue
      .split(',')
      .map((item: string) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeRoadmap(data: CourseRoadmapApiItem[]): RoadmapStep[] {
  return [...data]
    .sort((a, b) => Number(a.step_order) - Number(b.step_order))
    .map((item) => ({
      roadmap_id: Number(item.roadmap_id),
      course_id: Number(item.course_id),
      step_order: Number(item.step_order),
      title: item.title ?? '',
      deskripsi: item.deskripsi ?? '',
      items: toStringArray(item.items),
    }));
}

function cleanItems(items: string[]) {
  return items.map((item) => item.trim()).filter(Boolean);
}

export default function RoadmapTab({
  courseId,
  apiToken,
  fontClassName = '',
}: RoadmapTabProps) {
  const [roadmaps, setRoadmaps] = useState<RoadmapStep[]>([]);
  const [drafts, setDrafts] = useState<Record<number, RoadmapStep>>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numericCourseId = useMemo(() => Number(courseId), [courseId]);
  const isCourseIdValid = Number.isFinite(numericCourseId) && numericCourseId > 0;

  const fetchRoadmaps = async () => {
    if (!isCourseIdValid) {
      setError('course_id belum valid. Pastikan parent mengirim courseId ke OverviewTab.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const payload = await getCourseRoadmaps({
        courseId: numericCourseId,
        apiToken,
      });

      setRoadmaps(normalizeRoadmap(payload.listData ?? []));
    } catch {
      setRoadmaps([]);
      setError(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoadmaps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numericCourseId, apiToken]);

  const startEdit = (step: RoadmapStep) => {
    setEditingId(step.roadmap_id);
    setDrafts((prev) => ({
      ...prev,
      [step.roadmap_id]: {
        ...step,
        items: [...step.items],
      },
    }));
  };

  const cancelEdit = (roadmapId: number) => {
    setEditingId(null);
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[roadmapId];
      return next;
    });
  };

  const addRoadmapStep = async () => {
    if (!isCourseIdValid) {
      setError('Roadmap belum bisa ditambahkan karena course_id belum valid.');
      return;
    }

    try {
      setIsCreating(true);
      setError(null);

      const nextStepOrder = roadmaps.length
        ? Math.max(...roadmaps.map((step) => step.step_order)) + 1
        : 1;

      // 1. Siapkan payload default yang akan dikirim ke backend
      const defaultPayload = {
        course_id: numericCourseId,
        step_order: nextStepOrder,
        title: 'Tahap Baru',
        deskripsi: '<p>Deskripsi tahap pembelajaran.</p>',
        items: ['Pembukaan Course'],
      };

      // 2. Tembak API POST untuk menyimpan
      const response = await addCourseRoadmap({
        apiToken,
        payload: defaultPayload,
      });

      // 3. Tangkap ID baru dari respons backend
      const newRoadmapId = Number(response.data.id);

      if (Number.isFinite(newRoadmapId) && newRoadmapId > 0) {
        // ✨ SOLUSI PROFESIONAL: Rakit item baru secara lokal
        const newStep: RoadmapStep = {
          roadmap_id: newRoadmapId,
          ...defaultPayload,
        };

        // 4. SUNTIKKAN LANGSUNG KE STATE UI (Tanpa perlu Fetch ulang!)
        setRoadmaps((prev) => [...prev, newStep]);

        // 5. Langsung posisikan item baru ini ke mode Edit (Draft)
        setEditingId(newRoadmapId);
        setDrafts((prev) => ({
          ...prev,
          [newRoadmapId]: {
            ...newStep,
            items: [...newStep.items],
          },
        }));
      } else {
        // Fallback: Jika backend aneh dan tidak mengembalikan ID, baru kita paksa Fetch ulang.
        await fetchRoadmaps();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menambahkan roadmap.');
    } finally {
      setIsCreating(false);
    }
  };

  const updateDraft = (
    roadmapId: number,
    field: keyof Pick<RoadmapStep, 'title' | 'deskripsi' | 'items'>,
    value: string | string[],
  ) => {
    setDrafts((prev) => {
      const current = prev[roadmapId];
      if (!current) return prev;

      return {
        ...prev,
        [roadmapId]: {
          ...current,
          [field]: value,
        },
      };
    });
  };

  const updateDraftItem = (roadmapId: number, itemIndex: number, value: string) => {
    setDrafts((prev) => {
      const current = prev[roadmapId];
      if (!current) return prev;

      const nextItems = [...current.items];
      nextItems[itemIndex] = value;

      return {
        ...prev,
        [roadmapId]: {
          ...current,
          items: nextItems,
        },
      };
    });
  };

  const addDraftItem = (roadmapId: number) => {
    setDrafts((prev) => {
      const current = prev[roadmapId];
      if (!current) return prev;

      return {
        ...prev,
        [roadmapId]: {
          ...current,
          items: [...current.items, ''],
        },
      };
    });
  };

  const removeDraftItem = (roadmapId: number, itemIndex: number) => {
    setDrafts((prev) => {
      const current = prev[roadmapId];
      if (!current) return prev;

      return {
        ...prev,
        [roadmapId]: {
          ...current,
          items: current.items.filter((_, index) => index !== itemIndex),
        },
      };
    });
  };

  const saveRoadmapStep = async (roadmapId: number) => {
    const draft = drafts[roadmapId];
    if (!draft) return;

    if (!isCourseIdValid) {
      setError('Roadmap belum bisa disimpan karena course_id belum valid.');
      return;
    }

    const sanitizedItems = cleanItems(draft.items);

    try {
      setError(null);

      setDrafts((prev) => ({
        ...prev,
        [roadmapId]: {
          ...draft,
          isSaving: true,
        },
      }));

      await updateCourseRoadmap({
        roadmapId,
        apiToken,
        payload: {
          course_id: numericCourseId,
          step_order: draft.step_order,
          title: draft.title.trim(),
          deskripsi: draft.deskripsi,
          items: sanitizedItems,
        },
      });

      const savedStep: RoadmapStep = {
        ...draft,
        title: draft.title.trim(),
        items: sanitizedItems,
        isSaving: false,
      };

      setRoadmaps((prev) =>
        prev.map((item) => (item.roadmap_id === roadmapId ? savedStep : item)),
      );

      setEditingId(null);
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[roadmapId];
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan perubahan roadmap.');

      setDrafts((prev) => ({
        ...prev,
        [roadmapId]: {
          ...draft,
          isSaving: false,
        },
      }));
    }
  };

  const removeRoadmapStep = async (roadmapId: number) => {
    if (!confirm('Hapus tahapan ini?')) return;

    try {
      setError(null);

      await deleteCourseRoadmap({
        roadmapId,
        apiToken,
      });

      setRoadmaps((prev) => prev.filter((step) => step.roadmap_id !== roadmapId));
      cancelEdit(roadmapId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus roadmap.');
    }
  };

  return (
    <div className="bg-white dark:bg-[#111111] p-8 md:p-10 rounded-4xl border border-slate-200/80 dark:border-slate-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] flex flex-col gap-8 relative overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-6 relative z-10">
        <div className="flex items-center gap-4">
          <div className="size-12 rounded-2xl bg-cyan-50 dark:bg-cyan-500/10 flex items-center justify-center border border-cyan-100 dark:border-cyan-500/20 text-[#00BCD4]">
            <span className="material-symbols-outlined text-[24px]">route</span>
          </div>

          <div>
            <h3 className={`text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 ${fontClassName}`}>
              Roadmap Pembelajaran
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Susun tahapan materi secara berurutan agar siswa tahu jalur belajarnya.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={addRoadmapStep}
          disabled={isCreating}
          className={`hidden md:flex px-5 py-2.5 bg-[#00BCD4] hover:bg-cyan-500 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold shadow-lg shadow-cyan-500/25 active:scale-95 transition-all items-center gap-2 ${fontClassName}`}
        >
          <span className="material-symbols-outlined text-[20px]">add_circle</span>
          {isCreating ? 'Menambahkan...' : 'Tambah Tahap'}
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="rounded-3xl border border-slate-200/70 dark:border-slate-800 bg-[#fafafa] dark:bg-[#161616] p-8 text-center text-sm font-semibold text-slate-500">
          Memuat data roadmap...
        </div>
      ) : roadmaps.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 bg-[#fafafa] dark:bg-[#161616] p-8 text-center">
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
            Belum ada roadmap.
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Buat roadmap pertama untuk course ini.
          </p>

        </div>
      ) : (
        <div className="relative before:absolute before:inset-y-2 before:left-5.75 md:before:left-6.75 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800/60 space-y-8 pl-1 pb-4">
          {roadmaps.map((step, idx) => {
            const isEditing = editingId === step.roadmap_id;
            const currentStep = isEditing ? drafts[step.roadmap_id] ?? step : step;

            return (
              <div key={step.roadmap_id} className="relative flex gap-5 md:gap-8 items-start group">
                <div className="relative z-10 size-11 md:size-14 shrink-0 bg-white dark:bg-[#111111] rounded-full flex items-center justify-center border-4 border-white dark:border-[#111111]">
                  <div className="size-full bg-cyan-50 dark:bg-cyan-500/10 text-[#00BCD4] font-extrabold text-sm md:text-base rounded-full flex items-center justify-center border border-cyan-200 dark:border-cyan-500/30 shadow-sm transition-all group-hover:scale-110 group-hover:bg-[#00BCD4] group-hover:text-white group-hover:border-[#00BCD4]">
                    {idx + 1}
                  </div>
                </div>

                <div className="flex-1 bg-[#fafafa] dark:bg-[#161616] p-6 md:p-8 rounded-3xl border border-slate-200/60 dark:border-slate-700/60 relative transition-all group-hover:border-cyan-300 dark:group-hover:border-cyan-500/50 group-hover:shadow-[0_8px_30px_rgb(0,188,212,0.05)]">
                  <div className="absolute top-4 right-4 flex items-center gap-1">
                  {isEditing ? (
                    <>
                      {/* ✨ FIX: Tombol Simpan (Save Icon) di atas SINI TELAH DIHAPUS untuk konsistensi */}
                      
                      {/* Hanya tersisa Tombol Batal (Close Icon) */}
                      <button
                        type="button"
                        onClick={() => cancelEdit(step.roadmap_id)}
                        className="text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 p-2 rounded-xl transition-all"
                        title="Batal Edit"
                      >
                        <span className="material-symbols-outlined text-[20px] block">
                          close
                        </span>
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startEdit(step)}
                      className="text-slate-400 hover:text-[#00BCD4] hover:bg-cyan-50 dark:hover:bg-cyan-500/10 p-2 rounded-xl transition-all"
                      title="Edit Roadmap"
                    >
                      <span className="material-symbols-outlined text-[20px] block">
                        edit
                      </span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => removeRoadmapStep(step.roadmap_id)}
                    className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 p-2 rounded-xl transition-all"
                    title="Hapus Tahapan"
                  >
                    <span className="material-symbols-outlined text-[20px] block">
                      delete
                    </span>
                  </button>
                </div>

                  {isEditing ? (
                    <EditRoadmapContent
                      step={currentStep}
                      fontClassName={fontClassName}
                      onUpdateDraft={updateDraft}
                      onUpdateItem={updateDraftItem}
                      onAddItem={addDraftItem}
                      onRemoveItem={removeDraftItem}
                      onSave={() => saveRoadmapStep(step.roadmap_id)}
                    />
                  ) : (
                    <ReadRoadmapContent step={step} fontClassName={fontClassName} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={addRoadmapStep}
        disabled={isCreating}
        className={`md:hidden mt-4 w-full flex justify-center px-5 py-3.5 bg-cyan-50 dark:bg-cyan-500/10 text-[#00BCD4] rounded-2xl text-sm font-bold active:scale-95 transition-all items-center gap-2 border border-cyan-100 dark:border-cyan-500/20 disabled:opacity-60 disabled:cursor-not-allowed ${fontClassName}`}
      >
        <span className="material-symbols-outlined text-[20px]">add_circle</span>
        {isCreating ? 'Menambahkan...' : 'Tambah Tahapan Baru'}
      </button>
    </div>
  );
}

type RoadmapContentProps = {
  step: RoadmapStep;
  fontClassName: string;
};

function ReadRoadmapContent({ step, fontClassName }: RoadmapContentProps) {
  return (
    <div className="space-y-5 max-w-[90%]">
      <div>
        <span className="text-[10px] font-bold text-[#00BCD4] uppercase tracking-widest block mb-1">
          Judul Tahapan
        </span>
        <h4 className={`text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white ${fontClassName}`}>
          {step.title || 'Tanpa Judul'}
        </h4>
      </div>

      <div>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">
          Deskripsi Tahapan
        </span>
        <div
          className="prose prose-sm max-w-none text-slate-600 dark:prose-invert dark:text-slate-400 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_p]:my-1"
          dangerouslySetInnerHTML={{
            __html: step.deskripsi || '<p>Belum ada deskripsi.</p>',
          }}
        />
      </div>

      <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-[16px]">checklist</span>
          Poin-poin Materi
        </span>

        {step.items.length > 0 ? (
          <ul className="space-y-2">
            {step.items.map((item, index) => (
              <li key={`${step.roadmap_id}-read-${index}`} className="flex items-start gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-xs font-bold text-[#00BCD4] dark:bg-cyan-500/10">
                  {index + 1}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm font-medium text-slate-400">
            Belum ada poin materi.
          </p>
        )}
      </div>
    </div>
  );
}

type EditRoadmapContentProps = {
  step: RoadmapStep;
  fontClassName: string;
  onUpdateDraft: (
    roadmapId: number,
    field: keyof Pick<RoadmapStep, 'title' | 'deskripsi' | 'items'>,
    value: string | string[],
  ) => void;
  onUpdateItem: (roadmapId: number, itemIndex: number, value: string) => void;
  onAddItem: (roadmapId: number) => void;
  onRemoveItem: (roadmapId: number, itemIndex: number) => void;
  onSave: () => void;
};

function EditRoadmapContent({
  step,
  fontClassName,
  onUpdateDraft,
  onUpdateItem,
  onAddItem,
  onRemoveItem,
  onSave,
}: EditRoadmapContentProps) {
  return (
    <div className="space-y-5 max-w-[90%]">
      <div>
        <label className="text-[10px] font-bold text-[#00BCD4] uppercase tracking-widest block mb-1">
          Judul Tahapan
        </label>
        <input
          type="text"
          value={step.title}
          onChange={(e) => onUpdateDraft(step.roadmap_id, 'title', e.target.value)}
          className={`w-full bg-transparent border-0 p-0 text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white focus:ring-0 outline-none placeholder:text-slate-300 ${fontClassName}`}
          placeholder="Misal: Pengenalan Dasar AI"
        />
      </div>

      <div>
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">
          Deskripsi Tahapan
        </label>
        <RichTextEditor
          value={step.deskripsi}
          onChange={(value) => onUpdateDraft(step.roadmap_id, 'deskripsi', value)}
          placeholder="Jelaskan secara lengkap apa yang akan dipelajari pada tahap ini..."
        />
      </div>

      <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between gap-4 mb-3">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">checklist</span>
            Poin-poin Materi
          </label>

          <button
            type="button"
            onClick={() => onAddItem(step.roadmap_id)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-100 bg-cyan-50 px-3 py-1.5 text-xs font-bold text-[#00BCD4] transition-all hover:bg-cyan-100 dark:border-cyan-500/20 dark:bg-cyan-500/10"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            Tambah Poin
          </button>
        </div>

        <div className="space-y-2">
          {step.items.length === 0 && (
            <button
              type="button"
              onClick={() => onAddItem(step.roadmap_id)}
              className="w-full rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-4 text-sm font-semibold text-slate-400 transition-all hover:border-cyan-300 hover:text-[#00BCD4] dark:border-slate-700 dark:bg-[#111111]"
            >
              + Tambahkan poin materi pertama
            </button>
          )}

          {step.items.map((item, itemIndex) => (
            <div key={`${step.roadmap_id}-${itemIndex}`} className="flex items-center gap-2">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-xs font-bold text-[#00BCD4] dark:bg-cyan-500/10">
                {itemIndex + 1}
              </span>

              <input
                type="text"
                value={item}
                onChange={(e) => onUpdateItem(step.roadmap_id, itemIndex, e.target.value)}
                className="w-full rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none transition-all focus:ring-2 focus:ring-[#00BCD4]/20 dark:border-slate-700 dark:bg-[#111111] dark:text-slate-300"
                placeholder="Tulis poin materi..."
              />

              <button
                type="button"
                onClick={() => onRemoveItem(step.roadmap_id, itemIndex)}
                className="rounded-xl p-2 text-slate-400 transition-all hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                title="Hapus poin"
              >
                <span className="material-symbols-outlined text-[20px]">delete</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end border-t border-slate-200 pt-5 dark:border-slate-800">
        <button
          type="button"
          onClick={onSave}
          disabled={step.isSaving}
          className={`inline-flex items-center gap-2 rounded-xl bg-[#00BCD4] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition-all hover:bg-cyan-500 active:scale-95 disabled:opacity-60 ${fontClassName}`}
        >
          <span className="material-symbols-outlined text-[18px]">
            {step.isSaving ? 'progress_activity' : 'save'}
          </span>
          {step.isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </div>
    </div>
  );
}