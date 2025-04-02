// lib/exercisePrescriptionUtils.js
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from './firebase';
import { exerciseLibrary, painRegionToTestMapping } from './exerciseData';

/**
 * Maps an exercise ID to the appropriate endurance test ID
 * @param {String} exerciseId - The exercise ID
 * @returns {String} - The corresponding test ID
 */
export function getTestIdForExercise(exerciseId) {
  const id = exerciseId.toLowerCase();
  
  if (id.includes('wristflex')) return 'wristFlexorsTest';
  if (id.includes('wristext')) return 'wristExtensorsTest';
  if (id.includes('thumbflex')) return 'thumbFlexorsTest';
  if (id.includes('thumbext')) return 'thumbExtensorsTest';
  if (id.includes('radialdev')) return 'wristExtensorsTest';
  if (id.includes('ulnardev')) return 'wristExtensorsTest';
  if (id.includes('fingerext')) return 'wristExtensorsTest';
  
  // Special cases for other exercises
  if (id.includes('tennis') || id.includes('ball') || id.includes('squeeze')) {
    return 'wristFlexorsTest';
  }
  
  if (id.includes('isometric')) {
    if (id.includes('flex')) return 'wristFlexorsTest';
    if (id.includes('ext')) return 'wristExtensorsTest';
  }
  
  // Default fallback
  return 'wristFlexorsTest';
}

/**
 * Determines if an exercise needs special weight calculation
 * @param {String} exerciseId - The exercise ID
 * @returns {Boolean} - True if exercise needs special calculation
 */
export function isSpecialExercise(exerciseId) {
  const id = exerciseId.toLowerCase();
  return id.includes('radialdeviation') || 
         id.includes('ulnardeviation') || 
         (id.includes('finger') && id.includes('extension'));
}

/**
 * Gets the exercise prescription for a specific exercise
 * @param {String} userId - The user ID
 * @param {String} exerciseId - The exercise ID
 * @returns {Promise<Object>} - The prescription data
 */
export async function getExercisePrescription(userId, exerciseId) {
  try {
    const docRef = doc(db, "users", userId, "exercisePrescriptions", exerciseId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    }
    
    // Return default values if no prescription exists
    return {
      exerciseId,
      currentWeight: 4,
      targetRepMin: 15,
      targetRepMax: 20,
      trackingInstances: [],
      consecCompletions: 0,
      scalingEligible: false
    };
  } catch (error) {
    console.error("Error getting exercise prescription:", error);
    throw error;
  }
}

/**
 * Initializes an exercise prescription based on endurance test results
 * @param {String} userId - The user ID
 * @param {String} exerciseId - The exercise ID
 * @param {Object} enduranceTestResults - The endurance test results
 * @returns {Promise<Object>} - The created prescription
 */
export async function initializeExercisePrescription(userId, exerciseId, enduranceTestResults) {
  try {
    // Get the appropriate test ID for this exercise
    const testId = getTestIdForExercise(exerciseId);
    
    // Calculate initial weight from thirtyRM
    let weight = 4; // Default fallback
    if (enduranceTestResults?.thirtyRM?.[testId]) {
      // Round down to nearest whole number
      weight = Math.floor(enduranceTestResults.thirtyRM[testId]);
    }
    
    // Special case handling for specific exercises
    if (isSpecialExercise(exerciseId)) {
      weight = weight * 2; // Double weight for radial/ulnar deviation, finger extension
    }
    
    // Ensure minimum weight
    weight = Math.max(weight, 1);
    
    // Create and store prescription
    const prescription = {
      exerciseId,
      currentWeight: weight,
      initialWeight: weight,
      targetRepMin: 15,
      targetRepMax: 20,
      lastScaledDate: new Date().toISOString().split('T')[0],
      scalingHistory: [{
        date: new Date().toISOString().split('T')[0],
        event: "INITIAL",
        weight,
        repRangeMin: 15,
        repRangeMax: 20
      }],
      trackingInstances: [],
      consecCompletions: 0,
      scalingEligible: false
    };
    
    // Save to Firestore
    await setDoc(doc(db, "users", userId, "exercisePrescriptions", exerciseId), prescription);
    
    return prescription;
  } catch (error) {
    console.error("Error initializing exercise prescription:", error);
    throw error;
  }
}

/**
 * Initialize all exercises based on endurance test results
 * @param {String} userId - The user ID
 * @param {Object} enduranceTestResults - The endurance test results
 * @returns {Promise<Boolean>} - True if successful
 */
export async function initializeAllExercisePrescriptions(userId, enduranceTestResults) {
  try {
    // Get all unique exercise IDs from the library
    const exerciseIds = new Set();
    
    Object.values(exerciseLibrary).forEach(exercises => {
      exercises.forEach(exercise => {
        exerciseIds.add(exercise.id);
      });
    });
    
    // Initialize each exercise
    const promises = [];
    for (const exerciseId of exerciseIds) {
      promises.push(initializeExercisePrescription(userId, exerciseId, enduranceTestResults));
    }
    
    await Promise.all(promises);
    
    console.log("Initialized all exercise prescriptions successfully");
    return true;
  } catch (error) {
    console.error("Error initializing all exercise prescriptions:", error);
    throw error;
  }
}

/**
 * Update tracking data for an exercise
 * @param {String} userId - The user ID
 * @param {String} exerciseId - The exercise ID
 * @param {Object} trackingData - The tracking data
 * @param {Date|String} [trackingDate] - Optional date for tracking (defaults to today)
 * @returns {Promise<Object>} - The updated prescription
 */
export async function updateExerciseTracking(userId, exerciseId, trackingData, trackingDate) {
  try {
    const { completed, repsPerformed, painLevel, timeOfDay } = trackingData;
    
    // Format the tracking date as ISO string (YYYY-MM-DD)
    let formattedDate;
    if (trackingDate) {
      // Convert to Date object if it's a string
      const dateObj = typeof trackingDate === 'string' ? new Date(trackingDate) : trackingDate;
      formattedDate = dateObj.toISOString().split('T')[0];
    } else {
      formattedDate = new Date().toISOString().split('T')[0];
    }
    
    // Get current prescription
    const prescription = await getExercisePrescription(userId, exerciseId);
    
    // Create tracking instance
    const newInstance = {
      date: formattedDate,
      timeOfDay,
      completed,
      repsPerformed: completed && repsPerformed ? parseInt(repsPerformed, 10) || 0 : null,
      painLevel: completed && painLevel !== undefined ? parseInt(painLevel, 10) || 0 : null,
      weight: prescription.currentWeight
    };
    
    // Find if there's an existing instance for this date and time of day
    const trackingInstances = [...(prescription.trackingInstances || [])];
    const existingIndex = trackingInstances.findIndex(
      instance => instance.date === formattedDate && instance.timeOfDay === timeOfDay
    );
    
    // Update existing or add new instance
    if (existingIndex >= 0) {
      trackingInstances[existingIndex] = newInstance;
    } else {
      trackingInstances.push(newInstance);
    }
    
    // Count consecutive completions
    let consecCompletions = (prescription.consecCompletions || 0);
    if (completed) {
      consecCompletions += 1;
    }
    
    // Check if eligible for scaling (after 3 days or 6 completions)
    const scalingEligible = consecCompletions >= 6;
    
    // Update Firestore
    await updateDoc(
      doc(db, "users", userId, "exercisePrescriptions", exerciseId), 
      {
        trackingInstances,
        consecCompletions,
        scalingEligible
      }
    );
    
    // Emergency scaling for extreme pain
    if (painLevel && painLevel >= 7) {
      return evaluateExerciseProgression(userId, exerciseId);
    }
    
    // If eligible for scaling, evaluate progression
    if (scalingEligible) {
      return evaluateExerciseProgression(userId, exerciseId);
    }
    
    return {...prescription, trackingInstances, consecCompletions, scalingEligible};
  } catch (error) {
    console.error("Error updating exercise tracking:", error);
    throw error;
  }
}

/**
 * Get exercise tracking instances for a specific date
 * @param {String} userId - The user ID
 * @param {Date|String} trackingDate - Date to get tracking data for
 * @returns {Promise<Object>} - Exercise tracking data by exercise ID
 */
export async function getExerciseTrackingForDate(userId, trackingDate) {
  try {
    // Format date as ISO string (YYYY-MM-DD)
    const formattedDate = typeof trackingDate === 'string' 
      ? trackingDate 
      : trackingDate.toISOString().split('T')[0];
    
    // Get all exercise prescriptions
    const prescriptionsRef = collection(db, "users", userId, "exercisePrescriptions");
    const prescriptionsSnapshot = await getDocs(prescriptionsRef);
    
    const trackingData = {};
    
    // Process each prescription
    prescriptionsSnapshot.forEach(doc => {
      const prescription = doc.data();
      const exerciseId = doc.id;
      
      // Find tracking instances for the requested date
      const instances = (prescription.trackingInstances || []).filter(
        instance => instance.date === formattedDate
      );
      
      if (instances.length > 0) {
        trackingData[exerciseId] = instances;
      }
    });
    
    return trackingData;
  } catch (error) {
    console.error("Error getting exercise tracking for date:", error);
    throw error;
  }
}

/**
 * Evaluate exercise progression and update prescription if needed
 * @param {String} userId - The user ID
 * @param {String} exerciseId - The exercise ID
 * @param {Number|null} irritabilityIndex - Optional irritability index
 * @returns {Promise<Object>} - The updated prescription
 */
export async function evaluateExerciseProgression(userId, exerciseId, irritabilityIndex = null) {
  try {
    // Get prescription from Firestore
    const prescription = await getExercisePrescription(userId, exerciseId);
    
    // Get recent tracking instances
    const recentInstances = (prescription.trackingInstances || [])
      .filter(instance => instance.completed)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 6);
    
    if (recentInstances.length === 0) return prescription;
    
    // Calculate metrics
    const avgReps = recentInstances.reduce((sum, i) => sum + (i.repsPerformed || 0), 0) / recentInstances.length;
    const maxPain = Math.max(...recentInstances.map(i => i.painLevel || 0));
    
    // Try to get the user's irritability index if not provided
    if (irritabilityIndex === null) {
      try {
        irritabilityIndex = await getUserIrritabilityIndex(userId);
      } catch (error) {
        console.error("Error getting irritability index:", error);
        irritabilityIndex = null;
      }
    }
    
    let scalingEvent;
    
    // Apply progression logic based on scenario
    if (irritabilityIndex !== null) {
      // Scenario 2: Use irritability index
      scalingEvent = applyIrritabilityBasedScaling(
        avgReps, maxPain, irritabilityIndex,
        prescription.currentWeight, prescription.targetRepMin, prescription.targetRepMax
      );
    } else {
      // Scenario 1: Basic tracking
      scalingEvent = applyTrackingBasedScaling(
        avgReps, maxPain,
        prescription.currentWeight, prescription.targetRepMin, prescription.targetRepMax
      );
    }
    
    // Update prescription if scaling occurred
    if (scalingEvent) {
      const updates = {
        currentWeight: scalingEvent.weight,
        targetRepMin: scalingEvent.repRangeMin,
        targetRepMax: scalingEvent.repRangeMax,
        lastScaledDate: new Date().toISOString().split('T')[0],
        scalingHistory: [...(prescription.scalingHistory || []), {
          ...scalingEvent,
          date: new Date().toISOString().split('T')[0]
        }],
        consecCompletions: 0,
        scalingEligible: false
      };
      
      await updateDoc(doc(db, "users", userId, "exercisePrescriptions", exerciseId), updates);
      return {...prescription, ...updates};
    }
    
    // Reset consecCompletions counter after evaluation
    await updateDoc(doc(db, "users", userId, "exercisePrescriptions", exerciseId), {
      consecCompletions: 0,
      scalingEligible: false
    });
    
    return {...prescription, consecCompletions: 0, scalingEligible: false};
  } catch (error) {
    console.error("Error evaluating exercise progression:", error);
    throw error;
  }
}

/**
 * Apply scaling logic based on tracking data only
 * @param {Number} avgReps - Average reps performed
 * @param {Number} maxPain - Maximum pain level
 * @param {Number} currentWeight - Current weight in lbs
 * @param {Number} targetRepMin - Current minimum target reps
 * @param {Number} targetRepMax - Current maximum target reps
 * @returns {Object|null} - Scaling event or null if no changes
 */
function applyTrackingBasedScaling(avgReps, maxPain, currentWeight, targetRepMin, targetRepMax) {
  // Initialize with current values
  let newWeight = currentWeight;
  let newRepMin = targetRepMin;
  let newRepMax = targetRepMax;
  let event = null;
  
  // If reps ≥ 45, increase weight
  if (avgReps >= 45) {
    newWeight = currentWeight + 2;
    newRepMin = 15;
    newRepMax = 20;
    event = "WEIGHT_INCREASE";
  }
  // If reps in target range, adjust based on pain
  else if (avgReps >= targetRepMin && avgReps <= targetRepMax) {
    if (maxPain <= 2) {
      // Increase rep range for low pain
      newRepMin = targetRepMin + 5;
      newRepMax = targetRepMax + 5;
      event = "REP_INCREASE_LOW_PAIN";
    } 
    else if (maxPain >= 5 && maxPain <= 6) {
      // Reduce rep range for moderate pain
      newRepMin = Math.max(10, targetRepMin - 5);
      newRepMax = Math.max(15, targetRepMax - 5);
      event = "REP_DECREASE_MODERATE_PAIN";
    }
    else if (maxPain >= 7) {
      // Reduce weight and rep range for high pain
      newWeight = Math.max(1, currentWeight - 2);
      newRepMin = Math.max(10, targetRepMin - 5);
      newRepMax = Math.max(15, targetRepMax - 5);
      event = "WEIGHT_DECREASE_HIGH_PAIN";
    }
    // For pain 3-4, keep the same range (no event)
  }
  // If reps < target range and no pain, slightly decrease rep goal
  else if (avgReps < targetRepMin && maxPain === 0) {
    newRepMin = Math.max(10, targetRepMin - 2);
    newRepMax = Math.max(15, targetRepMax - 2);
    event = "REP_SLIGHT_DECREASE_FATIGUE";
  }
  
  // Return scaling event if changes were made
  if (event) {
    return {
      event,
      weight: newWeight,
      repRangeMin: newRepMin,
      repRangeMax: newRepMax
    };
  }
  
  return null; // No changes
}

/**
 * Apply scaling logic based on irritability index
 * @param {Number} avgReps - Average reps performed
 * @param {Number} maxPain - Maximum pain level
 * @param {Number} irritabilityIndex - Irritability index (0-20)
 * @param {Number} currentWeight - Current weight in lbs
 * @param {Number} targetRepMin - Current minimum target reps
 * @param {Number} targetRepMax - Current maximum target reps
 * @returns {Object|null} - Scaling event or null if no changes
 */
function applyIrritabilityBasedScaling(avgReps, maxPain, irritabilityIndex, currentWeight, targetRepMin, targetRepMax) {
  let newWeight = currentWeight;
  let newRepMin = targetRepMin;
  let newRepMax = targetRepMax;
  let event = null;
  
  // Normal Progression (Index < 5)
  if (irritabilityIndex < 5) {
    if (avgReps >= 45) {
      newWeight = currentWeight + 2;
      newRepMin = 15;
      newRepMax = 20;
      event = "WEIGHT_INCREASE_NORMAL";
    }
    else if (avgReps >= targetRepMax) {
      newRepMin = targetRepMin + 5;
      newRepMax = targetRepMax + 5;
      event = "REP_INCREASE_NORMAL";
    }
  }
  // Mild-Moderate (Index 5-9)
  else if (irritabilityIndex >= 5 && irritabilityIndex <= 9) {
    if (avgReps >= 50) { // Higher threshold for weight increase
      newWeight = currentWeight + 2;
      newRepMin = 15;
      newRepMax = 20;
      event = "WEIGHT_INCREASE_MILD_MOD";
    }
    else if (avgReps >= targetRepMax) {
      newRepMin = targetRepMin + 3; // Smaller rep increase
      newRepMax = targetRepMax + 3;
      event = "REP_INCREASE_MILD_MOD";
    }
  }
  // Moderate (Index 10-14)
  else if (irritabilityIndex >= 10 && irritabilityIndex <= 14) {
    if (maxPain >= 5) {
      newRepMin = Math.max(10, targetRepMin - 10);
      newRepMax = Math.max(15, targetRepMax - 10);
      event = "REP_DECREASE_MODERATE";
    }
  }
  // Moderate-Severe (Index 15-19)
  else if (irritabilityIndex >= 15 && irritabilityIndex <= 19) {
    if (maxPain >= 5) {
      newWeight = Math.max(1, currentWeight - 2);
      event = "WEIGHT_DECREASE_MOD_SEVERE";
    }
    // Lower rep targets regardless of pain
    newRepMin = Math.max(10, targetRepMin - 5);
    newRepMax = Math.max(15, targetRepMax - 5);
    event = event || "REP_DECREASE_MOD_SEVERE";
  }
  // Severe (Index >= 20)
  else if (irritabilityIndex >= 20) {
    // Cut rep range in half
    newRepMin = Math.max(5, Math.floor(targetRepMin / 2));
    newRepMax = Math.max(10, Math.floor(targetRepMax / 2));
    event = "REP_HALVE_SEVERE";
  }
  
  if (event) {
    return {
      event,
      weight: newWeight,
      repRangeMin: newRepMin,
      repRangeMax: newRepMax
    };
  }
  
  return null;
}

/**
 * Fetch user's irritability index from load management data
 * @param {String} userId - The user ID
 * @returns {Promise<Number|null>} - Irritability index or null
 */
export async function getUserIrritabilityIndex(userId) {
  try {
    // Get latest load management data
    const loadManagementRef = collection(db, "users", userId, "loadManagement");
    const q = query(loadManagementRef, orderBy("date", "desc"), limit(1));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }
    
    const loadData = snapshot.docs[0].data();
    
    // Return irritability index if it exists
    if (loadData.irritabilityIndex !== undefined) {
      return loadData.irritabilityIndex;
    }
    
    // Otherwise calculate it
    if (typeof calculateIrritabilityIndex === 'function') {
      return calculateIrritabilityIndex(loadData);
    }
    
    return null;
  } catch (error) {
    console.error("Error getting irritability index:", error);
    return null;
  }
}

/**
 * Get all exercise prescriptions for a user
 * @param {String} userId - The user ID
 * @returns {Promise<Object>} - Object with exercise IDs as keys and prescriptions as values
 */
export async function getAllExercisePrescriptions(userId) {
  try {
    const prescriptionsRef = collection(db, "users", userId, "exercisePrescriptions");
    const snapshot = await getDocs(prescriptionsRef);
    
    const prescriptions = {};
    
    snapshot.forEach(doc => {
      prescriptions[doc.id] = doc.data();
    });
    
    return prescriptions;
  } catch (error) {
    console.error("Error getting all exercise prescriptions:", error);
    throw error;
  }
}

/**
 * Get prescription stats for a specific exercise
 * @param {String} userId - The user ID
 * @param {String} exerciseId - The exercise ID
 * @returns {Promise<Object>} - Exercise statistics
 */
export async function getExercisePrescriptionStats(userId, exerciseId) {
  try {
    const prescription = await getExercisePrescription(userId, exerciseId);
    
    // If no tracking instances, return basic stats
    if (!prescription.trackingInstances || prescription.trackingInstances.length === 0) {
      return {
        exerciseId,
        currentWeight: prescription.currentWeight,
        targetRepRange: `${prescription.targetRepMin}-${prescription.targetRepMax}`,
        initialWeight: prescription.initialWeight,
        lastScaledDate: prescription.lastScaledDate,
        totalCompletions: 0,
        avgReps: 0,
        maxReps: 0,
        avgPain: 0,
        maxPain: 0
      };
    }
    
    // Calculate stats from tracking instances
    const completedInstances = prescription.trackingInstances.filter(i => i.completed);
    const reps = completedInstances.map(i => i.repsPerformed || 0);
    const painLevels = completedInstances.map(i => i.painLevel || 0);
    
    const avgReps = reps.length > 0 ? reps.reduce((a, b) => a + b, 0) / reps.length : 0;
    const maxReps = reps.length > 0 ? Math.max(...reps) : 0;
    const avgPain = painLevels.length > 0 ? painLevels.reduce((a, b) => a + b, 0) / painLevels.length : 0;
    const maxPain = painLevels.length > 0 ? Math.max(...painLevels) : 0;
    
    return {
      exerciseId,
      currentWeight: prescription.currentWeight,
      targetRepRange: `${prescription.targetRepMin}-${prescription.targetRepMax}`,
      initialWeight: prescription.initialWeight,
      lastScaledDate: prescription.lastScaledDate,
      totalCompletions: completedInstances.length,
      avgReps: Math.round(avgReps * 10) / 10,
      maxReps,
      avgPain: Math.round(avgPain * 10) / 10,
      maxPain,
      progressPercentage: prescription.initialWeight > 0 
        ? Math.round((prescription.currentWeight / prescription.initialWeight - 1) * 100) 
        : 0
    };
  } catch (error) {
    console.error("Error getting exercise prescription stats:", error);
    throw error;
  }
}