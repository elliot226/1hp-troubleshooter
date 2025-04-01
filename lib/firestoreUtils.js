// lib/firestoreUtils.js
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs,
  limit 
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Stores or updates user document with the provided data
 * @param {string} userId - The user's ID
 * @param {object} data - The data to store
 * @returns {Promise<void>}
 */
export async function storeUserData(userId, data) {
  await setDoc(doc(db, "users", userId), data, { merge: true });
}

/**
 * Fetches a user's data from Firestore
 * @param {string} userId - The user's ID
 * @returns {Promise<object|null>} - The user data or null if not found
 */
export async function getUserData(userId) {
  const docRef = doc(db, "users", userId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return docSnap.data();
  } else {
    return null;
  }
}

/**
 * Stores medical screening responses in the user's document
 * @param {string} userId - The user's ID
 * @param {object} responses - Medical screening question responses
 * @returns {Promise<void>}
 */
export async function storeMedicalScreening(userId, responses) {
  const userRef = doc(db, "users", userId);
  
  // Check if the document exists first
  const docSnap = await getDoc(userRef);
  
  if (docSnap.exists()) {
    // Document exists, use updateDoc
    await updateDoc(userRef, {
      medicalScreening: responses,
      medicalScreeningDate: new Date()
    });
  } else {
    // Document doesn't exist, create it with setDoc
    await setDoc(userRef, {
      medicalScreening: responses,
      medicalScreeningDate: new Date()
    });
  }
}

/**
 * Stores pain region assessment results
 * @param {string} userId - The user's ID
 * @param {Array|object} painRegions - Selected pain regions
 * @returns {Promise<void>}
 */
export async function storePainRegionAssessment(userId, painRegions) {
  const userRef = doc(db, "users", userId);
  
  // Check if the document exists first
  const docSnap = await getDoc(userRef);
  
  if (docSnap.exists()) {
    // Document exists, use updateDoc
    await updateDoc(userRef, {
      painRegions: painRegions,
      painRegionAssessmentDate: new Date()
    });
  } else {
    // Document doesn't exist, create it with setDoc
    await setDoc(userRef, {
      painRegions: painRegions,
      painRegionAssessmentDate: new Date()
    });
  }
}

/**
 * Stores QuickDASH outcome measure results
 * @param {string} userId - The user's ID
 * @param {object} quickDashData - QuickDASH assessment results
 * @returns {Promise<void>}
 */
export async function storeOutcomeMeasure(userId, quickDashData) {
  const userRef = doc(db, "users", userId);
  const docSnap = await getDoc(userRef);
  
  // Store in users collection for quick access
  if (docSnap.exists()) {
    await updateDoc(userRef, {
      latestQuickDashScore: quickDashData.score,
      latestQuickDashDate: new Date()
    });
  } else {
    await setDoc(userRef, {
      latestQuickDashScore: quickDashData.score,
      latestQuickDashDate: new Date()
    });
  }
  
  // Also store in a separate collection for history tracking
  await addDoc(collection(db, "users", userId, "outcomeMeasures"), {
    ...quickDashData,
    date: new Date()
  });
}

/**
 * Stores selected nerve symptoms
 * @param {string} userId - The user's ID
 * @param {Array} nerveSymptoms - Selected nerve symptoms
 * @returns {Promise<void>}
 */
export async function storeNerveSymptoms(userId, nerveSymptoms) {
  const userRef = doc(db, "users", userId);
  const docSnap = await getDoc(userRef);
  
  if (docSnap.exists()) {
    await updateDoc(userRef, {
      nerveSymptoms: nerveSymptoms,
      nerveSymptomsDate: new Date()
    });
  } else {
    await setDoc(userRef, {
      nerveSymptoms: nerveSymptoms,
      nerveSymptomsDate: new Date()
    });
  }
}

/**
 * Stores nerve mobility test results
 * @param {string} userId - The user's ID
 * @param {object} testResults - Nerve mobility test results
 * @returns {Promise<void>}
 */
export async function storeNerveMobilityTest(userId, testResults) {
  const userRef = doc(db, "users", userId);
  const docSnap = await getDoc(userRef);
  
  if (docSnap.exists()) {
    await updateDoc(userRef, {
      nerveMobilityTest: testResults,
      nerveMobilityTestDate: new Date()
    });
  } else {
    await setDoc(userRef, {
      nerveMobilityTest: testResults,
      nerveMobilityTestDate: new Date()
    });
  }
  
  // Also store in a subcollection to keep history of tests
  await addDoc(collection(db, "users", userId, "nerveMobilityTests"), {
    ...testResults,
    date: new Date()
  });
}

/**
 * Stores endurance test results
 * @param {string} userId - The user's ID
 * @param {object} testResults - Endurance test results
 * @returns {Promise<void>}
 */
export async function storeEnduranceTest(userId, testResults) {
  const userRef = doc(db, "users", userId);
  const docSnap = await getDoc(userRef);
  
  if (docSnap.exists()) {
    await updateDoc(userRef, {
      enduranceTest: testResults,
      enduranceTestDate: new Date()
    });
  } else {
    await setDoc(userRef, {
      enduranceTest: testResults,
      enduranceTestDate: new Date()
    });
  }
  
  // Also store in a subcollection to keep history of tests
  await addDoc(collection(db, "users", userId, "enduranceTests"), {
    ...testResults,
    date: new Date()
  });
}

/**
 * Gets endurance test history
 * @param {string} userId - The user's ID
 * @param {number} limit - Maximum number of records to return
 * @returns {Promise<Array>} - Array of endurance test records
 */
export async function getEnduranceTestHistory(userId, limitCount = 10) {
  const testsRef = collection(db, "users", userId, "enduranceTests");
  const q = query(testsRef, orderBy("date", "desc"), limit(limitCount));
  
  const querySnapshot = await getDocs(q);
  const tests = [];
  
  querySnapshot.forEach((doc) => {
    tests.push({
      id: doc.id,
      ...doc.data()
    });
  });
  
  return tests;
}

/**
 * Creates a treatment plan based on assessment results
 * @param {string} userId - The user's ID
 * @param {object} planData - Treatment plan data
 * @returns {Promise<void>}
 */
export async function createTreatmentPlan(userId, planData) {
  const userRef = doc(db, "users", userId);
  const docSnap = await getDoc(userRef);
  
  // First store the plan summary in the user document
  if (docSnap.exists()) {
    await updateDoc(userRef, {
      currentPlan: {
        id: planData.id,
        name: planData.name,
        startDate: new Date(),
        painRegions: planData.painRegions
      }
    });
  } else {
    await setDoc(userRef, {
      currentPlan: {
        id: planData.id,
        name: planData.name,
        startDate: new Date(),
        painRegions: planData.painRegions
      }
    });
  }

  // Then store the detailed plan data
  await setDoc(doc(db, "users", userId, "plans", planData.id), {
    ...planData,
    createdAt: new Date(),
    isActive: true
  });
}

/**
 * Stores an exercise log entry
 * @param {string} userId - The user's ID
 * @param {object} exerciseData - Exercise log data
 * @returns {Promise<string>} - ID of the created document
 */
export async function logExercise(userId, exerciseData) {
  const docRef = await addDoc(collection(db, "users", userId, "exerciseLogs"), {
    ...exerciseData,
    date: new Date()
  });
  
  return docRef.id;
}

/**
 * Gets exercise history for a specific exercise
 * @param {string} userId - The user's ID
 * @param {string} exerciseName - Exercise name to query
 * @param {number} limit - Maximum number of records to return
 * @returns {Promise<Array>} - Array of exercise log records
 */
export async function getExerciseHistory(userId, exerciseName, limitCount = 10) {
  const q = query(
    collection(db, "users", userId, "exerciseLogs"),
    where("exerciseName", "==", exerciseName),
    orderBy("date", "desc"),
    limit(limitCount)
  );
  
  const querySnapshot = await getDocs(q);
  const history = [];
  
  querySnapshot.forEach((doc) => {
    history.push({
      id: doc.id,
      ...doc.data()
    });
  });
  
  return history;
}

/**
 * Stores load management data
 * @param {string} userId - The user's ID
 * @param {object} loadData - Load management data
 * @returns {Promise<string>} - ID of the created document
 */
export async function storeLoadManagement(userId, loadData) {
  const docRef = await addDoc(collection(db, "users", userId, "loadManagement"), {
    ...loadData,
    date: new Date()
  });
  
  // Update the user document to indicate they've completed the load management survey
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, {
    loadManagementSurveyCompleted: true,
    lastLoadManagementDate: new Date()
  });
  
  return docRef.id;
}

/**
 * Gets load management history
 * @param {string} userId - The user's ID
 * @param {number} limit - Maximum number of records to return
 * @returns {Promise<Array>} - Array of load management records
 */
export async function getLoadManagementHistory(userId, limitCount = 10) {
  const q = query(
    collection(db, "users", userId, "loadManagement"),
    orderBy("date", "desc"),
    limit(limitCount)
  );
  
  const querySnapshot = await getDocs(q);
  const history = [];
  
  querySnapshot.forEach((doc) => {
    history.push({
      id: doc.id,
      ...doc.data()
    });
  });
  
  return history;
}