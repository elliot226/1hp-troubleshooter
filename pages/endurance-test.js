// pages/endurance-test.js
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { getDoc, setDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { initializeAllExercisePrescriptions } from '@/lib/exercisePrescriptionUtils';
import { exerciseLibrary, painRegionToTestMapping } from '@/lib/exerciseData';
import AssessmentLayout from '@/components/AssessmentLayout';

// Define test definitions
const enduranceTests = {
  wristFlexorsTest: {
    id: 'wristFlexorsTest',
    name: 'Wrist Flexors Endurance Test',
    description: 'This is a test for your wrist flexor muscles. Use a 4# Dumbbell.',
    instructions: [
      'Turn your volume up and listen to the metronome',
      'Sit as shown, follow the metronome to perform the movement',
      'Two beeps is one repetition. One beep at the top and one at the bottom',
      'Maintain control throughout the entire repetition',
      'Repeat until failure & enter your repetitions below'
    ]
  },
  wristExtensorsTest: {
    id: 'wristExtensorsTest',
    name: 'Wrist Extensors Endurance Test',
    description: 'This is a test for your wrist extensor muscles. Use a 4# Dumbbell.',
    instructions: [
      'Turn your volume up and listen to the metronome',
      'Sit as shown, follow the metronome to perform the movement',
      'Two beeps is one repetition. One beep at the top and one at the bottom',
      'Maintain control throughout the entire repetition',
      'Repeat until failure & enter your repetitions below'
    ]
  },
  thumbFlexorsTest: {
    id: 'thumbFlexorsTest',
    name: 'Thumb Flexors Endurance Test',
    description: 'This is a test for your thumb flexor muscles. Use a resistive band.',
    instructions: [
      'Turn your volume up and listen to the metronome',
      'Position as shown, with the band around your thumb',
      'Two beeps is one repetition. One beep at flexion and one at extension',
      'Maintain control throughout the entire repetition',
      'Repeat until failure & enter your repetitions below'
    ]
  },
  thumbExtensorsTest: {
    id: 'thumbExtensorsTest',
    name: 'Thumb Extensors Endurance Test',
    description: 'This is a test for your thumb extensor muscles. Use a resistive band.',
    instructions: [
      'Turn your volume up and listen to the metronome',
      'Position as shown, with the band around your thumb',
      'Two beeps is one repetition. One beep at extension and one at flexion',
      'Maintain control throughout the entire repetition',
      'Repeat until failure & enter your repetitions below'
    ]
  }
};

export default function EnduranceTest() {
  const [testsToPerform, setTestsToPerform] = useState([]);
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [reps, setReps] = useState('');
  const [results, setResults] = useState({});
  const [playingMetronome, setPlayingMetronome] = useState(false);
  const audioRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const router = useRouter();
  const { currentUser } = useAuth();

  // Initialize metronome
  useEffect(() => {
    audioRef.current = typeof Audio !== 'undefined' ? new Audio('/metronome-50bpm.mp3') : null;
    if (audioRef.current) {
      audioRef.current.loop = true;
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  // Function to toggle metronome playback
  function toggleMetronome() {
    if (audioRef.current) {
      if (playingMetronome) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } else {
        audioRef.current.play().catch(e => {
          console.error("Error playing audio:", e);
          setErrorMsg("There was an error playing the metronome. Please check your audio settings.");
        });
      }
      setPlayingMetronome(!playingMetronome);
    }
  }
  
  // Handle reps input change
  function handleRepsChange(e) {
    const value = e.target.value;
    // Allow only numbers
    if (/^\d*$/.test(value)) {
      setReps(value);
    }
  }

  // Determine which tests to perform based on user's pain regions
  useEffect(() => {
    async function loadUserData() {
      if (!currentUser) {
        router.push('/login');
        return;
      }

      try {
        // Check if previous steps are completed
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // Check for completion of previous steps
          if (!userData.userDetailsCompleted) {
            router.push('/user-details');
            return;
          }
          
          if (!userData.medicalScreeningCompleted) {
            router.push('/medical-screen');
            return;
          }
          
          if (!userData.outcomeMeasureCompleted) {
            router.push('/outcome-measure');
            return;
          }
          
          if (!userData.painRegionsCompleted) {
            router.push('/pain-region');
            return;
          }
          
          if (!userData.nerveSymptomsCompleted) {
            router.push('/nerve-symptoms');
            return;
          }
          
          if (!userData.mobilityTestCompleted) {
            router.push('/mobility-test');
            return;
          }
          
          // If already completed this step, go to next step
          if (userData.enduranceTestCompleted) {
            router.push('/nerve-mobility-test');
            return;
          }
          
          // If already completed assessment, go to dashboard
          if (userData.assessmentCompleted) {
            router.push('/dashboard');
            return;
          }
          
          // Determine tests based on pain regions
          const painRegions = userData.painRegions || {};
          
          // Get unique test IDs from pain regions
          const testIdsToRun = new Set();
          
          Object.entries(painRegions).forEach(([region, isSelected]) => {
            if (isSelected && painRegionToTestMapping[region]) {
              // Handle both array and string mappings
              const mapping = painRegionToTestMapping[region];
              if (Array.isArray(mapping)) {
                mapping.forEach(testId => testIdsToRun.add(testId));
              } else {
                testIdsToRun.add(mapping);
              }
            }
          });
          
          // Convert test IDs to test objects
          const tests = Array.from(testIdsToRun)
            .map(testId => enduranceTests[testId])
            .filter(Boolean); // Remove any undefined values
          
          // If no tests are found, use a default test
          if (tests.length === 0) {
            setTestsToPerform([enduranceTests.wristFlexorsTest, enduranceTests.wristExtensorsTest]);
          } else {
            setTestsToPerform(tests);
          }
          
          // Initialize results object
          const initialResults = {};
          tests.forEach(test => {
            initialResults[test.id] = null;
          });
          setResults(initialResults);
        } else {
          // If no user document, redirect to first step
          router.push('/user-details');
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        setErrorMsg("There was an error loading your data. Please refresh the page and try again.");
      } finally {
        setInitialLoading(false);
      }
    }
    
    loadUserData();
  }, [currentUser, router]);
  
  // Handle form submission for current test
  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!reps) {
      setSaveStatus("Error: Please enter the number of repetitions.");
      return;
    }
    
    const currentTest = testsToPerform[currentTestIndex];
    
    // Update results
    const updatedResults = {
      ...results,
      [currentTest.id]: parseInt(reps, 10)
    };
    
    setResults(updatedResults);
    
    // Reset reps input
    setReps('');
    
    // Stop metronome if playing
    if (playingMetronome && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlayingMetronome(false);
    }
    
    // Move to next test or complete
    if (currentTestIndex < testsToPerform.length - 1) {
      setCurrentTestIndex(currentTestIndex + 1);
      setSaveStatus(`Test ${currentTestIndex + 1} completed. Moving to the next test.`);
      setTimeout(() => setSaveStatus(''), 2000);
    } else {
      // All tests completed, save results to Firebase
      setLoading(true);
      setSaveStatus("Saving your results and initializing exercise program...");
      
      try {
        // Calculate 30RM for each test
        const thirtyRM = {};
        for (const [testId, repCount] of Object.entries(updatedResults)) {
          if (repCount) {
            // Formula: 30RM = 4 × (Reps to Failure/30)^0.5
            thirtyRM[testId] = 4 * Math.sqrt(repCount / 30);
          }
        }
        
        // Store results in Firebase
        await setDoc(doc(db, "users", currentUser.uid), {
          enduranceTest: updatedResults,
          thirtyRM: thirtyRM,
          enduranceTestDate: new Date(),
          enduranceTestCompleted: true
        }, { merge: true });
        
        // Initialize exercise prescriptions
        await initializeAllExercisePrescriptions(
          currentUser.uid, 
          {
            enduranceTest: updatedResults, 
            thirtyRM: thirtyRM
          }
        );
        
        setSaveStatus("Exercise program initialized successfully!");
        
        // Navigate to next page after a short delay
        setTimeout(() => {
          router.push('/nerve-mobility-test');
        }, 1500);
      } catch (error) {
        console.error("Error saving test results:", error);
        setSaveStatus("Error: There was a problem saving your results. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  }
  
  // Function to go back
  function handleBack() {
    router.push('/mobility-test');
  }

  // Current test to display
  const currentTest = testsToPerform[currentTestIndex];
  
  return (
    <AssessmentLayout
      currentStep="endurance-test"
      title="Endurance Testing"
      description={currentTest 
        ? `Test ${currentTestIndex + 1} of ${testsToPerform.length}: ${currentTest.name}`
        : "Measuring your muscle endurance"}
      loadingState={initialLoading}
      saveStatus={saveStatus}
      onBack={handleBack}
    >
      {errorMsg && (
        <div className="mb-6 p-3 bg-red-100 text-red-700 rounded">
          {errorMsg}
        </div>
      )}
      
      {testsToPerform.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-lg mb-3">No endurance tests required based on your pain regions.</p>
          <button
            onClick={async () => {
              setLoading(true);
              try {
                await setDoc(doc(db, "users", currentUser.uid), {
                  enduranceTestCompleted: true,
                  enduranceTestDate: new Date()
                }, { merge: true });
                router.push('/nerve-mobility-test');
              } catch (error) {
                console.error("Error skipping test:", error);
                setSaveStatus("Error: Could not proceed to next step");
              } finally {
                setLoading(false);
              }
            }}
            className="bg-red-500 text-white px-8 py-3 rounded-full font-medium hover:bg-red-600"
            disabled={loading}
          >
            {loading ? "Processing..." : "Continue to Next Step"}
          </button>
        </div>
      ) : currentTest ? (
        <div>
          <div className="mb-6">
            <p className="mb-4 text-gray-700">{currentTest.description}</p>
            
            {/* Image and Instructions */}
            <div className="flex flex-col md:flex-row mb-6">
              <div className="md:w-1/2 mb-4 md:mb-0 md:pr-4">
                <div className="bg-gray-200 rounded-lg h-64 flex items-center justify-center">
                  {/* Replace with actual image */}
                  <div className="text-center p-4">
                    <p className="text-gray-500">Test Demonstration</p>
                    <p className="text-sm text-gray-400">Example image would appear here</p>
                  </div>
                </div>
              </div>
              
              <div className="md:w-1/2">
                <h3 className="font-medium mb-2">Test Instructions:</h3>
                <ol className="list-decimal pl-5 space-y-2">
                  {currentTest.instructions.map((instruction, idx) => (
                    <li key={idx} className="text-gray-700">{instruction}</li>
                  ))}
                </ol>
              </div>
            </div>
            
            {/* Metronome Player */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-2">Metronome (50 BPM)</h3>
              <div className="flex items-center justify-center">
                <button 
                  onClick={toggleMetronome}
                  className={`flex items-center px-6 py-2 rounded-md ${
                    playingMetronome 
                      ? 'bg-red-100 text-red-700 border border-red-300' 
                      : 'bg-red-500 text-white hover:bg-red-600'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    {playingMetronome ? (
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                    ) : (
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    )}
                  </svg>
                  <span>{playingMetronome ? 'Stop Metronome' : 'Play Metronome'}</span>
                </button>
              </div>
            </div>
            
            {/* Rep Entry Form */}
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label htmlFor="reps" className="block text-sm font-medium text-gray-700 mb-2">
                  How many repetitions did you complete?
                </label>
                <div className="flex">
                  <input
                    id="reps"
                    type="text"
                    value={reps}
                    onChange={handleRepsChange}
                    className="shadow-sm rounded-l-md w-full py-3 px-4 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Enter number of reps"
                    required
                  />
                  <button
                    type="submit"
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-r-md"
                    disabled={loading}
                  >
                    {loading ? "Saving..." : "Continue"}
                  </button>
                </div>
              </div>
            </form>
            
            {/* Progress Indicator */}
            <div className="mt-8">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Progress</span>
                <span className="text-sm font-medium text-gray-700">
                  {Math.round(((currentTestIndex + 1) / testsToPerform.length) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-red-600 h-2.5 rounded-full" 
                  style={{ width: `${((currentTestIndex + 1) / testsToPerform.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex justify-center py-8">
          <div className="w-12 h-12 border-4 border-t-red-500 border-gray-200 border-solid rounded-full animate-spin"></div>
        </div>
      )}
    </AssessmentLayout>
  );
}