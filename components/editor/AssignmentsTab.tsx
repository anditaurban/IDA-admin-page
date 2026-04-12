import React, { useState } from 'react';
import { DM_Sans } from 'next/font/google';
import { useToast } from '@/components/ui/ToastProvider';

const googleSansAlt = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '700', '800'] });

interface ProjectAssignment {
  id: string;
  title: string;
  deadline: string;
  submissionsCount: number;
}

interface Submission {
  id: string;
  studentName: string;
  projectTitle: string;
  link: string;
  status: 'Needs Review' | 'Graded';
  score: number | null; // 1 to 5 stars
  feedback: string;
}

const defaultProjects: ProjectAssignment[] = [
  { id: 'p1', title: 'Final Project: Clone ChatGPT UI', deadline: '2026-04-30', submissionsCount: 12 },
  { id: 'p2', title: 'Mini Project: REST API with Express', deadline: '2026-03-15', submissionsCount: 8 },
];

const initialSubmissions: Submission[] = [
  { id: 's1', studentName: 'Fayyadh', projectTitle: 'Final Project: Clone ChatGPT UI', link: 'github.com/fayyadh/gpt-clone', status: 'Needs Review', score: null, feedback: '' },
  { id: 's2', studentName: 'Andita', projectTitle: 'Final Project: Clone ChatGPT UI', link: 'drive.google.com/file/xyz', status: 'Graded', score: 5, feedback: 'Excellent work! The UI is very accurate and responsive.' },
  { id: 's3', studentName: 'Budi Santoso', projectTitle: 'Mini Project: REST API with Express', link: 'github.com/budis/express-api', status: 'Graded', score: 4, feedback: 'Good job, but needs better error handling.' },
];

export default function AssignmentsTab() {
  const { showToast } = useToast();
  const [activeView, setActiveView] = useState<'manage' | 'submissions'>('manage');

  // State Data Projects
  const [projects, setProjects] = useState<ProjectAssignment[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('db_course_projects');
      if (saved) return JSON.parse(saved);
    }
    return defaultProjects;
  });

  // State Data Submissions
  const [submissions, setSubmissions] = useState<Submission[]>(initialSubmissions);

  // States Modal Create Project
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newDeadline, setNewDeadline] = useState('');

  // States Modal Edit Project
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editProjectTitle, setEditProjectTitle] = useState('');
  const [editDeadline, setEditDeadline] = useState('');

  // States Modal Grading/Review
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [gradingScore, setGradingScore] = useState<number>(0);
  const [gradingFeedback, setGradingFeedback] = useState('');
  const [hoveredStar, setHoveredStar] = useState<number>(0);

  const saveProjects = (data: ProjectAssignment[]) => {
    setProjects(data);
    localStorage.setItem('db_course_projects', JSON.stringify(data));
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectTitle || !newDeadline) return showToast('error', 'Please fill in the title and deadline!');

    const newProject: ProjectAssignment = {
      id: `proj_${Date.now()}`,
      title: newProjectTitle,
      deadline: newDeadline,
      submissionsCount: 0
    };

    saveProjects([...projects, newProject]);
    showToast('success', 'New project successfully created!');
    setIsAddModalOpen(false);
    setNewProjectTitle('');
    setNewDeadline('');
  };

  const openEditProjectModal = (project: ProjectAssignment) => {
    setEditingProjectId(project.id);
    setEditProjectTitle(project.title);
    setEditDeadline(project.deadline);
    setIsEditModalOpen(true);
  };

  const handleEditProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProjectTitle || !editDeadline) return showToast('error', 'Please fill in the title and deadline!');

    const updatedProjects = projects.map(p => 
      p.id === editingProjectId 
        ? { ...p, title: editProjectTitle, deadline: editDeadline } 
        : p
    );

    saveProjects(updatedProjects);
    showToast('success', 'Project successfully updated!');
    setIsEditModalOpen(false);
  };

  const handleDeleteProject = (id: string) => {
    if (confirm('Are you sure you want to delete this project? All student submissions will also be lost.')) {
      saveProjects(projects.filter(p => p.id !== id));
      showToast('success', 'Project successfully deleted.');
    }
  };

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

  const formatDate = (dateString: string) => {
    const dateObj = new Date(dateString);
    return dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

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
        
        {/* Header & Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6 border-b border-slate-100 dark:border-slate-800/60 pb-6">
           <div className="flex items-center gap-4">
              <div className="size-12 rounded-2xl bg-fuchsia-50 dark:bg-fuchsia-500/10 flex items-center justify-center border border-fuchsia-100 dark:border-fuchsia-500/20 text-fuchsia-500 shrink-0">
                  <span className="material-symbols-outlined text-[24px]">assignment</span>
              </div>
              <div>
                  <h3 className={`text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 ${googleSansAlt.className}`}>
                    Project Management
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Assign projects and review student submissions.</p>
              </div>
           </div>
           
           {/* Segmented Control Navigation */}
           <div className="inline-flex bg-slate-100 dark:bg-[#161616] p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 w-full md:w-auto overflow-x-auto no-scrollbar">
             <button 
               onClick={() => setActiveView('manage')} 
               className={`flex-1 md:flex-none px-5 py-2.5 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                 activeView === 'manage' 
                 ? 'bg-white dark:bg-[#252525] shadow-sm text-slate-900 dark:text-white border border-slate-200/50 dark:border-slate-700/50' 
                 : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border border-transparent'
               }`}
             >
                <span className={`material-symbols-outlined text-[18px] ${activeView === 'manage' ? 'text-fuchsia-500' : ''}`}>task</span> 
                Projects List
             </button>
             <button 
               onClick={() => setActiveView('submissions')} 
               className={`flex-1 md:flex-none px-5 py-2.5 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                 activeView === 'submissions' 
                 ? 'bg-white dark:bg-[#252525] shadow-sm text-slate-900 dark:text-white border border-slate-200/50 dark:border-slate-700/50' 
                 : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border border-transparent'
               }`}
             >
                <span className={`material-symbols-outlined text-[18px] ${activeView === 'submissions' ? 'text-fuchsia-500' : ''}`}>rate_review</span> 
                Review Submissions
             </button>
           </div>
        </div>

        {/* --- VIEW 1: MANAGE PROJECTS --- */}
        {activeView === 'manage' && (
          <div className="space-y-4 animate-in fade-in duration-500">
            <div className="flex justify-end mb-4">
               <button onClick={() => setIsAddModalOpen(true)} className={`px-5 py-2.5 bg-fuchsia-500 hover:bg-fuchsia-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-fuchsia-500/25 transition-all flex items-center gap-2 active:scale-95 ${googleSansAlt.className}`}>
                  <span className="material-symbols-outlined text-[20px]">add_task</span> Create New Project
               </button>
            </div>
            
            {projects.length === 0 ? (
               <div className="flex flex-col items-center justify-center text-center py-12 px-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-[#fafafa] dark:bg-[#161616]">
                  <div className="size-16 bg-white dark:bg-[#111111] rounded-2xl flex items-center justify-center shadow-sm mb-4 border border-slate-200/50 dark:border-slate-800/50 text-slate-300 dark:text-slate-600">
                    <span className="material-symbols-outlined text-[32px]">assignment_add</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">No Projects Assigned</h4>
                  <p className="text-xs text-slate-500 max-w-xs">Create the first project assignment for your students.</p>
               </div>
            ) : (
              projects.map((project) => (
                 <div key={project.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 rounded-3xl border border-slate-200/60 dark:border-slate-700/60 bg-[#fafafa] dark:bg-[#161616] hover:border-fuchsia-300 hover:shadow-md dark:hover:border-fuchsia-500/50 transition-all gap-5 group">
                    <div>
                       <h4 className={`text-base font-bold text-slate-900 dark:text-white mb-2 group-hover:text-fuchsia-500 transition-colors ${googleSansAlt.className}`}>{project.title}</h4>
                       <p className="text-xs font-medium text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-3">
                         <span className="flex items-center gap-1.5 bg-slate-200/50 dark:bg-slate-800/50 px-2 py-1 rounded-md">
                            <span className="material-symbols-outlined text-[14px]">event</span> DL: {formatDate(project.deadline)}
                         </span>
                         <span className="flex items-center gap-1.5 text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-50 dark:bg-fuchsia-500/10 px-2 py-1 rounded-md border border-fuchsia-100 dark:border-fuchsia-500/20">
                            <span className="material-symbols-outlined text-[14px]">inbox</span> {project.submissionsCount} Submissions
                         </span>
                       </p>
                    </div>
                    <div className="flex items-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                       <button onClick={() => openEditProjectModal(project)} className="p-2.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-colors border border-transparent hover:border-blue-200 dark:hover:border-blue-800/50" title="Edit Project">
                         <span className="material-symbols-outlined block text-[20px]">edit</span>
                       </button>
                       <button onClick={() => handleDeleteProject(project.id)} className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-800/50" title="Delete Project">
                         <span className="material-symbols-outlined block text-[20px]">delete</span>
                       </button>
                    </div>
                 </div>
              ))
            )}
          </div>
        )}

        {/* --- VIEW 2: SUBMISSIONS (REVIEW) --- */}
        {activeView === 'submissions' && (
          <div className="animate-in fade-in duration-500 overflow-x-auto border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-sm">
             <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
                <thead className="bg-[#fafafa] dark:bg-[#161616]">
                   <tr className="border-b border-slate-200/80 dark:border-slate-700/80 text-slate-500 dark:text-slate-400">
                      <th className="px-6 py-4 font-extrabold uppercase tracking-wider text-[10px]">Student</th>
                      <th className="px-6 py-4 font-extrabold uppercase tracking-wider text-[10px]">Project</th>
                      <th className="px-6 py-4 font-extrabold uppercase tracking-wider text-[10px]">Attachment / Link</th>
                      <th className="px-6 py-4 font-extrabold uppercase tracking-wider text-[10px]">Status & Score</th>
                      <th className="px-6 py-4 font-extrabold uppercase tracking-wider text-[10px] text-center">Action</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-[#111111]">
                   {submissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50/50 dark:hover:bg-[#161616]/50 transition-colors group">
                         {/* Student Name */}
                         <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="size-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center shrink-0 border border-indigo-200 dark:border-indigo-800/50 text-xs">
                                {sub.studentName.charAt(0)}
                              </div>
                              <span className="font-bold text-slate-900 dark:text-white">{sub.studentName}</span>
                            </div>
                         </td>
                         
                         {/* Project Title */}
                         <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-xs font-medium">
                            <div className="truncate max-w-40 sm:max-w-64" title={sub.projectTitle}>
                              {sub.projectTitle}
                            </div>
                         </td>
                         
                         {/* Attachment Link */}
                         <td className="px-6 py-4">
                            <a href={`https://${sub.link}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors text-xs font-bold border border-blue-100 dark:border-blue-500/20">
                               <span className="material-symbols-outlined text-[14px]">link</span> Open Link
                            </a>
                         </td>
                         
                         {/* Status & Score */}
                         <td className="px-6 py-4">
                            {sub.status === 'Needs Review' ? (
                               <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                                 <span className="size-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                 <span className="text-[10px] font-extrabold uppercase tracking-wider">Needs Review</span>
                               </div>
                            ) : (
                               <div className="flex flex-col gap-1">
                                  <div className="inline-flex items-center gap-1.5 w-fit px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                                     <span className="material-symbols-outlined text-[12px]">check_circle</span>
                                     <span className="text-[10px] font-extrabold uppercase tracking-wider">Graded</span>
                                  </div>
                                  {sub.score && renderStars(sub.score)}
                               </div>
                            )}
                         </td>
                         
                         {/* Action Button */}
                         <td className="px-6 py-4 text-center">
                            <button 
                               onClick={() => openGradeModal(sub)} 
                               className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border inline-flex items-center justify-center gap-2 w-full sm:w-auto ${
                                 sub.status === 'Needs Review' 
                                 ? 'bg-fuchsia-500 hover:bg-fuchsia-600 text-white border-transparent shadow-md shadow-fuchsia-500/20' 
                                 : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-fuchsia-300 dark:hover:border-fuchsia-700 border-slate-200 dark:border-slate-700'
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

      {/* ====================================================
          MODAL: CREATE NEW PROJECT
      ==================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsAddModalOpen(false)}></div>
           
           <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-4xl shadow-2xl relative z-10 animate-in zoom-in-95 duration-200 overflow-hidden">
              <div className="h-1.5 w-full bg-fuchsia-500"></div>
              <div className="p-6 md:p-8">
                 <div className="flex items-center justify-between mb-8">
                    <h3 className={`text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3 ${googleSansAlt.className}`}>
                      <span className="material-symbols-outlined text-fuchsia-500 text-[28px]">add_task</span> 
                      Create Project
                    </h3>
                    <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors p-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
                      <span className="material-symbols-outlined block text-[20px]">close</span>
                    </button>
                 </div>

                 <form onSubmit={handleCreateProject} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block">Project Title</label>
                      <input 
                        type="text" required autoFocus
                        value={newProjectTitle} 
                        onChange={(e) => setNewProjectTitle(e.target.value)} 
                        placeholder="e.g. Final Project: Clone UI..." 
                        className="w-full bg-[#fafafa] dark:bg-[#161616] border border-slate-200/60 dark:border-slate-700/60 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-fuchsia-500/10 focus:border-fuchsia-300 dark:focus:border-fuchsia-500/50 outline-none transition-all" 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block">Deadline</label>
                      <input 
                        type="date" required 
                        value={newDeadline} 
                        onChange={(e) => setNewDeadline(e.target.value)} 
                        className="w-full bg-[#fafafa] dark:bg-[#161616] border border-slate-200/60 dark:border-slate-700/60 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-fuchsia-500/10 focus:border-fuchsia-300 dark:focus:border-fuchsia-500/50 outline-none transition-all cursor-pointer" 
                      />
                    </div>

                    <button type="submit" className={`w-full py-4 mt-2 bg-fuchsia-500 hover:bg-fuchsia-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-fuchsia-500/25 active:scale-95 transition-all flex justify-center items-center gap-2 ${googleSansAlt.className}`}>
                       Assign Project <span className="material-symbols-outlined text-[20px]">send</span>
                    </button>
                 </form>
              </div>
           </div>
        </div>
      )}

      {/* ====================================================
          MODAL: EDIT PROJECT
      ==================================================== */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsEditModalOpen(false)}></div>
           
           <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-4xl shadow-2xl relative z-10 animate-in zoom-in-95 duration-200 overflow-hidden">
              <div className="h-1.5 w-full bg-blue-500"></div>
              <div className="p-6 md:p-8">
                 <div className="flex items-center justify-between mb-8">
                    <h3 className={`text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3 ${googleSansAlt.className}`}>
                      <span className="material-symbols-outlined text-blue-500 text-[28px]">edit_square</span> 
                      Edit Project
                    </h3>
                    <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors p-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
                      <span className="material-symbols-outlined block text-[20px]">close</span>
                    </button>
                 </div>

                 <form onSubmit={handleEditProject} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block">Project Title</label>
                      <input 
                        type="text" required autoFocus
                        value={editProjectTitle} 
                        onChange={(e) => setEditProjectTitle(e.target.value)} 
                        placeholder="e.g. Final Project: Clone UI..." 
                        className="w-full bg-[#fafafa] dark:bg-[#161616] border border-slate-200/60 dark:border-slate-700/60 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-300 dark:focus:border-blue-500/50 outline-none transition-all" 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block">Deadline</label>
                      <input 
                        type="date" required 
                        value={editDeadline} 
                        onChange={(e) => setEditDeadline(e.target.value)} 
                        className="w-full bg-[#fafafa] dark:bg-[#161616] border border-slate-200/60 dark:border-slate-700/60 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-300 dark:focus:border-blue-500/50 outline-none transition-all cursor-pointer" 
                      />
                    </div>

                    <button type="submit" className={`w-full py-4 mt-2 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-blue-500/25 active:scale-95 transition-all flex justify-center items-center gap-2 ${googleSansAlt.className}`}>
                       Save Changes <span className="material-symbols-outlined text-[20px]">save</span>
                    </button>
                 </form>
              </div>
           </div>
        </div>
      )}

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