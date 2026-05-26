'use client';

import React, { useState, useEffect } from 'react';
import { DM_Sans } from 'next/font/google';
import { useVideosTab, BatchSection } from '@/hooks/useVideosTab';
import { VideoBatchForm } from './video/VideoBatchForm';

const googleSansAlt = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '700'] });

export default function VideosTab({ courseSlug = '1' }: { courseSlug?: string }) {
  const { 
    batches, isLoading, isSubmitting, currentPage, totalPages, totalRecords,
    fetchBatches, submitBatch, deleteBatch 
  } = useVideosTab(courseSlug);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingData, setEditingData] = useState<BatchSection | null>(null);

  useEffect(() => {
    fetchBatches(1);
  }, [fetchBatches]);

  const handleOpenAdd = () => {
    setModalMode('add');
    setEditingData(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (batch: BatchSection) => {
    setModalMode('edit');
    setEditingData(batch); // Sekarang strukturnya sudah sama dengan API
    setIsModalOpen(true);
  };

  // FUNGSI GANTI HALAMAN
  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      fetchBatches(newPage);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      
      {/* HEADER TAB */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#111111] p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <h3 className={`text-xl font-bold text-slate-900 dark:text-white ${googleSansAlt.className}`}>Manajemen Sesi & Video</h3>
          <p className="text-sm text-slate-500 mt-1">Kelola daftar video pembelajaran per sesi.</p>
        </div>
        <button onClick={handleOpenAdd} className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-2xl text-sm font-bold transition-all shadow-md">
          <span className="material-symbols-outlined text-[20px]">add</span>
          Tambah Sesi Baru
        </button>
      </div>

      {/* TABLE CONTAINER */}
      <div className="bg-white dark:bg-[#111111] rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-[#161616]/50 border-b border-slate-200/80 dark:border-slate-800">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Sesi</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Periode</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Total Video</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {isLoading && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                     <div className="flex justify-center items-center gap-3"><span className="animate-spin material-symbols-outlined">progress_activity</span> Memuat data...</div>
                  </td>
                </tr>
              )}

              {!isLoading && batches.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center">
                    <span className="material-symbols-outlined text-5xl text-slate-300 block mb-3">movie</span>
                    <h4 className="text-base font-bold text-slate-700 dark:text-slate-300">Belum Ada Sesi</h4>
                    <p className="text-sm text-slate-500">Klik &quot;Tambah Sesi Baru&quot; untuk memulai.</p>
                  </td>
                </tr>
              )}

              {!isLoading && batches.map((batch) => (
                <tr key={batch.batch_id} className="hover:bg-slate-50/50 dark:hover:bg-[#161616]/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800 dark:text-slate-200">{batch.batch_name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">ID Sesi: {batch.batch_id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-lg border border-slate-200/60 dark:border-slate-700">
                      {batch.batch_period || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/20 w-fit px-3 py-1 rounded-full">
                      <span className="material-symbols-outlined text-[16px]">smart_display</span>
                      {(batch.videos || []).length} Video
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleOpenEdit(batch)} className="p-2 bg-white dark:bg-[#222] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:text-cyan-500 hover:border-cyan-200 transition-all" title="Edit Sesi & Video">
                        <span className="material-symbols-outlined text-[18px] block">edit</span>
                      </button>
                      <button onClick={() => deleteBatch(String(batch.batch_id))} className="p-2 bg-white dark:bg-[#222] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:text-rose-500 hover:border-rose-200 transition-all" title="Hapus Sesi">
                        <span className="material-symbols-outlined text-[18px] block">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ✨ PAGINASI YANG SUDAH DISESUAIKAN (Muncul walau halaman cuma 1, untuk menampilkan Total Data) */}
        {!isLoading && batches.length > 0 && (
           <div className="px-6 py-4 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/30 dark:bg-transparent">
             <div className="text-sm text-slate-500 flex items-center gap-2">
               Menampilkan <span className="font-bold text-slate-800 dark:text-slate-200">{batches.length}</span> dari <span className="font-bold text-slate-800 dark:text-slate-200">{totalRecords}</span> sesi
             </div>
             
             {/* Tombol Paginasi (Aktif jika totalPages > 1) */}
             <div className="flex items-center gap-1.5">
               <button 
                 disabled={currentPage <= 1} 
                 onClick={() => handlePageChange(currentPage - 1)} 
                 className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent transition-all text-sm font-medium"
               >
                 <span className="material-symbols-outlined text-[18px]">chevron_left</span> Prev
               </button>
               
               <div className="px-4 py-1.5 text-sm font-bold text-slate-800 dark:text-slate-200">
                 {currentPage} <span className="text-slate-400 font-normal mx-1">/</span> {totalPages}
               </div>

               <button 
                 disabled={currentPage >= totalPages} 
                 onClick={() => handlePageChange(currentPage + 1)} 
                 className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent transition-all text-sm font-medium"
               >
                 Next <span className="material-symbols-outlined text-[18px]">chevron_right</span>
               </button>
             </div>
           </div>
        )}
      </div>

      {isModalOpen && (
        <VideoBatchForm 
          modalMode={modalMode} 
          initialData={editingData} 
          isSubmitting={isSubmitting} 
          onSubmit={async (payload: Partial<BatchSection>) => {
             const success = await submitBatch(payload, modalMode);
             if (success) setIsModalOpen(false);
          }} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </div>
  );
}