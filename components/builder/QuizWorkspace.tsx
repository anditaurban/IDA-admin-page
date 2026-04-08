import React, { useState, useEffect } from 'react';
import { DM_Sans } from 'next/font/google';

const googleSansAlt = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '700', '800'] });

interface QuizWorkspaceProps {
  title: string;
  setTitle: (val: string) => void;
  initialQuestions?: any[];
  initialDescription?: string;
  onSave: (payload: any) => void;
  onDelete: () => void;
}

export default function QuizWorkspace({ title, setTitle, initialQuestions, initialDescription = "", onSave, onDelete }: QuizWorkspaceProps) {
  const defaultQuestions = [{ id: 1, text: '', options: ['', '', '', ''], correctIndex: 0 }];
  const [questions, setQuestions] = useState(initialQuestions && initialQuestions.length > 0 ? initialQuestions : defaultQuestions);
  const [description, setDescription] = useState(initialDescription);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (initialQuestions && initialQuestions.length > 0) setQuestions(initialQuestions);
    else setQuestions(defaultQuestions);
    
    setDescription(initialDescription || "");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuestions, initialDescription]);

  const addQuestion = () => setQuestions([...questions, { id: Date.now(), text: '', options: ['', '', '', ''], correctIndex: 0 }]);
  const removeQuestion = (id: number) => { if (questions.length > 1) setQuestions(questions.filter(q => q.id !== id)); };

  const updateQuestionText = (index: number, text: string) => {
    const newQ = [...questions]; newQ[index].text = text; setQuestions(newQ);
  };
  
  const updateOptionText = (qIndex: number, optIndex: number, text: string) => {
    const newQ = [...questions]; newQ[qIndex].options[optIndex] = text; setQuestions(newQ);
  };

  return (
    <div className="max-w-4xl w-full mx-auto px-6 md:px-16 py-12 pb-40 flex flex-col animate-fade-in">
      
      {/* --- BAGIAN KONTROL ATAS --- */}
      <div className="flex items-center justify-between mb-8">
         <div className="flex items-center gap-2 text-amber-500 font-bold text-sm tracking-wider uppercase bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-lg">
            <span className="material-symbols-outlined text-[18px]">quiz</span> Kuis Evaluasi
         </div>
         
         <div className="flex items-center gap-3">
            {confirmDelete ? (
               <button onClick={onDelete} className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-500/20 animate-pulse"><span className="material-symbols-outlined text-[16px]">warning</span> Yakin Hapus?</button>
            ) : (
               <button onClick={() => setConfirmDelete(true)} onMouseLeave={() => setConfirmDelete(false)} className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl text-xs font-bold transition-colors"><span className="material-symbols-outlined text-[16px]">delete</span> Hapus Bab</button>
            )}
            {/* Mengirim Pertanyaan dan Deskripsi ke fungsi Save */}
            <button onClick={() => onSave({ questions, description })} className="flex items-center gap-2 px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-amber-500/20 transition-all active:scale-95">
               <span className="material-symbols-outlined text-[16px]">save</span> Simpan
            </button>
         </div>
      </div>

      {/* --- BAGIAN JUDUL KUIS --- */}
      <div className="group relative">
        <textarea 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
          placeholder="Isi judul kuis di sini..."
          className={`w-full bg-transparent text-3xl md:text-4xl lg:text-[42px] font-extrabold text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700 resize-none outline-none border-none focus:ring-0 overflow-hidden leading-[1.2] transition-colors group-hover:bg-slate-50 dark:group-hover:bg-slate-900/50 rounded-2xl p-4 -ml-4 ${googleSansAlt.className}`}
          rows={2}
        />
      </div>

      {/* ✨ GARIS PEMISAH MODERN (GRADIENT DIVIDER) ✨ */}
      <div className="w-full h-0.5 bg-linear-to-r from-slate-200 via-slate-100 to-transparent dark:from-slate-800 dark:via-slate-800/50 my-6"></div>

      {/* --- BAGIAN DESKRIPSI / INSTRUKSI --- */}
      <div className="mb-8 group">
         <textarea
           value={description}
           onChange={(e) => setDescription(e.target.value)}
           placeholder="Tambahkan instruksi kuis di sini..."
           className="w-full bg-transparent text-lg text-slate-600 dark:text-slate-300 placeholder:text-slate-300 dark:placeholder:text-slate-600 resize-none outline-none border-none focus:ring-0 leading-relaxed hover:bg-slate-50 dark:hover:bg-slate-900/50 rounded-2xl p-4 -ml-4 transition-colors min-h-25"
         />
      </div>
      
      {/* --- BUILDER KUIS UTAMA --- */}
      <div className="space-y-8">
        {questions.map((q, qIndex) => (
          <div key={q.id} className="bg-white dark:bg-[#111111] p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-6 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-400"></div>
            <div className="flex justify-between items-start gap-4">
               <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 size-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-inner">
                 {qIndex + 1}
               </span>
               <div className="flex-1 space-y-5">
                  <textarea value={q.text} onChange={(e) => updateQuestionText(qIndex, e.target.value)} placeholder="Ketik pertanyaan kuis di sini..." className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-amber-400/50 outline-none transition-all resize-none dark:text-white" rows={3}></textarea>
                  <div className="space-y-3">
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Pilihan Jawaban (Pilih Kunci Jawaban)</p>
                     {q.options.map((opt: string, i: number) => (
                       <div key={i} className={`flex items-center gap-3 p-2 rounded-xl transition-colors ${q.correctIndex === i ? 'bg-amber-50 dark:bg-amber-900/10' : ''}`}>
                          <input type="radio" name={`correct-${q.id}`} className="size-4 text-amber-500 focus:ring-amber-500 cursor-pointer" checked={q.correctIndex === i} onChange={() => { const newQ = [...questions]; newQ[qIndex].correctIndex = i; setQuestions(newQ); }} />
                          <span className="text-xs font-bold text-slate-400 w-4">{String.fromCharCode(65 + i)}.</span>
                          <input type="text" value={opt} onChange={(e) => updateOptionText(qIndex, i, e.target.value)} placeholder={`Opsi ${String.fromCharCode(65 + i)}`} className="flex-1 bg-transparent border-b border-slate-200 dark:border-slate-700 pb-1.5 text-sm font-medium outline-none focus:border-amber-400 dark:text-white placeholder:text-slate-400" />
                       </div>
                     ))}
                  </div>
               </div>
               <button onClick={() => removeQuestion(q.id)} className="text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-colors">
                 <span className="material-symbols-outlined text-[20px]">delete</span>
               </button>
            </div>
          </div>
        ))}
      </div>
      <button onClick={addQuestion} className="w-full py-5 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white hover:border-amber-400 dark:hover:border-amber-500 transition-all flex items-center justify-center gap-2 hover:bg-amber-50 dark:hover:bg-amber-900/10 active:scale-[0.98] mt-8">
         <span className="material-symbols-outlined">add_circle</span> Tambah Pertanyaan Baru
      </button>
    </div>
  );
}