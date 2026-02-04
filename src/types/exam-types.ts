// ==============================================================================
// 1. ЗАГАЛЬНІ КОНСТАНТИ
// ==============================================================================

export enum QuestionDomain {
  THEORY = 'THEORY',       // Історія, Політика, Культура, Географія (Банк питань)
  READING = 'READING',     // Урок читання (Текст + 3 частини)
  LISTENING = 'LISTENING', // Урок аудіювання (Аудіо + 2 частини)
  SPEAKING = 'SPEAKING'    // Урок говоріння (Тема + Запис)
}

// Повний перелік типів, знайдений у всіх редакторах
export type QuestionType = 
  | 'SINGLE'        // Вибір одного (Radio). DB: multiple-choice, image-choice, implicit_single
  | 'MULTI'         // Вибір кількох (Checkbox). DB: multiple-choice-multiple
  | 'TRUE_FALSE'    // Правда/Неправда (Текст або Картинки). DB: true-false, true-false-image
  | 'MATCHING'      // Пари (Текст-Текст або Текст-Картинка). DB: matching, image-matching
  | 'FILL_GAP'      // Пропуски (Вписати, Банк слів, або Inline Dropdown). DB: fill-in-the-blanks, inline-choice
  | 'MAP'           // Карта (Drag & Drop). DB: map_drag_drop
  | 'OPEN';         // Відкрита відповідь / Есе. DB: open-answer

// ==============================================================================
// 2. ДОПОМІЖНІ ІНТЕРФЕЙСИ (Цеглинки)
// ==============================================================================

// Рядок для True/False (може бути картинкою в Культурі)
export interface TrueFalseItem {
  id: string;
  text?: string;      // Текст твердження
  imageUrl?: string;  // URL картинки (якщо питання по картинці)
  isTrue: boolean;    // Правильна відповідь
}

// Пара для Matching (може мати картинки, як в Культурі)
export interface MatchingPair {
  id: string;
  left: string;
  leftImg?: string;
  right: string;
  rightImg?: string;
}

// Точка на карті (Географія)
export interface MapPoint {
  id: string;
  lat: number;
  lng: number;
  label: string; // Назва точки (напр. "Афіни")
}

// ==============================================================================
// 3. СТРУКТУРИ ПИТАНЬ (Universal Interfaces)
// ==============================================================================

interface BaseQuestion {
  id: string;
  type: QuestionType;
  question: string; // Заголовок / Інструкція (напр. "Оберіть правильну відповідь")
  imageUrl?: string; // Головне зображення до питання (опціонально)
}

// 1. SINGLE CHOICE
export interface SingleChoiceQuestion extends BaseQuestion {
  type: 'SINGLE';
  options: string[]; // Масив варіантів ["А", "Б", "В"]
  correctAnswerIndex: number; // Індекс правильного (0-3)
}

// 2. MULTI CHOICE
export interface MultiChoiceQuestion extends BaseQuestion {
  type: 'MULTI';
  options: string[];
  correctIndices: number[]; // Масив індексів правильних відповідей
}

// 3. TRUE / FALSE
export interface TrueFalseQuestion extends BaseQuestion {
  type: 'TRUE_FALSE';
  items: TrueFalseItem[]; // Масив рядків (зазвичай 4 для теорії, 5 для мови)
}

// 4. MATCHING
export interface MatchingQuestion extends BaseQuestion {
  type: 'MATCHING';
  pairs: MatchingPair[];
}

// 5. FILL GAP (Найскладніший тип - покриває всі варіації)
export interface FillGapQuestion extends BaseQuestion {
  type: 'FILL_GAP';
  
  // Текст завдання. Може бути масивом речень (History) або одним текстом (Culture)
  textParts: string[]; 
  
  // Режим: 'GLOBAL' (банк слів знизу) або 'INLINE' (випадаючий список у тексті)
  mode: 'GLOBAL' | 'INLINE' | 'TYPING';

  // Варіанти відповідей
  wordBank?: string[]; // Для GLOBAL
  inlineChoices?: Record<string, string[]>; // Для INLINE {"1": ["А", "Б"], "2": ["В", "Г"]}

  // Правильні відповіді (ключ = номер пропуску "1", "2")
  correctAnswers: Record<string, string>; 
}

// 6. MAP (Географія)
export interface MapQuestion extends BaseQuestion {
  type: 'MAP';
  points: MapPoint[];
  tolerance: number; // Радіус в км (напр. 30)
}

// 7. OPEN / WRITING
export interface OpenQuestion extends BaseQuestion {
  type: 'OPEN';
  modelAnswer?: string; // Еталонна відповідь
  minWords?: number;    // Для есе в Reading
}

// Універсальний тип (Union)
export type AnyQuestion = 
  | SingleChoiceQuestion 
  | MultiChoiceQuestion 
  | TrueFalseQuestion 
  | MatchingQuestion 
  | FillGapQuestion 
  | MapQuestion 
  | OpenQuestion;

// ==============================================================================
// 4. ДОКУМЕНТИ FIREBASE (Те, що зберігається в колекціях)
// ==============================================================================

// КОЛЕКЦІЇ: questions_history, questions_politics, questions_culture, questions_geography
export type TheoryDocument = AnyQuestion & {
  order: number;
  category: 'history' | 'politics' | 'culture' | 'geography';
  createdAt: any; 
};

// КОЛЕКЦІЯ: lessons_reading
export interface ReadingDocument {
  id: string;
  order: number;
  title: string;
  
  // Контент статті
  textContent: string; 
  imageUrls?: string[];

  parts: {
    // Part A: Завжди тести (Single Choice)
    partA: SingleChoiceQuestion[]; 
    
    // Part B: Граматика (Mixed: Fill, Match, TF, Single)
    partB: AnyQuestion[];
    
    // Part C: Письмо (Open)
    partC: OpenQuestion; 
  };
}

// КОЛЕКЦІЯ: lessons_listening
export interface ListeningDocument {
  id: string;
  order: number;
  title: string;
  
  audioUrl: string;
  transcript?: string; // Текст аудіо (знайдено в Listening Editor)

  parts: {
    // Part A: 5 питань Single Choice
    partA: SingleChoiceQuestion[];
    
    // Part B: 5 питань True/False (Σ/Λ)
    partB: TrueFalseQuestion[];
  };
}

// КОЛЕКЦІЯ: lessons_speaking
export interface SpeakingDocument {
  id: string;
  order: number;
  title: string;
  
  prompt: string; // Текст завдання
  imageUrls?: string[]; 
  tips?: string[]; // Підказки (опціонально)
}