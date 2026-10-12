import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import { ApiService } from '../../services/api';
import {
  Globe,
  Map,
  BarChart3,
  AlertTriangle,
  Eye,
  ShieldCheck,
  Zap,
  FolderKanban,
  User,
  LogOut,
  Bell,
  Menu,
  X
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
  const [showMobileMenu, setShowMobileMenu] = useState(false);

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

  // Simplified navigation - grouped by purpose with clear Hindi-English labels
  const navItems = [
    { id: 'map', label: 'Map', icon: <Map size={16} />, tooltip: 'Select area & run analysis' },
    { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 size={16} />, tooltip: 'View stats & analytics' },
    { id: 'swipe', label: 'Compare', icon: <Eye size={16} />, tooltip: 'Before & After comparison' },
    { id: 'alerts', label: 'Alerts', icon: <Bell size={16} />, tooltip: 'View all alerts', badge: pendingAlertsCount > 0 ? pendingAlertsCount : undefined },
    { id: 'review', label: 'Verify', icon: <ShieldCheck size={16} />, tooltip: 'Verify detected changes' },
    { id: 'projects', label: 'Projects', icon: <FolderKanban size={16} />, tooltip: 'Manage monitored areas' },
  ];

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        height: '56px',
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        boxShadow: '0 1px 3px rgba(60,64,67,0.06)',
      }}
    >
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '180px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #1a73e8 0%, #1558d6 100%)',
            color: '#fff',
            boxShadow: '0 2px 8px rgba(26,115,232,0.25)'
          }}
        >
          <Globe size={18} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>
              Kshitiraksha
            </span>
          </div>
          <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: 0, lineHeight: 1 }}>
            Satellite Change Detection
          </p>
        </div>
      </div>

      {/* Navigation - Clean pill tabs */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        background: 'var(--bg-elevated)',
        borderRadius: '12px',
        padding: '3px',
        border: '1px solid var(--border-subtle)'
      }}>
        {navItems.map(item => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onTabChange(item.id);
                setShowMobileMenu(false);
              }}
              title={item.tooltip}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                fontSize: '13px',
                fontWeight: isActive ? 600 : 500,
                border: 'none',
                borderRadius: '9px',
                cursor: 'pointer',
                transition: 'all 200ms ease',
                background: isActive ? 'var(--bg-surface)' : 'transparent',
                color: isActive ? 'var(--primary-500)' : 'var(--text-secondary)',
                boxShadow: isActive ? '0 1px 3px rgba(60,64,67,0.12)' : 'none',
                position: 'relative',
                fontFamily: 'var(--font-sans)',
                whiteSpace: 'nowrap'
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
                    borderRadius: '100px',
                    backgroundColor: '#d93025',
                    color: '#ffffff',
                    minWidth: '18px',
                    textAlign: 'center',
                    lineHeight: '16px'
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* x402 button separate - less prominent */}
        <button
          onClick={() => onTabChange('x402')}
          title="Blockchain payments"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '7px 10px',
            fontSize: '12px',
            fontWeight: 500,
            border: 'none',
            borderRadius: '9px',
            cursor: 'pointer',
            background: currentTab === 'x402' ? 'rgba(245,158,11,0.12)' : 'transparent',
            color: currentTab === 'x402' ? '#f59e0b' : 'var(--text-muted)',
            transition: 'all 200ms ease',
            fontFamily: 'var(--font-sans)',
          }}
        >
          <Zap size={14} />
        </button>
      </nav>

      {/* Right side - Status & User */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '180px', justifyContent: 'flex-end' }}>
        {/* Backend Status */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '100px',
            backgroundColor: isBackendOnline ? 'var(--emerald-bg)' : 'var(--bg-elevated)',
            border: `1px solid ${isBackendOnline ? 'rgba(30,142,62,0.2)' : 'var(--border-subtle)'}`,
            fontSize: '11px',
            fontWeight: 600,
            color: isBackendOnline ? 'var(--emerald-600)' : 'var(--text-muted)'
          }}
          title={isBackendOnline ? 'Backend server connected' : 'Connecting to server...'}
        >
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: isBackendOnline ? '#1e8e3e' : isBackendOnline === false ? '#d93025' : '#f9ab00',
              boxShadow: isBackendOnline ? '0 0 6px #1e8e3e' : 'none'
            }}
          />
          <span>{isBackendOnline ? 'Live' : isBackendOnline === false ? 'Offline' : '...'}</span>
        </div>

        {/* User */}
        {currentUser && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '100px',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              fontSize: '12px',
              color: 'var(--text-primary)',
              fontWeight: 600
            }}
            title={currentUser.email}
          >
            <User size={13} style={{ color: 'var(--primary-500)' }} />
            <span style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentUser.full_name || currentUser.email.split('@')[0]}
            </span>
          </div>
        )}

        {/* Logout */}
        {currentUser && (
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-surface)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 150ms ease'
            }}
            title="Log out"
          >
            <LogOut size={14} />
          </button>
        )}

        <ThemeToggle />
      </div>
    </header>
  );
};
