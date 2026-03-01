import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// 👇 Вставте сюди ваші реальні ключі замість тексту в лапках
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Перевірка ключів (локалізовано грецькою)
if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes("ΤΟ_ΠΡΑΓΜΑΤΙΚΟ_ΣΑΣ")) {
  console.error("🔴 ΣΦΑΛΜΑ: Ξεχάσατε να εισάγετε τα πραγματικά κλειδιά στο .env.local!");
}

// ✅ ВИПРАВЛЕНО: Додано 'export', щоб app був доступний у crm/page.tsx
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);