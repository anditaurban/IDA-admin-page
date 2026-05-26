'use client';

import React, { useMemo, useState } from 'react';
import { DM_Sans } from 'next/font/google';

import DescriptionClassTab from './overview/DescriptionClassTab';
import RoadmapTab from './overview/RoadmapTab';
import InstructorProfileTab from './overview/InstructorProfileTab';

import type {
  ActiveOverviewSubTab,
  OverviewLandingData,
  OverviewTabProps,
} from './overview/overview.types';

const googleSansAlt = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '700', '800'],
});

const defaultLandingData: OverviewLandingData = {
  deskripsi: '',
  tech_stack: [],
  target_audience: [],
  instructor: '',
  role: '',
  bio: '',
};

function resolveCourseId(courseId?: number | string, courseSlug?: string) {
  const rawValue = courseId ?? courseSlug;
  const parsed = Number(rawValue);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function mergeInitialData(initialData?: OverviewTabProps['initialData']): OverviewLandingData {
  return {
    ...defaultLandingData,
    ...initialData,
    tech_stack: Array.isArray(initialData?.tech_stack)
      ? initialData.tech_stack
      : defaultLandingData.tech_stack,
    target_audience: Array.isArray(initialData?.target_audience)
      ? initialData.target_audience
      : defaultLandingData.target_audience,
  };
}

export default function OverviewTab({
  courseSlug = 'default-course',
  courseId,
  initialData,
  apiToken,
}: OverviewTabProps) {
  const [activeSubTab, setActiveSubTab] =
    useState<ActiveOverviewSubTab>('description');

  const activeCourseId = useMemo(
    () => resolveCourseId(courseId, courseSlug),
    [courseId, courseSlug],
  );

  const initialFormData = useMemo(() => mergeInitialData(initialData), [initialData]);
  const [formData, setFormData] = useState<OverviewLandingData>(initialFormData);

  const subTabs = [
    {
      id: 'description',
      label: 'Deskripsi Kelas',
      icon: 'description',
      color: 'text-indigo-500',
    },
    {
      id: 'roadmap',
      label: 'Roadmap',
      icon: 'route',
      color: 'text-[#00BCD4]',
    },
    {
      id: 'profile',
      label: 'Profil Instruktur',
      icon: 'badge',
      color: 'text-emerald-500',
    },
  ] as const;

  return (
    <div className="animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2
            className={`text-2xl font-extrabold text-slate-900 dark:text-white ${googleSansAlt.className}`}
          >
            Landing Page Kelas
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Lengkapi informasi yang akan dilihat oleh calon siswa Anda.
          </p>
        </div>

        <div className="inline-flex bg-slate-200/50 dark:bg-[#161616] p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 w-full sm:w-auto overflow-x-auto no-scrollbar">
          {subTabs.map((tab) => {
            const isActive = activeSubTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap ${
                  isActive
                    ? 'bg-white dark:bg-[#252525] text-slate-900 dark:text-white shadow-sm border border-slate-200/50 dark:border-slate-700/50'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border border-transparent'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[18px] ${
                    isActive ? tab.color : 'text-slate-400'
                  }`}
                >
                  {tab.icon}
                </span>
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeSubTab === 'description' && (
          <DescriptionClassTab
            courseId={activeCourseId}
            formData={formData}
            setFormData={setFormData}
            apiToken={apiToken}
            fontClassName={googleSansAlt.className}
          />
        )}

        {activeSubTab === 'roadmap' && (
          <RoadmapTab
            courseId={activeCourseId}
            apiToken={apiToken}
            fontClassName={googleSansAlt.className}
          />
        )}

        {activeSubTab === 'profile' && (
          <InstructorProfileTab
            courseId={activeCourseId} // ✨ SUNTIKKAN INI
            apiToken={apiToken}       // ✨ SUNTIKKAN INI
            formData={formData}
            setFormData={setFormData}
            fontClassName={googleSansAlt.className}
          />
        )}
      </div>
    </div>
  );
}