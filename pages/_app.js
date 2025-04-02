// pages/_app.js
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import '@/styles/globals.css';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { hasCompletedAssessment } from '@/lib/userUtils';

// Public routes that don't need authentication
const publicRoutes = ['/', '/login', '/signup'];

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <AuthWrapper>
        <Component {...pageProps} />
      </AuthWrapper>
    </AuthProvider>
  );
}

function AuthWrapper({ children }) {
  const router = useRouter();
  const { currentUser, loading } = useAuth();
  
  useEffect(() => {
    // Skip during loading
    if (loading) return;

    // Handle public routes
    if (publicRoutes.includes(router.pathname)) {
      // If user is logged in and on the home page, check assessment status
      if (currentUser && router.pathname === '/') {
        const checkAssessment = async () => {
          try {
            const completed = await hasCompletedAssessment(currentUser.uid);
            if (completed) {
              router.push('/dashboard');
            } else {
              router.push('/medical-screen');
            }
          } catch (error) {
            console.error("Failed to check assessment status:", error);
          }
        };
        
        checkAssessment();
      }
      return;
    }
    
    // For protected routes, we rely on the ProtectedRoute component
  }, [currentUser, loading, router, router.pathname]);

  // Apply protection to non-public routes
  if (!publicRoutes.includes(router.pathname)) {
    return <ProtectedRoute>{children}</ProtectedRoute>;
  }
  
  // For public routes, render normally
  return <>{children}</>;
}

export default MyApp;