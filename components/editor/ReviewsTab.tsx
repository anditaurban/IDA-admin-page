import React, { useState, useMemo } from 'react';
import { DM_Sans } from 'next/font/google';
import { useToast } from '@/components/ui/ToastProvider';

const googleSansAlt = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '700', '800'] });

interface CourseReview {
  id: string;
  studentName: string;
  date: string;
  rating: number; // 1 to 5
  comment: string;
  instructorReply?: string;
}

const defaultReviews: CourseReview[] = [
  {
    id: 'rev_1',
    studentName: 'Fayyadh',
    date: '2026-04-12',
    rating: 5,
    comment: 'Materi sangat daging! Penjelasan tentang integrasi AI ke dalam workflow coding sangat mudah dipahami. Highly recommended buat yang mau shifting ke modern web dev.',
    instructorReply: 'Terima kasih banyak Fayyadh! Senang mendengarnya. Sukses terus untuk project-project ke depannya ya!',
  },
  {
    id: 'rev_2',
    studentName: 'Andita',
    date: '2026-04-10',
    rating: 4,
    comment: 'Kelasnya bagus, materi terstruktur rapi. Cuma mungkin bagian setup API Key OpenAI bisa dijelaskan lebih pelan sedikit untuk pemula.',
  },
  {
    id: 'rev_3',
    studentName: 'Budi Santoso',
    date: '2026-04-08',
    rating: 5,
    comment: 'Sangat membantu! Saya bisa bikin web dari nol padahal basic saya bukan IT. Best investment!',
  }
];

export default function ReviewsTab() {
  const { showToast } = useToast();

  const [reviews, setReviews] = useState<CourseReview[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('db_course_reviews');
      if (saved) return JSON.parse(saved);
    }
    return defaultReviews;
  });

  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const saveReviews = (data: CourseReview[]) => {
    setReviews(data);
    localStorage.setItem('db_course_reviews', JSON.stringify(data));
  };

  const handleReplySubmit = (e: React.FormEvent, reviewId: string) => {
    e.preventDefault();
    if (!replyText.trim()) return showToast('error', 'Balasan tidak boleh kosong!');

    const updatedReviews = reviews.map(rev => 
      rev.id === reviewId ? { ...rev, instructorReply: replyText } : rev
    );

    saveReviews(updatedReviews);
    showToast('success', 'Balasan berhasil disimpan!');
    setReplyingTo(null);
    setReplyText('');
  };

  const handleEditReply = (reviewId: string, currentReply: string) => {
    setReplyingTo(reviewId);
    setReplyText(currentReply);
  };

  const handleDeleteReply = (reviewId: string) => {
    if(confirm('Yakin ingin menghapus balasan Anda?')) {
       const updatedReviews = reviews.map(rev => 
         rev.id === reviewId ? { ...rev, instructorReply: undefined } : rev
       );
       saveReviews(updatedReviews);
       showToast('success', 'Balasan dihapus.');
    }
  };

  const formatDate = (dateString: string) => {
    const dateObj = new Date(dateString);
    return dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const renderStars = (score: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <span 
            key={i} 
            className={`material-symbols-outlined text-[14px] ${i < score ? 'text-amber-500 drop-shadow-sm' : 'text-slate-200 dark:text-slate-700'}`}
            style={{ fontVariationSettings: i < score ? "'FILL' 1" : "'FILL' 0" }}
          >
            star
          </span>
        ))}
      </div>
    );
  };

  // Kalkulasi Statistik Rating
  const stats = useMemo(() => {
    const total = reviews.length;
    const sum = reviews.reduce((acc, rev) => acc + rev.rating, 0);
    const average = total > 0 ? (sum / total).toFixed(1) : '0.0';
    
    const distribution = [5, 4, 3, 2, 1].map(star => {
      const count = reviews.filter(r => r.rating === star).length;
      const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
      return { star, count, percentage };
    });

    return { total, average, distribution };
  }, [reviews]);

  return (
    <div className="space-y-8 animate-fade-in pb-10 relative">
      
      {/* ====================================================
          SECTION 1: SUMMARY & STATS (AMBER THEME)
      ==================================================== */}
      <div className="bg-white dark:bg-[#111111] p-6 md:p-10 rounded-4xl border border-slate-200/80 dark:border-slate-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] relative overflow-hidden">
         <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>

         <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800/60 pb-6 mb-8">
            <div className="size-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center border border-amber-100 dark:border-amber-500/20 text-amber-500 shrink-0">
               <span className="material-symbols-outlined text-[24px]">forum</span>
            </div>
            <div>
               <h3 className={`text-xl font-bold text-slate-900 dark:text-white ${googleSansAlt.className}`}>
                 Student Feedback
               </h3>
               <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Monitor course reviews and engage with your students.</p>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            
            {/* Average Rating Big Box */}
            <div className="md:col-span-4 flex flex-col items-center justify-center py-8 px-4 bg-linear-to-b from-amber-50/50 to-[#fafafa] dark:from-amber-900/10 dark:to-[#161616] rounded-3xl border border-amber-100/50 dark:border-amber-900/20 shadow-inner">
               <span className={`text-6xl font-extrabold text-slate-900 dark:text-white mb-2 ${googleSansAlt.className}`}>{stats.average}</span>
               <div className="flex items-center gap-1.5 mb-3">
                 {[1, 2, 3, 4, 5].map((star) => (
                   <span 
                     key={star} 
                     className={`material-symbols-outlined text-[24px] ${star <= Math.round(Number(stats.average)) ? 'text-amber-500' : 'text-slate-200 dark:text-slate-800'}`}
                     style={{ fontVariationSettings: star <= Math.round(Number(stats.average)) ? "'FILL' 1" : "'FILL' 0" }}
                   >
                     star
                   </span>
                 ))}
               </div>
               <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Course Rating</span>
               <span className="text-[11px] font-medium text-amber-600/70 dark:text-amber-500/70 mt-1.5 bg-amber-100/50 dark:bg-amber-900/30 px-3 py-1 rounded-full">Based on {stats.total} reviews</span>
            </div>

            {/* Distribution Bars */}
            <div className="md:col-span-8 flex flex-col gap-3.5 w-full px-2">
               {stats.distribution.map((item) => (
                 <div key={item.star} className="flex items-center gap-4 group">
                    <div className="flex items-center gap-1.5 w-10 shrink-0">
                      <span className="text-sm font-extrabold text-slate-700 dark:text-slate-300">{item.star}</span>
                      <span className="material-symbols-outlined text-[14px] text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    </div>
                    <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-800/80 rounded-full overflow-hidden relative">
                       <div 
                         className="absolute top-0 left-0 h-full bg-amber-400 dark:bg-amber-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(251,191,36,0.5)] group-hover:bg-amber-300" 
                         style={{ width: `${item.percentage}%` }}
                       ></div>
                    </div>
                    <div className="w-10 text-right shrink-0">
                       <span className="text-xs font-bold text-slate-400">{item.percentage}%</span>
                    </div>
                 </div>
               ))}
            </div>
         </div>
      </div>

      {/* ====================================================
          SECTION 2: REVIEWS LIST (MODERN THREADED UI)
      ==================================================== */}
      <div className="bg-white dark:bg-[#111111] p-6 md:p-10 rounded-4xl border border-slate-200/80 dark:border-slate-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] relative overflow-hidden">
         
         <div className="flex items-center justify-between mb-8">
           <h4 className={`text-lg font-bold text-slate-900 dark:text-white flex items-center gap-3 ${googleSansAlt.className}`}>
             All Reviews 
             <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-extrabold text-slate-500">{stats.total}</span>
           </h4>
           <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sort by:</span>
              <select className="bg-transparent text-sm font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer">
                <option>Newest First</option>
                <option>Highest Rating</option>
                <option>Lowest Rating</option>
              </select>
           </div>
         </div>

         <div className="space-y-8">
            {reviews.length === 0 ? (
               <div className="text-center py-16 flex flex-col items-center justify-center gap-4 bg-[#fafafa] dark:bg-[#161616] rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                 <span className="material-symbols-outlined text-[48px] text-slate-300 dark:text-slate-700">rate_review</span>
                 <p className="text-sm font-bold text-slate-500">No reviews yet. Check back later!</p>
               </div>
            ) : (
               reviews.map((review) => (
                 <div key={review.id} className="relative flex gap-4 md:gap-5 group pb-8 border-b border-slate-100 dark:border-slate-800/50 last:border-0 last:pb-0">
                    
                    {/* Thread Line connecting Avatar to Reply */}
                    {review.instructorReply && (
                      <div className="absolute left-6 top-14 bottom-10 w-px bg-slate-200 dark:bg-slate-800 -z-10 hidden sm:block"></div>
                    )}

                    {/* User Avatar */}
                    <div className="size-12 rounded-full bg-linear-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-extrabold shrink-0 border-2 border-white dark:border-[#111111] shadow-sm uppercase z-10">
                      {review.studentName.charAt(0)}
                    </div>

                    <div className="flex-1 min-w-0">
                       {/* Review Header */}
                       <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
                          <h5 className="font-extrabold text-slate-900 dark:text-white text-base">{review.studentName}</h5>
                          <span className="hidden sm:block size-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                          <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                            {formatDate(review.date)}
                          </span>
                       </div>
                       
                       {/* Rating Stars */}
                       <div className="mb-3 bg-[#fafafa] dark:bg-[#161616] w-fit px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                         {renderStars(review.rating)}
                       </div>

                       {/* Review Text */}
                       <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                         {review.comment}
                       </p>

                       {/* Action / Reply Area */}
                       <div className="mt-2">
                         {replyingTo === review.id ? (
                           /* --- INLINE EDIT/REPLY FORM --- */
                           <form onSubmit={(e) => handleReplySubmit(e, review.id)} className="animate-in fade-in zoom-in-95 duration-200 bg-[#fafafa] dark:bg-[#161616] p-4 rounded-3xl border border-amber-200 dark:border-amber-900/30 shadow-inner">
                              <div className="flex items-center gap-2 mb-3">
                                 <span className="material-symbols-outlined text-[16px] text-amber-500">edit_note</span>
                                 <span className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest">{review.instructorReply ? 'Edit Reply' : 'Draft Reply'}</span>
                              </div>
                              <textarea 
                                autoFocus
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Type your response to the student..."
                                className="w-full bg-white dark:bg-[#111111] border border-slate-200/80 dark:border-slate-700/80 rounded-2xl px-5 py-4 text-sm text-slate-700 dark:text-slate-300 focus:ring-4 focus:ring-amber-500/10 focus:border-amber-300 dark:focus:border-amber-500/50 outline-none transition-all resize-none mb-4 shadow-sm"
                                rows={3}
                              />
                              <div className="flex items-center gap-3">
                                 <button type="submit" className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/20 active:scale-95">Save Reply</button>
                                 <button type="button" onClick={() => { setReplyingTo(null); setReplyText(''); }} className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all">Cancel</button>
                              </div>
                           </form>
                         ) : review.instructorReply ? (
                           /* --- INSTRUCTOR REPLY BUBBLE --- */
                           <div className="bg-amber-50/50 dark:bg-amber-500/5 p-5 rounded-3xl rounded-tl-sm border border-amber-100 dark:border-amber-500/10 relative group/reply transition-all hover:border-amber-200 dark:hover:border-amber-500/20 mt-1">
                              
                              <div className="flex items-center justify-between mb-2">
                                 <div className="flex items-center gap-2">
                                    <div className="size-6 bg-amber-500 rounded-full flex items-center justify-center text-white shadow-sm">
                                      <span className="material-symbols-outlined text-[12px] font-bold">verified_user</span>
                                    </div>
                                    <span className="text-xs font-extrabold text-amber-700 dark:text-amber-500">Instructor Reply</span>
                                 </div>
                                 
                                 {/* Contextual Action Buttons (Edit / Delete) */}
                                 <div className="flex items-center gap-1 opacity-0 group-hover/reply:opacity-100 transition-opacity">
                                    <button 
                                      onClick={() => handleEditReply(review.id, review.instructorReply as string)} 
                                      className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg transition-colors"
                                      title="Edit Reply"
                                    >
                                       <span className="material-symbols-outlined text-[16px] block">edit</span>
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteReply(review.id)} 
                                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                      title="Delete Reply"
                                    >
                                       <span className="material-symbols-outlined text-[16px] block">delete</span>
                                    </button>
                                 </div>
                              </div>

                              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed pr-2">
                                {review.instructorReply}
                              </p>
                           </div>
                         ) : (
                           /* --- REPLY ACTION BUTTON --- */
                           <button 
                             onClick={() => { setReplyingTo(review.id); setReplyText(''); }} 
                             className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-1.5 transition-colors bg-slate-100 dark:bg-slate-800/50 hover:bg-amber-50 dark:hover:bg-amber-900/20 px-4 py-2 rounded-xl border border-transparent hover:border-amber-200 dark:hover:border-amber-800/50"
                           >
                             <span className="material-symbols-outlined text-[16px]">reply</span> Reply to Student
                           </button>
                         )}
                       </div>

                    </div>
                 </div>
               ))
            )}
         </div>
      </div>

    </div>
  );
}