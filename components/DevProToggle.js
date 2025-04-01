// components/DevProToggle.js
import { useState, useEffect } from 'react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

/**
 * A development-only toggle component for switching between free and pro user status
 */
export default function DevProToggle() {
  const [isProUser, setIsProUser] = useState(false);
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();

  // Load current status on mount
  useEffect(() => {
    async function loadUserStatus() {
      if (!currentUser) return;
      
      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const hasProStatus = !!(userData.subscription && 
                                 userData.subscription.status === 'active' && 
                                 userData.subscription.tier !== 'free');
          
          setIsProUser(hasProStatus);
        }
      } catch (error) {
        console.error("Error loading user status:", error);
      }
    }
    
    loadUserStatus();
  }, [currentUser]);

  /**
   * Toggle the user's pro status
   */
  async function toggleProStatus() {
    if (!currentUser) return;
    
    setLoading(true);
    
    try {
      // Create a new subscription object based on the toggle state
      const newSubscription = isProUser
        ? { status: 'inactive', tier: 'free' } // Set to free
        : { // Set to pro
            status: 'active',
            tier: 'monthly',
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            devModeEnabled: true
          };
      
      // Update the document
      await updateDoc(doc(db, "users", currentUser.uid), {
        subscription: newSubscription
      });
      
      // Update local state
      setIsProUser(!isProUser);
      
      // Show feedback
      alert(`Successfully switched to ${!isProUser ? 'PRO' : 'FREE'} status`);
      
    } catch (error) {
      console.error("Error toggling pro status:", error);
      alert("Error updating status: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 my-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-yellow-800 font-bold">Development Mode</h3>
          <p className="text-yellow-700 text-sm">Current status: 
            <span className={`font-bold ${isProUser ? 'text-green-600' : 'text-gray-600'}`}>
              {isProUser ? ' PRO' : ' FREE'}
            </span>
          </p>
        </div>
        
        <div className="flex items-center">
          <span className={`mr-2 text-sm ${isProUser ? 'text-green-600' : 'text-gray-500'}`}>
            {isProUser ? 'Pro' : 'Free'}
          </span>
          
          <button
            onClick={toggleProStatus}
            disabled={loading}
            className="relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
            style={{ backgroundColor: isProUser ? '#10B981' : '#6B7280' }}
          >
            <span
              className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                isProUser ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}