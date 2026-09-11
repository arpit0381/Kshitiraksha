import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Globe2, ArrowRight } from 'lucide-react';
import styles from './Auth.module.css';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate registration and redirect to dashboard
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
          <h1 className={styles.title}>Join KSHITIRAKSHA</h1>
          <p className={styles.subtitle}>Create an account to start monitoring</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="name">Full Name</label>
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
            <label className={styles.label} htmlFor="organization">Organization</label>
            <input 
              id="organization" 
              type="text" 
              className={styles.input} 
              placeholder="Forest Department"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              required 
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="email">Work Email</label>
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

          <button type="submit" className={styles.submitButton} style={{ marginTop: '24px' }}>
            Create Account <ArrowRight size={18} />
          </button>
        </form>

        <p className={styles.footerText}>
          Already have an account? <Link to="/login" className={styles.link}>Sign in</Link>
        </p>
      </div>
    </div>
  );
};
