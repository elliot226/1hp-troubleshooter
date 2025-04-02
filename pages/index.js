import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-blue-600">1HP Troubleshooter</div>
          <div className="flex space-x-4">
            <Link href="/login" className="px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50">
              Log In
            </Link>
            <Link href="/signup" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Play Without Pain<br />Work Without Strain</h1>
              <p className="text-xl text-gray-600 mb-8">
                Your personalized recovery plan for wrist pain and RSI
              </p>
              <Link href="/dashboard" className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 inline-block">
                Get Started
              </Link>
            </div>
            <div className="md:w-1/2">
              <div className="bg-gray-200 h-64 rounded-lg flex items-center justify-center">
                Hero image would go here
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">How 1HP Troubleshooter Works</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="text-4xl mb-4">📋</div>
                <h3 className="text-xl font-semibold mb-2">Assessment</h3>
                <p className="text-gray-600">Complete a comprehensive assessment to identify the exact cause of your pain</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-xl font-semibold mb-2">Personalized Plan</h3>
                <p className="text-gray-600">Get a custom exercise program tailored to your specific pain patterns</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="text-xl font-semibold mb-2">Progress Tracking</h3>
                <p className="text-gray-600">Track your recovery with detailed statistics and functional improvements</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="text-4xl mb-4">⏱️</div>
                <h3 className="text-xl font-semibold mb-2">Load Management</h3>
                <p className="text-gray-600">Learn optimal activity levels to balance recovery with daily demands</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2025 1Healthpoint Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}