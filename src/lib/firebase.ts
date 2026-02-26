import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// 👇 Вставте сюди ваші реальні ключі замість тексту в лапках
const firebaseConfig = {
  apiKey: "AIzaSyBfXMGHaXIBzz9D3Ar-H1iMliLWDfyeKwY", 
  authDomain: "politografisi.firebaseapp.com",
  projectId: "politografisi",
  storageBucket: "politografisi.firebasestorage.app",
  messagingSenderId: "934225612116",
  appId: "1:934225612116:web:64671f0955400d0d090cc1"
};

// Перевірка ключів (локалізовано грецькою)
if (firebaseConfig.apiKey.includes("ΤΟ_ΠΡΑΓΜΑΤΙΚΟ_ΣΑΣ")) {
  console.error("🔴 ΣΦΑΛΜΑ: Ξεχάσατε να εισάγετε τα πραγματικά κλειδιά στο src/lib/firebase.ts!");
}

// ✅ ВИПРАВЛЕНО: Додано 'export', щоб app був доступний у crm/page.tsx
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);