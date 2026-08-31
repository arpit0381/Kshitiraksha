import React from 'react';
import { ChangeEvent, ChangeCategory } from '../../types';

interface CategoryBreakdownProps {
  events: ChangeEvent[];
}

export const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({ events }) => {
  const categories: { key: ChangeCategory; label: string; color: string }[] = [
    { key: 'VEGETATION_LOSS', label: 'Vegetation Loss', color: 'var(--amber-500)' },
    { key: 'WATER_EXPANSION', label: 'Water Expansion', color: 'var(--teal-500)' },
    { key: 'WATER_SHRINKAGE', label: 'Water Shrinkage', color: 'var(--copper-500)' },
    { key: 'BARE_SOIL_EXPANSION', label: 'Bare Soil / Mining', color: 'var(--emerald-600)' }
  ];

  const totalArea = events.reduce((acc, e) => acc + e.affected_area_hectares, 0) || 1;

  return (
    <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Disturbance Classification Distribution
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Aggregated surface footprint across active observation sweeps
          </p>
        </div>
        <span className="badge badge-neutral font-mono">
          Total: {totalArea.toFixed(1)} ha
        </span>
      </div>

      {/* Stacked Proportional Bar */}
      <div
        style={{
          display: 'flex',
          height: '14px',
          borderRadius: 'var(--radius-full)',
          overflow: 'hidden',
          backgroundColor: 'var(--bg-elevated)',
          marginBottom: '16px',
          border: '1px solid var(--border-subtle)'
        }}
      >
        {categories.map(c => {
          const catArea = events
            .filter(e => e.category === c.key)
            .reduce((acc, e) => acc + e.affected_area_hectares, 0);
          const pct = (catArea / totalArea) * 100;
          if (pct === 0) return null;
          return (
            <div
              key={c.key}
              style={{
                width: `${pct}%`,
                backgroundColor: c.color,
                transition: 'width 300ms ease'
              }}
              title={`${c.label}: ${catArea.toFixed(1)} ha (${pct.toFixed(1)}%)`}
            />
          );
        })}
      </div>

      {/* Legend Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
        {categories.map(c => {
          const catEvents = events.filter(e => e.category === c.key);
          const catArea = catEvents.reduce((acc, e) => acc + e.affected_area_hectares, 0);
          const pct = ((catArea / totalArea) * 100).toFixed(1);

          return (
            <div
              key={c.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: c.color,
                  flexShrink: 0
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {c.label}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }} className="font-mono">
                  {catArea.toFixed(1)} ha ({pct}%)
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
