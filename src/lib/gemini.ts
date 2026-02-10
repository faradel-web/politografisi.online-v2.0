"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

// 🔥 ОНОВЛЕННЯ: Перейшли на актуальну модель gemini-2.5-flash
// Це поточна стабільна версія (GA), яка замінила застарілу 1.5.
const model = genAI.getGenerativeModel({ 
  model: "gemini-2.5-flash", 
  generationConfig: { responseMimeType: "application/json" }
});

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
  
  const prompt = `
    You are a strict Greek language examiner for the Greek Citizenship Exam (PEGP).
    Task: Evaluate the student's Writing (Essay/Email).
    
    Topic: "${topic}"
    Student's Text: "${studentText}"

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
    return cleanAndParseJSON(text);
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

  const reference = modelAnswer ? `Official Model Answer (SOURCE OF TRUTH): "${modelAnswer}"` : "Evaluate based on general historical/political facts.";

  const prompt = `
    You are a strict teacher preparing students for the Greek citizenship exam.
    
    1. THE TASK:
    Compare the Student's Answer with the Official Model Answer.
    
    Question: "${question}"
    ${reference}
    Student's Answer: "${userAnswer}"

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
      feedback: "Παρουσιάστηκε σφάλμα ή υψηλός φόρτος συστήματος. Παρακαλώ περιμένετε λίγο και δοκιμάστε ξανά.", 
      improvedAnswer: modelAnswer 
    };
  }
}