import React, { useState, useEffect, useCallback } from 'react';
import { DM_Sans } from 'next/font/google';
import Cookies from 'js-cookie';
import { useToast } from '@/components/ui/ToastProvider';

const googleSansAlt = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '700', '800'] });

// --- API CONFIGURATION ---
const RAW_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
const BASE_URL = RAW_BASE_URL.endsWith('/') ? RAW_BASE_URL.slice(0, -1) : RAW_BASE_URL;

// --- INTERFACES ---
interface ApiAssignment {
  assignment_id: number;
  owner_id: number;
  course_id: number;
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
  id: string;
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

interface UiStats {
  totalRecords: number;
  needsReviewCount: number;
  gradedCount: number;
}

// ✨ FIX: Menambahkan props courseId agar data terfilter spesifik untuk kelas ini
interface AssignmentsTabProps {
  courseId: number | string;
}

export default function AssignmentsTab({ courseId }: AssignmentsTabProps) {
  const { showToast } = useToast();

  // --- STATES TABEL ---
  const [submissions, setSubmissions] = useState<UiSubmission[]>([]);
  const [isTableLoading, setIsTableLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // --- STATES STATISTIK ---
  const [globalStats, setGlobalStats] = useState<UiStats>({ totalRecords: 0, needsReviewCount: 0, gradedCount: 0 });
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  // --- STATES MODAL ---
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<UiSubmission | null>(null);
  const [gradingScore, setGradingScore] = useState<number>(0);
  const [gradingFeedback, setGradingFeedback] = useState('');
  const [hoveredStar, setHoveredStar] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mencegah spam API saat user mengetik
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); 
    }, 600);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // =====================================================================
  // LOGIC 1: BACKGROUND AGGREGATOR (MENGHITUNG STATISTIK AKURAT)
  // =====================================================================
  const calculateAccurateStats = useCallback(async () => {
    // ✅ FIX 1: Matikan loading sebelum return jika courseId belum siap
    if (!courseId) {
      setIsStatsLoading(false);
      return; 
    }
    
    setIsStatsLoading(true);
    try {
      const token = Cookies.get("api_token") || process.env.NEXT_PUBLIC_API_TOKEN || "";
      const headers: HeadersInit = { 
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}` 
      };

      const resPage1 = await fetch(`${BASE_URL}/table/course_assignment_review/${courseId}/1`, { method: 'GET', headers });
      
      // ✅ FIX 2: Jika response tidak OK (misal belum ada data), kembalikan stats ke 0, jangan biarkan gantung
      if (!resPage1.ok) {
        setGlobalStats({ totalRecords: 0, needsReviewCount: 0, gradedCount: 0 });
        return; 
      }

      const dataPage1 = await resPage1.json();
      
      let allAssignments: ApiAssignment[] = [...(dataPage1.tableData || [])];
      const maxPages = dataPage1.totalPages || 1;

      // ✅ FIX 3: Jika data kosong, langsung reset stat
      if (allAssignments.length === 0) {
        setGlobalStats({ totalRecords: 0, needsReviewCount: 0, gradedCount: 0 });
        return;
      }

      // Opsional: Lanjut loop halaman jika data > 1 halaman
      if (maxPages > 1) {
        const promises = [];
        for (let i = 2; i <= maxPages; i++) {
          promises.push(
            fetch(`${BASE_URL}/table/course_assignment_review/${courseId}/${i}`, { method: 'GET', headers })
              .then(res => res.ok ? res.json() : { tableData: [] }) // Tangani error per halaman
          );
        }
        const remainingPagesData = await Promise.all(promises);
        remainingPagesData.forEach(pageData => {
          if (pageData?.tableData) {
            allAssignments = [...allAssignments, ...pageData.tableData];
          }
        });
      }

      const graded = allAssignments.filter(item => item.evaluation_score > 0).length;
      const needsReview = allAssignments.filter(item => item.evaluation_score === 0).length;

      setGlobalStats({
        totalRecords: dataPage1.totalRecords || allAssignments.length,
        needsReviewCount: needsReview,
        gradedCount: graded
      });

    } catch (error) {
      console.error("Error calculating global stats:", error);
      setGlobalStats({ totalRecords: 0, needsReviewCount: 0, gradedCount: 0 });
    } finally {
      // ✅ FIX 4: Proses Loading PASTI berhenti, tidak muter terus
      setIsStatsLoading(false);
    }
  }, [courseId]);

  // =====================================================================
  // LOGIC 2: FETCH DATA UNTUK TABEL (HANYA HALAMAN SAAT INI)
  // =====================================================================
  const fetchTableData = useCallback(async (page: number, search: string = '') => {
    // ✅ FIX 5: Matikan loading tabel jika courseId kosong
    if (!courseId) {
       setIsTableLoading(false);
       return;
    }

    setIsTableLoading(true);
    try {
      const token = Cookies.get("api_token") || process.env.NEXT_PUBLIC_API_TOKEN || "";
      
      const queryParams = new URLSearchParams();
      if (search) queryParams.append("search", search);
      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";
      
      const endpoint = `${BASE_URL}/table/course_assignment_review/${courseId}/${page}${queryString}`;

      const headers: HeadersInit = { 
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}` 
      };

      const response = await fetch(endpoint, { method: 'GET', headers });
      
      // ✅ FIX 6: Handle error/kosong dengan mereset data UI, bukan melempar throw yang mematikan logic
      if (!response.ok) {
         setSubmissions([]);
         setTotalPages(1);
         return; 
      }
      
      const data = await response.json();
      
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
      setCurrentPage(data.currentPage || 1);

    } catch (error) {
      console.error("Error fetching table:", error);
      setSubmissions([]);
      setTotalPages(1);
    } finally {
      // ✅ FIX 7: Loading tabel PASTI berhenti
      setIsTableLoading(false); 
    }
  }, [courseId]);

  // INIT DATA
  useEffect(() => {
    calculateAccurateStats();
  }, [calculateAccurateStats]);

  useEffect(() => {
    fetchTableData(currentPage, debouncedSearch);
  }, [debouncedSearch, currentPage, fetchTableData]);

  // =====================================================================
  // ACTIONS: UPDATE DATA
  // =====================================================================
  const openGradeModal = (sub: UiSubmission) => {
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
      const token = Cookies.get("api_token") || process.env.NEXT_PUBLIC_API_TOKEN || "";
      const headers: HeadersInit = { 
        'Accept': 'application/json', 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      };

      const response = await fetch(`${BASE_URL}/update/course_assignment_review/${selectedSubmission.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          evaluation_score: gradingScore,
          comment: gradingFeedback,
          reviewed: "yes"
        })
      });

      if (!response.ok) throw new Error(`API_ERROR`);
      const result = await response.json();

      if (result.data?.success) {
        // 1. Update tabel langsung tanpa refresh (Optimistic UI)
        setSubmissions(prev => prev.map(sub => 
          sub.id === selectedSubmission.id 
          ? { ...sub, status: 'Graded', score: gradingScore, feedback: gradingFeedback } 
          : sub
        ));

        // 2. Update angka resume di atas secara instan
        if (selectedSubmission.status === 'Needs Review') {
          setGlobalStats(prev => ({
            ...prev,
            needsReviewCount: Math.max(0, prev.needsReviewCount - 1),
            gradedCount: prev.gradedCount + 1
          }));
        }

        showToast('success', 'Ulasan dan Nilai berhasil disimpan!');
        setIsGradeModalOpen(false);
      } else {
        throw new Error('Server menolak permintaan');
      }
    } catch (error) {
      console.error("Error updating review:", error);
      showToast('error', 'Gagal menyimpan ulasan ke server API.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (score: number) => (
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

  return (
    <div className="space-y-6 animate-fade-in pb-10 relative">
      
      {/* =======================================
          MAIN CONTAINER CARD
      ======================================= */}
      <div className="bg-white dark:bg-[#111111] p-6 md:p-8 rounded-4xl border border-slate-200/80 dark:border-slate-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-fuchsia-500"></div>
        
        <div className="flex items-center justify-between gap-4 mb-8 border-b border-slate-100 dark:border-slate-800/60 pb-6">
           <div className="flex items-center gap-4">
             <div className="size-12 rounded-2xl bg-fuchsia-50 dark:bg-fuchsia-500/10 flex items-center justify-center text-fuchsia-500 shrink-0">
                 <span className="material-symbols-outlined text-[24px]">folder_special</span>
             </div>
             <div>
                 <h3 className={`text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 ${googleSansAlt.className}`}>
                   Tugas Siswa
                 </h3>
                 <p className="text-xs text-slate-500 mt-1">Review dan berikan nilai untuk proyek akhir siswa.</p>
             </div>
           </div>
           
           <button 
             onClick={() => { fetchTableData(currentPage, debouncedSearch); calculateAccurateStats(); }} 
             className="p-2 text-slate-400 hover:text-fuchsia-500 bg-slate-50 dark:bg-[#161616] rounded-xl transition-all" 
             title="Refresh Data"
           >
             <span className={`material-symbols-outlined block ${isTableLoading || isStatsLoading ? 'animate-spin text-fuchsia-500' : ''}`}>sync</span>
           </button>
        </div>

        <div className="animate-in fade-in duration-500 space-y-6">
           
           {/* === STATS CARDS (AKURAT) === */}
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-fuchsia-50/50 p-5 rounded-3xl border border-fuchsia-100 flex items-center gap-4">
                 <div className="size-10 rounded-full bg-fuchsia-100 text-fuchsia-600 flex items-center justify-center">
                   <span className="material-symbols-outlined text-[20px]">group</span>
                 </div>
                 <div>
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Total Keseluruhan</p>
                   <p className={`text-2xl font-extrabold text-slate-900 dark:text-white ${googleSansAlt.className}`}>
                     {isStatsLoading ? <span className="animate-pulse opacity-50">...</span> : globalStats.totalRecords}
                   </p>
                 </div>
              </div>
              
              <div className="bg-amber-50/50 p-5 rounded-3xl border border-amber-100 flex items-center gap-4">
                 <div className="size-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                   <span className="material-symbols-outlined text-[20px]">pending_actions</span>
                 </div>
                 <div>
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Belum Direview</p>
                   <p className={`text-2xl font-extrabold text-slate-900 dark:text-white ${googleSansAlt.className}`}>
                     {isStatsLoading ? <span className="animate-pulse opacity-50">...</span> : globalStats.needsReviewCount}
                   </p>
                 </div>
              </div>

              <div className="bg-emerald-50/50 p-5 rounded-3xl border border-emerald-100 flex items-center gap-4">
                 <div className="size-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                   <span className="material-symbols-outlined text-[20px]">task_alt</span>
                 </div>
                 <div>
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Sudah Dinilai</p>
                   <p className={`text-2xl font-extrabold text-slate-900 dark:text-white ${googleSansAlt.className}`}>
                     {isStatsLoading ? <span className="animate-pulse opacity-50">...</span> : globalStats.gradedCount}
                   </p>
                 </div>
              </div>
           </div>

           {/* === SEARCH & PAGINATION INFO === */}
           <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#fafafa] dark:bg-[#161616] p-2 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
              <div className="relative w-full sm:w-80">
                 <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[20px]">search</span>
                 <input 
                   type="text" 
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   placeholder="Cari nama siswa atau proyek..." 
                   className="w-full bg-white dark:bg-[#111111] border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 outline-none"
                 />
              </div>
              <div className="text-xs font-bold text-slate-400 px-3 bg-slate-100 dark:bg-[#111111] py-2 rounded-xl">
                 Halaman <span className="text-slate-800 dark:text-slate-200">{currentPage}</span> dari <span className="text-slate-800 dark:text-slate-200">{totalPages}</span>
              </div>
           </div>

           {/* === TABEL === */}
           {isTableLoading ? (
              <div className="space-y-4 py-4">
                {[1, 2, 3, 4, 5].map((skeleton) => (
                  <div key={skeleton} className="flex gap-4 items-center p-4 rounded-2xl bg-slate-50 dark:bg-[#161616] animate-pulse">
                    <div className="h-10 w-10 bg-slate-200 dark:bg-slate-700 rounded-full shrink-0"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
           ) : submissions.length === 0 ? (
              <div className="text-center py-16 flex flex-col items-center gap-4 bg-[#fafafa] rounded-3xl border-2 border-dashed">
                <span className="material-symbols-outlined text-[48px] text-slate-300">inventory_2</span>
                <p className="text-sm font-bold text-slate-500">Tidak ada data proyek yang ditemukan.</p>
              </div>
           ) : (
             <div className="overflow-x-auto no-scrollbar">
               <table className="w-full text-left text-sm border-separate border-spacing-y-3">
                  <thead>
                     <tr className="text-slate-400">
                        <th className="px-5 pb-2 font-bold uppercase text-[10px] w-16 text-center">No</th>
                        <th className="px-5 pb-2 font-bold uppercase text-[10px]">Siswa</th>
                        <th className="px-5 pb-2 font-bold uppercase text-[10px]">Detail Proyek</th>
                        <th className="px-5 pb-2 font-bold uppercase text-[10px]">Lampiran</th>
                        <th className="px-5 pb-2 font-bold uppercase text-[10px]">Status</th>
                        <th className="px-5 pb-2 font-bold uppercase text-[10px] text-center">Aksi</th>
                     </tr>
                  </thead>
                  <tbody>
                     {submissions.map((sub, index) => {
                        const itemNumber = ((currentPage - 1) * 10) + index + 1;
                        return (
                        <tr key={sub.id} className="bg-[#fafafa] hover:bg-slate-50 transition-colors group">
                           <td className="px-5 py-4 rounded-l-2xl border-y border-l text-center align-middle border-slate-200/50">
                              <span className="text-xs font-bold text-slate-400">{itemNumber}</span>
                           </td>
                           <td className="px-5 py-4 border-y align-top min-w-50 border-slate-200/50">
                              <div className="flex items-center gap-3">
                                <div className="size-10 rounded-full bg-indigo-100 text-indigo-600 font-extrabold flex items-center justify-center shrink-0 uppercase">
                                  {sub.studentName.charAt(0)}
                                </div>
                                <div>
                                  <span className="font-bold block text-slate-900">{sub.studentName}</span>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[9px] font-extrabold bg-slate-200 px-1.5 py-0.5 rounded uppercase text-slate-600">ID: {sub.id}</span>
                                    <span className="text-[10px] text-slate-400 font-medium">{sub.date !== "00/00/0000" && sub.date !== "0000-00-00" ? sub.date : "Baru Saja"}</span>
                                  </div>
                                </div>
                              </div>
                           </td>
                           <td className="px-5 py-4 text-xs border-y align-top min-w-62.5 border-slate-200/50">
                              <div className="font-bold mb-1.5 text-slate-800">{sub.projectTitle}</div>
                              <div className="truncate max-w-40 sm:max-w-64 text-slate-600" title={sub.description}>
                                {sub.description || <span className="italic text-slate-400">Tidak ada deskripsi</span>}
                              </div>
                           </td>
                           <td className="px-5 py-4 border-y align-top min-w-37.5 border-slate-200/50">
                              <div className="flex flex-col gap-2">
                                {sub.deployLink && (
                                  <a href={sub.deployLink.startsWith('http') ? sub.deployLink : `https://${sub.deployLink}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-[11px] font-bold w-max border border-blue-100">
                                     <span className="material-symbols-outlined text-[14px]">public</span> Live App
                                  </a>
                                )}
                                {sub.githubLink && (
                                  <a href={sub.githubLink.startsWith('http') ? sub.githubLink : `https://${sub.githubLink}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 text-[11px] font-bold w-max border border-slate-300">
                                     <span className="material-symbols-outlined text-[14px]">code</span> Source Code
                                  </a>
                                )}
                              </div>
                           </td>
                           <td className="px-5 py-4 border-y align-top min-w-35 border-slate-200/50">
                              {sub.status === 'Needs Review' ? (
                                 <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-200">
                                   <span className="size-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                   <span className="text-[10px] font-extrabold uppercase tracking-wider">Perlu Review</span>
                                 </div>
                              ) : (
                                 <div className="flex flex-col gap-1.5">
                                    <div className="inline-flex items-center gap-1.5 w-fit px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-200">
                                       <span className="material-symbols-outlined text-[12px]">check_circle</span>
                                       <span className="text-[10px] font-extrabold uppercase">Selesai</span>
                                    </div>
                                    {sub.score && renderStars(sub.score)}
                                 </div>
                              )}
                           </td>
                           <td className="px-5 py-4 text-center rounded-r-2xl border-y border-r align-top border-slate-200/50">
                              <button 
                                 onClick={() => openGradeModal(sub)} 
                                 className={`px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-2 w-full sm:w-auto shadow-sm active:scale-95 transition-all ${
                                   sub.status === 'Needs Review' 
                                   ? 'bg-fuchsia-500 hover:bg-fuchsia-600 text-white border border-transparent' 
                                   : 'bg-white hover:border-fuchsia-300 border border-slate-200 text-slate-700'
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
                     )})}
                  </tbody>
               </table>
             </div>
           )}
        </div>

        {/* === TOMBOL PAGINATION === */}
        {!isTableLoading && totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-sm block text-slate-600">chevron_left</span>
            </button>
            <div className="text-sm font-bold px-4 flex items-center gap-1.5 text-slate-600">
               <span className="bg-slate-100 text-slate-900 px-2.5 py-1 rounded-lg border border-slate-200">{currentPage}</span> dari <span>{totalPages}</span>
            </div>
            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-sm block text-slate-600">chevron_right</span>
            </button>
          </div>
        )}
      </div>

      {/* =======================================
          MODAL GRADING
      ======================================= */}
      {isGradeModalOpen && selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsGradeModalOpen(false)}></div>
           <div className="bg-white w-full max-w-lg rounded-4xl shadow-2xl relative z-10 animate-in zoom-in-95 overflow-hidden flex flex-col max-h-[90vh]">
              <div className="h-1.5 w-full bg-amber-500 shrink-0"></div>
              
              <div className="p-6 md:p-8 pb-4 shrink-0 flex items-start justify-between border-b border-slate-100">
                 <div>
                     <h3 className={`text-2xl font-bold flex items-center gap-3 mb-1 text-slate-900 ${googleSansAlt.className}`}>Review Project</h3>
                     <div className="text-sm text-slate-500 flex items-center gap-2">
                       Siswa: <span className="font-bold text-slate-700">{selectedSubmission.studentName}</span>
                     </div>
                 </div>
                 <button onClick={() => setIsGradeModalOpen(false)} className="p-2 bg-slate-100 text-slate-500 rounded-xl hover:text-red-500 transition-colors">
                   <span className="material-symbols-outlined block text-[20px]">close</span>
                 </button>
              </div>

              <div className="p-6 md:p-8 overflow-y-auto no-scrollbar flex flex-col gap-6">
                 <div className="bg-[#fafafa] p-5 rounded-3xl border border-slate-200/60">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Informasi Proyek</p>
                    <p className="text-base font-bold text-slate-800 mb-2">{selectedSubmission.projectTitle}</p>
                    <p className="text-xs text-slate-600 mb-4">{selectedSubmission.description}</p>
                 </div>

                 <form id="gradingForm" onSubmit={handleSaveReview} className="space-y-6">
                    <div className="flex flex-col items-center p-4 bg-amber-50/50 rounded-3xl border border-amber-100">
                       <label className="text-xs font-bold text-amber-600 uppercase mb-3">Nilai Bintang</label>
                       <div className="flex items-center gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                             <button
                               key={star} type="button"
                               onClick={() => setGradingScore(star)}
                               onMouseEnter={() => setHoveredStar(star)}
                               onMouseLeave={() => setHoveredStar(0)}
                               className="p-1 hover:scale-110 active:scale-90 transition-transform"
                             >
                               <span
                                 className={`material-symbols-outlined text-[40px] md:text-[48px] ${
                                   star <= (hoveredStar || gradingScore) ? 'text-amber-400 drop-shadow-sm' : 'text-slate-200'
                                 }`}
                                 style={{ fontVariationSettings: star <= (hoveredStar || gradingScore) ? "'FILL' 1" : "'FILL' 0" }}
                               >star</span>
                             </button>
                          ))}
                       </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase">Komentar / Feedback</label>
                      <textarea 
                        rows={4} value={gradingFeedback} onChange={(e) => setGradingFeedback(e.target.value)} 
                        className="w-full bg-[#fafafa] border text-slate-700 border-slate-200/60 rounded-2xl px-5 py-4 text-sm outline-none resize-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-300" 
                      />
                    </div>
                 </form>
              </div>

              <div className="p-6 md:p-8 pt-4 shrink-0 border-t border-slate-100">
                <button 
                  type="submit" form="gradingForm" disabled={isSubmitting}
                  className={`w-full py-4 bg-slate-900 text-white hover:bg-slate-800 rounded-2xl text-sm font-bold flex justify-center items-center gap-2 disabled:opacity-70 active:scale-95 transition-all ${googleSansAlt.className}`}
                >
                   {isSubmitting ? <><span className="material-symbols-outlined animate-spin text-[20px]">sync</span> Menyimpan...</> : "Simpan Penilaian"}
                </button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
}