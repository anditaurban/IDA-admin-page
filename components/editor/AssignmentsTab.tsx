import React, { useState } from 'react';
import { DM_Sans } from 'next/font/google';
import { useToast } from '@/components/ui/ToastProvider';

const googleSansAlt = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '700', '800'] });

interface Assignment {
  id: string;
  title: string;
  deadline: string;
  submissionsCount: number;
}

interface Submission {
  id: string;
  studentName: string;
  assignmentTitle: string;
  link: string;
  status: 'Menunggu Review' | 'Dinilai';
  score: number | null;
}

const defaultAssignments: Assignment[] = [
  { id: 'a1', title: 'Final Project: Clone ChatGPT UI', deadline: '2026-04-30', submissionsCount: 12 },
];

const dummySubmissions: Submission[] = [
  { id: 's1', studentName: 'Fayyadh', assignmentTitle: 'Final Project: Clone ChatGPT UI', link: 'github.com/fayyadh/gpt-clone', status: 'Menunggu Review', score: null },
  { id: 's2', studentName: 'Andita', assignmentTitle: 'Final Project: Clone ChatGPT UI', link: 'drive.google.com/file/xyz', status: 'Dinilai', score: 95 },
];

export default function AssignmentsTab() {
  const { showToast } = useToast();
  const [activeView, setActiveView] = useState<'manage' | 'submissions'>('manage');

  // ✨ FIX: Menggunakan Lazy Initialization untuk membaca LocalStorage
  // sehingga kita tidak perlu lagi memanggil setAssignments di dalam useEffect
  const [assignments, setAssignments] = useState<Assignment[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('db_course_assignments');
      if (saved) return JSON.parse(saved);
    }
    return defaultAssignments;
  });

  // State Modal Tambah Tugas
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newDeadline, setNewDeadline] = useState('');

  const saveAssignments = (data: Assignment[]) => {
    setAssignments(data);
    localStorage.setItem('db_course_assignments', JSON.stringify(data));
  };

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle || !newDeadline) return showToast('error', 'Harap lengkapi judul dan deadline!');

    const newTask: Assignment = {
      id: `task_${Date.now()}`,
      title: newTaskTitle,
      deadline: newDeadline,
      submissionsCount: 0
    };

    saveAssignments([...assignments, newTask]);
    showToast('success', 'Tugas baru berhasil dibuat!');
    setIsAddModalOpen(false);
    setNewTaskTitle('');
    setNewDeadline('');
  };

  const handleDeleteAssignment = (id: string) => {
    if (confirm('Yakin ingin menghapus tugas ini? Data submisi siswa juga akan hilang.')) {
      saveAssignments(assignments.filter(a => a.id !== id));
      showToast('success', 'Tugas berhasil dihapus.');
    }
  };

  const formatDate = (dateString: string) => {
    const dateObj = new Date(dateString);
    return dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10 relative">
      
      <div className="bg-white dark:bg-[#111111] p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-fuchsia-500"></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
           <div>
               <h3 className={`text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1 ${googleSansAlt.className}`}>
                 <span className="material-symbols-outlined text-fuchsia-500">assignment</span> Manajemen Tugas Praktik
               </h3>
               <p className="text-xs text-slate-500">Berikan tugas proyek dan tinjau hasil pengumpulan (submisi) siswa.</p>
           </div>
           
           <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl w-fit border border-slate-200 dark:border-slate-800">
             <button onClick={() => setActiveView('manage')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${activeView === 'manage' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>
                <span className="material-symbols-outlined text-[16px]">task</span> Daftar Tugas
             </button>
             <button onClick={() => setActiveView('submissions')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${activeView === 'submissions' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>
                <span className="material-symbols-outlined text-[16px]">rate_review</span> Review Pengumpulan
             </button>
           </div>
        </div>

        {/* --- VIEW 1: MANAJEMEN TUGAS --- */}
        {activeView === 'manage' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex justify-end mb-4">
               <button onClick={() => setIsAddModalOpen(true)} className="px-5 py-2.5 bg-fuchsia-500 hover:bg-fuchsia-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-fuchsia-500/20 transition-all flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">add_task</span> Buat Tugas Baru
               </button>
            </div>
            
            {assignments.length === 0 ? (
               <p className="text-center text-slate-400 text-sm py-8 italic border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">Belum ada tugas praktik yang diberikan.</p>
            ) : (
              assignments.map((assignment) => (
                 <div key={assignment.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 hover:border-fuchsia-300 dark:hover:border-fuchsia-700/50 transition-all gap-4 group">
                    <div>
                       <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1 group-hover:text-fuchsia-500 transition-colors">{assignment.title}</h4>
                       <p className="text-xs text-slate-500 flex items-center gap-3">
                         <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">event</span> DL: {formatDate(assignment.deadline)}</span>
                         <span className="flex items-center gap-1 text-fuchsia-500 font-medium"><span className="material-symbols-outlined text-[14px]">inbox</span> {assignment.submissionsCount} Terkumpul</span>
                       </p>
                    </div>
                    <div className="flex items-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                       <button className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors" title="Edit Tugas"><span className="material-symbols-outlined block text-[18px]">edit</span></button>
                       <button onClick={() => handleDeleteAssignment(assignment.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors" title="Hapus Tugas"><span className="material-symbols-outlined block text-[18px]">delete</span></button>
                    </div>
                 </div>
              ))
            )}
          </div>
        )}

        {/* --- VIEW 2: SUBMISI (REVIEW) --- */}
        {activeView === 'submissions' && (
          <div className="animate-in fade-in duration-300 overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
             <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 dark:bg-slate-900/50">
                   <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                      <th className="p-4 font-bold uppercase tracking-wider text-[10px]">Siswa</th>
                      <th className="p-4 font-bold uppercase tracking-wider text-[10px]">Tugas</th>
                      <th className="p-4 font-bold uppercase tracking-wider text-[10px]">Lampiran (Link)</th>
                      <th className="p-4 font-bold uppercase tracking-wider text-[10px]">Status</th>
                      <th className="p-4 font-bold uppercase tracking-wider text-[10px] text-center">Aksi</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                   {dummySubmissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                         <td className="p-4 font-bold text-slate-900 dark:text-white">{sub.studentName}</td>
                         <td className="p-4 text-slate-600 dark:text-slate-400 text-xs truncate max-w-37.5">{sub.assignmentTitle}</td>
                         <td className="p-4">
                            <a href={`https://${sub.link}`} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline text-xs flex items-center gap-1 font-medium">
                               <span className="material-symbols-outlined text-[14px]">link</span> Buka Link Proyek
                            </a>
                         </td>
                         <td className="p-4">
                            {sub.status === 'Menunggu Review' ? (
                               <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 uppercase tracking-wider">Perlu Direview</span>
                            ) : (
                               <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 uppercase tracking-wider">Skor: {sub.score}</span>
                            )}
                         </td>
                         <td className="p-4 text-center">
                            {sub.status === 'Menunggu Review' ? (
                               <button className="px-3 py-1.5 bg-fuchsia-50 dark:bg-fuchsia-900/20 text-fuchsia-600 dark:text-fuchsia-400 hover:bg-fuchsia-500 hover:text-white rounded-lg text-xs font-bold transition-all border border-fuchsia-200 dark:border-fuchsia-800/50">Beri Nilai</button>
                            ) : (
                               <span className="material-symbols-outlined text-emerald-500 text-[20px]">check_circle</span>
                            )}
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
        )}

      </div>

      {/* MODAL FORM TAMBAH TUGAS */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsAddModalOpen(false)}></div>
           <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl shadow-2xl relative z-10 animate-in zoom-in-95 duration-200 overflow-hidden">
              <div className="h-2 w-full bg-fuchsia-500"></div>
              <div className="p-6 md:p-8">
                 <div className="flex items-center justify-between mb-6">
                    <h3 className={`text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 ${googleSansAlt.className}`}>
                      <span className="material-symbols-outlined text-fuchsia-500">add_task</span> 
                      Tambah Tugas Baru
                    </h3>
                    <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                      <span className="material-symbols-outlined block text-[18px]">close</span>
                    </button>
                 </div>

                 <form onSubmit={handleCreateAssignment} className="space-y-5">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Judul Tugas / Proyek</label>
                      <input 
                        type="text" required autoFocus
                        value={newTaskTitle} 
                        onChange={(e) => setNewTaskTitle(e.target.value)} 
                        placeholder="Misal: Final Project Clone UI..." 
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-fuchsia-500/50 outline-none transition-all" 
                      />
                    </div>
                    
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Batas Pengumpulan (Deadline)</label>
                      <input 
                        type="date" required 
                        value={newDeadline} 
                        onChange={(e) => setNewDeadline(e.target.value)} 
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-fuchsia-500/50 outline-none transition-all cursor-pointer" 
                      />
                    </div>

                    <button type="submit" className={`w-full py-3.5 mt-2 bg-fuchsia-500 hover:bg-fuchsia-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-fuchsia-500/20 active:scale-95 transition-all flex justify-center items-center gap-2 ${googleSansAlt.className}`}>
                       Simpan Tugas <span className="material-symbols-outlined text-[18px]">send</span>
                    </button>
                 </form>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}