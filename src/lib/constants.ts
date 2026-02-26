// --- РОЗДІЛИ КУРСІВ ---
export const COURSE_SECTIONS = [
  // --- ΘΕΩΡΗΤΙΚΟ ΜΕΡΟΣ ---
  {
    id: "history",
    title: "Ιστορία",
    description: "Σημαντικά γεγονότα από την αρχαιότητα έως σήμερα.",
    icon: "history",
    color: "text-blue-600",
    bg: "bg-blue-50"
  },
  {
    id: "politics",
    title: "Πολιτικοί Θεσμοί",
    description: "Σύνταγμα, Βουλή, Κυβέρνηση και Ευρωπαϊκή Ένωση.",
    icon: "landmark",
    color: "text-indigo-600",
    bg: "bg-indigo-50"
  },
  {
    id: "geography",
    title: "Γεωγραφία",
    description: "Γεωγραφικά διαμερίσματα, βουνά, λίμνες και σύνορα.",
    icon: "globe",
    color: "text-cyan-600",
    bg: "bg-cyan-50"
  },
  {
    id: "culture",
    title: "Πολιτισμός",
    description: "Ήθη, έθιμα, τέχνες, επιστήμες και παράδοση.",
    icon: "palette",
    color: "text-pink-600",
    bg: "bg-pink-50"
  },

  // --- ΓΛΩΣΣΙΚΟ ΜΕΡΟΣ ---
  {
    id: "reading",
    title: "Ανάγνωση & Γραφή",
    description: "Ασκήσεις ανάγνωσης κειμένων και γραπτή έκφραση.",
    icon: "book-open",
    color: "text-emerald-600",
    bg: "bg-emerald-50"
  },
  {
    id: "listening",
    title: "Κατανόηση Προφορικού Λόγου",
    description: "Ασκήσεις ακρόασης και κατανόησης ομιλίας.",
    icon: "headphones",
    color: "text-purple-600",
    bg: "bg-purple-50"
  },
  {
    id: "speaking",
    title: "Παραγωγή Προφορικού Λόγου",
    description: "Προφορική εξέταση, συζήτηση και παρουσίαση.",
    icon: "mic",
    color: "text-orange-600",
    bg: "bg-orange-50"
  }
];

// --- ТИПИ ПИТАНЬ ---
export const QUESTION_TYPES = [
  { value: 'multiple-choice', label: 'Вибір (А, Β, Γ)' },
  { value: 'true-false', label: 'Так/Ні (Σωστό/Λάθος)' },
  { value: 'text', label: 'Вписати слово' },
  { value: 'matching', label: 'З’єднання (Matching)' },
  { value: 'fill-in-the-blanks', label: 'Заповнення пропусків' },
  { value: 'image-choice', label: 'Вибір зображення' }
];

// --- РОЛІ КОРИСТУВАЧІВ ---
export const USER_ROLES = {
  ADMIN: 'admin',
  EDITOR: 'editor',
  STUDENT: 'student',
  GUEST: 'guest'
};

// --- ЛІМІТИ ---
export const GUEST_LIMITS = {
  CONTENT_ITEMS: 5,   // Скільки питань/теστών бачить гість
  EXAM_ATTEMPTS: 1,   // Спроби іспиту
  THEORY_PAGES: 1,    // Ліміт сторінок теорії για демо користувачів
  AI_CHECKS: 0        // Ліміт AI
};

export const PASSING_SCORE = 60;