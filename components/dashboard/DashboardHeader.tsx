"use client";

import React from "react";
import { DM_Sans } from "next/font/google";

const googleSansAlt = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
});

type DashboardHeaderProps = {
  displayName: string;
  role: string;
  onMenuToggle: () => void;
};

export default function DashboardHeader({
  displayName,
  role,
  onMenuToggle,
}: DashboardHeaderProps) {
  return (
    <header className="h-20 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 md:px-10 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        {/* ✨ PANGGIL onMenuToggle SAAT DIKLIK */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>

        <h1
          className={`text-xl font-bold text-slate-900 dark:text-white ${googleSansAlt.className} hidden sm:block`}
        >
          Dashboard Instruktur
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
          <span className="material-symbols-outlined text-[24px]">
            notifications
          </span>
          <span className="absolute top-1.5 right-1.5 size-2.5 bg-red-500 border-2 border-white dark:border-[#111111] rounded-full" />
        </button>
        <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />
        <div className="flex items-center gap-3 cursor-pointer">
          <div className="text-right hidden sm:block">
            <p
              className={`text-sm font-bold text-slate-900 dark:text-white leading-tight ${googleSansAlt.className}`}
            >
              {displayName}
            </p>
            <p className="text-[10px] font-bold text-[#00BCD4] uppercase tracking-wider">
              {role}
            </p>
          </div>
          <div className="size-10 rounded-full bg-slate-200 dark:bg-slate-800 border-2 border-[#00BCD4] overflow-hidden relative flex items-center justify-center">
            <div className="text-slate-500 font-bold uppercase">
              {(displayName || "U").substring(0, 2)}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
