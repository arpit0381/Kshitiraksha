import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Globe2, ArrowRight } from 'lucide-react';
import styles from './Auth.module.css';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate authentication and redirect to dashboard
    navigate('/app');
  };

  return (
    <div className={styles.container}>
      {/* Ambient Glow */}
      <div className={styles.ambientGlow} aria-hidden="true" />
      {/* Faint lat/long grid */}
      <div className={styles.gridBackground} />
      <div className={styles.gridMask} />

      <div className={styles.authCard}>
        <div className={styles.brandHeader}>
          <Globe2 className={styles.logoIcon} size={48} />
          <h1 className={styles.title}>Welcome back</h1>
          <p className={styles.subtitle}>Sign in to access your monitoring dashboard</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="email">Email address</label>
            <input 
              id="email" 
              type="email" 
              className={styles.input} 
              placeholder="name@organization.gov"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>

          <div className={styles.inputGroup}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className={styles.label} htmlFor="password">Password</label>
              <a href="#" className={styles.link} style={{ fontSize: '12px' }}>Forgot password?</a>
            </div>
            <input 
              id="password" 
              type="password" 
              className={styles.input} 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>

          <button type="submit" className={styles.submitButton}>
            Sign In <ArrowRight size={18} />
          </button>
        </form>

        <p className={styles.footerText}>
          Don't have an account? <Link to="/register" className={styles.link}>Request access</Link>
        </p>
      </div>
    </div>
  );
};
