import React from 'react';
import { ToastProvider } from '@/components/ui/ToastProvider';

export default function InstructorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Membungkus seluruh halaman instructor dengan ToastProvider
    <ToastProvider>
      <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f111a]">
        {children}
      </div>
    </ToastProvider>
  );
}