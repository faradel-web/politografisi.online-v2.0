/**
 * progress.ts — Firebase Firestore utility функції для відстеження прогресу користувача.
 *
 * Три основні напрямки:
 * 1. Теорія (theoryProgress) — позначка "Прочитано" по кожному уроку
 * 2. Практика (practiceStats) — кількість правильних/неправильних відповідей по категоріях
 * 3. Помилки (mistakes) — масив ID питань для "Роботи над помилками"
 */

import { doc, updateDoc, getDoc, setDoc, serverTimestamp, arrayUnion, arrayRemove, deleteField } from "firebase/firestore";
import { db } from "@/lib/firebase";

// =====================================================================
// 1. THEORY PROGRESS
// =====================================================================

/**
 * Позначити урок теорії як прочитаний.
 * Зберігає в `progress.theoryProgress[lessonId]` = serverTimestamp().
 *
 * @param userId - UID поточного користувача
 * @param lessonId - ID документа уроку з колекції theory_content
 */
export async function updateTheoryProgress(userId: string, lessonId: string): Promise<void> {
    const userRef = doc(db, "users", userId);

    try {
        await updateDoc(userRef, {
            [`progress.theoryProgress.${lessonId}`]: serverTimestamp(),
            "progress.lastActive": serverTimestamp(),
        });
    } catch (error: any) {
        // Якщо документ ще не має поля progress, створимо його
        if (error.code === "not-found") {
            await setDoc(userRef, {
                progress: {
                    theoryProgress: { [lessonId]: new Date() },
                    lastActive: new Date(),
                },
            }, { merge: true });
        } else {
            console.error("Error updating theory progress:", error);
            throw error;
        }
    }
}

/**
 * Перевірити, чи урок вже прочитаний.
 *
 * @param userId - UID поточного користувача
 * @param lessonId - ID документа уроку
 * @returns true, якщо урок позначений як прочитаний
 */
export async function isTheoryLessonRead(userId: string, lessonId: string): Promise<boolean> {
    try {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) return false;

        const data = userSnap.data();
        return !!(data?.progress?.theoryProgress?.[lessonId]);
    } catch (error) {
        console.error("Error checking theory progress:", error);
        return false;
    }
}

/**
 * Отримати повний прогрес теорії користувача.
 *
 * @param userId - UID поточного користувача
 * @returns Record<lessonId, timestamp> з прочитаними уроками
 */
export async function getTheoryProgress(userId: string): Promise<Record<string, any>> {
    try {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) return {};

        return userSnap.data()?.progress?.theoryProgress || {};
    } catch (error) {
        console.error("Error fetching theory progress:", error);
        return {};
    }
}

/**
 * Скинути прогрес конкретного уроку теорії.
 * Видаляє поле з `progress.theoryProgress[lessonId]`.
 * Дозволяє студенту перечитати та знову позначити урок.
 *
 * @param userId - UID поточного користувача
 * @param lessonId - ID документа уроку
 */
export async function removeTheoryProgress(userId: string, lessonId: string): Promise<void> {
    const userRef = doc(db, "users", userId);
    try {
        await updateDoc(userRef, {
            [`progress.theoryProgress.${lessonId}`]: deleteField(),
            "progress.lastActive": serverTimestamp(),
        });
    } catch (error) {
        console.error("Error removing theory progress:", error);
        throw error;
    }
}

// =====================================================================
// 2. PRACTICE STATS (Per-question result tracking)
// =====================================================================

/**
 * Зберегти результат відповіді на конкретне питання практики.
 *
 * Зберігає в `progress.practiceResults[questionId] = { category, isCorrect }`.
 * При повторній відповіді — просто ПЕРЕЗАПИСУЄ старий результат.
 * Це гарантує, що правильна відповідь при повторі "замінює" попередню помилку.
 *
 * @param userId    - UID поточного користувача
 * @param questionId - Унікальний ID питання (зазвичай lesson.id або `${lessonId}_${qIndex}`)
 * @param category  - Категорія (history, geography, reading тощо)
 * @param isCorrect - true якщо відповідь правильна
 */
export async function updatePracticeResult(
    userId: string,
    questionId: string,
    category: string,
    isCorrect: boolean
): Promise<void> {
    // Sanitize questionId: Firestore не дозволяє крапки в ключах
    const safeId = questionId.replace(/\./g, '_');
    const userRef = doc(db, "users", userId);

    try {
        await updateDoc(userRef, {
            [`progress.practiceResults.${safeId}`]: { category, isCorrect },
            "progress.lastActive": serverTimestamp(),
        });
    } catch (error: any) {
        if (error.code === "not-found") {
            await setDoc(userRef, {
                progress: {
                    practiceResults: {
                        [safeId]: { category, isCorrect },
                    },
                    lastActive: new Date(),
                },
            }, { merge: true });
        } else {
            console.error("Error updating practice result:", error);
            throw error;
        }
    }
}

/**
 * Отримати агреговану статистику практики по категоріях.
 * Обчислює з `practiceResults` (per-question map) — тому перезаписані результати
 * автоматично враховуються правильно.
 *
 * @param userId - UID поточного користувача
 * @returns Record<category, { correct, incorrect }>
 */
export async function getPracticeStats(userId: string): Promise<Record<string, { correct: number; incorrect: number }>> {
    try {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) return {};

        const data = userSnap.data()?.progress || {};

        // --- Новий формат: агрегуємо з practiceResults ---
        const practiceResults: Record<string, { category: string; isCorrect: boolean }> =
            data.practiceResults || {};

        if (Object.keys(practiceResults).length > 0) {
            const stats: Record<string, { correct: number; incorrect: number }> = {};
            for (const result of Object.values(practiceResults)) {
                if (!result?.category) continue;
                if (!stats[result.category]) stats[result.category] = { correct: 0, incorrect: 0 };
                if (result.isCorrect) {
                    stats[result.category].correct++;
                } else {
                    stats[result.category].incorrect++;
                }
            }
            return stats;
        }

        // --- Старий формат (зворотна сумісність) ---
        return data.practiceStats || {};
    } catch (error) {
        console.error("Error fetching practice stats:", error);
        return {};
    }
}

/**
 * Backward-compatible wrapper: зберігає кілька результатів за один виклик.
 * Використовується для list-layout (кілька питань одночасно).
 *
 * @param userId     - UID поточного користувача
 * @param category   - Категорія
 * @param results    - Масив { questionId, isCorrect }
 */
export async function updatePracticeStats(
    userId: string,
    category: string,
    results: { questionId: string; isCorrect: boolean }[]
): Promise<void> {
    if (!results.length) return;
    const safeResults: Record<string, { category: string; isCorrect: boolean }> = {};
    for (const r of results) {
        const safeId = r.questionId.replace(/\./g, '_');
        safeResults[safeId] = { category, isCorrect: r.isCorrect };
    }

    const userRef = doc(db, "users", userId);
    try {
        const updates: Record<string, any> = { "progress.lastActive": serverTimestamp() };
        for (const [id, val] of Object.entries(safeResults)) {
            updates[`progress.practiceResults.${id}`] = val;
        }
        await updateDoc(userRef, updates);
    } catch (error: any) {
        if (error.code === "not-found") {
            await setDoc(userRef, {
                progress: { practiceResults: safeResults, lastActive: new Date() },
            }, { merge: true });
        } else {
            console.error("Error batch updating practice stats:", error);
            throw error;
        }
    }
}

/**
 * Отримати per-question результати для конкретної категорії.
 * Повертає Map<questionId, isCorrect> — дозволяє на клієнті визначити:
 *   - Які питання вже відповідені (ключ існує)
 *   - Правильно чи ні (значення true/false)
 *
 * @param userId   - UID поточного користувача
 * @param category - Категорія (history, geography, тощо)
 * @returns Record<questionId, boolean>
 */
export async function getPracticeResultsForCategory(
    userId: string,
    category: string
): Promise<Record<string, boolean>> {
    try {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) return {};

        const practiceResults: Record<string, { category: string; isCorrect: boolean }> =
            userSnap.data()?.progress?.practiceResults || {};

        const filtered: Record<string, boolean> = {};
        for (const [qId, result] of Object.entries(practiceResults)) {
            if (result?.category === category) {
                filtered[qId] = result.isCorrect;
            }
        }
        return filtered;
    } catch (error) {
        console.error("Error fetching practice results for category:", error);
        return {};
    }
}

// =====================================================================
// 3. MISTAKES (Робота над помилками)
// =====================================================================

/**
 * Додати ID питання до масиву помилок.
 * Використовує arrayUnion — не додасть дублікат.
 *
 * @param userId - UID поточного користувача
 * @param questionId - ID питання (наприклад, "questions_history/abc123")
 */
export async function addMistake(userId: string, questionId: string): Promise<void> {
    const userRef = doc(db, "users", userId);

    try {
        await updateDoc(userRef, {
            "progress.mistakes": arrayUnion(questionId),
        });
    } catch (error: any) {
        if (error.code === "not-found") {
            await setDoc(userRef, {
                progress: { mistakes: [questionId] },
            }, { merge: true });
        } else {
            console.error("Error adding mistake:", error);
            throw error;
        }
    }
}

/**
 * Видалити ID питання з масиву помилок (коли відповів правильно).
 *
 * @param userId - UID поточного користувача
 * @param questionId - ID питання
 */
export async function removeMistake(userId: string, questionId: string): Promise<void> {
    const userRef = doc(db, "users", userId);

    try {
        await updateDoc(userRef, {
            "progress.mistakes": arrayRemove(questionId),
        });
    } catch (error) {
        console.error("Error removing mistake:", error);
    }
}

/**
 * Отримати масив ID помилкових питань.
 *
 * @param userId - UID поточного користувача
 * @returns string[] з ID питань
 */
export async function getMistakes(userId: string): Promise<string[]> {
    try {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) return [];

        return userSnap.data()?.progress?.mistakes || [];
    } catch (error) {
        console.error("Error fetching mistakes:", error);
        return [];
    }
}
