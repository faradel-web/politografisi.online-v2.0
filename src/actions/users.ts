"use server";

import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

export async function upgradeUserToStudent(uid: string) {
  try {
    // У новій версії Firebase (Modular SDK) ми робимо так:
    const userRef = doc(db, "users", uid);
    
    await updateDoc(userRef, {
      role: 'student', // Змінюємо роль на студента
      isApproved: true
    });
    
    return { success: true };
  } catch (error) {
    console.error("Error updating user:", error);
    return { success: false, error: "Failed to update user" };
  }
}