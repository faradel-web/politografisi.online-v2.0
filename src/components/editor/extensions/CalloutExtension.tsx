import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import { AlertCircle, Lightbulb, Info, AlertTriangle } from 'lucide-react';

// --- React Component for Callout Node ---
const CalloutComponent = ({ node, updateAttributes }: any) => {
    const type = node.attrs.type || 'info';

    const styles: Record<string, { bg: string; border: string; icon: any; label: string }> = {
        info: {
            bg: 'bg-blue-50 dark:bg-blue-950/30',
            border: 'border-blue-200 dark:border-blue-800',
            icon: <Info size={18} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />,
            label: 'Πληροφορία',
        },
        tip: {
            bg: 'bg-emerald-50 dark:bg-emerald-950/30',
            border: 'border-emerald-200 dark:border-emerald-800',
            icon: <Lightbulb size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />,
            label: 'Συμβουλή',
        },
        important: {
            bg: 'bg-amber-50 dark:bg-amber-950/30',
            border: 'border-amber-200 dark:border-amber-800',
            icon: <AlertCircle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />,
            label: 'Σημαντικό',
        },
        warning: {
            bg: 'bg-red-50 dark:bg-red-950/30',
            border: 'border-red-200 dark:border-red-800',
            icon: <AlertTriangle size={18} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />,
            label: 'Προσοχή',
        },
    };

    const s = styles[type] || styles.info;

    return (
        <NodeViewWrapper>
            <div className={`${s.bg} ${s.border} border rounded-xl p-4 my-4 flex gap-3`}>
                {s.icon}
                <div className="flex-1 min-w-0">
                    {/* Type selector for editor */}
                    <select
                        contentEditable={false}
                        value={type}
                        onChange={(e) => updateAttributes({ type: e.target.value })}
                        className="text-[10px] font-bold uppercase tracking-wider mb-1 bg-transparent border-none outline-none cursor-pointer opacity-60 hover:opacity-100 block"
                    >
                        <option value="info">ℹ️ Πληροφορία</option>
                        <option value="tip">💡 Συμβουλή</option>
                        <option value="important">⚠️ Σημαντικό</option>
                        <option value="warning">🚨 Προσοχή</option>
                    </select>
                    <NodeViewContent className="prose prose-sm dark:prose-invert max-w-none callout-content" />
                </div>
            </div>
        </NodeViewWrapper>
    );
};

// --- Tiptap Extension ---
export const CalloutExtension = Node.create({
    name: 'callout',
    group: 'block',
    content: 'block+',
    defining: true,

    addAttributes() {
        return {
            type: {
                default: 'info',
                parseHTML: (element) => element.getAttribute('data-callout-type') || 'info',
                renderHTML: (attributes) => ({ 'data-callout-type': attributes.type }),
            },
        };
    },

    parseHTML() {
        return [{ tag: 'div[data-callout]' }];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-callout': '' }), 0];
    },

    addNodeView() {
        return ReactNodeViewRenderer(CalloutComponent);
    },
});
