// lib/reminderUtils.js
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Check if a user is due for a QuickDASH assessment
 * @param {string} userId - The user's ID
 * @returns {Promise<boolean>} - True if assessment is due
 */
export async function isQuickDashDue(userId) {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    
    if (!userDoc.exists()) return false;
    
    const userData = userDoc.data();
    
    // If program not initialized, no QuickDASH needed
    if (!userData.exerciseProgramInitializedDate) return false;
    
    // Check if there's a next due date
    if (!userData.nextQuickDashDueDate) {
      // Calculate based on initialization date
      const initDate = userData.exerciseProgramInitializedDate.toDate();
      const nextDueDate = new Date(initDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      // Update in Firestore
      await updateDoc(doc(db, "users", userId), {
        nextQuickDashDueDate: nextDueDate
      });
      
      return new Date() >= nextDueDate;
    }
    
    // Check if current date is past the due date
    const nextDueDate = userData.nextQuickDashDueDate.toDate();
    return new Date() >= nextDueDate;
  } catch (error) {
    console.error("Error checking QuickDASH due status:", error);
    return false;
  }
}

/**
 * Mark that a reminder was shown to the user
 * @param {string} userId - The user's ID
 * @returns {Promise<void>}
 */
export async function markReminderShown(userId) {
  try {
    await updateDoc(doc(db, "users", userId), {
      lastQuickDashReminderDate: new Date()
    });
  } catch (error) {
    console.error("Error marking reminder as shown:", error);
  }
}

/**
 * Schedule the next QuickDASH assessment (7 days from now)
 * @param {string} userId - The user's ID
 * @returns {Promise<void>}
 */
export async function scheduleNextQuickDash(userId) {
  try {
    const nextDueDate = new Date();
    nextDueDate.setDate(nextDueDate.getDate() + 7);
    
    await updateDoc(doc(db, "users", userId), {
      nextQuickDashDueDate: nextDueDate
    });
  } catch (error) {
    console.error("Error scheduling next QuickDASH:", error);
  }
}