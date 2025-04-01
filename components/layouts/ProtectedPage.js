// components/layouts/ProtectedPage.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from './MainLayout';
import { hasCompletedAssessment } from '@/lib/userUtils';

export default function ProtectedPage({ children, requireAssessment = true }) {
  const { currentUser, loading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [assessmentComplete, setAssessmentComplete] = useState(false);

  useEffect(() => {
    async function checkAuthAndAssessment() {
      // Wait for auth to initialize
      if (loading) return;

      // Redirect to login if not logged in
      if (!currentUser) {
        router.push('/login');
        return;
      }

      // If the page requires a completed assessment, check if it's done
      if (requireAssessment) {
        try {
          const isComplete = await hasCompletedAssessment(currentUser.uid);
          setAssessmentComplete(isComplete);
          
          if (!isComplete) {
            // Redirect to the assessment flow
            router.push('/medical-screen');
            return;
          }
        } catch (error) {
          console.error("Error checking assessment status:", error);
        }
      }

      setIsLoading(false);
    }

    checkAuthAndAssessment();
  }, [currentUser, loading, router, requireAssessment]);

  // Show loading state
  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-4">
          <div className="w-16 h-16 border-4 border-t-red-500 border-gray-200 border-solid rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  // If the auth check fails, don't render anything
  // (the useEffect will redirect to login)
  if (!currentUser) {
    return null;
  }

  // If assessment is required but not complete, don't render
  // (the useEffect will redirect to assessment)
  if (requireAssessment && !assessmentComplete) {
    return null;
  }

  // If all checks pass, render the page with the main layout
  return <MainLayout>{children}</MainLayout>;
}