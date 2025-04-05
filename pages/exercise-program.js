// pages/exercise-program.js
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { isProUser } from '@/lib/userUtils';
import ProtectedPage from '@/components/layouts/ProtectedPage';
import { 
  exerciseLibrary, 
  exercisesByCategory,
  getNeuralMobilityExercise,
  isExerciseFreeForUser 
} from '@/lib/exerciseData';
import { 
  getExercisePrescription, 
  updateExerciseTracking, 
  getExerciseTrackingForDate 
} from '@/lib/exercisePrescriptionUtils';
import QuickDashReminder from '@/components/QuickDashReminder';
import DayNightToggle from '@/components/DayNightToggle';

// Custom hook to play metronome
function useMetronome() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    audioRef.current = new Audio('/sounds/metronome-50bpm.mp3');
    audioRef.current.loop = true;
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return { isPlaying, togglePlay };
}

// Function to get recommended exercises based on pain regions and nerve test results
function getRecommendedExercises(selectedPainRegions, nerveTestResults, userHasProAccess) {
  // Initialize categories
  const result = {
    stretches: [],
    isometrics: [],
    strength: [],
    neural: []
  };
  
  // Used to track unique exercises to avoid duplicates
  const exerciseSet = new Set();
  
  // First collect all exercises that apply to user's pain regions
  const allExercises = {
    stretches: [],
    isometrics: [],
    strength: [],
    neural: []
  };

  // Get all possible exercises for the user's pain regions
  selectedPainRegions.forEach(regionId => {
    Object.values(exerciseLibrary).forEach(exercise => {
      // Skip if exercise is already in the set
      if (exerciseSet.has(exercise.id)) {
        return;
      }
      
      // Check if exercise is for this pain region
      if (exercise.painRegions && exercise.painRegions.includes(regionId) && exercise.category !== 'neural') {
        // Add to appropriate category
        if (allExercises[exercise.category]) {
          allExercises[exercise.category].push({
            ...exercise,
            completedAM: false,
            completedPM: false,
            painRegion: regionId,
            isFree: isExerciseFreeForUser(exercise.id, selectedPainRegions)
          });
          
          // Mark as added to avoid duplicates
          exerciseSet.add(exercise.id);
        }
      }
    });
  });
  
  // Add neural mobility exercises based on test results if available
  if (nerveTestResults) {
    allExercises.neural = allExercises.neural || [];
    
    ['ulnar', 'radial', 'median'].forEach(nerveType => {
      const testResult = nerveTestResults[nerveType];
      
      // Add exercise if there's a test result and it's not 'none'
      if (testResult && testResult !== 'none') {
        const exercise = getNeuralMobilityExercise(nerveType, testResult);
        
        if (exercise && !exerciseSet.has(exercise.id)) {
          allExercises.neural.push({
            ...exercise,
            completedAM: false,
            completedPM: false,
            isFree: isExerciseFreeForUser(exercise.id, selectedPainRegions)
          });
          
          exerciseSet.add(exercise.id);
        }
      }
    });
  }
  
  // Now sort each category, putting free exercises first
  Object.keys(allExercises).forEach(category => {
    // Sort free exercises first
    const sorted = [...allExercises[category]].sort((a, b) => {
      if (a.isFree && !b.isFree) return -1;
      if (!a.isFree && b.isFree) return 1;
      return 0;
    });
    
    result[category] = sorted;
  });
  
  return result;
}

export default function ExerciseProgram() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timeOfDay, setTimeOfDay] = useState('AM'); // 'AM' or 'PM'
  const [exercises, setExercises] = useState({
    stretches: [],
    isometrics: [],
    strength: [],
    neural: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [allExercises, setAllExercises] = useState([]);
  const [userData, setUserData] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
  
  // Add state for prescriptions
  const [prescriptions, setPrescriptions] = useState({});
  const [exerciseReps, setExerciseReps] = useState('');
  const [exercisePain, setExercisePain] = useState('0');
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [dateLoading, setDateLoading] = useState(false);
  const [weightUnit, setWeightUnit] = useState('lbs');

  // Add refreshPrescriptions function
  async function refreshPrescriptions() {
    if (!currentUser) return;
    
    try {
      console.log("Refreshing prescription data...");
      const refreshedPrescriptions = {};
      
      for (const exercise of allExercises) {
        try {
          const prescription = await getExercisePrescription(currentUser.uid, exercise.id);
          refreshedPrescriptions[exercise.id] = prescription;
        } catch (error) {
          console.error(`Error refreshing prescription for ${exercise.id}:`, error);
        }
      }
      
      setPrescriptions(refreshedPrescriptions);
    } catch (error) {
      console.error("Error refreshing prescriptions:", error);
    }
  }

  // Initialize metronome
  useEffect(() => {
    audioRef.current = new Audio('/sounds/metronome-50bpm.mp3');
    audioRef.current.loop = true;
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Toggle metronome playback
  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Function to get all exercises in a single array
  const getAllExercises = () => {
    return [
      ...exercises.stretches,
      ...exercises.isometrics,
      ...exercises.strength,
      ...(exercises.neural || [])
    ];
  };

  useEffect(() => {
    if (!currentUser) {
      router.push('/login');
      return;
    }

    // Fetch user's pain regions and subscription status
    async function fetchUserData() {
      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserData(userData);
          
          // Get pain regions
          const painRegions = userData.painRegions || {};
          
          // Filter to get only the selected pain regions
          const selectedPainRegions = Object.keys(painRegions).filter(region => 
            painRegions[region] === true);
          
          // Fetch nerve mobility test results
          const nerveTestResults = userData.nerveMobilityTest || {};
          
          // Get exercises based on pain regions and nerve test results
          const userHasProAccess = isProUser(userData);
          const recommendedExercises = getRecommendedExercises(
            selectedPainRegions.length > 0 ? selectedPainRegions : ['wristExtensors'], // Default if none selected
            nerveTestResults,
            userHasProAccess
          );
          
          setExercises(recommendedExercises);
          
          // Get all exercises as a single array
          const allExercisesArr = [
            ...recommendedExercises.stretches,
            ...recommendedExercises.isometrics,
            ...recommendedExercises.strength,
            ...(recommendedExercises.neural || [])
          ];
          
          const fetchedPrescriptions = {};
          
          // Fetch prescription for each exercise
          for (const exercise of allExercisesArr) {
            try {
              const prescription = await getExercisePrescription(currentUser.uid, exercise.id);
              fetchedPrescriptions[exercise.id] = prescription;
            } catch (error) {
              console.error(`Error fetching prescription for ${exercise.id}:`, error);
            }
          }
          
          setPrescriptions(fetchedPrescriptions);
          setAllExercises(allExercisesArr);
          
          // Set the user's preferred weight unit if available
          if (userData.preferences?.weightUnit) {
            setWeightUnit(userData.preferences.weightUnit);
          }
          
          // Load completion state for the selected date
          loadExerciseCompletionForDate(selectedDate);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchUserData();
  }, [currentUser, router]);

  // Update allExercises when exercises change
  useEffect(() => {
    setAllExercises(getAllExercises());
  }, [exercises]);
  
  // Load exercise completion data when date changes
  const loadExerciseCompletionForDate = async (date) => {
    if (!currentUser) return;
    
    try {
      setDateLoading(true);
      
      // Reset all completions first
      setExercises(prev => {
        const newExercises = {};
        Object.keys(prev).forEach(category => {
          newExercises[category] = prev[category].map(exercise => ({
            ...exercise,
            completedAM: false,
            completedPM: false
          }));
        });
        return newExercises;
      });
      
      // Fetch tracking data for the selected date
      const trackingData = await getExerciseTrackingForDate(currentUser.uid, date);
      
      // Update completion states based on tracking data
      setExercises(prev => {
        const newExercises = { ...prev };
        
        // Update each category
        Object.keys(newExercises).forEach(category => {
          newExercises[category] = newExercises[category].map(exercise => {
            const exerciseTracking = trackingData[exercise.id] || [];
            
            // Check if completed for AM/PM
            const completedAM = exerciseTracking.some(instance => 
              instance.timeOfDay === 'AM' && instance.completed
            );
            
            const completedPM = exerciseTracking.some(instance => 
              instance.timeOfDay === 'PM' && instance.completed
            );
            
            return {
              ...exercise,
              completedAM,
              completedPM
            };
          });
        });
        
        return newExercises;
      });
    } catch (error) {
      console.error("Error loading exercise completion data:", error);
    } finally {
      setDateLoading(false);
    }
  };

  // Function to format date for display
  function formatDate(date) {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }

  // Function to go to previous day
  function prevDay() {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() - 1);
    setSelectedDate(newDate);
    loadExerciseCompletionForDate(newDate);
  }

  // Function to go to next day
  function nextDay() {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + 1);
    setSelectedDate(newDate);
    loadExerciseCompletionForDate(newDate);
  }

  // Function to toggle AM/PM
  function toggleTimeOfDay(time) {
    // If switching to PM, refresh prescriptions to ensure emergency scaling is reflected
    if (time === 'PM' && timeOfDay === 'AM') {
      refreshPrescriptions();
    }
    
    setTimeOfDay(time);
  }

  // Function to toggle weight unit (lbs/kg)
  function toggleWeightUnit() {
    const newUnit = weightUnit === 'lbs' ? 'kg' : 'lbs';
    setWeightUnit(newUnit);
    
    // Save preference to user data if logged in
    if (currentUser) {
      updateDoc(doc(db, "users", currentUser.uid), {
        'preferences.weightUnit': newUnit
      }).catch(error => {
        console.error("Error updating weight unit preference:", error);
      });
    }
  }

  // Function to convert weight between lbs and kg
  function convertWeight(weight, fromUnit, toUnit) {
    if (fromUnit === toUnit) return weight;
    
    if (fromUnit === 'lbs' && toUnit === 'kg') {
      return Math.round((weight / 2.20462) * 10) / 10; // lbs to kg, rounded to 1 decimal
    } else if (fromUnit === 'kg' && toUnit === 'lbs') {
      return Math.round(weight * 2.20462); // kg to lbs, rounded to integer
    }
    
    return weight;
  }

  // Function to get display weight with unit
  function getDisplayWeight(exercise, prescription) {
    if (!exercise || !prescription) return '';
    
    // If exercise doesn't use weight, return empty string
    if (exercise.weightType === 'none') return '';
    
    // For band exercises, show as-is
    if (exercise.weightType === 'band') {
      return `${prescription.currentWeight || exercise.defaultWeight || 1}${exercise.weightUnit || 'RB'}`;
    }
    
    // For weight exercises, handle unit conversion
    const baseWeight = prescription.currentWeight || exercise.defaultWeight || 0;
    const baseUnit = prescription.weightUnit || exercise.weightUnit || 'lbs';
    
    // Convert if needed
    const displayWeight = convertWeight(baseWeight, baseUnit, weightUnit);
    
    return `${displayWeight} ${weightUnit}`;
  }

  // Function to check if an exercise is accessible (free or pro user)
  function canAccessExercise(exercise) {
    // Pro users can access all exercises
    if (isProUser(userData)) {
      return true;
    }
    
    // For free users, check if the exercise is marked as free
    return exercise.isFree === true;
  }

  // Function to mark or unmark an exercise as complete based on time of day
  async function toggleExerciseCompletion(category, id) {
    // Get the current completion state of the exercise
    const exercise = exercises[category].find(ex => ex.id === id);
    const currentCompletionState = timeOfDay === 'AM' 
      ? exercise.completedAM
      : exercise.completedPM;
    
    // First update the UI state (toggling the completion state)
    setExercises(prev => {
      const updatedCategory = prev[category].map(exercise => {
        if (exercise.id === id) {
          // Toggle the correct time of day completion status
          if (timeOfDay === 'AM') {
            return { ...exercise, completedAM: !exercise.completedAM };
          } else {
            return { ...exercise, completedPM: !exercise.completedPM };
          }
        }
        return exercise;
      });
      
      return {
        ...prev,
        [category]: updatedCategory
      };
    });
    
    // The new state is the opposite of the current state
    const isComplete = !currentCompletionState;
    
    // Update in Firebase
    if (currentUser) {
      try {
        const trackingData = {
          completed: isComplete,
          repsPerformed: null,
          painLevel: null,
          timeOfDay: timeOfDay
        };
        
        const updatedPrescription = await updateExerciseTracking(
          currentUser.uid, 
          id, 
          trackingData,
          selectedDate
        );
        
        // Update the prescription in state
        setPrescriptions(prev => ({
          ...prev,
          [id]: updatedPrescription
        }));
      } catch (error) {
        console.error(`Error updating exercise tracking for ${id}:`, error);
        // Revert the UI change on error
        setExercises(prev => {
          const updatedCategory = prev[category].map(exercise => {
            if (exercise.id === id) {
              if (timeOfDay === 'AM') {
                return { ...exercise, completedAM: exercise.completedAM };
              } else {
                return { ...exercise, completedPM: exercise.completedPM };
              }
            }
            return exercise;
          });
          
          return {
            ...prev,
            [category]: updatedCategory
          };
        });
      }
    }
  }

  // Quick complete all exercises for the current time of day
  async function quickComplete() {
    // First update the UI
    setExercises(prev => {
      const updated = {};
      Object.keys(prev).forEach(category => {
        updated[category] = prev[category].map(exercise => {
          if (timeOfDay === 'AM') {
            return { ...exercise, completedAM: true };
          } else {
            return { ...exercise, completedPM: true };
          }
        });
      });
      return updated;
    });
    
    // Then update Firebase for all exercises
    if (currentUser) {
      const allExercises = getAllExercises();
      
      const promises = allExercises.map(exercise => {
        // Skip locked exercises for free users
        if (!canAccessExercise(exercise)) {
          return Promise.resolve();
        }
        
        return updateExerciseTracking(
          currentUser.uid, 
          exercise.id, 
          {
            completed: true,
            repsPerformed: null, 
            painLevel: null,
            timeOfDay: timeOfDay
          },
          selectedDate
        ).then(updatedPrescription => {
          // Update the prescription in state
          setPrescriptions(prev => ({
            ...prev,
            [exercise.id]: updatedPrescription
          }));
        }).catch(error => {
          console.error(`Error quick completing ${exercise.id}:`, error);
        });
      });
      
      // Wait for all updates to complete
      try {
        await Promise.all(promises);
      } catch (error) {
        console.error("Error during quick complete:", error);
      }
    }
  }

  // Helper function to determine if an exercise is completed based on current time of day
  function isExerciseCompleted(exercise) {
    return timeOfDay === 'AM' ? exercise.completedAM : exercise.completedPM;
  }

  // Function to open the exercise detail view
  function openExerciseDetail(exercise, category, index) {
    // Get prescription for this exercise
    const prescription = prescriptions[exercise.id] || {
      currentWeight: exercise.defaultWeight || 4,
      targetRepMin: exercise.targetReps?.min || 15, 
      targetRepMax: exercise.targetReps?.max || 20
    };
    
    // Reset form values
    setExerciseReps('');
    setExercisePain('0');
    
    // Set the selected exercise with prescription data
    setSelectedExercise({
      ...exercise,
      category,
      currentWeight: prescription.currentWeight,
      targetRepMin: prescription.targetRepMin,
      targetRepMax: prescription.targetRepMax
    });
    
    // Find index in the combined array
    const allExercises = getAllExercises();
    const globalIndex = allExercises.findIndex(ex => ex.id === exercise.id);
    setExerciseIndex(globalIndex !== -1 ? globalIndex : 0);
  }

  // Function to navigate to next exercise
  function nextExercise() {
    if (allExercises.length === 0) return;
    
    const newIndex = (exerciseIndex + 1) % allExercises.length;
    setExerciseIndex(newIndex);
    
    // Get prescription for this exercise
    const nextExercise = allExercises[newIndex];
    const prescription = prescriptions[nextExercise.id] || {
      currentWeight: nextExercise.defaultWeight || 4,
      targetRepMin: nextExercise.targetReps?.min || 15,
      targetRepMax: nextExercise.targetReps?.max || 20
    };
    
    // Reset form values
    setExerciseReps('');
    setExercisePain('0');
    
    // Set the selected exercise with prescription data
    setSelectedExercise({
      ...nextExercise, 
      category: nextExercise.category,
      currentWeight: prescription.currentWeight,
      targetRepMin: prescription.targetRepMin,
      targetRepMax: prescription.targetRepMax
    });
  }

  // Function to navigate to previous exercise
  function prevExercise() {
    if (allExercises.length === 0) return;
    
    const newIndex = (exerciseIndex - 1 + allExercises.length) % allExercises.length;
    setExerciseIndex(newIndex);
    
    // Get prescription for this exercise
    const prevExercise = allExercises[newIndex];
    const prescription = prescriptions[prevExercise.id] || {
      currentWeight: prevExercise.defaultWeight || 4,
      targetRepMin: prevExercise.targetReps?.min || 15,
      targetRepMax: prevExercise.targetReps?.max || 20
    };
    
    // Reset form values
    setExerciseReps('');
    setExercisePain('0');
    
    // Set the selected exercise with prescription data
    setSelectedExercise({
      ...prevExercise,
      category: prevExercise.category,
      currentWeight: prescription.currentWeight,
      targetRepMin: prescription.targetRepMin,
      targetRepMax: prescription.targetRepMax
    });
  }

  // Function to close exercise detail
  function closeExerciseDetail() {
    setSelectedExercise(null);
  }
  
  // Function to handle tracking form submission
  async function handleTrackingSubmit(e) {
    e.preventDefault();
    
    if (!currentUser || !isProUser(userData) || !selectedExercise) return;
    
    // Validate inputs
    if (!exerciseReps) {
      alert('Please enter the number of repetitions.');
      return;
    }
    
    try {
      setTrackingLoading(true);
      
      const trackingData = {
        completed: true,
        repsPerformed: parseInt(exerciseReps, 10),
        painLevel: parseInt(exercisePain, 10),
        timeOfDay
      };
      
      const updatedPrescription = await updateExerciseTracking(
        currentUser.uid,
        selectedExercise.id,
        trackingData,
        selectedDate
      );
      
      // Update prescriptions state with the returned prescription
      setPrescriptions(prev => ({
        ...prev,
        [selectedExercise.id]: updatedPrescription
      }));
      
      // Mark exercise as completed in UI
      setExercises(prev => {
        const updatedCategory = prev[selectedExercise.category].map(exercise => {
          if (exercise.id === selectedExercise.id) {
            // Update the correct time of day completion status
            if (timeOfDay === 'AM') {
              return { ...exercise, completedAM: true };
            } else {
              return { ...exercise, completedPM: true };
            }
          }
          return exercise;
        });
        
        return {
          ...prev,
          [selectedExercise.category]: updatedCategory
        };
      });
      
      // Check for emergency scaling and show alert if needed
      if (parseInt(exercisePain, 10) >= 7) {
        alert(`Pain level of ${exercisePain} has triggered emergency scaling for this exercise. Your exercise has been modified to reduce discomfort.`);
      }
      
      // Show success message
      alert('Exercise tracked successfully!');
      closeExerciseDetail();
    } catch (error) {
      console.error("Error tracking exercise:", error);
      alert('There was an error saving your progress. Please try again.');
    } finally {
      setTrackingLoading(false);
    }
  }

  // If not logged in or still loading, show loading
  if (loading) {
    return (
      <ProtectedPage>
        <div className="flex justify-center items-center py-12">
          <div className="w-12 h-12 border-4 border-t-red-500 border-gray-200 border-solid rounded-full animate-spin"></div>
          <p className="ml-4 text-lg text-gray-600">Loading your exercise program...</p>
        </div>
      </ProtectedPage>
    );
  }

  return (
    <ProtectedPage>
      <QuickDashReminder />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Today's Exercises</h1>
        
        {/* Weight Unit Toggle */}
        <button
          onClick={toggleWeightUnit}
          className="flex items-center space-x-1 bg-gray-100 px-3 py-1 rounded-md text-sm"
        >
          <span>{weightUnit.toUpperCase()}</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </button>
      </div>

      {/* Date Navigation */}
      <div className="flex justify-center items-center mb-6">
        <button 
          onClick={prevDay} 
          className="p-2 rounded-full hover:bg-gray-200"
          aria-label="Previous Day"
          disabled={dateLoading}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>
        <div className="mx-4 text-lg font-medium">
          {dateLoading ? (
            <span className="inline-block w-32 text-center">Loading...</span>
          ) : (
            formatDate(selectedDate)
          )}
        </div>
        <button 
          onClick={nextDay} 
          className="p-2 rounded-full hover:bg-gray-200"
          aria-label="Next Day"
          disabled={dateLoading}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Day/Night Toggle for AM/PM */}
      <div className="flex justify-center mb-8">
        <div className="flex flex-col items-center">
          <DayNightToggle 
            isDay={timeOfDay === 'AM'} 
            onChange={(isDay) => toggleTimeOfDay(isDay ? 'AM' : 'PM')}
          />
          
          <p className="text-sm text-gray-600 mt-2">
            {timeOfDay === 'AM' ? 'Morning' : 'Evening'} Session
          </p>
        </div>
      </div>

      {/* Exercise Sections */}
      <div className="space-y-8">
        {/* Stretching and Mobility */}
        {exercises.stretches.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-4">Stretching and Mobility Exercises</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {exercises.stretches.map((exercise, index) => {
                // Get prescription data for this exercise
                const prescription = prescriptions[exercise.id] || {
                  currentWeight: exercise.defaultWeight || 0,
                  targetRepMin: exercise.targetReps?.min || 15,
                  targetRepMax: exercise.targetReps?.max || 20
                };
                
                const hasAccess = canAccessExercise(exercise);
                
                return (
                  <div 
                    key={exercise.id}
                    className={`bg-white rounded-lg shadow overflow-hidden ${
                      hasAccess ? 'cursor-pointer' : 'cursor-not-allowed'
                    } relative`}
                    onClick={() => hasAccess && openExerciseDetail(exercise, 'stretches', index)}
                  >
                    {/* Exercise Image */}
                    <div className="h-48 w-full bg-gray-100">
                      <img 
                        src={exercise.imageUrl} 
                        alt={exercise.name} 
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/images/exercises/placeholder.jpg";
                        }}
                      />
                    </div>
                    
                    {/* Exercise Info */}
                    <div className="p-4 border-t">
                      <h3 className="font-medium text-sm mb-1">{exercise.name.replace(/\*/g, '')}</h3>
                      <p className="text-xs text-gray-600 mb-3">{exercise.displayText}</p>
                      
                      {/* Show scaling notification if recently scaled */}
                      {prescriptions[exercise.id]?.recentlyScaled && (
                        <div className="text-xs bg-yellow-100 text-yellow-800 p-1 rounded mb-2">
                          <span className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            Recently adjusted
                          </span>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center">
                        {/* Log button */}
                        <button 
                          className={`px-4 py-1.5 rounded-full text-white text-sm font-medium ${
                            isExerciseCompleted(exercise) ? 'bg-gray-400' : 'bg-red-500 hover:bg-red-600'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (hasAccess && !isExerciseCompleted(exercise)) {
                              toggleExerciseCompletion('stretches', exercise.id);
                            }
                          }}
                          disabled={!hasAccess || isExerciseCompleted(exercise)}
                        >
                          LOG
                        </button>
                        
                        {/* Completion checkmark */}
                        {isExerciseCompleted(exercise) && (
                          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Pro overlay for locked exercises */}
                    {!hasAccess && (
                      <div className="absolute inset-0 bg-gray-700 bg-opacity-75 flex flex-col items-center justify-center px-4 z-10">
                        <div className="bg-red-500 rounded-full p-2 mb-4">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                        <p className="text-center text-white font-medium text-sm">PRO ONLY</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Isometrics */}
        {exercises.isometrics.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-4">Isometrics</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {exercises.isometrics.map((exercise, index) => {
                // Get prescription data for this exercise
                const prescription = prescriptions[exercise.id] || {
                  currentWeight: exercise.defaultWeight || 0,
                  targetRepMin: exercise.targetReps?.min || 15,
                  targetRepMax: exercise.targetReps?.max || 20
                };
                
                const hasAccess = canAccessExercise(exercise);
                
                return (
                  <div 
                    key={exercise.id}
                    className={`bg-white rounded-lg shadow overflow-hidden ${
                      hasAccess ? 'cursor-pointer' : 'cursor-not-allowed'
                    } relative`}
                    onClick={() => hasAccess && openExerciseDetail(exercise, 'isometrics', index)}
                  >
                    {/* Exercise Image */}
                    <div className="h-48 w-full bg-gray-100">
                      <img 
                        src={exercise.imageUrl} 
                        alt={exercise.name} 
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/images/exercises/placeholder.jpg";
                        }}
                      />
                    </div>
                    
                    {/* Exercise Info */}
                    <div className="p-4 border-t">
                      <h3 className="font-medium text-sm mb-1">{exercise.name.replace(/\*/g, '')}</h3>
                      <p className="text-xs text-gray-600">{exercise.displayText}</p>
                      {exercise.restText && <p className="text-xs text-gray-600 mb-3">{exercise.restText}</p>}
                      
                      {/* Show scaling notification if recently scaled */}
                      {prescriptions[exercise.id]?.recentlyScaled && (
                        <div className="text-xs bg-yellow-100 text-yellow-800 p-1 rounded mb-2">
                          <span className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            Recently adjusted
                          </span>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center">
                        {/* Log button */}
                        <button 
                          className={`px-4 py-1.5 rounded-full text-white text-sm font-medium ${
                            isExerciseCompleted(exercise) ? 'bg-gray-400' : 'bg-red-500 hover:bg-red-600'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (hasAccess && !isExerciseCompleted(exercise)) {
                              toggleExerciseCompletion('isometrics', exercise.id);
                            }
                          }}
                          disabled={!hasAccess || isExerciseCompleted(exercise)}
                        >
                          LOG
                        </button>
                        
                        {/* Completion checkmark */}
                        {isExerciseCompleted(exercise) && (
                          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Pro overlay for locked exercises */}
                    {!hasAccess && (
                      <div className="absolute inset-0 bg-gray-700 bg-opacity-75 flex flex-col items-center justify-center px-4 z-10">
                        <div className="bg-red-500 rounded-full p-2 mb-4">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                        <p className="text-center text-white font-medium text-sm">PRO ONLY</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Strength and Endurance */}
        {exercises.strength.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-4">Strength and Endurance Exercises</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {exercises.strength.map((exercise, index) => {
                // Get prescription data for this exercise
                const prescription = prescriptions[exercise.id] || {
                  currentWeight: exercise.defaultWeight || 0,
                  targetRepMin: exercise.targetReps?.min || 15,
                  targetRepMax: exercise.targetReps?.max || 20
                };
                
                const hasAccess = canAccessExercise(exercise);
                
                return (
                  <div 
                    key={exercise.id}
                    className={`bg-white rounded-lg shadow overflow-hidden ${
                      hasAccess ? 'cursor-pointer' : 'cursor-not-allowed'
                    } relative`}
                    onClick={() => hasAccess && openExerciseDetail(exercise, 'strength', index)}
                  >
                    {/* Exercise Image */}
                    <div className="h-48 w-full bg-gray-100">
                      <img 
                        src={exercise.imageUrl} 
                        alt={exercise.name} 
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/images/exercises/placeholder.jpg";
                        }}
                      />
                    </div>
                    
                    {/* Exercise Info */}
                    <div className="p-4 border-t">
                      <h3 className="font-medium text-sm mb-1">{exercise.name.replace(/\*/g, '')}</h3>
                      <p className="text-xs text-gray-600">
                        Reps: {prescription.targetRepMin}-{prescription.targetRepMax}
                      </p>
                      <p className="text-xs text-gray-600 mb-3">
                        Target: {getDisplayWeight(exercise, prescription)}
                      </p>
                      
                      {/* Show scaling notification if recently scaled */}
                      {prescriptions[exercise.id]?.recentlyScaled && (
                        <div className="text-xs bg-yellow-100 text-yellow-800 p-1 rounded mb-2">
                          <span className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            Recently adjusted
                          </span>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center">
                        {/* Log button */}
                        <button 
                          className={`px-4 py-1.5 rounded-full text-white text-sm font-medium ${
                            isExerciseCompleted(exercise) ? 'bg-gray-400' : 'bg-red-500 hover:bg-red-600'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (hasAccess && !isExerciseCompleted(exercise)) {
                              toggleExerciseCompletion('strength', exercise.id);
                            }
                          }}
                          disabled={!hasAccess || isExerciseCompleted(exercise)}
                        >
                          LOG
                        </button>
                        
                        {/* Completion checkmark */}
                        {isExerciseCompleted(exercise) && (
                          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Pro overlay for locked exercises */}
                    {!hasAccess && (
                      <div className="absolute inset-0 bg-gray-700 bg-opacity-75 flex flex-col items-center justify-center px-4 z-10">
                        <div className="bg-red-500 rounded-full p-2 mb-4">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                        <p className="text-center text-white font-medium text-sm">PRO ONLY</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Neural Mobility */}
        {exercises.neural && exercises.neural.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-4">Neural Mobility Exercises</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {exercises.neural.map((exercise, index) => {
                const hasAccess = canAccessExercise(exercise);
                
                return (
                  <div 
                    key={exercise.id}
                    className={`bg-white rounded-lg shadow overflow-hidden ${
                      hasAccess ? 'cursor-pointer' : 'cursor-not-allowed'
                    } relative`}
                    onClick={() => hasAccess && openExerciseDetail(exercise, 'neural', index)}
                  >
                    {/* Exercise Image */}
                    <div className="h-48 w-full bg-gray-100">
                      <img 
                        src={exercise.imageUrl} 
                        alt={exercise.name} 
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/images/exercises/placeholder.jpg";
                        }}
                      />
                    </div>
                    
                    {/* Exercise Info */}
                    <div className="p-4 border-t">
                      <h3 className="font-medium text-sm mb-1">{exercise.name.replace(/\*/g, '')}</h3>
                      <p className="text-xs text-gray-600 mb-3">{exercise.displayText}</p>
                      
                      {/* Show scaling notification if recently scaled */}
                      {prescriptions[exercise.id]?.recentlyScaled && (
                        <div className="text-xs bg-yellow-100 text-yellow-800 p-1 rounded mb-2">
                          <span className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            Recently adjusted
                          </span>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center">
                        {/* Log button */}
                        <button 
                          className={`px-4 py-1.5 rounded-full text-white text-sm font-medium ${
                            isExerciseCompleted(exercise) ? 'bg-gray-400' : 'bg-red-500 hover:bg-red-600'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (hasAccess && !isExerciseCompleted(exercise)) {
                              toggleExerciseCompletion('neural', exercise.id);
                            }
                          }}
                          disabled={!hasAccess || isExerciseCompleted(exercise)}
                        >
                          LOG
                        </button>
                        
                        {/* Completion checkmark */}
                        {isExerciseCompleted(exercise) && (
                          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Pro overlay for locked exercises */}
                    {!hasAccess && (
                      <div className="absolute inset-0 bg-gray-700 bg-opacity-75 flex flex-col items-center justify-center px-4 z-10">
                        <div className="bg-red-500 rounded-full p-2 mb-4">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                        <p className="text-center text-white font-medium text-sm">PRO ONLY</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* Pro Upsell Banner */}
      {!isProUser(userData) && (
        <div className="mt-8 bg-gradient-to-r from-red-500 to-red-600 rounded-lg shadow-lg p-6 text-white">
          <h3 className="text-xl font-bold mb-2">Upgrade to Pro for Full Access</h3>
          <p className="mb-4">Get unlimited access to all exercises, detailed tracking, and personalized progression recommendations.</p>
          <Link href="/go-pro" className="inline-block bg-white text-red-600 px-6 py-2 rounded-md font-medium hover:bg-gray-100">
            Upgrade Now
          </Link>
        </div>
      )}

      {/* Quick Complete Button */}
      <div className="mt-8 text-center">
        <button 
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          onClick={quickComplete}
          disabled={dateLoading}
        >
          {dateLoading ? "Loading..." : "Quick Complete"}
        </button>
        <p className="text-sm text-gray-600 mt-2">Marks all exercises as complete for the {timeOfDay} session.</p>
        <p className="text-sm text-gray-500 mt-1">Current date: {formatDate(selectedDate)}</p>
      </div>

      {/* Exercise Detail Modal */}
      {selectedExercise && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">{selectedExercise.name}</h2>
                <button 
                  onClick={closeExerciseDetail}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Add emergency scaling alert if present */}
              {prescriptions[selectedExercise.id]?.recentlyScaled && (
                <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded-md text-sm">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span>This exercise was recently adjusted due to high pain levels. The weight and/or reps have been modified for your comfort.</span>
                  </div>
                </div>
              )}
              
              {/* Exercise Video/Image */}
              <div className="bg-gray-200 h-64 rounded-lg mb-4 flex items-center justify-center relative">
                <img 
                  src={selectedExercise.imageUrl} 
                  alt={selectedExercise.name}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/images/exercises/placeholder.jpg";
                  }}
                />
                
                {/* Navigation Arrows */}
                <button 
                  onClick={prevExercise}
                  className="absolute left-2 p-2 rounded-full bg-white bg-opacity-70 hover:bg-opacity-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button 
                  onClick={nextExercise}
                  className="absolute right-2 p-2 rounded-full bg-white bg-opacity-70 hover:bg-opacity-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              
              {/* Metronome Control */}
              <div className="flex justify-center mb-4">
                <button
                  onClick={togglePlay}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md ${isPlaying ? 'bg-red-500 text-white' : 'bg-gray-200'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    {isPlaying ? (
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    ) : (
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    )}
                  </svg>
                  <span>{isPlaying ? 'Pause Metronome' : 'Play Metronome (50 BPM)'}</span>
                </button>
              </div>
              
              {/* Exercise Information */}
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-2">Instructions</h3>
                <p className="text-gray-700 mb-4">{selectedExercise.instructions || "Follow the proper form demonstrated in the video."}</p>
                
                {selectedExercise.displayText && (
                  <div className="mb-2">
                    <span className="font-medium">Sets/Reps: </span>
                    <span>{selectedExercise.displayText}</span>
                  </div>
                )}
                
                {selectedExercise.restText && (
                  <div className="mb-2">
                    <span className="font-medium">Rest: </span>
                    <span>{selectedExercise.restText}</span>
                  </div>
                )}
                
                {/* Display dynamic prescription data for appropriate exercises */}
                {selectedExercise.category === 'strength' && (
                  <div className="mb-2">
                    <span className="font-medium">Target Reps: </span>
                    <span>{selectedExercise.targetRepMin}-{selectedExercise.targetRepMax}</span>
                  </div>
                )}
                
                {selectedExercise.category === 'strength' && selectedExercise.weightType !== 'none' && (
                  <div className="mb-2">
                    <span className="font-medium">Weight: </span>
                    <span>{selectedExercise.currentWeight} {selectedExercise.weightUnit || 'lbs'}</span>
                  </div>
                )}
              </div>
              
              {/* Pro Features (Tracking Section) */}
              <div className="border-t pt-4">
                <h3 className="font-semibold text-lg mb-2">Tracking</h3>
                
                {isProUser(userData) ? (
                  <form onSubmit={handleTrackingSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Exercise Completed</label>
                      <div className="flex space-x-2">
                        <button 
                          type="button"
                          className={`px-4 py-2 border rounded-md transition-all ${
                            isExerciseCompleted(selectedExercise) 
                              ? 'bg-green-100 border-green-500 font-medium shadow-sm' 
                              : 'bg-white hover:bg-gray-50'
                          }`}
                          onClick={() => {
                            if (!isExerciseCompleted(selectedExercise)) {
                              toggleExerciseCompletion(selectedExercise.category, selectedExercise.id);
                            }
                          }}
                        >
                          <div className="flex items-center">
                            {isExerciseCompleted(selectedExercise) && (
                              <svg className="w-4 h-4 mr-1 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            )}
                            Yes
                          </div>
                        </button>
                        <button 
                          type="button"
                          className={`px-4 py-2 border rounded-md transition-all ${
                            !isExerciseCompleted(selectedExercise) 
                              ? 'bg-red-100 border-red-500 font-medium shadow-sm' 
                              : 'bg-white hover:bg-gray-50'
                          }`}
                          onClick={() => {
                            if (isExerciseCompleted(selectedExercise)) {
                              toggleExerciseCompletion(selectedExercise.category, selectedExercise.id);
                            }
                          }}
                        >
                          <div className="flex items-center">
                            {!isExerciseCompleted(selectedExercise) && (
                              <svg className="w-4 h-4 mr-1 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                            )}
                            No
                          </div>
                        </button>
                      </div>
                    </div>
                    
                    {/* Only show reps field for strength and neural exercises */}
                    {(selectedExercise.category === 'strength' || selectedExercise.category === 'neural') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="repsPerformed">
                          Reps Performed
                        </label>
                        <input 
                          type="number" 
                          id="repsPerformed"
                          name="repsPerformed"
                          className="w-full p-2 border rounded-md" 
                          placeholder={`Target: ${selectedExercise.targetRepMin}-${selectedExercise.targetRepMax}`}
                          value={exerciseReps}
                          onChange={(e) => setExerciseReps(e.target.value)}
                          min="1"
                        />
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="painLevel">
                        Pain Level During Exercise (0-10)
                      </label>
                      <input 
                        type="number" 
                        id="painLevel"
                        name="painLevel"
                        min="0" 
                        max="10" 
                        className="w-full p-2 border rounded-md" 
                        placeholder="Enter pain level"
                        value={exercisePain}
                        onChange={(e) => setExercisePain(e.target.value)}
                      />
                    </div>
                    
                    <button
                      type="submit"
                      className="w-full bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md"
                      disabled={trackingLoading}
                    >
                      {trackingLoading ? "Saving..." : "Save Tracking Data"}
                    </button>
                  </form>
                ) : (
                  <div className="bg-gray-100 p-4 rounded-md">
                    <p className="text-gray-700 mb-2">Upgrade to Pro to unlock detailed exercise tracking:</p>
                    <ul className="list-disc list-inside text-sm text-gray-600 mb-3">
                      <li>Track exact reps performed</li>
                      <li>Record pain levels</li>
                      <li>Get personalized progression recommendations</li>
                    </ul>
                    <Link href="/go-pro" className="block w-full bg-red-500 text-white py-2 rounded-md hover:bg-red-600 text-center">
                      Upgrade to Pro
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </ProtectedPage>
  );
}