// components/AssessmentLayout.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

const assessmentSteps = [
  { id: 'user-details', name: 'User Details' },
  { id: 'medical-screen', name: 'Medical Screening' },
  { id: 'outcome-measure', name: 'Functional Assessment' },
  { id: 'pain-region', name: 'Pain Region' },
  { id: 'nerve-symptoms', name: 'Nerve Symptoms' },
  { id: 'mobility-test', name: 'Mobility Test' },
  { id: 'endurance-test', name: 'Endurance Test' },
  { id: 'nerve-mobility-test', name: 'Nerve Mobility Test' },
];

export default function AssessmentLayout({ 
  children, 
  currentStep, 
  title, 
  description,
  loadingState = false,
  saveStatus = '',
  onBack
}) {
  const router = useRouter();
  const currentStepIndex = assessmentSteps.findIndex(step => step.id === currentStep);
  const progress = ((currentStepIndex + 1) / assessmentSteps.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header with logo only */}
      <header className="bg-white shadow-sm p-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-red-500 flex items-center justify-center overflow-hidden mr-2">
              <span className="text-white text-xs font-bold">1HP</span>
            </div>
            <span className="font-bold">1HP Troubleshooter</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-500">Assessment Progress</span>
            <span className="text-sm font-medium text-gray-500">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-red-500 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
          </div>
          
          {/* Step Pills */}
          <div className="mt-4 flex flex-wrap gap-2">
            {assessmentSteps.map((step, index) => (
              <div 
                key={step.id}
                className={`px-3 py-1 rounded-full text-xs 
                  ${index < currentStepIndex 
                    ? 'bg-green-100 text-green-800' 
                    : index === currentStepIndex 
                      ? 'bg-red-500 text-white' 
                      : 'bg-gray-100 text-gray-500'
                  }`}
              >
                {index + 1}. {step.name}
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <header className="mb-6">
            <h1 className="text-2xl font-bold">{title}</h1>
            {description && <p className="mt-2 text-gray-600">{description}</p>}
          </header>
          
          {saveStatus && (
            <div className={`mb-4 p-3 rounded text-sm ${
              saveStatus.includes("Error") 
                ? "bg-red-100 text-red-700" 
                : saveStatus.includes("Warning")
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-green-100 text-green-700"
            }`}>
              {saveStatus}
            </div>
          )}
          
          {loadingState ? (
            <div className="flex justify-center items-center p-8">
              <div className="w-12 h-12 border-4 border-t-red-500 border-gray-200 border-solid rounded-full animate-spin"></div>
            </div>
          ) : (
            children
          )}
          
          {/* Navigation */}
          {currentStepIndex > 0 && onBack && (
            <div className="mt-6 flex">
              <button 
                onClick={onBack}
                className="text-gray-500 hover:text-gray-800 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Back
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white p-4 border-t border-gray-200 text-sm text-gray-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex space-x-4">
              <Link href="/terms" className="hover:underline">Terms and Conditions</Link>
              <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
            </div>
            <p>1Healthpoint Inc. 2025</p>
          </div>
        </div>
      </footer>
    </div>
  );
}