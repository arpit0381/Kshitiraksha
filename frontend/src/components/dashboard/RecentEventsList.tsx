import React from 'react';
import { ChangeEvent } from '../../types';
import { Calendar, ArrowRight, Eye, ShieldCheck, AlertCircle } from 'lucide-react';

interface RecentEventsListProps {
  events: ChangeEvent[];
  onSelectEvent: (event: ChangeEvent) => void;
  onOpenSwipe: (event: ChangeEvent) => void;
}

export const RecentEventsList: React.FC<RecentEventsListProps> = ({
  events,
  onSelectEvent,
  onOpenSwipe
}) => {
  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'VEGETATION_LOSS':
        return <span className="badge badge-amber">Vegetation Loss</span>;
      case 'WATER_EXPANSION':
        return <span className="badge badge-teal">Water Expansion</span>;
      case 'WATER_SHRINKAGE':
        return <span className="badge badge-copper">Water Shrinkage</span>;
      default:
        return <span className="badge badge-neutral">{category.replace('_', ' ')}</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span className="badge badge-emerald">
            <ShieldCheck size={12} /> Verified
          </span>
        );
      case 'FALSE_POSITIVE':
        return <span className="badge badge-neutral">False Positive</span>;
      case 'NEEDS_REVIEW':
        return (
          <span className="badge badge-copper">
            <AlertCircle size={12} /> Needs Audit
          </span>
        );
      default:
        return (
          <span className="badge badge-amber">
            <AlertCircle size={12} /> Pending Review
          </span>
        );
    }
  };

  return (
    <div className="card" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Recent Geospatial Anomaly Events
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Detected by multi-temporal Sentinel-2 MSI index differencing & morphological filtering
          </p>
        </div>
        <span className="badge badge-neutral font-mono">
          {events.length} Active Events
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {events.map(event => (
          <div
            key={event.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              gap: '16px',
              transition: 'border-color var(--transition-fast)'
            }}
          >
            {/* Left Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {getCategoryBadge(event.category)}
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {event.title}
                </span>
                {getStatusBadge(event.review_status)}
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {event.aoi_name}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={13} />
                  {event.baseline_date} → {event.recent_date}
                </span>
                <span className="font-mono" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                  {event.affected_area_hectares.toFixed(1)} ha
                </span>
                <span className="font-mono">
                  Confidence: {Math.round(event.confidence.overall_detection_confidence * 100)}%
                </span>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <button
                onClick={() => onOpenSwipe(event)}
                className="btn btn-secondary btn-sm"
                title="Open Swipe Comparison"
              >
                <Eye size={14} />
                <span>Swipe View</span>
              </button>

              <button
                onClick={() => onSelectEvent(event)}
                className="btn btn-primary btn-sm"
                title="Review & Verify Event"
              >
                <span>Verify Event</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
