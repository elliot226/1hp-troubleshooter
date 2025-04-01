// pages/pain-region.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { getDoc, setDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import AssessmentLayout from '@/components/AssessmentLayout';

const painRegions = [
  { 
    id: 'wristFlexors', 
    label: 'Wrist Flexors',
    description: 'Pain on the palm side of the wrist, often felt during gripping or when bending the wrist downward.'
  },
  { 
    id: 'wristExtensors', 
    label: 'Wrist Extensors',
    description: 'Pain on the back side of the wrist, often felt when lifting the fingers or bending the wrist upward.'
  },
  { 
    id: 'thumbFlexors', 
    label: 'Thumb Flexors',
    description: 'Pain at the base of the thumb or along the thumb side of the wrist, often when gripping or pinching.'
  },
  { 
    id: 'thumbExtensors', 
    label: 'Thumb Extensors',
    description: 'Pain around the thumb area, especially when extending or lifting the thumb away from the hand.'
  },
  { 
    id: 'ulnarSideExtensors', 
    label: 'Ulnar Side Extensors',
    description: 'Pain on the pinky side of the wrist (back side), often felt when twisting the wrist or extending fingers.'
  },
  { 
    id: 'ulnarSideFlexors', 
    label: 'Ulnar Side Flexors',
    description: 'Pain on the pinky side of the wrist (palm side), often felt during gripping or wrist flexion.'
  },
  { 
    id: 'pinkyFlexors', 
    label: 'Pinky Flexors',
    description: 'Pain specifically in the pinky finger or related muscles in the forearm, often during gripping.'
  },
  { 
    id: 'fingers', 
    label: 'Fingers',
    description: 'Pain in multiple fingers or general finger discomfort during typing, clicking, or other fine movements.'
  }
];

export default function PainRegion() {
  const [selectedRegions, setSelectedRegions] = useState({});
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState("");
  
  const { currentUser } = useAuth();
  const router = useRouter();

  // Load any existing pain region data and check previous steps
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
          
          // If already completed assessment, go to dashboard
          if (userData.assessmentCompleted) {
            router.push('/dashboard');
            return;
          }
          
          // Load existing pain region data if available
          if (userData.painRegions) {
            // Handle different formats of pain regions data
            if (typeof userData.painRegions === 'object' && !Array.isArray(userData.painRegions)) {
              setSelectedRegions(userData.painRegions);
            } else if (Array.isArray(userData.painRegions)) {
              // Convert array to object format
              const regionsObj = {};
              userData.painRegions.forEach(region => {
                regionsObj[region] = true;
              });
              setSelectedRegions(regionsObj);
            }
          }
        } else {
          // If no user data, redirect to first step
          router.push('/user-details');
        }
      } catch (error) {
        console.error("Error loading pain region data:", error);
      } finally {
        setInitialLoading(false);
      }
    }
    
    loadExistingData();
  }, [currentUser, router]);

  // Toggle pain region selection
  function handleRegionChange(id) {
    setSelectedRegions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  }

  // Handle form submission
  async function handleSubmit(e) {
    e.preventDefault();
    
    // Check if at least one region is selected
    if (!Object.values(selectedRegions).some(selected => selected)) {
      setSaveStatus('Error: Please select at least one pain region before continuing.');
      return;
    }
    
    setLoading(true);
    setSaveStatus("Saving your selections...");
    
    try {
      // Store selected pain regions
      await setDoc(doc(db, "users", currentUser.uid), {
        painRegions: {...selectedRegions},
        painRegionDate: new Date(),
        painRegionsCompleted: true
      }, { merge: true });
      
      setSaveStatus("Pain regions saved successfully!");
      
      // Navigate to the next step
      setTimeout(() => {
        router.push('/nerve-symptoms');
      }, 1000);
    } catch (error) {
      console.error("Error saving pain regions:", error);
      setSaveStatus("Error: Failed to save your selections. Please try again.");
    } finally {
      setLoading(false);
    }
  }
  
  // Handle back button
  function handleBack() {
    router.push('/outcome-measure');
  }

  return (
    <AssessmentLayout
      currentStep="pain-region"
      title="Pain Region Selection"
      description="Select all areas that apply to your pain or discomfort."
      loadingState={initialLoading}
      saveStatus={saveStatus}
      onBack={handleBack}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {painRegions.map((region) => (
            <div 
              key={region.id}
              className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                selectedRegions[region.id] 
                  ? 'border-red-500 bg-red-50' 
                  : 'border-gray-200 hover:border-red-200'
              }`}
              onClick={() => handleRegionChange(region.id)}
            >
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id={region.id}
                  checked={selectedRegions[region.id] || false}
                  onChange={() => handleRegionChange(region.id)}
                  className="w-5 h-5 text-red-500 mr-3"
                />
                <label htmlFor={region.id} className="font-medium cursor-pointer">
                  {region.label}
                </label>
              </div>
              <p className="mt-2 text-sm text-gray-600 ml-8">
                {region.description}
              </p>
            </div>
          ))}
        </div>
        
        <div className="flex justify-center pt-6">
          <button 
            type="submit"
            disabled={loading}
            className="bg-red-500 text-white px-8 py-3 rounded-full font-medium hover:bg-red-600 disabled:bg-gray-400"
          >
            {loading ? "Saving..." : "Continue"}
          </button>
        </div>
      </form>
    </AssessmentLayout>
  );
}