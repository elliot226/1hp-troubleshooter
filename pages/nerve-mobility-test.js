// pages/nerve-mobility-test.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { getDoc, setDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import AssessmentLayout from '@/components/AssessmentLayout';

export default function NerveMobilityTest() {
  const [selectedNerves, setSelectedNerves] = useState({
    radial: false,
    median: false,
    ulnar: false
  });
  const [nerveTests, setNerveTests] = useState({
    radial: null,  // null, 'none', 'mild', or 'severe'
    median: null,
    ulnar: null
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('');
  
  const { currentUser } = useAuth();
  const router = useRouter();

  // Load user data on mount
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
          
          if (!userData.enduranceTestCompleted) {
            router.push('/endurance-test');
            return;
          }
          
          // If already completed assessment, go to dashboard
          if (userData.assessmentCompleted) {
            router.push('/dashboard');
            return;
          }
          
          // Load nerve symptoms data
          if (userData.nerveSymptoms) {
            const nerves = {
              radial: false,
              median: false,
              ulnar: false
            };
            
            // Handle array format
            if (Array.isArray(userData.nerveSymptoms)) {
              userData.nerveSymptoms.forEach(nerve => {
                if (nerves[nerve] !== undefined) {
                  nerves[nerve] = true;
                }
              });
            } 
            // Handle object format
            else if (typeof userData.nerveSymptoms === 'object') {
              Object.keys(nerves).forEach(nerve => {
                if (userData.nerveSymptoms[nerve]) {
                  nerves[nerve] = true;
                }
              });
            }
            
            setSelectedNerves(nerves);
          }
          
          // Load previous test results if available
          if (userData.nerveMobilityTest) {
            setNerveTests(userData.nerveMobilityTest);
          }
        } else {
          // If no user data, redirect to first step
          router.push('/user-details');
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        setSaveStatus("Error: Could not load your previous nerve symptoms.");
      } finally {
        setInitialLoading(false);
      }
    }
    
    loadUserData();
  }, [currentUser, router]);

  // Handle test result selection
  function handleTestResult(nerve, result) {
    setNerveTests(prev => ({
      ...prev,
      [nerve]: result
    }));
  }

  // Handle form submission
  async function handleSubmit(e) {
    if (e) e.preventDefault();
    
    // For users with no nerve symptoms, we can skip the test
    const hasSelectedNerves = Object.values(selectedNerves).some(selected => selected);
    
    if (hasSelectedNerves) {
      // Verify all selected nerves have test results
      const selectedNervesList = Object.entries(selectedNerves)
        .filter(([_, selected]) => selected)
        .map(([nerve]) => nerve);
      
      const hasIncompleteTests = selectedNervesList.some(
        nerve => nerveTests[nerve] === null
      );
      
      if (hasIncompleteTests) {
        setSaveStatus('Error: Please complete all nerve tests before continuing.');
        return;
      }
    }
    
    setLoading(true);
    setSaveStatus('Completing your assessment...');
    
    try {
      // Filter for only the results of selected nerves
      const testResults = {};
      
      if (hasSelectedNerves) {
        Object.entries(selectedNerves)
          .filter(([_, selected]) => selected)
          .forEach(([nerve, _]) => {
            testResults[nerve] = nerveTests[nerve] || 'none';
          });
      }
      
      // Mark the entire assessment as complete
      await setDoc(doc(db, "users", currentUser.uid), {
        nerveMobilityTest: testResults,
        nerveMobilityTestDate: new Date(),
        nerveMobilityTestCompleted: true,
        assessmentCompleted: true, // Mark the entire assessment as complete
        assessmentCompletedDate: new Date()
      }, { merge: true });
      
      setSaveStatus('Assessment completed successfully!');
      
      // Navigate to the dashboard
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (error) {
      console.error("Error completing assessment:", error);
      setSaveStatus('Error: Failed to complete your assessment. Please try again.');
    } finally {
      setLoading(false);
    }
  }
  
  // Handle back button
  function handleBack() {
    router.push('/endurance-test');
  }
  
  // Check if there are any selected nerves
  const hasSelectedNerves = Object.values(selectedNerves).some(selected => selected);

  return (
    <AssessmentLayout
      currentStep="nerve-mobility-test"
      title="Nerve Mobility Testing"
      description="Final step: Test the mobility of your affected nerves to complete your assessment."
      loadingState={initialLoading}
      saveStatus={saveStatus}
      onBack={handleBack}
    >
      {!hasSelectedNerves ? (
        <div className="text-center py-6">
          <p className="mb-6">
            Based on your nerve symptom selections, no nerve mobility tests are needed.
          </p>
          <button
            onClick={handleSubmit}
            className="bg-red-500 text-white px-8 py-3 rounded-full font-medium hover:bg-red-600 disabled:bg-gray-400"
            disabled={loading}
          >
            {loading ? "Completing Assessment..." : "Complete Assessment"}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Radial Nerve Test (if selected) */}
          {selectedNerves.radial && (
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Radial Nerve Mobility Test</h3>
              
              <div className="flex flex-col md:flex-row mb-6">
                <div className="md:w-1/2 mb-4 md:mb-0 md:pr-6">
                  <div className="bg-gray-200 rounded-lg h-64 flex items-center justify-center">
                    {/* Image placeholder */}
                    <div className="text-center p-4">
                      <p className="text-gray-500">Radial Nerve Test Image</p>
                      <p className="text-sm text-gray-400 mt-2">
                        Perform the test as shown in the image. Extend your arm with palm facing down, then bring your hand toward your face while keeping your elbow straight.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="md:w-1/2">
                  <p className="mb-4">
                    The radial nerve travels from your neck, down the back of your arm, through your elbow, and into your hand. This test assesses if there is tension along this nerve pathway.
                  </p>
                  
                  <div className="mt-4">
                    <p className="font-medium mb-2">How would you rate the nerve tension/pain during this test?</p>
                    
                    <div className="space-y-2">
                      <label className="flex items-center cursor-pointer p-2 hover:bg-gray-100 rounded">
                        <input
                          type="radio"
                          name="radialTest"
                          checked={nerveTests.radial === 'none'}
                          onChange={() => handleTestResult('radial', 'none')}
                          className="w-4 h-4 text-red-600"
                        />
                        <span className="ml-2">None - No tension or pain</span>
                      </label>
                      
                      <label className="flex items-center cursor-pointer p-2 hover:bg-gray-100 rounded">
                        <input
                          type="radio"
                          name="radialTest"
                          checked={nerveTests.radial === 'mild'}
                          onChange={() => handleTestResult('radial', 'mild')}
                          className="w-4 h-4 text-red-600"
                        />
                        <span className="ml-2">Mild - Some tension but tolerable</span>
                      </label>
                      
                      <label className="flex items-center cursor-pointer p-2 hover:bg-gray-100 rounded">
                        <input
                          type="radio"
                          name="radialTest"
                          checked={nerveTests.radial === 'severe'}
                          onChange={() => handleTestResult('radial', 'severe')}
                          className="w-4 h-4 text-red-600"
                        />
                        <span className="ml-2">Severe - Significant tension or pain</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Median Nerve Test (if selected) */}
          {selectedNerves.median && (
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Median Nerve Mobility Test</h3>
              
              <div className="flex flex-col md:flex-row mb-6">
                <div className="md:w-1/2 mb-4 md:mb-0 md:pr-6">
                  <div className="bg-gray-200 rounded-lg h-64 flex items-center justify-center">
                    {/* Image placeholder */}
                    <div className="text-center p-4">
                      <p className="text-gray-500">Median Nerve Test Image</p>
                      <p className="text-sm text-gray-400 mt-2">
                        Extend your arm with palm up. Gently pull your thumb down and out, while extending your wrist backward. Gently tilt your head away from the arm being tested.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="md:w-1/2">
                  <p className="mb-4">
                    The median nerve runs through the middle of your wrist and provides sensation to your thumb, index, middle finger, and part of your ring finger. This test assesses tension along this nerve pathway.
                  </p>
                  
                  <div className="mt-4">
                    <p className="font-medium mb-2">How would you rate the nerve tension/pain during this test?</p>
                    
                    <div className="space-y-2">
                      <label className="flex items-center cursor-pointer p-2 hover:bg-gray-100 rounded">
                        <input
                          type="radio"
                          name="medianTest"
                          checked={nerveTests.median === 'none'}
                          onChange={() => handleTestResult('median', 'none')}
                          className="w-4 h-4 text-red-600"
                        />
                        <span className="ml-2">None - No tension or pain</span>
                      </label>
                      
                      <label className="flex items-center cursor-pointer p-2 hover:bg-gray-100 rounded">
                        <input
                          type="radio"
                          name="medianTest"
                          checked={nerveTests.median === 'mild'}
                          onChange={() => handleTestResult('median', 'mild')}
                          className="w-4 h-4 text-red-600"
                        />
                        <span className="ml-2">Mild - Some tension but tolerable</span>
                      </label>
                      
                      <label className="flex items-center cursor-pointer p-2 hover:bg-gray-100 rounded">
                        <input
                          type="radio"
                          name="medianTest"
                          checked={nerveTests.median === 'severe'}
                          onChange={() => handleTestResult('median', 'severe')}
                          className="w-4 h-4 text-red-600"
                        />
                        <span className="ml-2">Severe - Significant tension or pain</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Ulnar Nerve Test (if selected) */}
          {selectedNerves.ulnar && (
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Ulnar Nerve Mobility Test</h3>
              
              <div className="flex flex-col md:flex-row mb-6">
                <div className="md:w-1/2 mb-4 md:mb-0 md:pr-6">
                  <div className="bg-gray-200 rounded-lg h-64 flex items-center justify-center">
                    {/* Image placeholder */}
                    <div className="text-center p-4">
                      <p className="text-gray-500">Ulnar Nerve Test Image</p>
                      <p className="text-sm text-gray-400 mt-2">
                        With elbow bent at 90 degrees, rotate your palm up, then bend your wrist back with fingers spread apart. Gently tilt your head away from the arm being tested.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="md:w-1/2">
                  <p className="mb-4">
                    The ulnar nerve runs along the inner side of your elbow (the "funny bone") and into your pinky and ring fingers. This test assesses tension along this nerve pathway.
                  </p>
                  
                  <div className="mt-4">
                    <p className="font-medium mb-2">How would you rate the nerve tension/pain during this test?</p>
                    
                    <div className="space-y-2">
                      <label className="flex items-center cursor-pointer p-2 hover:bg-gray-100 rounded">
                        <input
                          type="radio"
                          name="ulnarTest"
                          checked={nerveTests.ulnar === 'none'}
                          onChange={() => handleTestResult('ulnar', 'none')}
                          className="w-4 h-4 text-red-600"
                        />
                        <span className="ml-2">None - No tension or pain</span>
                      </label>
                      
                      <label className="flex items-center cursor-pointer p-2 hover:bg-gray-100 rounded">
                        <input
                          type="radio"
                          name="ulnarTest"
                          checked={nerveTests.ulnar === 'mild'}
                          onChange={() => handleTestResult('ulnar', 'mild')}
                          className="w-4 h-4 text-red-600"
                        />
                        <span className="ml-2">Mild - Some tension but tolerable</span>
                      </label>
                      
                      <label className="flex items-center cursor-pointer p-2 hover:bg-gray-100 rounded">
                        <input
                          type="radio"
                          name="ulnarTest"
                          checked={nerveTests.ulnar === 'severe'}
                          onChange={() => handleTestResult('ulnar', 'severe')}
                          className="w-4 h-4 text-red-600"
                        />
                        <span className="ml-2">Severe - Significant tension or pain</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-center pt-6">
            <button 
              type="submit"
              disabled={loading}
              className="bg-red-500 text-white px-10 py-3 rounded-full font-medium hover:bg-red-600 disabled:bg-gray-400"
            >
              {loading ? "Completing Assessment..." : "Complete Assessment"}
            </button>
          </div>
        </form>
      )}
    </AssessmentLayout>
  );
}