// pages/switch-plan.js
import { useState } from 'react';
import { useRouter } from 'next/router';
import ProtectedPage from '@/components/layouts/ProtectedPage';
import Link from 'next/link';

export default function SwitchPlan() {
  const router = useRouter();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [planToDelete, setPlanToDelete] = useState(null);

  // Function to handle starting a new plan
  const handleStartNewPlan = () => {
    router.push('/medical-screen');
  };

  // Function to handle plan deletion (confirmation)
  const handleDeletePlan = (planId) => {
    setPlanToDelete(planId);
    setShowConfirmation(true);
  };

  // Function to confirm plan deletion
  const confirmDeletePlan = () => {
    // Here you would implement the actual deletion logic
    console.log(`Deleting plan ${planToDelete}`);
    setShowConfirmation(false);
    setPlanToDelete(null);
  };

  return (
    <ProtectedPage>
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Switch Plan</h1>
      </header>

      {/* Start New Plan Button */}
      <div className="my-6 flex justify-center">
        <button 
          onClick={handleStartNewPlan}
          className="bg-red-500 text-white px-12 py-4 rounded-full text-lg font-medium hover:bg-red-600"
        >
          START NEW PLAN
        </button>
      </div>

      {/* Current Plan Section */}
      <div className="my-8">
        <h2 className="text-xl font-bold mb-4">Current Plan</h2>
        <div className="flex items-center space-x-4 py-2">
          <div className="w-4 h-4 rounded-full bg-green-500"></div>
          <span className="font-medium">
            Plan 3 (<span className="text-red-500">Wrist Flexors</span>, <span className="text-red-500">Fingers</span>)
          </span>
          <span className="ml-auto text-gray-500">2/23/25</span>
        </div>
      </div>

      {/* Other Plans Section */}
      <div className="my-8">
        <h2 className="text-xl font-bold mb-4">Other Plans</h2>
        
        {/* Plan 2 */}
        <div className="flex items-center space-x-4 py-2">
          <div className="w-4 h-4 rounded-full bg-red-500"></div>
          <span className="font-medium">
            Plan 2 (<span className="text-gray-700">Thumb Extensors</span>, <span className="text-red-500">Wrist Flexors</span>)
          </span>
          <span className="ml-auto text-gray-500 mr-4">2/23/25</span>
          <button 
            onClick={() => handleDeletePlan(2)}
            className="text-gray-500 hover:text-red-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        {/* Plan 1 */}
        <div className="flex items-center space-x-4 py-2">
          <div className="w-4 h-4 rounded-full bg-red-500"></div>
          <span className="font-medium">
            Plan 1 (<span className="text-gray-700">Wrist Extensors</span>, <span className="text-red-500">Wrist Flexors</span>)
          </span>
          <span className="ml-auto text-gray-500 mr-4">2/23/25</span>
          <button 
            onClick={() => handleDeletePlan(1)}
            className="text-gray-500 hover:text-red-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md">
            <h3 className="text-lg font-bold mb-4">Delete Plan</h3>
            <p className="mb-6">Are you sure you want to delete Plan {planToDelete}? This action cannot be undone.</p>
            <div className="flex justify-end space-x-4">
              <button 
                onClick={() => setShowConfirmation(false)}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeletePlan}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedPage>
  );
}