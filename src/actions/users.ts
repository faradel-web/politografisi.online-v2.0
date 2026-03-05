"use server";

import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { USER_ROLES } from "@/lib/constants";

/**
 * Підвищує роль користувача до "student".
 * БЕЗПЕКА: Перевіряє, що виклик здійснюється адміністратором.
 * 
 * @param uid - UID користувача, якого потрібно підвищити
 * @param callerUid - UID користувача, який викликає цю дію (адміністратор)
 */
export async function upgradeUserToStudent(uid: string, callerUid: string) {
  try {
    // 🔐 SECURITY: Перевіряємо, що caller є адміністратором
    if (!callerUid) {
      return { success: false, error: "Unauthorized: No caller UID provided" };
    }

    const callerRef = doc(db, "users", callerUid);
    const callerSnap = await getDoc(callerRef);

    if (!callerSnap.exists()) {
      return { success: false, error: "Unauthorized: Caller not found" };
    }

    const callerRole = callerSnap.data().role;
    if (callerRole !== USER_ROLES.ADMIN && callerRole !== USER_ROLES.EDITOR) {
      return { success: false, error: "Unauthorized: Insufficient permissions" };
    }

    // ✅ Caller має права — виконуємо оновлення
    const userRef = doc(db, "users", uid);

    await updateDoc(userRef, {
      role: 'student',
      isApproved: true
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating user:", error);
    return { success: false, error: "Failed to update user" };
  }
}