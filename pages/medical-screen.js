// pages/medical-screen.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { getDoc, setDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import AssessmentLayout from '@/components/AssessmentLayout';

const medicalScreeningQuestions = [
  {
    id: 'nonRepetitiveUse',
    question: 'Do you suspect your pain / symptoms are not from repetitive use?',
    isRedFlag: true
  },
  {
    id: 'weightLoss',
    question: 'Have you lost more than 12 pounds in the past month without being able to explain this?',
    isRedFlag: true
  },
  {
    id: 'accident',
    question: 'Were the symptoms caused by an accident or fall?',
    isRedFlag: true
  },
  {
    id: 'corticosteroids',
    question: 'Have you been using corticosteroids (anti-inflammatories) for over a year?',
    isRedFlag: true
  },
  {
    id: 'constantPain',
    question: 'Do you experience constant pain that does not reduce when resting or when you change position?',
    isRedFlag: true
  },
  {
    id: 'cancer',
    question: 'Have you had any form of cancer?',
    isRedFlag: true
  },
  {
    id: 'sickness',
    question: 'Do you often feel sick, nauseous, tired or have you lost your appetite?',
    isRedFlag: true
  },
  {
    id: 'nightPain',
    question: 'Do you suffer unrelenting pain at night (when lying in bed)?',
    isRedFlag: true
  },
  {
    id: 'cannotBearWeight',
    question: 'Are you in so much pain that you absolutely cannot put any weight on the affected area?',
    isRedFlag: true
  },
  {
    id: 'fever',
    question: 'Have you had an unexplained fever for some time?',
    isRedFlag: true
  },
  {
    id: 'fingerDiscoloration',
    question: 'Do your fingers change color (white, blue, or red) in response to cold or stress?',
    isRedFlag: true
  },
  {
    id: 'swelling',
    question: 'Do you experience swelling or unusual temperature changes in your hand or wrist?',
    isRedFlag: true
  },
  {
    id: 'redness',
    question: 'Do you have any redness, warmth, or swelling in the wrist that is not related to a recent injury?',
    isRedFlag: true
  },
  {
    id: 'autoimmune',
    question: 'Do you have a history of autoimmune conditions like rheumatoid arthritis or lupus?',
    isRedFlag: true
  }
];

export default function MedicalScreen() {
  const [answers, setAnswers] = useState({});
  const [showWarning, setShowWarning] = useState(false);
  const [redFlagQuestions, setRedFlagQuestions] = useState([]);
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
        // Check if user has completed user details
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // If user details aren't completed, redirect to that step
          if (!userData.userDetailsCompleted) {
            router.push('/user-details');
            return;
          }
          
          // Load previous answers if available
          if (userData.medicalScreening) {
            setAnswers(userData.medicalScreening);
            
            // Check for any red flags
            const flaggedQuestions = [];
            for (const [id, value] of Object.entries(userData.medicalScreening)) {
              const question = medicalScreeningQuestions.find(q => q.id === id);
              if (question?.isRedFlag && value === true) {
                flaggedQuestions.push(id);
              }
            }
            setRedFlagQuestions(flaggedQuestions);
          }
          
          // Check if user has already completed the assessment
          if (userData.assessmentCompleted) {
            router.push('/dashboard');
          }
        } else {
          // If no user document, redirect to user details
          router.push('/user-details');
        }
      } catch (error) {
        console.error("Error loading medical screening data:", error);
      } finally {
        setInitialLoading(false);
      }
    }
    
    loadExistingData();
  }, [currentUser, router]);

  // Handle answer change
  function handleAnswerChange(questionId, value) {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);
    
    // Check if a red flag answer requires showing the warning
    const question = medicalScreeningQuestions.find(q => q.id === questionId);
    if (question?.isRedFlag && value === true) {
      if (!redFlagQuestions.includes(questionId)) {
        setRedFlagQuestions([...redFlagQuestions, questionId]);
      }
    } else {
      // Remove from redFlagQuestions if it was previously marked
      setRedFlagQuestions(prev => prev.filter(id => id !== questionId));
    }
  }

  // Handle form submission
  async function handleSubmit(e) {
    e.preventDefault();
    
    // Check if all questions are answered
    const allAnswered = medicalScreeningQuestions.every(q => answers[q.id] !== undefined);
    
    if (!allAnswered) {
      setSaveStatus('Error: Please answer all questions before continuing.');
      return;
    }
    
    // Show warning if any red flags are detected
    if (redFlagQuestions.length > 0 && !showWarning) {
      setShowWarning(true);
      return;
    }
    
    setLoading(true);
    setSaveStatus('Saving your responses...');
    
    try {
      // Save answers to Firebase
      if (currentUser) {
        await setDoc(doc(db, "users", currentUser.uid), {
          medicalScreening: answers,
          medicalScreeningDate: new Date(),
          medicalScreeningCompleted: true
        }, { merge: true });
      }
      
      setSaveStatus('Medical screening saved successfully!');
      
      // Navigate to the next screen in the assessment flow
      setTimeout(() => {
        router.push('/outcome-measure');
      }, 1000);
    } catch (error) {
      console.error("Error saving medical screening:", error);
      setSaveStatus('Error: Failed to save your responses. Please try again.');
    } finally {
      setLoading(false);
    }
  }
  
  // Continue after warning
  function continueAfterWarning() {
    setShowWarning(false);
    // Immediately proceed to submit
    handleSubmit(new Event('submit'));
  }
  
  // Handle back button
  function handleBack() {
    router.push('/user-details');
  }

  return (
    <AssessmentLayout
      currentStep="medical-screen"
      title="Medical Screening"
      description="Please answer these questions honestly to help us provide the most appropriate care for you."
      loadingState={initialLoading}
      saveStatus={saveStatus}
      onBack={handleBack}
    >
      {showWarning ? (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-5 mb-6">
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">Medical Warning</h2>
          <p className="mb-4">
            Based on your responses, we recommend you talk to your doctor about your symptoms before continuing.
          </p>
          <p className="mb-6">
            While our app can help with many types of wrist pain, your symptoms may require medical attention.
          </p>
          <div className="flex justify-center">
            <button 
              onClick={continueAfterWarning} 
              className="px-6 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
            >
              Continue Assessment Anyway
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {medicalScreeningQuestions.map((question) => (
            <div key={question.id} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
              <p className="mb-2 font-medium">{question.question}</p>
              <div className="flex space-x-6">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name={question.id}
                    checked={answers[question.id] === true}
                    onChange={() => handleAnswerChange(question.id, true)}
                    className="w-4 h-4 text-red-600"
                  />
                  <span className="ml-2">Yes</span>
                </label>
                
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name={question.id}
                    checked={answers[question.id] === false}
                    onChange={() => handleAnswerChange(question.id, false)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="ml-2">No</span>
                </label>
              </div>
            </div>
          ))}
          
          <div className="flex justify-center mt-8">
            <button 
              type="submit"
              disabled={loading}
              className="bg-red-500 text-white px-8 py-3 rounded-full font-medium hover:bg-red-600 disabled:bg-gray-400"
            >
              {loading ? "Saving..." : "Continue"}
            </button>
          </div>
        </form>
      )}
    </AssessmentLayout>
  );
}