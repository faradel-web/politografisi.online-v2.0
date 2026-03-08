"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

// 🔥 Використовуємо найновішу стабільну модель
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig: { responseMimeType: "application/json" }
});

// 🔐 VUL-09: Input limits to reduce prompt injection surface and control costs
const INPUT_LIMITS = {
  MAX_ESSAY_LENGTH: 5000,
  MAX_ANSWER_LENGTH: 2000,
  MAX_TOPIC_LENGTH: 500,
  MAX_CONTEXT_LENGTH: 3000,
};

// --- ДОПОМІЖНА ФУНКЦІЯ: ОЧИЩЕННЯ JSON ---
function cleanAndParseJSON(text: string) {
  try {
    return JSON.parse(text);
  } catch (e) {
    try {
      const jsonStartIndex = text.indexOf('{');
      const jsonEndIndex = text.lastIndexOf('}');

      if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
        const cleanJson = text.substring(jsonStartIndex, jsonEndIndex + 1);
        return JSON.parse(cleanJson);
      }
      throw new Error("No JSON found in response");
    } catch (error) {
      console.error("JSON Parsing Failed. Raw text:", text);
      throw error;
    }
  }
}

// ============================================================================
// 1. WRITING (ΕΚΘΕΣΗ) - Βαθμολογία 0-12
// ============================================================================
export async function gradeEssay(topic: string, studentText: string) {
  if (!apiKey) return null;

  if (!studentText || studentText.trim().length < 5) {
    return { score: 0, feedback: "Το κείμενο είναι πολύ μικρό ή κενό.", corrections: "" };
  }

  // 🔐 VUL-09: Truncate input
  const safeTopic = (topic || '').slice(0, INPUT_LIMITS.MAX_TOPIC_LENGTH);
  const safeText = studentText.slice(0, INPUT_LIMITS.MAX_ESSAY_LENGTH);

  const prompt = `
    You are a strict Greek language examiner for the Greek Citizenship Exam (PEGP).
    Task: Evaluate the student's Writing (Essay/Email).
    
    Topic: "${safeTopic}"
    Student's Text: "${safeText}"

    **SCORING CRITERIA (Max 12 Points Total):**
    Evaluate based on 4 pillars (0-3 points each):
    1. **Content:** Relevance to topic, task achievement.
    2. **Vocabulary:** Variety and accuracy of words.
    3. **Grammar/Syntax:** Correct tenses, cases, agreement.
    4. **Cohesion/Structure:** Flow, paragraphs, logical connection.

    **IMPORTANT:** Provide all feedback and corrections ONLY in GREEK.

    **Output strictly valid JSON:**
    {
      "score": number, // Integer from 0 to 12
      "feedback": "string", // Constructive feedback in GREEK language (max 50 words). Address the student directly.
      "corrections": "string" // Key mistakes corrected with short explanation in GREEK.
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = cleanAndParseJSON(text);
    // 🔐 VUL-09: Validate score range
    parsed.score = Math.max(0, Math.min(12, Number(parsed.score) || 0));
    return parsed;
  } catch (e) {
    console.error("AI Essay Error", e);
    return {
      score: 0,
      feedback: "Παρουσιάστηκε σφάλμα. Ενδέχεται να υπερβήκατε το όριο χρήσης. Παρακαλώ περιμένετε λίγο και δοκιμάστε ξανά.",
      corrections: ""
    };
  }
}

// ============================================================================
// 2. SPEAKING (ΠΑΡΑΓΩΓΗ ΛΟΓΟΥ) - Βαθμολογία 0-15
// ============================================================================
export async function gradeSpeaking(topic: string, audioUrl: string) {
  if (!apiKey) return null;
  if (!audioUrl) return { score: 0, feedback: "Δεν βρέθηκε ηχητικό αρχείο.", transcription: "" };

  try {
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) throw new Error("Failed to fetch audio");

    const mimeType = audioResponse.headers.get("content-type") || "audio/webm";
    const arrayBuffer = await audioResponse.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString("base64");

    const prompt = `
      You are a Greek language examiner.
      Task: Evaluate the student's Speaking response.
      Topic: "${topic}"

      **SCORING CRITERIA (Max 15 Points Total):**
      Evaluate based on:
      1. Pronunciation & Intonation (0-5 pts)
      2. Vocabulary & Grammar (0-5 pts)
      3. Fluency & Coherence (0-5 pts)

      **IMPORTANT:** Provide feedback ONLY in GREEK.

      **Output strictly valid JSON:**
      {
        "score": number, // Integer from 0 to 15
        "feedback": "string", // Feedback in GREEK language (max 40 words). Comment on pronunciation and grammar.
        "transcription": "string" // Transcription of what the student said in Greek.
      }
    `;

    const result = await model.generateContent([
      prompt,
      { inlineData: { mimeType, data: base64Audio } }
    ]);

    const text = result.response.text();
    return cleanAndParseJSON(text);
  } catch (error) {
    console.error("AI Speaking Error:", error);
    return {
      score: 0,
      feedback: "Παρουσιάστηκε σφάλμα. Παρακαλώ δοκιμάστε ξανά σε λίγα λεπτά.",
      transcription: ""
    };
  }
}

// ============================================================================
// 3. SHORT ANSWER (ΙΣΤΟΡΙΑ/ΠΟΛΙΤΙΚΗ) - Βαθμολογία 0-2
// ============================================================================
export async function gradeShortAnswer(question: string, userAnswer: string, modelAnswer: string) {
  if (!apiKey) return null;

  if (!userAnswer || userAnswer.trim().length < 2) {
    return { score: 0, isCorrect: false, feedback: "Δεν δόθηκε απάντηση.", improvedAnswer: modelAnswer };
  }

  // 🔐 VUL-09: Truncate input
  const safeQuestion = (question || '').slice(0, INPUT_LIMITS.MAX_TOPIC_LENGTH);
  const safeAnswer = userAnswer.slice(0, INPUT_LIMITS.MAX_ANSWER_LENGTH);
  const safeModel = (modelAnswer || '').slice(0, INPUT_LIMITS.MAX_ANSWER_LENGTH);

  const reference = safeModel ? `Official Model Answer (SOURCE OF TRUTH): "${safeModel}"` : "Evaluate based on general historical/political facts.";

  const prompt = `
    You are a strict teacher preparing students for the Greek citizenship exam.
    
    1. THE TASK:
    Compare the Student's Answer with the Official Model Answer.
    
    Question: "${safeQuestion}"
    ${reference}
    Student's Answer: "${safeAnswer}"

    2. **SCORING RULES (Max 2 Points):**
    - **2 Points (Άριστα):** The answer conveys the FULL meaning. Minor grammar mistakes ignored.
    - **1 Point (Μέτρια):** Partially correct or missing key details.
    - **0 Points (Λάθος):** Factually incorrect or irrelevant.

    **IMPORTANT:** Provide feedback ONLY in GREEK.

    3. **Output strictly valid JSON:**
    {
      "score": number, // 0, 1, or 2
      "isCorrect": boolean, // true if score is 2, false if score is 0 or 1
      "feedback": "string", // Explanation in GREEK language. Explain briefly why it is correct or incorrect compared to the model answer.
      "improvedAnswer": "string" // A corrected version of the student's answer in GREEK, closer to the Model Answer.
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return cleanAndParseJSON(text);
  } catch (error) {
    console.error("AI Short Answer Error:", error);
    return {
      score: 0,
      isCorrect: false,
      feedback: "Σφάλμα συστήματος.",
      improvedAnswer: modelAnswer
    };
  }
}

// ============================================================================
// 4. FILL GAP / LANGUAGE CHECK (ΓΛΩΣΣΑ) - Boolean (Correct/Incorrect)
// ============================================================================
// Ця функція використовується для перевірки пропусків у тексті, де можливі синоніми.
export async function gradeFillGap(context: string, userAnswer: string, correctAnswer: string) {
  if (!apiKey) return { isCorrect: false };
  if (!userAnswer) return { isCorrect: false };

  // Економимо токени, якщо відповідь ідеально збігається
  if (userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()) {
    return { isCorrect: true };
  }

  const prompt = `
    Act as a Greek language expert.
    Task: Determine if the student's answer is linguistically acceptable in the given context.
    
    Context/Sentence: "${context}"
    Target Correct Answer: "${correctAnswer}"
    Student's Answer: "${userAnswer}"

    Rules:
    - Accept synonyms that fit the context perfectly.
    - Accept correct inflections (cases, tenses) even if slightly different from target, provided they fit the grammar.
    - Reject incorrect spellings that change the meaning.
    - Reject grammatically incorrect forms for the specific gap.

    Output strictly valid JSON:
    {
      "isCorrect": boolean
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return cleanAndParseJSON(text);
  } catch (error) {
    // Fallback: якщо AI не відповів, перевіряємо жорстким порівнянням
    return { isCorrect: userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase() };
  }
}