// components/Signup.js
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  
  const { signup, signInWithGoogle } = useAuth();
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();

    if (password !== passwordConfirm) {
      return setError('Passwords do not match');
    }

    if (!agreeToTerms) {
      return setError('You must agree to the terms and conditions');
    }

    try {
      setError('');
      setLoading(true);
      
      // Create the user in Firebase Auth
      const userCredential = await signup(email, password);
      const user = userCredential.user;
      
      // Store additional user data in Firestore
      await setDoc(doc(db, "users", user.uid), {
        name: name,
        email: email,
        age: parseInt(age),
        sex: sex,
        createdAt: new Date(),
      });
      
      router.push('/medical-screen'); // Redirect to medical screening
    } catch (error) {
      setError('Failed to create an account: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    if (!agreeToTerms) {
      return setError('You must agree to the terms and conditions');
    }

    try {
      setError('');
      setLoading(true);
      const result = await signInWithGoogle();
      
      // Check if this is a new user
      // Note: This method is not foolproof - a better way would be to check if the user exists in your Firestore database
      const isNewUser = result.user.metadata.creationTime === result.user.metadata.lastSignInTime;
      
      if (isNewUser) {
        // For new users, redirect to profile completion
        router.push('/complete-profile');
      } else {
        // For existing users, redirect to dashboard
        router.push('/dashboard');
      }
    } catch (error) {
      setError('Failed to sign in with Google: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="signup-container">
      <h2>Create Account</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Age</label>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Sex</label>
          <select value={sex} onChange={(e) => setSex(e.target.value)} required>
            <option value="">Select</option>
            <option value="M">Male</option>
            <option value="F">Female</option>
            <option value="other">Prefer not to answer</option>
          </select>
        </div>
        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength="6"
          />
        </div>
        <div className="form-group">
          <label>Confirm Password</label>
          <input
            type="password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            required
          />
        </div>
        <div className="form-group checkbox">
          <input
            type="checkbox"
            id="terms"
            checked={agreeToTerms}
            onChange={(e) => setAgreeToTerms(e.target.checked)}
          />
          <label htmlFor="terms">
            I agree to the <a href="/terms">Terms of Use</a>
          </label>
        </div>
        <button disabled={loading} type="submit">
          Sign Up
        </button>
      </form>
      <div className="social-signup">
        <button onClick={handleGoogleSignIn} disabled={loading}>
          Sign up with Google
        </button>
        {/* Discord button would go here */}
      </div>
      <div className="signup-footer">
        Already have an account? <a href="/login">Log In</a>
      </div>
    </div>
  );
}