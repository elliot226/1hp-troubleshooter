// components/DayNightToggle.js
import React from 'react';
import styles from './DayNightToggle.module.css';

/**
 * A day/night toggle component to be used for AM/PM selection
 * @param {Object} props
 * @param {boolean} props.isDay - True if AM (day), false if PM (night)
 * @param {Function} props.onChange - Callback when the toggle changes
 */
const DayNightToggle = ({ isDay, onChange }) => {
  // Handle the toggle change
  const handleChange = () => {
    if (onChange) {
      onChange(!isDay);
    }
  };
  
  return (
    <div className={styles.toggleContainer}>
      <input 
        id="day-night-switch" 
        className={styles.dayNightSwitch} 
        type="checkbox" 
        checked={isDay}
        onChange={handleChange}
      />
      <label htmlFor="day-night-switch" className={styles.dayNightSwitchLabel}>
        {/* Sun */}
        <div className={`${styles.celestial} ${styles.sun}`}>
          <div className={styles.rays}></div>
        </div>

        {/* Moon */}
        <div className={`${styles.celestial} ${styles.moon}`}>
          <div className={styles.craters}>
            <div className={styles.crater}></div>
            <div className={styles.crater}></div>
            <div className={styles.crater}></div>
            <div className={styles.crater}></div>
            <div className={styles.crater}></div>
          </div>
        </div>

        {/* Mountains */}
        <div className={styles.mountains}>
          <div className={styles.mountain}></div>
          <div className={styles.mountain}></div>
          <div className={styles.mountain}></div>
        </div>

        {/* Decorations - clouds in day, stars in night */}
        <div className={styles.decorations}>
          <div className={styles.decoration}></div>
          <div className={styles.decoration}></div>
          <div className={styles.decoration}></div>
          <div className={styles.decoration}></div>
        </div>

        <span className={styles.amPmLabel}>
          {isDay ? 'AM' : 'PM'}
        </span>
      </label>
    </div>
  );
};

export default DayNightToggle;