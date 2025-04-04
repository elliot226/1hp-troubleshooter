// pages/progress-statistics.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  IrritabilityMeter, 
  FunctionalAssessmentChart, 
  ActivityTimeChart, 
  IrritabilityIndexChart 
} from '@/components/ProgressVisualization';
import ProtectedPage from '@/components/layouts/ProtectedPage';
import ExerciseCalendar from '@/components/ExerciseCalendar';

export default function ProgressStatistics() {
  const [loading, setLoading] = useState(true);
  const [exercisePrescriptions, setExercisePrescriptions] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [exerciseHistory, setExerciseHistory] = useState([]);
  const [quickDashScores, setQuickDashScores] = useState([]);
  const [userData, setUserData] = useState(null);
  const [irritabilityHistory, setIrritabilityHistory] = useState([]);
  const [activityData, setActivityData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const router = useRouter();
  const { currentUser } = useAuth();

  // Fetch data on mount
  useEffect(() => {
    if (!currentUser) {
      router.push('/login');
      return;
    }
    
    async function fetchData() {
      try {
        // Get user data
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
        
        // Fetch exercise prescriptions
        const prescriptionsRef = collection(db, "users", currentUser.uid, "exercisePrescriptions");
        const prescriptionsSnapshot = await getDocs(prescriptionsRef);
        
        const prescriptions = [];
        prescriptionsSnapshot.forEach(doc => {
          prescriptions.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        setExercisePrescriptions(prescriptions);
        
        // Set first exercise as selected if available
        if (prescriptions.length > 0) {
          setSelectedExercise(prescriptions[0]);
        }
        
        // Fetch QuickDASH scores
        const quickDashRef = collection(db, "users", currentUser.uid, "outcomeMeasures");
        const quickDashQuery = query(quickDashRef, orderBy("date", "asc"));
        const quickDashSnapshot = await getDocs(quickDashQuery);
        
        const scores = [];
        quickDashSnapshot.forEach(doc => {
          scores.push({
            id: doc.id,
            ...doc.data(),
            date: doc.data().date.toDate().toLocaleDateString()
          });
        });
        
        setQuickDashScores(scores);
        
        // Fetch Irritability Index history
        const loadManagementRef = collection(db, "users", currentUser.uid, "loadManagement");
        const loadManagementQuery = query(loadManagementRef, orderBy("date", "asc"));
        const loadManagementSnapshot = await getDocs(loadManagementQuery);
        
        const irritabilityData = [];
        loadManagementSnapshot.forEach(doc => {
          if (doc.data().irritabilityIndex !== undefined) {
            irritabilityData.push({
              id: doc.id,
              irritabilityIndex: doc.data().irritabilityIndex,
              date: doc.data().date.toDate().toLocaleDateString()
            });
          }
        });
        
        setIrritabilityHistory(irritabilityData);
        
        // Fetch activity tracking data
        const trackingRef = collection(db, "users", currentUser.uid, "dailyTracking");
        const trackingQuery = query(trackingRef, orderBy("date", "asc"));
        const trackingSnapshot = await getDocs(trackingQuery);
        
        const trackingData = [];
        trackingSnapshot.forEach(doc => {
          const data = doc.data();
          trackingData.push({
            id: doc.id,
            date: data.date.toDate().toLocaleDateString(),
            workTime: data.workTime || 0,
            hobbyTime: data.hobbyTime || 0,
            totalTime: (data.workTime || 0) + (data.hobbyTime || 0),
            activities: [
              { name: 'Work', duration: data.workTime || 0 },
              { name: 'Hobby', duration: data.hobbyTime || 0 }
            ],
            activityNames: ['Work', 'Hobby']
          });
        });
        
        setActivityData(trackingData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [currentUser, router]);

  // Fetch exercise history when selected exercise changes
  useEffect(() => {
    if (!selectedExercise) return;
    
    async function fetchExerciseHistory() {
      try {
        // Get tracking instances from the exercise prescription
        const instances = selectedExercise.trackingInstances || [];
        
        // Format the data
        const formattedInstances = instances.map(instance => ({
          ...instance,
          dateFormatted: new Date(instance.date).toLocaleDateString()
        })).sort((a, b) => new Date(b.date) - new Date(a.date));
        
        setExerciseHistory(formattedInstances);
      } catch (error) {
        console.error("Error fetching exercise history:", error);
      }
    }
    
    fetchExerciseHistory();
  }, [selectedExercise]);

  // Handle exercise selection change
  function handleExerciseChange(e) {
    const exerciseId = e.target.value;
    const selected = exercisePrescriptions.find(ex => ex.id === exerciseId);
    setSelectedExercise(selected);
  }

  // Date selection from calendar
  const handleDateSelect = (date) => {
    setSelectedDate(date);
    // Could add functionality to filter exercise history based on selected date
  };

  // Get irritability class based on index value
  function getIrritabilityClass(index) {
    if (index < 5) return 'text-green-600';
    if (index < 10) return 'text-yellow-600';
    if (index < 15) return 'text-orange-600';
    if (index < 20) return 'text-red-600';
    return 'text-red-800 font-bold';
  }
  
  // Format scaling event name for display
  function formatScalingEvent(event) {
    if (!event) return '';
    
    // Replace underscores with spaces and capitalize first letter of each word
    return event
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  // Loading state
  if (loading) {
    return (
      <ProtectedPage>
        <div className="flex items-center justify-center h-full">
          <div className="text-xl">Loading your progress data...</div>
        </div>
      </ProtectedPage>
    );
  }

  return (
    <ProtectedPage>
      <h1 className="text-2xl font-bold mb-6">Progress Statistics</h1>
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* QuickDASH Score */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium mb-2">Latest QuickDASH Score</h2>
          <div className="flex items-baseline">
            <span className="text-3xl font-bold">
              {quickDashScores.length > 0 
                ? `${quickDashScores[quickDashScores.length - 1].score}%` 
                : 'N/A'}
            </span>
            {quickDashScores.length > 1 && (
              <span className={`ml-2 text-sm ${
                quickDashScores[quickDashScores.length - 1].score < quickDashScores[quickDashScores.length - 2].score
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}>
                {quickDashScores[quickDashScores.length - 1].score < quickDashScores[quickDashScores.length - 2].score
                  ? '↓'
                  : '↑'}
                {Math.abs(quickDashScores[quickDashScores.length - 1].score - quickDashScores[quickDashScores.length - 2].score).toFixed(1)}%
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {quickDashScores.length > 0 
              ? `Last assessed: ${quickDashScores[quickDashScores.length - 1].date}` 
              : 'Not yet assessed'}
          </p>
        </div>
        
        {/* Irritability Index - UPDATED with visual meter */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium mb-2">Current Irritability Index</h2>
          <div className="flex items-baseline">
            <span className={`text-3xl font-bold ${
              irritabilityHistory.length > 0 
                ? getIrritabilityClass(irritabilityHistory[irritabilityHistory.length - 1].irritabilityIndex)
                : ''
            }`}>
              {irritabilityHistory.length > 0 
                ? irritabilityHistory[irritabilityHistory.length - 1].irritabilityIndex 
                : 'N/A'}
            </span>
            {irritabilityHistory.length > 1 && (
              <span className={`ml-2 text-sm ${
                irritabilityHistory[irritabilityHistory.length - 1].irritabilityIndex < irritabilityHistory[irritabilityHistory.length - 2].irritabilityIndex
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}>
                {irritabilityHistory[irritabilityHistory.length - 1].irritabilityIndex < irritabilityHistory[irritabilityHistory.length - 2].irritabilityIndex
                  ? '↓'
                  : '↑'}
                {Math.abs(irritabilityHistory[irritabilityHistory.length - 1].irritabilityIndex - irritabilityHistory[irritabilityHistory.length - 2].irritabilityIndex)}
              </span>
            )}
          </div>
          
          {/* Added severity label and visual meter */}
          {irritabilityHistory.length > 0 && (
            <IrritabilityMeter value={irritabilityHistory[irritabilityHistory.length - 1].irritabilityIndex} />
          )}
          
          <p className="text-sm text-gray-600 mt-1">
            {irritabilityHistory.length > 0 
              ? `Last assessed: ${irritabilityHistory[irritabilityHistory.length - 1].date}` 
              : 'Not yet assessed'}
          </p>
        </div>
        
        {/* Completion Rate */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium mb-2">Exercise Completion Rate</h2>
          <div className="text-3xl font-bold">
            {exercisePrescriptions.length > 0 
              ? `${calculateCompletionRate(exercisePrescriptions)}%`
              : 'N/A'}
          </div>
          <p className="text-sm text-gray-600 mt-1">Last 7 days</p>
        </div>
      </div>
      
      {/* Exercise History Section (renamed from Exercise Progression) */}
      <div className="bg-white rounded-lg shadow-md mb-8">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Exercise History</h2>
        </div>
        
        <div className="p-6">
          {/* Calendar component for exercise completion */}
          <ExerciseCalendar onSelectDate={handleDateSelect} />
          
          {exercisePrescriptions.length > 0 ? (
            <>
              <div className="mb-6">
                <label htmlFor="exercise-select" className="block text-sm font-medium text-gray-700 mb-2">
                  Select Exercise
                </label>
                <select
                  id="exercise-select"
                  value={selectedExercise?.id || ''}
                  onChange={handleExerciseChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                >
                  {exercisePrescriptions.map(ex => (
                    <option key={ex.id} value={ex.id}>
                      {ex.id}
                    </option>
                  ))}
                </select>
              </div>
              
              {selectedExercise && (
                <div className="space-y-6">
                  {/* Current Prescription Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h3 className="text-sm font-medium text-gray-700 mb-1">Current Weight</h3>
                      <p className="text-2xl font-bold">{selectedExercise.currentWeight || 0} lbs</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h3 className="text-sm font-medium text-gray-700 mb-1">Target Reps</h3>
                      <p className="text-2xl font-bold">{selectedExercise.targetRepMin || 0}-{selectedExercise.targetRepMax || 0}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h3 className="text-sm font-medium text-gray-700 mb-1">Initial Weight</h3>
                      <p className="text-2xl font-bold">{selectedExercise.initialWeight || 0} lbs</p>
                      {selectedExercise.initialWeight && selectedExercise.currentWeight && (
                        <p className="text-sm text-gray-600">
                          {calculatePercentChange(selectedExercise.initialWeight, selectedExercise.currentWeight)}% change
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Scaling History */}
                  {selectedExercise.scalingHistory && selectedExercise.scalingHistory.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium mb-3">Progression History</h3>
                      <div className="bg-white border rounded-md overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight (lbs)</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rep Range</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {selectedExercise.scalingHistory.map((event, index) => (
                              <tr key={index} className={index === selectedExercise.scalingHistory.length - 1 ? 'bg-blue-50' : ''}>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                  {event.date}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                  {formatScalingEvent(event.event)}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                  {event.weight}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                  {event.repRangeMin}-{event.repRangeMax}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  
                  {/* Exercise Performance */}
                  {exerciseHistory.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium mb-3">Exercise Tracking History</h3>
                      <div className="bg-white border rounded-md overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reps</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pain (0-10)</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight (lbs)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {exerciseHistory.map((history, index) => (
                              <tr key={index}>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                  {history.dateFormatted}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                  {history.timeOfDay}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                  {history.repsPerformed || '-'}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                  {history.painLevel !== undefined ? history.painLevel : '-'}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                  {history.weight}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500">No exercise prescriptions found.</p>
              <p className="text-sm text-gray-400 mt-1">Complete the assessment flow to generate exercise prescriptions.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* NEW Interactive Chart Sections */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Progress Visualization</h2>
        
        {/* QuickDASH Chart */}
        {quickDashScores.length > 0 ? (
          <FunctionalAssessmentChart quickDashScores={quickDashScores} />
        ) : (
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <p className="text-gray-500">No QuickDASH data available yet.</p>
            <p className="text-sm text-gray-400">Complete assessments to see your progress over time.</p>
          </div>
        )}
        
        {/* Activity Time Chart */}
        {activityData.length > 0 ? (
          <ActivityTimeChart activityData={activityData} />
        ) : (
          <div className="bg-white p-6 rounded-lg shadow text-center mt-8">
            <p className="text-gray-500">No activity tracking data available yet.</p>
            <p className="text-sm text-gray-400">Track your daily activities to see your usage patterns.</p>
          </div>
        )}
        
        {/* Irritability Index Chart */}
        {irritabilityHistory.length > 0 ? (
          <IrritabilityIndexChart irritabilityHistory={irritabilityHistory} />
        ) : (
          <div className="bg-white p-6 rounded-lg shadow text-center mt-8">
            <p className="text-gray-500">No irritability data available yet.</p>
            <p className="text-sm text-gray-400">Complete load management assessments to track your irritability index.</p>
          </div>
        )}
      </div>
      
      {/* QuickDASH History */}
      <div className="bg-white rounded-lg shadow-md mb-8">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Functional Assessment History</h2>
        </div>
        
        <div className="p-6">
          {quickDashScores.length > 0 ? (
            <div className="bg-white border rounded-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">QuickDASH Score</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work Module</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hobby Module</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {quickDashScores.map((score, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {score.date}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {score.score !== undefined ? `${score.score}%` : '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {score.workScore !== undefined ? `${score.workScore}%` : '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {score.hobbyScore !== undefined ? `${score.hobbyScore}%` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500">No QuickDASH assessments found.</p>
              <p className="text-sm text-gray-400 mt-1">Complete the outcome measure assessment to track your functional progress.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Irritability Index History */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Irritability Index History</h2>
        </div>
        
        <div className="p-6">
          {irritabilityHistory.length > 0 ? (
            <div className="bg-white border rounded-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Irritability Index</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {irritabilityHistory.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {item.date}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        <span className={getIrritabilityClass(item.irritabilityIndex)}>
                          {item.irritabilityIndex}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {item.irritabilityIndex < 5 && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Low</span>
                        )}
                        {item.irritabilityIndex >= 5 && item.irritabilityIndex < 10 && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Mild-Moderate</span>
                        )}
                        {item.irritabilityIndex >= 10 && item.irritabilityIndex < 15 && (
                          <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">Moderate</span>
                        )}
                        {item.irritabilityIndex >= 15 && item.irritabilityIndex < 20 && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Moderate-Severe</span>
                        )}
                        {item.irritabilityIndex >= 20 && (
                          <span className="px-2 py-1 bg-red-600 text-white text-xs rounded-full">Severe</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500">No irritability data found.</p>
              <p className="text-sm text-gray-400 mt-1">Complete the load management assessment to track your irritability index.</p>
            </div>
          )}
        </div>
      </div>
    </ProtectedPage>
  );
}

// Utility function to calculate completion rate
function calculateCompletionRate(exercisePrescriptions) {
  if (!exercisePrescriptions || exercisePrescriptions.length === 0) return 0;
  
  let totalInstances = 0;
  let completedInstances = 0;
  
  // Get date 7 days ago
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);
  
  // Count tracking instances in the last 7 days
  exercisePrescriptions.forEach(prescription => {
    const instances = prescription.trackingInstances || [];
    
    instances.forEach(instance => {
      const instanceDate = new Date(instance.date);
      
      if (instanceDate >= sevenDaysAgo) {
        totalInstances++;
        
        if (instance.completed) {
          completedInstances++;
        }
      }
    });
  });
  
  if (totalInstances === 0) return 0;
  
  return Math.round((completedInstances / totalInstances) * 100);
}

// Utility function to calculate percent change
function calculatePercentChange(initial, current) {
  if (!initial || !current) return 0;
  
  const change = ((current - initial) / initial) * 100;
  return change.toFixed(1);
}