// pages/nerve-symptoms.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { getDoc, setDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import AssessmentLayout from '@/components/AssessmentLayout';

const nerveData = [
  {
    id: 'radial',
    name: 'Radial Nerve',
    description: 'Symptoms typically affect the back of forearm, back of hand, and thumb and first 2-3 fingers.',
    symptoms: ['Numbness on the back of the hand or thumb', 'Weakness when extending the wrist or fingers', 'Difficulty straightening the elbow']
  },
  {
    id: 'median',
    name: 'Median Nerve',
    description: 'Symptoms typically affect the palm side of hand, thumb, index, middle, and half of ring finger. May wake you up at night.',
    symptoms: ['Numbness in thumb, index, middle fingers', 'Hand weakness, especially with pinching', 'Pain in the wrist or palm', 'Sensations that worsen at night']
  },
  {
    id: 'ulnar',
    name: 'Ulnar Nerve',
    description: 'Symptoms typically affect the pinky finger, half of ring finger, and side of hand below pinky.',
    symptoms: ['Numbness in pinky and ring fingers', 'Weakened grip', 'Pain on the pinky side of the hand', 'Tingling that gets worse when elbow is bent']
  }
];

export default function NerveSymptoms() {
  const [selectedNerves, setSelectedNerves] = useState({
    radial: false,
    median: false,
    ulnar: false
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState("");
  
  const { currentUser } = useAuth();
  const router = useRouter();
  
  // Load existing data and check previous steps
  useEffect(() => {
    async function loadExistingData() {
      if (!currentUser) {
        router.push('/login');
        return;
      }
      
      try {
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
          
          // If already completed assessment, go to dashboard
          if (userData.assessmentCompleted) {
            router.push('/dashboard');
            return;
          }
          
          // Load existing nerve symptom data if available
          if (userData.nerveSymptoms) {
            // Handle different formats of nerve symptoms data
            if (Array.isArray(userData.nerveSymptoms)) {
              // Convert array to object format
              const nerveObj = {
                radial: userData.nerveSymptoms.includes('radial'),
                median: userData.nerveSymptoms.includes('median'),
                ulnar: userData.nerveSymptoms.includes('ulnar')
              };
              setSelectedNerves(nerveObj);
            } else if (typeof userData.nerveSymptoms === 'object') {
              setSelectedNerves(userData.nerveSymptoms);
            }
          }
        } else {
          // If no user data, redirect to first step
          router.push('/user-details');
        }
      } catch (error) {
        console.error("Error loading existing nerve symptoms:", error);
      } finally {
        setInitialLoading(false);
      }
    }
    
    loadExistingData();
  }, [currentUser, router]);

  // Toggle nerve selection
  function toggleNerve(nerve) {
    setSelectedNerves(prev => ({
      ...prev,
      [nerve]: !prev[nerve]
    }));
  }

  // Handle form submission
  async function handleSubmit(e) {
    e.preventDefault();
    
    setLoading(true);
    setSaveStatus("Saving your selections...");
    
    try {
      // Get array of selected nerves
      const selectedNerveArray = Object.entries(selectedNerves)
        .filter(([_, selected]) => selected)
        .map(([nerve]) => nerve);
      
      // Store the data
      await setDoc(doc(db, "users", currentUser.uid), {
        nerveSymptoms: selectedNerveArray,
        nerveSymptomsDate: new Date(),
        nerveSymptomsCompleted: true
      }, { merge: true });
      
      setSaveStatus("Nerve symptoms saved successfully!");
      
      // Navigate to next assessment step
      setTimeout(() => {
        router.push('/mobility-test');
      }, 1000);
    } catch (error) {
      console.error("Error saving nerve symptoms:", error);
      setSaveStatus("Error: Failed to save your selections.");
    } finally {
      setLoading(false);
    }
  }
  
  // Handle back button
  function handleBack() {
    router.push('/pain-region');
  }

  return (
    <AssessmentLayout
      currentStep="nerve-symptoms"
      title="Nerve Symptom Selection"
      description="Select any nerves that may be contributing to your symptoms. Symptoms may include numbness, tingling, or burning sensations."
      loadingState={initialLoading}
      saveStatus={saveStatus}
      onBack={handleBack}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {nerveData.map((nerve) => (
            <div 
              key={nerve.id}
              className={`border-2 rounded-lg p-6 cursor-pointer transition-colors ${
                selectedNerves[nerve.id] 
                  ? 'border-red-500 bg-red-50' 
                  : 'border-gray-200 hover:border-red-200'
              }`}
              onClick={() => toggleNerve(nerve.id)}
            >
              <div className="flex items-center mb-4">
                <input 
                  type="checkbox" 
                  checked={selectedNerves[nerve.id]}
                  onChange={() => toggleNerve(nerve.id)}
                  className="w-5 h-5 text-red-500"
                />
                <h3 className="ml-2 text-lg font-semibold">{nerve.name}</h3>
              </div>
              <div className="text-sm text-gray-600">
                <p className="mb-2">{nerve.description}</p>
                <ul className="list-disc ml-5 space-y-1">
                  {nerve.symptoms.map((symptom, index) => (
                    <li key={index}>{symptom}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4">
            You can select multiple nerves if your symptoms match more than one pattern.
            If you don't have any nerve symptoms, you can continue without selecting any.
          </p>
          <button 
            type="submit" 
            className="bg-red-500 text-white px-8 py-3 rounded-full text-lg font-medium hover:bg-red-600 disabled:bg-gray-400"
            disabled={loading}
          >
            {loading ? "Saving..." : "Continue"}
          </button>
        </div>
      </form>
    </AssessmentLayout>
  );
}