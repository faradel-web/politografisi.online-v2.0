import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  console.log("--- 1. ПОЧАТОК ЗАПИТУ ДО API ---");
  
  try {
    const body = await req.json();
    const { message, context } = body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY не знайдено");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // --- ВИПРАВЛЕННЯ ТУТ ---
    // Ми використовуємо "gemini-2.0-flash", бо вона працює з вашим ключем
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const systemPrompt = `
      Ти — викладач. Відповідай українською мовою, спираючись на наданий контекст.
      
      КОНТЕКСТ З ПІДРУЧНИКА:
      ${context ? context.slice(0, 30000) : "Контекст відсутній."}
      
      ПИТАННЯ СТУДЕНТА:
      ${message}
    `;

    console.log("--- 2. Відправка запиту в Google (Model: gemini-2.0-flash)... ---");
    
    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const text = response.text();
    
    console.log("--- 3. ✅ Успіх! ---");
    return NextResponse.json({ text });

  } catch (error: any) {
    console.error("--- ❌ ПОМИЛКА ---", error);
    return NextResponse.json({ 
      error: error.message || "Internal Server Error", 
      details: "Перевірте назву моделі в src/app/api/chat/route.ts" 
    }, { status: 500 });
  }
}