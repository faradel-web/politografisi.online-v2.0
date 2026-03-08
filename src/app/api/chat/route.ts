import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { GoogleGenerativeAI } from "@google/generative-ai";

// --- RATE LIMITER LOGIC (In-Memory) ---
// ⚠️ NOTE: In-memory rate limiter не працює на serverless (Vercel) між інстансами.
// TODO: Мігрувати на Upstash Redis / Vercel KV для production.
type RateLimitRecord = {
  minuteCount: number;
  minuteStart: number;
  hourCount: number;
  hourStart: number;
};

const rateLimitMap = new Map<string, RateLimitRecord>();

const LIMITS = {
  PER_MINUTE: 10,
  PER_HOUR: 50,
  MAX_MESSAGE_LENGTH: 5000,        // 🔐 VUL-07: Max message length
  MAX_CONTEXT_LENGTH: 100000,      // 🔐 VUL-07: Max context length
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

// Централізована ініціалізація Gemini — один раз на модуль
const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
const model = genAI?.getGenerativeModel({ model: "gemini-2.0-flash" }) ?? null;

export async function POST(req: Request) {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") || "unknown";

  // 🔐 CORS: Перевірка Origin
  const origin = headersList.get("origin");
  const allowedOrigins = [
    "https://politografisi.online",
    "https://www.politografisi.online",
    process.env.NEXT_PUBLIC_APP_URL,
  ].filter(Boolean);

  // В dev-режимі дозволяємо localhost
  const isDev = process.env.NODE_ENV === "development";
  // 🔐 VUL-08 FIX: In production, reject requests without Origin header
  const isAllowedOrigin = isDev || (origin && allowedOrigins.includes(origin));

  if (!isAllowedOrigin) {
    return NextResponse.json(
      { text: "Μη εξουσιοδοτημένο αίτημα." },
      { status: 403 }
    );
  }

  const limitCheck = checkRateLimit(ip);
  if (!limitCheck.allowed) {
    return NextResponse.json({
      text: `${limitCheck.message} Για περισσότερες πληροφορίες: https://gemini.google.com/`
    }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { message, context } = body;

    // 🔐 VUL-07 FIX: Input validation
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ text: 'Παρακαλώ εισάγετε ένα μήνυμα.' }, { status: 400 });
    }

    if (message.length > LIMITS.MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { text: `Το μήνυμα είναι πολύ μεγάλο. Μέγιστο: ${LIMITS.MAX_MESSAGE_LENGTH} χαρακτήρες.` },
        { status: 400 }
      );
    }

    const safeContext = context ? String(context).slice(0, LIMITS.MAX_CONTEXT_LENGTH) : '';

    if (!model) throw new Error("Το GEMINI_API_KEY δεν βρέθηκε");

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
      ${safeContext || "Κανένα πλαίσιο."}
      
      ΕΡΩΤΗΣΗ ΦΟΙΤΗΤΗ:
      ${message}
    `;

    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ text });

  } catch (error: unknown) {
    console.error("Chat API error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({
      text: "Παρουσιάστηκε τεχνικό σφάλμα. Δοκιμάστε ξανά."
    }, { status: 500 });
  }
}