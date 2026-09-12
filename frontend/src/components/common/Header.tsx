import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import { ApiService } from '../../services/api';
import {
  Globe,
  Layers,
  Eye,
  ShieldCheck,
  Zap,
  Radio,
  Bell,
  FolderKanban,
  User,
  LogOut,
  Activity
} from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  pendingAlertsCount: number;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, onTabChange, pendingAlertsCount }) => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<{ email: string } | null>(null);
  const [isBackendOnline, setIsBackendOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      const health = await ApiService.checkHealth();
      setIsBackendOnline(health !== null);
      const me = await ApiService.getMe();
      if (me) setCurrentUser(me);
    };
    checkStatus();
    const interval = setInterval(checkStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    ApiService.logout();
    navigate('/login');
  };
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 24px',
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        boxShadow: 'var(--shadow-sm)',
        flexWrap: 'wrap',
        gap: '12px'
      }}
    >
      {/* Brand & Subtitle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '38px',
            height: '38px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--emerald-bg)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: 'var(--emerald-500)'
          }}
        >
          <Globe size={22} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '17px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              Kshitiraksha
            </span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-elevated)',
                color: 'var(--emerald-500)',
                border: '1px solid var(--border-subtle)',
                fontFamily: 'var(--font-mono)'
              }}
            >
              ISRO PROTO v1.0
            </span>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
            Satellite-Based Automated Change Detection & Alert System
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
        <button
          onClick={() => onTabChange('dashboard')}
          className={`btn btn-sm ${currentTab === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ gap: '6px' }}
        >
          <Radio size={14} />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => onTabChange('projects')}
          className={`btn btn-sm ${currentTab === 'projects' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ gap: '6px' }}
        >
          <FolderKanban size={14} />
          <span>Projects</span>
        </button>

        <button
          onClick={() => onTabChange('map')}
          className={`btn btn-sm ${currentTab === 'map' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ gap: '6px' }}
        >
          <Layers size={14} />
          <span>Map Workspace</span>
        </button>

        <button
          onClick={() => onTabChange('swipe')}
          className={`btn btn-sm ${currentTab === 'swipe' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ gap: '6px' }}
        >
          <Eye size={14} />
          <span>Comparison</span>
        </button>

        <button
          onClick={() => onTabChange('review')}
          className={`btn btn-sm ${currentTab === 'review' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ gap: '6px', position: 'relative' }}
        >
          <ShieldCheck size={14} />
          <span>Verification</span>
          {pendingAlertsCount > 0 && (
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '1px 5px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--amber-500)',
                color: '#ffffff',
                marginLeft: '4px'
              }}
            >
              {pendingAlertsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onTabChange('alerts')}
          className={`btn btn-sm ${currentTab === 'alerts' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ gap: '6px' }}
        >
          <Bell size={14} />
          <span>Alerts</span>
        </button>

        <button
          onClick={() => onTabChange('x402')}
          className={`btn btn-sm ${currentTab === 'x402' ? 'btn-amber' : 'btn-secondary'}`}
          style={{ gap: '6px' }}
        >
          <Zap size={14} />
          <span>x402 AlgoKit</span>
        </button>
      </nav>

      {/* Telemetry Status & User Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Live Backend Connection Indicator */}
        <div
          className={`badge ${isBackendOnline ? 'badge-emerald' : isBackendOnline === false ? 'badge-copper' : 'badge-neutral'}`}
          style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }}
          title={isBackendOnline ? 'FastAPI & Planetary Computer Connected' : 'Connecting to live Backend...'}
        >
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: isBackendOnline ? 'var(--emerald-500)' : isBackendOnline === false ? '#ef4444' : '#f59e0b',
              boxShadow: isBackendOnline ? '0 0 6px var(--emerald-500)' : 'none'
            }}
          />
          <span>{isBackendOnline ? 'Backend Live' : isBackendOnline === false ? 'API Offline' : 'Syncing...'}</span>
        </div>

        {/* User Account / Role Badge */}
        {currentUser && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 8px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              fontSize: '11px',
              color: 'var(--text-secondary)'
            }}
          >
            <User size={13} style={{ color: 'var(--emerald-500)' }} />
            <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentUser.email.split('@')[0]}
            </span>
          </div>
        )}

        {/* Logout Button */}
        {currentUser && (
          <button
            onClick={handleLogout}
            className="btn btn-secondary btn-sm"
            style={{ padding: '6px 8px' }}
            title="Sign out of session"
          >
            <LogOut size={13} />
          </button>
        )}

        <ThemeToggle />
      </div>
    </header>
  );
};
