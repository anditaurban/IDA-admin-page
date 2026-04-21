import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DM_Sans } from 'next/font/google';
import { useToast } from '@/components/ui/ToastProvider';

const googleSansAlt = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '700', '800'] });

// --- API CONFIGURATION ---
// Sanitasi BASE_URL: Menghapus garis miring '/' di akhir URL jika ada, agar tidak terjadi double slash
const RAW_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
const BASE_URL = RAW_BASE_URL.endsWith('/') ? RAW_BASE_URL.slice(0, -1) : RAW_BASE_URL;

const OWNER_ID = process.env.NEXT_PUBLIC_OWNER_ID || ''; 

// ✨ FIX: Menambahkan konstanta untuk Token Otentikasi API
const API_TOKEN = process.env.NEXT_PUBLIC_API_TOKEN || '';

// --- INTERFACES ---
interface ApiAssignment {
  assignment_id: number;
  owner_id: number;
  customer_id: number;
  date: string;
  student: string;
  course: string;
  project_title: string;
  git_repo_url: string;
  deployment_url: string;
  description: string;
  evaluation_score: number;
  comment: string;
}

interface UiSubmission {
  id: string; // assignment_id as string
  studentName: string;
  projectTitle: string;
  courseName: string;
  githubLink: string;
  deployLink: string;
  description: string;
  status: 'Needs Review' | 'Graded';
  score: number | null;
  feedback: string;
  date: string;
}

// --- DATA FALLBACK / SIMULASI ---
// Data ini akan digunakan HANYA jika server API mati, env belum diset, atau API mengembalikan Error
const fallbackSubmissions: UiSubmission[] = [
  {
    id: "12",
    studentName: "Andita",
    courseName: "Ngoding AI",
    projectTitle: "Inventory Web App",
    githubLink: "https://github.com/anditaurban/inventory",
    deployLink: "https://inventory-rho-one.vercel.app/",
    description: "Aplikasi Inventori barang berbasis Website",
    status: 'Needs Review',
    score: null,
    feedback: "",
    date: "08/03/2026"
  },
  {
    id: "9",
    studentName: "Fayyadh",
    courseName: "Ngoding AI",
    projectTitle: "Customer Service AI Chatbot API",
    githubLink: "https://github.com/fayyadh/ai-chatbot-service",
    deployLink: "https://api.chatbot-fayyadh.up.railway.app/docs",
    description: "RESTful API backend terintegrasi dengan OpenAI (ChatGPT) untuk melayani balasan otomatis pelanggan e-commerce.",
    status: 'Needs Review',
    score: null,
    feedback: "",
    date: "26/02/2026"
  },
  {
    id: "2",
    studentName: "Fayyadh",
    courseName: "Ngoding AI",
    projectTitle: "Web Development Learning",
    githubLink: "",
    deployLink: "https://ngodingai-lms.vercel.app/",
    description: "Platform Learning Management System (LMS) terintegrasi berbasis website untuk Inovasia Digital.",
    status: 'Graded',
    score: 5,
    feedback: "Bagus",
    date: "00/00/0000"
  }
];

export default function AssignmentsTab({}: { courseSlug: string }) {
  const { showToast } = useToast();

  // --- STATES ---
  const [submissions, setSubmissions] = useState<UiSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // States Modal Grading/Review
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<UiSubmission | null>(null);
  const [gradingScore, setGradingScore] = useState<number>(0);
  const [gradingFeedback, setGradingFeedback] = useState('');
  const [hoveredStar, setHoveredStar] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- FETCH DATA (GET TABLE) ---
  const fetchAssignments = useCallback(async (page: number, search: string = '') => {
    setIsLoading(true);
    
    try {
      // Validasi awal jika ENV belum diatur
      if (!BASE_URL || !OWNER_ID) {
         throw new Error("ENV_MISSING");
      }

      // Menentukan endpoint berdasarkan ada/tidaknya search query
      const endpoint = search 
        ? `${BASE_URL}/table/course_assignment_review/${OWNER_ID}/${page}?search=${encodeURIComponent(search)}`
        : `${BASE_URL}/table/course_assignment_review/${OWNER_ID}/${page}`;

      // Menyiapkan Headers dengan Authorization Token jika ada
      const headers: HeadersInit = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      };
      
      if (API_TOKEN) {
        headers['Authorization'] = `Bearer ${API_TOKEN}`;
      }

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: headers
      });

      // Menangkap status error spesifik agar mudah didiagnosa (misal: 401, 404, 500)
      if (!response.ok) {
         throw new Error(`API_ERROR: HTTP ${response.status} - ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Transformasi dari API model ke UI model
      const formattedData: UiSubmission[] = data.tableData?.map((item: ApiAssignment) => ({
        id: String(item.assignment_id),
        studentName: item.student,
        courseName: item.course,
        projectTitle: item.project_title,
        githubLink: item.git_repo_url,
        deployLink: item.deployment_url,
        description: item.description,
        date: item.date,
        status: item.evaluation_score > 0 ? 'Graded' : 'Needs Review',
        score: item.evaluation_score > 0 ? item.evaluation_score : null,
        feedback: item.comment || ''
      })) || [];

      setSubmissions(formattedData);
      setTotalPages(data.totalPages || 1);
      setTotalRecords(data.totalRecords || formattedData.length);
      setCurrentPage(data.currentPage || 1);

    } catch (error) {
      // ✨ FIX: Membuang tipe 'any' dan melakukan validasi error instanceof Error
      const err = error instanceof Error ? error : new Error(String(error));
      console.error("Error fetching assignments:", err.message);
      
      // Menampilkan pesan error yang dinamis di Toast UI
      if (err.message === "ENV_MISSING") {
         showToast('error', 'Konfigurasi .env (BASE_URL / OWNER_ID) belum lengkap! Menampilkan data simulasi.');
      } else if (err.message.includes('HTTP 401')) {
         showToast('error', 'Akses ditolak (401 Unauthorized). Pastikan API Token di .env sudah benar.');
      } else if (err.message.includes('API_ERROR')) {
         showToast('error', `Gagal memuat API (${err.message.split(':')[1].trim()}). Beralih ke data simulasi.`);
      } else {
         showToast('error', 'Koneksi ke server API terputus. Beralih ke data simulasi.');
      }
      
      // Menerapkan pencarian manual sederhana pada data fallback
      const filteredFallback = search 
        ? fallbackSubmissions.filter(sub => sub.studentName.toLowerCase().includes(search.toLowerCase()) || sub.projectTitle.toLowerCase().includes(search.toLowerCase()))
        : fallbackSubmissions;
        
      setSubmissions(filteredFallback);
      setTotalPages(1);
      setTotalRecords(filteredFallback.length);
      setCurrentPage(1);
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  // Initial Load & Search Trigger (dengan debounce sederhana manual)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchAssignments(1, searchQuery);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, fetchAssignments]);

  // --- ACTIONS ---
  const openGradeModal = async (sub: UiSubmission) => {
    setSelectedSubmission(sub);
    setGradingScore(sub.score || 0);
    setGradingFeedback(sub.feedback || '');
    setIsGradeModalOpen(true);
  };

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (gradingScore === 0) return showToast('error', 'Mohon berikan rating bintang!');
    if (!selectedSubmission) return;

    setIsSubmitting(true);

    try {
      if (!BASE_URL) throw new Error('ENV_MISSING');

      const headers: HeadersInit = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      };
      
      if (API_TOKEN) {
        headers['Authorization'] = `Bearer ${API_TOKEN}`;
      }

      // Panggil API Update (PUT)
      const response = await fetch(`${BASE_URL}/update/course_assignment_review/${selectedSubmission.id}`, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify({
          evaluation_score: gradingScore,
          comment: gradingFeedback,
          reviewed: "yes"
        })
      });

      if (!response.ok) throw new Error(`API_ERROR: HTTP ${response.status}`);
      const result = await response.json();

      if (result.data?.success || result.success) {
        // Optimistic UI Update
        const updatedSubmissions = submissions.map(sub => 
          sub.id === selectedSubmission.id 
          ? { ...sub, status: 'Graded' as const, score: gradingScore, feedback: gradingFeedback } 
          : sub
        );
        setSubmissions(updatedSubmissions);
        showToast('success', 'Ulasan dan Nilai berhasil disimpan!');
        setIsGradeModalOpen(false);
      } else {
        throw new Error(result.data?.message || result.message || 'Server menolak permintaan');
      }

    } catch (error) {
      // ✨ FIX: Membuang tipe 'any' dan melakukan validasi error instanceof Error
      const err = error instanceof Error ? error : new Error(String(error));
      console.error("Error updating review:", err.message);
      
      if (err.message.includes('HTTP 401')) {
         showToast('error', 'Akses ditolak (401). Gagal menyimpan ulasan ke server.');
      } else {
         showToast('success', '[Simulasi] Ulasan berhasil disimpan secara lokal!');
      }

      const updatedSubmissions = submissions.map(sub => 
        sub.id === selectedSubmission.id 
        ? { ...sub, status: 'Graded' as const, score: gradingScore, feedback: gradingFeedback } 
        : sub
      );
      setSubmissions(updatedSubmissions);
      setIsGradeModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- HELPER RENDERING ---
  const stats = useMemo(() => {
    const needsReview = submissions.filter(s => s.status === 'Needs Review').length;
    const graded = submissions.length - needsReview;
    return { total: totalRecords || submissions.length, needsReview, graded };
  }, [submissions, totalRecords]);

  const renderStars = (score: number) => {
    return (
      <div className="flex items-center gap-1">
        <span className="text-sm font-extrabold text-amber-500 mr-1">{score}.0</span>
        {Array.from({ length: 5 }).map((_, i) => (
          <span 
            key={i} 
            className={`material-symbols-outlined text-[14px] ${i < score ? 'text-amber-400' : 'text-slate-200 dark:text-slate-700'}`}
            style={{ fontVariationSettings: i < score ? "'FILL' 1" : "'FILL' 0" }}
          >
            star
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10 relative">
      
      {/* ====================================================
          MAIN CONTAINER CARD
      ==================================================== */}
      <div className="bg-white dark:bg-[#111111] p-6 md:p-8 rounded-4xl border border-slate-200/80 dark:border-slate-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-fuchsia-500"></div>
        
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-8 border-b border-slate-100 dark:border-slate-800/60 pb-6">
           <div className="flex items-center gap-4">
             <div className="size-12 rounded-2xl bg-fuchsia-50 dark:bg-fuchsia-500/10 flex items-center justify-center border border-fuchsia-100 dark:border-fuchsia-500/20 text-fuchsia-500 shrink-0">
                 <span className="material-symbols-outlined text-[24px]">folder_special</span>
             </div>
             <div>
                 <h3 className={`text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 ${googleSansAlt.className}`}>
                   Tugas Siswa
                 </h3>
                 <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Review dan berikan nilai untuk proyek akhir siswa.</p>
             </div>
           </div>
           
           <button onClick={() => fetchAssignments(currentPage, searchQuery)} className="p-2 text-slate-400 hover:text-fuchsia-500 bg-slate-50 dark:bg-[#161616] rounded-xl transition-all" title="Refresh Data">
             <span className={`material-symbols-outlined block ${isLoading ? 'animate-spin' : ''}`}>sync</span>
           </button>
        </div>

        <div className="animate-in fade-in duration-500 space-y-6">
           
           {/* Stats Cards Row */}
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-fuchsia-50/50 dark:bg-fuchsia-500/5 p-5 rounded-3xl border border-fuchsia-100 dark:border-fuchsia-500/10 flex items-center gap-4">
                 <div className="size-10 rounded-full bg-fuchsia-100 dark:bg-fuchsia-500/20 text-fuchsia-600 dark:text-fuchsia-400 flex items-center justify-center shrink-0">
                   <span className="material-symbols-outlined text-[20px]">group</span>
                 </div>
                 <div>
                   <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-0.5">Total Terkirim</p>
                   <p className={`text-2xl font-extrabold text-slate-900 dark:text-white ${googleSansAlt.className}`}>
                     {isLoading ? <span className="animate-pulse">...</span> : stats.total}
                   </p>
                 </div>
              </div>
              
              <div className="bg-amber-50/50 dark:bg-amber-500/5 p-5 rounded-3xl border border-amber-100 dark:border-amber-500/10 flex items-center gap-4">
                 <div className="size-10 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                   <span className="material-symbols-outlined text-[20px]">pending_actions</span>
                 </div>
                 <div>
                   <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-0.5">Perlu Review</p>
                   <p className={`text-2xl font-extrabold text-slate-900 dark:text-white ${googleSansAlt.className}`}>
                     {isLoading ? <span className="animate-pulse">...</span> : stats.needsReview}
                   </p>
                 </div>
              </div>

              <div className="bg-emerald-50/50 dark:bg-emerald-500/5 p-5 rounded-3xl border border-emerald-100 dark:border-emerald-500/10 flex items-center gap-4">
                 <div className="size-10 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                   <span className="material-symbols-outlined text-[20px]">task_alt</span>
                 </div>
                 <div>
                   <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-0.5">Sudah Dinilai</p>
                   <p className={`text-2xl font-extrabold text-slate-900 dark:text-white ${googleSansAlt.className}`}>
                     {isLoading ? <span className="animate-pulse">...</span> : stats.graded}
                   </p>
                 </div>
              </div>
           </div>

           {/* Search Bar Toolbar */}
           <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#fafafa] dark:bg-[#161616] p-2 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
              <div className="relative w-full sm:w-80">
                 <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[20px]">search</span>
                 <input 
                   type="text" 
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   placeholder="Cari nama siswa atau proyek..." 
                   className="w-full bg-white dark:bg-[#111111] border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-300 dark:focus:border-fuchsia-500/50 outline-none transition-all"
                 />
              </div>
              <div className="text-xs font-bold text-slate-400 px-3">
                 Menampilkan Halaman {currentPage} dari {totalPages}
              </div>
           </div>

           {/* Modern Table List / Loading State */}
           {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                <span className="material-symbols-outlined text-[40px] animate-spin mb-3">progress_activity</span>
                <span className="text-sm font-bold">Mengambil data dari server...</span>
              </div>
           ) : submissions.length === 0 ? (
              <div className="text-center py-16 flex flex-col items-center justify-center gap-4 bg-[#fafafa] dark:bg-[#161616] rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                <span className="material-symbols-outlined text-[48px] text-slate-300 dark:text-slate-700">inventory_2</span>
                <p className="text-sm font-bold text-slate-500">Tidak ada data proyek siswa yang ditemukan.</p>
              </div>
           ) : (
             <div className="overflow-x-auto no-scrollbar">
               <table className="w-full text-left text-sm border-separate border-spacing-y-3">
                  <thead>
                     <tr className="text-slate-400 dark:text-slate-500">
                        <th className="px-5 pb-2 font-bold uppercase tracking-wider text-[10px]">Siswa</th>
                        <th className="px-5 pb-2 font-bold uppercase tracking-wider text-[10px]">Detail Proyek</th>
                        <th className="px-5 pb-2 font-bold uppercase tracking-wider text-[10px]">Lampiran</th>
                        <th className="px-5 pb-2 font-bold uppercase tracking-wider text-[10px]">Status</th>
                        <th className="px-5 pb-2 font-bold uppercase tracking-wider text-[10px] text-center">Aksi</th>
                     </tr>
                  </thead>
                  <tbody>
                     {submissions.map((sub) => (
                        <tr key={sub.id} className="bg-[#fafafa] dark:bg-[#161616] hover:bg-slate-50 dark:hover:bg-[#1a1a1a] transition-colors group shadow-sm">
                           
                           {/* Student Name */}
                           <td className="px-5 py-4 rounded-l-2xl border-y border-l border-slate-200/50 dark:border-slate-800/50 group-hover:border-fuchsia-200 dark:group-hover:border-fuchsia-900/50 transition-colors align-top">
                              <div className="flex items-center gap-3">
                                <div className="size-9 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 font-extrabold flex items-center justify-center shrink-0 text-sm shadow-inner uppercase">
                                  {sub.studentName.charAt(0)}
                                </div>
                                <div>
                                  <span className="font-bold text-slate-900 dark:text-white block">{sub.studentName}</span>
                                  <span className="text-[10px] text-slate-400 font-medium">{sub.date !== "00/00/0000" ? sub.date : "Baru Saja"}</span>
                                </div>
                              </div>
                           </td>
                           
                           {/* Project Title & Desc */}
                           <td className="px-5 py-4 text-slate-600 dark:text-slate-400 text-xs border-y border-slate-200/50 dark:border-slate-800/50 group-hover:border-fuchsia-200 dark:group-hover:border-fuchsia-900/50 transition-colors align-top">
                              <div className="font-bold text-slate-800 dark:text-slate-200 mb-1">{sub.projectTitle}</div>
                              <div className="truncate max-w-40 sm:max-w-64" title={sub.description}>
                                {sub.description || <span className="italic text-slate-400">Tidak ada deskripsi</span>}
                              </div>
                           </td>
                           
                           {/* Attachment Link */}
                           <td className="px-5 py-4 border-y border-slate-200/50 dark:border-slate-800/50 group-hover:border-fuchsia-200 dark:group-hover:border-fuchsia-900/50 transition-colors align-top">
                              <div className="flex flex-col gap-2">
                                {sub.deployLink && (
                                  <a href={sub.deployLink.startsWith('http') ? sub.deployLink : `https://${sub.deployLink}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors text-[11px] font-bold border border-blue-100 dark:border-blue-500/20 w-max">
                                     <span className="material-symbols-outlined text-[14px]">public</span> Live App
                                  </a>
                                )}
                                {sub.githubLink && (
                                  <a href={sub.githubLink.startsWith('http') ? sub.githubLink : `https://${sub.githubLink}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors text-[11px] font-bold border border-slate-300 dark:border-slate-700 w-max">
                                     <span className="material-symbols-outlined text-[14px]">code</span> Source Code
                                  </a>
                                )}
                              </div>
                           </td>
                           
                           {/* Status & Score */}
                           <td className="px-5 py-4 border-y border-slate-200/50 dark:border-slate-800/50 group-hover:border-fuchsia-200 dark:group-hover:border-fuchsia-900/50 transition-colors align-top">
                              {sub.status === 'Needs Review' ? (
                                 <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                                   <span className="size-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                   <span className="text-[10px] font-extrabold uppercase tracking-wider">Perlu Review</span>
                                 </div>
                              ) : (
                                 <div className="flex flex-col gap-1.5">
                                    <div className="inline-flex items-center gap-1.5 w-fit px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                                       <span className="material-symbols-outlined text-[12px]">check_circle</span>
                                       <span className="text-[10px] font-extrabold uppercase tracking-wider">Selesai</span>
                                    </div>
                                    {sub.score && renderStars(sub.score)}
                                 </div>
                              )}
                           </td>
                           
                           {/* Action Button */}
                           <td className="px-5 py-4 text-center rounded-r-2xl border-y border-r border-slate-200/50 dark:border-slate-800/50 group-hover:border-fuchsia-200 dark:group-hover:border-fuchsia-900/50 transition-colors align-top">
                              <button 
                                 onClick={() => openGradeModal(sub)} 
                                 className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border inline-flex items-center justify-center gap-2 w-full sm:w-auto ${
                                   sub.status === 'Needs Review' 
                                   ? 'bg-fuchsia-500 hover:bg-fuchsia-600 text-white border-transparent shadow-md shadow-fuchsia-500/20 active:scale-95' 
                                   : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-fuchsia-300 dark:hover:border-fuchsia-700 border-slate-200 dark:border-slate-700 active:scale-95'
                                 }`}
                              >
                                 {sub.status === 'Needs Review' ? (
                                   <>Nilai <span className="material-symbols-outlined text-[16px]">draw</span></>
                                 ) : (
                                   <>Edit <span className="material-symbols-outlined text-[16px]">edit</span></>
                                 )}
                              </button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
             </div>
           )}
        </div>

        {/* Paginasi Sederhana */}
        {!isLoading && totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button 
              disabled={currentPage === 1}
              onClick={() => fetchAssignments(currentPage - 1, searchQuery)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-[#161616] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-sm block">chevron_left</span>
            </button>
            <span className="text-sm font-bold px-4">{currentPage} / {totalPages}</span>
            <button 
              disabled={currentPage === totalPages}
              onClick={() => fetchAssignments(currentPage + 1, searchQuery)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-[#161616] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-sm block">chevron_right</span>
            </button>
          </div>
        )}

      </div>

      {/* ====================================================
          MODAL: GRADING / REVIEW SUBMISSION
      ==================================================== */}
      {isGradeModalOpen && selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsGradeModalOpen(false)}></div>
           
           <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-4xl shadow-2xl relative z-10 animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
              <div className="h-1.5 w-full bg-amber-500 shrink-0"></div>
              
              {/* Header Modal */}
              <div className="p-6 md:p-8 pb-4 shrink-0 flex items-start justify-between border-b border-slate-100 dark:border-slate-800">
                 <div>
                     <h3 className={`text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3 mb-1 ${googleSansAlt.className}`}>
                       Review Project
                     </h3>
                     <p className="text-sm text-slate-500 dark:text-slate-400">
                       Siswa: <span className="font-bold text-slate-700 dark:text-slate-200">{selectedSubmission.studentName}</span>
                     </p>
                 </div>
                 <button onClick={() => setIsGradeModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors p-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
                   <span className="material-symbols-outlined block text-[20px]">close</span>
                 </button>
              </div>

              {/* Body Modal (Bisa di-scroll jika konten panjang) */}
              <div className="p-6 md:p-8 overflow-y-auto no-scrollbar flex flex-col gap-6">
                 
                 {/* Detail Proyek Info Box */}
                 <div className="bg-[#fafafa] dark:bg-[#161616] p-5 rounded-3xl border border-slate-200/60 dark:border-slate-700/60">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Informasi Proyek</p>
                    <p className="text-base font-bold text-slate-800 dark:text-slate-200 mb-2">{selectedSubmission.projectTitle}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">{selectedSubmission.description}</p>
                    
                    <div className="flex flex-col sm:flex-row gap-2">
                      {selectedSubmission.deployLink && (
                        <a href={selectedSubmission.deployLink} target="_blank" rel="noreferrer" className="flex-1 inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors text-xs font-bold border border-blue-100 dark:border-blue-500/20 justify-center">
                           <span className="material-symbols-outlined text-[16px]">public</span> Buka Hasil Live
                        </a>
                      )}
                      {selectedSubmission.githubLink && (
                        <a href={selectedSubmission.githubLink} target="_blank" rel="noreferrer" className="flex-1 inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 transition-colors text-xs font-bold border border-slate-300 dark:border-slate-700 justify-center">
                           <span className="material-symbols-outlined text-[16px]">code</span> Cek Kode (GitHub)
                        </a>
                      )}
                    </div>
                 </div>

                 {/* Form Penilaian */}
                 <form id="gradingForm" onSubmit={handleSaveReview} className="space-y-6">
                    <div className="flex flex-col items-center justify-center p-4 bg-amber-50/50 dark:bg-amber-900/10 rounded-3xl border border-amber-100 dark:border-amber-900/30">
                       <label className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest mb-3">Nilai Bintang</label>
                       <div className="flex items-center gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                             <button
                               key={star}
                               type="button"
                               onClick={() => setGradingScore(star)}
                               onMouseEnter={() => setHoveredStar(star)}
                               onMouseLeave={() => setHoveredStar(0)}
                               className="p-1 focus:outline-none hover:scale-110 active:scale-90 transition-transform"
                             >
                               <span
                                 className={`material-symbols-outlined text-[40px] md:text-[48px] transition-colors duration-200 ${
                                   star <= (hoveredStar || gradingScore)
                                     ? 'text-amber-400 drop-shadow-sm'
                                     : 'text-slate-200 dark:text-slate-700'
                                 }`}
                                 style={{ fontVariationSettings: star <= (hoveredStar || gradingScore) ? "'FILL' 1" : "'FILL' 0" }}
                               >
                                 star
                               </span>
                             </button>
                          ))}
                       </div>
                       <span className="text-xs font-bold text-slate-400 mt-3 h-4">
                         {gradingScore === 0 ? 'Pilih bintang untuk menilai' : `${gradingScore} dari 5 Bintang`}
                       </span>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block">Komentar / Feedback</label>
                      <textarea 
                        rows={4}
                        value={gradingFeedback} 
                        onChange={(e) => setGradingFeedback(e.target.value)} 
                        placeholder="Berikan saran yang membangun untuk proyek siswa ini..." 
                        className="w-full bg-[#fafafa] dark:bg-[#161616] border border-slate-200/60 dark:border-slate-700/60 rounded-2xl px-5 py-4 text-sm font-medium text-slate-700 dark:text-slate-300 focus:ring-4 focus:ring-amber-500/10 focus:border-amber-300 dark:focus:border-amber-500/50 outline-none transition-all resize-none leading-relaxed" 
                      />
                    </div>
                 </form>
              </div>

              {/* Footer Modal (Sticky Actions) */}
              <div className="p-6 md:p-8 pt-4 shrink-0 border-t border-slate-100 dark:border-slate-800">
                <button 
                  type="submit" 
                  form="gradingForm"
                  disabled={isSubmitting}
                  className={`w-full py-4 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-2xl text-sm font-bold shadow-lg shadow-slate-900/20 dark:shadow-white/10 active:scale-95 transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed ${googleSansAlt.className}`}
                >
                   {isSubmitting ? (
                     <><span className="material-symbols-outlined animate-spin text-[20px]">sync</span> Menyimpan...</>
                   ) : (
                     <>Simpan Penilaian</>
                   )}
                </button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
}