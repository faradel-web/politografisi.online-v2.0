"use client";

import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { 
  User as FirebaseUser, 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  signInWithEmailAndPassword 
} from "firebase/auth";
import { 
  doc, 
  onSnapshot, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  getDocs 
} from "firebase/firestore"; 
import { auth, db } from "@/lib/firebase"; 
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { USER_ROLES } from "@/lib/constants"; // Імпортуємо константи ролей

// Розширюємо стандартний тип User
export type ExtendedUser = FirebaseUser & {
  role?: string;
  subscriptionEndsAt?: any; // Timestamp або string
  phoneNumber?: string | null;
  displayName?: string | null;
  firstName?: string;
  lastName?: string;
};

interface AuthContextType {
  user: ExtendedUser | null;
  loading: boolean;
  isPremium: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmailOrPhone: (identifier: string, password: string) => Promise<void>; 
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // --- ЛОГІКА ПЕРЕВІРКИ ПРАВ (Just-in-Time Check) ---
  const isPremium = useMemo(() => {
    if (!user) return false;

    // 1. Адміни та Редактори завжди мають доступ
    if (user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.EDITOR) {
      return true;
    }

    // 2. Перевірка Студента
    if (user.role === USER_ROLES.STUDENT) {
      // Якщо дати немає — вважаємо, що підписка неактивна
      if (!user.subscriptionEndsAt) return false;

      const now = new Date();
      let endDate: Date;

      // Обробка Timestamp з Firestore
      if (typeof user.subscriptionEndsAt.toDate === 'function') {
        endDate = user.subscriptionEndsAt.toDate();
      } else {
        // Якщо це рядок або число
        endDate = new Date(user.subscriptionEndsAt);
      }

      // Доступ є, якщо дата закінчення ще не настала
      return endDate > now;
    }

    // 3. Для Guest та всіх інших — доступу немає
    return false;
  }, [user]);

  useEffect(() => {
    // 1. Слухаємо зміни стану авторизації (Είσοδος/Έξοδος)
    const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
      if (authUser) {
        const userDocRef = doc(db, "users", authUser.uid);

        // onSnapshot слухає зміни ролі/даних у реальному часі
        const unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const dbData = docSnap.data();
            
            const mergedUser: ExtendedUser = {
              ...authUser,
              role: dbData.role || "guest", 
              subscriptionEndsAt: dbData.subscriptionEndsAt,
              phoneNumber: dbData.phoneNumber || null,
              displayName: dbData.displayName || authUser.displayName,
              firstName: dbData.firstName,
              lastName: dbData.lastName
            };
            
            setUser(mergedUser);
          } else {
            setUser(authUser as ExtendedUser);
          }
          setLoading(false);
        }, (error) => {
          console.error("Firestore listener error:", error);
          setLoading(false);
        });

        return () => unsubscribeSnapshot();

      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // --- ЛОГІКА GOOGLE ---
  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        const fullName = user.displayName || "";
        const nameParts = fullName.split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";

        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          firstName: firstName,
          lastName: lastName,
          displayName: fullName,
          phoneNumber: null,
          role: "guest",
          createdAt: new Date().toISOString(),
          progress: {}
        });
      }
      
      router.push("/dashboard");
    } catch (error) {
      console.error("Login failed", error);
      throw error;
    }
  };

  // --- ЛОГІКА ВХОДУ (EMAIL або ТЕЛЕФОН) ---
  const loginWithEmailOrPhone = async (identifier: string, password: string) => {
    try {
      let emailToUse = identifier.trim(); // Видаляємо пробіли з країв

      // Якщо це НЕ email (немає @), вважаємо, що це телефон
      if (!identifier.includes("@")) {
        console.log("Είσοδος με τηλέφωνο. Εισήχθη:", identifier);
        
        // 1. Очистка номера (прибираємо всі пробіли всередині, наприклад "69 123" -> "69123")
        const cleanPhone = identifier.replace(/\s+/g, '');
        console.log("Αναζήτηση στη βάση δεδομένων με αριθμό:", cleanPhone);

        // 2. Шукаємо користувача
        const usersRef = collection(db, "users");
        // Важливо: у базі phoneNumber має бути збережений як рядок
        const q = query(usersRef, where("phoneNumber", "==", cleanPhone));
        
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          console.warn("Δεν βρέθηκε χρήστης με αυτό το τηλέφωνο.");
          throw new Error("Ο αριθμός τηλεφώνου δεν βρέθηκε");
        }

        // 3. Беремо email знайденого користувача
        const userData = querySnapshot.docs[0].data();
        
        if (!userData.email) {
            console.error("Ο χρήστης βρέθηκε, αλλά λείπει το πεδίο email.");
            throw new Error("Δεν υπάρχει email συνδεδεμένο με αυτό το τηλέφωνο.");
        }

        emailToUse = userData.email;
        console.log("Βρέθηκε email:", emailToUse);
      }

      // 4. Стандартний вхід Firebase (Email + Password)
      await signInWithEmailAndPassword(auth, emailToUse, password);
      router.push("/dashboard");

    } catch (error: any) {
      console.error("Login with Phone/Email failed:", error);
      
      // Додаткова діагностика для помилки прав доступу (Firestore Rules)
      if (error.code === 'permission-denied' || error.message.includes('Missing or insufficient permissions')) {
          console.error("ΠΡΟΣΟΧΗ: Σφάλμα δικαιωμάτων πρόσβασης. Πρέπει να επιτραπεί 'read' για τη συλλογή 'users' στο Firebase Console.");
      }
      
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      router.push("/"); 
    } catch (error) {
      console.error("Logout error", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isPremium, loginWithGoogle, loginWithEmailOrPhone, logout }}>
      {!loading ? children : (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
           <Loader2 className="h-10 w-10 animate-spin text-blue-600"/>
        </div>
      )}
    </AuthContext.Provider>
  );
}

// Хук для використання в компонентах
export const useAuth = () => useContext(AuthContext);