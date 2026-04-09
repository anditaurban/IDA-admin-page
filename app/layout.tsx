import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// ✨ FIX: Menggunakan Named Import (kurung kurawal) untuk ToastProvider ✨
import { ToastProvider } from "@/components/ui/ToastProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Instructor Admin Panel - IDA",
  description: "LMS Admin Dashboard for Instructors",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* ✨ FIX: Panggil langsung dari HTML agar 100% ter-load oleh browser ✨ */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link 
          rel="stylesheet" 
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" 
        />
      </head>
      <body className={inter.className}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}