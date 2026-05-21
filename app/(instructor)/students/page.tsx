'use client';

import React from 'react';
import { DM_Sans } from 'next/font/google';

const googleSansAlt = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '700', '800'] });

// Mock Data
const mockStudents = [
  { id: 1, name: 'Budi Santoso', email: 'budi@example.com', course: 'Mastering Next.js 14', progress: 85, date: '12 Mei 2026' },
  { id: 2, name: 'Siti Aminah', email: 'siti@example.com', course: 'UI/UX Design Masterclass', progress: 40, date: '10 Mei 2026' },
  { id: 3, name: 'Andi Wijaya', email: 'andi@example.com', course: 'Mastering Next.js 14', progress: 100, date: '05 Mei 2026' },
];

export default function StudentsPage() {
  return (
    <main className="p-4 md:p-8 flex flex-col gap-6 lg:gap-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className={`text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white ${googleSansAlt.className}`}>
            Daftar Siswa
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Pantau progres belajar dan interaksi siswa di kelas Anda.
          </p>
        </div>
      </div>

      {/* LIST SISWA */}
      <div className="bg-white dark:bg-[#111111] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Header List (Hanya Desktop) */}
        <div className="hidden md:grid grid-cols-12 gap-4 p-5 bg-slate-50 dark:bg-[#0a0a0a] border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <div className="col-span-4">Profil Siswa</div>
          <div className="col-span-4">Kelas Diikuti</div>
          <div className="col-span-3">Progres Belajar</div>
          <div className="col-span-1 text-center">Aksi</div>
        </div>

        {/* Baris Data */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
          {mockStudents.map((student) => (
            <div key={student.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-5 items-center hover:bg-slate-50/50 dark:hover:bg-[#161616] transition-colors">
              
              {/* Profil */}
              <div className="col-span-1 md:col-span-4 flex items-center gap-4">
                <div className="size-10 rounded-full bg-[#00BCD4]/10 text-[#00BCD4] font-bold flex items-center justify-center shrink-0">
                  {student.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{student.name}</p>
                  <p className="text-xs text-slate-500">{student.email}</p>
                </div>
              </div>

              {/* Kelas (Di HP pindah ke bawah nama) */}
              <div className="col-span-1 md:col-span-4">
                <p className="text-xs font-bold text-slate-400 md:hidden mb-1">Kelas:</p>
                <span className="inline-block px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-lg truncate max-w-full">
                  {student.course}
                </span>
                <p className="text-[10px] text-slate-400 mt-1">Bergabung: {student.date}</p>
              </div>

              {/* Progres Bar */}
              <div className="col-span-1 md:col-span-3">
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className={student.progress === 100 ? 'text-emerald-500' : 'text-slate-500'}>
                    {student.progress === 100 ? 'Lulus' : 'Belajar'}
                  </span>
                  <span className="text-slate-900 dark:text-white">{student.progress}%</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${student.progress === 100 ? 'bg-emerald-500' : 'bg-[#00BCD4]'}`}
                    style={{ width: `${student.progress}%` }}
                  />
                </div>
              </div>

              {/* Aksi */}
              <div className="col-span-1 flex md:justify-center mt-2 md:mt-0">
                <button className="px-4 md:px-0 py-2 md:py-2 w-full md:w-auto text-center text-[#00BCD4] hover:bg-[#00BCD4]/10 rounded-lg text-sm font-bold transition-colors">
                  Detail
                </button>
              </div>

            </div>
          ))}
        </div>
      </div>
    </main>
  );
}