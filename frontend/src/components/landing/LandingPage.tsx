import React from 'react';
import { Link } from 'react-router-dom';
import { Globe2, Satellite, Activity, ShieldAlert, ChevronRight } from 'lucide-react';
import styles from './LandingPage.module.css';

export const LandingPage: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.gridBackground} />
      <div className={styles.gridMask} />

      <nav className={styles.navbar}>
        <div className={styles.logo}>
          <Globe2 className={styles.logoIcon} size={28} />
          KSHITIRAKSHA
        </div>
        <div className={styles.navLinks}>
          <a href="#features" className={styles.navLink}>Features</a>
          <a href="#technology" className={styles.navLink}>Technology</a>
          <Link to="/login" className={styles.secondaryButton}>Log In</Link>
          <Link to="/register" className={styles.primaryButton}>Get Started</Link>
        </div>
      </nav>

      <main className={styles.hero}>
        {/* Ambient Glow */}
        <div className={styles.ambientGlow} aria-hidden="true" />
        
        <h1 className={styles.title}>
          The Smart Watchtower for Earth
        </h1>
        
        <p className={styles.subtitle}>
          Automated satellite-based change detection. We monitor forests, water bodies, and urban expansion, turning raw pixels into actionable alerts without human intervention.
        </p>

        <div className={styles.ctaGroup}>
          <Link to="/register" className={styles.heroPrimaryCta}>
            Start Monitoring <ChevronRight size={20} />
          </Link>
          <Link to="/login" className={styles.heroSecondaryCta}>
            View Dashboard
          </Link>
        </div>
      </main>

      <div className={styles.featuresPreview} id="features">
        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>
            <Satellite size={24} />
          </div>
          <h3 className={styles.featureTitle}>Automated Pipeline</h3>
          <p className={styles.featureDesc}>
            Select your AOI and let our engine automatically fetch, clean, and analyze Sentinel-2 imagery on a schedule.
          </p>
        </div>

        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>
            <Activity size={24} />
          </div>
          <h3 className={styles.featureTitle}>Smart Detection</h3>
          <p className={styles.featureDesc}>
            Algorithms trained to ignore clouds and seasonal noise, isolating only statistically significant changes.
          </p>
        </div>

        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>
            <ShieldAlert size={24} />
          </div>
          <h3 className={styles.featureTitle}>Actionable Alerts</h3>
          <p className={styles.featureDesc}>
            Receive categorized alerts for deforestation, water shrinkage, or unauthorized construction directly to your dashboard.
          </p>
        </div>
      </div>
    </div>
  );
};
