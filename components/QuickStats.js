import React from 'react';

const QuickStats = ({ userData }) => {
  // Function to determine color based on trend
  const getTrendColor = (value) => {
    if (!value) return "text-gray-500";
    return value > 0 ? "text-green-500" : "text-red-500";
  };
  
  // Function to get +/- prefix for percentages
  const getPrefix = (value) => {
    if (!value) return "";
    return value > 0 ? "+" : "";
  };
  
  // Get data from user data or use placeholder if not available
  const stats = {
    wristFlexorEndurance: {
      weight: userData?.wristFlexorEndurance?.weight || 6,
      repMax: userData?.wristFlexorEndurance?.repMax || 40,
      percentChange: userData?.wristFlexorEndurance?.percentChange || 8
    },
    wristExtensorEndurance: {
      weight: userData?.wristExtensorEndurance?.weight || 6,
      repMax: userData?.wristExtensorEndurance?.repMax || 15,
      percentChange: userData?.wristExtensorEndurance?.percentChange || 3
    },
    thumbFlexorEndurance: {
      weight: userData?.thumbFlexorEndurance?.weight || "3 RB",
      repMax: userData?.thumbFlexorEndurance?.repMax || 20,
      percentChange: userData?.thumbFlexorEndurance?.percentChange || 10
    },
    thumbExtensorEndurance: {
      weight: userData?.thumbExtensorEndurance?.weight || "4RB",
      repMax: userData?.thumbExtensorEndurance?.repMax || 43,
      percentChange: userData?.thumbExtensorEndurance?.percentChange || 20
    },
    painLevels: {
      average: userData?.painLevels?.average || 2,
      percentChange: userData?.painLevels?.percentChange || -8,
      passive: userData?.painLevels?.passive || 1,
      passivePercentChange: userData?.painLevels?.passivePercentChange || -15,
      active: userData?.painLevels?.active || 3,
      activePercentChange: userData?.painLevels?.activePercentChange || -10
    },
    activityTime: {
      workMax: userData?.activityTime?.workMax || 7,
      workPercentChange: userData?.activityTime?.workPercentChange || 30,
      hobbyMax: userData?.activityTime?.hobbyMax || 3,
      hobbyPercentChange: userData?.activityTime?.hobbyPercentChange || 10
    },
    limitations: {
      functional: userData?.limitations?.functional || 35,
      functionalPercentChange: userData?.limitations?.functionalPercentChange || -10,
      work: userData?.limitations?.work || 10,
      workPercentChange: userData?.limitations?.workPercentChange || -50,
      hobby: userData?.limitations?.hobby || 5,
      hobbyPercentChange: userData?.limitations?.hobbyPercentChange || -3
    }
  };
  
  return (
    <div>
      <h3 className="text-xl font-bold mb-4">Your Attributes</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Wrist Flexor Endurance */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h4 className="font-medium text-gray-800 mb-2">Wrist Flexor Endurance</h4>
          <p className="text-xl font-bold">
            {stats.wristFlexorEndurance.weight} Lbs
          </p>
          <p className="text-xl font-bold">
            {stats.wristFlexorEndurance.repMax} Rep Max
          </p>
          <p className={getTrendColor(stats.wristFlexorEndurance.percentChange)}>
            {getPrefix(stats.wristFlexorEndurance.percentChange)}
            {stats.wristFlexorEndurance.percentChange}% from last week
          </p>
        </div>
        
        {/* Wrist Extensor Endurance */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h4 className="font-medium text-gray-800 mb-2">Wrist Extensor Endurance</h4>
          <p className="text-xl font-bold">
            {stats.wristExtensorEndurance.weight} Lbs
          </p>
          <p className="text-xl font-bold">
            {stats.wristExtensorEndurance.repMax} Rep Max
          </p>
          <p className={getTrendColor(stats.wristExtensorEndurance.percentChange)}>
            {getPrefix(stats.wristExtensorEndurance.percentChange)}
            {stats.wristExtensorEndurance.percentChange}% from last week
          </p>
        </div>
        
        {/* Thumb Flexor Endurance */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h4 className="font-medium text-gray-800 mb-2">Thumb Flexor Endurance</h4>
          <p className="text-xl font-bold">
            {stats.thumbFlexorEndurance.weight}
          </p>
          <p className="text-xl font-bold">
            {stats.thumbFlexorEndurance.repMax} Rep Max
          </p>
          <p className={getTrendColor(stats.thumbFlexorEndurance.percentChange)}>
            {getPrefix(stats.thumbFlexorEndurance.percentChange)}
            {stats.thumbFlexorEndurance.percentChange}% from last week
          </p>
        </div>
        
        {/* Thumb Extensor Endurance */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h4 className="font-medium text-gray-800 mb-2">Thumb Extensor Endurance</h4>
          <p className="text-xl font-bold">
            {stats.thumbExtensorEndurance.weight}
          </p>
          <p className="text-xl font-bold">
            {stats.thumbExtensorEndurance.repMax} Rep Max
          </p>
          <p className={getTrendColor(stats.thumbExtensorEndurance.percentChange)}>
            {getPrefix(stats.thumbExtensorEndurance.percentChange)}
            {stats.thumbExtensorEndurance.percentChange}% from last week
          </p>
        </div>
        
        {/* Average Pain Level */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h4 className="font-medium text-gray-800 mb-2">Average Pain Level</h4>
          <p className="text-xl font-bold">
            {stats.painLevels.average}/10
          </p>
          <p className={getTrendColor(stats.painLevels.percentChange)}>
            {getPrefix(stats.painLevels.percentChange)}
            {stats.painLevels.percentChange}% from last week
          </p>
        </div>
        
        {/* Highest Passive Pain Level */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h4 className="font-medium text-gray-800 mb-2">Highest Passive Pain Level</h4>
          <p className="text-xl font-bold">
            {stats.painLevels.passive}/10
          </p>
          <p className={getTrendColor(stats.painLevels.passivePercentChange)}>
            {getPrefix(stats.painLevels.passivePercentChange)}
            {stats.painLevels.passivePercentChange}% from last week
          </p>
        </div>
        
        {/* Highest Activity Pain Level */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h4 className="font-medium text-gray-800 mb-2">Highest Activity Pain Level</h4>
          <p className="text-xl font-bold">
            {stats.painLevels.active}/10
          </p>
          <p className={getTrendColor(stats.painLevels.activePercentChange)}>
            {getPrefix(stats.painLevels.activePercentChange)}
            {stats.painLevels.activePercentChange}% from last week
          </p>
        </div>
        
        {/* Max Work Time */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h4 className="font-medium text-gray-800 mb-2">Max Work Time</h4>
          <p className="text-xl font-bold">
            {stats.activityTime.workMax} Hours
          </p>
          <p className={getTrendColor(stats.activityTime.workPercentChange)}>
            {getPrefix(stats.activityTime.workPercentChange)}
            {stats.activityTime.workPercentChange}% from last week
          </p>
        </div>
        
        {/* Max Hobby Time */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h4 className="font-medium text-gray-800 mb-2">Max Hobby Time</h4>
          <p className="text-xl font-bold">
            {stats.activityTime.hobbyMax} Hours
          </p>
          <p className={getTrendColor(stats.activityTime.hobbyPercentChange)}>
            {getPrefix(stats.activityTime.hobbyPercentChange)}
            {stats.activityTime.hobbyPercentChange}% from last week
          </p>
        </div>
        
        {/* Average Functional Limitation */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h4 className="font-medium text-gray-800 mb-2">Average Functional Limitation</h4>
          <p className="text-xl font-bold">
            {stats.limitations.functional}%
          </p>
          <p className={getTrendColor(stats.limitations.functionalPercentChange)}>
            {getPrefix(stats.limitations.functionalPercentChange)}
            {stats.limitations.functionalPercentChange}% from last week
          </p>
        </div>
        
        {/* Average Work Limitation */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h4 className="font-medium text-gray-800 mb-2">Average Work Limitation</h4>
          <p className="text-xl font-bold">
            {stats.limitations.work}%
          </p>
          <p className={getTrendColor(stats.limitations.workPercentChange)}>
            {getPrefix(stats.limitations.workPercentChange)}
            {stats.limitations.workPercentChange}% from last week
          </p>
        </div>
        
        {/* Average Hobby Limitation */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h4 className="font-medium text-gray-800 mb-2">Average Hobby Limitation</h4>
          <p className="text-xl font-bold">
            {stats.limitations.hobby}%
          </p>
          <p className={getTrendColor(stats.limitations.hobbyPercentChange)}>
            {getPrefix(stats.limitations.hobbyPercentChange)}
            {stats.limitations.hobbyPercentChange}% from last week
          </p>
        </div>
      </div>
    </div>
  );
};

export default QuickStats;