import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Globe2, MapPin, Satellite, Search, CloudOff, GitCompare, AlertTriangle,
  FileText, Bell, Download, ChevronRight, CheckCircle2, ArrowRight,
  Shield, Zap, Eye, TreePine, Droplets, Mountain, BarChart3
} from 'lucide-react';
import styles from './LandingPage.module.css';

const HOW_IT_WORKS_STEPS = [
  {
    step: 1,
    icon: <MapPin size={28} />,
    title: 'Select Your Area',
    desc: 'Draw a boundary on the map around any forest, farm, river, lake, or village you want to monitor. No GIS expertise needed — just point and click.',
    color: '#1a73e8'
  },
  {
    step: 2,
    icon: <Satellite size={28} />,
    title: 'We Fetch Satellite Images',
    desc: 'Our system automatically downloads the latest satellite images (Sentinel-2) for your selected area. Fresh images every 5 days — zero manual effort.',
    color: '#1e8e3e'
  },
  {
    step: 3,
    icon: <CloudOff size={28} />,
    title: 'Clean Up Clouds & Noise',
    desc: 'Clouds and shadows can hide real changes. Our AI removes them so only clear, reliable images are used for comparison.',
    color: '#007b83'
  },
  {
    step: 4,
    icon: <GitCompare size={28} />,
    title: 'Compare Old vs New',
    desc: 'The system compares the new satellite image with the previous one pixel-by-pixel to spot any differences — trees cut, water level changes, new construction.',
    color: '#e37426'
  },
  {
    step: 5,
    icon: <AlertTriangle size={28} />,
    title: 'Detect Real Changes',
    desc: 'AI flags only meaningful changes — deforestation, encroachment, flooding, mining. False alarms from seasonal changes are filtered out.',
    color: '#d93025'
  },
  {
    step: 6,
    icon: <Bell size={28} />,
    title: 'Get Instant Alerts',
    desc: 'Receive alerts via email, SMS, or push notification the moment a significant change is detected. Review reports with maps and data.',
    color: '#f59e0b'
  }
];

const USE_CASES = [
  { icon: <TreePine size={24} />, title: 'Forest Protection', desc: 'Monitor deforestation & illegal logging in real-time', color: '#1e8e3e' },
  { icon: <Droplets size={24} />, title: 'Water Bodies', desc: 'Track lake/river level changes and flood risks', color: '#007b83' },
  { icon: <Mountain size={24} />, title: 'Mining & Encroachment', desc: 'Detect unauthorized construction or land-use changes', color: '#e37426' },
  { icon: <Shield size={24} />, title: 'Conservation', desc: 'Protect wildlife reserves and national parks', color: '#1a73e8' }
];

export const LandingPage: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep(prev => (prev + 1) % HOW_IT_WORKS_STEPS.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.gridBackground} />
      <div className={styles.gridMask} />

      {/* ─── Navbar ─── */}
      <nav className={styles.navbar}>
        <div className={styles.logo}>
          <div className={styles.logoIconWrapper}>
            <Globe2 size={22} />
          </div>
          <span>KSHITIRAKSHA</span>
          <span className={styles.logoBadge}>Earth Sentinel</span>
        </div>
        <div className={styles.navLinks}>
          <a href="#how-it-works" className={styles.navLink}>How It Works</a>
          <a href="#use-cases" className={styles.navLink}>Use Cases</a>
          <a href="#features" className={styles.navLink}>Features</a>
          <Link to="/login" className={styles.secondaryButton}>Log In</Link>
          <Link to="/register" className={styles.primaryButton}>
            Get Started Free <ArrowRight size={16} />
          </Link>
        </div>
      </nav>

      {/* ─── Hero Section ─── */}
      <main className={styles.hero}>
        <div className={styles.ambientGlow} aria-hidden="true" />

        <div className={styles.heroBadge}>
          <span className={styles.heroBadgeDot} />
          Satellite-Powered Land Monitoring Platform
        </div>

        <h1 className={styles.title}>
          Watch Over Your Land<br />
          <span className={styles.titleHighlight}>From Space</span>
        </h1>

        <p className={styles.subtitle}>
          Kshitiraksha automatically monitors forests, farms, rivers, and villages using satellite images.
          It detects changes like deforestation, flooding, or illegal construction — and alerts you instantly.
        </p>

        <div className={styles.ctaGroup}>
          <Link to="/login" className={styles.heroPrimaryCta}>
            Start Monitoring Now <ChevronRight size={20} />
          </Link>
          <a href="#how-it-works" className={styles.heroSecondaryCta}>
            See How It Works
          </a>
        </div>

        {/* Quick Stats */}
        <div className={styles.statsRow}>
          <div className={styles.statItem}>
            <CheckCircle2 size={16} style={{ color: '#1e8e3e' }} />
            <span>10m Resolution Images</span>
          </div>
          <div className={styles.statItem}>
            <CheckCircle2 size={16} style={{ color: '#1e8e3e' }} />
            <span>Updates Every 5 Days</span>
          </div>
          <div className={styles.statItem}>
            <CheckCircle2 size={16} style={{ color: '#1e8e3e' }} />
            <span>AI-Powered Detection</span>
          </div>
          <div className={styles.statItem}>
            <Zap size={16} style={{ color: '#f59e0b' }} />
            <span>Instant Alerts</span>
          </div>
        </div>
      </main>

      {/* ─── How It Works (Step by Step) ─── */}
      <section className={styles.howItWorks} id="how-it-works">
        <div className={styles.sectionHeader}>
          <span className={styles.sectionBadge}>Simple 6-Step Process</span>
          <h2 className={styles.sectionTitle}>How Kshitiraksha Works</h2>
          <p className={styles.sectionDesc}>
            From selecting your area to getting alerts — everything is automated. Here's the complete flow:
          </p>
        </div>

        <div className={styles.stepsGrid}>
          {HOW_IT_WORKS_STEPS.map((item, idx) => (
            <div
              key={idx}
              className={`${styles.stepCard} ${idx === activeStep ? styles.stepCardActive : ''}`}
              onMouseEnter={() => setActiveStep(idx)}
            >
              <div className={styles.stepNumber} style={{ backgroundColor: item.color }}>
                {item.step}
              </div>
              <div className={styles.stepIconWrapper} style={{ color: item.color, backgroundColor: `${item.color}15` }}>
                {item.icon}
              </div>
              <h3 className={styles.stepTitle}>{item.title}</h3>
              <p className={styles.stepDesc}>{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Visual Flow Arrow Line */}
        <div className={styles.flowArrow}>
          <div className={styles.flowLine} />
          <span className={styles.flowLabel}>Fully Automated Pipeline — You Just Select the Area!</span>
        </div>
      </section>

      {/* ─── Use Cases ─── */}
      <section className={styles.useCases} id="use-cases">
        <div className={styles.sectionHeader}>
          <span className={styles.sectionBadge}>Who Is This For?</span>
          <h2 className={styles.sectionTitle}>Monitor Any Type of Land</h2>
          <p className={styles.sectionDesc}>
            Whether you're a forest officer, farmer, NGO, or government agency — Kshitiraksha helps you protect your land.
          </p>
        </div>

        <div className={styles.useCasesGrid}>
          {USE_CASES.map((uc, idx) => (
            <div key={idx} className={styles.useCaseCard}>
              <div className={styles.useCaseIcon} style={{ color: uc.color, backgroundColor: `${uc.color}15`, borderColor: `${uc.color}30` }}>
                {uc.icon}
              </div>
              <h3 className={styles.useCaseTitle}>{uc.title}</h3>
              <p className={styles.useCaseDesc}>{uc.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Features Grid ─── */}
      <section className={styles.featuresPreview} id="features">
        <div className={styles.sectionHeader}>
          <span className={styles.sectionBadge}>Powerful Features</span>
          <h2 className={styles.sectionTitle}>Everything You Need</h2>
        </div>

        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <MapPin size={22} />
            </div>
            <h3 className={styles.featureTitle}>Draw or Upload Area</h3>
            <p className={styles.featureDesc}>
              Simply draw a polygon on the map or upload a GeoJSON file. Select any area — forest, farm, village, or river.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon} style={{ color: '#1e8e3e', borderColor: 'rgba(30,142,62,0.3)', background: 'rgba(30,142,62,0.1)' }}>
              <Eye size={22} />
            </div>
            <h3 className={styles.featureTitle}>Before & After Comparison</h3>
            <p className={styles.featureDesc}>
              Swipe between old and new satellite images to visually see exactly what changed. Like a time machine for your land.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon} style={{ color: '#e37426', borderColor: 'rgba(227,116,38,0.3)', background: 'rgba(227,116,38,0.1)' }}>
              <BarChart3 size={22} />
            </div>
            <h3 className={styles.featureTitle}>Detailed Reports</h3>
            <p className={styles.featureDesc}>
              Get reports with exact location, date, type of change, and percentage of area affected. Export as GeoJSON for QGIS/ArcGIS.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon} style={{ color: '#f59e0b', borderColor: 'rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.1)' }}>
              <Zap size={22} />
            </div>
            <h3 className={styles.featureTitle}>Blockchain Verified</h3>
            <p className={styles.featureDesc}>
              Every analysis is recorded on Algorand blockchain via AlgoKit x402 protocol. Tamper-proof, transparent, and verifiable.
            </p>
          </div>
        </div>
      </section>

      {/* ─── CTA Banner ─── */}
      <section className={styles.ctaBanner}>
        <h2 className={styles.ctaBannerTitle}>Ready to Protect Your Land?</h2>
        <p className={styles.ctaBannerDesc}>
          Sign up in 30 seconds. Select your area. Let satellites do the watching.
        </p>
        <div className={styles.ctaGroup}>
          <Link to="/register" className={styles.heroPrimaryCta}>
            Create Free Account <ArrowRight size={18} />
          </Link>
          <Link to="/login" className={styles.heroSecondaryCta}>
            Already have an account? Log In
          </Link>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerBrand}>
            <Globe2 size={20} style={{ color: '#1a73e8' }} />
            <span>Kshitiraksha</span>
          </div>
          <p className={styles.footerText}>
            Satellite-based automated change detection & alert system.
            Built with Sentinel-2 imagery, AI analysis, and Algorand blockchain.
          </p>
        </div>
      </footer>
    </div>
  );
};
