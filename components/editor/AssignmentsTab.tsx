import React, { useState, useMemo } from 'react';
import { DM_Sans } from 'next/font/google';
import { useToast } from '@/components/ui/ToastProvider';

const googleSansAlt = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '700', '800'] });

interface Submission {
  id: string;
  studentName: string;
  projectTitle: string;
  link: string;
  status: 'Needs Review' | 'Graded';
  score: number | null; // 1 to 5 stars
  feedback: string;
}

const initialSubmissions: Submission[] = [
  { id: 's1', studentName: 'Fayyadh', projectTitle: 'Final Project: Clone ChatGPT UI', link: 'github.com/fayyadh/gpt-clone', status: 'Needs Review', score: null, feedback: '' },
  { id: 's2', studentName: 'Andita', projectTitle: 'Final Project: Clone ChatGPT UI', link: 'drive.google.com/file/xyz', status: 'Graded', score: 5, feedback: 'Excellent work! The UI is very accurate and responsive.' },
  { id: 's3', studentName: 'Budi Santoso', projectTitle: 'Mini Project: REST API with Express', link: 'github.com/budis/express-api', status: 'Graded', score: 4, feedback: 'Good job, but needs better error handling.' },
  { id: 's4', studentName: 'Siti Aminah', projectTitle: 'Final Project: Clone ChatGPT UI', link: 'github.com/siti/gpt-clone', status: 'Needs Review', score: null, feedback: '' },
];

export default function AssignmentsTab() {
  const { showToast } = useToast();

  // State Data Submissions & Search
  const [submissions, setSubmissions] = useState<Submission[]>(initialSubmissions);
  const [searchQuery, setSearchQuery] = useState('');

  // States Modal Grading/Review
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [gradingScore, setGradingScore] = useState<number>(0);
  const [gradingFeedback, setGradingFeedback] = useState('');
  const [hoveredStar, setHoveredStar] = useState<number>(0);

  const openGradeModal = (sub: Submission) => {
    setSelectedSubmission(sub);
    setGradingScore(sub.score || 0);
    setGradingFeedback(sub.feedback || '');
    setIsGradeModalOpen(true);
  };

  const handleSaveReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (gradingScore === 0) return showToast('error', 'Please provide a star rating!');
    if (!selectedSubmission) return;

    const updatedSubmissions = submissions.map(sub => 
      sub.id === selectedSubmission.id 
      ? { ...sub, status: 'Graded' as const, score: gradingScore, feedback: gradingFeedback } 
      : sub
    );
    
    setSubmissions(updatedSubmissions);
    showToast('success', 'Review successfully saved!');
    setIsGradeModalOpen(false);
  };

  // Kalkulasi statistik untuk submissions
  const stats = useMemo(() => {
    const total = submissions.length;
    const needsReview = submissions.filter(s => s.status === 'Needs Review').length;
    const graded = total - needsReview;
    return { total, needsReview, graded };
  }, [submissions]);

  // Filter submissions berdasarkan pencarian nama
  const filteredSubmissions = useMemo(() => {
    return submissions.filter(sub => 
      sub.studentName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [submissions, searchQuery]);

  // Helper untuk merender Bintang di tabel
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
        <div className="flex items-center gap-4 mb-8 border-b border-slate-100 dark:border-slate-800/60 pb-6">
           <div className="size-12 rounded-2xl bg-fuchsia-50 dark:bg-fuchsia-500/10 flex items-center justify-center border border-fuchsia-100 dark:border-fuchsia-500/20 text-fuchsia-500 shrink-0">
               <span className="material-symbols-outlined text-[24px]">folder_special</span>
           </div>
           <div>
               <h3 className={`text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 ${googleSansAlt.className}`}>
                 Student Projects
               </h3>
               <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Review and grade projects submitted by your students.</p>
           </div>
        </div>

        <div className="animate-in fade-in duration-500 space-y-6">
           
           {/* Stats Cards Row */}
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-fuchsia-50/50 dark:bg-fuchsia-500/5 p-5 rounded-3xl border border-fuchsia-100 dark:border-fuchsia-500/10 flex items-center gap-4">
                 <div className="size-10 rounded-full bg-fuchsia-100 dark:bg-fuchsia-500/20 text-fuchsia-600 dark:text-fuchsia-400 flex items-center justify-center shrink-0">
                   <span className="material-symbols-outlined text-[20px]">group</span>
                 </div>
                 <div>
                   <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-0.5">Total Submitted</p>
                   <p className={`text-2xl font-extrabold text-slate-900 dark:text-white ${googleSansAlt.className}`}>{stats.total}</p>
                 </div>
              </div>
              
              <div className="bg-amber-50/50 dark:bg-amber-500/5 p-5 rounded-3xl border border-amber-100 dark:border-amber-500/10 flex items-center gap-4">
                 <div className="size-10 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                   <span className="material-symbols-outlined text-[20px]">pending_actions</span>
                 </div>
                 <div>
                   <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-0.5">Needs Review</p>
                   <p className={`text-2xl font-extrabold text-slate-900 dark:text-white ${googleSansAlt.className}`}>{stats.needsReview}</p>
                 </div>
              </div>

              <div className="bg-emerald-50/50 dark:bg-emerald-500/5 p-5 rounded-3xl border border-emerald-100 dark:border-emerald-500/10 flex items-center gap-4">
                 <div className="size-10 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                   <span className="material-symbols-outlined text-[20px]">task_alt</span>
                 </div>
                 <div>
                   <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-0.5">Graded Projects</p>
                   <p className={`text-2xl font-extrabold text-slate-900 dark:text-white ${googleSansAlt.className}`}>{stats.graded}</p>
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
                   placeholder="Search by student name..." 
                   className="w-full bg-white dark:bg-[#111111] border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-300 dark:focus:border-fuchsia-500/50 outline-none transition-all"
                 />
              </div>
              <div className="text-xs font-bold text-slate-400 px-3">
                 Showing {filteredSubmissions.length} submissions
              </div>
           </div>

           {/* Modern Table List */}
           {filteredSubmissions.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm italic">
                No submissions found matching &quot;{searchQuery}&quot;.
              </div>
           ) : (
             <div className="overflow-x-auto no-scrollbar">
               <table className="w-full text-left text-sm border-separate border-spacing-y-3">
                  <thead>
                     <tr className="text-slate-400 dark:text-slate-500">
                        <th className="px-5 pb-2 font-bold uppercase tracking-wider text-[10px]">Student</th>
                        <th className="px-5 pb-2 font-bold uppercase tracking-wider text-[10px]">Project</th>
                        <th className="px-5 pb-2 font-bold uppercase tracking-wider text-[10px]">Attachment</th>
                        <th className="px-5 pb-2 font-bold uppercase tracking-wider text-[10px]">Status</th>
                        <th className="px-5 pb-2 font-bold uppercase tracking-wider text-[10px] text-center">Action</th>
                     </tr>
                  </thead>
                  <tbody>
                     {filteredSubmissions.map((sub) => (
                        <tr key={sub.id} className="bg-[#fafafa] dark:bg-[#161616] hover:bg-slate-50 dark:hover:bg-[#1a1a1a] transition-colors group shadow-sm">
                           
                           {/* Student Name */}
                           <td className="px-5 py-4 rounded-l-2xl border-y border-l border-slate-200/50 dark:border-slate-800/50 group-hover:border-fuchsia-200 dark:group-hover:border-fuchsia-900/50 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="size-9 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 font-extrabold flex items-center justify-center shrink-0 text-sm shadow-inner">
                                  {sub.studentName.charAt(0)}
                                </div>
                                <span className="font-bold text-slate-900 dark:text-white">{sub.studentName}</span>
                              </div>
                           </td>
                           
                           {/* Project Title */}
                           <td className="px-5 py-4 text-slate-600 dark:text-slate-400 text-xs font-medium border-y border-slate-200/50 dark:border-slate-800/50 group-hover:border-fuchsia-200 dark:group-hover:border-fuchsia-900/50 transition-colors">
                              <div className="truncate max-w-40 sm:max-w-64" title={sub.projectTitle}>
                                {sub.projectTitle}
                              </div>
                           </td>
                           
                           {/* Attachment Link */}
                           <td className="px-5 py-4 border-y border-slate-200/50 dark:border-slate-800/50 group-hover:border-fuchsia-200 dark:group-hover:border-fuchsia-900/50 transition-colors">
                              <a href={`https://${sub.link}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors text-xs font-bold border border-blue-100 dark:border-blue-500/20">
                                 <span className="material-symbols-outlined text-[14px]">link</span> View Work
                              </a>
                           </td>
                           
                           {/* Status & Score */}
                           <td className="px-5 py-4 border-y border-slate-200/50 dark:border-slate-800/50 group-hover:border-fuchsia-200 dark:group-hover:border-fuchsia-900/50 transition-colors">
                              {sub.status === 'Needs Review' ? (
                                 <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                                   <span className="size-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                   <span className="text-[10px] font-extrabold uppercase tracking-wider">Needs Review</span>
                                 </div>
                              ) : (
                                 <div className="flex flex-col gap-1.5">
                                    <div className="inline-flex items-center gap-1.5 w-fit px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                                       <span className="material-symbols-outlined text-[12px]">check_circle</span>
                                       <span className="text-[10px] font-extrabold uppercase tracking-wider">Graded</span>
                                    </div>
                                    {sub.score && renderStars(sub.score)}
                                 </div>
                              )}
                           </td>
                           
                           {/* Action Button */}
                           <td className="px-5 py-4 text-center rounded-r-2xl border-y border-r border-slate-200/50 dark:border-slate-800/50 group-hover:border-fuchsia-200 dark:group-hover:border-fuchsia-900/50 transition-colors">
                              <button 
                                 onClick={() => openGradeModal(sub)} 
                                 className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border inline-flex items-center justify-center gap-2 w-full sm:w-auto ${
                                   sub.status === 'Needs Review' 
                                   ? 'bg-fuchsia-500 hover:bg-fuchsia-600 text-white border-transparent shadow-md shadow-fuchsia-500/20 active:scale-95' 
                                   : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-fuchsia-300 dark:hover:border-fuchsia-700 border-slate-200 dark:border-slate-700 active:scale-95'
                                 }`}
                              >
                                 {sub.status === 'Needs Review' ? (
                                   <>Review <span className="material-symbols-outlined text-[16px]">draw</span></>
                                 ) : (
                                   <>Edit Review <span className="material-symbols-outlined text-[16px]">edit</span></>
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

      </div>

      {/* ====================================================
          MODAL: GRADING / REVIEW SUBMISSION
      ==================================================== */}
      {isGradeModalOpen && selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsGradeModalOpen(false)}></div>
           
           <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-4xl shadow-2xl relative z-10 animate-in zoom-in-95 duration-200 overflow-hidden">
              <div className="h-1.5 w-full bg-amber-500"></div>
              <div className="p-6 md:p-8 flex flex-col gap-6">
                 
                 <div className="flex items-start justify-between">
                    <div>
                        <h3 className={`text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3 mb-1 ${googleSansAlt.className}`}>
                          Review Submission
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Student: <span className="font-bold text-slate-700 dark:text-slate-200">{selectedSubmission.studentName}</span>
                        </p>
                    </div>
                    <button onClick={() => setIsGradeModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors p-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
                      <span className="material-symbols-outlined block text-[20px]">close</span>
                    </button>
                 </div>

                 {/* Project Info Summary */}
                 <div className="bg-[#fafafa] dark:bg-[#161616] p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Project Submitted</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">{selectedSubmission.projectTitle}</p>
                    
                    <a href={`https://${selectedSubmission.link}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors text-xs font-bold border border-blue-100 dark:border-blue-500/20 w-full justify-center">
                       <span className="material-symbols-outlined text-[16px]">open_in_new</span> Review Work (External Link)
                    </a>
                 </div>

                 <form onSubmit={handleSaveReview} className="space-y-6">
                    
                    {/* Star Rating Input */}
                    <div className="flex flex-col items-center justify-center p-4 bg-amber-50/50 dark:bg-amber-900/10 rounded-3xl border border-amber-100 dark:border-amber-900/30">
                       <label className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest mb-3">Overall Score</label>
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
                         {gradingScore === 0 ? 'Select stars to grade' : `${gradingScore} out of 5 Stars`}
                       </span>
                    </div>
                    
                    {/* Feedback Textarea */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block">Feedback / Comments</label>
                      <textarea 
                        rows={4}
                        value={gradingFeedback} 
                        onChange={(e) => setGradingFeedback(e.target.value)} 
                        placeholder="Leave an encouraging comment or feedback for the student..." 
                        className="w-full bg-[#fafafa] dark:bg-[#161616] border border-slate-200/60 dark:border-slate-700/60 rounded-2xl px-5 py-4 text-sm font-medium text-slate-700 dark:text-slate-300 focus:ring-4 focus:ring-amber-500/10 focus:border-amber-300 dark:focus:border-amber-500/50 outline-none transition-all resize-none leading-relaxed" 
                      />
                    </div>

                    <button type="submit" className={`w-full py-4 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-2xl text-sm font-bold shadow-lg shadow-slate-900/20 dark:shadow-white/10 active:scale-95 transition-all flex justify-center items-center gap-2 ${googleSansAlt.className}`}>
                       Save Review
                    </button>
                 </form>
              </div>
           </div>
        </div>
      )}

    </div>
  );
}