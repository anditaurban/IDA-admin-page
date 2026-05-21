'use client';

import React from 'react';
import { DM_Sans } from 'next/font/google';

const googleSansAlt = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '700', '800'] });

// Mock Transaksi
const mockTransactions = [
  { id: 'INV-001', type: 'Penjualan', course: 'Mastering Next.js', amount: '+ Rp 450.000', status: 'Success', date: '21 Mei 2026' },
  { id: 'WD-092', type: 'Penarikan', course: 'Transfer ke BCA', amount: '- Rp 1.500.000', status: 'Pending', date: '20 Mei 2026' },
  { id: 'INV-002', type: 'Penjualan', course: 'UI/UX Masterclass', amount: '+ Rp 350.000', status: 'Success', date: '18 Mei 2026' },
];

export default function RevenuePage() {
  return (
    <main className="p-4 md:p-8 flex flex-col gap-6 lg:gap-8 max-w-7xl mx-auto w-full">
      <div>
        <h1 className={`text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white ${googleSansAlt.className}`}>
          Pendapatan
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Pantau penjualan kelas dan kelola pencairan dana Anda.
        </p>
      </div>

      {/* METRIK KEUANGAN */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Kartu Saldo Utama (Distinct Styling) */}
        <div className="bg-linear-to-br from-[#1b2636] to-slate-800 p-6 rounded-3xl shadow-lg relative overflow-hidden text-white flex flex-col justify-between min-h-40">
          <div className="absolute -right-6 -top-6 size-32 bg-[#00BCD4]/20 blur-2xl rounded-full pointer-events-none" />
          <div>
            <p className="text-sm text-slate-300 font-medium mb-1">Saldo Tersedia</p>
            <h2 className={`text-3xl md:text-4xl font-black tracking-tight ${googleSansAlt.className}`}>
              Rp 4.250.000
            </h2>
          </div>
          <button className="mt-6 self-start px-5 py-2.5 bg-[#00BCD4] hover:bg-[#00acc1] text-white text-sm font-bold rounded-xl transition-colors shadow-md">
            Cairkan Dana
          </button>
        </div>

        {/* Kartu Pending */}
        <div className="bg-white dark:bg-[#111111] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center min-h-40">
          <div className="flex items-center gap-3 mb-3">
            <div className="size-10 bg-amber-50 dark:bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">pending_actions</span>
            </div>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Dalam Proses</p>
          </div>
          <h3 className={`text-2xl font-bold text-slate-900 dark:text-white ${googleSansAlt.className}`}>
            Rp 850.000
          </h3>
          <p className="text-xs text-slate-400 mt-2">Dana ditahan selama masa garansi (7 hari).</p>
        </div>

        {/* Kartu Total Keseluruhan */}
        <div className="bg-white dark:bg-[#111111] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center min-h-40 md:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="size-10 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
            </div>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Total Pendapatan</p>
          </div>
          <h3 className={`text-2xl font-bold text-slate-900 dark:text-white ${googleSansAlt.className}`}>
            Rp 15.600.000
          </h3>
          <p className="text-xs text-emerald-500 font-bold mt-2 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">trending_up</span> +12% bulan ini
          </p>
        </div>
      </div>

      {/* RIWAYAT TRANSAKSI */}
      <div className="mt-4 bg-white dark:bg-[#111111] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
        <div className="p-5 md:p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <h3 className={`text-lg font-bold text-slate-900 dark:text-white ${googleSansAlt.className}`}>
            Riwayat Transaksi
          </h3>
          <button className="text-[#00BCD4] text-sm font-bold hover:underline">Lihat Semua</button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
          {mockTransactions.map((trx, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row justify-between sm:items-center p-5 md:p-6 hover:bg-slate-50/50 dark:hover:bg-[#161616] transition-colors gap-4">
              
              <div className="flex items-center gap-4">
                <div className={`size-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  trx.type === 'Penjualan' ? 'bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10' : 'bg-rose-50 text-rose-500 dark:bg-rose-500/10'
                }`}>
                  <span className="material-symbols-outlined text-[24px]">
                    {trx.type === 'Penjualan' ? 'shopping_bag' : 'account_balance'}
                  </span>
                </div>
                <div>
                  <p className="text-sm md:text-base font-bold text-slate-900 dark:text-white mb-0.5">{trx.course}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>{trx.date}</span>
                    <span className="size-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
                    <span>{trx.id}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-row sm:flex-col justify-between sm:items-end sm:text-right pl-16 sm:pl-0">
                <p className={`text-sm md:text-base font-bold ${
                  trx.type === 'Penjualan' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'
                }`}>
                  {trx.amount}
                </p>
                <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider mt-1.5 inline-block ${
                  trx.status === 'Success' 
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                }`}>
                  {trx.status}
                </span>
              </div>
              
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}