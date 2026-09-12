import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Globe2, ArrowRight } from 'lucide-react';
import styles from './Auth.module.css';

import { ApiService } from '../../services/api';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await ApiService.register(email, password);
      await ApiService.login(email, password);
      navigate('/app');
    } catch (err: any) {
      setError(err.message || 'Registration failed. User may already exist.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickRegister = async (rName: string, rOrg: string, rEmail: string) => {
    setName(rName);
    setOrganization(rOrg);
    setEmail(rEmail);
    setPassword('demopass123');
    setIsSubmitting(true);
    setError(null);
    try {
      try {
        await ApiService.register(rEmail, 'demopass123');
      } catch {
        // If already registered, proceed to authenticate
      }
      await ApiService.login(rEmail, 'demopass123');
      navigate('/app');
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate demo account.');
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
          <h1 className={styles.title}>Join Kshitiraksha</h1>
          <p className={styles.subtitle}>Create an account to start satellite change surveillance</p>
        </div>

        {/* Single 1-Click Demo Setup */}
        <div style={{ marginBottom: '16px' }}>
          <button
            type="button"
            onClick={() => handleQuickRegister('Senior Scientist', 'NRSC / ISRO Geospatial Wing', 'scientist.isro@nrsc.gov.in')}
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: '11px 16px',
              fontSize: '12px',
              fontWeight: 700,
              borderRadius: '8px',
              backgroundColor: 'rgba(245, 158, 11, 0.14)',
              color: '#f59e0b',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            <span>🛰️</span>
            <span>1-Click Demo Access (ISRO Lead Scientist)</span>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '0 0 16px 0' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.08)' }} />
          <span style={{ fontSize: '10px', color: '#8B9AAC', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>or register new officer credentials</span>
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
            <label className={styles.label} htmlFor="name">Full Name & Rank</label>
            <input 
              id="name" 
              type="text" 
              className={styles.input} 
              placeholder="Dr. Rajesh Kumar"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required 
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="organization">Government Department / Authority</label>
            <input 
              id="organization" 
              type="text" 
              className={styles.input} 
              placeholder="Ministry of Environment / ISRO / CWC"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              required 
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="email">Official Work Email</label>
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
            <label className={styles.label} htmlFor="password">Password</label>
            <input 
              id="password" 
              type="password" 
              className={styles.input} 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
              minLength={8}
            />
          </div>

          <button type="submit" className={styles.submitButton} style={{ marginTop: '20px' }}>
            Create Monitoring Account <ArrowRight size={18} />
          </button>
        </form>

        <p className={styles.footerText}>
          Already have an account? <Link to="/login" className={styles.link}>Sign in</Link>
        </p>
      </div>
    </div>
  );
};
