import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { getUserData } from '@/lib/firestoreUtils';
import { hasCompletedAssessment, isProUser } from '@/lib/userUtils';
import QuickStats from '@/components/QuickStats';
import ProtectedPage from '@/components/layouts/ProtectedPage';
import { 
  exerciseLibrary, 
  exercisesByPainRegion, 
  getExercisesForMultiplePainRegions,
  painRegionToTestMapping
} from '@/lib/exerciseData';
import { getExercisePrescription } from '@/lib/exercisePrescriptionUtils';

// Pain region data with descriptions
const painRegionData = {
  wristExtensors: {
    name: "Wrist / Hand Extensors",
    description: "Pain on the back side of the wrist is often related to irritation of the wrist extensor tendons. These muscles and tendons are responsible for lifting up the finger and wrist each time a new button is pressed or action is completed. Whether that is clicking the mouse/keyboard, using your finger to hit a controller trigger, or tapping something on the mobile device. Click about plan to learn more",
    image: "/images/pain-regions/wristExtensors.png"
  },
  thumbExtensors: {
    name: "Thumb Extensors",
    description: "Pain in the thumb extensor tendons can occur from excessive typing, gaming, or mobile device use. These tendons help you lift and extend your thumb away from your palm. Often irritated from repetitive button pressing or touchscreen use, this area requires specific targeted exercises to build resilience.",
    image: "/images/pain-regions/thumbExtensors.png"
  },
  wristFlexors: {
    name: "Wrist Flexors",
    description: "This is one of the most commonly reported pain patterns for RSI is palm-side wrist pain. This area is commonly injured due to the stress and strain put on the finger flexors. This typically is irritation of just one or multiple tendons that cross the wrist and leads to the tips of the fingers. These muscles/tendons are responsible for gripping actions and are used constantly during gaming or typing.",
    image: "/images/pain-regions/wristFlexors.png"
  },
  fingers: {
    name: "Fingers",
    description: "Pain in multiple fingers may indicate irritation in several different tendons or a more systemic issue. The finger extensors and flexors work together to control precise finger movements needed for typing, gaming, and other repetitive tasks. This requires a comprehensive approach to address all affected areas.",
    image: "/images/pain-regions/fingers.png"
  },
  ulnarSideExtensors: {
    name: "Ulnar Side Extensors",
    description: "Pain along the ulnar (pinky) side of the forearm on the back side is often related to the muscles that extend the wrist and move it toward the pinky side. This area can be irritated from repetitive typing or gaming that involves frequent ulnar deviation of the wrist.",
    image: "/images/pain-regions/ulnarSideExtensors.png"
  },
  ulnarSideFlexors: {
    name: "Ulnar Side Flexors",
    description: "Pain along the ulnar (pinky) side of the forearm on the palm side relates to the flexor muscles that bend the wrist and move it toward the pinky side. These muscles can become irritated from activities requiring strong grip combined with wrist movement.",
    image: "/images/pain-regions/ulnarSideFlexors.png"
  },
  pinkyFlexors: {
    name: "Pinky Flexors",
    description: "Pain in the muscles controlling the pinky finger can occur from repetitive gripping or typing activities. The pinky is often used for reaching for modifier keys on a keyboard, which can strain these smaller, more specialized muscles.",
    image: "/images/pain-regions/pinkyFlexors.png"
  },
  thumbFlexors: {
    name: "Thumb Flexors",
    description: "Pain in the thumb flexors occurs in the muscles that bend the thumb inward toward the palm. These muscles are heavily used in gripping, typing, and especially in mobile device usage where the thumbs do most of the work.",
    image: "/images/pain-regions/thumbFlexors.png"
  }
};

export default function Dashboard() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [selectedPainRegion, setSelectedPainRegion] = useState(null);
  const [availablePainRegions, setAvailablePainRegions] = useState([]);
  const [healthScore, setHealthScore] = useState(10); // Default health score
  const [recommendedExercises, setRecommendedExercises] = useState([]);
  const [weightUnit, setWeightUnit] = useState('lbs');

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
        
        // Set weight unit preference if available
        if (userDoc?.preferences?.weightUnit) {
          setWeightUnit(userDoc.preferences.weightUnit);
        }
        
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
          
          // Get recommended exercises based on pain regions and user status
          const userHasProAccess = isProUser(userDoc);
          const exercises = getRecommendedExercises(selectedRegions, userHasProAccess);
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
  function getRecommendedExercises(selectedRegions, userHasProAccess) {
    // Get all exercises for the selected pain regions
    const allExercises = getExercisesForMultiplePainRegions(selectedRegions);
    
    // Filter exercises for free users
    const accessibleExercises = userHasProAccess 
      ? allExercises 
      : allExercises.filter(ex => ex.isFree);
    
    // Ensure we have a good mix by separating the exercises by type
    const stretches = accessibleExercises.filter(ex => ex.category === 'stretches');
    const strength = accessibleExercises.filter(ex => ex.category === 'strength');
    const isometrics = accessibleExercises.filter(ex => ex.category === 'isometrics');
    
    // Create a balanced set of exercises (total of 4)
    const selectedExercises = [];
    
    // Add a variety of exercise types (prefer stretches and strength)
    if (stretches.length > 0) {
      selectedExercises.push(stretches[0]);
    }
    
    if (strength.length > 0) {
      selectedExercises.push(strength[0]);
    }
    
    if (isometrics.length > 0 && selectedExercises.length < 2) {
      selectedExercises.push(isometrics[0]);
    }
    
    // Fill remaining spots with whatever exercises are available
    const remainingExercises = accessibleExercises.filter(ex => 
      !selectedExercises.some(selected => selected.id === ex.id)
    );
    
    // Fill in up to 4 total exercises
    while (selectedExercises.length < 4 && remainingExercises.length > 0) {
      const index = selectedExercises.length % remainingExercises.length;
      selectedExercises.push(remainingExercises[index]);
      remainingExercises.splice(index, 1);
    }
    
    // If we still don't have 4, fill with locked premium exercises for free users
    if (!userHasProAccess && selectedExercises.length < 4) {
      const premiumExercises = allExercises.filter(ex => !ex.isFree);
      
      for (let i = 0; i < premiumExercises.length && selectedExercises.length < 4; i++) {
        selectedExercises.push(premiumExercises[i]);
      }
    }
    
    // Return exactly 4 exercises or as many as available if less than 4
    return selectedExercises.slice(0, 4);
  }
  
  // Function to convert weight between units
  function convertWeight(weight, fromUnit, toUnit) {
    if (fromUnit === toUnit) return weight;
    
    if (fromUnit === 'lbs' && toUnit === 'kg') {
      return Math.round((weight / 2.20462) * 10) / 10; // Round to 1 decimal place
    } else if (fromUnit === 'kg' && toUnit === 'lbs') {
      return Math.round(weight * 2.20462); // Round to whole number
    }
    
    return weight; // Default: no conversion
  }
  
  // Function to display weight with unit
  function getDisplayWeight(exercise) {
    if (!exercise || exercise.weightType === 'none') return '';
    
    // For non-weight exercises (bands, bodyweight), return as is
    if (exercise.weightType !== 'weight') {
      return `${exercise.defaultWeight || 1}${exercise.weightUnit || ''}`;
    }
    
    // Handle unit conversion for weight exercises
    const baseWeight = exercise.defaultWeight || 0;
    const baseUnit = exercise.weightUnit || 'lbs';
    const displayWeight = convertWeight(baseWeight, baseUnit, weightUnit);
    
    return `${displayWeight} ${weightUnit}`;
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
  
  // Get the selected region data
  const selectedRegionData = painRegionData[selectedPainRegion];
  
  // Check if user has pro status using the standardized utility
  const userHasProStatus = isProUser(userData);
  
  return (
    <ProtectedPage>
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Current Plan</h1>
      </header>
      
      {/* Pain Region Section */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Pain Region</h3>
        <div className="flex flex-wrap gap-4 mb-4">
          {/* Display user's available pain regions with proper images */}
          {availablePainRegions.map(regionId => (
            <div 
              key={regionId}
              className={`relative cursor-pointer ${selectedPainRegion === regionId ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => handlePainRegionSelect(regionId)}
            >
              <div className="h-32 w-24 bg-white-100 relative overflow-hidden">
                <Image 
                  src={painRegionData[regionId].image}
                  alt={painRegionData[regionId].name}
                  fill
                  style={{ objectFit: 'contain' }}
                />
              </div>
              {/* Colored overlay to indicate pain region */}
              
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
            <div className="absolute inset-0 bg-gray-200">
              {/* You can add the healthbar background image here */}
              {/* <img src="/healthbar-bg.png" alt="Health Bar" className="w-full h-full object-cover" /> */}
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
          {/* Show first 2 exercises normally for all users */}
          {recommendedExercises.slice(0, userHasProStatus ? 4 : 2).map((exercise, index) => (
            <div key={`${exercise.id}-${index}`} className="bg-white p-2 shadow-sm border-a rounded mb-2">
              <div className="w-full h-36 mb-1 overflow-hidden">
                {exercise.imageUrl ? (
                  <img 
                    src={exercise.imageUrl}
                    alt={exercise.name.replace(/\*/g, '')}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-gray-500">Exercise Image</span>
                )}
              </div>
              <p className="text-center text-red-500 font-normal">{exercise.name.replace(/\*/g, '')}</p>
              {exercise.weightType !== 'none' && (
                <p className="text-center text-xs text-gray-600">{getDisplayWeight(exercise)}</p>
              )}
            </div>
          ))}
          
          {/* For non-pro users, show locked exercises */}
          {!userHasProStatus && recommendedExercises.slice(2, 4).map((exercise, index) => (
            <div key={`${exercise.id}-locked-${index}`} className="bg-white p-2 rounded mb-2 relative">
              {/* Locked overlay */}
              <div className="absolute inset-0 bg-gray-600 bg-opacity-75 flex flex-col items-center justify-center z-10 rounded">
                <div className="bg-red-500 rounded-full p-2 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <p className="text-white text-xs text-center px-2">Upgrade to Pro to unlock</p>
              </div>
              
              {/* Exercise content (blurred) */}
              <div className="blur-sm">
                <div className="w-full h-36 mb-1 overflow-hidden">
                  {exercise.imageUrl ? (
                    <img 
                      src={exercise.imageUrl}
                      alt={exercise.name.replace(/\*/g, '')}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-gray-500">Exercise Image</span>
                  )}
                </div>
                <p className="text-center text-red-500 font-normal">{exercise.name.replace(/\*/g, '')}</p>
                {exercise.weightType !== 'none' && (
                  <p className="text-center text-xs text-gray-600">{getDisplayWeight(exercise)}</p>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex items-center">
          <Link href="/exercise-program" className="text-red-500 font-medium flex items-center">
            See More
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-0">
              {/* Wrist Flexor Endurance - Free stat */}
              <div className="bg-white p-4 border-b border-r">
                <h4 className="font-medium text-gray-800 mb-2">Wrist Flexor Endurance</h4>
                <p className="text-xl font-bold">
                  {userData?.wristFlexorEndurance?.weight || 6} {userData?.preferences?.weightUnit || 'lbs'}
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
              <div className="bg-white p-4 border-b border-r">
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
              <div className="bg-white p-4 border-b">
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
            </div>
            
            <div className="mt-4">
              <Link href="/progress-statistics" className="text-red-500 font-medium flex items-center">
                See More
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        )}
      </div>
    </ProtectedPage>
  );
}