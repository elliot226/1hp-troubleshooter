// pages/outcome-measure.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { getDoc, setDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import AssessmentLayout from '@/components/AssessmentLayout';

// Core QuickDASH questions
const coreQuestions = [
  { id: 'q1', text: 'Open a tight or new jar.' },
  { id: 'q2', text: 'Do heavy household chores (e.g., wash walls, floors).' },
  { id: 'q3', text: 'Carry a shopping bag or briefcase.' },
  { id: 'q4', text: 'Wash your back.' },
  { id: 'q5', text: 'Use a knife to cut food.' },
  { id: 'q6', text: 'Recreational activities in which you take some force or impact through your arm, shoulder, or hand (e.g., golf, hammering, tennis, etc.).' },
  { 
    id: 'q7', 
    text: 'During the past week, to what extent has your arm, shoulder, or hand problem interfered with your normal social activities with family, friends, neighbors, or groups?', 
    options: ['Not at all', 'Slightly', 'Moderately', 'Quite a bit', 'Extremely'] 
  },
  { 
    id: 'q8', 
    text: 'During the past week, were you limited in your work or other regular daily activities as a result of your arm, shoulder or hand problem?', 
    options: ['Not limited at all', 'Slightly limited', 'Moderately limited', 'Very limited', 'Unable'] 
  },
  { 
    id: 'q9', 
    text: 'Arm, shoulder, or hand pain.', 
    options: ['None', 'Mild', 'Moderate', 'Severe', 'Extreme'] 
  },
  { 
    id: 'q10', 
    text: 'Tingling (pins and needles) in your arm, shoulder, or hand.', 
    options: ['None', 'Mild', 'Moderate', 'Severe', 'Extreme'] 
  },
  { 
    id: 'q11', 
    text: 'During the past week, how much difficulty have you had sleeping because of the pain in your arm, shoulder, or hand?', 
    options: ['No difficulty', 'Mild difficulty', 'Moderate difficulty', 'Severe difficulty', 'So much difficulty that I can\'t sleep'] 
  }
];

// Work module questions
const workModuleQuestions = [
  { id: 'w1', text: 'Using your usual technique for work?' },
  { id: 'w2', text: 'Doing your usual job tasks?' },
  { id: 'w3', text: 'Doing your work as well as you would like?' },
  { id: 'w4', text: 'Spending your usual amount of time working?' }
];

// Hobby module questions
const hobbyModuleQuestions = [
  { id: 'h1', text: 'Using your usual technique for playing your instrument, sport, or hobby?' },
  { id: 'h2', text: 'Playing your musical instrument, sport, or hobby because of arm, shoulder, or hand pain?' },
  { id: 'h3', text: 'Performing your musical instrument, sport, or hobby as well as you would like?' },
  { id: 'h4', text: 'Spending your usual amount of time practicing or playing your instrument, sport, or hobby?' }
];

// Default difficulty options
const defaultOptions = ['No difficulty', 'Mild difficulty', 'Moderate difficulty', 'Severe difficulty', 'Unable to perform'];

export default function OutcomeMeasure() {
  const [section, setSection] = useState('core');
  const [answers, setAnswers] = useState({});
  const [hobbyType, setHobbyType] = useState('');
  const [isWorking, setIsWorking] = useState(false);
  const [hasHobby, setHasHobby] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('');
  
  const { currentUser } = useAuth();
  const router = useRouter();

  // Load existing data if available
  useEffect(() => {
    async function loadExistingData() {
      if (!currentUser) {
        router.push('/login');
        return;
      }
      
      try {
        // Check if user has completed previous steps
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
          
          // If already completed this step, load previous answers
          if (userData.outcomeMeasureData) {
            setAnswers(userData.outcomeMeasureData.responses || {});
            if (userData.outcomeMeasureData.hobbyType) {
              setHobbyType(userData.outcomeMeasureData.hobbyType);
              setHasHobby(true);
            }
            setIsWorking(userData.outcomeMeasureData.isWorking || false);
          }
          
          // If already completed assessment, go to dashboard
          if (userData.assessmentCompleted) {
            router.push('/dashboard');
            return;
          }
        } else {
          // If no user data, redirect to first step
          router.push('/user-details');
        }
      } catch (error) {
        console.error("Error loading outcome measure data:", error);
      } finally {
        setInitialLoading(false);
      }
    }
    
    loadExistingData();
  }, [currentUser, router]);

  // Handle answer changes
  function handleAnswerChange(questionId, value) {
    setAnswers({ ...answers, [questionId]: value });
  }

  // Handle navigation between sections
  function handleContinue() {
    if (section === 'core') {
      // Check if all core questions are answered
      const allCoreAnswered = coreQuestions.every(q => answers[q.id]);
      
      if (!allCoreAnswered) {
        setSaveStatus('Error: Please answer all questions before continuing.');
        return;
      }
      
      // Move to work section
      setSaveStatus('');
      setSection('work');
    } else if (section === 'work') {
      if (!isWorking || workModuleQuestions.every(q => answers[q.id])) {
        // Move to hobby section
        setSaveStatus('');
        setSection('hobby');
      } else {
        setSaveStatus('Error: Please answer all work-related questions before continuing.');
      }
    } else if (section === 'hobby') {
      if (!hasHobby || (hobbyType && hobbyModuleQuestions.every(q => answers[q.id]))) {
        // Submit the form
        handleSubmit();
      } else {
        setSaveStatus('Error: Please provide your hobby type and answer all hobby-related questions.');
      }
    }
  }

  // Calculate QuickDASH scores
  function calculateScores() {
    // Core QuickDASH score
    const coreAnswers = coreQuestions.map(q => answers[q.id]);
    const coreSum = coreAnswers.reduce((sum, val) => sum + val, 0);
    const coreScore = ((coreSum - 11) / 44) * 100;
    
    // Work module score (optional)
    let workScore = null;
    if (isWorking) {
      const workAnswers = workModuleQuestions.map(q => answers[q.id]);
      if (workAnswers.every(a => a !== undefined)) {
        const workSum = workAnswers.reduce((sum, val) => sum + val, 0);
        workScore = ((workSum - 4) / 16) * 100;
      }
    }
    
    // Hobby module score (optional)
    let hobbyScore = null;
    if (hasHobby) {
      const hobbyAnswers = hobbyModuleQuestions.map(q => answers[q.id]);
      if (hobbyAnswers.every(a => a !== undefined)) {
        const hobbySum = hobbyAnswers.reduce((sum, val) => sum + val, 0);
        hobbyScore = ((hobbySum - 4) / 16) * 100;
      }
    }
    
    return {
      coreScore: Math.round(coreScore),
      workScore: workScore !== null ? Math.round(workScore) : null,
      hobbyScore: hobbyScore !== null ? Math.round(hobbyScore) : null
    };
  }

  // Handle final submission
  async function handleSubmit() {
    if (!currentUser) {
      router.push('/login');
      return;
    }
    
    setLoading(true);
    setSaveStatus('Saving your assessment...');
    
    try {
      // Calculate scores
      const scores = calculateScores();
      
      // Prepare data for storage
      const outcomeData = {
        responses: answers,
        isWorking,
        hobbyType: hasHobby ? hobbyType : null,
        score: scores.coreScore,
        workScore: scores.workScore,
        hobbyScore: scores.hobbyScore,
        date: new Date()
      };
      
      // Save to Firebase
      await setDoc(doc(db, "users", currentUser.uid), {
        outcomeMeasureData: outcomeData,
        latestQuickDashScore: scores.coreScore,
        outcomeMeasureDate: new Date(),
        outcomeMeasureCompleted: true
      }, { merge: true });
      
      // Also store in a subcollection for history
      await setDoc(doc(db, "users", currentUser.uid, "outcomeMeasures", new Date().toISOString()), outcomeData);
      
      setSaveStatus('Assessment saved successfully!');
      
      // Navigate to next step
      setTimeout(() => {
        router.push('/pain-region');
      }, 1000);
    } catch (error) {
      console.error("Error saving outcome measure:", error);
      setSaveStatus('Error: Failed to save your assessment. Please try again.');
    } finally {
      setLoading(false);
    }
  }
  
  // Handle back button
  function handleBack() {
    if (section === 'core') {
      router.push('/medical-screen');
    } else if (section === 'work') {
      setSection('core');
    } else if (section === 'hobby') {
      setSection('work');
    }
  }

  // Get title and description based on section
  function getSectionTitle() {
    if (section === 'core') {
      return "Functional Assessment";
    } else if (section === 'work') {
      return "Work Module (Optional)";
    } else if (section === 'hobby') {
      return "Hobby Module (Optional)";
    }
  }
  
  function getSectionDescription() {
    if (section === 'core') {
      return "The following questions ask about your ability to perform certain activities. Please rate your ability to do the following activities in the last week.";
    } else if (section === 'work') {
      return "These questions relate to the impact of your arm, shoulder, or hand problem on your ability to work.";
    } else if (section === 'hobby') {
      return "These questions relate to the impact of your arm, shoulder, or hand problem on playing a musical instrument, engaging in a hobby, or participating in a sport.";
    }
  }

  return (
    <AssessmentLayout
      currentStep="outcome-measure"
      title={getSectionTitle()}
      description={getSectionDescription()}
      loadingState={initialLoading}
      saveStatus={saveStatus}
      onBack={handleBack}
    >
      {section === 'core' && (
        <div className="space-y-6">
          {coreQuestions.map((question) => (
            <div key={question.id} className="p-4 bg-gray-50 rounded-lg">
              <p className="font-medium mb-3">{question.text}</p>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                {(question.options || defaultOptions).map((option, index) => (
                  <label 
                    key={`${question.id}-${index}`}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer ${
                      answers[question.id] === index + 1 
                        ? 'bg-red-100 border-red-500' 
                        : 'bg-white border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name={question.id}
                      value={index + 1}
                      checked={answers[question.id] === index + 1}
                      onChange={() => handleAnswerChange(question.id, index + 1)}
                      className="h-4 w-4 text-red-600 focus:ring-red-500"
                    />
                    <span className="ml-2 text-sm">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
          
          <div className="flex justify-center pt-4">
            <button
              type="button"
              onClick={handleContinue}
              disabled={loading}
              className="px-8 py-3 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:bg-gray-400"
            >
              {loading ? "Saving..." : "Continue"}
            </button>
          </div>
        </div>
      )}
      
      {section === 'work' && (
        <div className="space-y-6">
          <div className="mb-4">
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="is-working"
                checked={isWorking}
                onChange={(e) => setIsWorking(e.target.checked)}
                className="h-4 w-4 text-red-600 focus:ring-red-500"
              />
              <label htmlFor="is-working" className="ml-2 font-medium">
                I am currently working or have worked in the past week
              </label>
            </div>
          </div>
          
          {isWorking && (
            <div className="space-y-4">
              {workModuleQuestions.map((question) => (
                <div key={question.id} className="p-4 bg-gray-50 rounded-lg">
                  <p className="font-medium mb-3">{question.text}</p>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                    {defaultOptions.map((option, index) => (
                      <label 
                        key={`${question.id}-${index}`}
                        className={`flex items-center p-3 border rounded-lg cursor-pointer ${
                          answers[question.id] === index + 1 
                            ? 'bg-red-100 border-red-500' 
                            : 'bg-white border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name={question.id}
                          value={index + 1}
                          checked={answers[question.id] === index + 1}
                          onChange={() => handleAnswerChange(question.id, index + 1)}
                          className="h-4 w-4 text-red-600 focus:ring-red-500"
                        />
                        <span className="ml-2 text-sm">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={() => setSection('core')}
              className="px-6 py-2 text-gray-600 hover:text-gray-900"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleContinue}
              disabled={loading}
              className="px-8 py-3 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:bg-gray-400"
            >
              {loading ? "Saving..." : "Continue"}
            </button>
          </div>
        </div>
      )}
      
      {section === 'hobby' && (
        <div className="space-y-6">
          <div className="mb-4">
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="has-hobby"
                checked={hasHobby}
                onChange={(e) => setHasHobby(e.target.checked)}
                className="h-4 w-4 text-red-600 focus:ring-red-500"
              />
              <label htmlFor="has-hobby" className="ml-2 font-medium">
                I participate in a sport or hobby
              </label>
            </div>
          </div>
          
          {hasHobby && (
            <>
              <div className="mb-4">
                <label htmlFor="hobby-type" className="block text-sm font-medium text-gray-700 mb-1">
                  Please indicate your most important hobby/sport:
                </label>
                <input
                  type="text"
                  id="hobby-type"
                  value={hobbyType}
                  onChange={(e) => setHobbyType(e.target.value)}
                  className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  required
                />
              </div>
              
              <div className="space-y-4">
                {hobbyModuleQuestions.map((question) => (
                  <div key={question.id} className="p-4 bg-gray-50 rounded-lg">
                    <p className="font-medium mb-3">{question.text}</p>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                      {defaultOptions.map((option, index) => (
                        <label 
                          key={`${question.id}-${index}`}
                          className={`flex items-center p-3 border rounded-lg cursor-pointer ${
                            answers[question.id] === index + 1 
                              ? 'bg-red-100 border-red-500' 
                              : 'bg-white border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name={question.id}
                            value={index + 1}
                            checked={answers[question.id] === index + 1}
                            onChange={() => handleAnswerChange(question.id, index + 1)}
                            className="h-4 w-4 text-red-600 focus:ring-red-500"
                          />
                          <span className="ml-2 text-sm">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          
          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={() => setSection('work')}
              className="px-6 py-2 text-gray-600 hover:text-gray-900"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleContinue}
              disabled={loading}
              className="px-8 py-3 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:bg-gray-400"
            >
              {loading ? "Saving..." : "Complete Assessment"}
            </button>
          </div>
        </div>
      )}
    </AssessmentLayout>
  );
}