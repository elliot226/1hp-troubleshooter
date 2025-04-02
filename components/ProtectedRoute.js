// components/ProtectedRoute.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { hasCompletedAssessment } from '@/lib/userUtils';

// Define assessment flow pages
const assessmentFlowPages = [
  '/user-details',
  '/medical-screen',
  '/outcome-measure',
  '/pain-region',
  '/nerve-symptoms',
  '/mobility-test',
  '/endurance-test',
  '/nerve-mobility-test'
];

// Define public pages that don't require authentication
const publicPages = ['/', '/login', '/signup', '/terms', '/privacy'];

export default function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth();
  const [assessmentComplete, setAssessmentComplete] = useState(null);
  const [checkingAssessment, setCheckingAssessment] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkAuthAndAssessment() {
      // Skip if still loading auth state
      if (loading) return;

      // If user is not logged in and page requires authentication, redirect to login
      if (!currentUser) {
        if (!publicPages.includes(router.pathname)) {
          router.push('/login');
        }
        setCheckingAssessment(false);
        return;
      }

      // For assessment flow pages, we need to ensure proper sequence
      if (assessmentFlowPages.includes(router.pathname)) {
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const currentIndex = assessmentFlowPages.indexOf(router.pathname);
            
            // For any assessment page (except the first), check if previous step is completed
            if (currentIndex > 0) {
              const previousPage = assessmentFlowPages[currentIndex - 1];
              const previousStepCompleted = isPreviousStepCompleted(userData, previousPage);
              
              if (!previousStepCompleted) {
                // Redirect to the first incomplete step
                const incompleteStep = findFirstIncompleteStep(userData);
                router.push(incompleteStep || assessmentFlowPages[0]);
                setCheckingAssessment(false);
                return;
              }
            }
            
            // If already completed assessment and trying to access assessment flow, go to dashboard
            if (userData.assessmentCompleted && router.pathname !== '/dashboard') {
              router.push('/dashboard');
              setCheckingAssessment(false);
              return;
            }
          }
        } catch (error) {
          console.error("Error checking assessment steps:", error);
        }
      }
      // For non-assessment, non-public pages (like dashboard), check assessment completion
      else if (!publicPages.includes(router.pathname)) {
        try {
          const isComplete = await hasCompletedAssessment(currentUser.uid);
          setAssessmentComplete(isComplete);
          
          if (!isComplete) {
            // Redirect to first step of assessment
            router.push('/user-details');
            setCheckingAssessment(false);
            return;
          }
        } catch (error) {
          console.error("Error checking assessment completion:", error);
          router.push('/user-details');
          setCheckingAssessment(false);
          return;
        }
      }
      
      setCheckingAssessment(false);
    }

    checkAuthAndAssessment();
  }, [currentUser, loading, router, router.pathname]);

  // Helper function to check if previous step is completed
  function isPreviousStepCompleted(userData, previousPage) {
    switch (previousPage) {
      case '/user-details':
        return userData.userDetailsCompleted;
      case '/medical-screen':
        return userData.medicalScreeningCompleted;
      case '/outcome-measure':
        return userData.outcomeMeasureCompleted;
      case '/pain-region':
        return userData.painRegionsCompleted;
      case '/nerve-symptoms':
        return userData.nerveSymptomsCompleted;
      case '/mobility-test':
        return userData.mobilityTestCompleted;
      case '/endurance-test':
        return userData.enduranceTestCompleted;
      default:
        return false;
    }
  }

  // Helper function to find first incomplete step
  function findFirstIncompleteStep(userData) {
    if (!userData.userDetailsCompleted) return '/user-details';
    if (!userData.medicalScreeningCompleted) return '/medical-screen';
    if (!userData.outcomeMeasureCompleted) return '/outcome-measure';
    if (!userData.painRegionsCompleted) return '/pain-region';
    if (!userData.nerveSymptomsCompleted) return '/nerve-symptoms';
    if (!userData.mobilityTestCompleted) return '/mobility-test';
    if (!userData.enduranceTestCompleted) return '/endurance-test';
    if (!userData.nerveMobilityTestCompleted) return '/nerve-mobility-test';
    return '/dashboard'; // All steps completed
  }

  // Show loading state
  if (loading || checkingAssessment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-t-red-500 border-gray-200 border-solid rounded-full animate-spin"></div>
      </div>
    );
  }

  return <>{children}</>;
}