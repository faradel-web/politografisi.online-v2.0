'use client';

import type { JSONContent } from '@tiptap/core';
import { AlertCircle, Lightbulb, Info, AlertTriangle } from 'lucide-react';
import { Fragment } from 'react';
import { sanitizeHtml } from '@/lib/sanitize';

import './editor.css';

/**
 * TiptapRenderer — converts Tiptap JSON to React components.
 * Safe alternative to dangerouslySetInnerHTML.
 * 
 * Usage:
 *   <TiptapRenderer content={lesson.content} />
 *   If content is a string (HTML v1), falls back to dangerouslySetInnerHTML.
 */

interface TiptapRendererProps {
    content: JSONContent | string;
    className?: string;
}

// Callout styles
const calloutStyles: Record<string, { bg: string; border: string; icon: React.ReactNode }> = {
    info: {
        bg: 'bg-blue-50 dark:bg-blue-950/30',
        border: 'border-blue-200 dark:border-blue-800',
        icon: <Info size={18} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />,
    },
    tip: {
        bg: 'bg-emerald-50 dark:bg-emerald-950/30',
        border: 'border-emerald-200 dark:border-emerald-800',
        icon: <Lightbulb size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />,
    },
    important: {
        bg: 'bg-amber-50 dark:bg-amber-950/30',
        border: 'border-amber-200 dark:border-amber-800',
        icon: <AlertCircle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />,
    },
    warning: {
        bg: 'bg-red-50 dark:bg-red-950/30',
        border: 'border-red-200 dark:border-red-800',
        icon: <AlertTriangle size={18} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />,
    },
};

// Render marks (bold, italic, etc.)
function renderMarks(text: string, marks?: Array<{ type: string; attrs?: Record<string, any> }>): React.ReactNode {
    if (!marks || marks.length === 0) return text;

    let result: React.ReactNode = text;

    for (const mark of marks) {
        switch (mark.type) {
            case 'bold':
                result = <strong>{result}</strong>;
                break;
            case 'italic':
                result = <em>{result}</em>;
                break;
            case 'underline':
                result = <u>{result}</u>;
                break;
            case 'strike':
                result = <s>{result}</s>;
                break;
            case 'code':
                result = <code className="bg-slate-100 dark:bg-slate-800 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded text-sm font-mono">{result}</code>;
                break;
            case 'link':
                result = (
                    <a
                        href={mark.attrs?.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 underline decoration-blue-300 dark:decoration-blue-600 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                    >
                        {result}
                    </a>
                );
                break;
            case 'highlight':
                result = <mark className="bg-yellow-100 dark:bg-yellow-900/40 rounded px-0.5">{result}</mark>;
                break;
            case 'textStyle':
                if (mark.attrs?.color) {
                    result = <span style={{ color: mark.attrs.color }}>{result}</span>;
                }
                break;
        }
    }

    return result;
}

// Render inline content (array of text nodes)
function renderInline(content?: JSONContent[]): React.ReactNode {
    if (!content) return null;

    return content.map((node, i) => {
        if (node.type === 'text') {
            return <Fragment key={i}>{renderMarks(node.text || '', node.marks)}</Fragment>;
        }
        if (node.type === 'hardBreak') {
            return <br key={i} />;
        }
        return null;
    });
}

// Main recursive renderer
function renderNode(node: JSONContent, index: number): React.ReactNode {
    const key = index;
    const textAlign = node.attrs?.textAlign;
    const style = textAlign ? { textAlign } : undefined;

    switch (node.type) {
        case 'doc':
            return <>{node.content?.map((child, i) => renderNode(child, i))}</>;

        case 'paragraph':
            return <p key={key} style={style} className="mb-3">{renderInline(node.content)}</p>;

        case 'heading': {
            const level = node.attrs?.level || 2;
            const classes: Record<number, string> = {
                1: 'text-3xl font-black mt-8 mb-4 leading-tight',
                2: 'text-2xl font-extrabold mt-6 mb-3 leading-snug',
                3: 'text-xl font-bold mt-4 mb-2 leading-snug',
            };
            const cls = classes[level] || '';
            const children = renderInline(node.content);
            if (level === 1) return <h1 key={key} style={style} className={cls}>{children}</h1>;
            if (level === 3) return <h3 key={key} style={style} className={cls}>{children}</h3>;
            return <h2 key={key} style={style} className={cls}>{children}</h2>;
        }

        case 'bulletList':
            return <ul key={key} className="list-disc pl-6 mb-4 space-y-1">{node.content?.map((child, i) => renderNode(child, i))}</ul>;

        case 'orderedList':
            return <ol key={key} className="list-decimal pl-6 mb-4 space-y-1">{node.content?.map((child, i) => renderNode(child, i))}</ol>;

        case 'listItem':
            return <li key={key}>{node.content?.map((child, i) => renderNode(child, i))}</li>;

        case 'blockquote':
            return (
                <blockquote key={key} className="border-l-4 border-blue-500 dark:border-blue-600 pl-4 my-4 italic text-slate-500 dark:text-slate-400">
                    {node.content?.map((child, i) => renderNode(child, i))}
                </blockquote>
            );

        case 'codeBlock':
            return (
                <pre key={key} className="bg-slate-900 text-slate-100 rounded-xl p-4 my-4 overflow-x-auto text-sm font-mono">
                    <code>{node.content?.map(c => c.text).join('\n')}</code>
                </pre>
            );

        case 'horizontalRule':
            return <hr key={key} className="my-6 border-none h-0.5 bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent" />;

        case 'image':
            return (
                <figure key={key} className="my-6">
                    <img
                        src={node.attrs?.src}
                        alt={node.attrs?.alt || ''}
                        className="rounded-xl max-w-full h-auto shadow-sm border border-slate-200 dark:border-slate-700 mx-auto block"
                    />
                    {node.attrs?.alt && (
                        <figcaption className="text-center text-xs text-slate-400 mt-2">{node.attrs.alt}</figcaption>
                    )}
                </figure>
            );

        case 'table':
            return (
                <div key={key} className="overflow-x-auto my-6">
                    <table className="w-full border-collapse border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                        <tbody>{node.content?.map((child, i) => renderNode(child, i))}</tbody>
                    </table>
                </div>
            );

        case 'tableRow':
            return <tr key={key}>{node.content?.map((child, i) => renderNode(child, i))}</tr>;

        case 'tableHeader':
            return (
                <th key={key} className="bg-slate-50 dark:bg-slate-800 font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 px-4 py-3 border border-slate-200 dark:border-slate-700 text-left">
                    {node.content?.map((child, i) => renderNode(child, i))}
                </th>
            );

        case 'tableCell':
            return (
                <td key={key} className="px-4 py-3 border border-slate-200 dark:border-slate-700 text-sm">
                    {node.content?.map((child, i) => renderNode(child, i))}
                </td>
            );

        case 'callout': {
            const type = node.attrs?.type || 'info';
            const s = calloutStyles[type] || calloutStyles.info;
            return (
                <div key={key} className={`${s.bg} ${s.border} border rounded-xl p-4 my-4 flex gap-3`}>
                    {s.icon}
                    <div className="flex-1 min-w-0 text-sm leading-relaxed">
                        {node.content?.map((child, i) => renderNode(child, i))}
                    </div>
                </div>
            );
        }

        default:
            // Fallback for unknown node types — render children if any
            if (node.content) {
                return <div key={key}>{node.content.map((child, i) => renderNode(child, i))}</div>;
            }
            return null;
    }
}

// Sanitize old HTML content (v1 backward compatibility)
// 🔐 VUL-05 FIX: Using DOMPurify for real XSS protection + cleaning invisible chars
function sanitizeContent(html: string): string {
    const cleaned = html
        .replace(/&nbsp;/gi, ' ')
        .replace(/\u00A0/g, ' ')
        .replace(/&shy;/gi, '')
        .replace(/\u00AD/g, '')
        .replace(/\u200B/g, '')
        .replace(/\u200C/g, '')
        .replace(/\u200D/g, '')
        .replace(/\uFEFF/g, '')
        .replace(/<wbr\s*\/?>/gi, '');
    return sanitizeHtml(cleaned);
}

export default function TiptapRenderer({ content, className = '' }: TiptapRendererProps) {
    // V1: HTML string fallback
    if (typeof content === 'string') {
        return (
            <div
                className={`tiptap-rendered-content prose prose-slate prose-base md:prose-lg max-w-none font-serif leading-loose text-slate-700 dark:text-slate-300 dark:prose-invert prose-headings:font-black prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-img:rounded-2xl ${className}`}
                style={{ hyphens: 'none' } as React.CSSProperties}
                dangerouslySetInnerHTML={{ __html: sanitizeContent(content) }}
            />
        );
    }

    // V2: Tiptap JSON → safe React render
    return (
        <div className={`tiptap-rendered-content font-serif leading-loose text-slate-700 dark:text-slate-300 ${className}`}>
            {renderNode(content, 0)}
        </div>
    );
}
