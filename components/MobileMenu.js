// components/MobileMenu.js
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // Close the menu when a route is selected
  const handleNavigation = () => {
    setIsOpen(false);
  };

  return (
    <div className="md:hidden">
      {/* Menu Toggle Button */}
      <button 
        onClick={toggleMenu}
        className="fixed z-40 bottom-4 right-4 bg-red-500 text-white p-3 rounded-full shadow-lg"
        aria-label="Toggle Menu"
      >
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={toggleMenu}></div>

      {/* Mobile Menu Content */}
      <div className={`fixed inset-y-0 left-0 max-w-xs w-full bg-white z-30 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-red-500 flex items-center justify-center overflow-hidden mr-2">
                <span className="text-white text-xs font-bold">1HP</span>
              </div>
              <span className="font-bold text-sm">1HP Troubleshooter</span>
            </div>
            <button 
              onClick={toggleMenu}
              className="text-gray-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <nav className="p-4">
          <ul className="space-y-2">
            <li>
              <Link 
                href="/dashboard" 
                className={`block py-2 px-4 rounded ${router.pathname === '/dashboard' ? 'font-bold text-red-500 bg-red-50' : 'hover:bg-gray-50'}`}
                onClick={handleNavigation}
              >
                Home
              </Link>
            </li>
            <li>
              <Link 
                href="/about-plan" 
                className={`block py-2 px-4 rounded ${router.pathname === '/about-plan' ? 'font-bold text-red-500 bg-red-50' : 'hover:bg-gray-50'}`}
                onClick={handleNavigation}
              >
                About Plan
              </Link>
            </li>
            <li>
              <Link 
                href="/exercise-program" 
                className={`block py-2 px-4 rounded ${router.pathname === '/exercise-program' ? 'font-bold text-red-500 bg-red-50' : 'hover:bg-gray-50'}`}
                onClick={handleNavigation}
              >
                Exercise Program
              </Link>
            </li>
            <li>
              <Link 
                href="/progress-statistics" 
                className={`block py-2 px-4 rounded ${router.pathname === '/progress-statistics' ? 'font-bold text-red-500 bg-red-50' : 'hover:bg-gray-50'}`}
                onClick={handleNavigation}
              >
                Progress Statistics
              </Link>
            </li>
            <li>
              <Link 
                href="/load-tracking" 
                className={`block py-2 px-4 rounded ${router.pathname === '/load-tracking' ? 'font-bold text-red-500 bg-red-50' : 'hover:bg-gray-50'}`}
                onClick={handleNavigation}
              >
                Load Tracking
              </Link>
            </li>
            <li>
              <Link 
                href="/switch-plan" 
                className={`block py-2 px-4 rounded ${router.pathname === '/switch-plan' ? 'font-bold text-red-500 bg-red-50' : 'hover:bg-gray-50'}`}
                onClick={handleNavigation}
              >
                Switch Plan
              </Link>
            </li>
            <li>
              <Link 
                href="/account" 
                className={`block py-2 px-4 rounded ${router.pathname === '/account' ? 'font-bold text-red-500 bg-red-50' : 'hover:bg-gray-50'}`}
                onClick={handleNavigation}
              >
                Account
              </Link>
            </li>
            <li>
              <Link 
                href="/go-pro" 
                className={`block py-2 px-4 rounded ${router.pathname === '/go-pro' ? 'font-bold text-red-500 bg-red-50' : 'hover:bg-gray-50'}`}
                onClick={handleNavigation}
              >
                Go Pro
              </Link>
            </li>
          </ul>
          
          <div className="border-t border-gray-200 mt-6 pt-4">
            <Link 
              href="/talk-to-expert" 
              className="block py-2 px-4 rounded hover:bg-gray-50"
              onClick={handleNavigation}
            >
              Talk to an Expert
            </Link>
            <Link 
              href="/addons" 
              className="block py-2 px-4 rounded hover:bg-gray-50"
              onClick={handleNavigation}
            >
              Addons
            </Link>
          </div>
        </nav>
        
        <div className="absolute bottom-0 left-0 right-0 p-4 text-sm text-blue-600 border-t border-gray-200 bg-white">
          <Link href="/terms" className="block hover:underline py-1">Terms and Conditions</Link>
          <Link href="/privacy" className="block hover:underline py-1">Privacy Policy</Link>
          <p className="text-gray-500 mt-1">1Healthpoint Inc. 2025</p>
        </div>
      </div>
    </div>
  );
}