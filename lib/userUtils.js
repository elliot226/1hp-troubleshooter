// lib/userUtils.js
import { getDoc, doc } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Checks if a user has pro status based on their subscription information
 * @param {Object} userData - User data from Firestore
 * @returns {Boolean} - True if user has pro status, false otherwise
 */
export function isProUser(userData) {
  if (!userData) return false;
  
  // Check for subscription object
  if (!userData.subscription) return false;
  
  // Check subscription status
  const { status, expiresAt, tier } = userData.subscription;
  
  // Valid status is 'active'
  if (status !== 'active') return false;
  
  // Check expiration date if available
  if (expiresAt) {
    const expiry = typeof expiresAt === 'string' 
      ? new Date(expiresAt) 
      : expiresAt.toDate ? expiresAt.toDate() : new Date(expiresAt);
    
    if (expiry < new Date()) return false;
  }
  
  // Check tier - 'free' tier is not pro
  if (tier === 'free') return false;
  
  // If we've passed all checks, user is a pro
  return true;
}

/**
 * Returns user's subscription tier
 * @param {Object} userData - User data from Firestore
 * @returns {String} - Subscription tier ('free', 'monthly', 'annual', etc.)
 */
export function getUserTier(userData) {
  if (!userData || !userData.subscription) return 'free';
  return userData.subscription.tier || 'free';
}

/**
 * Checks if a specific feature is available to the user
 * @param {Object} userData - User data from Firestore
 * @param {String} feature - Feature to check
 * @returns {Boolean} - True if feature is available, false otherwise
 */
export function hasFeatureAccess(userData, feature) {
  // Define which features are available to which subscription tiers
  const featureMap = {
    tracking: ['weekly', 'monthly', 'annual'],
    multiplePrograms: ['monthly', 'annual'],
    loadManagement: ['weekly', 'monthly', 'annual'],
    expertConsults: ['annual'],
    exerciseLibrary: ['weekly', 'monthly', 'annual'],
    progressStats: ['weekly', 'monthly', 'annual']
  };
  
  if (!userData || !userData.subscription) return false;
  
  // Free users have access to basic features only
  if (userData.subscription.tier === 'free') {
    return ['basicExercises'].includes(feature);
  }
  
  // If feature is not defined in the map, default to false
  if (!featureMap[feature]) return false;
  
  // Check if user's tier has access to this feature
  return featureMap[feature].includes(userData.subscription.tier);
}

/**
 * Check if a user has completed the assessment
 * @param {string} userId - The user's ID
 * @returns {Promise<boolean>} - True if assessment is completed
 */
export async function hasCompletedAssessment(userId) {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      
      // Check for explicit completion flag first
      if (userData.assessmentCompleted) {
        return true;
      }
      
      // Otherwise, check all required steps
      const isComplete = (
        userData.userDetailsCompleted &&
        userData.medicalScreeningCompleted &&
        userData.outcomeMeasureCompleted &&
        userData.painRegionsCompleted &&
        userData.nerveSymptomsCompleted &&
        userData.mobilityTestCompleted &&
        userData.enduranceTestCompleted &&
        userData.nerveMobilityTestCompleted
      );
      
      return isComplete;
    }
    
    return false;
  } catch (error) {
    console.error("Error checking assessment completion:", error);
    return false; // Default to not completed on error
  }
}

/**
 * Find the first incomplete assessment step
 * @param {string} userId - The user's ID
 * @returns {Promise<string>} - Path to the first incomplete step
 */
export async function findFirstIncompleteStep(userId) {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      
      if (!userData.userDetailsCompleted) return '/user-details';
      if (!userData.medicalScreeningCompleted) return '/medical-screen';
      if (!userData.outcomeMeasureCompleted) return '/outcome-measure';
      if (!userData.painRegionsCompleted) return '/pain-region';
      if (!userData.nerveSymptomsCompleted) return '/nerve-symptoms';
      if (!userData.mobilityTestCompleted) return '/mobility-test';
      if (!userData.enduranceTestCompleted) return '/endurance-test';
      if (!userData.nerveMobilityTestCompleted) return '/nerve-mobility-test';
      
      // All steps completed
      return '/dashboard';
    }
    
    // If no user document, start at the beginning
    return '/user-details';
  } catch (error) {
    console.error("Error finding incomplete step:", error);
    return '/user-details'; // Default to first step on error
  }
}