'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import Typography from '@tiptap/extension-typography';
import { CalloutExtension } from './extensions/CalloutExtension';
import TiptapToolbar from './TiptapToolbar';
import { useEffect, useCallback, useRef } from 'react';
import type { JSONContent } from '@tiptap/core';

import './editor.css';

interface TiptapEditorProps {
    content: JSONContent | string;  // JSON (v2) or HTML string (v1 backward compat)
    onChange: (json: JSONContent) => void;
    placeholder?: string;
    className?: string;
    autosave?: boolean;
    autosaveDelay?: number;
}

export default function TiptapEditor({
    content,
    onChange,
    placeholder = 'Ξεκινήστε να γράφετε ή πατήστε "/" για εντολές...',
    className = '',
    autosave = false,
    autosaveDelay = 3000,
}: TiptapEditorProps) {
    const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3] },
            }),
            Image.configure({
                inline: false,
                allowBase64: false,
                HTMLAttributes: {
                    class: 'rounded-xl max-w-full h-auto shadow-sm border border-slate-200 dark:border-slate-700 my-4',
                },
            }),
            Table.configure({
                resizable: true,
                HTMLAttributes: {
                    class: 'tiptap-table',
                },
            }),
            TableRow,
            TableCell,
            TableHeader,
            Link.configure({
                openOnClick: false,
                autolink: true,
                HTMLAttributes: {
                    class: 'text-blue-600 dark:text-blue-400 underline decoration-blue-300 dark:decoration-blue-600 hover:text-blue-800 dark:hover:text-blue-300 transition-colors cursor-pointer',
                },
            }),
            Placeholder.configure({
                placeholder,
                emptyEditorClass: 'is-editor-empty',
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Color,
            TextStyle,
            Highlight.configure({
                multicolor: false,
                HTMLAttributes: {
                    class: 'bg-yellow-100 dark:bg-yellow-900/40 rounded px-0.5',
                },
            }),
            Underline,
            Typography,
            CalloutExtension,
        ],
        content: typeof content === 'string' ? content : content,
        editorProps: {
            attributes: {
                class: 'tiptap-editor-content prose prose-slate dark:prose-invert prose-base max-w-none focus:outline-none min-h-[300px] sm:min-h-[400px] p-4 sm:p-6',
            },
        },
        onUpdate: ({ editor }) => {
            const json = editor.getJSON();
            onChange(json);

            if (autosave) {
                if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
                autosaveTimerRef.current = setTimeout(() => {
                    // Autosave handled by parent via onChange
                }, autosaveDelay);
            }
        },
    });

    // Update content when external content changes (e.g. switching lessons)
    useEffect(() => {
        if (!editor) return;

        const currentJSON = JSON.stringify(editor.getJSON());
        const newJSON = typeof content === 'string' ? null : JSON.stringify(content);

        // Only update if content is actually different (avoid cursor jumps)
        if (typeof content === 'string') {
            // HTML content (v1 backward compat)
            if (editor.getHTML() !== content) {
                editor.commands.setContent(content);
            }
        } else if (newJSON && currentJSON !== newJSON) {
            editor.commands.setContent(content);
        }
    }, [content, editor]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
        };
    }, []);

    return (
        <div className={`rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden ${className}`}>
            <TiptapToolbar editor={editor} />
            <EditorContent editor={editor} />
        </div>
    );
}
