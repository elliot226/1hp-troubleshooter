// pages/load-tracking.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getDoc, updateDoc, doc, addDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { calculateIrritabilityIndex, getLatestLoadManagement, getLoadManagementHistory, calculateRecommendedActivityTimes } from '@/lib/loadManagementUtils';
import { isProUser } from '@/lib/userUtils';

export default function LoadTracking() {
  const [viewMode, setViewMode] = useState('survey'); // 'survey', 'table', 'tracking'
  const [showSurvey, setShowSurvey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userData, setUserData] = useState(null);
  const [loadData, setLoadData] = useState(null);
  const [message, setMessage] = useState(null);
  const [weekOffset, setWeekOffset] = useState(0);
  
  // Form state
  const [painAtRest, setPainAtRest] = useState(false);
  const [painLevelAtRest, setPainLevelAtRest] = useState(0);
  const [workActivities, setWorkActivities] = useState([{
    name: '',
    normalDuration: 480, // 8 hours in minutes
    timeToAggravation: 60,
    painLevel: 3,
    recoveryTime: 30,
    activityScore: 0
  }]);
  const [hobbyActivities, setHobbyActivities] = useState([{
    name: '',
    normalDuration: 120, // 2 hours in minutes
    timeToAggravation: 30,
    painLevel: 4,
    recoveryTime: 60,
    activityScore: 0
  }]);
  const [morningStiffness, setMorningStiffness] = useState('none');
  const [stiffnessDuration, setStiffnessDuration] = useState('0-30');
  
  // Tracking state for today
  const [trackingDate, setTrackingDate] = useState(new Date());
  const [trackingPainAtRest, setTrackingPainAtRest] = useState(0);
  const [trackingWorkTime, setTrackingWorkTime] = useState({});
  const [trackingHobbyTime, setTrackingHobbyTime] = useState({});
  
  // History state
  const [loadHistory, setLoadHistory] = useState([]);
  const [trackingHistory, setTrackingHistory] = useState([]);
  const [recommendedTimes, setRecommendedTimes] = useState({});
  
  const router = useRouter();
  const { currentUser } = useAuth();

  // Fetch user data and load management history
  useEffect(() => {
    async function fetchData() {
      if (!currentUser) {
        router.push('/login');
        return;
      }
      
      try {
        // Get user data
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
          
          // Check if load management survey has been completed before
          if (userDoc.data().loadManagementSurveyCompleted) {
            setShowSurvey(false);
            setViewMode('table'); // Show table view by default for returning users
          } else {
            setShowSurvey(true);
            setViewMode('survey');
          }
        } else {
          // New user, show survey
          setShowSurvey(true);
          setViewMode('survey');
        }
        
        // Get latest load management data
        const latestData = await getLatestLoadManagement(currentUser.uid);
        if (latestData) {
          setLoadData(latestData);
          
          // Initialize form with latest data if available
          if (latestData.painAtRest !== undefined) setPainAtRest(latestData.painAtRest);
          if (latestData.painLevelAtRest !== undefined) setPainLevelAtRest(latestData.painLevelAtRest);
          if (latestData.workActivities && latestData.workActivities.length > 0) {
            setWorkActivities(latestData.workActivities);
          }
          if (latestData.hobbyActivities && latestData.hobbyActivities.length > 0) {
            setHobbyActivities(latestData.hobbyActivities);
          }
          if (latestData.morningStiffness) setMorningStiffness(latestData.morningStiffness);
          if (latestData.stiffnessDuration) setStiffnessDuration(latestData.stiffnessDuration);
          
          // Calculate recommended times based on irritability
          if (latestData.irritabilityIndex !== undefined) {
            const recommended = calculateRecommendedTimes(
              latestData.irritabilityIndex,
              [...(latestData.workActivities || []), ...(latestData.hobbyActivities || [])]
            );
            setRecommendedTimes(recommended);
          }
        }
        
        // Get load management history
        const history = await getLoadManagementHistory(currentUser.uid, 30); // Get last 30 records
        setLoadHistory(history);
        
        // Get tracking history
        const trackingRef = collection(db, "users", currentUser.uid, "dailyTracking");
        const trackingQuery = query(trackingRef, orderBy("trackingDate", "desc"), limit(60)); // Last 60 days
        const trackingSnapshot = await getDocs(trackingQuery);
        
        const trackingData = [];
        trackingSnapshot.forEach(doc => {
          trackingData.push({
            id: doc.id,
            ...doc.data(),
            trackingDate: doc.data().trackingDate?.toDate() || new Date()
          });
        });
        
        setTrackingHistory(trackingData);
        
        // Initialize today's tracking values
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayTracking = trackingData.find(item => {
          const itemDate = new Date(item.trackingDate);
          itemDate.setHours(0, 0, 0, 0);
          return itemDate.getTime() === today.getTime();
        });
        
        if (todayTracking) {
          setTrackingPainAtRest(todayTracking.painLevelAtRest || 0);
          setTrackingWorkTime(todayTracking.workTime || {});
          setTrackingHobbyTime(todayTracking.hobbyTime || {});
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setMessage({
          type: 'error',
          content: 'Failed to load your data. Please refresh the page or try again later.'
        });
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [currentUser, router]);

  // Calculate activity scores and irritability index whenever form fields change
  useEffect(() => {
    // Only calculate if we're showing the survey
    if (!showSurvey) return;
    
    // Calculate activity scores for work activities
    const updatedWorkActivities = workActivities.map(activity => {
      if (!activity.name || !activity.timeToAggravation || !activity.recoveryTime || !activity.painLevel) {
        return { ...activity, activityScore: 0 };
      }
      
      // ActivityScore = P_aggr × (T_recovery / (T_inc + ε))
      // Using ε = 1 to avoid division by zero
      const activityScore = activity.painLevel * (activity.recoveryTime / (activity.timeToAggravation + 1));
      return { ...activity, activityScore };
    });
    
    // Calculate activity scores for hobby activities
    const updatedHobbyActivities = hobbyActivities.map(activity => {
      if (!activity.name || !activity.timeToAggravation || !activity.recoveryTime || !activity.painLevel) {
        return { ...activity, activityScore: 0 };
      }
      
      // ActivityScore = P_aggr × (T_recovery / (T_inc + ε))
      const activityScore = activity.painLevel * (activity.recoveryTime / (activity.timeToAggravation + 1));
      return { ...activity, activityScore };
    });
    
    setWorkActivities(updatedWorkActivities);
    setHobbyActivities(updatedHobbyActivities);
  }, [
    showSurvey, 
    workActivities.map(a => `${a.name}-${a.timeToAggravation}-${a.recoveryTime}-${a.painLevel}`).join('|'),
    hobbyActivities.map(a => `${a.name}-${a.timeToAggravation}-${a.recoveryTime}-${a.painLevel}`).join('|')
  ]);

  // Handle adding a work activity
  function addWorkActivity() {
    setWorkActivities([
      ...workActivities,
      {
        name: '',
        normalDuration: 480,
        timeToAggravation: 60,
        painLevel: 3,
        recoveryTime: 30,
        activityScore: 0
      }
    ]);
  }

  // Handle removing a work activity
  function removeWorkActivity(index) {
    const newActivities = [...workActivities];
    newActivities.splice(index, 1);
    setWorkActivities(newActivities);
  }

  // Handle adding a hobby activity
  function addHobbyActivity() {
    setHobbyActivities([
      ...hobbyActivities,
      {
        name: '',
        normalDuration: 120,
        timeToAggravation: 30,
        painLevel: 4,
        recoveryTime: 60,
        activityScore: 0
      }
    ]);
  }

  // Handle removing a hobby activity
  function removeHobbyActivity(index) {
    const newActivities = [...hobbyActivities];
    newActivities.splice(index, 1);
    setHobbyActivities(newActivities);
  }

  // Handle work activity change
  function handleWorkActivityChange(index, field, value) {
    const newActivities = [...workActivities];
    
    if (field === 'name') {
      newActivities[index][field] = value;
    } else {
      newActivities[index][field] = Number(value);
    }
    
    setWorkActivities(newActivities);
  }

  // Handle hobby activity change
  function handleHobbyActivityChange(index, field, value) {
    const newActivities = [...hobbyActivities];
    
    if (field === 'name') {
      newActivities[index][field] = value;
    } else {
      newActivities[index][field] = Number(value);
    }
    
    setHobbyActivities(newActivities);
  }

  // Function to calculate the irritability index
  function calculateIrritabilityIndexManually(formData) {
    const { painAtRest, painLevelAtRest, workActivities, hobbyActivities } = formData;
    
    // Calculate individual activity scores
    const allActivities = [...workActivities, ...hobbyActivities];
    
    // Get all activity scores
    const activityScores = allActivities
      .filter(activity => activity.name.trim() !== '')
      .map(activity => {
        // Use existing activity score or recalculate if needed
        if (activity.activityScore !== undefined && activity.activityScore > 0) {
          return activity.activityScore;
        }
        
        // Default to recalculating
        // ActivityScore = P_aggr × (T_recovery / (T_inc + ε))
        // Using ε = 1 to avoid division by zero
        return activity.painLevel * (activity.recoveryTime / (activity.timeToAggravation + 1));
      });
    
    // If no valid activities, score is just the rest pain level
    if (activityScores.length === 0) {
      return painAtRest ? painLevelAtRest : 0;
    }
    
    // Get max activity score
    const maxActivityScore = Math.max(...activityScores);
    
    // Calculate irritability index: IrritabilityIndex = P_rest + max({ActivityScore_i})
    const restPain = painAtRest ? painLevelAtRest : 0;
    const irritabilityIndex = restPain + maxActivityScore;
    
    // Ensure index is within reasonable bounds (0-30)
    return Math.min(Math.max(0, irritabilityIndex), 30);
  }

  // Handle form submission
  async function handleSubmit(e) {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      
      // Filter out empty activities
      const filteredWorkActivities = workActivities.filter(a => a.name.trim() !== '');
      const filteredHobbyActivities = hobbyActivities.filter(a => a.name.trim() !== '');
      
      // Format the data
      const formData = {
        painAtRest,
        painLevelAtRest: painAtRest ? Number(painLevelAtRest) : 0,
        workActivities: filteredWorkActivities,
        hobbyActivities: filteredHobbyActivities,
        morningStiffness,
        stiffnessDuration: morningStiffness !== 'none' ? stiffnessDuration : null
      };
      
      // Calculate irritability index manually
      const irritabilityIndex = calculateIrritabilityIndexManually(formData);
      console.log("Calculated irritability index:", irritabilityIndex);
      
      // Add the calculated irritability index to the data
      const dataWithIndex = {
        ...formData,
        irritabilityIndex,
        date: new Date()
      };
      
      // Store in Firestore
      const docRef = await addDoc(
        collection(db, "users", currentUser.uid, "loadManagement"), 
        dataWithIndex
      );
      
      // Update user document
      await updateDoc(doc(db, "users", currentUser.uid), {
        loadManagementSurveyCompleted: true,
        lastLoadManagementDate: new Date(),
        currentIrritabilityIndex: irritabilityIndex
      });
      
      // Update state
      setLoadData({
        id: docRef.id,
        ...dataWithIndex
      });
      
      // Calculate recommended times
      const allActivities = [...filteredWorkActivities, ...filteredHobbyActivities];
      const recommended = {};
      
      // Map irritability index to load percentages
      let workPercentage = 0.75;
      let hobbyPercentage = 0.75;
      
      if (irritabilityIndex < 5) {
        // Mild
        workPercentage = 0.75;
        hobbyPercentage = 0.75;
      } else if (irritabilityIndex < 10) {
        // Mild/Moderate
        workPercentage = 0.75;
        hobbyPercentage = 0.5;
      } else if (irritabilityIndex < 15) {
        // Moderate
        workPercentage = 0.5;
        hobbyPercentage = 0.5;
      } else if (irritabilityIndex < 20) {
        // Moderate/Severe
        workPercentage = 0.5;
        hobbyPercentage = 0.25;
      } else {
        // Severe
        workPercentage = 0.25;
        hobbyPercentage = 0;
      }
      
      // Calculate recommended times for each activity
      filteredWorkActivities.forEach(activity => {
        recommended[activity.name] = Math.round(activity.normalDuration * workPercentage);
      });
      
      filteredHobbyActivities.forEach(activity => {
        recommended[activity.name] = Math.round(activity.normalDuration * hobbyPercentage);
      });
      
      setRecommendedTimes(recommended);
      
      // Show success message
      setMessage({
        type: 'success',
        content: 'Load management data saved successfully.'
      });
      
      // Get updated load history
      const history = await getLoadManagementHistory(currentUser.uid, 30);
      setLoadHistory(history);
      
      // Reset form for next time
      if (filteredWorkActivities.length === 0) {
        setWorkActivities([{
          name: '',
          normalDuration: 480,
          timeToAggravation: 60,
          painLevel: 3,
          recoveryTime: 30,
          activityScore: 0
        }]);
      }
      
      if (filteredHobbyActivities.length === 0) {
        setHobbyActivities([{
          name: '',
          normalDuration: 120,
          timeToAggravation: 30,
          painLevel: 4,
          recoveryTime: 60,
          activityScore: 0
        }]);
      }
      
      // Switch to table view
      setShowSurvey(false);
      setViewMode('table');
    } catch (error) {
      console.error("Error submitting load management data:", error);
      setMessage({
        type: 'error',
        content: 'There was an error saving your data. Please try again.'
      });
    } finally {
      setSubmitting(false);
    }
  }

  // Handle tracking submission
  async function handleTrackingSubmit(e) {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      
      // Format the data
      const data = {
        trackingDate: trackingDate,
        painAtRest: trackingPainAtRest > 0,
        painLevelAtRest: Number(trackingPainAtRest),
        workTime: trackingWorkTime,
        hobbyTime: trackingHobbyTime
      };
      
      // Store in Firestore
      await addDoc(
        collection(db, "users", currentUser.uid, "dailyTracking"), 
        data
      );
      
      // Show success message
      setMessage({
        type: 'success',
        content: 'Daily tracking data saved successfully.'
      });
      
      // Update tracking history
      const trackingRef = collection(db, "users", currentUser.uid, "dailyTracking");
      const trackingQuery = query(trackingRef, orderBy("trackingDate", "desc"), limit(60));
      const trackingSnapshot = await getDocs(trackingQuery);
      
      const trackingData = [];
      trackingSnapshot.forEach(doc => {
        trackingData.push({
          id: doc.id,
          ...doc.data(),
          trackingDate: doc.data().trackingDate?.toDate() || new Date()
        });
      });
      
      setTrackingHistory(trackingData);
    } catch (error) {
      console.error("Error submitting tracking data:", error);
      setMessage({
        type: 'error',
        content: 'There was an error saving your tracking data. Please try again.'
      });
    } finally {
      setSubmitting(false);
    }
  }

  // Handle starting a new survey (erases previous data)
  function handleStartNewSurvey() {
    if (window.confirm('Are you sure you want to start a new survey? This will reset your current load management settings.')) {
      setPainAtRest(false);
      setPainLevelAtRest(0);
      setWorkActivities([{
        name: '',
        normalDuration: 480,
        timeToAggravation: 60,
        painLevel: 3,
        recoveryTime: 30,
        activityScore: 0
      }]);
      setHobbyActivities([{
        name: '',
        normalDuration: 120,
        timeToAggravation: 30,
        painLevel: 4,
        recoveryTime: 60,
        activityScore: 0
      }]);
      setMorningStiffness('none');
      setStiffnessDuration('0-30');
      setShowSurvey(true);
      setViewMode('survey');
    }
  }

  // Handle adding a new activity to existing data
  function handleAddActivity(type) {
    if (type === 'work') {
      setWorkActivities([
        ...workActivities,
        {
          name: '',
          normalDuration: 480,
          timeToAggravation: 60,
          painLevel: 3,
          recoveryTime: 30,
          activityScore: 0
        }
      ]);
    } else {
      setHobbyActivities([
        ...hobbyActivities,
        {
          name: '',
          normalDuration: 120,
          timeToAggravation: 30,
          painLevel: 4,
          recoveryTime: 60,
          activityScore: 0
        }
      ]);
    }
    setShowSurvey(true);
    setViewMode('survey');
  }

  // Function to update work time today
  function handleWorkTimeChange(activityName, minutes) {
    setTrackingWorkTime(prev => ({
      ...prev,
      [activityName]: parseInt(minutes, 10) || 0
    }));
  }

  // Function to update hobby time today
  function handleHobbyTimeChange(activityName, minutes) {
    setTrackingHobbyTime(prev => ({
      ...prev,
      [activityName]: parseInt(minutes, 10) || 0
    }));
  }

  // Function to navigate between weeks in the table view
  function navigateWeek(direction) {
    setWeekOffset(prev => prev + direction);
  }

  // Get the date range for the current week
  function getCurrentWeekDates() {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + (weekOffset * 7)); // Sunday as start of week
    
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  }

  // Format date as DD/MM
  function formatDate(date) {
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
  }

  // Get tracking data for a specific date
  function getTrackingForDate(date) {
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    return trackingHistory.find(item => {
      const itemDate = new Date(item.trackingDate);
      return itemDate.toISOString().split('T')[0] === dateStr;
    });
  }

  // If loading, show spinner
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Top Header */}
      <header className="bg-white shadow-sm p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
              <span className="text-white font-bold">1HP</span>
            </div>
            <span className="font-bold text-lg">1HP Troubleshooter</span>
          </div>
          <div className="flex space-x-8">
            <Link href="/dashboard" className="text-gray-700 hover:text-red-500">Home</Link>
            <Link href="#" className="text-gray-700 hover:text-red-500">Talk to an Expert</Link>
            <Link href="#" className="text-gray-700 hover:text-red-500">Addons</Link>
            <Link href="/exercise-program" className="text-gray-700 hover:text-red-500">Today's Exercises</Link>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r p-6 hidden md:block">
          <nav className="space-y-4">
            <Link href="/dashboard" className="block text-gray-800 font-medium hover:text-red-500">Home</Link>
            <Link href="/about-plan" className="block text-gray-800 font-medium hover:text-red-500">About Plan</Link>
            <Link href="/exercise-program" className="block text-gray-800 font-medium hover:text-red-500">Exercise Program</Link>
            <Link href="/progress-statistics" className="block text-gray-800 font-medium hover:text-red-500">Progress Statistics</Link>
            <Link href="/load-tracking" className="block text-gray-800 font-medium hover:text-red-500 font-bold text-red-500">Load Tracking</Link>
            <Link href="/switch-plan" className="block text-gray-800 font-medium hover:text-red-500">Switch Plan</Link>
            <Link href="/account" className="block text-gray-800 font-medium hover:text-red-500">Account</Link>
            <Link href="/go-pro" className="block text-gray-800 font-medium hover:text-red-500">Go Pro</Link>
          </nav>
          
          <div className="mt-8 text-sm text-blue-600">
            <Link href="/terms" className="block hover:underline">Terms and Conditions</Link>
            <Link href="/privacy" className="block hover:underline">Privacy Policy</Link>
            <p className="text-gray-500 mt-1">1Healthpoint Inc. 2025</p>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Load Tracking</h1>
            
            {/* View toggle buttons */}
            <div className="flex space-x-4">
              <button
                onClick={() => setViewMode('survey')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  viewMode === 'survey' 
                  ? 'bg-red-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Survey
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  viewMode === 'table' 
                  ? 'bg-red-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Data Table
              </button>
              <button
                onClick={() => setViewMode('tracking')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  viewMode === 'tracking' 
                  ? 'bg-red-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Today's Tracking
              </button>
            </div>
          </div>

          {/* Success/Error Message */}
          {message && (
            <div className={`mb-6 p-4 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {message.content}
            </div>
          )}
          
          {/* Current Irritability Index and Category */}
          {loadData && loadData.irritabilityIndex !== undefined && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center mb-4">
                <h2 className="text-xl font-semibold mb-2 sm:mb-0 sm:mr-4">Current Irritability Index:</h2>
                <div className="flex items-center">
                  <div className={`text-3xl font-bold mr-3 ${
                    loadData.irritabilityIndex < 5 ? 'text-green-600' :
                    loadData.irritabilityIndex < 10 ? 'text-yellow-600' :
                    loadData.irritabilityIndex < 15 ? 'text-orange-600' :
                    loadData.irritabilityIndex < 20 ? 'text-red-600' :
                    'text-red-800'
                  }`}>
                    {loadData.irritabilityIndex.toFixed(1)}
                  </div>
                  <div>
                    {loadData.irritabilityIndex < 5 && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Mild</span>
                    )}
                    {loadData.irritabilityIndex >= 5 && loadData.irritabilityIndex < 10 && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Mild-Moderate</span>
                    )}
                    {loadData.irritabilityIndex >= 10 && loadData.irritabilityIndex < 15 && (
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">Moderate</span>
                    )}
                    {loadData.irritabilityIndex >= 15 && loadData.irritabilityIndex < 20 && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Moderate-Severe</span>
                    )}
                    {loadData.irritabilityIndex >= 20 && (
                      <span className="px-2 py-1 bg-red-600 text-white text-xs rounded-full">Severe</span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Activity Recommendations */}
              <div className="mt-4 p-4 bg-blue-50 rounded-md">
                <h3 className="font-medium text-blue-800 mb-3">Activity Recommendations</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Work Activities</h4>
                    <ul className="space-y-2">
                      {loadData.workActivities && loadData.workActivities.map((activity, index) => (
                        <li key={`work-${index}`} className="flex justify-between">
                          <span>{activity.name}</span>
                          <span className="font-medium">
                            {recommendedTimes[activity.name] 
                              ? formatMinutes(recommendedTimes[activity.name]) 
                              : formatMinutes(activity.normalDuration * 
                                  (loadData.irritabilityIndex < 5 ? 0.75 :
                                   loadData.irritabilityIndex < 10 ? 0.75 :
                                   loadData.irritabilityIndex < 15 ? 0.5 :
                                   loadData.irritabilityIndex < 20 ? 0.5 :
                                   0.25))
                            }
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Hobby Activities</h4>
                    <ul className="space-y-2">
                      {loadData.hobbyActivities && loadData.hobbyActivities.map((activity, index) => (
                        <li key={`hobby-${index}`} className="flex justify-between">
                          <span>{activity.name}</span>
                          <span className="font-medium">
                            {recommendedTimes[activity.name] 
                              ? formatMinutes(recommendedTimes[activity.name]) 
                              : formatMinutes(activity.normalDuration * 
                                  (loadData.irritabilityIndex < 5 ? 0.75 :
                                   loadData.irritabilityIndex < 10 ? 0.5 :
                                   loadData.irritabilityIndex < 15 ? 0.5 :
                                   loadData.irritabilityIndex < 20 ? 0.25 :
                                   0))
                            }
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Load Management Survey */}
          {viewMode === 'survey' && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Load Management Survey</h2>
                {!showSurvey && (
                  <div className="flex space-x-3">
                    <button 
                      onClick={handleStartNewSurvey}
                      className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Start New Survey
                    </button>
                    <button 
                      onClick={() => handleAddActivity('work')}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Add Work Activity
                    </button>
                    <button 
                      onClick={() => handleAddActivity('hobby')}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Add Hobby Activity
                    </button>
                  </div>
                )}
              </div>
              
              {showSurvey ? (
                <form onSubmit={handleSubmit}>
                  {/* Rest Pain */}
                  <div className="mb-6">
                    <h3 className="font-semibold mb-2">Pain/Symptoms at Rest</h3>
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Do you have pain or symptoms at rest?
                      </label>
                      <div className="flex space-x-4">
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="painAtRest"
                            checked={painAtRest === true}
                            onChange={() => setPainAtRest(true)}
                            className="form-radio h-4 w-4 text-red-600"
                          />
                          <span className="ml-2">Yes</span>
                        </label>
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="painAtRest"
                            checked={painAtRest === false}
                            onChange={() => setPainAtRest(false)}
                            className="form-radio h-4 w-4 text-red-600"
                          />
                          <span className="ml-2">No</span>
                        </label>
                      </div>
                    </div>
                    
                    {painAtRest && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          How severe are your symptoms at rest? (0-10)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={painLevelAtRest}
                          onChange={(e) => setPainLevelAtRest(e.target.value)}
                          className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          required
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Work Activities */}
                  <div className="mb-6">
                    <h3 className="font-semibold mb-2">Work Activities</h3>
                    <p className="text-sm text-gray-600 mb-4">List activities at work that aggravate your symptoms.</p>
                    
                    {workActivities.map((activity, index) => (
                      <div key={index} className="mb-6 p-4 bg-gray-50 rounded-md">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">Work Activity {index + 1}</h4>
                          {index > 0 && (
                            <button
                              type="button"
                              onClick={() => removeWorkActivity(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        
                        <div className="mb-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Activity Name
                          </label>
                          <input
                            type="text"
                            value={activity.name}
                            onChange={(e) => handleWorkActivityChange(index, 'name', e.target.value)}
                            className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            placeholder="e.g., Typing, Using mouse"
                            required
                          />
                        </div>
                        
                        <div className="mb-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Normal Duration (minutes)
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={activity.normalDuration}
                            onChange={(e) => handleWorkActivityChange(index, 'normalDuration', e.target.value)}
                            className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            required
                          />
                        </div>
                        
                        <div className="mb-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Time to Aggravation (minutes)
                          </label>
                          <select
                            value={activity.timeToAggravation}
                            onChange={(e) => handleWorkActivityChange(index, 'timeToAggravation', e.target.value)}
                            className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            required
                          >
                            <option value="5">0-10 Minutes</option>
                            <option value="30">10-50 Minutes</option>
                            <option value="120">1-3 Hours</option>
                            <option value="240">3+ Hours</option>
                          </select>
                        </div>
                        
                        <div className="mb-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Pain Level When Aggravated (0-10)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="10"
                            value={activity.painLevel}
                            onChange={(e) => handleWorkActivityChange(index, 'painLevel', e.target.value)}
                            className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Recovery Time (minutes)
                          </label>
                          <select
                            value={activity.recoveryTime}
                            onChange={(e) => handleWorkActivityChange(index, 'recoveryTime', e.target.value)}
                            className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            required
                          >
                            <option value="5">0-10 Minutes</option>
                            <option value="30">10-50 Minutes</option>
                            <option value="120">1-3 Hours</option>
                            <option value="240">3+ Hours</option>
                          </select>
                        </div>
                        
                        {/* Show calculated activity score */}
                        {activity.activityScore > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Activity Irritability Score:</span>
                              <span className="font-medium">{activity.activityScore.toFixed(1)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    <button
                      type="button"
                      onClick={addWorkActivity}
                      className="mt-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Add Another Work Activity
                    </button>
                  </div>
                  
                  {/* Hobby Activities */}
                  <div className="mb-6">
                    <h3 className="font-semibold mb-2">Hobby Activities</h3>
                    <p className="text-sm text-gray-600 mb-4">List hobbies or recreational activities that aggravate your symptoms.</p>
                    
                    {hobbyActivities.map((activity, index) => (
                      <div key={index} className="mb-6 p-4 bg-gray-50 rounded-md">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">Hobby Activity {index + 1}</h4>
                          {index > 0 && (
                            <button
                              type="button"
                              onClick={() => removeHobbyActivity(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        
                        <div className="mb-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Activity Name
                          </label>
                          <input
                            type="text"
                            value={activity.name}
                            onChange={(e) => handleHobbyActivityChange(index, 'name', e.target.value)}
                            className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            placeholder="e.g., Gaming, Playing instrument"
                            required
                          />
                        </div>
                        
                        <div className="mb-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Normal Duration (minutes)
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={activity.normalDuration}
                            onChange={(e) => handleHobbyActivityChange(index, 'normalDuration', e.target.value)}
                            className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            required
                          />
                        </div>
                        
                        <div className="mb-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Time to Aggravation (minutes)
                          </label>
                          <select
                            value={activity.timeToAggravation}
                            onChange={(e) => handleHobbyActivityChange(index, 'timeToAggravation', e.target.value)}
                            className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            required
                          >
                            <option value="5">0-10 Minutes</option>
                            <option value="30">10-50 Minutes</option>
                            <option value="60">1-2 Hours</option>
                            <option value="180">2+ Hours</option>
                          </select>
                        </div>
                        
                        <div className="mb-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Pain Level When Aggravated (0-10)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="10"
                            value={activity.painLevel}
                            onChange={(e) => handleHobbyActivityChange(index, 'painLevel', e.target.value)}
                            className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Recovery Time (minutes)
                          </label>
                          <select
                            value={activity.recoveryTime}
                            onChange={(e) => handleHobbyActivityChange(index, 'recoveryTime', e.target.value)}
                            className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            required
                          >
                            <option value="8">0-15 Minutes</option>
                            <option value="38">15-60 Minutes</option>
                            <option value="90">1-2 Hours</option>
                            <option value="180">2+ Hours</option>
                          </select>
                        </div>
                        
                        {/* Show calculated activity score */}
                        {activity.activityScore > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Activity Irritability Score:</span>
                              <span className="font-medium">{activity.activityScore.toFixed(1)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    <button
                      type="button"
                      onClick={addHobbyActivity}
                      className="mt-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Add Another Hobby Activity
                    </button>
                  </div>
                  
                  {/* Morning Stiffness */}
                  <div className="mb-6">
                    <h3 className="font-semibold mb-2">Morning Stiffness</h3>
                    
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Do you feel stiffness in the mornings?
                      </label>
                      <div className="space-y-2">
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="morningStiffness"
                            value="frequent"
                            checked={morningStiffness === 'frequent'}
                            onChange={() => setMorningStiffness('frequent')}
                            className="form-radio h-4 w-4 text-red-600"
                          />
                          <span className="ml-2">Yes, frequently (more than 3 out of 7 days)</span>
                        </label>
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="morningStiffness"
                            value="occasional"
                            checked={morningStiffness === 'occasional'}
                            onChange={() => setMorningStiffness('occasional')}
                            className="form-radio h-4 w-4 text-red-600"
                          />
                          <span className="ml-2">Yes, occasionally (less than 2 out of 7 days)</span>
                        </label>
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="morningStiffness"
                            value="none"
                            checked={morningStiffness === 'none'}
                            onChange={() => setMorningStiffness('none')}
                            className="form-radio h-4 w-4 text-red-600"
                          />
                          <span className="ml-2">No</span>
                        </label>
                      </div>
                    </div>
                    
                    {morningStiffness !== 'none' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          How long does the stiffness last?
                        </label>
                        <div className="space-y-2">
                          <label className="inline-flex items-center">
                            <input
                              type="radio"
                              name="stiffnessDuration"
                              value="0-30"
                              checked={stiffnessDuration === '0-30'}
                              onChange={() => setStiffnessDuration('0-30')}
                              className="form-radio h-4 w-4 text-red-600"
                            />
                            <span className="ml-2">0-30 minutes</span>
                          </label>
                          <label className="inline-flex items-center">
                            <input
                              type="radio"
                              name="stiffnessDuration"
                              value="30-60"
                              checked={stiffnessDuration === '30-60'}
                              onChange={() => setStiffnessDuration('30-60')}
                              className="form-radio h-4 w-4 text-red-600"
                            />
                            <span className="ml-2">30-60 minutes</span>
                          </label>
                          <label className="inline-flex items-center">
                            <input
                              type="radio"
                              name="stiffnessDuration"
                              value="60-120"
                              checked={stiffnessDuration === '60-120'}
                              onChange={() => setStiffnessDuration('60-120')}
                              className="form-radio h-4 w-4 text-red-600"
                            />
                            <span className="ml-2">1-2 hours</span>
                          </label>
                          <label className="inline-flex items-center">
                            <input
                              type="radio"
                              name="stiffnessDuration"
                              value="120+"
                              checked={stiffnessDuration === '120+'}
                              onChange={() => setStiffnessDuration('120+')}
                              className="form-radio h-4 w-4 text-red-600"
                            />
                            <span className="ml-2">More than 2 hours</span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Calculate estimated irritability index before submission */}
                  <div className="p-4 bg-gray-100 rounded-md mb-6">
                    <h3 className="font-medium mb-2">Estimated Irritability Index</h3>
                    <div className="flex items-center">
                      <div className={`text-xl font-bold mr-2 ${
                        calculateIrritabilityIndexManually({
                          painAtRest,
                          painLevelAtRest: painAtRest ? Number(painLevelAtRest) : 0,
                          workActivities,
                          hobbyActivities
                        }) < 5 ? 'text-green-600' :
                        calculateIrritabilityIndexManually({
                          painAtRest,
                          painLevelAtRest: painAtRest ? Number(painLevelAtRest) : 0,
                          workActivities,
                          hobbyActivities
                        }) < 10 ? 'text-yellow-600' :
                        calculateIrritabilityIndexManually({
                          painAtRest,
                          painLevelAtRest: painAtRest ? Number(painLevelAtRest) : 0,
                          workActivities,
                          hobbyActivities
                        }) < 15 ? 'text-orange-600' :
                        calculateIrritabilityIndexManually({
                          painAtRest,
                          painLevelAtRest: painAtRest ? Number(painLevelAtRest) : 0,
                          workActivities,
                          hobbyActivities
                        }) < 20 ? 'text-red-600' :
                        'text-red-800'
                      }`}>
                        {calculateIrritabilityIndexManually({
                          painAtRest,
                          painLevelAtRest: painAtRest ? Number(painLevelAtRest) : 0,
                          workActivities,
                          hobbyActivities
                        }).toFixed(1)}
                      </div>
                      <div>
                        {calculateIrritabilityIndexManually({
                          painAtRest,
                          painLevelAtRest: painAtRest ? Number(painLevelAtRest) : 0,
                          workActivities,
                          hobbyActivities
                        }) < 5 && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Mild</span>
                        )}
                        {calculateIrritabilityIndexManually({
                          painAtRest,
                          painLevelAtRest: painAtRest ? Number(painLevelAtRest) : 0,
                          workActivities,
                          hobbyActivities
                        }) >= 5 && calculateIrritabilityIndexManually({
                          painAtRest,
                          painLevelAtRest: painAtRest ? Number(painLevelAtRest) : 0,
                          workActivities,
                          hobbyActivities
                        }) < 10 && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Mild-Moderate</span>
                        )}
                        {calculateIrritabilityIndexManually({
                          painAtRest,
                          painLevelAtRest: painAtRest ? Number(painLevelAtRest) : 0,
                          workActivities,
                          hobbyActivities
                        }) >= 10 && calculateIrritabilityIndexManually({
                          painAtRest,
                          painLevelAtRest: painAtRest ? Number(painLevelAtRest) : 0,
                          workActivities,
                          hobbyActivities
                        }) < 15 && (
                          <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">Moderate</span>
                        )}
                        {calculateIrritabilityIndexManually({
                          painAtRest,
                          painLevelAtRest: painAtRest ? Number(painLevelAtRest) : 0,
                          workActivities,
                          hobbyActivities
                        }) >= 15 && calculateIrritabilityIndexManually({
                          painAtRest,
                          painLevelAtRest: painAtRest ? Number(painLevelAtRest) : 0,
                          workActivities,
                          hobbyActivities
                        }) < 20 && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Moderate-Severe</span>
                        )}
                        {calculateIrritabilityIndexManually({
                          painAtRest,
                          painLevelAtRest: painAtRest ? Number(painLevelAtRest) : 0,
                          workActivities,
                          hobbyActivities
                        }) >= 20 && (
                          <span className="px-2 py-1 bg-red-600 text-white text-xs rounded-full">Severe</span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      This is calculated based on your pain at rest and activity scores.
                    </p>
                  </div>
                  
                  {/* Submit Button */}
                  <div className="mt-8">
                    <button
                      type="submit"
                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      disabled={submitting}
                    >
                      {submitting ? 'Saving...' : 'Save Load Management Data'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-600 mb-4">
                    Click one of the buttons above to start a new survey or add additional activities.
                  </p>
                </div>
              )}
            </div>
          )}
          
          {/* Data Table View */}
          {viewMode === 'table' && loadData && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6 overflow-x-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Weekly Data Table</h2>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => navigateWeek(-1)}
                    className="p-1 rounded hover:bg-gray-100"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button 
                    onClick={() => navigateWeek(1)}
                    className="p-1 rounded hover:bg-gray-100"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                        Activity
                      </th>
                      {getCurrentWeekDates().map((date, i) => (
                        <th 
                          key={i} 
                          className={`px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r ${
                            date.toDateString() === new Date().toDateString() ? 'bg-blue-50' : ''
                          }`}
                        >
                          {formatDate(date)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {/* Rest Pain */}
                    <tr className="bg-gray-50">
                      <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900 border-r">
                        Rest Pain
                      </td>
                      {getCurrentWeekDates().map((date, i) => {
                        const trackingData = getTrackingForDate(date);
                        return (
                          <td 
                            key={i} 
                            className={`px-3 py-3 whitespace-nowrap text-sm text-center border-r ${
                              date.toDateString() === new Date().toDateString() ? 'bg-blue-50' : ''
                            }`}
                          >
                            {trackingData ? trackingData.painLevelAtRest : '-'}
                          </td>
                        );
                      })}
                    </tr>
                    
                    {/* Work Activities */}
                    {loadData.workActivities && loadData.workActivities.map((activity, index) => (
                      <tr key={`work-${index}`}>
                        <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900 border-r">
                          {activity.name}
                        </td>
                        {getCurrentWeekDates().map((date, i) => {
                          const trackingData = getTrackingForDate(date);
                          return (
                            <td 
                              key={i} 
                              className={`px-3 py-3 text-sm text-center border-r ${
                                date.toDateString() === new Date().toDateString() ? 'bg-blue-50' : ''
                              }`}
                            >
                              {trackingData && trackingData.workTime && trackingData.workTime[activity.name] 
                                ? trackingData.workTime[activity.name] 
                                : '-'}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    
                    {/* Hobby Activities */}
                    {loadData.hobbyActivities && loadData.hobbyActivities.map((activity, index) => (
                      <tr key={`hobby-${index}`}>
                        <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900 border-r">
                          {activity.name}
                        </td>
                        {getCurrentWeekDates().map((date, i) => {
                          const trackingData = getTrackingForDate(date);
                          return (
                            <td 
                              key={i} 
                              className={`px-3 py-3 text-sm text-center border-r ${
                                date.toDateString() === new Date().toDateString() ? 'bg-blue-50' : ''
                              }`}
                            >
                              {trackingData && trackingData.hobbyTime && trackingData.hobbyTime[activity.name] 
                                ? trackingData.hobbyTime[activity.name] 
                                : '-'}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4 text-sm text-gray-500">
                This table shows your daily activity tracking data. Values are in minutes unless specified otherwise.
              </div>
            </div>
          )}
          
          {/* Today's Tracking View */}
          {viewMode === 'tracking' && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Today's Activity Tracking</h2>
              
              <form onSubmit={handleTrackingSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pain Level at Rest Today (0-10)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={trackingPainAtRest}
                    onChange={(e) => setTrackingPainAtRest(e.target.value)}
                    className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
                
                {/* Work Activities Tracking */}
                {loadData && loadData.workActivities && loadData.workActivities.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-3">Work Activities</h3>
                    <div className="space-y-4">
                      {loadData.workActivities.map((activity, index) => (
                        <div key={`work-track-${index}`} className="grid grid-cols-2 gap-4 items-center">
                          <div className="text-sm font-medium">
                            {activity.name}
                            <div className="text-xs text-gray-500">
                              Recommended: {
                                recommendedTimes[activity.name] 
                                  ? formatMinutes(recommendedTimes[activity.name]) 
                                  : 'N/A'
                              }
                            </div>
                          </div>
                          <div>
                            <input
                              type="number"
                              min="0"
                              placeholder="Minutes"
                              value={trackingWorkTime[activity.name] || ''}
                              onChange={(e) => handleWorkTimeChange(activity.name, e.target.value)}
                              className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Hobby Activities Tracking */}
                {loadData && loadData.hobbyActivities && loadData.hobbyActivities.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-3">Hobby Activities</h3>
                    <div className="space-y-4">
                      {loadData.hobbyActivities.map((activity, index) => (
                        <div key={`hobby-track-${index}`} className="grid grid-cols-2 gap-4 items-center">
                          <div className="text-sm font-medium">
                            {activity.name}
                            <div className="text-xs text-gray-500">
                              Recommended: {
                                recommendedTimes[activity.name] 
                                  ? formatMinutes(recommendedTimes[activity.name]) 
                                  : 'N/A'
                              }
                            </div>
                          </div>
                          <div>
                            <input
                              type="number"
                              min="0"
                              placeholder="Minutes"
                              value={trackingHobbyTime[activity.name] || ''}
                              onChange={(e) => handleHobbyTimeChange(activity.name, e.target.value)}
                              className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : 'Save Today\'s Tracking'}
                </button>
              </form>
              
              {/* Pro Upgrade Banner */}
              {!isProUser(userData) && (
                <div className="mt-8 bg-gradient-to-r from-red-500 to-red-600 rounded-lg shadow-lg p-6 text-white">
                  <h3 className="text-xl font-bold mb-2">Upgrade to Pro for Advanced Tracking</h3>
                  <p className="mb-4">Get detailed analytics, custom activity recommendations, and progress tracking with the Pro plan.</p>
                  <Link href="/go-pro" className="inline-block bg-white text-red-600 px-6 py-2 rounded-md font-medium hover:bg-gray-100">
                    Upgrade Now
                  </Link>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// Utility function to format minutes as hours and minutes
function formatMinutes(minutes) {
  if (!minutes) return '0 min';
  
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }
  
  return `${hours} hr ${remainingMinutes} min`;
}

// Utility function to calculate recommended times based on irritability
function calculateRecommendedTimes(irritabilityIndex, activities) {
  const recommended = {};
  
  // Map irritability index to load percentages
  let workPercentage = 0.75;
  let hobbyPercentage = 0.75;
  
  if (irritabilityIndex < 5) {
    // Mild
    workPercentage = 0.75;
    hobbyPercentage = 0.75;
  } else if (irritabilityIndex < 10) {
    // Mild/Moderate
    workPercentage = 0.75;
    hobbyPercentage = 0.5;
  } else if (irritabilityIndex < 15) {
    // Moderate
    workPercentage = 0.5;
    hobbyPercentage = 0.5;
  } else if (irritabilityIndex < 20) {
    // Moderate/Severe
    workPercentage = 0.5;
    hobbyPercentage = 0.25;
  } else {
    // Severe
    workPercentage = 0.25;
    hobbyPercentage = 0;
  }
  
  // Calculate recommended times for each activity
  activities.forEach(activity => {
    if (activity.name) {
      if (activity.type === 'work') {
        recommended[activity.name] = Math.round(activity.normalDuration * workPercentage);
      } else {
        recommended[activity.name] = Math.round(activity.normalDuration * hobbyPercentage);
      }
    }
  });
  
  return recommended;
}