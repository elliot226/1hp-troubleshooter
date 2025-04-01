// contexts/AuthContext.js
import { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  GoogleAuthProvider, 
  signInWithPopup,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Set persistence to LOCAL - this makes auth state persist
  useEffect(() => {
    setPersistence(auth, browserLocalPersistence);
  }, []);

  // Login function
  async function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function signup(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  function logout() {
    return signOut(auth);
  }

  function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    login,
    signup,
    logout,
    signInWithGoogle,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}