import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getUserData } from '@/lib/firestoreUtils';
import { hasCompletedAssessment, isProUser } from '@/lib/userUtils'; // Import the isProUser utility
import Image from 'next/image';
import QuickStats from '@/components/QuickStats';


// Pain region data with descriptions
const painRegionData = {
  wristExtensors: {
    name: "Wrist / Hand Extensors",
    description: "Pain on the back side of the wrist is often related to irritation of the wrist extensor tendons. These muscles and tendons are responsible for lifting up the finger and wrist each time a new button is pressed or action is completed. Whether that is clicking the mouse/keyboard, using your finger to hit a controller trigger, or tapping something on the mobile device. Click about plan to learn more",
    image: "/wrist-extensors.jpg"
  },
  thumbExtensors: {
    name: "Thumb Extensors",
    description: "Pain in the thumb extensor tendons can occur from excessive typing, gaming, or mobile device use. These tendons help you lift and extend your thumb away from your palm. Often irritated from repetitive button pressing or touchscreen use, this area requires specific targeted exercises to build resilience.",
    image: "/thumb-extensors.jpg"
  },
  wristFlexors: {
    name: "Wrist Flexors",
    description: "This is one of the most commonly reported pain patterns for RSI is palm-side wrist pain. This area is commonly injured due to the stress and strain put on the finger flexors. This typically is irritation of just one or multiple tendons that cross the wrist and leads to the tips of the fingers. These muscles/tendons are responsible for gripping actions and are used constantly during gaming or typing.",
    image: "/wrist-flexors.jpg"
  },
  fingers: {
    name: "Fingers",
    description: "Pain in multiple fingers may indicate irritation in several different tendons or a more systemic issue. The finger extensors and flexors work together to control precise finger movements needed for typing, gaming, and other repetitive tasks. This requires a comprehensive approach to address all affected areas.",
    image: "/fingers.jpg"
  },
  ulnarSideExtensors: {
    name: "Ulnar Side Extensors",
    description: "Pain along the ulnar (pinky) side of the forearm on the back side is often related to the muscles that extend the wrist and move it toward the pinky side. This area can be irritated from repetitive typing or gaming that involves frequent ulnar deviation of the wrist.",
    image: "/ulnar-extensors.jpg"
  },
  ulnarSideFlexors: {
    name: "Ulnar Side Flexors",
    description: "Pain along the ulnar (pinky) side of the forearm on the palm side relates to the flexor muscles that bend the wrist and move it toward the pinky side. These muscles can become irritated from activities requiring strong grip combined with wrist movement.",
    image: "/ulnar-flexors.jpg"
  },
  pinkyFlexors: {
    name: "Pinky Flexors",
    description: "Pain in the muscles controlling the pinky finger can occur from repetitive gripping or typing activities. The pinky is often used for reaching for modifier keys on a keyboard, which can strain these smaller, more specialized muscles.",
    image: "/pinky-flexors.jpg"
  },
  thumbFlexors: {
    name: "Thumb Flexors",
    description: "Pain in the thumb flexors occurs in the muscles that bend the thumb inward toward the palm. These muscles are heavily used in gripping, typing, and especially in mobile device usage where the thumbs do most of the work.",
    image: "/thumb-flexors.jpg"
  }
};

// Exercise library from the exercise-program.js
const exerciseLibrary = {
  wristFlexors: [
    { 
      id: 'wristFlexorStretch', 
      name: 'Wrist Flexor Stretch*',
      category: 'stretches',
      sets: '3 Sets of 20-30 Seconds',
      instructions: 'With your elbow straight, use your opposite hand to bend your wrist upward until you feel a stretch on the bottom of your forearm. Hold for 20-30 seconds.',
      imageUrl: '/exercises/wrist-flexor-stretch.jpg',
      isFree: true
    },
    { 
      id: 'dbWristFlexion', 
      name: 'DB Wrist Flexion*',
      category: 'strength',
      reps: '25',
      weight: '6lbs',
      instructions: 'Sit with your forearm resting on a table, palm facing up, with wrist at the edge. Hold a dumbbell and lower it down, then curl it up using only your wrist.',
      imageUrl: '/exercises/db-wrist-flexion.jpg',
      isFree: true
    },
    { 
      id: 'isometricWristFlexion', 
      name: 'Isometric Wrist Flexion*',
      category: 'isometrics',
      duration: '3 Sets of 45 Seconds',
      rest: 'Rest 30 Seconds Between Sets',
      instructions: 'Place your palm against a stable surface. Push into the surface without moving your wrist, creating tension in your flexor muscles.',
      imageUrl: '/exercises/isometric-wrist-flexion.jpg',
      isFree: true
    },
  ],
  // Other exercise categories are omitted for brevity
};

export default function Dashboard() {
  const { currentUser, logout } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [selectedPainRegion, setSelectedPainRegion] = useState(null);
  const [availablePainRegions, setAvailablePainRegions] = useState([]);
  const [healthScore, setHealthScore] = useState(10); // Default health score
  const [recommendedExercises, setRecommendedExercises] = useState([]);
  
  useEffect(() => {
    // If not logged in, redirect to login
    if (!currentUser) {
      router.push('/login');
      return;
    }
    
    const loadUserData = async () => {
      try {
        // First check if user has completed the assessment
        const isAssessmentCompleted = await hasCompletedAssessment(currentUser.uid);
        
        // If assessment not completed, redirect to medical screen
        if (!isAssessmentCompleted) {
          router.push('/medical-screen');
          return;
        }
        
        // Fetch user data from Firestore
        const userDoc = await getUserData(currentUser.uid);
        setUserData(userDoc);
        
        // Process pain regions
        if (userDoc && userDoc.painRegions) {
          // Convert painRegions object to array of selected region IDs
          const selectedRegions = Object.entries(userDoc.painRegions)
            .filter(([_, isSelected]) => isSelected)
            .map(([regionId, _]) => regionId);
          
          setAvailablePainRegions(selectedRegions);
          
          // Set default selected region to the first available one
          if (selectedRegions.length > 0) {
            setSelectedPainRegion(selectedRegions[0]);
          }
          
          // Get recommended exercises based on pain regions
          const exercises = getRecommendedExercises(selectedRegions);
          setRecommendedExercises(exercises);
        }
        
        // Calculate health score from QuickDASH score
        if (userDoc && userDoc.latestQuickDashScore !== undefined) {
          // Invert the scale: 100 QuickDASH = 0 HP, 0 QuickDASH = 100 HP
          const hp = Math.max(0, 100 - userDoc.latestQuickDashScore);
          setHealthScore(hp);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadUserData();
  }, [currentUser, router]);
  
// Function to get recommended exercises based on pain regions
function getRecommendedExercises(selectedRegions) {
  // Collect all exercises from selected pain regions
  const allExercises = [];
  
  // Get exercises from each selected pain region
  selectedRegions.forEach(regionId => {
    if (exerciseLibrary[regionId]) {
      exerciseLibrary[regionId].forEach(exercise => {
        // Check if this exercise is already in the list to avoid duplicates
        const isDuplicate = allExercises.some(ex => ex.id === exercise.id);
        if (!isDuplicate) {
          // Add region ID to each exercise for reference
          allExercises.push({
            ...exercise,
            painRegion: regionId
          });
        }
      });
    }
  });
  
  // Ensure we have a good mix by separating the exercises by type
  const stretches = allExercises.filter(ex => ex.category === 'stretches');
  const strength = allExercises.filter(ex => ex.category === 'strength');
  const isometrics = allExercises.filter(ex => ex.category === 'isometrics');
  
  // Separate free and premium exercises
  const freeStretches = stretches.filter(ex => ex.isFree);
  const freeStrength = strength.filter(ex => ex.isFree);
  const freeIsometrics = isometrics.filter(ex => ex.isFree);
  
  const premiumExercises = allExercises.filter(ex => !ex.isFree);
  
  // Create a balanced set of exercises
  const selectedExercises = [];
  
  // First, ensure we have 2 free exercises for all users
  // Try to get a stretch and a strength exercise
  if (freeStretches.length > 0) {
    selectedExercises.push(freeStretches[0]);
  }
  
  if (freeStrength.length > 0) {
    selectedExercises.push(freeStrength[0]);
  }
  
  // If we don't have 2 yet, try an isometric
  if (selectedExercises.length < 2 && freeIsometrics.length > 0) {
    selectedExercises.push(freeIsometrics[0]);
  }
  
  // If we still don't have 2, add any remaining free exercises
  const allFreeExercises = allExercises.filter(ex => ex.isFree);
  while (selectedExercises.length < 2 && allFreeExercises.length > 0) {
    // Find an exercise we haven't added yet
    const remainingFree = allFreeExercises.filter(ex => 
      !selectedExercises.some(selected => selected.id === ex.id)
    );
    
    if (remainingFree.length > 0) {
      selectedExercises.push(remainingFree[0]);
    } else {
      break;
    }
  }
  
  // Now add 2 premium exercises for the locked slots (or additional free ones if not enough premium)
  if (premiumExercises.length > 0) {
    selectedExercises.push(premiumExercises[0]);
  } else {
    // If no premium exercises, add another free one
    const unusedFree = allFreeExercises.filter(ex => 
      !selectedExercises.some(selected => selected.id === ex.id)
    );
    if (unusedFree.length > 0) {
      selectedExercises.push(unusedFree[0]);
    }
  }
  
  if (premiumExercises.length > 1) {
    selectedExercises.push(premiumExercises[1]);
  } else {
    // If not enough premium exercises, add another free one
    const unusedFree = allFreeExercises.filter(ex => 
      !selectedExercises.some(selected => selected.id === ex.id)
    );
    if (unusedFree.length > 0) {
      selectedExercises.push(unusedFree[0]);
    } else if (selectedExercises.length > 0) {
      // If we've run out of exercises, duplicate one with a modified ID
      selectedExercises.push({
        ...selectedExercises[0],
        id: `${selectedExercises[0].id}-alt`
      });
    }
  }
  
  // Ensure we have exactly 4 exercises
  while (selectedExercises.length < 4) {
    if (selectedExercises.length > 0) {
      // If we've run out of exercises, duplicate existing ones
      const index = selectedExercises.length % selectedExercises.length;
      selectedExercises.push({
        ...selectedExercises[index],
        id: `${selectedExercises[index].id}-copy-${selectedExercises.length}`
      });
    } else {
      // Fallback to avoid infinite loop if we somehow have no exercises
      break;
    }
  }
  
  // Return exactly 4 exercises
  return selectedExercises.slice(0, 4);
}
  
  function handlePainRegionSelect(regionId) {
    setSelectedPainRegion(regionId);
  }
  
  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-red-500 border-gray-200 border-solid rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }
  
  // If not authenticated, don't render anything (redirect will happen in useEffect)
  if (!currentUser) {
    return null;
  }

  // Get the selected region data
  const selectedRegionData = painRegionData[selectedPainRegion];
  
  // Check if user has pro status using the standardized utility
  const userHasProStatus = isProUser(userData);
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Header */}
      <header className="bg-white shadow-sm p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
              <span className="text-white font-bold">1HP</span>
            </div>
            <span className="font-bold text-lg">1HP Troubleshooter</span>
          </div>
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="text-gray-700 hover:text-red-500">Home</Link>
            <Link href="#" className="text-gray-700 hover:text-red-500">Talk to an Expert</Link>
            <Link href="#" className="text-gray-700 hover:text-red-500">Addons</Link>
            <Link href="/exercise-program" className="bg-red-500 text-white px-4 py-2 rounded-full hover:bg-red-600">Today's Exercises</Link>
            <button 
              onClick={logout}
              className="text-gray-700 hover:text-red-500"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r p-6">
          <nav className="space-y-4">
            <Link href="/dashboard" className="block text-gray-800 font-medium hover:text-red-500">Home</Link>
            <Link href="/about-plan" className="block text-gray-800 font-medium hover:text-red-500">About Plan</Link>
            <Link href="/exercise-program" className="block text-gray-800 font-medium hover:text-red-500">Exercise Program</Link>
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
        <main className="flex-1 p-8 bg-gray-50">
          <h2 className="text-2xl font-bold mb-6">Current Plan</h2>
          
          {/* Pain Region Section */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Pain Region</h3>
            <div className="flex space-x-4 mb-4">
              {/* Only display user's available pain regions */}
              {availablePainRegions.map(regionId => (
                <div 
                  key={regionId}
                  className={`relative cursor-pointer ${selectedPainRegion === regionId ? 'ring-2 ring-blue-500' : ''}`}
                  onClick={() => handlePainRegionSelect(regionId)}
                >
                  {/* Using a div with background color as placeholder; replace with actual image in production */}
                  <div className="h-32 w-24 bg-gray-200 flex items-center justify-center">
                    <span className="text-xs text-center">
                      {painRegionData[regionId].name.split(' ').map(word => (
                        <div key={word}>{word}</div>
                      ))}
                    </span>
                  </div>
                  <div className="absolute inset-0 bg-red-500 bg-opacity-30"></div>
                </div>
              ))}
            </div>
            
            {/* Selected Pain Region Names */}
            <div>
              {availablePainRegions.map(regionId => (
                <p key={regionId} className="font-medium">{painRegionData[regionId].name}</p>
              ))}
            </div>
            
            {/* Health Status Bar */}
            <div className="mt-4 mb-2">
              <div className="relative h-6 rounded-full overflow-hidden">
                {/* Healthbar background */}
                <div className="absolute inset-0">
                  {/* You can add the healthbar background image here */}
                  {/* <Image src="/healthbar-bg.png" alt="Health Bar" layout="fill" objectFit="cover" /> */}
                </div>
                {/* Colored health fill */}
                <div 
                  className="absolute top-0 left-0 h-full bg-red-500" 
                  style={{ width: `${healthScore}%` }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-end pr-3">
                  <span className="text-white text-sm font-bold shadow-sm">
                    {Math.round(healthScore)}/100
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Problem Overview */}
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-2">Problem Overview</h3>
            <p className="text-gray-700">
              {selectedRegionData?.description || "Please select a pain region."}
            </p>
          </div>
          
          {/* Exercise Program */}
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4">Exercise Program</h3>
            <div className="flex flex-wrap gap-4 mb-4">
              {/* Show first 2 exercises normally for all users */}
              {recommendedExercises.slice(0, 2).map((exercise, index) => (
                <div key={`${exercise.id}-${index}`} className="bg-gray-100 p-4 rounded-lg w-40">
                  <div className="bg-gray-300 w-full h-32 mb-2 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500">Exercise Image</span>
                  </div>
                  <p className="text-center text-sm">{exercise.name}</p>
                </div>
              ))}
              
              {/* For non-pro users, show locked exercises */}
              {!userHasProStatus && recommendedExercises.slice(2, 4).map((exercise, index) => (
                <div key={`${exercise.id}-locked-${index}`} className="bg-gray-100 p-4 rounded-lg w-40 relative">
                  {/* Locked overlay */}
                  <div className="absolute inset-0 bg-gray-600 bg-opacity-75 flex flex-col items-center justify-center z-10 rounded-lg">
                    <div className="bg-red-500 rounded-full p-2 mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <p className="text-white text-xs text-center px-2">Upgrade to Pro to unlock</p>
                  </div>
                  
                  {/* Exercise content (blurred) */}
                  <div className="blur-sm">
                    <div className="bg-gray-300 w-full h-32 mb-2 rounded-lg flex items-center justify-center">
                      <span className="text-gray-500">Exercise Image</span>
                    </div>
                    <p className="text-center text-sm">{exercise.name}</p>
                  </div>
                </div>
              ))}
              
              {/* For pro users, show all exercises normally */}
              {userHasProStatus && recommendedExercises.slice(2, 4).map((exercise, index) => (
                <div key={`${exercise.id}-pro-${index}`} className="bg-gray-100 p-4 rounded-lg w-40">
                  <div className="bg-gray-300 w-full h-32 mb-2 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500">Exercise Image</span>
                  </div>
                  <p className="text-center text-sm">{exercise.name}</p>
                </div>
              ))}
              
              <div className="flex items-center">
                <Link href="/exercise-program" className="text-blue-600 font-medium flex items-center">
                  See More
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
          
          {/* Your Attributes */}
          <div>
            {isProUser(userData) ? (
              // Pro User View: Full Quick Stats
              <QuickStats userData={userData} />
            ) : (
              // Free User View: Limited Stats with Upgrade Prompts
              <div>
                <h3 className="text-xl font-bold mb-4">Your Attributes</h3>
                <div className="flex flex-wrap gap-4">
                  {/* Wrist Flexor Endurance - Free stat */}
                  <div className="bg-white p-4 rounded-lg shadow w-48">
                    <h4 className="font-medium text-gray-800 mb-2">Wrist Flexor Endurance</h4>
                    <p className="text-xl font-bold">
                      {userData?.wristFlexorEndurance?.weight || 6} Lbs
                    </p>
                    <p className="text-xl font-bold">
                      {userData?.wristFlexorEndurance?.repMax || 40} Rep Max
                    </p>
                    <p className={(userData?.wristFlexorEndurance?.percentChange || 8) > 0 ? "text-green-500" : "text-red-500"}>
                      {(userData?.wristFlexorEndurance?.percentChange || 8) > 0 ? "+" : ""}
                      {userData?.wristFlexorEndurance?.percentChange || 8}% from last week
                    </p>
                  </div>
                  
                  {/* Average Activity Time - Locked Premium Feature */}
                  <div className="bg-white p-4 rounded-lg shadow w-48">
                    <h4 className="font-medium text-gray-800 mb-2">Average Activity Time</h4>
                    <div className="flex justify-center my-4">
                      <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <div className="text-center">
                      <Link href="/go-pro" className="bg-red-500 text-white px-4 py-1 rounded-full text-sm hover:bg-red-600">Unlock</Link>
                    </div>
                  </div>
                  
                  {/* Pain Level Stats - Locked Premium Feature */}
                  <div className="bg-white p-4 rounded-lg shadow w-48">
                    <h4 className="font-medium text-gray-800 mb-2">Pain Level Analytics</h4>
                    <div className="flex justify-center my-4">
                      <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <div className="text-center">
                      <Link href="/go-pro" className="bg-red-500 text-white px-4 py-1 rounded-full text-sm hover:bg-red-600">Unlock</Link>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Link href="/progress-statistics" className="text-blue-600 font-medium flex items-center">
                      See More
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}