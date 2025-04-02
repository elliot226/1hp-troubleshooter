// components/layouts/MainLayout.js
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import MobileMenu from '../MobileMenu';

export default function MainLayout({ children }) {
  const router = useRouter();
  const { currentUser, logout } = useAuth();
  const [userName, setUserName] = useState('');
  
  useEffect(() => {
    // Set user name from current user if available
    if (currentUser?.displayName) {
      setUserName(currentUser.displayName);
    } else if (currentUser?.email) {
      // Use email before @ symbol as name
      setUserName(currentUser.email.split('@')[0]);
    }
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Header */}
      <header className="bg-white shadow-sm p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">1HP</span>
            </div>
            <span className="font-bold text-lg">1HP Troubleshooter</span>
            {userName && (
              <span className="text-sm text-gray-500 ml-4">Welcome Back {userName}</span>
            )}
          </div>
          <div className="flex items-center space-x-4 md:space-x-8">
            <Link href="/dashboard" className="text-gray-700 hover:text-red-500 hidden md:block">Home</Link>
            <Link href="/talk-to-expert" className="text-gray-700 hover:text-red-500 hidden md:block">Talk to an Expert</Link>
            <Link href="/addons" className="text-gray-700 hover:text-red-500 hidden md:block">Addons</Link>
            <button 
              onClick={handleLogout}
              className="text-gray-700 hover:text-red-500"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-48 bg-white border-r border-gray-200 sticky top-0 h-screen hidden md:block">
          <nav className="p-4">
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/dashboard" 
                  className={`block py-1 ${router.pathname === '/dashboard' ? 'font-bold text-red-500' : 'hover:text-red-500'}`}
                >
                  Home
                </Link>
              </li>
              <li>
                <Link 
                  href="/about-plan" 
                  className={`block py-1 ${router.pathname === '/about-plan' ? 'font-bold text-red-500' : 'hover:text-red-500'}`}
                >
                  About Plan
                </Link>
              </li>
              <li>
                <Link 
                  href="/exercise-program" 
                  className={`block py-1 ${router.pathname === '/exercise-program' ? 'font-bold text-red-500' : 'hover:text-red-500'}`}
                >
                  Exercise Program
                </Link>
              </li>
              <li>
                <Link 
                  href="/progress-statistics" 
                  className={`block py-1 ${router.pathname === '/progress-statistics' ? 'font-bold text-red-500' : 'hover:text-red-500'}`}
                >
                  Progress Statistics
                </Link>
              </li>
              <li>
                <Link 
                  href="/load-tracking" 
                  className={`block py-1 ${router.pathname === '/load-tracking' ? 'font-bold text-red-500' : 'hover:text-red-500'}`}
                >
                  Load Tracking
                </Link>
              </li>
              <li>
                <Link 
                  href="/switch-plan" 
                  className={`block py-1 ${router.pathname === '/switch-plan' ? 'font-bold text-red-500' : 'hover:text-red-500'}`}
                >
                  Switch Plan
                </Link>
              </li>
              <li>
                <Link 
                  href="/account" 
                  className={`block py-1 ${router.pathname === '/account' ? 'font-bold text-red-500' : 'hover:text-red-500'}`}
                >
                  Account
                </Link>
              </li>
              <li>
                <Link 
                  href="/go-pro" 
                  className={`block py-1 ${router.pathname === '/go-pro' ? 'font-bold text-red-500' : 'hover:text-red-500'}`}
                >
                  Go Pro
                </Link>
              </li>
            </ul>
          </nav>
          
          <div className="absolute bottom-0 left-0 right-0 p-4 text-sm text-blue-600">
            <Link href="/terms" className="block hover:underline">Terms and Conditions</Link>
            <Link href="/privacy" className="block hover:underline">Privacy Policy</Link>
            <p className="text-gray-500 mt-1">1Healthpoint Inc. 2025</p>
          </div>
        </aside>

        {/* Mobile Menu */}
        <MobileMenu />

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 bg-gray-50 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}