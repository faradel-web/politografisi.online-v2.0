"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

// 🔥 ВИПРАВЛЕННЯ: Використовуємо 'gemini-1.5-flash'
// Це найстабільніша модель з найвищими лімітами (15 запитів/хв безкоштовно).
// Вона вирішить проблеми 404 (не знайдено) та 429 (ліміти).
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash", 
  generationConfig: { responseMimeType: "application/json" }
});

function cleanAndParseJSON(text: string) {
  try {
    return JSON.parse(text);
  } catch (e) {
    try {
      const jsonStartIndex = text.indexOf('{');
      const jsonEndIndex = text.lastIndexOf('}');
      if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
        return JSON.parse(text.substring(jsonStartIndex, jsonEndIndex + 1));
      }
      throw new Error("No JSON found");
    } catch (error) {
      console.error("JSON Parse Error:", text);
      throw error;
    }
  }
}

export async function gradeEssay(topic: string, studentText: string) {
  if (!apiKey) return null;
  if (!studentText || studentText.trim().length < 5) return { score: 0, feedback: "Κείμενο πολύ μικρό.", corrections: "" };
  
  const prompt = `
    You are a Greek language examiner. Evaluate Writing.
    Topic: "${topic}"
    Text: "${studentText}"
    Criteria: Content, Vocabulary, Grammar, Coherence (0-3 pts each).
    IMPORTANT: Feedback ONLY in GREEK.
    Output JSON: { "score": number, "feedback": "string", "corrections": "string" }
  `;

  try {
    const result = await model.generateContent(prompt);
    return cleanAndParseJSON(result.response.text());
  } catch (e) { 
    console.error("AI Error:", e);
    return { score: 0, feedback: "Παρουσιάστηκε σφάλμα (όριο χρήσης). Δοκιμάστε ξανά σε λίγο.", corrections: "" }; 
  }
}

export async function gradeSpeaking(topic: string, audioUrl: string) {
  if (!apiKey) return null;
  if (!audioUrl) return { score: 0, feedback: "Λείπει το αρχείο ήχου.", transcription: "" };

  try {
    const resp = await fetch(audioUrl);
    const audioData = Buffer.from(await resp.arrayBuffer()).toString("base64");

    const prompt = `
      Evaluate Greek Speaking. Topic: "${topic}".
      Criteria: Pronunciation, Vocabulary, Fluency (0-5 pts each).
      IMPORTANT: Feedback ONLY in GREEK.
      Output JSON: { "score": number, "feedback": "string", "transcription": "string" }
    `;

    const result = await model.generateContent([prompt, { inlineData: { mimeType: "audio/webm", data: audioData } }]);
    return cleanAndParseJSON(result.response.text());
  } catch (e) {
    console.error("AI Error:", e);
    return { score: 0, feedback: "Σφάλμα συστήματος. Δοκιμάστε ξανά.", transcription: "" };
  }
}

export async function gradeShortAnswer(question: string, userAnswer: string, modelAnswer: string) {
  if (!apiKey) return null;
  if (!userAnswer || userAnswer.trim().length < 2) return { score: 0, isCorrect: false, feedback: "Κενή απάντηση.", improvedAnswer: modelAnswer };

  const prompt = `
    Compare Student Answer with Model Answer.
    Question: "${question}"
    Model: "${modelAnswer}"
    Student: "${userAnswer}"
    Scoring: 2 (Excellent), 1 (Partial), 0 (Wrong).
    IMPORTANT: Feedback ONLY in GREEK.
    Output JSON: { "score": number, "isCorrect": boolean, "feedback": "string", "improvedAnswer": "string" }
  `;

  try {
    const result = await model.generateContent(prompt);
    return cleanAndParseJSON(result.response.text());
  } catch (e) {
    console.error("AI Error:", e);
    return { score: 0, isCorrect: false, feedback: "Υψηλός φόρτος συστήματος. Παρακαλώ περιμένετε λίγο.", improvedAnswer: modelAnswer };
  }
}