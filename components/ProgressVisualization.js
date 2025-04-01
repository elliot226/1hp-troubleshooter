// components/ProgressVisualization.js
import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

// Irritability Meter Component
export const IrritabilityMeter = ({ value }) => {
  // Define thresholds and labels
  const getIrritabilityInfo = (index) => {
    if (index < 5) return { label: 'Low', color: '#10B981', textColor: '#064E3B' };
    if (index < 10) return { label: 'Mild-Moderate', color: '#FBBF24', textColor: '#92400E' };
    if (index < 15) return { label: 'Moderate', color: '#F97316', textColor: '#9A3412' };
    if (index < 20) return { label: 'Moderate-Severe', color: '#EF4444', textColor: '#7F1D1D' };
    return { label: 'Severe', color: '#B91C1C', textColor: '#FFFFFF' };
  };

  const info = getIrritabilityInfo(value);
  const percentage = Math.min((value / 20) * 100, 100); // Cap at 100%

  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs mb-1">
        <span>Low</span>
        <span>Moderate</span>
        <span>Severe</span>
      </div>
      <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full" 
          style={{ 
            width: `${percentage}%`, 
            backgroundColor: info.color,
            transition: 'width 0.5s ease-in-out' 
          }}
        ></div>
      </div>
      <div className="mt-1 text-sm font-medium" style={{ color: info.textColor }}>
        {info.label}
      </div>
    </div>
  );
};

// Function to format dates consistently for charts
const formatChartDate = (dateString) => {
  try {
    // Handle both Date objects and strings
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch (e) {
    return dateString; // Fallback to the original string if parsing fails
  }
};

// Functional Assessment Chart
export const FunctionalAssessmentChart = ({ quickDashScores }) => {
  const [showTotal, setShowTotal] = useState(true);
  const [showWork, setShowWork] = useState(true);
  const [showHobby, setShowHobby] = useState(true);

  // Format data for the chart
  const chartData = quickDashScores.map(score => ({
    date: formatChartDate(score.date),
    'QuickDASH': score.score || 0,
    'Work Module': score.workScore || 0,
    'Hobby Module': score.hobbyScore || 0
  }));

  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-2 mb-4">
        <button 
          onClick={() => setShowTotal(!showTotal)}
          className={`px-3 py-1 rounded-full text-sm ${showTotal ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          Total Score
        </button>
        <button 
          onClick={() => setShowWork(!showWork)}
          className={`px-3 py-1 rounded-full text-sm ${showWork ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          Work Module
        </button>
        <button 
          onClick={() => setShowHobby(!showHobby)}
          className={`px-3 py-1 rounded-full text-sm ${showHobby ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          Hobby Module
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">QuickDASH Score Trends</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              {showTotal && <Line type="monotone" dataKey="QuickDASH" stroke="#3B82F6" strokeWidth={2} activeDot={{ r: 8 }} />}
              {showWork && <Line type="monotone" dataKey="Work Module" stroke="#10B981" strokeWidth={2} />}
              {showHobby && <Line type="monotone" dataKey="Hobby Module" stroke="#8B5CF6" strokeWidth={2} />}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// Activity Time Chart
export const ActivityTimeChart = ({ activityData = [] }) => {
  const [showTotal, setShowTotal] = useState(true);
  const [selectedActivities, setSelectedActivities] = useState({});
  
  // Initialize selected activities
  useEffect(() => {
    if (activityData.length > 0) {
      const initialSelected = {};
      activityData.forEach(item => {
        if (item.activityNames) {
          item.activityNames.forEach(name => {
            initialSelected[name] = true; // Default all to true
          });
        }
      });
      setSelectedActivities(initialSelected);
    }
  }, [activityData]);

  // Toggle an activity selection
  const toggleActivity = (activityName) => {
    setSelectedActivities(prev => ({
      ...prev,
      [activityName]: !prev[activityName]
    }));
  };

  // Format data for the chart
  const chartData = activityData.map(item => {
    const dataPoint = {
      date: formatChartDate(item.date),
      Total: item.totalTime || 0
    };
    
    if (item.activities) {
      item.activities.forEach(activity => {
        dataPoint[activity.name] = activity.duration || 0;
      });
    }
    
    return dataPoint;
  });

  // Get list of activity names for the legend
  const activityNames = [];
  activityData.forEach(item => {
    if (item.activities) {
      item.activities.forEach(activity => {
        if (!activityNames.includes(activity.name)) {
          activityNames.push(activity.name);
        }
      });
    }
  });

  // Color map for activities
  const colorMap = {
    'Total': '#3B82F6',
    'Work': '#10B981',
    'Hobby': '#8B5CF6'
  };

  // Assign colors to activities
  const getActivityColor = (name, index) => {
    if (colorMap[name]) return colorMap[name];
    
    // Generate colors for other activities
    const baseColors = ['#F59E0B', '#EC4899', '#06B6D4', '#F97316', '#4F46E5'];
    return baseColors[index % baseColors.length];
  };

  return (
    <div className="mt-8">
      <div className="flex flex-wrap gap-2 mb-4">
        <button 
          onClick={() => setShowTotal(!showTotal)}
          className={`px-3 py-1 rounded-full text-sm ${showTotal ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          Total Activity
        </button>
        
        {activityNames.map((name, index) => (
          <button 
            key={name}
            onClick={() => toggleActivity(name)}
            className={`px-3 py-1 rounded-full text-sm ${
              selectedActivities[name] ? 'text-white' : 'bg-gray-200 text-gray-700'
            }`}
            style={{ 
              backgroundColor: selectedActivities[name] ? getActivityColor(name, index) : undefined
            }}
          >
            {name}
          </button>
        ))}
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">Activity Time Trends (Minutes)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              {showTotal && <Bar dataKey="Total" fill="#3B82F6" />}
              {activityNames.map((name, index) => (
                selectedActivities[name] && 
                <Bar 
                  key={name} 
                  dataKey={name} 
                  fill={getActivityColor(name, index)} 
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// Irritability Index Chart
export const IrritabilityIndexChart = ({ irritabilityHistory }) => {
  // Format data for the chart
  const chartData = irritabilityHistory.map(item => ({
    date: formatChartDate(item.date),
    'Irritability Index': item.irritabilityIndex || 0
  }));

  // Get background color based on irritability value
  const getBackgroundColor = (value) => {
    if (value < 5) return '#DCFCE7'; // green-100
    if (value < 10) return '#FEF3C7'; // yellow-100
    if (value < 15) return '#FFEDD5'; // orange-100
    if (value < 20) return '#FEE2E2'; // red-100
    return '#FEE2E2'; // red-100
  };

  return (
    <div className="mt-8">
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">Irritability Index Trends</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 20]} />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="Irritability Index" 
                stroke="#DC2626" 
                strokeWidth={2} 
                dot={{ stroke: '#DC2626', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 8 }}
              />
              {/* Reference lines for severity levels */}
              <ReferenceLine y={5} stroke="#10B981" strokeDasharray="3 3" label={{ value: 'Low', position: 'insideTopRight' }} />
              <ReferenceLine y={10} stroke="#FBBF24" strokeDasharray="3 3" label={{ value: 'Mild-Moderate', position: 'insideTopRight' }} />
              <ReferenceLine y={15} stroke="#F97316" strokeDasharray="3 3" label={{ value: 'Moderate', position: 'insideTopRight' }} />
              <ReferenceLine y={20} stroke="#DC2626" strokeDasharray="3 3" label={{ value: 'Severe', position: 'insideTopRight' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};