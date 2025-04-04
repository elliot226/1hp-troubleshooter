// pages/user-details.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import AssessmentLayout from '@/components/AssessmentLayout';

export default function UserDetails() {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('');
  const [painDuration, setPainDuration] = useState('');
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  
  const { currentUser } = useAuth();
  const router = useRouter();
  
  // Check if user is logged in and load existing data
  useEffect(() => {
    async function checkUserAndLoadData() {
      if (!currentUser) {
        router.push('/login');
        return;
      }
      
      try {
        // Check if user already has details
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          // If user has completed this step, prefill the form
          if (userData.name) setName(userData.name || '');
          if (userData.age) setAge(userData.age.toString() || '');
          if (userData.sex) setSex(userData.sex || '');
          if (userData.painDuration) setPainDuration(userData.painDuration || '');
          
          // Check if user has already completed the assessment
          if (userData.assessmentCompleted) {
            router.push('/dashboard');
          }
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setInitialLoading(false);
      }
    }
    
    checkUserAndLoadData();
  }, [currentUser, router]);
  
  // Handle form submission
  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!currentUser) {
      router.push('/login');
      return;
    }
    
    // Validate form
    if (!name.trim()) {
      setSaveStatus("Error: Please enter your name");
      return;
    }
    
    if (!age || isNaN(parseInt(age)) || parseInt(age) <= 0 || parseInt(age) > 120) {
      setSaveStatus("Error: Please enter a valid age");
      return;
    }
    
    if (!sex) {
      setSaveStatus("Error: Please select your sex");
      return;
    }
    
    if (!painDuration) {
      setSaveStatus("Error: Please select how long you've been experiencing pain");
      return;
    }
    
    setLoading(true);
    setSaveStatus("Saving your information...");
    
    try {
      // Save to Firestore
      await setDoc(doc(db, "users", currentUser.uid), {
        name: name.trim(),
        age: parseInt(age),
        sex,
        painDuration,
        userDetailsCompleted: true,
        userDetailsDate: new Date()
      }, { merge: true });
      
      setSaveStatus("Information saved successfully!");
      
      // Navigate to next step
      setTimeout(() => {
        router.push('/medical-screen');
      }, 1000);
    } catch (error) {
      console.error("Error saving user details:", error);
      setSaveStatus("Error: Failed to save your information");
    } finally {
      setLoading(false);
    }
  }
  
  // Handle back button
  function handleBack() {
    router.push('/login');
  }

  return (
    <AssessmentLayout
      currentStep="user-details"
      title="Tell Us About Yourself"
      description="This information helps us personalize your recovery plan."
      loadingState={initialLoading}
      saveStatus={saveStatus}
      onBack={handleBack}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
            placeholder="Your name"
          />
        </div>
        
        <div>
          <label htmlFor="age" className="block text-sm font-medium text-gray-700">
            Age
          </label>
          <input
            type="number"
            id="age"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            min="1"
            max="120"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
            placeholder="Your age"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Sex
          </label>
          <div className="mt-1 space-y-2">
            <div className="flex items-center">
              <input
                type="radio"
                id="sex-male"
                name="sex"
                value="M"
                checked={sex === 'M'}
                onChange={() => setSex('M')}
                className="h-4 w-4 text-red-600 focus:ring-red-500"
              />
              <label htmlFor="sex-male" className="ml-2 block text-sm text-gray-700">
                Male
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="radio"
                id="sex-female"
                name="sex"
                value="F"
                checked={sex === 'F'}
                onChange={() => setSex('F')}
                className="h-4 w-4 text-red-600 focus:ring-red-500"
              />
              <label htmlFor="sex-female" className="ml-2 block text-sm text-gray-700">
                Female
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="radio"
                id="sex-other"
                name="sex"
                value="other"
                checked={sex === 'other'}
                onChange={() => setSex('other')}
                className="h-4 w-4 text-red-600 focus:ring-red-500"
              />
              <label htmlFor="sex-other" className="ml-2 block text-sm text-gray-700">
                Prefer not to answer
              </label>
            </div>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">
            How long have you been experiencing pain?
          </label>
          <select
            value={painDuration}
            onChange={(e) => setPainDuration(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
          >
            <option value="">Select duration</option>
            <option value="less-than-1-week">Less than 1 week</option>
            <option value="1-4-weeks">1-4 weeks</option>
            <option value="1-3-months">1-3 months</option>
            <option value="3-6-months">3-6 months</option>
            <option value="6-12-months">6-12 months</option>
            <option value="more-than-1-year">More than 1 year</option>
          </select>
        </div>
        
        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-4 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-gray-400"
          >
            {loading ? "Saving..." : "Continue"}
          </button>
        </div>
      </form>
    </AssessmentLayout>
  );
}