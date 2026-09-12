import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Globe2, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import styles from './Auth.module.css';

import { ApiService } from '../../services/api';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await ApiService.login(email, password);
      navigate('/app');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = async (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('demopass123');
    setIsSubmitting(true);
    setError(null);
    try {
      await ApiService.login(roleEmail, 'demopass123');
      navigate('/app');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please ensure backend server is running on port 8000.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.ambientGlow} aria-hidden="true" />
      <div className={styles.gridBackground} />
      <div className={styles.gridMask} />

      <div className={styles.authCard}>
        <div className={styles.brandHeader}>
          <Globe2 className={styles.logoIcon} size={48} />
          <h1 className={styles.title}>Kshitiraksha</h1>
          <p className={styles.subtitle}>Sign in to access your satellite change monitoring command console</p>
        </div>

        {/* Single 1-Click Demo Access Button */}
        <div style={{ marginBottom: '16px' }}>
          <button
            type="button"
            onClick={() => handleQuickLogin('officer.korba@forest.gov.in')}
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: '11px 16px',
              fontSize: '12px',
              fontWeight: 700,
              borderRadius: '8px',
              backgroundColor: 'rgba(95, 167, 119, 0.14)',
              color: '#5FA777',
              border: '1px solid rgba(95, 167, 119, 0.35)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            <span>🚀</span>
            <span>1-Click Demo Access (ISRO Watchtower Officer)</span>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '0 0 16px 0' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.08)' }} />
          <span style={{ fontSize: '10px', color: '#8B9AAC', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>or official credentials</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.08)' }} />
        </div>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#f87171',
              fontSize: '12px',
              fontWeight: 600,
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="email">Email address</label>
            <input 
              id="email" 
              type="email" 
              className={styles.input} 
              placeholder="name@organization.gov.in"
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

          <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
            {isSubmitting ? 'Authenticating with Live Satellite API...' : 'Launch Command Dashboard'} <ArrowRight size={18} />
          </button>
        </form>

        <p className={styles.footerText}>
          Don't have an account? <Link to="/register" className={styles.link}>Request GIS access</Link>
        </p>
      </div>
    </div>
  );
};
