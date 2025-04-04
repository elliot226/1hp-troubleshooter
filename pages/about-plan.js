// pages/about-plan.js
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { getUserData } from '@/lib/firestoreUtils';
import ProtectedPage from '@/components/layouts/ProtectedPage';

// Pain region data with descriptions and anatomy information
const painRegionData = {
  wristExtensors: {
    name: "Wrist / Hand Extensors",
    description: "Pain on the back side of the wrist is often related to irritation of the wrist extensor tendons. These muscles and tendons are responsible for lifting up the finger and wrist each time a new button is pressed or action is completed. Whether that is clicking the mouse/keyboard, using your finger to hit a controller trigger, or tapping something on the mobile device.",
    image: "/images/pain-regions/wristExtensors.png",
    anatomyImage: "/images/anatomy/wristExtensors.jpg",
    structure: {
      name: "Extensor Digitorum",
      type: "Tendon & Muscle",
      actions: "Wrist / Finger Extension"
    }
  },
  thumbExtensors: {
    name: "Thumb Extensors",
    description: "Pain in the thumb extensor tendons can occur from excessive typing, gaming, or mobile device use. These tendons help you lift and extend your thumb away from your palm. Often irritated from repetitive button pressing or touchscreen use, this area requires specific targeted exercises to build resilience.",
    image: "/images/pain-regions/thumbExtensors.png",
    anatomyImage: "/images/anatomy/thumbExtensors.jpg",
    structure: {
      name: "Extensor Pollicis Longus/Brevis",
      type: "Tendon & Muscle",
      actions: "Thumb Extension"
    }
  },
  wristFlexors: {
    name: "Wrist Flexors",
    description: "This is one of the most commonly reported pain patterns for RSI is palm-side wrist pain. This area is commonly injured due to the stress and strain put on the finger flexors. This typically is irritation of just one or multiple tendons that cross the wrist and leads to the tips of the fingers. These muscles/tendons are responsible for gripping actions and are used constantly during gaming or typing.",
    image: "/images/pain-regions/wristFlexors.png",
    anatomyImage: "/images/anatomy/wristFlexors.jpg",
    structure: {
      name: "Flexor Digitorum",
      type: "Tendon & Muscle",
      actions: "Wrist / Finger Flexion"
    }
  },
  fingers: {
    name: "Fingers",
    description: "Pain in multiple fingers may indicate irritation in several different tendons or a more systemic issue. The finger extensors and flexors work together to control precise finger movements needed for typing, gaming, and other repetitive tasks. This requires a comprehensive approach to address all affected areas.",
    image: "/images/pain-regions/fingers.png",
    anatomyImage: "/images/anatomy/fingers.jpg",
    structure: {
      name: "Finger Flexors & Extensors",
      type: "Tendons & Muscles",
      actions: "Finger Movement"
    }
  },
  ulnarSideExtensors: {
    name: "Ulnar Side Extensors",
    description: "Pain along the ulnar (pinky) side of the forearm on the back side is often related to the muscles that extend the wrist and move it toward the pinky side. This area can be irritated from repetitive typing or gaming that involves frequent ulnar deviation of the wrist.",
    image: "/images/pain-regions/ulnarSideExtensors.png",
    anatomyImage: "/images/anatomy/ulnarSideExtensors.jpg",
    structure: {
      name: "Extensor Carpi Ulnaris",
      type: "Tendon & Muscle",
      actions: "Wrist Extension & Ulnar Deviation"
    }
  },
  ulnarSideFlexors: {
    name: "Ulnar Side Flexors",
    description: "Pain along the ulnar (pinky) side of the forearm on the palm side relates to the flexor muscles that bend the wrist and move it toward the pinky side. These muscles can become irritated from activities requiring strong grip combined with wrist movement.",
    image: "/images/pain-regions/ulnarSideFlexors.png",
    anatomyImage: "/images/anatomy/ulnarSideFlexors.jpg",
    structure: {
      name: "Flexor Carpi Ulnaris",
      type: "Tendon & Muscle",
      actions: "Wrist Flexion & Ulnar Deviation"
    }
  },
  pinkyFlexors: {
    name: "Pinky Flexors",
    description: "Pain in the muscles controlling the pinky finger can occur from repetitive gripping or typing activities. The pinky is often used for reaching for modifier keys on a keyboard, which can strain these smaller, more specialized muscles.",
    image: "/images/pain-regions/pinkyFlexors.png",
    anatomyImage: "/images/anatomy/pinkyFlexors.jpg",
    structure: {
      name: "Flexor Digiti Minimi",
      type: "Tendon & Muscle",
      actions: "Pinky Finger Flexion"
    }
  },
  thumbFlexors: {
    name: "Thumb Flexors",
    description: "Pain in the thumb flexors occurs in the muscles that bend the thumb inward toward the palm. These muscles are heavily used in gripping, typing, and especially in mobile device usage where the thumbs do most of the work.",
    image: "/images/pain-regions/thumbFlexors.png",
    anatomyImage: "/images/anatomy/thumbFlexors.jpg",
    structure: {
      name: "Flexor Pollicis Longus/Brevis",
      type: "Tendon & Muscle",
      actions: "Thumb Flexion"
    }
  }
};

export default function AboutPlan() {
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [availablePainRegions, setAvailablePainRegions] = useState([]);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [impairments, setImpairments] = useState({
    muscleLength: {
      isImpaired: false,
      severity: 'none',
      details: []
    },
    endurance: {
      isImpaired: false,
      severity: 'none',
      details: [],
      scores: {}
    },
    neuralTension: {
      isImpaired: false,
      severity: 'none',
      details: []
    }
  });
  const [videoLoaded, setVideoLoaded] = useState(false);
  
  const { currentUser } = useAuth();

  // Load user data and assessment information
  useEffect(() => {
    async function loadUserData() {
      if (!currentUser) return;
      
      try {
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
            setSelectedRegion(selectedRegions[0]);
          }
        }
        
        // Process detailed impairments data from assessments
        const mobilityTest = userDoc?.mobilityTest || {};
        const enduranceTest = userDoc?.enduranceTest || {};
        const nerveMobilityTest = userDoc?.nerveMobilityTest || {};
        
        // Process muscle length impairment
        const muscleLength = {
          isImpaired: false,
          severity: 'none',
          details: []
        };
        
        if (mobilityTest.wristFlexorMobility === 'severe' || mobilityTest.wristExtensorMobility === 'severe') {
          muscleLength.isImpaired = true;
          muscleLength.severity = 'severe';
          
          if (mobilityTest.wristFlexorMobility === 'severe') {
            muscleLength.details.push('Wrist Flexor Mobility Severely Limited');
          }
          if (mobilityTest.wristExtensorMobility === 'severe') {
            muscleLength.details.push('Wrist Extensor Mobility Severely Limited');
          }
        } else if (mobilityTest.wristFlexorMobility === 'mild' || mobilityTest.wristExtensorMobility === 'mild') {
          muscleLength.isImpaired = true;
          muscleLength.severity = 'mild';
          
          if (mobilityTest.wristFlexorMobility === 'mild') {
            muscleLength.details.push('Wrist Flexor Mobility Mildly Limited');
          }
          if (mobilityTest.wristExtensorMobility === 'mild') {
            muscleLength.details.push('Wrist Extensor Mobility Mildly Limited');
          }
        }
        
        // Process endurance impairment
        const endurance = {
          isImpaired: true, // Everyone needs endurance work
          severity: 'moderate', // Default moderate
          details: [],
          scores: {}
        };
        
        // Check for low endurance test scores (below 50 reps)
        if (enduranceTest.wristFlexorsTest && enduranceTest.wristFlexorsTest < 50) {
          endurance.details.push(`Wrist Flexor Endurance: ${enduranceTest.wristFlexorsTest} reps`);
          endurance.scores.wristFlexors = enduranceTest.wristFlexorsTest;
        }
        
        if (enduranceTest.wristExtensorsTest && enduranceTest.wristExtensorsTest < 50) {
          endurance.details.push(`Wrist Extensor Endurance: ${enduranceTest.wristExtensorsTest} reps`);
          endurance.scores.wristExtensors = enduranceTest.wristExtensorsTest;
        }
        
        if (enduranceTest.thumbFlexorsTest && enduranceTest.thumbFlexorsTest < 50) {
          endurance.details.push(`Thumb Flexor Endurance: ${enduranceTest.thumbFlexorsTest} reps`);
          endurance.scores.thumbFlexors = enduranceTest.thumbFlexorsTest;
        }
        
        if (enduranceTest.thumbExtensorsTest && enduranceTest.thumbExtensorsTest < 50) {
          endurance.details.push(`Thumb Extensor Endurance: ${enduranceTest.thumbExtensorsTest} reps`);
          endurance.scores.thumbExtensors = enduranceTest.thumbExtensorsTest;
        }
        
        // Determine endurance severity based on scores
        if (Object.values(endurance.scores).some(score => score < 20)) {
          endurance.severity = 'severe';
        } else if (Object.values(endurance.scores).some(score => score < 35)) {
          endurance.severity = 'moderate';
        } else if (Object.values(endurance.scores).length > 0) {
          endurance.severity = 'mild';
        }
        
        // If no specific scores were found but we still want to show endurance work
        if (endurance.details.length === 0) {
          endurance.details.push('General endurance work recommended');
        }
        
        // Process neural tension impairment
        const neuralTension = {
          isImpaired: false,
          severity: 'none',
          details: []
        };
        
        // Check each nerve for tension issues
        if (nerveMobilityTest.radial === 'severe') {
          neuralTension.isImpaired = true;
          neuralTension.severity = 'severe';
          neuralTension.details.push('Radial Nerve: Severe Tension');
        } else if (nerveMobilityTest.radial === 'mild') {
          neuralTension.isImpaired = true;
          neuralTension.severity = neuralTension.severity === 'severe' ? 'severe' : 'mild';
          neuralTension.details.push('Radial Nerve: Mild Tension');
        }
        
        if (nerveMobilityTest.median === 'severe') {
          neuralTension.isImpaired = true;
          neuralTension.severity = 'severe';
          neuralTension.details.push('Median Nerve: Severe Tension');
        } else if (nerveMobilityTest.median === 'mild') {
          neuralTension.isImpaired = true;
          neuralTension.severity = neuralTension.severity === 'severe' ? 'severe' : 'mild';
          neuralTension.details.push('Median Nerve: Mild Tension');
        }
        
        if (nerveMobilityTest.ulnar === 'severe') {
          neuralTension.isImpaired = true;
          neuralTension.severity = 'severe';
          neuralTension.details.push('Ulnar Nerve: Severe Tension');
        } else if (nerveMobilityTest.ulnar === 'mild') {
          neuralTension.isImpaired = true;
          neuralTension.severity = neuralTension.severity === 'severe' ? 'severe' : 'mild';
          neuralTension.details.push('Ulnar Nerve: Mild Tension');
        }
        
        setImpairments({
          muscleLength,
          endurance,
          neuralTension
        });
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadUserData();
  }, [currentUser]);
  
  function handlePainRegionSelect(regionId) {
    setSelectedRegion(regionId);
    setVideoLoaded(false); // Reset video loaded state when changing regions
  }
  
  function handleVideoLoad() {
    setVideoLoaded(true);
  }
  
  function handleVideoError() {
    setVideoLoaded(false);
  }
  
  // Get the selected region data
  const selectedRegionData = selectedRegion ? painRegionData[selectedRegion] : null;

  return (
    <ProtectedPage>
      <header className="mb-6">
        <h1 className="text-2xl font-bold">About Plan</h1>
      </header>
      
      {/* Pain Region Section */}
      <div className="mb-10">
        <h2 className="text-lg font-bold mb-4">Pain Region</h2>
        <div className="flex flex-wrap gap-4 mb-4 overflow-x-auto pb-4">
          {/* Only display user's available pain regions */}
          {availablePainRegions.map(regionId => (
            <div 
              key={regionId}
              className={`relative cursor-pointer border-2 ${
                selectedRegion === regionId ? 'border-red-500' : 'border-dashed border-gray-400'
              } p-1 w-24 h-32`}
              onClick={() => handlePainRegionSelect(regionId)}
            >
              <div className="w-full h-full bg-gray-100 flex items-center justify-center overflow-hidden">
                {painRegionData[regionId].image ? (
                  <Image
                    src={painRegionData[regionId].image}
                    alt={painRegionData[regionId].name}
                    width={96}
                    height={128}
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200"></div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Selected Pain Region Names */}
        <div>
          {selectedRegion && (
            <p className="font-medium">{painRegionData[selectedRegion].name}</p>
          )}
        </div>
      </div>

      {/* What Structures Are Involved */}
      {selectedRegionData && (
        <div className="mb-10">
          <h2 className="text-xl font-bold mb-4">What Structures Are Involved</h2>
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="bg-red-200 p-8 flex flex-col items-center justify-center text-center">
                <h3 className="text-2xl font-bold mb-1">{selectedRegionData.structure.name}</h3>
                <p className="text-xl mb-8">{selectedRegionData.structure.type}</p>
                <p className="text-xl font-bold">
                  Actions: {selectedRegionData.structure.actions}
                </p>
              </div>
              
              <div className="bg-white p-4 flex items-center justify-center">
                {selectedRegionData.anatomyImage ? (
                  <div className="relative w-60 h-80">
                    <Image
                      src={selectedRegionData.anatomyImage}
                      alt={`${selectedRegionData.name} anatomy`}
                      fill
                      className="object-contain"
                    />
                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-black bg-opacity-20 rounded-full p-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-60 h-80 bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500">Anatomy Image</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Problem Overview */}
      {selectedRegionData && (
        <div className="mb-10">
          <h2 className="text-lg font-bold mb-4">Problem Overview</h2>
          <p className="text-sm leading-relaxed">
            {selectedRegionData.description}
            <br /><br />
            Pain is a useful indicator of something you need to work on. These muscles and tendons are involved in gripping the mouse and lifting the fingers up as you click buttons or keys. The muscle is responsible for lifting the wrist and fingers up towards the ceiling (if your palm is facing down).
            <br /><br />
            Stretching is a great start but ultimately it's only a short term relief of pain. In order to handle the excessive/repetitive stress of competitive gaming we have to build up the endurance of these muscles & tendons.
            <br /><br />
            Here are some areas to work on to make these muscles and tendons more ready to take on the strain of gaming. This is your plan on how to address your physical limitations.
          </p>
        </div>
      )}

      {/* Impairements */}
      <div className="mb-10">
        <h2 className="text-lg font-bold mb-4">Impairements Dashboard</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Muscle Length Card */}
          <div className={`bg-white rounded-lg shadow-md overflow-hidden ${
            impairments.muscleLength.isImpaired ? 'border-l-4 border-red-500' : 'border-l-4 border-gray-200'
          }`}>
            <div className="p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-lg">Muscle Length</h3>
                <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  impairments.muscleLength.severity === 'severe' ? 'bg-red-100 text-red-800' :
                  impairments.muscleLength.severity === 'mild' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {impairments.muscleLength.severity === 'none' ? 'Normal' : 
                   impairments.muscleLength.severity.charAt(0).toUpperCase() + impairments.muscleLength.severity.slice(1)}
                </div>
              </div>
              
              {impairments.muscleLength.isImpaired ? (
                <div className="mt-2">
                  <p className="text-sm text-gray-600 font-medium mb-1">Findings:</p>
                  <ul className="text-sm text-gray-700 list-disc list-inside">
                    {impairments.muscleLength.details.map((detail, idx) => (
                      <li key={idx}>{detail}</li>
                    ))}
                  </ul>
                  <div className="mt-2 text-sm text-gray-600">
                    <p>Suggested Focus: <span className="font-semibold">Stretching Routine</span></p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-600">Your muscle length assessment shows normal mobility.</p>
              )}
            </div>
            <div className="bg-gray-50 px-4 py-2">
              <div className="h-2 bg-gray-200 rounded-full">
                <div className={`h-full rounded-full ${
                  impairments.muscleLength.severity === 'severe' ? 'bg-red-500 w-3/4' :
                  impairments.muscleLength.severity === 'mild' ? 'bg-yellow-500 w-1/3' :
                  'bg-green-500 w-1/12'
                }`}></div>
              </div>
            </div>
          </div>
          
          {/* Endurance Card */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden border-l-4 border-red-500">
            <div className="p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-lg">Endurance</h3>
                <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  impairments.endurance.severity === 'severe' ? 'bg-red-100 text-red-800' :
                  impairments.endurance.severity === 'moderate' ? 'bg-orange-100 text-orange-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {impairments.endurance.severity.charAt(0).toUpperCase() + impairments.endurance.severity.slice(1)}
                </div>
              </div>
              
              <div className="mt-2">
                <p className="text-sm text-gray-600 font-medium mb-1">Test Results:</p>
                <ul className="text-sm text-gray-700 list-disc list-inside">
                  {impairments.endurance.details.map((detail, idx) => (
                    <li key={idx}>{detail}</li>
                  ))}
                </ul>
                <div className="mt-2 text-sm text-gray-600">
                  <p>Suggested Focus: <span className="font-semibold">Progressive Resistance Training</span></p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-2">
              <div className="h-2 bg-gray-200 rounded-full">
                <div className={`h-full rounded-full ${
                  impairments.endurance.severity === 'severe' ? 'bg-red-500 w-4/5' :
                  impairments.endurance.severity === 'moderate' ? 'bg-orange-500 w-1/2' :
                  'bg-yellow-500 w-1/4'
                }`}></div>
              </div>
            </div>
          </div>
          
          {/* Neural Tension Card */}
          <div className={`bg-white rounded-lg shadow-md overflow-hidden ${
            impairments.neuralTension.isImpaired ? 'border-l-4 border-red-500' : 'border-l-4 border-gray-200'
          }`}>
            <div className="p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-lg">Neural Tension</h3>
                <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  impairments.neuralTension.severity === 'severe' ? 'bg-red-100 text-red-800' :
                  impairments.neuralTension.severity === 'mild' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {impairments.neuralTension.severity === 'none' ? 'Normal' : 
                   impairments.neuralTension.severity.charAt(0).toUpperCase() + impairments.neuralTension.severity.slice(1)}
                </div>
              </div>
              
              {impairments.neuralTension.isImpaired ? (
                <div className="mt-2">
                  <p className="text-sm text-gray-600 font-medium mb-1">Affected Nerves:</p>
                  <ul className="text-sm text-gray-700 list-disc list-inside">
                    {impairments.neuralTension.details.map((detail, idx) => (
                      <li key={idx}>{detail}</li>
                    ))}
                  </ul>
                  <div className="mt-2 text-sm text-gray-600">
                    <p>Suggested Focus: <span className="font-semibold">Neural Glides</span></p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-600">Your nerve mobility assessment shows normal neural tension.</p>
              )}
            </div>
            <div className="bg-gray-50 px-4 py-2">
              <div className="h-2 bg-gray-200 rounded-full">
                <div className={`h-full rounded-full ${
                  impairments.neuralTension.severity === 'severe' ? 'bg-red-500 w-3/4' :
                  impairments.neuralTension.severity === 'mild' ? 'bg-yellow-500 w-1/3' :
                  'bg-green-500 w-1/12'
                }`}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* The Key Approach */}
      <div className="mb-10">
        <h2 className="text-lg font-bold mb-4">The Key Approach</h2>
        <p className="text-sm leading-relaxed">
          The way we will be approaching this discomfort will be to build up strength & endurance in the hand and wrist directly. This will take time as it takes roughly 4-6 weeks of consistent work to make a change in tissue strength. In about 2 weeks I am expecting around a 60-70% improvement and around more than 90% at the 6-week mark if you are consistent with the overall routine. The shoulder exercises also help to give you a more stable base for your wrist to work from.
        </p>
      </div>

      {/* Exercise Program Guidelines */}
      <div className="mb-10">
        <h2 className="text-lg font-bold mb-4">Exercise Program Guidelines & Things to Remember</h2>
        <div className="text-sm leading-relaxed">
          <p className="mb-2"><strong>When?</strong> AM / PM. First thing in the morning, and before bed</p>
          <p className="mb-2"><strong>What?</strong> Perform all of the exercises together in one session</p>
          <p className="mb-2"><strong>How?</strong> Perform all of the exercises together in one session and stretches can be performed throughout the day. All Strengthening / endurance Exercises with Metronome set to 50 BPM.</p>
          <p className="mb-4">
            Keep track of reps to fatigue and reps to pain. With each exercise and document the number 2x a week so we can keep track of your progress or modify. No exercise should ever cause more than 5/10 Pain If you experience sharp 5/10 pain, evaluate how you are performing the exercise. If you are doing the exercises with correct form, but still having significant pain. End the exercise and talk to a medical professional.
          </p>
          <p>See sample schedule below. Recovery days can include the exercises and stretches in any of the 1HP routines on the website or youtube.</p>
        </div>

        {/* Weekly Schedule */}
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr>
                <th className="border border-gray-300 px-4 py-2 bg-pink-100">Mon</th>
                <th className="border border-gray-300 px-4 py-2 bg-pink-100">Tues</th>
                <th className="border border-gray-300 px-4 py-2 bg-pink-100">Wed</th>
                <th className="border border-gray-300 px-4 py-2 bg-pink-100">Thurs</th>
                <th className="border border-gray-300 px-4 py-2 bg-pink-100">Fri</th>
                <th className="border border-gray-300 px-4 py-2 bg-pink-100">Sat</th>
                <th className="border border-gray-300 px-4 py-2 bg-pink-100">Sun</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 px-4 py-2 bg-red-500 text-white text-center">Exercise AM/PM</td>
                <td className="border border-gray-300 px-4 py-2 bg-red-500 text-white text-center">Exercise AM/PM</td>
                <td className="border border-gray-300 px-4 py-2 bg-red-500 text-white text-center">Exercise AM/PM</td>
                <td className="border border-gray-300 px-4 py-2 bg-red-500 text-white text-center">Exercise AM/PM</td>
                <td className="border border-gray-300 px-4 py-2 bg-red-500 text-white text-center">Exercise AM/PM</td>
                <td className="border border-gray-300 px-4 py-2 bg-red-500 text-white text-center">Exercise AM/PM</td>
                <td className="border border-gray-300 px-4 py-2 bg-green-200 text-center">Recovery</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Today's Exercises Button */}
      <div className="flex justify-center my-10">
        <Link href="/exercise-program" className="bg-red-500 text-white px-16 py-4 rounded-full text-xl font-medium hover:bg-red-600">
          Today's Exercises
        </Link>
      </div>
    </ProtectedPage>
  );
}