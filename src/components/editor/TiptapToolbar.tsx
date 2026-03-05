'use client';

import { Editor } from '@tiptap/react';
import {
    Bold, Italic, Underline as UnderlineIcon, Strikethrough, Code,
    Heading1, Heading2, Heading3, Pilcrow,
    AlignLeft, AlignCenter, AlignRight,
    List, ListOrdered, Quote, Minus, ImagePlus,
    Table as TableIcon, Link as LinkIcon, Unlink,
    Undo2, Redo2, Highlighter, Palette,
    MessageSquareWarning, Type
} from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

interface ToolbarProps {
    editor: Editor | null;
}

// --- Toolbar Button ---
const Btn = ({
    onClick,
    active = false,
    disabled = false,
    title,
    children,
}: {
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    title: string;
    children: React.ReactNode;
}) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        title={title}
        className={`p-1.5 rounded-lg transition-all text-xs shrink-0 ${active
                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200'
            } ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
    >
        {children}
    </button>
);

// --- Separator ---
const Sep = () => <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-0.5 shrink-0" />;

export default function TiptapToolbar({ editor }: ToolbarProps) {
    const imageInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    const setLink = useCallback(() => {
        if (!editor) return;
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL:', previousUrl);
        if (url === null) return;
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }, [editor]);

    const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !editor) return;

        if (file.size > 5 * 1024 * 1024) {
            alert('Εικόνα πολύ μεγάλη (max 5MB)');
            return;
        }

        setIsUploading(true);
        try {
            const filePath = `theory_images/${Date.now()}_${file.name}`;
            const storageRef = ref(storage, filePath);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);
            editor.chain().focus().setImage({ src: url, alt: file.name }).run();
        } catch (err) {
            console.error('Image upload error:', err);
            alert('Σφάλμα κατά τη μεταφόρτωση εικόνας');
        } finally {
            setIsUploading(false);
            e.target.value = '';
        }
    }, [editor]);

    const addTable = useCallback(() => {
        editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    }, [editor]);

    const insertCallout = useCallback(() => {
        editor?.chain().focus().insertContent({
            type: 'callout',
            attrs: { type: 'info' },
            content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Πληκτρολογήστε εδώ...' }] }],
        }).run();
    }, [editor]);

    if (!editor) return null;

    return (
        <div className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/50 px-2 py-1.5 flex flex-wrap items-center gap-0.5 sticky top-0 z-10">
            {/* Text Type */}
            <Btn onClick={() => editor.chain().focus().setParagraph().run()} active={editor.isActive('paragraph')} title="Paragraph">
                <Pilcrow size={15} />
            </Btn>
            <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Heading 1">
                <Heading1 size={15} />
            </Btn>
            <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">
                <Heading2 size={15} />
            </Btn>
            <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3">
                <Heading3 size={15} />
            </Btn>

            <Sep />

            {/* Text Formatting */}
            <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
                <Bold size={15} />
            </Btn>
            <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
                <Italic size={15} />
            </Btn>
            <Btn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline">
                <UnderlineIcon size={15} />
            </Btn>
            <Btn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
                <Strikethrough size={15} />
            </Btn>
            <Btn onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')} title="Highlight">
                <Highlighter size={15} />
            </Btn>

            <Sep />

            {/* Alignment */}
            <Btn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align Left">
                <AlignLeft size={15} />
            </Btn>
            <Btn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align Center">
                <AlignCenter size={15} />
            </Btn>
            <Btn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align Right">
                <AlignRight size={15} />
            </Btn>

            <Sep />

            {/* Blocks */}
            <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List">
                <List size={15} />
            </Btn>
            <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Ordered List">
                <ListOrdered size={15} />
            </Btn>
            <Btn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Quote">
                <Quote size={15} />
            </Btn>
            <Btn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code Block">
                <Code size={15} />
            </Btn>
            <Btn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider">
                <Minus size={15} />
            </Btn>

            <Sep />

            {/* Insert */}
            <Btn onClick={insertCallout} title="Callout Block">
                <MessageSquareWarning size={15} />
            </Btn>
            <Btn onClick={addTable} title="Insert Table">
                <TableIcon size={15} />
            </Btn>
            <Btn onClick={setLink} active={editor.isActive('link')} title="Insert Link">
                <LinkIcon size={15} />
            </Btn>
            {editor.isActive('link') && (
                <Btn onClick={() => editor.chain().focus().unsetLink().run()} title="Remove Link">
                    <Unlink size={15} />
                </Btn>
            )}
            <Btn onClick={() => imageInputRef.current?.click()} disabled={isUploading} title="Insert Image">
                <ImagePlus size={15} />
            </Btn>
            <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
            />

            <Sep />

            {/* History */}
            <Btn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
                <Undo2 size={15} />
            </Btn>
            <Btn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
                <Redo2 size={15} />
            </Btn>
        </div>
    );
}
