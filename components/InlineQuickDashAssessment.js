// components/InlineQuickDashAssessment.js
import { useState, useEffect } from 'react';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

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

export default function InlineQuickDashAssessment({ isOpen, onClose, onComplete }) {
  const [section, setSection] = useState('core');
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({});
  const [isWorking, setIsWorking] = useState(false);
  const [hasHobby, setHasHobby] = useState(false);
  const [hobbyType, setHobbyType] = useState('');
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  
  const { currentUser } = useAuth();
  
  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      // Try to load previous values
      const loadPrevValues = async () => {
        if (currentUser) {
          try {
            const userDocRef = doc(db, "users", currentUser.uid);
            const userSnap = await getDoc(userDocRef);
            
            if (userSnap.exists() && userSnap.data().outcomeMeasureData) {
              const data = userSnap.data().outcomeMeasureData;
              setAnswers(data.responses || {});
              setIsWorking(data.isWorking || false);
              setHasHobby(!!data.hobbyType);
              setHobbyType(data.hobbyType || '');
            }
          } catch (error) {
            console.error("Error loading previous values:", error);
          }
        }
      };
      
      loadPrevValues();
      
      // Default initialization
      setSection('core');
      setStep(1);
      setSaveStatus('');
    }
  }, [isOpen, currentUser]);

  // Handle answer changes
  function handleAnswerChange(questionId, value) {
    setAnswers({ ...answers, [questionId]: value });
  }

  // Total steps per section
  const getCoreStepsCount = () => Math.ceil(coreQuestions.length / 3);
  const getWorkStepsCount = () => Math.ceil(workModuleQuestions.length / 4);
  const getHobbyStepsCount = () => Math.ceil(hobbyModuleQuestions.length / 4);
  
  // Get current questions to display
  function getCurrentQuestions() {
    if (section === 'core') {
      const startIdx = (step - 1) * 3;
      const endIdx = Math.min(startIdx + 3, coreQuestions.length);
      return coreQuestions.slice(startIdx, endIdx);
    } else if (section === 'work') {
      return workModuleQuestions;
    } else if (section === 'hobby') {
      return hobbyModuleQuestions;
    }
    return [];
  }

  // Handle navigation between sections and steps
  function handleNext() {
    const currentQuestions = getCurrentQuestions();
    
    // Validate current page
    if (section === 'core') {
      const allAnswered = currentQuestions.every(q => answers[q.id]);
      if (!allAnswered) {
        setSaveStatus('Please answer all questions before continuing.');
        return;
      }
      
      // Check if we need to move to next step or section
      if (step < getCoreStepsCount()) {
        setStep(step + 1);
      } else {
        setSection('work');
        setStep(1);
      }
      setSaveStatus('');
    } 
    else if (section === 'work') {
      if (!isWorking) {
        // Skip work section if not working
        setSection('hobby');
        setStep(1);
      } else {
        // Check if all work questions are answered
        const allAnswered = workModuleQuestions.every(q => answers[q.id]);
        if (!allAnswered) {
          setSaveStatus('Please answer all work-related questions before continuing.');
          return;
        }
        
        setSection('hobby');
        setStep(1);
      }
      setSaveStatus('');
    } 
    else if (section === 'hobby') {
      if (!hasHobby) {
        // Skip hobby section if no hobby
        handleSubmit();
      } else {
        // Validate hobby type
        if (!hobbyType.trim()) {
          setSaveStatus('Please enter your hobby type.');
          return;
        }
        
        // Check if all hobby questions are answered
        const allAnswered = hobbyModuleQuestions.every(q => answers[q.id]);
        if (!allAnswered) {
          setSaveStatus('Please answer all hobby-related questions before continuing.');
          return;
        }
        
        handleSubmit();
      }
    }
  }

  function handlePrevious() {
    if (section === 'core' && step > 1) {
      setStep(step - 1);
    } 
    else if (section === 'work') {
      // Go back to last step of core section
      setSection('core');
      setStep(getCoreStepsCount());
    } 
    else if (section === 'hobby') {
      setSection('work');
      setStep(1);
    }
    setSaveStatus('');
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

  // Handle form submission
  async function handleSubmit() {
    if (!currentUser) {
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
      }, { merge: true });
      
      // Also store in subcollection for history
      await setDoc(doc(db, "users", currentUser.uid, "outcomeMeasures", new Date().toISOString()), outcomeData);
      
      // Schedule next assessment in 7 days
      const nextDueDate = new Date();
      nextDueDate.setDate(nextDueDate.getDate() + 7);
      
      await updateDoc(doc(db, "users", currentUser.uid), {
        nextQuickDashDueDate: nextDueDate
      });
      
      setSaveStatus('Assessment saved successfully!');
      
      // Notify parent component
      if (onComplete) {
        onComplete(scores.coreScore);
      }
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error("Error saving outcome measure:", error);
      setSaveStatus('Error: Failed to save your assessment. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Create a readable section title
  function getSectionTitle() {
    if (section === 'core') {
      return "Functional Assessment";
    } else if (section === 'work') {
      return "Work Module (Optional)";
    } else if (section === 'hobby') {
      return "Hobby Module (Optional)";
    }
    return "";
  }
  
  // Get current section description
  function getSectionDescription() {
    if (section === 'core') {
      return "The following questions ask about your ability to perform certain activities. Please rate your ability to do the following activities in the last week.";
    } else if (section === 'work') {
      return "These questions relate to the impact of your arm, shoulder, or hand problem on your ability to work.";
    } else if (section === 'hobby') {
      return "These questions relate to the impact of your arm, shoulder, or hand problem on playing a musical instrument, engaging in a hobby, or participating in a sport.";
    }
    return "";
  }

  // Calculate progress percentage
  function getProgressPercentage() {
    let totalSteps = getCoreStepsCount();
    let completedSteps = Math.min(step, getCoreStepsCount());
    
    if (section === 'work' || section === 'hobby') {
      totalSteps += isWorking ? 1 : 0;
      completedSteps += getCoreStepsCount();
      
      if (section === 'hobby') {
        totalSteps += hasHobby ? 1 : 0;
        completedSteps += isWorking ? 1 : 0;
      }
    }
    
    return (completedSteps / totalSteps) * 100;
  }

  if (!isOpen) return null;

  const currentQuestions = getCurrentQuestions();
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">{getSectionTitle()}</h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <p className="mb-6">{getSectionDescription()}</p>
          
          {/* Progress indicator */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Section: {getSectionTitle()}</span>
              <span>{Math.round(getProgressPercentage())}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-red-500 h-2.5 rounded-full" 
                style={{ width: `${getProgressPercentage()}%` }}
              ></div>
            </div>
          </div>
          
          {saveStatus && (
            <div className={`p-3 mb-4 rounded-md ${
              saveStatus.includes('Error') || saveStatus.includes('Please') 
                ? 'bg-red-100 text-red-700' 
                : saveStatus.includes('success') 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-yellow-100 text-yellow-700'
            }`}>
              {saveStatus}
            </div>
          )}
          
          {/* Core Section */}
          {section === 'core' && (
            <div className="space-y-6">
              {currentQuestions.map((question) => (
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
            </div>
          )}
          
          {/* Work Module */}
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
            </div>
          )}
          
          {/* Hobby Module */}
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
                      placeholder="e.g., Gaming, Tennis, Piano"
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
            </div>
          )}
          
          <div className="flex justify-between mt-6">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={(section === 'core' && step === 1) || loading}
              className={`px-5 py-2 border rounded-md ${
                (section === 'core' && step === 1) 
                  ? 'border-gray-200 text-gray-400 cursor-not-allowed' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Previous
            </button>
            
            <button
              type="button"
              onClick={handleNext}
              disabled={loading}
              className="px-5 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:bg-red-300"
            >
              {loading ? "Saving..." : 
                section === 'hobby' || 
                (section === 'work' && !isWorking) || 
                (section === 'hobby' && !hasHobby) 
                  ? "Complete Assessment" 
                  : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}