'use client';

import React, { useState, useEffect } from 'react';
import styles from './loading.module.css';

const STAGES = [
  "Acquiring satellite pass",
  "Masking clouds & shadows",
  "Comparing baseline vs recent",
  "Filtering noise",
  "Calculating confidence"
];

export default function Loading() {
  const [currentStage, setCurrentStage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStage((prev) => (prev + 1) % STAGES.length);
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.container} role="status" aria-live="polite">
      <span className={styles.visuallyHidden}>Loading KSHITIRAKSHA…</span>
      
      {/* Background Grid Motif */}
      <div className={styles.gridBackground} aria-hidden="true" />
      <div className={styles.gridMask} aria-hidden="true" />

      <div className={styles.contentPanel}>
        {/* Animated Brand Mark */}
        <div className={styles.brandMark} aria-hidden="true">
          <div className={styles.innerRing} />
          <div className={styles.outerRing} />
        </div>

        {/* Scan Element */}
        <div className={styles.scanContainer} aria-hidden="true">
          <div className={styles.scanLine} />
        </div>

        {/* Cycling Pipeline Stages */}
        <div className={styles.stageTextContainer}>
          <p className={styles.stageText} aria-hidden="true">
            {STAGES[currentStage]}
          </p>
        </div>

        {/* Highlighted Stage Indicator Dots */}
        <div className={styles.dotsContainer} aria-hidden="true">
          {STAGES.map((_, index) => (
            <div 
              key={index} 
              className={`${styles.dot} ${index === currentStage ? styles.dotActive : ''}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
