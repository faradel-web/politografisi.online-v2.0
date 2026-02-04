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

// Перевірка, чи ви вставили ключі
if (firebaseConfig.apiKey.includes("ВАШ_РЕАЛЬНИЙ")) {
  console.error("🔴 ПОМИЛКА: Ви забули вставити реальні ключі у src/lib/firebase.ts!");
}

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);