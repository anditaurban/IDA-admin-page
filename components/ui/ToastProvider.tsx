'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

type ToastType = 'success' | 'error' | 'info' | 'loading';

interface ToastState {
  show: boolean;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  showToast: (type: ToastType, message: string) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const toastStyleMap: Record<
  ToastType,
  {
    accent: string;
    iconWrapper: string;
    icon: string;
    title: string;
  }
> = {
  success: {
    accent: 'bg-[#00BCD4]',
    iconWrapper: 'bg-cyan-50 dark:bg-[#00BCD4]/10 text-[#00BCD4]',
    icon: 'check_circle',
    title: 'Berhasil',
  },
  error: {
    accent: 'bg-red-500',
    iconWrapper: 'bg-red-50 dark:bg-red-500/10 text-red-500',
    icon: 'error',
    title: 'Gagal',
  },
  info: {
    accent: 'bg-blue-500',
    iconWrapper: 'bg-blue-50 dark:bg-blue-500/10 text-blue-500',
    icon: 'info',
    title: 'Info',
  },
  loading: {
    accent: 'bg-amber-500',
    iconWrapper: 'bg-amber-50 dark:bg-amber-500/10 text-amber-500',
    icon: 'progress_activity',
    title: 'Memproses',
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState>({
    show: false,
    type: 'success',
    message: '',
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearToastTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const hideToast = useCallback(() => {
    clearToastTimer();
    setToast((prev) => ({ ...prev, show: false }));
  }, [clearToastTimer]);

  const showToast = useCallback(
    (type: ToastType, message: string) => {
      clearToastTimer();

      setToast((prev) => {
        if (prev.show && prev.type === type && prev.message === message) {
          return prev;
        }

        return { show: true, type, message };
      });

      if (type !== 'loading') {
        timerRef.current = setTimeout(() => {
          setToast((prev) => ({ ...prev, show: false }));
          timerRef.current = null;
        }, 3500);
      }
    },
    [clearToastTimer],
  );

  useEffect(() => {
    return () => clearToastTimer();
  }, [clearToastTimer]);

  const currentStyle = toastStyleMap[toast.type];

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}

      {toast.show && (
        <div className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-9999 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <div className="bg-white dark:bg-[#1b2636] border border-slate-200 dark:border-white/10 shadow-2xl rounded-2xl p-4 flex items-center gap-3 pr-8 relative overflow-hidden min-w-75 max-w-sm">
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${currentStyle.accent}`} />

            <div className={`size-10 rounded-full flex items-center justify-center shrink-0 ${currentStyle.iconWrapper}`}>
              <span
                className={`material-symbols-outlined text-[20px] ${
                  toast.type === 'loading' ? 'animate-spin' : ''
                }`}
              >
                {currentStyle.icon}
              </span>
            </div>

            <div className="flex flex-col">
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {currentStyle.title}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                {toast.message}
              </p>
            </div>

            <button
              type="button"
              onClick={hideToast}
              className="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Tutup notifikasi"
            >
              <span className="material-symbols-outlined text-[14px] block">close</span>
            </button>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (context === undefined) {
    throw new Error('useToast harus digunakan di dalam ToastProvider');
  }

  return context;
}