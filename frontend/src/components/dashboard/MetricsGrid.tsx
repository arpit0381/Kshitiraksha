import React from 'react';
import { AOI, ChangeEvent } from '../../types';
import { Layers, AlertTriangle, ShieldCheck, Activity, MapPin } from 'lucide-react';

interface MetricsGridProps {
  aois: AOI[];
  events: ChangeEvent[];
}

export const MetricsGrid: React.FC<MetricsGridProps> = ({ aois, events }) => {
  const totalMonitoredHectares = aois.reduce((acc, a) => acc + a.area_hectares, 0);
  const totalAffectedHectares = events.reduce((acc, e) => acc + e.affected_area_hectares, 0);
  const verifiedCount = events.filter(e => e.review_status === 'VERIFIED').length;
  const pendingCount = events.filter(e => e.review_status === 'PENDING').length;
  
  const avgConfidence = events.length > 0
    ? Math.round((events.reduce((acc, e) => acc + e.confidence.overall_detection_confidence, 0) / events.length) * 100)
    : 92;

  const metrics = [
    {
      label: 'Monitored Territory',
      value: `${Math.round(totalMonitoredHectares).toLocaleString()} ha`,
      sub: `${(totalMonitoredHectares / 100).toFixed(1)} km² total watch area`,
      icon: <Layers size={20} style={{ color: 'var(--emerald-500)' }} />,
      accent: 'emerald'
    },
    {
      label: 'Active AOIs',
      value: aois.length.toString(),
      sub: 'Multi-temporal sentinel passes',
      icon: <MapPin size={20} style={{ color: 'var(--emerald-500)' }} />,
      accent: 'emerald'
    },
    {
      label: 'Detected Anomaly Area',
      value: `${totalAffectedHectares.toFixed(1)} ha`,
      sub: `${events.length} physical change clusters`,
      icon: <AlertTriangle size={20} style={{ color: 'var(--amber-500)' }} />,
      accent: 'amber'
    },
    {
      label: 'Human Verified Evidence',
      value: `${verifiedCount} / ${events.length}`,
      sub: `${pendingCount} pending field review`,
      icon: <ShieldCheck size={20} style={{ color: 'var(--copper-500)' }} />,
      accent: 'copper'
    },
    {
      label: 'Mean Detection Confidence',
      value: `${avgConfidence}%`,
      sub: '4-Factor composite scoring',
      icon: <Activity size={20} style={{ color: 'var(--teal-500)' }} />,
      accent: 'teal'
    }
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}
    >
      {metrics.map((m, idx) => (
        <div
          key={idx}
          className="card"
          style={{
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Subtle top indicator bar */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              backgroundColor: `var(--${m.accent}-500)`
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {m.label}
            </span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: `var(--${m.accent}-bg)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {m.icon}
            </div>
          </div>
          <div>
            <div
              className="font-mono"
              style={{
                fontSize: '24px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.03em'
              }}
            >
              {m.value}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {m.sub}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
