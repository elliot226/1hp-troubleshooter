// lib/loadManagementUtils.js
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs 
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Calculate irritability index from load management data
 * @param {Object} loadManagementData - Load management survey data
 * @returns {Number|null} - Irritability index (0-30) or null
 */
export function calculateIrritabilityIndex(loadManagementData) {
  if (!loadManagementData) return null;
  
  // Calculate individual activity scores
  const allActivities = [
    ...(loadManagementData.workActivities || []),
    ...(loadManagementData.hobbyActivities || [])
  ];
  
  // Get all activity scores
  const activityScores = allActivities
    .filter(activity => activity.name && activity.name.trim() !== '')
    .map(activity => {
      // Use existing activity score if available
      if (activity.activityScore !== undefined && activity.activityScore > 0) {
        return activity.activityScore;
      }
      
      // Calculate ActivityScore = P_aggr × (T_recovery / (T_inc + ε))
      // Where ε is 1 to avoid division by zero
      const painLevel = activity.painLevel || 0;
      const recoveryTime = activity.recoveryTime || 0;
      const timeToAggravation = activity.timeToAggravation || 1;
      
      return painLevel * (recoveryTime / (timeToAggravation + 1));
    });
  
  // Rest pain level
  const restPain = loadManagementData.painAtRest 
    ? loadManagementData.painLevelAtRest || 0 
    : 0;
  
  // If no valid activities, score is just the rest pain level
  if (activityScores.length === 0) {
    return restPain;
  }
  
  // Get max activity score
  const maxActivityScore = Math.max(...activityScores);
  
  // Calculate irritability index: IrritabilityIndex = P_rest + max({ActivityScore_i})
  const irritabilityIndex = restPain + maxActivityScore;
  
  // Ensure index is within reasonable bounds (0-30)
  return Math.min(Math.max(0, irritabilityIndex), 30);
}

/**
 * Store load management survey data
 * @param {String} userId - The user ID
 * @param {Object} loadData - Load management survey data
 * @returns {Promise<String>} - ID of the created document
 */
export async function storeLoadManagement(userId, loadData) {
  try {
    // Calculate irritability index if not already done
    if (loadData.irritabilityIndex === undefined) {
      loadData.irritabilityIndex = calculateIrritabilityIndex(loadData);
    }
    
    // Add timestamp if not provided
    if (!loadData.date) {
      loadData.date = new Date();
    }
    
    // Add to loadManagement subcollection
    const docRef = await addDoc(collection(db, "users", userId, "loadManagement"), loadData);
    
    // Update the user document
    await updateDoc(doc(db, "users", userId), {
      loadManagementSurveyCompleted: true,
      lastLoadManagementDate: loadData.date,
      currentIrritabilityIndex: loadData.irritabilityIndex
    });
    
    return docRef.id;
  } catch (error) {
    console.error("Error storing load management data:", error);
    throw error;
  }
}

/**
 * Get the latest load management data
 * @param {String} userId - The user ID
 * @returns {Promise<Object|null>} - Latest load management data or null
 */
export async function getLatestLoadManagement(userId) {
  try {
    const q = query(
      collection(db, "users", userId, "loadManagement"),
      orderBy("date", "desc"),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }
    
    return {
      id: snapshot.docs[0].id,
      ...snapshot.docs[0].data()
    };
  } catch (error) {
    console.error("Error getting latest load management data:", error);
    return null;
  }
}

/**
 * Get load management history
 * @param {String} userId - The user ID
 * @param {Number} limitCount - Maximum number of records to return
 * @returns {Promise<Array>} - Load management history
 */
export async function getLoadManagementHistory(userId, limitCount = 10) {
  try {
    const q = query(
      collection(db, "users", userId, "loadManagement"),
      orderBy("date", "desc"),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    const history = [];
    
    snapshot.forEach(doc => {
      history.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return history;
  } catch (error) {
    console.error("Error getting load management history:", error);
    throw error;
  }
}

/**
 * Get the user's current irritability index
 * @param {String} userId - The user ID
 * @returns {Promise<Number|null>} - Current irritability index or null
 */
export async function getCurrentIrritabilityIndex(userId) {
  try {
    // First try to get from user document
    const userDoc = await getDoc(doc(db, "users", userId));
    
    if (userDoc.exists() && userDoc.data().currentIrritabilityIndex !== undefined) {
      return userDoc.data().currentIrritabilityIndex;
    }
    
    // If not in user document, get latest load management data
    const latestData = await getLatestLoadManagement(userId);
    
    if (latestData && latestData.irritabilityIndex !== undefined) {
      return latestData.irritabilityIndex;
    }
    
    return null;
  } catch (error) {
    console.error("Error getting current irritability index:", error);
    return null;
  }
}

/**
 * Calculate recommended activity times based on irritability index
 * @param {Number} irritabilityIndex - Irritability index (0-30)
 * @param {Array} activities - Array of activity objects
 * @returns {Object} - Recommended activity times in minutes
 */
export function calculateRecommendedActivityTimes(irritabilityIndex, activities) {
  const recommendations = {};
  
  // Map irritability index to load percentages
  let workPercentage = 0.75;
  let hobbyPercentage = 0.75;
  
  if (irritabilityIndex < 5) {
    // Mild
    workPercentage = 0.75;
    hobbyPercentage = 0.75;
  } else if (irritabilityIndex < 10) {
    // Mild/Moderate
    workPercentage = 0.75;
    hobbyPercentage = 0.5;
  } else if (irritabilityIndex < 15) {
    // Moderate
    workPercentage = 0.5;
    hobbyPercentage = 0.5;
  } else if (irritabilityIndex < 20) {
    // Moderate/Severe
    workPercentage = 0.5;
    hobbyPercentage = 0.25;
  } else {
    // Severe
    workPercentage = 0.25;
    hobbyPercentage = 0;
  }
  
  // Process each activity
  activities.forEach(activity => {
    if (!activity.name || !activity.normalDuration) return;
    
    const isWork = activity.type === 'work' || 
                  (activity.name && activity.name.toLowerCase().includes('work'));
    
    let recommendedTime = activity.normalDuration;
    
    // Apply percentage reduction based on activity type and irritability
    if (isWork) {
      recommendedTime *= workPercentage;
    } else {
      recommendedTime *= hobbyPercentage;
    }
    
    // Further reduce if time to aggravation is very low
    if (activity.timeToAggravation && activity.timeToAggravation < 15) {
      recommendedTime = Math.min(recommendedTime, activity.timeToAggravation);
    }
    
    // Round to nearest 5 minutes
    recommendedTime = Math.max(5, Math.round(recommendedTime / 5) * 5);
    
    recommendations[activity.name] = recommendedTime;
  });
  
  return recommendations;
}

/**
 * Store daily tracking data
 * @param {String} userId - The user ID
 * @param {Object} trackingData - Daily tracking data
 * @returns {Promise<String>} - ID of the created document
 */
export async function storeDailyTracking(userId, trackingData) {
  try {
    // Ensure date is a proper Date object
    if (!(trackingData.trackingDate instanceof Date)) {
      trackingData.trackingDate = new Date(trackingData.trackingDate || new Date());
    }
    
    // Add to dailyTracking subcollection
    const docRef = await addDoc(collection(db, "users", userId, "dailyTracking"), trackingData);
    
    return docRef.id;
  } catch (error) {
    console.error("Error storing daily tracking data:", error);
    throw error;
  }
}

/**
 * Get daily tracking history
 * @param {String} userId - The user ID
 * @param {Number} days - Number of days of history to retrieve
 * @returns {Promise<Array>} - Daily tracking history
 */
export async function getDailyTrackingHistory(userId, days = 7) {
  try {
    // Get date from X days ago
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const q = query(
      collection(db, "users", userId, "dailyTracking"),
      where("trackingDate", ">=", startDate),
      orderBy("trackingDate", "desc")
    );
    
    const snapshot = await getDocs(q);
    const history = [];
    
    snapshot.forEach(doc => {
      history.push({
        id: doc.id,
        ...doc.data(),
        trackingDate: doc.data().trackingDate?.toDate() || new Date()
      });
    });
    
    return history;
  } catch (error) {
    console.error("Error getting daily tracking history:", error);
    throw error;
  }
}