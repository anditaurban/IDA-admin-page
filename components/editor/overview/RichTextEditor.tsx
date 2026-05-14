'use client';

import React, { useEffect } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Tulis deskripsi...',
  disabled = false,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value || '',
    editable: !disabled,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          'min-h-36 w-full outline-none text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed ' +
          '[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 ' +
          '[&_li]:my-1 [&_p]:my-1',
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [editor, disabled]);

  useEffect(() => {
    if (!editor) return;

    const currentHtml = editor.getHTML();
    const nextHtml = value || '';

    if (currentHtml !== nextHtml) {
      editor.commands.setContent(nextHtml, {
        emitUpdate: false,
      });
    }
  }, [editor, value]);

  if (!editor) return null;

  const listMode = editor.isActive('orderedList')
    ? 'ordered'
    : editor.isActive('bulletList')
      ? 'bullet'
      : 'none';

  const cycleListMode = () => {
    if (listMode === 'none') {
      editor.chain().focus().toggleBulletList().run();
      return;
    }

    if (listMode === 'bullet') {
      editor.chain().focus().toggleOrderedList().run();
      return;
    }

    editor.chain().focus().toggleOrderedList().run();
  };

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white transition-all focus-within:ring-2 focus-within:ring-[#00BCD4]/20 dark:border-slate-700 dark:bg-[#111111]">
      <div className="flex flex-wrap gap-1 border-b border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-[#161616]">
        <ToolbarButton
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
          label="B"
          disabled={disabled}
        />

        <ToolbarButton
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          label="I"
          disabled={disabled}
        />

        <ToolbarButton
          active={listMode !== 'none'}
          onClick={cycleListMode}
          label={
            listMode === 'none'
              ? '— List'
              : listMode === 'bullet'
                ? '• List'
                : '1. List'
          }
          disabled={disabled}
        />
      </div>

      <div className="relative px-4 py-3">
        {editor.isEmpty && (
          <p className="pointer-events-none absolute text-sm font-medium text-slate-400">
            {placeholder}
          </p>
        )}

        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

type ToolbarButtonProps = {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
};

function ToolbarButton({
  label,
  active,
  disabled,
  onClick,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
        active
          ? 'bg-[#00BCD4] text-white'
          : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-[#222] dark:text-slate-300 dark:hover:bg-[#2a2a2a]'
      }`}
    >
      {label}
    </button>
  );
}