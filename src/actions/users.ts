'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { USER_ROLES } from '@/lib/constants';

/**
 * Підвищує роль користувача до "student".
 * 
 * 🔐 SECURITY NOTE:
 * До впровадження Firebase Admin SDK, ця Server Action перевіряє callerUid
 * через Firestore. Це НЕ ідеальне рішення — callerUid приходить з клієнта.
 * 
 * Справжня безпека забезпечується через:
 * 1. Клієнтський Auth Guard (admin layout)
 * 2. Firestore Security Rules (повинні бути налаштовані у Firebase Console)
 * 
 * TODO: Використовувати Firebase Admin SDK для верифікації auth token на сервері.
 * 
 * @param uid - UID користувача, якого потрібно підвищити
 * @param callerUid - UID того хто викликає (з клієнта — НЕ надійний!)
 */
export async function upgradeUserToStudent(uid: string, callerUid: string) {
  try {
    // 🔐 Базова валідація вхідних даних
    if (!uid || typeof uid !== 'string' || uid.length < 5 || uid.length > 128) {
      return { success: false, error: 'Invalid user ID' };
    }

    if (!callerUid || typeof callerUid !== 'string' || callerUid.length < 5 || callerUid.length > 128) {
      return { success: false, error: 'Unauthorized: No caller UID provided' };
    }

    // 🔐 Prevent self-elevation
    if (uid === callerUid) {
      return { success: false, error: 'Cannot modify own role via this action' };
    }

    // Перевіряємо, що caller є адміністратором
    const callerRef = doc(db, 'users', callerUid);
    const callerSnap = await getDoc(callerRef);

    if (!callerSnap.exists()) {
      return { success: false, error: 'Unauthorized: Caller not found' };
    }

    const callerRole = callerSnap.data().role;
    if (callerRole !== USER_ROLES.ADMIN && callerRole !== USER_ROLES.EDITOR) {
      return { success: false, error: 'Unauthorized: Insufficient permissions' };
    }

    // 🔐 Перевіряємо, що target user існує перед оновленням
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return { success: false, error: 'Target user not found' };
    }

    // ✅ Caller має права — виконуємо оновлення
    await updateDoc(userRef, {
      role: 'student',
      isApproved: true
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating user:', error);
    return { success: false, error: 'Failed to update user' };
  }
}