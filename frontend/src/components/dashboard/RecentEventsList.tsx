import React, { useState } from 'react';
import { ChangeEvent, ChangeCategory, ReviewStatus } from '../../types';
import { Calendar, ArrowRight, Eye, ShieldCheck, AlertCircle, Search, Filter, Download, FileText } from 'lucide-react';

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
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

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

  const filteredEvents = events.filter(e => {
    const matchesSearch =
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.aoi_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || e.category === selectedCategory;
    const matchesStatus = selectedStatus === 'ALL' || e.review_status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="card" style={{ padding: '24px' }}>
      {/* Top Header & Search Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Detected Geospatial Anomaly Events
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Multi-temporal Sentinel-2 MSI index differencing & morphological contour polygons
          </p>
        </div>

        {/* Search & Category Filter Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Search Input */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '6px 10px'
            }}
          >
            <Search size={14} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search AOI, title..."
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-primary)',
                fontSize: '12px',
                width: '140px'
              }}
            />
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            style={{
              padding: '6px 10px',
              fontSize: '12px',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              outline: 'none'
            }}
          >
            <option value="ALL">All Categories</option>
            <option value="VEGETATION_LOSS">Vegetation Loss</option>
            <option value="WATER_EXPANSION">Water Expansion</option>
            <option value="WATER_SHRINKAGE">Water Shrinkage</option>
          </select>

          {/* Status Dropdown */}
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            style={{
              padding: '6px 10px',
              fontSize: '12px',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              outline: 'none'
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending Review</option>
            <option value="VERIFIED">Verified</option>
            <option value="NEEDS_REVIEW">Needs Audit</option>
            <option value="FALSE_POSITIVE">False Positive</option>
          </select>
        </div>
      </div>

      {/* Events List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredEvents.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            No anomaly events found matching the active filters.
          </div>
        ) : (
          filteredEvents.map(event => (
            <div
              key={event.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 18px',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                gap: '16px',
                transition: 'border-color var(--transition-fast)',
                flexWrap: 'wrap'
              }}
            >
              {/* Left Info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: '260px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {getCategoryBadge(event.category)}
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {event.title}
                  </span>
                  {getStatusBadge(event.review_status)}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                    📍 {event.aoi_name}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={13} />
                    {event.baseline_date} → {event.recent_date}
                  </span>
                  <span className="font-mono" style={{ color: 'var(--amber-500)', fontWeight: 600 }}>
                    Footprint: {event.affected_area_hectares.toFixed(1)} ha
                  </span>
                  <span className="font-mono">
                    AI Confidence: {Math.round(event.confidence.overall_detection_confidence * 100)}%
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <button
                  onClick={() => onOpenSwipe(event)}
                  className="btn btn-secondary btn-sm"
                  title="Open Swipe Comparison"
                  style={{ gap: '6px' }}
                >
                  <Eye size={14} />
                  <span>Swipe Studio</span>
                </button>

                <button
                  onClick={() => onSelectEvent(event)}
                  className="btn btn-primary btn-sm"
                  title="Review & Verify Event"
                  style={{ gap: '6px' }}
                >
                  <span>Verify & Export</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
