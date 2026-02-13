import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { Question } from "@/components/Quiz";

export interface ExamState {
  theory: Question[];
  reading: { data: any; partA: Question[]; partB: Question[]; };
  listening: { data: any; partA: Question[]; partB: Question[]; };
  speaking: { lesson0: any; lessonRandom: any };
}

export function useExamGenerator() {
  const [loading, setLoading] = useState(false);
  const [examData, setExamData] = useState<ExamState | null>(null);

  // --- НОРМАЛІЗАЦІЯ ДАНИХ (Приведення до єдиного формату Question) ---
  const normalizeQuestion = (q: any, categoryContext: string): Question => {
    let type = (q.type || 'SINGLE').toUpperCase();
    
    // 1. Стандартизація типів
    if (type.includes('MULTIPLE') || type.includes('CHOICE')) type = 'SINGLE';
    if (q.correctIndices && Array.isArray(q.correctIndices)) type = 'MULTI';
    if (type.includes('TRUE')) type = 'TRUE_FALSE';
    if (type.includes('FILL') || type.includes('TEXT')) type = 'FILL_GAP';
    if (type.includes('MATCH')) type = 'MATCHING';
    if (type.includes('MAP')) type = 'MAP';
    if (type.includes('OPEN') || type.includes('SHORT')) type = 'OPEN'; // Для Історії/Політики

    let questionText = q.question || q.question_text || q.prompt || "";
    let textParts = q.textParts || (q.sentence ? [q.sentence] : undefined);

    // 2. Специфіка для Reading (Fill Gap)
    if (categoryContext === 'reading' && type === 'FILL_GAP') {
        const instruction = q.instruction ? q.instruction.trim() : "";
        if (questionText.includes("->")) {
            const parts = questionText.split("->");
            // Формуємо гарний текст питання
            questionText = instruction ? `${instruction}\n\n«${parts[0].trim()}»` : `«${parts[0].trim()}»`;
            textParts = [parts[1].trim()];
        } else {
            if (!textParts && questionText) textParts = [questionText];
            questionText = instruction || "";
        }
    }
    
    // 3. Fix для True/False без тексту
    if (type === 'TRUE_FALSE' && (!questionText || questionText === "Question Text Missing")) {
        questionText = "Σημειώστε Σωστό ή Λάθος";
    }

    // 4. 🔥 SAFETY FIX: Гарантуємо масиви для Map та Matching
    const safePoints = (type === 'MAP' && Array.isArray(q.points)) ? q.points : [];
    const safePairs = (type === 'MATCHING' && Array.isArray(q.pairs)) ? q.pairs : [];
    
    // 5. 🔥 SAFETY FIX: Гарантуємо tolerance для Карти (за замовчуванням 30px)
    const tolerance = (type === 'MAP' && q.tolerance) ? Number(q.tolerance) : 30;

    return {
        id: q.id,
        type,
        question: questionText,
        imageUrl: q.imageUrl || q.image,
        
        // Options logic
        options: q.options || (type === 'SINGLE' && q.optionsA ? [q.optionsA, q.optionsB, q.optionsC, q.optionsD] : undefined),
        correctAnswerIndex: q.correctAnswerIndex,
        correctIndices: q.correctIndices,
        
        // Complex types data
        pairs: safePairs,
        points: safePoints,
        tolerance: tolerance, // Важливо для перевірки карти!

        // True/False normalization
        items: q.items || (type === 'TRUE_FALSE' && q.statement ? [{text: q.statement, isTrue: q.correctAnswer === 'Σ' || q.isTrue}] : undefined),
        
        // Fill Gap data
        textParts,
        wordBank: q.wordBank,
        inlineChoices: q.inlineChoices,
        correctAnswers: q.correctAnswers, // Важливо для AI перевірки

        // Open Question data (для AI)
        modelAnswer: q.modelAnswer || q.correctAnswer || "" 
    };
  };

  const generateExam = async () => {
    setLoading(true);
    try {
      const fetchCol = async (name: string) => {
        const s = await getDocs(collection(db, name));
        return s.docs.map(d => ({ id: d.id, ...d.data() }));
      };

      // 1. Завантажуємо всі колекції паралельно
      const [hist, pol, cult, geo, read, list, speak] = await Promise.all([
        fetchCol("questions_history"), 
        fetchCol("questions_politics"),
        fetchCol("questions_culture"), 
        fetchCol("questions_geography"),
        fetchCol("lessons_reading"), 
        fetchCol("lessons_listening"), 
        fetchCol("lessons_speaking")
      ]);

      // 2. Функція для вибору різноманітних питань (щоб не було 5 однакових типів підряд)
      const selectDiverse = (pool: any[], count: number) => {
        const shuffled = pool.sort(() => 0.5 - Math.random());
        const selected: any[] = [];
        const typeCounts: Record<string, number> = {};
        
        for (const item of shuffled) {
          if (selected.length >= count) break;
          const type = (item.type || 'SINGLE').toUpperCase();
          // Намагаємось не брати більше 2 питань одного типу, якщо це можливо
          if ((typeCounts[type] || 0) < 2) { 
             selected.push(item); 
             typeCounts[type] = (typeCounts[type] || 0) + 1;
          }
        }
        // Якщо не назбирали унікальних, добираємо будь-які
        if (selected.length < count) {
           const remaining = shuffled.filter(i => !selected.includes(i)).slice(0, count - selected.length);
           selected.push(...remaining);
        }
        return selected;
      };

      // 3. Фільтрація географії (Легкі/Складні карти)
      const geoLow = geo.filter((q: any) => (q.order || 0) <= 50);
      const geoHigh = geo.filter((q: any) => (q.order || 0) > 50 && (q.order || 0) <= 70);
      
      // 4. Формування ТЕОРІЇ (20 питань)
      const theoryQs = [
        ...selectDiverse(hist, 6).map(q => ({...q, _cat: 'Ιστορία'})),
        ...selectDiverse(pol, 6).map(q => ({...q, _cat: 'Πολιτική'})),
        ...selectDiverse(cult, 4).map(q => ({...q, _cat: 'Πολιτισμός'})),
        ...selectDiverse(geoLow, 2).map(q => ({...q, _cat: 'Γεωγραφία'})),
        ...selectDiverse(geoHigh, 2).map(q => ({...q, _cat: 'Γεωγραφία (Χάρτης)'})) // Складні карти
      ];

      // 5. Вибір уроків для мови
      const random = (arr: any[]) => arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : null;
      
      const rL = random(read);
      const rA = rL ? (rL.parts?.partA || []).map((q:any) => normalizeQuestion(q, 'reading')) : [];
      const rB = rL ? (rL.parts?.partB || []).map((q:any) => normalizeQuestion(q, 'reading')) : [];

      const lL = random(list);
      const lA = lL ? (lL.parts?.partA || []).map((q:any) => normalizeQuestion({...q, type:'SINGLE'}, 'listening')) : [];
      const lB = lL ? (lL.parts?.partB || []).map((q:any) => normalizeQuestion({...q, type:'TRUE_FALSE'}, 'listening')) : [];

      // Для Speaking беремо завжди перший урок (General) + один випадковий
      const speak0 = speak.find((l: any) => String(l.order) === '0' || l.id === 'lesson_0') || speak[0];
      const speakRandom = random(speak.filter((l: any) => l.id !== speak0?.id));

      setExamData({
        theory: theoryQs.map(q => normalizeQuestion(q, 'theory')),
        reading: { data: rL, partA: rA, partB: rB },
        listening: { data: lL, partA: lA, partB: lB },
        speaking: { lesson0: speak0, lessonRandom: speakRandom }
      });

    } catch (e) { 
        console.error("Exam Generation Error:", e); 
    } finally { 
        setLoading(false); 
    }
  };

  return { generateExam, loading, examData };
}