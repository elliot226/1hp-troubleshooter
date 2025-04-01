// pages/go-pro.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { loadStripe } from '@stripe/stripe-js';
import { getUserData } from '../lib/firestoreUtils';
import Link from 'next/link';
import DevProToggle from '../components/DevProToggle';

// Load Stripe outside of component render
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function GoPro() {
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const { currentUser } = useAuth();
  const router = useRouter();
  
  // Track if we're in development mode
  const isDevelopment = process.env.NODE_ENV === 'development';

  useEffect(() => {
    // Redirect if not logged in
    if (!currentUser) {
      router.push('/login');
      return;
    }

    // Load user data
    async function loadUserData() {
      try {
        const data = await getUserData(currentUser.uid);
        setUserData(data);
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    }

    loadUserData();
  }, [currentUser, router]);

  async function handleSubscription(planId) {
    if (!currentUser) {
      router.push('/login');
      return;
    }

    setLoading(true);

    try {
      // Create checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          userId: currentUser.uid,
        }),
      });

      const { sessionId } = await response.json();

      // Redirect to checkout
      const stripe = await stripePromise;
      const { error } = await stripe.redirectToCheckout({
        sessionId,
      });

      if (error) {
        console.error('Error redirecting to checkout:', error);
        alert('An error occurred. Please try again.');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Check if user already has a subscription
  const hasActiveSubscription = userData?.subscription?.status === 'active';

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
            <li><Link href="/account" className="block py-1 hover:text-red-500">Account</Link></li>
            <li><Link href="/go-pro" className="block py-1 font-bold text-red-500">Go Pro</Link></li>
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        <header className="mb-8">
          <h1 className="text-2xl font-bold">Go Pro</h1>
          <p className="mt-2 text-gray-600">
            Unlock all features and enhance your recovery journey.
          </p>
        </header>

        {/* Development Mode Toggle - Only shown in development */}
        {isDevelopment && <DevProToggle />}

        {hasActiveSubscription ? (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-xl font-bold mb-2">You're a Pro Member!</h2>
              <p className="text-gray-600 mb-4">
                Your subscription is active until: {userData?.subscription?.expiresAt?.toDate?.().toLocaleDateString() || 'N/A'}
              </p>
              <p className="text-gray-600 mb-6">
                Plan: {userData?.subscription?.tier || 'N/A'}
              </p>
              
              {userData?.subscription?.cancelAtPeriodEnd && (
                <div className="bg-yellow-100 text-yellow-800 p-4 rounded-md mb-6">
                  Your subscription will cancel at the end of the current period.
                </div>
              )}
              
              <button
                onClick={() => router.push('/account')}
                className="bg-gray-200 text-gray-800 hover:bg-gray-300 px-6 py-2 rounded-md font-medium transition-colors"
              >
                Manage Subscription
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Weekly Plan */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 transition-all hover:shadow-lg">
                <div className="p-6 bg-gray-50 border-b">
                  <h2 className="text-xl font-bold text-center">Weekly</h2>
                </div>
                <div className="p-6">
                  <div className="text-center mb-6">
                    <p className="text-3xl font-bold">$14.99<span className="text-lg text-gray-500">/week</span></p>
                  </div>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>All Exercises Unlocked</span>
                    </li>
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Progress Tracking</span>
                    </li>
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Load Tracking</span>
                    </li>
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Multiple Plans</span>
                    </li>
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-gray-400 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-500">Access to Q/A Library</span>
                    </li>
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-gray-400 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-500">Expert Calls</span>
                    </li>
                  </ul>
                  <button
                    onClick={() => handleSubscription('weekly')}
                    disabled={loading}
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-md transition-colors"
                  >
                    {loading ? 'Processing...' : 'Start Now'}
                  </button>
                </div>
              </div>
              
              {/* Monthly Plan - Featured */}
              <div className="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-red-500 transition-all hover:shadow-xl transform scale-105 md:scale-110">
                <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-3 py-1">
                  POPULAR
                </div>
                <div className="p-6 bg-red-50 border-b border-red-200">
                  <h2 className="text-xl font-bold text-center">Monthly</h2>
                </div>
                <div className="p-6">
                  <div className="text-center mb-6">
                    <p className="text-3xl font-bold">$9.99<span className="text-lg text-gray-500">/week</span></p>
                  </div>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>All Exercises Unlocked</span>
                    </li>
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Progress Tracking</span>
                    </li>
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Load Tracking</span>
                    </li>
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Multiple Plans</span>
                    </li>
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-gray-400 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-500">Access to Q/A Library</span>
                    </li>
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-gray-400 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-500">Expert Calls</span>
                    </li>
                  </ul>
                  <button
                    onClick={() => handleSubscription('monthly')}
                    disabled={loading}
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-md transition-colors"
                  >
                    {loading ? 'Processing...' : 'Start Now'}
                  </button>
                </div>
              </div>
              
              {/* Annual Plan */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 transition-all hover:shadow-lg">
                <div className="absolute top-0 right-0 bg-green-500 text-white text-xs font-bold px-3 py-1">
                  SAVE 67%
                </div>
                <div className="p-6 bg-gray-50 border-b">
                  <h2 className="text-xl font-bold text-center">Annual</h2>
                </div>
                <div className="p-6">
                  <div className="text-center mb-6">
                    <p className="text-3xl font-bold">$4.99<span className="text-lg text-gray-500">/week</span></p>
                  </div>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>All Exercises Unlocked</span>
                    </li>
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Progress Tracking</span>
                    </li>
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Load Tracking</span>
                    </li>
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Multiple Plans</span>
                    </li>
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Access to Q/A Library</span>
                    </li>
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>2 Free Expert Calls</span>
                    </li>
                  </ul>
                  <button
                    onClick={() => handleSubscription('annual')}
                    disabled={loading}
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-md transition-colors"
                  >
                    {loading ? 'Processing...' : 'Start Now'}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
              <h3 className="text-lg font-medium text-blue-800 mb-2">30-Day Money-Back Guarantee</h3>
              <p className="text-blue-600">
                If you're not completely satisfied with your subscription, we'll refund your payment within the first 30 days.
              </p>
            </div>
          </div>
        )}

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