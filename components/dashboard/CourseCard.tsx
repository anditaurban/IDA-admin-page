'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { DM_Sans } from 'next/font/google';
import type { CourseItem } from '@/hooks/useInstructorDashboard';

const googleSansAlt = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '700', '800'] });

export default function CourseCard({ course }: { course: CourseItem }) {
  const isImageThumbnail = course.thumbnail?.startsWith('http') || course.thumbnail?.startsWith('data:');
  const isCssThumbnail = course.thumbnail?.startsWith('bg-');

  // Helper Harga
  const displayPrice = course.totalPrice > 0 
    ? `Rp ${new Intl.NumberFormat('id-ID').format(course.totalPrice)}` 
    : 'Gratis';

  return (
    <div className="bg-white dark:bg-[#111111] rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl hover:border-cyan-200 dark:hover:border-slate-700 transition-all duration-300 group flex flex-col h-full">
      
      {/* THUMBNAIL */}
      <div className="h-36 bg-slate-100 dark:bg-slate-900 relative border-b border-slate-200 dark:border-slate-800 overflow-hidden shrink-0">
        {isImageThumbnail ? (
          <Image src={course.thumbnail!} alt={course.title} fill unoptimized className="object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
        ) : (
          <div className={`absolute inset-0 opacity-50 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500 ${isCssThumbnail ? course.thumbnail : 'bg-linear-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900'}`} />
        )}

        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
          <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border backdrop-blur-md flex items-center gap-1.5 ${
            course.status === 'Published'
              ? 'bg-emerald-50/90 text-emerald-600 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800/50'
              : 'bg-amber-50/90 text-amber-600 border-amber-200 dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-800/50'
          }`}>
            <span className={`size-1.5 rounded-full ${course.status === 'Published' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
            {course.status}
          </span>
          {course.batch && (
            <span className="bg-slate-900/80 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg w-max backdrop-blur-md">
              {course.batch}
            </span>
          )}
        </div>
      </div>

      {/* CONTENT INFO */}
      <div className="p-6 flex flex-col flex-1">
        <h3 className={`text-lg font-bold text-slate-900 dark:text-white leading-snug mb-2 group-hover:text-[#00BCD4] transition-colors line-clamp-2 ${googleSansAlt.className}`}>
          {course.title}
        </h3>

        {/* ✨ HARGA KELAS DITAMPILKAN MENCOLOK */}
        <div className="mb-4">
          <span className="text-[17px] font-black text-emerald-600 dark:text-emerald-400">
            {displayPrice}
          </span>
        </div>

        <div className="mt-auto space-y-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
              <span className="material-symbols-outlined text-[18px]">group</span> {course.students} Siswa
            </div>
            {/* ✨ TANGGAL SUDAH FORMAT DD MMM YYYY */}
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium text-xs">
              <span className="material-symbols-outlined text-[16px]">calendar_today</span> {course.lastUpdated}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <Link href={`/course-editor?course=${course.id}`} className={`flex-1 flex justify-center items-center gap-2 px-4 py-2.5 bg-[#00BCD4]/10 hover:bg-[#00BCD4] text-[#00BCD4] hover:text-white rounded-xl text-sm font-bold transition-all border border-[#00BCD4]/20 hover:border-[#00BCD4] active:scale-95 ${googleSansAlt.className}`}>
              <span className="material-symbols-outlined text-[18px]">edit</span> Edit Kelas
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}