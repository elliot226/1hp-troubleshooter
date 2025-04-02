// pages/mobility-test.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { getDoc, setDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import AssessmentLayout from '@/components/AssessmentLayout';

export default function MobilityTest() {
  const [flexionChoice, setFlexionChoice] = useState(null);
  const [extensionChoice, setExtensionChoice] = useState(null);
  const [currentSection, setCurrentSection] = useState('intro'); // 'intro', 'flexion', 'extension'
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('');
  
  const { currentUser } = useAuth();
  const router = useRouter();

  // Load existing data
  useEffect(() => {
    async function loadExistingData() {
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
          
          // If already completed assessment, go to dashboard
          if (userData.assessmentCompleted) {
            router.push('/dashboard');
            return;
          }
          
          // Load previous selections if available
          if (userData.mobilityTest) {
            if (userData.mobilityTest.wristFlexorMobility) {
              // Map mobility levels back to choices
              const mobilityToChoice = {
                'severe': 1,
                'mild': 2,
                'normal': 3
              };
              
              setFlexionChoice(mobilityToChoice[userData.mobilityTest.wristFlexorMobility]);
              setExtensionChoice(mobilityToChoice[userData.mobilityTest.wristExtensorMobility]);
              
              // Skip intro if both choices are already made
              if (mobilityToChoice[userData.mobilityTest.wristFlexorMobility] && 
                  mobilityToChoice[userData.mobilityTest.wristExtensorMobility]) {
                setCurrentSection('extension');
              }
            }
          }
        } else {
          // If no user document, redirect to first step
          router.push('/user-details');
        }
      } catch (error) {
        console.error("Error loading mobility test data:", error);
      } finally {
        setInitialLoading(false);
      }
    }
    
    loadExistingData();
  }, [currentUser, router]);

  // Handle selection of flexion choice
  function handleFlexionChoice(choice) {
    setFlexionChoice(choice);
  }

  // Handle selection of extension choice
  function handleExtensionChoice(choice) {
    setExtensionChoice(choice);
  }

  // Navigate to the next section
  function nextSection() {
    if (currentSection === 'intro') {
      setCurrentSection('flexion');
    } else if (currentSection === 'flexion') {
      if (flexionChoice === null) {
        setSaveStatus('Error: Please select a flexion test result.');
        return;
      }
      setCurrentSection('extension');
      setSaveStatus('');
    } else if (currentSection === 'extension') {
      handleSubmit();
    }
  }

  // Handle form submission
  async function handleSubmit() {
    if (flexionChoice === null || extensionChoice === null) {
      setSaveStatus('Error: Please make selections for both flexion and extension tests.');
      return;
    }
    
    setLoading(true);
    setSaveStatus('Saving your test results...');
    
    try {
      // Map choices to mobility levels
      const mobilityLevels = {
        1: 'severe',
        2: 'mild',
        3: 'normal'
      };
      
      // Store the test results
      await setDoc(doc(db, "users", currentUser.uid), {
        mobilityTest: {
          wristFlexorMobility: mobilityLevels[flexionChoice],
          wristExtensorMobility: mobilityLevels[extensionChoice],
        },
        mobilityTestDate: new Date(),
        mobilityTestCompleted: true
      }, { merge: true });
      
      setSaveStatus('Mobility test results saved successfully!');
      
      // Navigate to the next assessment step
      setTimeout(() => {
        router.push('/endurance-test');
      }, 1000);
    } catch (error) {
      console.error("Error saving mobility test results:", error);
      setSaveStatus('Error: Failed to save your test results. Please try again.');
    } finally {
      setLoading(false);
    }
  }
  
  // Handle back button
  function handleBack() {
    if (currentSection === 'extension') {
      setCurrentSection('flexion');
    } else if (currentSection === 'flexion') {
      setCurrentSection('intro');
    } else {
      router.push('/nerve-symptoms');
    }
  }
  
  // Get title and description based on current section
  function getSectionMeta() {
    switch (currentSection) {
      case 'intro':
        return {
          title: 'Understanding Wrist Mobility',
          description: 'Let\'s measure how well your wrist can move in different directions.'
        };
      case 'flexion':
        return {
          title: 'Wrist Flexion Test',
          description: 'Perform this test to identify how far you can bend your wrist down towards the ground.'
        };
      case 'extension':
        return {
          title: 'Wrist Extension Test',
          description: 'Perform this test to identify how far you can bend your wrist up towards the ceiling.'
        };
      default:
        return {
          title: 'Wrist Mobility Test',
          description: 'Testing the range of motion in your wrist.'
        };
    }
  }
  
  const { title, description } = getSectionMeta();

  return (
    <AssessmentLayout
      currentStep="mobility-test"
      title={title}
      description={description}
      loadingState={initialLoading}
      saveStatus={saveStatus}
      onBack={handleBack}
    >
      {/* Introduction Section */}
      {currentSection === 'intro' && (
        <div className="space-y-6">
          <div className="bg-gray-100 p-6 rounded-lg">
            <p className="mb-4">
              You should be able to bend your wrist in both directions nearly 90 degrees. 
              With wrist pain, it is normal to have stiffness of the muscles & tendons which 
              leads to a reduction of overall range of motion (mobility).
            </p>
            <p>
              We will be providing you with stretches to fix any mobility deficit you have 
              but also use as a recovery tool throughout the day.
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 mt-8">
            <div className="flex-1 bg-blue-50 p-6 rounded-lg text-center">
              <h3 className="text-xl font-bold mb-4">WRIST<br />FLEXION</h3>
              <div className="flex justify-center mb-4">
                <div className="w-24 h-24 rounded-md bg-white flex items-center justify-center">
                  <svg viewBox="0 0 100 100" width="80" height="80">
                    <path d="M30,50 Q50,80 70,50" stroke="black" strokeWidth="3" fill="none" />
                    <circle cx="30" cy="50" r="5" fill="black" />
                    <circle cx="70" cy="50" r="5" fill="black" />
                  </svg>
                </div>
              </div>
              <div className="text-2xl font-bold mb-2">70-80°</div>
              <div className="text-sm">Normal Flexion<br />Range of Motion</div>
            </div>
            
            <div className="flex-1 bg-blue-50 p-6 rounded-lg text-center">
              <h3 className="text-xl font-bold mb-4">WRIST<br />EXTENSION</h3>
              <div className="flex justify-center mb-4">
                <div className="w-24 h-24 rounded-md bg-white flex items-center justify-center">
                  <svg viewBox="0 0 100 100" width="80" height="80">
                    <path d="M30,50 Q50,20 70,50" stroke="black" strokeWidth="3" fill="none" />
                    <circle cx="30" cy="50" r="5" fill="black" />
                    <circle cx="70" cy="50" r="5" fill="black" />
                  </svg>
                </div>
              </div>
              <div className="text-2xl font-bold mb-2">70-90°</div>
              <div className="text-sm">Normal Extension<br />Range of Motion</div>
            </div>
          </div>
          
          <div className="flex justify-center mt-8">
            <button 
              onClick={nextSection}
              className="bg-red-500 text-white px-8 py-3 rounded-full font-medium hover:bg-red-600"
            >
              Begin Testing
            </button>
          </div>
        </div>
      )}
      
      {/* Flexion Testing Section */}
      {currentSection === 'flexion' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row mb-8">
            <div className="md:w-1/2 mb-4 md:mb-0 md:pr-4">
              <div className="bg-gray-200 rounded-lg h-64 flex items-center justify-center">
                {/* Placeholder for actual test image */}
                <div className="text-center p-4">
                  <span className="text-gray-500">Flexion Test Image</span>
                  <p className="text-sm text-gray-400 mt-2">
                    Bend your wrist downward as far as comfortable
                  </p>
                </div>
              </div>
            </div>
            
            <div className="md:w-1/2">
              <div className="grid grid-cols-3 gap-4">
                <div 
                  className={`border-2 rounded-lg p-4 cursor-pointer flex flex-col items-center ${
                    flexionChoice === 1 ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-red-200'
                  }`}
                  onClick={() => handleFlexionChoice(1)}
                >
                  <div className="w-24 h-24 bg-white rounded-md flex items-center justify-center mb-2">
                    <svg viewBox="0 0 100 100" width="80" height="80">
                      <path d="M30,30 Q50,40 70,30" stroke="black" strokeWidth="3" fill="none" />
                      <circle cx="30" cy="30" r="5" fill="black" />
                      <circle cx="70" cy="30" r="5" fill="black" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <div className="inline-block bg-gray-200 px-2 py-1 rounded text-sm font-semibold mb-1">A</div>
                    <div className="text-sm">Severe Limitation</div>
                  </div>
                </div>
                
                <div 
                  className={`border-2 rounded-lg p-4 cursor-pointer flex flex-col items-center ${
                    flexionChoice === 2 ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-red-200'
                  }`}
                  onClick={() => handleFlexionChoice(2)}
                >
                  <div className="w-24 h-24 bg-white rounded-md flex items-center justify-center mb-2">
                    <svg viewBox="0 0 100 100" width="80" height="80">
                      <path d="M30,30 Q50,60 70,30" stroke="black" strokeWidth="3" fill="none" />
                      <circle cx="30" cy="30" r="5" fill="black" />
                      <circle cx="70" cy="30" r="5" fill="black" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <div className="inline-block bg-gray-200 px-2 py-1 rounded text-sm font-semibold mb-1">B</div>
                    <div className="text-sm">Mild Limitation</div>
                  </div>
                </div>
                
                <div 
                  className={`border-2 rounded-lg p-4 cursor-pointer flex flex-col items-center ${
                    flexionChoice === 3 ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-red-200'
                  }`}
                  onClick={() => handleFlexionChoice(3)}
                >
                  <div className="w-24 h-24 bg-white rounded-md flex items-center justify-center mb-2">
                    <svg viewBox="0 0 100 100" width="80" height="80">
                      <path d="M30,30 Q50,80 70,30" stroke="black" strokeWidth="3" fill="none" />
                      <circle cx="30" cy="30" r="5" fill="black" />
                      <circle cx="70" cy="30" r="5" fill="black" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <div className="inline-block bg-gray-200 px-2 py-1 rounded text-sm font-semibold mb-1">C</div>
                    <div className="text-sm">Normal Range</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center mt-8">
            <button 
              onClick={nextSection}
              className="bg-red-500 text-white px-8 py-3 rounded-full font-medium hover:bg-red-600 disabled:bg-gray-400"
              disabled={flexionChoice === null}
            >
              Continue to Extension Test
            </button>
          </div>
        </div>
      )}
      
      {/* Extension Testing Section */}
      {currentSection === 'extension' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row mb-8">
            <div className="md:w-1/2 mb-4 md:mb-0 md:pr-4">
              <div className="bg-gray-200 rounded-lg h-64 flex items-center justify-center">
                {/* Placeholder for actual test image */}
                <div className="text-center p-4">
                  <span className="text-gray-500">Extension Test Image</span>
                  <p className="text-sm text-gray-400 mt-2">
                    Bend your wrist upward as far as comfortable
                  </p>
                </div>
              </div>
            </div>
            
            <div className="md:w-1/2">
              <div className="grid grid-cols-3 gap-4">
                <div 
                  className={`border-2 rounded-lg p-4 cursor-pointer flex flex-col items-center ${
                    extensionChoice === 1 ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-red-200'
                  }`}
                  onClick={() => handleExtensionChoice(1)}
                >
                  <div className="w-24 h-24 bg-white rounded-md flex items-center justify-center mb-2">
                    <svg viewBox="0 0 100 100" width="80" height="80">
                      <path d="M30,70 Q50,60 70,70" stroke="black" strokeWidth="3" fill="none" />
                      <circle cx="30" cy="70" r="5" fill="black" />
                      <circle cx="70" cy="70" r="5" fill="black" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <div className="inline-block bg-gray-200 px-2 py-1 rounded text-sm font-semibold mb-1">A</div>
                    <div className="text-sm">Severe Limitation</div>
                  </div>
                </div>
                
                <div 
                  className={`border-2 rounded-lg p-4 cursor-pointer flex flex-col items-center ${
                    extensionChoice === 2 ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-red-200'
                  }`}
                  onClick={() => handleExtensionChoice(2)}
                >
                  <div className="w-24 h-24 bg-white rounded-md flex items-center justify-center mb-2">
                    <svg viewBox="0 0 100 100" width="80" height="80">
                      <path d="M30,70 Q50,40 70,70" stroke="black" strokeWidth="3" fill="none" />
                      <circle cx="30" cy="70" r="5" fill="black" />
                      <circle cx="70" cy="70" r="5" fill="black" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <div className="inline-block bg-gray-200 px-2 py-1 rounded text-sm font-semibold mb-1">B</div>
                    <div className="text-sm">Mild Limitation</div>
                  </div>
                </div>
                
                <div 
                  className={`border-2 rounded-lg p-4 cursor-pointer flex flex-col items-center ${
                    extensionChoice === 3 ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-red-200'
                  }`}
                  onClick={() => handleExtensionChoice(3)}
                >
                  <div className="w-24 h-24 bg-white rounded-md flex items-center justify-center mb-2">
                    <svg viewBox="0 0 100 100" width="80" height="80">
                      <path d="M30,70 Q50,20 70,70" stroke="black" strokeWidth="3" fill="none" />
                      <circle cx="30" cy="70" r="5" fill="black" />
                      <circle cx="70" cy="70" r="5" fill="black" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <div className="inline-block bg-gray-200 px-2 py-1 rounded text-sm font-semibold mb-1">C</div>
                    <div className="text-sm">Normal Range</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center mt-8">
            <button 
              onClick={nextSection}
              className="bg-red-500 text-white px-8 py-3 rounded-full font-medium hover:bg-red-600 disabled:bg-gray-400"
              disabled={extensionChoice === null || loading}
            >
              {loading ? "Saving..." : "Continue"}
            </button>
          </div>
        </div>
      )}
    </AssessmentLayout>
  );
}