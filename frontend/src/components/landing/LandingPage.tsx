import React from 'react';
import { Link } from 'react-router-dom';
import { Globe2, Satellite, Activity, ShieldAlert, ChevronRight, Zap, Layers, CheckCircle2, ArrowRight } from 'lucide-react';
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
          <a href="#features" className={styles.navLink}>Core Pipeline</a>
          <a href="#x402" className={styles.navLink}>AlgoKit x402</a>
          <Link to="/login" className={styles.secondaryButton}>Log In</Link>
          <Link to="/app" className={styles.primaryButton}>Launch Workspace</Link>
        </div>
      </nav>

      <main className={styles.hero}>
        {/* Ambient Glow */}
        <div className={styles.ambientGlow} aria-hidden="true" />

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: '100px', backgroundColor: 'rgba(95, 167, 119, 0.15)', border: '1px solid rgba(95, 167, 119, 0.3)', color: '#5FA777', fontSize: '13px', fontWeight: 600, marginBottom: '20px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#5FA777', boxShadow: '0 0 8px #5FA777' }} />
          ISRO Sentinel-2 Multi-Temporal Change Engine
        </div>

        <h1 className={styles.title}>
          The Smart Watchtower for Planetary Resources
        </h1>

        <p className={styles.subtitle}>
          Automated multi-spectral satellite change detection. We monitor forests, water bodies, and mining encroachment—transforming raw Sentinel-2 L2A observations into explainable alerts and on-chain pay-per-use computations.
        </p>

        <div className={styles.ctaGroup}>
          <Link to="/app" className={styles.heroPrimaryCta}>
            Launch Live Demo <ChevronRight size={20} />
          </Link>
          <Link to="/register" className={styles.heroSecondaryCta}>
            Request API Access
          </Link>
        </div>

        {/* Live Hero Telemetry Strip */}
        <div style={{ display: 'flex', gap: '24px', marginTop: '48px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#8B9AAC' }}>
            <CheckCircle2 size={16} style={{ color: '#5FA777' }} />
            <span>10m GSD Optical Resolution</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#8B9AAC' }}>
            <CheckCircle2 size={16} style={{ color: '#5FA777' }} />
            <span>OpenCV Connected Morphology</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#5FA777' }}>
            <Zap size={16} />
            <span>AlgoKit x402 Micropayments</span>
          </div>
        </div>
      </main>

      {/* Feature Grid */}
      <div className={styles.featuresPreview} id="features">
        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>
            <Satellite size={24} />
          </div>
          <h3 className={styles.featureTitle}>Automated Pipeline</h3>
          <p className={styles.featureDesc}>
            Draw or upload any AOI polygon. Our pipeline automatically fetches clean cloud-masked Sentinel-2 MSI rasters and runs multi-temporal index differencing.
          </p>
        </div>

        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>
            <Activity size={24} />
          </div>
          <h3 className={styles.featureTitle}>Explainable Confidence</h3>
          <p className={styles.featureDesc}>
            4-factor composite AI evaluation: Spectral magnitude, spatial clustering contiguity, cloud probability scoring, and temporal persistence.
          </p>
        </div>

        <div className={styles.featureCard} id="x402">
          <div className={styles.featureIcon} style={{ color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.3)', background: 'rgba(245, 158, 11, 0.1)' }}>
            <Zap size={24} />
          </div>
          <h3 className={styles.featureTitle}>AlgoKit x402 Protocol</h3>
          <p className={styles.featureDesc}>
            Monetized high-priority compute queues and 16-bit GeoTIFF bundles via Algorand Testnet HTTP 402 pay-per-request micropayments.
          </p>
        </div>
      </div>
    </div>
  );
};
