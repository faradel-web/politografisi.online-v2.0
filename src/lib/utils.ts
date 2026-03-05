/**
 * Спільні утилітарні функції для проєкту.
 * Не містить бізнес-логіку — лише чисті хелпери.
 */

/**
 * Безпечно об'єднує CSS-класи, фільтруючи falsy значення.
 * Проста альтернатива бібліотеці `clsx` без залежності.
 * 
 * @example
 * cn("base-class", isActive && "active", undefined, "always")
 * // → "base-class active always"
 */
export function cn(...classes: (string | false | null | undefined)[]): string {
    return classes.filter(Boolean).join(' ');
}

/**
 * Форматує дату у грецькому форматі.
 * 
 * @example
 * formatDateGR(new Date()) // → "5 Μαρτίου 2026"
 */
export function formatDateGR(date: Date): string {
    return new Intl.DateTimeFormat('el-GR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(date);
}

/**
 * Форматує дату коротко.
 * 
 * @example
 * formatDateShort(new Date()) // → "05/03/2026"
 */
export function formatDateShort(date: Date): string {
    return new Intl.DateTimeFormat('el-GR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(date);
}

/**
 * Безпечно конвертує Firebase Timestamp у Date.
 * Необхідно для серіалізації між Server та Client Components.
 */
export function firebaseTimestampToDate(timestamp: any): Date {
    if (!timestamp) return new Date();
    if (timestamp instanceof Date) return timestamp;
    if (typeof timestamp.toDate === 'function') return timestamp.toDate();
    if (typeof timestamp.seconds === 'number') {
        return new Date(timestamp.seconds * 1000);
    }
    return new Date(timestamp);
}

/**
 * Обрізає рядок до заданої довжини з "...".
 */
export function truncate(str: string, maxLength: number): string {
    if (str.length <= maxLength) return str;
    return str.slice(0, maxLength - 3) + '...';
}

/**
 * Очищає HTML-рядок від тегів (strip tags).
 * Використовується для превью контенту.
 */
export function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '');
}

/**
 * Затримка (для дебаунсу, retry-логіки тощо).
 */
export function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Генерує випадковий ID (для тимчасових потреб, не для DB).
 */
export function generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}
