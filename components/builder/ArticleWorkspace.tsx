import React, { useEffect } from 'react';
import { DM_Sans } from 'next/font/google';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder'; // ✨ IMPORT BARU

const googleSansAlt = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '700', '800'] });

interface ArticleWorkspaceProps {
  title: string;
  setTitle: (val: string) => void;
  initialContent: string;
  onContentUpdate: (html: string) => void;
  onSave: (payload: any) => void;
  onDelete: () => void;
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) return null;
  const ToolbarButton = ({ onClick, isActive, icon, title }: any) => (
    <button onClick={(e) => { e.preventDefault(); onClick(); }} title={title} className={`size-8 md:size-9 flex items-center justify-center rounded-full transition-all duration-200 ${isActive ? 'bg-[#00BCD4] text-white shadow-md shadow-cyan-500/30 scale-105' : 'hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-500 dark:text-slate-400'}`}>
      <span className="material-symbols-outlined text-[18px] md:text-[20px]">{icon}</span>
    </button>
  );

  return (
    <div className="sticky top-6 z-30 mx-auto w-max max-w-[95%] bg-white/80 dark:bg-[#1b2636]/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 p-1.5 rounded-full shadow-2xl shadow-slate-200/50 dark:shadow-black/50 flex items-center gap-1 overflow-x-auto no-scrollbar ring-1 ring-slate-900/5 dark:ring-white/5">
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`px-4 py-1.5 text-xs md:text-sm font-bold rounded-full transition-all flex items-center gap-1.5 ${editor.isActive('heading', { level: 2 }) ? 'bg-[#00BCD4] text-white shadow-md shadow-cyan-500/30' : 'hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-300'}`}>
        <span className="material-symbols-outlined text-[16px]">title</span><span className="hidden md:inline">Heading</span>
      </button>
      <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1"></div>
      <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} icon="format_bold" title="Bold" />
      <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} icon="format_italic" title="Italic" />
      <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} icon="format_strikethrough" title="Strikethrough" />
      <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1"></div>
      <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} icon="format_list_bulleted" title="Bullet List" />
      <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} icon="format_list_numbered" title="Numbered List" />
      <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1"></div>
      <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} icon="format_quote" title="Quote" />
      <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} isActive={editor.isActive('codeBlock')} icon="data_object" title="Code Block" />
    </div>
  );
};

export default function ArticleWorkspace({ title, setTitle, initialContent, onContentUpdate, onSave, onDelete }: ArticleWorkspaceProps) {
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  // ✨ FIX: Membersihkan teks dummy bawaan dari page.tsx agar Placeholder asli bisa muncul ✨
  let cleanContent = initialContent;
  if (cleanContent.includes("Mulai ketik materi")) {
      cleanContent = ""; 
  }

  const editor = useEditor({
    extensions: [
      StarterKit,
      // ✨ KONFIGURASI TRUE PLACEHOLDER UNTUK TIPTAP ✨
      Placeholder.configure({
        placeholder: 'Mulai tulis isi materi di sini...',
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    immediatelyRender: false,
    content: cleanContent,
    onUpdate: ({ editor }) => {
      onContentUpdate(editor.getHTML());
    },
    editorProps: {
      attributes: {
        // ✨ INJEKSI CSS UNTUK PLACEHOLDER & PENYESUAIAN TYPOGRAPHY ✨
        class: 'prose prose-lg prose-slate dark:prose-invert max-w-none outline-none focus:outline-none min-h-[500px] leading-relaxed ' +
               '[&>h2]:text-3xl [&>h2]:font-extrabold [&>h2]:text-slate-900 [&>h2]:dark:text-white [&>h2]:mb-6 [&>h2]:mt-10 [&>h2]:tracking-tight ' +
               '[&>p]:text-slate-600 [&>p]:dark:text-slate-300 [&>p]:mb-5 [&>p]:text-[17px] ' +
               '[&>pre]:bg-[#0f111a] [&>pre]:text-emerald-400 [&>pre]:p-5 [&>pre]:rounded-2xl [&>pre]:font-mono [&>pre]:text-sm [&>pre]:shadow-xl [&>pre]:border [&>pre]:border-slate-800 ' +
               '[&>blockquote]:border-l-4 [&>blockquote]:border-[#00BCD4] [&>blockquote]:bg-cyan-50/50 [&>blockquote]:dark:bg-cyan-900/10 [&>blockquote]:p-5 [&>blockquote]:rounded-r-2xl [&>blockquote]:italic [&>blockquote]:text-slate-700 [&>blockquote]:dark:text-slate-300 ' +
               /* CSS Khusus Placeholder */
               '[&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] ' +
               '[&_.is-editor-empty:first-child::before]:text-slate-300 ' +
               'dark:[&_.is-editor-empty:first-child::before]:text-slate-700 ' +
               '[&_.is-editor-empty:first-child::before]:float-left ' +
               '[&_.is-editor-empty:first-child::before]:h-0 ' +
               '[&_.is-editor-empty:first-child::before]:pointer-events-none',
      },
    },
  });

  return (
    <div className="animate-fade-in relative">
      {/* Floating Toolbar */}
      <MenuBar editor={editor} />
      
      <div className="max-w-4xl w-full mx-auto px-6 md:px-16 py-12 pb-40 flex flex-col">
        
        {/* --- BAGIAN KONTROL ATAS --- */}
        <div className="flex items-center justify-between mb-8">
           <div className="flex items-center gap-2 text-[#00BCD4] font-bold text-sm tracking-wider uppercase bg-cyan-50 dark:bg-cyan-900/20 px-3 py-1.5 rounded-lg">
              <span className="material-symbols-outlined text-[18px]">article</span> Modul Bacaan
           </div>
           
           <div className="flex items-center gap-3">
              {confirmDelete ? (
                 <button onClick={onDelete} className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-500/20 animate-pulse"><span className="material-symbols-outlined text-[16px]">warning</span> Yakin Hapus?</button>
              ) : (
                 <button onClick={() => setConfirmDelete(true)} onMouseLeave={() => setConfirmDelete(false)} className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl text-xs font-bold transition-colors"><span className="material-symbols-outlined text-[16px]">delete</span> Hapus Bab</button>
              )}
              <button onClick={() => onSave({ content: editor?.getHTML() || '' })} className="flex items-center gap-2 px-5 py-2 bg-[#00BCD4] hover:bg-[#00acc1] text-white rounded-xl text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all active:scale-95">
                 <span className="material-symbols-outlined text-[16px]">save</span> Simpan
              </button>
           </div>
        </div>

        {/* --- BAGIAN JUDUL MATERI (LEBIH RAMPING) --- */}
        <div className="group relative">
          <textarea 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            placeholder="Isi judul materi di sini..."
            className={`w-full bg-transparent text-3xl md:text-4xl lg:text-[42px] font-extrabold text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700 resize-none outline-none border-none focus:ring-0 overflow-hidden leading-[1.2] transition-colors group-hover:bg-slate-50 dark:group-hover:bg-slate-900/50 rounded-2xl p-4 -ml-4 ${googleSansAlt.className}`}
            rows={2}
          />
        </div>

        {/* ✨ GARIS PEMISAH MODERN (GRADIENT DIVIDER) ✨ */}
        <div className="w-full h-0.5 bg-linear-to-r from-slate-200 via-slate-100 to-transparent dark:from-slate-800 dark:via-slate-800/50 my-6"></div>
        
        {/* --- BAGIAN KANVAS MATERI (TIPTAP) --- */}
        <div className="cursor-text mt-2 p-4 -ml-4 rounded-2xl hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
           <EditorContent editor={editor} />
        </div>

      </div>
    </div>
  );
}