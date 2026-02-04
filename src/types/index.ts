export type UserRole = 'admin' | 'redactor' | 'user' | 'demo_user';

export type ExamSection = 
  | 'history' 
  | 'geography' 
  | 'culture' 
  | 'institutions' 
  | 'political_system' 
  | 'reading_comprehension' 
  | 'speaking';

export interface UserProgress {
  completedMaterials: string[]; // Array of material IDs
  quizScores: Record<string, number>; // quizId -> score (0-100)
  lastActive: Date;
  overallLevel: number; // 0-100 calculated progress
}

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: UserRole;
  createdAt: Date;
  progress: UserProgress;
  isApproved: boolean; // For manual admin approval
}

export type QuestionType = 'multiple_choice' | 'open_text' | 'audio';

export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options?: QuizOption[]; // Only for multiple_choice
  correctAnswer?: string; // ID of the correct option for MC
  aiPromptContext?: string; // Specific context for AI to grade open text or audio
  points: number;
}

export interface StudyMaterial {
  id: string;
  section: ExamSection;
  title: string;
  content: string; // Markdown or HTML content
  mediaUrls: string[]; // URLs to images or audio stored locally/firebase
  questions: QuizQuestion[]; // Embedded quiz for this material
  createdAt: Date;
  updatedAt: Date;
  authorId: string; // ID of the redactor
}

// AI Related Types
export interface AiFeedback {
  score: number;
  feedback: string;
  correction?: string;
}