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
  MapPin,
  Sparkles
} from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  pendingAlertsCount: number;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, onTabChange, pendingAlertsCount }) => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<{ email: string; full_name?: string; organization?: string } | null>(null);
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

  const navItems = [
    { id: 'map', label: 'Map Explorer', icon: <Layers size={15} /> },
    { id: 'dashboard', label: 'Analytics', icon: <Radio size={15} /> },
    { id: 'swipe', label: 'Comparison', icon: <Eye size={15} /> },
    {
      id: 'review',
      label: 'Verification',
      icon: <ShieldCheck size={15} />,
      badge: pendingAlertsCount > 0 ? pendingAlertsCount : undefined
    },
    { id: 'projects', label: 'Projects', icon: <FolderKanban size={15} /> },
    { id: 'alerts', label: 'Alerts', icon: <Bell size={15} /> },
    { id: 'x402', label: 'x402 Micropayments', icon: <Zap size={15} /> }
  ];

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 20px',
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        boxShadow: '0 1px 3px rgba(60,64,67,0.08)',
        flexWrap: 'wrap',
        gap: '12px'
      }}
    >
      {/* Brand & Platform Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--primary-bg)',
            color: 'var(--primary-500)',
            boxShadow: '0 1px 3px rgba(26,115,232,0.2)'
          }}
        >
          <Globe size={20} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              Kshitiraksha
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--emerald-bg)',
                color: 'var(--emerald-600)',
                border: '1px solid rgba(30,142,62,0.2)'
              }}
            >
              Earth Sentinel
            </span>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>
            Automated Satellite Change Detection & Verification
          </p>
        </div>
      </div>

      {/* Material Navigation Pills */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        {navItems.map(item => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={isActive ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
              style={{
                borderRadius: 'var(--radius-full)',
                fontWeight: isActive ? 600 : 500,
                position: 'relative'
              }}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.badge !== undefined && (
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: isActive ? '#ffffff' : 'var(--amber-500)',
                    color: isActive ? 'var(--primary-500)' : '#ffffff',
                    marginLeft: '4px'
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User & Telemetry Status Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Backend Online Status Pill */}
        <div
          className={`badge ${isBackendOnline ? 'badge-emerald' : isBackendOnline === false ? 'badge-copper' : 'badge-neutral'}`}
          style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px' }}
          title={isBackendOnline ? 'FastAPI Backend & Satellite Provider Live' : 'Connecting to Live Backend API...'}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isBackendOnline ? 'var(--emerald-500)' : isBackendOnline === false ? '#d93025' : '#f9ab00',
              boxShadow: isBackendOnline ? '0 0 6px var(--emerald-500)' : 'none'
            }}
          />
          <span>{isBackendOnline ? 'Live Connected' : isBackendOnline === false ? 'API Offline' : 'Connecting...'}</span>
        </div>

        {/* User Account Badge */}
        {currentUser && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              fontSize: '12px',
              color: 'var(--text-secondary)'
            }}
            title={currentUser.email}
          >
            <User size={13} style={{ color: 'var(--primary-500)' }} />
            <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600, color: 'var(--text-primary)' }}>
              {currentUser.full_name || currentUser.email.split('@')[0]}
            </span>
          </div>
        )}

        {/* Logout Button */}
        {currentUser && (
          <button
            onClick={handleLogout}
            className="btn btn-secondary btn-sm"
            style={{ padding: '6px 10px', borderRadius: 'var(--radius-full)' }}
            title="Sign out"
          >
            <LogOut size={13} />
          </button>
        )}

        <ThemeToggle />
      </div>
    </header>
  );
};
