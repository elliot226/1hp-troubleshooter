import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { loadStripe } from '@stripe/stripe-js';

export default function AccountSettings() {
  const { currentUser } = useAuth();
  const router = useRouter();

  // User Info State
  const [userInfo, setUserInfo] = useState({
    name: '',
    age: '',
    sex: '',
    email: '',
    discordName: ''
  });

  // Payment Info State
  const [paymentInfo, setPaymentInfo] = useState({
    cardName: '',
    cardExpiration: '',
    ccv: '',
    address1: '',
    address2: '',
    paymentMethod: ''
  });

  // Subscription State
  const [subscriptionInfo, setSubscriptionInfo] = useState({
    currentPlan: '',
    nextPaymentDate: null,
    paymentMethod: ''
  });

  // Settings State
  const [settings, setSettings] = useState({
    weightUnits: 'lbs',
    theme: 'light'
  });

  // Loading and Error States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch user data on component mount
  useEffect(() => {
    async function fetchUserData() {
      if (!currentUser) {
        router.push('/login');
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();

          // Update user info state
          setUserInfo({
            name: userData.name || '',
            age: userData.age ? String(userData.age) : '',
            sex: userData.sex || '',
            email: userData.email || currentUser.email,
            discordName: userData.discordName || ''
          });

          // Update payment info state
          setPaymentInfo({
            cardName: userData.cardName || '',
            cardExpiration: userData.cardExpiration || '',
            ccv: '',  // Never load CCV from storage for security
            address1: userData.address1 || '',
            address2: userData.address2 || '',
            paymentMethod: userData.paymentMethod || ''
          });

          // Update subscription info
          if (userData.subscription) {
            setSubscriptionInfo({
              currentPlan: userData.subscription.tier || '',
              nextPaymentDate: userData.subscription.expiresAt 
                ? (userData.subscription.expiresAt.toDate ? userData.subscription.expiresAt.toDate() : new Date(userData.subscription.expiresAt))
                : null,
              paymentMethod: userData.subscription.paymentMethod || ''
            });
          }

          // Update settings
          setSettings({
            weightUnits: userData.weightUnits || 'lbs',
            theme: userData.theme || 'light'
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setError('Failed to load user data');
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, [currentUser, router]);

  // Handle user info form submission
  async function handleUserInfoSubmit(e) {
    e.preventDefault();
    
    if (!currentUser) return;

    try {
      setLoading(true);
      await updateDoc(doc(db, "users", currentUser.uid), {
        name: userInfo.name,
        age: parseInt(userInfo.age),
        sex: userInfo.sex,
        discordName: userInfo.discordName
      });

      setSuccessMessage('User information updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error("Error updating user info:", error);
      setError('Failed to update user information');
    } finally {
      setLoading(false);
    }
  }

  // Handle payment info form submission
  async function handlePaymentInfoSubmit(e) {
    e.preventDefault();
    
    if (!currentUser) return;

    try {
      setLoading(true);
      await updateDoc(doc(db, "users", currentUser.uid), {
        cardName: paymentInfo.cardName,
        cardExpiration: paymentInfo.cardExpiration,
        address1: paymentInfo.address1,
        address2: paymentInfo.address2,
        paymentMethod: paymentInfo.paymentMethod
      });

      setSuccessMessage('Payment information updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error("Error updating payment info:", error);
      setError('Failed to update payment information');
    } finally {
      setLoading(false);
    }
  }

  // Handle settings form submission
  async function handleSettingsSubmit(e) {
    e.preventDefault();
    
    if (!currentUser) return;

    try {
      setLoading(true);
      await updateDoc(doc(db, "users", currentUser.uid), {
        weightUnits: settings.weightUnits,
        theme: settings.theme
      });

      setSuccessMessage('Settings updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error("Error updating settings:", error);
      setError('Failed to update settings');
    } finally {
      setLoading(false);
    }
  }

  // Handle manage subscription click
  async function handleManageSubscription() {
    try {
      // Redirect to Stripe customer portal or initiate Stripe checkout
      const response = await fetch('/api/create-customer-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          customerId: currentUser.stripeCustomerId 
        }),
      });

      const { url } = await response.json();
      
      // Redirect to Stripe's hosted customer portal
      window.location.href = url;
    } catch (error) {
      console.error("Error creating customer portal session:", error);
      setError('Failed to access subscription management');
    }
  }

  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading account information...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar Navigation */}
      <div className="w-48 bg-white border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <Link href="/" className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-red-500 flex items-center justify-center overflow-hidden mr-2">
              <span className="text-white text-xs font-bold">1HP</span>
            </div>
            <span className="font-bold text-sm">1HP Troubleshooter</span>
          </Link>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            <li><Link href="/" className="block py-1 hover:text-red-500">Home</Link></li>
            <li><Link href="/about-plan" className="block py-1 hover:text-red-500">About Plan</Link></li>
            <li><Link href="/exercise-program" className="block py-1 hover:text-red-500">Exercise Program</Link></li>
            <li><Link href="/progress-statistics" className="block py-1 hover:text-red-500">Progress Statistics</Link></li>
            <li><Link href="/load-tracking" className="block py-1 hover:text-red-500">Load Tracking</Link></li>
            <li><Link href="/switch-plan" className="block py-1 hover:text-red-500">Switch Plan</Link></li>
            <li><Link href="/account" className="block py-1 font-bold text-red-500">Account</Link></li>
            <li><Link href="/go-pro" className="block py-1 hover:text-red-500">Go Pro</Link></li>
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-2xl font-bold mb-6">Account Settings</h1>

        {/* Error and Success Messages */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {successMessage}
          </div>
        )}

        {/* User Info Section */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">User Information</h2>
          </div>
          <form onSubmit={handleUserInfoSubmit} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="address1" className="block text-sm font-medium text-gray-700 mb-1">Address 1</label>
                <input
                  type="text"
                  id="address1"
                  value={paymentInfo.address1}
                  onChange={(e) => setPaymentInfo(prev => ({ ...prev, address1: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div>
                <label htmlFor="address2" className="block text-sm font-medium text-gray-700 mb-1">Address 2 (Optional)</label>
                <input
                  type="text"
                  id="address2"
                  value={paymentInfo.address2}
                  onChange={(e) => setPaymentInfo(prev => ({ ...prev, address2: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                />
              </div>
            </div>
            <div className="mt-6 text-right">
              <button 
                type="submit" 
                className="bg-red-500 text-white px-6 py-2 rounded-md hover:bg-red-600"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Payment Info'}
              </button>
            </div>
          </form>
        </div>

        {/* Subscription Information Section */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Subscription</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Plan</label>
                <p className="w-full p-2 border rounded-md bg-gray-100">
                  {subscriptionInfo.currentPlan || 'No active plan'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Next Payment Date</label>
                <p className="w-full p-2 border rounded-md bg-gray-100">
                  {subscriptionInfo.nextPaymentDate 
                    ? subscriptionInfo.nextPaymentDate.toLocaleDateString() 
                    : 'N/A'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <p className="w-full p-2 border rounded-md bg-gray-100">
                  {subscriptionInfo.paymentMethod || 'Not set'}
                </p>
              </div>
            </div>
            <div className="mt-6 text-right">
              <button 
                onClick={handleManageSubscription}
                className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600"
              >
                Manage Subscription
              </button>
            </div>
          </div>
        </div>

        {/* Settings Section */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Settings</h2>
          </div>
          <form onSubmit={handleSettingsSubmit} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="weightUnits" className="block text-sm font-medium text-gray-700 mb-1">Weight Units</label>
                <select
                  id="weightUnits"
                  value={settings.weightUnits}
                  onChange={(e) => setSettings(prev => ({ ...prev, weightUnits: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="lbs">Pounds (lbs)</option>
                  <option value="kg">Kilograms (kg)</option>
                </select>
              </div>
              <div>
                <label htmlFor="theme" className="block text-sm font-medium text-gray-700 mb-1">Theme</label>
                <select
                  id="theme"
                  value={settings.theme}
                  onChange={(e) => setSettings(prev => ({ ...prev, theme: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
            </div>
            <div className="mt-6 text-right">
              <button 
                type="submit" 
                className="bg-red-500 text-white px-6 py-2 rounded-md hover:bg-red-600"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Settings'}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-4 border-t border-gray-200 text-sm text-gray-500">
          <div className="flex space-x-4">
            <Link href="/terms" className="text-blue-500 hover:underline">Terms and Conditions</Link>
            <Link href="/privacy" className="text-blue-500 hover:underline">Privacy Policy</Link>
          </div>
          <p className="mt-2">1Healthpoint Inc. 2025</p>
        </footer>
      </div>
    </div>
  );
}