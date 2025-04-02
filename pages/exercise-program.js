// pages/exercise-program.js
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getDoc, setDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { isProUser } from '@/lib/userUtils';
import Image from 'next/image';
import { exerciseLibrary, painRegionToTestMapping } from '@/lib/exerciseData';
import { 
  getExercisePrescription, 
  updateExerciseTracking, 
  getExerciseTrackingForDate 
} from '@/lib/exercisePrescriptionUtils';

// Neural Mobility Exercises
const neuralMobilityExercises = {
  ulnar: {
    none: null,
    mild: {
      id: 'ulnarNerveGlideLevel2',
      name: 'Ulnar Nerve Glide (Level 2)',
      category: 'neural',
      reps: '2 Sets of 10 Stretches',
      instructions: 'Start with your arm out to the side, elbow bent at 90°. Slowly straighten your elbow while gently tilting your head to the opposite side. Hold for 2 seconds, then return to the starting position.',
      imageUrl: '/exercises/ulnar-nerve-glide-2.jpg',
      isFree: false
    },
    severe: {
      id: 'ulnarNerveGlideLevel1',
      name: 'Ulnar Nerve Glide (Level 1)',
      category: 'neural',
      reps: '2 Sets of 10 Stretches',
      instructions: 'With your elbow bent and close to your body, gently tilt your hand from side to side, keeping your wrist straight. This is a gentler version for more sensitive symptoms.',
      imageUrl: '/exercises/ulnar-nerve-glide-1.jpg',
      isFree: false
    }
  },
  radial: {
    none: null,
    mild: {
      id: 'radialNerveGlideLevel2',
      name: 'Radial Nerve Glide (Level 2)',
      category: 'neural',
      reps: '2 Sets of 10 Stretches',
      instructions: 'Extend your arm with your palm facing down. Bend your wrist down, then slowly turn your head away from your arm. Hold for 2 seconds, then return to neutral.',
      imageUrl: '/exercises/radial-nerve-glide-2.jpg',
      isFree: false
    },
    severe: {
      id: 'radialNerveGlideLevel1',
      name: 'Radial Nerve Glide (Level 1)',
      category: 'neural',
      reps: '2 Sets of 10 Stretches',
      instructions: 'With your arm at your side and elbow bent, gently rotate your forearm so your palm faces up, then down. This is a gentler version for more sensitive symptoms.',
      imageUrl: '/exercises/radial-nerve-glide-1.jpg',
      isFree: false
    }
  },
  median: {
    none: null,
    mild: {
      id: 'medianNerveGlideLevel2',
      name: 'Median Nerve Glide (Level 2)',
      category: 'neural',
      reps: '2 Sets of 10 Stretches',
      instructions: 'Extend your arm with palm up. Gently pull your thumb down and out, while extending your wrist backward. Hold for 2 seconds, then return to neutral.',
      imageUrl: '/exercises/median-nerve-glide-2.jpg',
      isFree: false
    },
    severe: {
      id: 'medianNerveGlideLevel1',
      name: 'Median Nerve Glide (Level 1)',
      category: 'neural',
      reps: '2 Sets of 10 Stretches',
      instructions: 'With your elbow bent and close to your body, gently extend and flex your wrist while keeping your fingers relaxed. This is a gentler version for more sensitive symptoms.',
      imageUrl: '/exercises/median-nerve-glide-1.jpg',
      isFree: false
    }
  }
};

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

export default function ExerciseProgram() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timeOfDay, setTimeOfDay] = useState('AM'); // 'AM' or 'PM'
  const [exercises, setExercises] = useState({
    stretches: [],
    isometrics: [],
    strength: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [allExercises, setAllExercises] = useState([]);
  const [userData, setUserData] = useState(null); // Store the entire user data for pro status check
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
  
  // NEW: Add state for prescriptions
  const [prescriptions, setPrescriptions] = useState({});
  const [exerciseReps, setExerciseReps] = useState('');
  const [exercisePain, setExercisePain] = useState('0');
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [dateLoading, setDateLoading] = useState(false);

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
          // Store the entire user data object for use with isProUser function
          setUserData(userData);
          
          // Get pain regions
          const painRegions = userData.painRegions || {};
          
          // Filter to get only the selected pain regions
          const selectedPainRegions = Object.keys(painRegions).filter(region => painRegions[region] === true);
          
          // Process exercises based on selected pain regions
          const exerciseSet = new Set();
          const categorizedExercises = {
            stretches: [],
            isometrics: [],
            strength: []
          };
          
          // Add exercises from each selected pain region
          selectedPainRegions.forEach(region => {
            if (exerciseLibrary[region]) {
              // Add all exercises from this region, both free and premium
              exerciseLibrary[region].forEach(exercise => {
                if (exercise.category && categorizedExercises[exercise.category] !== undefined) {
                  // Use ONLY exercise ID as a unique identifier to avoid duplicates
                  const exerciseKey = exercise.id;
                  if (!exerciseSet.has(exerciseKey)) {
                    exerciseSet.add(exerciseKey);
                    categorizedExercises[exercise.category].push({
                      ...exercise,
                      completedAM: false,
                      completedPM: false,
                      painRegion: region
                    });
                  }
                }
              });
            }
          });
          
          // If no pain regions selected, provide a default set of exercises
          if (selectedPainRegions.length === 0) {
            const defaultRegion = 'wristExtensors'; // Default region
            
            // Add all exercises from the default region
            exerciseLibrary[defaultRegion].forEach(exercise => {
              if (exercise.category && categorizedExercises[exercise.category] !== undefined) {
                categorizedExercises[exercise.category].push({
                  ...exercise,
                  completedAM: false,
                  completedPM: false,
                  painRegion: defaultRegion
                });
              }
            });
          }
          
          // Fetch nerve mobility test results
          const nerveTestResults = userData.nerveMobilityTest || {};
          
          // Process neural mobility exercises based on test results
          const neuralExercises = [];
          
          // Check each nerve type (ulnar, radial, median)
          ['ulnar', 'radial', 'median'].forEach(nerveType => {
            const result = nerveTestResults[nerveType];
            
            // If there's a test result and it's not 'none'
            if (result && result !== 'none') {
              const exercise = neuralMobilityExercises[nerveType][result];
              if (exercise) {
                neuralExercises.push({
                  ...exercise,
                  completedAM: false,
                  completedPM: false
                });
              }
            }
          });
          
          // Add neural exercises to categorized exercises
          if (neuralExercises.length > 0) {
            categorizedExercises.neural = neuralExercises;
          }
          
          setExercises(categorizedExercises);
          
          // NEW: Fetch prescriptions for all exercises
          const allExercisesArr = [
            ...categorizedExercises.stretches,
            ...categorizedExercises.isometrics,
            ...categorizedExercises.strength,
            ...(neuralExercises || [])
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
  
  // NEW: Load exercise completion data when date changes
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
    setTimeOfDay(time);
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
        if (!isProUser(userData) && !exercise.isFree) {
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
      currentWeight: 4,
      targetRepMin: 15, 
      targetRepMax: 20
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
      currentWeight: 4,
      targetRepMin: 15,
      targetRepMax: 20
    };
    
    // Reset form values
    setExerciseReps('');
    setExercisePain('0');
    
    // Set the selected exercise with prescription data
    setSelectedExercise({
      ...nextExercise, 
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
      currentWeight: 4,
      targetRepMin: 15,
      targetRepMax: 20
    };
    
    // Reset form values
    setExerciseReps('');
    setExercisePain('0');
    
    // Set the selected exercise with prescription data
    setSelectedExercise({
      ...prevExercise,
      currentWeight: prescription.currentWeight,
      targetRepMin: prescription.targetRepMin,
      targetRepMax: prescription.targetRepMax
    });
  }

  // Function to close exercise detail
  function closeExerciseDetail() {
    setSelectedExercise(null);
  }

  // Function to check if an exercise is free based on subscription status
  function canAccessExercise(exercise) {
    return isProUser(userData) || exercise.isFree;
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
      
      // Update prescriptions state
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="p-4 rounded-md bg-white shadow-md">
          <p className="text-lg">Loading your exercise program...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Top Header */}
      <header className="bg-white shadow-sm p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
              <span className="text-white font-bold">1HP</span>
            </div>
            <span className="font-bold text-lg">1HP Troubleshooter</span>
          </div>
          <div className="flex space-x-8">
            <Link href="/dashboard" className="text-gray-700 hover:text-red-500">Home</Link>
            <Link href="#" className="text-gray-700 hover:text-red-500">Talk to an Expert</Link>
            <Link href="#" className="text-gray-700 hover:text-red-500">Addons</Link>
            <Link href="/exercise-program" className="bg-red-500 text-white px-4 py-2 rounded-full hover:bg-red-600">Today's Exercises</Link>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r p-6 hidden md:block">
          <nav className="space-y-4">
            <Link href="/dashboard" className="block text-gray-800 font-medium hover:text-red-500">Home</Link>
            <Link href="/about-plan" className="block text-gray-800 font-medium hover:text-red-500">About Plan</Link>
            <Link href="/exercise-program" className="block text-gray-800 font-medium hover:text-red-500 font-bold text-red-500">Exercise Program</Link>
            <Link href="/progress-statistics" className="block text-gray-800 font-medium hover:text-red-500">Progress Statistics</Link>
            <Link href="/load-tracking" className="block text-gray-800 font-medium hover:text-red-500">Load Tracking</Link>
            <Link href="/switch-plan" className="block text-gray-800 font-medium hover:text-red-500">Switch Plan</Link>
            <Link href="/account" className="block text-gray-800 font-medium hover:text-red-500">Account</Link>
            <Link href="/go-pro" className="block text-gray-800 font-medium hover:text-red-500">Go Pro</Link>
          </nav>
          
          <div className="mt-8 text-sm text-blue-600">
            <Link href="/terms" className="block hover:underline">Terms and Conditions</Link>
            <Link href="/privacy" className="block hover:underline">Privacy Policy</Link>
            <p className="text-gray-500 mt-1">1Healthpoint Inc. 2025</p>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8">
          <h1 className="text-2xl font-bold mb-6">Today's Exercises</h1>

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

          {/* AM/PM Toggle with Enhanced Visual Differentiator */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex rounded-md shadow-sm">
              <button
                type="button"
                className={`px-6 py-3 text-sm font-medium rounded-l-md flex items-center space-x-2 transition-all ${
                  timeOfDay === 'AM'
                    ? 'bg-red-500 text-white font-bold shadow-md border-2 border-red-600'
                    : 'bg-white text-gray-700 hover:bg-gray-50 opacity-75'
                }`}
                onClick={() => toggleTimeOfDay('AM')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
                <span>AM</span>
                {timeOfDay === 'AM' && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                  </span>
                )}
              </button>
              <button
                type="button"
                className={`px-6 py-3 text-sm font-medium rounded-r-md flex items-center space-x-2 transition-all ${
                  timeOfDay === 'PM'
                    ? 'bg-red-500 text-white font-bold shadow-md border-2 border-red-600'
                    : 'bg-white text-gray-700 hover:bg-gray-50 opacity-75'
                }`}
                onClick={() => toggleTimeOfDay('PM')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
                <span>PM</span>
                {timeOfDay === 'PM' && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Exercise Sections */}
          <div className="space-y-8">
            {/* Stretching and Mobility */}
            {exercises.stretches.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold mb-4">Stretching and Mobility Exercises</h2>
                <div className="bg-white rounded-lg shadow">
                  {exercises.stretches.map((exercise, index) => {
                    // Get prescription data for this exercise
                    const prescription = prescriptions[exercise.id] || {
                      currentWeight: 0,
                      targetRepMin: 15,
                      targetRepMax: 20
                    };
                    
                    return (
                      <div 
                        key={exercise.id}
                        className={`p-4 border-b last:border-b-0 flex justify-between items-center ${
                          canAccessExercise(exercise) ? 'cursor-pointer' : 'cursor-not-allowed'
                        } ${
                          isExerciseCompleted(exercise) ? 'bg-green-50' : ''
                        } relative`}
                        onClick={() => canAccessExercise(exercise) && openExerciseDetail(exercise, 'stretches', index)}
                      >
                        {/* Exercise content */}
                        <div>
                          <h3 className="font-medium">{exercise.name}</h3>
                          <p className="text-sm text-gray-600">{exercise.sets}</p>
                        </div>

                        {/* Pro overlay for locked exercises */}
                        {!canAccessExercise(exercise) && (
                          <div className="absolute inset-0 bg-gray-200 bg-opacity-75 backdrop-blur-sm flex flex-col items-center justify-center px-4 z-10">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-500 text-white mb-2">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                            </div>
                            <p className="text-center text-sm font-medium">Upgrade to Pro to unlock this exercise</p>
                          </div>
                        )}

                        {/* Exercise controls (only shown for accessible exercises) */}
                        {canAccessExercise(exercise) && (
                          isExerciseCompleted(exercise) ? (
                            <div className="flex items-center">
                              <button
                                className="mr-2 px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleExerciseCompletion('stretches', exercise.id);
                                }}
                                title="Unmark as completed"
                              >
                                UNDO
                              </button>
                              <span className="flex items-center justify-center w-8 h-8 bg-green-500 text-white rounded-full">✓</span>
                            </div>
                          ) : (
                            <button 
                              className="px-3 py-1 bg-red-500 text-white rounded-md text-sm hover:bg-red-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExerciseCompletion('stretches', exercise.id);
                              }}
                            >
                              LOG
                            </button>
                          )
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
                <div className="bg-white rounded-lg shadow">
                  {exercises.isometrics.map((exercise, index) => {
                    // Get prescription data for this exercise
                    const prescription = prescriptions[exercise.id] || {
                      currentWeight: 0,
                      targetRepMin: 15,
                      targetRepMax: 20
                    };
                    
                    return (
                      <div 
                        key={exercise.id}
                        className={`p-4 border-b last:border-b-0 flex justify-between items-center ${
                          canAccessExercise(exercise) ? 'cursor-pointer' : 'cursor-not-allowed'
                        } ${
                          isExerciseCompleted(exercise) ? 'bg-green-50' : ''
                        } relative`}
                        onClick={() => canAccessExercise(exercise) && openExerciseDetail(exercise, 'isometrics', index)}
                      >
                        {/* Exercise content */}
                        <div>
                          <h3 className="font-medium">{exercise.name}</h3>
                          <p className="text-sm text-gray-600">{exercise.duration}</p>
                          {exercise.rest && <p className="text-sm text-gray-600">{exercise.rest}</p>}
                        </div>

                        {/* Pro overlay for locked exercises */}
                        {!canAccessExercise(exercise) && (
                          <div className="absolute inset-0 bg-gray-200 bg-opacity-75 flex flex-col items-center justify-center px-4">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-500 text-white mb-2">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                            </div>
                            <p className="text-center text-sm font-medium">Upgrade to Pro to unlock this exercise</p>
                          </div>
                        )}

                        {/* Exercise controls (only shown for accessible exercises) */}
                        {canAccessExercise(exercise) && (
                          isExerciseCompleted(exercise) ? (
                            <div className="flex items-center">
                              <button
                                className="mr-2 px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleExerciseCompletion('isometrics', exercise.id);
                                }}
                                title="Unmark as completed"
                              >
                                UNDO
                              </button>
                              <span className="flex items-center justify-center w-8 h-8 bg-green-500 text-white rounded-full">✓</span>
                            </div>
                          ) : (
                            <button 
                              className="px-3 py-1 bg-red-500 text-white rounded-md text-sm hover:bg-red-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExerciseCompletion('isometrics', exercise.id);
                              }}
                            >
                              LOG
                            </button>
                          )
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
                <div className="bg-white rounded-lg shadow">
                  {exercises.strength.map((exercise, index) => {
                    // Get prescription data for this exercise
                    const prescription = prescriptions[exercise.id] || {
                      currentWeight: 4,
                      targetRepMin: 15,
                      targetRepMax: 20
                    };
                    
                    return (
                      <div 
                        key={exercise.id}
                        className={`p-4 border-b last:border-b-0 flex justify-between items-center ${
                          canAccessExercise(exercise) ? 'cursor-pointer' : 'cursor-not-allowed'
                        } ${
                          isExerciseCompleted(exercise) ? 'bg-green-50' : ''
                        } relative`}
                        onClick={() => canAccessExercise(exercise) && openExerciseDetail(exercise, 'strength', index)}
                      >
                        {/* Exercise content */}
                        <div>
                          <h3 className="font-medium">{exercise.name}</h3>
                          <p className="text-sm text-gray-600">
                            Reps: {prescription.targetRepMin}-{prescription.targetRepMax}
                          </p>
                          <p className="text-sm text-gray-600">
                            Weight: {prescription.currentWeight} lbs
                          </p>
                        </div>

                        {/* Pro overlay for locked exercises */}
                        {!canAccessExercise(exercise) && (
                          <div className="absolute inset-0 bg-gray-200 bg-opacity-75 flex flex-col items-center justify-center px-4">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-500 text-white mb-2">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                            </div>
                            <p className="text-center text-sm font-medium">Upgrade to Pro to unlock this exercise</p>
                          </div>
                        )}

                        {/* Exercise controls (only shown for accessible exercises) */}
                        {canAccessExercise(exercise) && (
                          isExerciseCompleted(exercise) ? (
                            <div className="flex items-center">
                              <button
                                className="mr-2 px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleExerciseCompletion('strength', exercise.id);
                                }}
                                title="Unmark as completed"
                              >
                                UNDO
                              </button>
                              <span className="flex items-center justify-center w-8 h-8 bg-green-500 text-white rounded-full">✓</span>
                            </div>
                          ) : (
                            <button 
                              className="px-3 py-1 bg-red-500 text-white rounded-md text-sm hover:bg-red-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExerciseCompletion('strength', exercise.id);
                              }}
                            >
                              LOG
                            </button>
                          )
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
                <div className="bg-white rounded-lg shadow">
                  {exercises.neural.map((exercise, index) => (
                    <div 
                      key={exercise.id}
                      className={`p-4 border-b last:border-b-0 flex justify-between items-center ${
                        canAccessExercise(exercise) ? 'cursor-pointer' : 'cursor-not-allowed'
                      } ${
                        isExerciseCompleted(exercise) ? 'bg-green-50' : ''
                      } relative`}
                      onClick={() => canAccessExercise(exercise) && openExerciseDetail(exercise, 'neural', index)}
                    >
                      {/* Exercise content */}
                      <div>
                        <h3 className="font-medium">{exercise.name}</h3>
                        <p className="text-sm text-gray-600">{exercise.reps}</p>
                      </div>
                      
                      {/* Pro overlay for locked exercises */}
                      {!canAccessExercise(exercise) && (
                        <div className="absolute inset-0 bg-gray-200 bg-opacity-75 flex flex-col items-center justify-center px-4">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-500 text-white mb-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          </div>
                          <p className="text-center text-sm font-medium">Upgrade to Pro to unlock this exercise</p>
                        </div>
                      )}
                      
                      {/* Exercise controls (only shown for accessible exercises) */}
                      {canAccessExercise(exercise) && (
                        isExerciseCompleted(exercise) ? (
                          <div className="flex items-center">
                            <button
                              className="mr-2 px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExerciseCompletion('neural', exercise.id);
                              }}
                              title="Unmark as completed"
                            >
                              UNDO
                            </button>
                            <span className="flex items-center justify-center w-8 h-8 bg-green-500 text-white rounded-full">✓</span>
                          </div>
                        ) : (
                          <button 
                            className="px-3 py-1 bg-red-500 text-white rounded-md text-sm hover:bg-red-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExerciseCompletion('neural', exercise.id);
                            }}
                          >
                            LOG
                          </button>
                        )
                      )}
                    </div>
                  ))}
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
        </main>
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
              
              {/* Exercise Video/Image Placeholder */}
              <div className="bg-gray-200 h-64 rounded-lg mb-4 flex items-center justify-center relative">
                <div className="text-gray-500">Exercise Video</div>
                
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
                
                {selectedExercise.sets && (
                  <div className="mb-2">
                    <span className="font-medium">Sets: </span>
                    <span>{selectedExercise.sets}</span>
                  </div>
                )}
                
                {selectedExercise.duration && (
                  <div className="mb-2">
                    <span className="font-medium">Duration: </span>
                    <span>{selectedExercise.duration}</span>
                  </div>
                )}
                
                {selectedExercise.rest && (
                  <div className="mb-2">
                    <span className="font-medium">Rest: </span>
                    <span>{selectedExercise.rest}</span>
                  </div>
                )}
                
                {/* Display dynamic prescription data */}
                {selectedExercise.category === 'strength' && (
                  <div className="mb-2">
                    <span className="font-medium">Target Reps: </span>
                    <span>{selectedExercise.targetRepMin}-{selectedExercise.targetRepMax}</span>
                  </div>
                )}
                
                {selectedExercise.category === 'strength' && (
                  <div className="mb-2">
                    <span className="font-medium">Weight: </span>
                    <span>{selectedExercise.currentWeight} lbs</span>
                  </div>
                )}
                
                {selectedExercise.reps && (
                  <div className="mb-2">
                    <span className="font-medium">Reps: </span>
                    <span>{selectedExercise.reps}</span>
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
    </div>
  );
}