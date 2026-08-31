import React from 'react';
import { ThemeToggle } from './ThemeToggle';
import { Globe, Layers, Eye, ShieldCheck, Zap, Radio } from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  pendingAlertsCount: number;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, onTabChange, pendingAlertsCount }) => {
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
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      {/* Brand & Subtitle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
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
              GeoWatch Earth
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
      <nav style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button
          onClick={() => onTabChange('dashboard')}
          className={`btn btn-sm ${currentTab === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ gap: '6px' }}
        >
          <Radio size={14} />
          <span>Dashboard</span>
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
          <span>Swipe Studio</span>
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
          onClick={() => onTabChange('x402')}
          className={`btn btn-sm ${currentTab === 'x402' ? 'btn-amber' : 'btn-secondary'}`}
          style={{ gap: '6px' }}
        >
          <Zap size={14} />
          <span>x402 AlgoKit</span>
        </button>
      </nav>

      {/* Telemetry Status & Theme */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          className="badge badge-emerald"
          style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: 'var(--emerald-500)',
              boxShadow: '0 0 6px var(--emerald-500)'
            }}
          />
          Sentinel-2 L2A (10m)
        </div>

        <ThemeToggle />
      </div>
    </header>
  );
};
