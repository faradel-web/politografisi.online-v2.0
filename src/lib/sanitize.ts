/**
 * sanitize.ts — утиліта для безпечного відображення HTML контенту.
 * 
 * 🔐 SECURITY: Використовує DOMPurify для захисту від XSS атак.
 * Застосовується всюди, де використовується dangerouslySetInnerHTML.
 */
import DOMPurify from 'isomorphic-dompurify';

/**
 * Очищує HTML від потенційно небезпечних елементів (script, iframe, event handlers тощо).
 * 
 * @param html - сирий HTML рядок
 * @returns безпечний HTML рядок
 */
export function sanitizeHtml(html: string): string {
    if (!html) return '';

    return DOMPurify.sanitize(html, {
        // Дозволяємо тільки безпечні теги
        ALLOWED_TAGS: [
            'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'del',
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'ul', 'ol', 'li',
            'a', 'img',
            'table', 'thead', 'tbody', 'tr', 'th', 'td',
            'blockquote', 'pre', 'code',
            'div', 'span', 'hr', 'sup', 'sub',
            'figure', 'figcaption',
        ],
        // Дозволяємо тільки безпечні атрибути
        ALLOWED_ATTR: [
            'href', 'target', 'rel',       // links
            'src', 'alt', 'width', 'height', 'loading', // images
            'class', 'style',               // styling
            'colspan', 'rowspan',           // tables
            'id',                           // anchors
        ],
        // Забороняємо всі URI-схеми крім безпечних
        ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
        // Видаляємо javascript: URL
        FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
    });
}
