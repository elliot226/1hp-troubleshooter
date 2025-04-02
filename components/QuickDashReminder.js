// components/QuickDashReminder.js
import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import InlineQuickDashAssessment from './InlineQuickDashAssessment';

export default function QuickDashReminder() {
  const [showPopup, setShowPopup] = useState(false);
  const [showBar, setShowBar] = useState(false);
  const [showAssessment, setShowAssessment] = useState(false);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;

    async function checkQuickDashStatus() {
      try {
        setLoading(true);
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        
        if (!userDoc.exists()) return;
        
        const userData = userDoc.data();
        const now = new Date();
        
        // Check if exercise program is initialized
        if (!userData.exerciseProgramInitializedDate) return;
        
        // Get the next QuickDASH due date
        const nextDueDate = userData.nextQuickDashDueDate?.toDate() || null;
        
        // If no next due date, calculate it
        if (!nextDueDate) {
          const initDate = userData.exerciseProgramInitializedDate.toDate();
          const nextDate = new Date(initDate.getTime() + 7 * 24 * 60 * 60 * 1000);
          
          // Update in Firestore
          await updateDoc(doc(db, "users", currentUser.uid), {
            nextQuickDashDueDate: nextDate
          });
          
          if (now >= nextDate) {
            setShowPopup(true);
          }
          return;
        }
        
        // If the QuickDASH is due and hasn't been dismissed today
        if (now >= nextDueDate) {
          // Check if we haven't shown a reminder today
          const lastReminder = userData.lastQuickDashReminderDate?.toDate() || new Date(0);
          const isNewDay = new Date(lastReminder).setHours(0, 0, 0, 0) < new Date(now).setHours(0, 0, 0, 0);
          
          if (isNewDay) {
            setShowPopup(true);
            
            // Update the last reminder date
            await updateDoc(doc(db, "users", currentUser.uid), {
              lastQuickDashReminderDate: now
            });
          } else {
            // If reminder was dismissed today but still not completed, show the bar
            setShowBar(true);
          }
        }
      } catch (error) {
        console.error("Error checking QuickDASH status:", error);
      } finally {
        setLoading(false);
      }
    }
    
    checkQuickDashStatus();
  }, [currentUser]);

  const handleStartOutcomeMeasure = () => {
    // Open the inline assessment instead of redirecting
    setShowAssessment(true);
    dismissReminder();
  };

  const dismissReminder = async () => {
    setShowPopup(false);
    setShowBar(true);
    
    // Update the last reminder date
    if (currentUser) {
      try {
        await updateDoc(doc(db, "users", currentUser.uid), {
          lastQuickDashReminderDate: new Date()
        });
      } catch (error) {
        console.error("Error updating last reminder date:", error);
      }
    }
  };

  const handleAssessmentComplete = (score) => {
    console.log("QuickDASH assessment completed with score:", score);
    setShowBar(false); // Hide the reminder bar now that assessment is complete
  };

  const handleAssessmentClose = () => {
    setShowAssessment(false);
  };

  if (loading || (!showPopup && !showBar && !showAssessment)) {
    return null;
  }

  return (
    <>
      {/* Persistent reminder bar */}
      {showBar && !showPopup && (
        <div className="fixed top-0 left-0 right-0 bg-red-500 text-white py-2 px-4 flex justify-between items-center z-50">
          <p className="text-sm">Your weekly assessment is due. Help us track your progress!</p>
          <button 
            onClick={handleStartOutcomeMeasure}
            className="bg-white text-red-500 px-3 py-1 rounded-md text-sm font-medium hover:bg-gray-100"
          >
            Complete Now
          </button>
        </div>
      )}

      {/* Popup modal */}
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Weekly Progress Check</h2>
              <p className="mb-4">
                It's time for your weekly functional assessment! This quick survey helps us track your progress and tailor recommendations to your needs.
              </p>
              <p className="mb-6 text-sm text-gray-600">
                The more data we have, the better we can customize your treatment plan and monitor your improvement.
              </p>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
                <button 
                  onClick={dismissReminder}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Remind Me Later
                </button>
                <button 
                  onClick={handleStartOutcomeMeasure}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                  Start Assessment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inline QuickDASH Assessment */}
      <InlineQuickDashAssessment 
        isOpen={showAssessment}
        onClose={handleAssessmentClose}
        onComplete={handleAssessmentComplete}
      />
    </>
  );
}