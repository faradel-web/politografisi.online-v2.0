import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

// --- RATE LIMITER LOGIC (In-Memory) ---
type RateLimitRecord = {
  minuteCount: number;
  minuteStart: number;
  hourCount: number;
  hourStart: number;
};

const rateLimitMap = new Map<string, RateLimitRecord>();

const LIMITS = {
  PER_MINUTE: 10, // Трішки підняв ліміт для тестів
  PER_HOUR: 50,
};

function checkRateLimit(ip: string): { allowed: boolean; message?: string } {
  const now = Date.now();
  const record = rateLimitMap.get(ip) || {
    minuteCount: 0,
    minuteStart: now,
    hourCount: 0,
    hourStart: now,
  };

  if (now - record.minuteStart > 60000) {
    record.minuteCount = 0;
    record.minuteStart = now;
  }

  if (now - record.hourStart > 3600000) {
    record.hourCount = 0;
    record.hourStart = now;
  }

  if (record.minuteCount >= LIMITS.PER_MINUTE) {
    return { allowed: false, message: "Ο αριθμός των αιτημάτων περιορίζεται (μέγιστο 5 ανά λεπτό)." };
  }
  if (record.hourCount >= LIMITS.PER_HOUR) {
    return { allowed: false, message: "Ο αριθμός των αιτημάτων περιορίζεται (μέγιστο 20 ανά ώρα)." };
  }

  record.minuteCount++;
  record.hourCount++;
  rateLimitMap.set(ip, record);

  return { allowed: true };
}

export async function POST(req: Request) {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") || "unknown";
  
  const limitCheck = checkRateLimit(ip);
  if (!limitCheck.allowed) {
    return NextResponse.json({ 
      text: `${limitCheck.message} Για περισσότερες πληροφορίες: https://gemini.google.com/` 
    });
  }

  try {
    const body = await req.json();
    const { message, context } = body;

    // --- DEBUG LOGGING ---
    console.log(`--- ЗАПИТ ВІД IP: ${ip} ---`);
    console.log(`--- ДОВЖИНА КОНТЕКСТУ: ${context ? context.length : 0} символів ---`);
    
    if (!context || context.length < 50) {
        console.warn("⚠️ УВАГА: Контекст порожній або дуже малий!");
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY не знайдено");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Збільшено ліміт контексту до 100,000 символів (Flash підтримує до 1 млн)
    const systemPrompt = `
      Είσαι ένας αυστηρός ακαδημαϊκός βοηθός για φοιτητές που προετοιμάζονται για εξετάσεις ελληνομάθειας.
      
      ΟΔΗΓΙΕΣ:
      1. Απάντησε ΑΠΟΚΛΕΙΣΤΙΚΑ στα Ελληνικά.
      2. Χρησιμοποίησε το παρακάτω "ΠΛΑΙΣΙΟ ΔΕΔΟΜΕΝΩΝ" για να απαντήσεις.
      3. Αν η ερώτηση είναι γενική (π.χ. "τι ξέρεις;", "ποιος είναι;"), κάνε μια σύνοψη με βάση το κείμενο.
      4. Να είσαι ΛΑΚΩΝΙΚΟΣ (σύντομες, περιεκτικές προτάσεις).
      5. Αν η απάντηση ΔΕΝ υπάρχει στο κείμενο, πες: "Δεν υπάρχει αυτή η πληροφορία στο διδακτικό υλικό."
      
      ΠΛΑΙΣΙΟ ΔΕΔΟΜΕΝΩΝ (CONTEXT):
      ${context ? context.slice(0, 100000) : "Κανένα πλαίσιο."}
      
      ΕΡΩΤΗΣΗ ΦΟΙΤΗΤΗ:
      ${message}
    `;

    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const text = response.text();
    
    return NextResponse.json({ text });

  } catch (error: any) {
    console.error("--- ❌ ПОМИЛКА ---", error);
    return NextResponse.json({ 
      text: "Παρουσιάστηκε τεχνικό σφάλμα. Δοκιμάστε ξανά." 
    }, { status: 500 });
  }
}