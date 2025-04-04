{/* Enhanced Anatomy Section for About Plan Page */}
import { useState } from 'react';
import Image from 'next/image';

// Enhanced pain region data with additional anatomical information
const enhancedPainRegionData = {
    wristExtensors: {
      name: "Wrist / Hand Extensors",
      structure: {
        name: "Extensor Digitorum",
        type: "Tendon & Muscle",
        actions: "Wrist Extension, Finger Extension",
        muscleActions: [
          { image: "/images/anatomy/actions/wrist-extension.jpg", label: "Wrist extension" },
          { image: "/images/anatomy/actions/finger-extension.jpg", label: "Hand digits 2-5 extension" }
        ],
        overuseMechanisms: [
          { image: "/images/anatomy/overuse/keyboard-typing.jpg", label: "Repetitive typing" },
          { image: "/images/anatomy/overuse/mouse-clicking.jpg", label: "Mouse clicking" },
          { image: "/images/anatomy/overuse/gaming-controller.jpg", label: "Controller use" }
        ],
        nerveEntrapments: [
          {
            nerve: "Radial Nerve (Radial Tunnel Syndrome)",
            description: "Compressed at the Arcade of Frohse within the supinator muscle",
            muscles: "Primarily affects supinator and wrist extensors (ECRB)",
            symptoms: "Lateral forearm pain, difficulty extending wrist/fingers, usually no numbness",
            note: "Overuse from prolonged mouse or keyboard use increases compression risk"
          },
          {
            nerve: "Superficial Radial Nerve (Wartenberg Syndrome)",
            description: "Compressed between brachioradialis and ECRL near the wrist",
            muscles: "Brachioradialis and extensor carpi radialis longus",
            symptoms: "Burning or tingling on the back of the thumb and hand",
            note: "Often aggravated by tight watch bands or over-developed wrist extensors"
          }
        ]
      },
      anatomyImage: "/images/anatomy/wristExtensors.jpg",
      anatomyVideo: "/videos/anatomy/wrist-extensors.mp4"
    },
    thumbExtensors: {
      name: "Thumb Extensors",
      structure: {
        name: "Extensor Pollicis Longus/Brevis",
        type: "Tendon & Muscle",
        actions: "Thumb Extension, Thumb Abduction",
        muscleActions: [
          { image: "/images/anatomy/actions/thumb-extension.jpg", label: "Thumb extension" },
          { image: "/images/anatomy/actions/thumb-abduction.jpg", label: "Thumb abduction" }
        ],
        overuseMechanisms: [
          { image: "/images/anatomy/overuse/smartphone-typing.jpg", label: "Smartphone use" },
          { image: "/images/anatomy/overuse/trackpad-gestures.jpg", label: "Trackpad gestures" },
          { image: "/images/anatomy/overuse/stylus-use.jpg", label: "Stylus/pen use" }
        ],
        nerveEntrapments: [
          {
            nerve: "Posterior Interosseous Nerve",
            description: "Branch of the radial nerve compressed at the Arcade of Frohse",
            muscles: "Supinator and thumb extensors",
            symptoms: "Weakness in thumb extension, pain in lateral forearm",
            note: "Can be aggravated by repetitive forearm rotation during computer use"
          },
          {
            nerve: "Superficial Radial Nerve (Wartenberg Syndrome)",
            description: "Compressed between muscles or under watch bands near the wrist",
            muscles: "Brachioradialis and extensor carpi radialis longus",
            symptoms: "Burning or tingling on the back of the thumb",
            note: "Common in people who perform repetitive thumb movements"
          }
        ]
      },
      anatomyImage: "/images/anatomy/thumbExtensors.jpg",
      anatomyVideo: "/videos/anatomy/thumb-extensors.mp4"
    },
    wristFlexors: {
      name: "Wrist Flexors",
      structure: {
        name: "Flexor Digitorum",
        type: "Tendon & Muscle",
        actions: "Wrist Flexion, Finger Flexion",
        muscleActions: [
          { image: "/images/anatomy/actions/wrist-flexion.jpg", label: "Wrist flexion" },
          { image: "/images/anatomy/actions/finger-flexion.jpg", label: "Finger flexion" }
        ],
        overuseMechanisms: [
          { image: "/images/anatomy/overuse/gaming-grip.jpg", label: "Gaming grip" },
          { image: "/images/anatomy/overuse/typing-palms.jpg", label: "Resting palms while typing" },
          { image: "/images/anatomy/overuse/mouse-grip.jpg", label: "Mouse grip" }
        ],
        nerveEntrapments: [
          {
            nerve: "Median Nerve (Carpal Tunnel Syndrome)",
            description: "Compressed under the flexor retinaculum at the wrist",
            muscles: "Flexor digitorum superficialis/profundus tightness",
            symptoms: "Tingling or numbness in thumb, index, middle fingers; worse at night; thumb weakness",
            note: "Most common nerve entrapment in computer users"
          },
          {
            nerve: "Median Nerve (Pronator Teres Syndrome)",
            description: "Compressed between the two heads of the pronator teres",
            muscles: "Pronator teres, wrist extensors",
            symptoms: "Forearm pain, numbness in thumb, index, and middle fingers, reduced thumb coordination",
            note: "Tight wrist extensors can increase demand on the pronator teres during forearm rotation"
          }
        ]
      },
      anatomyImage: "/images/anatomy/wristFlexors.jpg",
      anatomyVideo: "/videos/anatomy/wrist-flexors.mp4"
    },
    ulnarSideFlexors: {
      name: "Ulnar Side Flexors",
      structure: {
        name: "Flexor Carpi Ulnaris",
        type: "Tendon & Muscle",
        actions: "Wrist Flexion, Ulnar Deviation",
        muscleActions: [
          { image: "/images/anatomy/actions/wrist-flexion.jpg", label: "Wrist flexion" },
          { image: "/images/anatomy/actions/ulnar-deviation.jpg", label: "Ulnar deviation" }
        ],
        overuseMechanisms: [
          { image: "/images/anatomy/overuse/keyboard-reach.jpg", label: "Reaching for keyboard keys" },
          { image: "/images/anatomy/overuse/mouse-swipe-right.jpg", label: "Mouse swiping right" },
          { image: "/images/anatomy/overuse/gaming-thumb-movement.jpg", label: "Thumb stick movement" }
        ],
        nerveEntrapments: [
          {
            nerve: "Ulnar Nerve (Cubital Tunnel Syndrome)",
            description: "Compressed between the two heads of the flexor carpi ulnaris at the elbow",
            muscles: "Flexor carpi ulnaris",
            symptoms: "Numbness/tingling in the ring and little fingers, hand weakness",
            note: "Can be aggravated by leaning on elbows or keeping elbows bent while gaming"
          },
          {
            nerve: "Ulnar Nerve (Guyon's Canal Syndrome)",
            description: "Compressed in Guyon's canal at the wrist",
            muscles: "Flexor carpi ulnaris insertion",
            symptoms: "Numbness in ring and little finger, weakened grip, pinky muscle wasting",
            note: "Can be caused by pressure from keyboards or mouse pads"
          }
        ]
      },
      anatomyImage: "/images/anatomy/ulnarSideFlexors.jpg",
      anatomyVideo: "/videos/anatomy/ulnar-flexors.mp4"
    },
    ulnarSideExtensors: {
      name: "Ulnar Side Extensors",
      structure: {
        name: "Extensor Carpi Ulnaris",
        type: "Tendon & Muscle",
        actions: "Wrist Extension, Ulnar Deviation",
        muscleActions: [
          { image: "/images/anatomy/actions/wrist-extension.jpg", label: "Wrist extension" },
          { image: "/images/anatomy/actions/ulnar-deviation.jpg", label: "Ulnar deviation" }
        ],
        overuseMechanisms: [
          { image: "/images/anatomy/overuse/mouse-swipe-right.jpg", label: "Mouse swiping right" },
          { image: "/images/anatomy/overuse/keyboard-reach.jpg", label: "Reaching for modifier keys" },
          { image: "/images/anatomy/overuse/gaming-wrist-movement.jpg", label: "Gaming wrist rotation" }
        ],
        nerveEntrapments: [
          {
            nerve: "Posterior Interosseous Nerve Syndrome",
            description: "Branch of the radial nerve compressed near the supinator muscle",
            muscles: "Supinator and wrist extensors (especially ECRB)",
            symptoms: "Lateral forearm pain, difficulty extending the wrist with ulnar deviation",
            note: "Common in tasks requiring forearm rotation while extending the wrist"
          },
          {
            nerve: "Dorsal Ulnar Cutaneous Nerve",
            description: "Compressed at the wrist or distal forearm",
            muscles: "Extensor carpi ulnaris",
            symptoms: "Numbness or tingling on the dorsal-ulnar aspect of the hand",
            note: "Less common but can occur with repetitive ulnar deviation"
          }
        ]
      },
      anatomyImage: "/images/anatomy/ulnarSideExtensors.jpg",
      anatomyVideo: "/videos/anatomy/ulnar-extensors.mp4"
    },
    pinkyFlexors: {
      name: "Pinky Flexors",
      structure: {
        name: "Flexor Digiti Minimi",
        type: "Tendon & Muscle",
        actions: "Pinky Finger Flexion, Pinky Finger Opposition",
        muscleActions: [
          { image: "/images/anatomy/actions/pinky-flexion.jpg", label: "Pinky flexion" },
          { image: "/images/anatomy/actions/pinky-opposition.jpg", label: "Pinky opposition" }
        ],
        overuseMechanisms: [
          { image: "/images/anatomy/overuse/keyboard-modifier-keys.jpg", label: "Pressing shift/ctrl keys" },
          { image: "/images/anatomy/overuse/smartphone-edge-holding.jpg", label: "Supporting smartphone edge" },
          { image: "/images/anatomy/overuse/gaming-button-combo.jpg", label: "Gaming button combinations" }
        ],
        nerveEntrapments: [
          {
            nerve: "Ulnar Nerve (Guyon's Canal Syndrome)",
            description: "Compressed in Guyon's canal affecting the deep motor branch",
            muscles: "Flexor digiti minimi, hypothenar muscles",
            symptoms: "Weakness in pinky finger, difficulty with fine motor control",
            note: "Common in cyclists and computer users who rest wrists on hard surfaces"
          },
          {
            nerve: "Ulnar Nerve (Cubital Tunnel Syndrome)",
            description: "Compressed at the elbow affecting distal function",
            muscles: "All ulnar-innervated hand muscles including pinky flexors",
            symptoms: "Numbness in ring and little fingers, weakened grip and pinch",
            note: "Can be caused by leaning on elbows during prolonged desk work"
          }
        ]
      },
      anatomyImage: "/images/anatomy/pinkyFlexors.jpg",
      anatomyVideo: "/videos/anatomy/pinky-flexors.mp4"
    },
    thumbFlexors: {
      name: "Thumb Flexors",
      structure: {
        name: "Flexor Pollicis Longus/Brevis",
        type: "Tendon & Muscle",
        actions: "Thumb Flexion, Thumb Opposition",
        muscleActions: [
          { image: "/images/anatomy/actions/thumb-flexion.jpg", label: "Thumb flexion" },
          { image: "/images/anatomy/actions/thumb-opposition.jpg", label: "Thumb opposition" }
        ],
        overuseMechanisms: [
          { image: "/images/anatomy/overuse/smartphone-typing.jpg", label: "Smartphone texting" },
          { image: "/images/anatomy/overuse/pen-stylus-grip.jpg", label: "Pen/stylus grip" },
          { image: "/images/anatomy/overuse/gaming-controller-thumb.jpg", label: "Gaming controller thumb buttons" }
        ],
        nerveEntrapments: [
          {
            nerve: "Anterior Interosseous Nerve Syndrome",
            description: "Branch of median nerve compressed deep in the forearm",
            muscles: "Flexor pollicis longus, flexor digitorum profundus (index/middle)",
            symptoms: "Weak pinch grip (can't make an 'OK' sign), no sensory symptoms",
            note: "Rare but debilitating for precision tasks like typing or drawing"
          },
          {
            nerve: "Median Nerve (Carpal Tunnel Syndrome)",
            description: "Compressed at the wrist affecting thenar muscles",
            muscles: "Flexor pollicis brevis, opponens pollicis, abductor pollicis brevis",
            symptoms: "Thumb weakness, difficulty with opposition, numbness/tingling",
            note: "Highly common in smartphone users and digital artists"
          }
        ]
      },
      anatomyImage: "/images/anatomy/thumbFlexors.jpg",
      anatomyVideo: "/videos/anatomy/thumb-flexors.mp4"
    },
    fingers: {
      name: "Fingers",
      structure: {
        name: "Finger Flexors & Extensors",
        type: "Tendons & Muscles",
        actions: "Finger Flexion, Extension, Abduction, Adduction",
        muscleActions: [
          { image: "/images/anatomy/actions/finger-flexion.jpg", label: "Finger flexion" },
          { image: "/images/anatomy/actions/finger-extension.jpg", label: "Finger extension" },
          { image: "/images/anatomy/actions/finger-abduction.jpg", label: "Finger spreading" }
        ],
        overuseMechanisms: [
          { image: "/images/anatomy/overuse/keyboard-typing.jpg", label: "Fast typing" },
          { image: "/images/anatomy/overuse/piano-playing.jpg", label: "Musical instruments" },
          { image: "/images/anatomy/overuse/gaming-rapid-clicking.jpg", label: "Rapid clicking" },
          { image: "/images/anatomy/overuse/touchscreen-gestures.jpg", label: "Touchscreen gestures" }
        ],
        nerveEntrapments: [
          {
            nerve: "Median Nerve (Carpal Tunnel Syndrome)",
            description: "Compressed under the flexor retinaculum at the wrist",
            muscles: "Affects fingers 1-3 and half of finger 4",
            symptoms: "Numbness/tingling in thumb, index, middle fingers; worse at night",
            note: "Most common nerve compression in computer users and gamers"
          },
          {
            nerve: "Ulnar Nerve (Cubital Tunnel Syndrome)",
            description: "Compressed at the elbow between FCU heads",
            muscles: "Affects finger 5 and half of finger 4",
            symptoms: "Numbness/tingling in ring and little fingers, hand weakness",
            note: "Common in people who lean on elbows or keep elbows bent"
          },
          {
            nerve: "Radial Nerve (Posterior Interosseous Syndrome)",
            description: "Compressed at the Arcade of Frohse",
            muscles: "Affects finger extensors",
            symptoms: "Difficulty extending fingers, forearm pain, minimal sensory issues",
            note: "Can result from overuse of wrist extensors during typing or gaming"
          }
        ]
      },
      anatomyImage: "/images/anatomy/fingers.jpg",
      anatomyVideo: "/videos/anatomy/fingers.mp4"
    }
  };

export default function EnhancedAnatomySection({ selectedRegion }) {
  const [activeTab, setActiveTab] = useState('actions');
  const [showVideo, setShowVideo] = useState(false);
  
  // Get selected region data
  const regionData = selectedRegion ? enhancedPainRegionData[selectedRegion] : null;
  
  if (!regionData) {
    return <div>Please select a pain region to view anatomical information.</div>;
  }
  
  return (
    <div className="mb-10">
      <h2 className="text-xl font-bold mb-4">What Structures Are Involved</h2>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left side - Anatomy Visualization */}
          <div className="p-4 flex items-center justify-center">
            <div className="relative">
              {!showVideo ? (
                // Anatomy image with play button overlay
                <div className="relative w-full h-[300px]">
                  <Image
                    src={regionData.anatomyImage}
                    alt={`${regionData.name} anatomy`}
                    fill
                    objectFit="contain"
                    priority
                  />
                  <button 
                    className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 hover:bg-opacity-30 transition-opacity"
                    onClick={() => setShowVideo(true)}
                  >
                    <div className="bg-white bg-opacity-80 rounded-full p-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </button>
                </div>
              ) : (
                // Anatomy video player
                <div className="relative w-full h-[300px]">
                  <video 
                    src={regionData.anatomyVideo || "#"} 
                    controls 
                    autoPlay 
                    className="w-full h-full object-contain"
                    onEnded={() => setShowVideo(false)}
                  />
                  <button 
                    className="absolute top-2 right-2 bg-white rounded-full p-1"
                    onClick={() => setShowVideo(false)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Right side - Muscle Information */}
          <div className="bg-white-50 p-6">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-800">{regionData.structure.name}</h3>
              <p className="text-gray-600">{regionData.structure.type}</p>
            </div>
            
            {/* Tabs Navigation */}
            <div className="flex border-b gap-4 border-gray-200 mb-4">
              <button 
                className={`px-4 py-2 text-sm font-medium ${activeTab === 'actions' ? 'text-red-500 border-b-2 border-red-500' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('actions')}
              >
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Actions
                </div>
              </button>
              <button 
                className={`px-4 py-2 text-sm font-medium ${activeTab === 'overuse' ? 'text-red-500 border-b-2 border-red-500' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('overuse')}
              >
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6.672 1.911a1 1 0 10-1.932.518l.259.966a1 1 0 001.932-.518l-.26-.966zM2.429 4.74a1 1 0 10-.517 1.932l.966.259a1 1 0 00.517-1.932l-.966-.26zm8.814-.569a1 1 0 00-1.415-1.414l-.707.707a1 1 0 101.415 1.415l.707-.708zm-7.071 7.072l.707-.707A1 1 0 003.465 9.12l-.708.707a1 1 0 001.415 1.415zm3.2-5.171a1 1 0 00-1.3 1.3l4 10a1 1 0 001.823.075l1.38-2.759 3.018 3.02a1 1 0 001.414-1.415l-3.019-3.02 2.76-1.379a1 1 0 00-.076-1.822l-10-4z" clipRule="evenodd" />
                  </svg>
                  Overuse
                </div>
              </button>
              <button 
                className={`px-4 py-2 text-sm font-medium ${activeTab === 'nerves' ? 'text-red-500 border-b-2 border-red-500' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('nerves')}
              >
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                  </svg>
                  Nerves
                </div>
              </button>
            </div>
            
            {/* Tab Content */}
            <div className="mt-4">
              {/* Actions Tab */}
              {activeTab === 'actions' && (
                <div>
                  <p className="text-sm text-gray-700 mb-3">
                    <strong>Muscle Actions:</strong> {regionData.structure.actions}
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    {regionData.structure.muscleActions.map((action, index) => (
                      <div key={index} className="bg-white rounded-lg p-2 shadow-sm">
                        <div className="h-24 relative mb-2">
                          <Image
                            src={action.image}
                            alt={action.label}
                            fill
                            objectFit="contain"
                          />
                        </div>
                        <p className="text-center text-sm">{action.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Overuse Tab */}
              {activeTab === 'overuse' && (
                <div>
                  <p className="text-sm text-gray-700 mb-3">
                    <strong>Common Overuse Mechanisms:</strong>
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    {regionData.structure.overuseMechanisms.map((mechanism, index) => (
                      <div key={index} className="bg-white rounded-lg p-2 shadow-sm">
                        <div className="h-24 relative mb-2">
                          <Image
                            src={mechanism.image}
                            alt={mechanism.label}
                            fill
                            objectFit="contain"
                          />
                        </div>
                        <p className="text-center text-sm">{mechanism.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Nerves Tab */}
              {activeTab === 'nerves' && (
                <div>
                  <p className="text-sm text-gray-700 mb-3">
                    <strong>Common Nerve Entrapments:</strong>
                  </p>
                  <div className="space-y-3">
                    {regionData.structure.nerveEntrapments.map((entrapment, index) => (
                      <div key={index} className="bg-white rounded-lg p-3 shadow-sm">
                        <div className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                          </svg>
                          <strong className="text-sm">{entrapment.nerve}</strong>
                        </div>
                        <p className="text-sm text-gray-600 ml-7">{entrapment.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Explore Structure Button */}
            <div className="mt-6">
              <button className="bg-red-500 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-red-600 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
                Explore Structure
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}