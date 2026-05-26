'use client';

import React from 'react';

export type CourseEditorTab = 'overview' | 'materials' | 'videos' | 'assignments' | 'reviews';

type CourseTabNavigationProps = {
  activeTab: CourseEditorTab;
  onTabChange: (tab: CourseEditorTab) => void;
};

const tabs = [
  { id: 'overview', label: 'Overview', icon: 'web' },
  { id: 'materials', label: 'Materials', icon: 'menu_book' },
  { id: 'videos', label: 'Live-Session', icon: 'videocam' },
  { id: 'assignments', label: 'Assignments', icon: 'task' },
  { id: 'reviews', label: 'Student Feedback', icon: 'reviews' },
] as const;

export default function CourseTabNavigation({ activeTab, onTabChange }: CourseTabNavigationProps) {
  return (
    <div className="sticky top-22 z-40 mb-8 flex justify-center sm:justify-start">
      <div className="flex items-center gap-1 p-1.5 bg-[#1a1a2e]/85 dark:bg-[#0a0a14]/85 backdrop-blur-2xl rounded-2xl border border-white/15 dark:border-white/10 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.4),0_0_30px_rgba(255,255,255,0.15)] dark:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.8),0_0_30px_rgba(255,255,255,0.05)] overflow-x-auto no-scrollbar w-full sm:w-max transition-all duration-300">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap overflow-hidden ${
                isActive
                  ? 'text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-white/5 dark:hover:bg-white/5'
              }`}
            >
              {isActive && (
                <div className="absolute inset-0 bg-white/10 dark:bg-white/10 rounded-xl border border-white/20 -z-10" />
              )}
              <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}