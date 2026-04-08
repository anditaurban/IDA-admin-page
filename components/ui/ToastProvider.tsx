'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

// 1. Definisikan Tipe Data
type ToastType = 'success' | 'error' | 'info';

interface ToastState {
    show: boolean;
    type: ToastType;
    message: string;
}

interface ToastContextType {
    showToast: (type: ToastType, message: string) => void;
}

// 2. Buat Context
const ToastContext = createContext<ToastContextType | undefined>(undefined);

// 3. Buat Provider Component (Bungkus aplikasi dengan ini nanti)
export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toast, setToast] = useState<ToastState>({ show: false, type: 'success', message: '' });
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Fungsi untuk memunculkan Toast (Aman dari spam klik karena ada clearTimeout)
    const showToast = useCallback((type: ToastType, message: string) => {
        setToast({ show: true, type, message });
        
        if (timerRef.current) clearTimeout(timerRef.current);
        
        timerRef.current = setTimeout(() => {
            setToast(prev => ({ ...prev, show: false }));
        }, 3500); // Hilang otomatis dalam 3.5 detik
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            {/* ✨ UI TOAST TERPUSAT (Hanya dirender satu kali di seluruh aplikasi) ✨ */}
            {toast.show && (
                <div className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-9999 animate-in slide-in-from-bottom-10 fade-in duration-300">
                    <div className="bg-white dark:bg-[#1b2636] border border-slate-200 dark:border-white/10 shadow-2xl rounded-2xl p-4 flex items-center gap-3 pr-8 relative overflow-hidden min-w-75 max-w-sm">
                        
                        {/* Garis Aksen Kiri */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${toast.type === 'success' ? 'bg-[#00BCD4]' : toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                        
                        {/* Icon Dinamis */}
                        <div className={`size-10 rounded-full flex items-center justify-center shrink-0 ${toast.type === 'success' ? 'bg-cyan-50 dark:bg-[#00BCD4]/10 text-[#00BCD4]' : toast.type === 'error' ? 'bg-red-50 dark:bg-red-500/10 text-red-500' : 'bg-blue-50 dark:bg-blue-500/10 text-blue-500'}`}>
                            <span className="material-symbols-outlined text-[20px]">
                                {toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'error' : 'info'}
                            </span>
                        </div>
                        
                        {/* Teks Pesan */}
                        <div className="flex flex-col">
                            <p className="text-sm font-bold text-slate-900 dark:text-white capitalize">
                                {toast.type}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                                {toast.message}
                            </p>
                        </div>

                        {/* Tombol Close silang kecil */}
                        <button 
                            onClick={() => setToast(prev => ({ ...prev, show: false }))} 
                            className="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            <span className="material-symbols-outlined text-[14px] block">close</span>
                        </button>
                    </div>
                </div>
            )}
        </ToastContext.Provider>
    );
}

// 4. Custom Hook untuk dipanggil di halaman mana saja
export const useToast = () => {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error("useToast harus digunakan di dalam ToastProvider");
    }
    return context;
};