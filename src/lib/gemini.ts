"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

// Налаштовуємо модель. 
// Важливо: generationConfig змушує модель повертати чистий JSON.
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash",
  generationConfig: { responseMimeType: "application/json" }
});

// --- ПЕРЕВІРКА ПИСЬМА (WRITING) ---
export async function gradeEssay(topic: string, studentText: string) {
  if (!apiKey) {
    console.error("API Key for Gemini is missing");
    return null;
  }
  if (!studentText || studentText.trim().length < 10) {
    return { score: 0, feedback: "Текст занадто короткий для оцінювання.", corrections: "" };
  }
  
  const prompt = `
    You are a strict Greek language examiner. 
    Topic: "${topic}"
    Student's Essay: "${studentText}"

    Evaluate this essay based on:
    1. Grammar and Syntax (accuracy).
    2. Vocabulary (richness and relevance).
    3. Cohesion and Coherence.
    4. Task Achievement.

    Output strictly valid JSON with this schema:
    {
      "score": number, // Score from 0 to 12 (Integer only)
      "feedback": "string", // Constructive feedback in Ukrainian language (max 50 words)
      "corrections": "string" // Key mistakes corrected with explanation
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    // Навіть з JSON mode іноді варто почистити markdown
    const jsonString = text.replace(/```json|```/g, "").trim();
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("AI Writing Error:", error);
    return { score: 0, feedback: "Не вдалося отримати оцінку від ШІ.", corrections: "" };
  }
}

// --- ПЕРЕВІРКА РОЗМОВИ (SPEAKING) ---
export async function gradeSpeaking(topic: string, audioUrl: string) {
  if (!apiKey) return null;
  if (!audioUrl) return { score: 0, feedback: "Аудіофайл відсутній.", transcription: "" };

  try {
    // 1. Завантажуємо файл
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) throw new Error("Failed to fetch audio file");

    // 2. Визначаємо правильний MIME тип (щоб підтримувати і iPhone, і Android)
    const mimeType = audioResponse.headers.get("content-type") || "audio/webm";
    
    const arrayBuffer = await audioResponse.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString("base64");

    const prompt = `
      You are a Greek language examiner. Listen to the audio response.
      The topic was: "${topic}".
      
      Evaluate based on:
      1. Pronunciation and Intonation.
      2. Fluency.
      3. Grammar and Vocabulary.

      Output strictly valid JSON with this schema:
      {
        "score": number, // Score from 0 to 15 (Integer only)
        "feedback": "string", // Constructive feedback in Ukrainian language (max 50 words)
        "transcription": "string" // Transcription of what student said in Greek
      }
    `;

    const result = await model.generateContent([
      prompt,
      { 
        inlineData: { 
          mimeType: mimeType, // Використовуємо реальний тип (audio/mp4, audio/webm etc.)
          data: base64Audio 
        } 
      }
    ]);

    const text = result.response.text();
    const jsonString = text.replace(/```json|```/g, "").trim();
    return JSON.parse(jsonString);

  } catch (error) {
    console.error("AI Speaking Error:", error);
    return { score: 0, feedback: "Помилка обробки аудіо (ШІ).", transcription: "" };
  }
}