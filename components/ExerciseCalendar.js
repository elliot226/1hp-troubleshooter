// components/ExerciseCalendar.js
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getExerciseTrackingForDate } from '@/lib/exercisePrescriptionUtils';

export default function ExerciseCalendar({ onSelectDate }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState([]);
  const [completionData, setCompletionData] = useState({});
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);

  // Generate calendar days for the current month
  useEffect(() => {
    generateCalendarDays(currentMonth);
  }, [currentMonth]);

  // Fetch completion data for each day in the visible calendar
  useEffect(() => {
    if (!currentUser || calendarDays.length === 0) return;
    
    const fetchCompletionData = async () => {
      setLoading(true);
      const completionMap = {};
      
      // Get start and end dates from calendar days
      const startDate = calendarDays[0].date;
      const endDate = calendarDays[calendarDays.length - 1].date;
      
      // Loop through each date and fetch exercise tracking data
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        // Create a date at 00:00:00 to avoid timezone issues
        const dateToFetch = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          currentDate.getDate(),
          0, 0, 0, 0
        );
        
        // Format date as YYYY-MM-DD for consistent comparison
        const dateString = formatDateString(dateToFetch);
        
        try {
          const trackingData = await getExerciseTrackingForDate(currentUser.uid, dateToFetch);
          
          // Determine if AM and PM sessions are complete
          const exerciseIds = Object.keys(trackingData);
          
          if (exerciseIds.length > 0) {
            const amCompleted = exerciseIds.every(id => 
              trackingData[id].some(instance => 
                instance.timeOfDay === 'AM' && instance.completed
              )
            );
            
            const pmCompleted = exerciseIds.every(id => 
              trackingData[id].some(instance => 
                instance.timeOfDay === 'PM' && instance.completed
              )
            );
            
            completionMap[dateString] = {
              amCompleted: amCompleted && exerciseIds.length > 0,
              pmCompleted: pmCompleted && exerciseIds.length > 0
            };
          } else {
            completionMap[dateString] = { amCompleted: false, pmCompleted: false };
          }
        } catch (error) {
          console.error(`Error fetching data for ${dateString}:`, error);
          completionMap[dateString] = { amCompleted: false, pmCompleted: false };
        }
        
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      setCompletionData(completionMap);
      setLoading(false);
    };
    
    fetchCompletionData();
  }, [currentUser, calendarDays]);

  // Consistent date formatting function to avoid timezone issues
  function formatDateString(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  function generateCalendarDays(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Previous month's days to show
    const daysFromPrevMonth = firstDayOfWeek;
    const prevMonth = new Date(year, month, 0);
    const daysInPrevMonth = prevMonth.getDate();
    
    // Next month's days to show
    const daysFromNextMonth = (7 - ((daysFromPrevMonth + daysInMonth) % 7)) % 7;
    
    const days = [];
    
    // Add days from previous month
    for (let i = daysInPrevMonth - daysFromPrevMonth + 1; i <= daysInPrevMonth; i++) {
      days.push({
        date: new Date(year, month - 1, i, 0, 0, 0, 0),
        dayOfMonth: i,
        isCurrentMonth: false
      });
    }
    
    // Add days from current month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i, 0, 0, 0, 0),
        dayOfMonth: i,
        isCurrentMonth: true
      });
    }
    
    // Add days from next month
    for (let i = 1; i <= daysFromNextMonth; i++) {
      days.push({
        date: new Date(year, month + 1, i, 0, 0, 0, 0),
        dayOfMonth: i,
        isCurrentMonth: false
      });
    }
    
    setCalendarDays(days);
  }

  function goToPreviousMonth() {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  }

  function goToNextMonth() {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  }

  function handleDayClick(day) {
    if (onSelectDate) {
      // Set the date to midnight to avoid timezone issues
      const selectedDate = new Date(
        day.date.getFullYear(),
        day.date.getMonth(),
        day.date.getDate(),
        0, 0, 0, 0
      );
      onSelectDate(selectedDate);
    }
  }

  function formatMonthYear(date) {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  function getDayClasses(day) {
    // Normalize to midnight to prevent timezone issues
    const dateString = formatDateString(day.date);
    const dayData = completionData[dateString] || { amCompleted: false, pmCompleted: false };
    
    const baseClasses = "relative h-12 border"; 
    
    // Both AM and PM sessions completed - fully green
    if (dayData.amCompleted && dayData.pmCompleted) {
      return `${baseClasses} bg-green-200`;
    }
    
    // Only AM or PM completed - half colored
    if (dayData.amCompleted || dayData.pmCompleted) {
      return `${baseClasses} relative overflow-hidden`;
    }
    
    // Default - white background with gray text for non-current month
    return `${baseClasses} ${day.isCurrentMonth ? '' : 'text-gray-400'}`;
  }

  function renderDayContent(day) {
    const dateString = formatDateString(day.date);
    const dayData = completionData[dateString] || { amCompleted: false, pmCompleted: false };
    
    // For days with only AM or PM completed, create a diagonal split background
    if ((dayData.amCompleted || dayData.pmCompleted) && !(dayData.amCompleted && dayData.pmCompleted)) {
      return (
        <>
          <span className="z-10 relative">{day.dayOfMonth}</span>
          {dayData.amCompleted && (
            <div className="absolute inset-0 bg-blue-200 z-0" style={{ clipPath: 'polygon(0 0, 0% 100%, 100% 0)' }}></div>
          )}
          {dayData.pmCompleted && (
            <div className="absolute inset-0 bg-green-200 z-0" style={{ clipPath: 'polygon(100% 100%, 0% 100%, 100% 0)' }}></div>
          )}
        </>
      );
    }
    
    return day.dayOfMonth;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="calendar-container mb-6">
      <div className="flex justify-between items-center mb-4">
        <button onClick={goToPreviousMonth} className="p-1 bg-red-500 text-white rounded-md hover:bg-red-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-xl font-semibold">{formatMonthYear(currentMonth)}</h2>
        <button onClick={goToNextMonth} className="p-1 bg-red-500 text-white rounded-md hover:bg-red-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      
      <div className="grid grid-cols-7 border">
        {/* Day headers */}
        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
          <div key={day} className="p-2 text-center font-medium text-sm bg-gray-100 border">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {calendarDays.map((day, index) => {
          const isToday = day.date.getTime() === today.getTime();
          const dayClasses = getDayClasses(day);
          
          return (
            <div 
              key={index}
              className={`${dayClasses} ${isToday ? 'border-2 border-red-500' : ''}`}
              onClick={() => handleDayClick(day)}
            >
              <div className="h-full w-full flex items-center justify-center cursor-pointer">
                {renderDayContent(day)}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="mt-2 flex flex-wrap items-center text-xs text-gray-600">
        <div className="flex items-center mr-4">
          <div className="w-4 h-4 bg-green-200 mr-1 border"></div>
          <span>All Exercises Completed</span>
        </div>
        <div className="flex items-center mr-4">
          <div className="w-4 h-4 bg-white border mr-1 relative overflow-hidden">
            <div className="absolute inset-0 bg-blue-200" style={{ clipPath: 'polygon(0 0, 0% 100%, 100% 0)' }}></div>
          </div>
          <span>AM Session Completed</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-white border mr-1 relative overflow-hidden">
            <div className="absolute inset-0 bg-green-200" style={{ clipPath: 'polygon(100% 100%, 0% 100%, 100% 0)' }}></div>
          </div>
          <span>PM Session Completed</span>
        </div>
      </div>
    </div>
  );
}