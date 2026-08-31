import React, { useState } from 'react';
import { ChangeEvent, ReviewStatus } from '../../types';
import { ShieldCheck, AlertTriangle, CheckCircle, XCircle, Download, FileText, Calendar, MapPin, Share2 } from 'lucide-react';

interface EventReviewStudioProps {
  event: ChangeEvent;
  onUpdateStatus: (eventId: string, status: ReviewStatus, notes?: string) => Promise<void>;
  onOpenSwipe: (event: ChangeEvent) => void;
}

export const EventReviewStudio: React.FC<EventReviewStudioProps> = ({
  event,
  onUpdateStatus,
  onOpenSwipe
}) => {
  const [notes, setNotes] = useState<string>(event.review_notes || '');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const handleStatusChange = async (status: ReviewStatus) => {
    setIsSaving(true);
    await onUpdateStatus(event.id, status, notes);
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleExportGeoJson = () => {
    const geojsonData = {
      type: 'FeatureCollection',
      properties: {
        eventId: event.id,
        aoiName: event.aoi_name,
        category: event.category,
        affectedAreaHectares: event.affected_area_hectares,
        baselineDate: event.baseline_date,
        recentDate: event.recent_date,
        confidence: event.confidence.overall_detection_confidence,
        reviewStatus: event.review_status,
        exportedAt: new Date().toISOString()
      },
      features: [
        {
          type: 'Feature',
          geometry: event.geojson_geometry,
          properties: {
            title: event.title,
            deltaIndex: event.average_delta_index
          }
        }
      ]
    };

    const blob = new Blob([JSON.stringify(geojsonData, null, 2)], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.id}_change_polygon.geojson`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Event Header Banner */}
      <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span className="badge badge-amber">{event.category.replace('_', ' ')}</span>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {event.title}
            </h1>
            <span
              className={`badge ${
                event.review_status === 'VERIFIED'
                  ? 'badge-emerald'
                  : event.review_status === 'FALSE_POSITIVE'
                  ? 'badge-neutral'
                  : 'badge-copper'
              }`}
            >
              {event.review_status}
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '850px' }}>
            {event.description}
          </p>
        </div>

        {/* Export & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={() => onOpenSwipe(event)} className="btn btn-secondary">
            <span>Open in Swipe Studio</span>
          </button>

          <button onClick={handleExportGeoJson} className="btn btn-primary" style={{ gap: '6px' }}>
            <Download size={15} />
            <span>Export GeoJSON</span>
          </button>
        </div>
      </div>

      {/* 3-Panel Visual Evidence Display (Baseline <-> Recent <-> Change Mask) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {/* Panel 1: Baseline */}
        <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700 }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--emerald-500)' }} />
              <span>1. Baseline Observation</span>
            </div>
            <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Sentinel-2B MSI
            </span>
          </div>

          <div
            style={{
              height: '240px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              backgroundImage: 'radial-gradient(circle at 50% 50%, #1e3a1e 10%, #182c18 50%, #122012 90%)',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.6 }}>
              <circle cx="50%" cy="50%" r="80" fill="#254425" />
            </svg>
            <div
              style={{
                position: 'absolute',
                bottom: '10px',
                left: '10px',
                backgroundColor: 'rgba(15, 18, 22, 0.8)',
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '11px',
                color: '#fff',
                fontFamily: 'var(--font-mono)'
              }}
            >
              Date: {event.baseline_date} • Cloud: 1.8%
            </div>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Dense undisturbed canopy. Baseline NDVI index: <b>+0.74</b>
          </div>
        </div>

        {/* Panel 2: Recent */}
        <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700 }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--amber-500)' }} />
              <span>2. Recent Observation</span>
            </div>
            <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Sentinel-2A MSI
            </span>
          </div>

          <div
            style={{
              height: '240px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              backgroundImage: 'radial-gradient(circle at 50% 50%, #4a3b2c 10%, #263321 50%, #182216 90%)',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.85 }}>
              <path d="M 120 70 Q 180 50 240 90 T 260 160 Q 210 200 150 180 T 110 130 Z" fill="#786149" />
            </svg>
            <div
              style={{
                position: 'absolute',
                bottom: '10px',
                left: '10px',
                backgroundColor: 'rgba(15, 18, 22, 0.8)',
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '11px',
                color: '#fff',
                fontFamily: 'var(--font-mono)'
              }}
            >
              Date: {event.recent_date} • Cloud: 3.2%
            </div>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Exposed excavation terrain. Degraded NDVI index: <b>+0.21</b>
          </div>
        </div>

        {/* Panel 3: Change Mask Overlay */}
        <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700 }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--copper-500)' }} />
              <span>3. Filtered Vector Polygon</span>
            </div>
            <span className="font-mono" style={{ fontSize: '11px', color: 'var(--amber-500)' }}>
              {event.affected_area_hectares.toFixed(1)} ha
            </span>
          </div>

          <div
            style={{
              height: '240px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              backgroundColor: '#0c0f14',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
              <path
                d="M 120 70 Q 180 50 240 90 T 260 160 Q 210 200 150 180 T 110 130 Z"
                fill="rgba(245, 158, 11, 0.25)"
                stroke="var(--amber-500)"
                strokeWidth="2.5"
                strokeDasharray="6, 4"
              />
            </svg>
            <div
              style={{
                position: 'absolute',
                bottom: '10px',
                left: '10px',
                backgroundColor: 'rgba(15, 18, 22, 0.8)',
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '11px',
                color: 'var(--amber-500)',
                fontFamily: 'var(--font-mono)'
              }}
            >
              ΔNDVI: {event.average_delta_index} • Contours: 1
            </div>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Vectorized after OpenCV morphological closing and 15-pixel area filter.
          </div>
        </div>
      </div>

      {/* Explainable Confidence Radar & Audit Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '16px' }}>
        {/* Left: 4-Factor Confidence Breakdown */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Explainable Confidence Engine
            </h3>
            <span className="badge badge-emerald font-mono">
              Overall: {Math.round(event.confidence.overall_detection_confidence * 100)}%
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Magnitude Score */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Spectral Magnitude Shift</span>
                <span className="font-mono" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {Math.round(event.confidence.magnitude_score * 100)}%
                </span>
              </div>
              <div style={{ height: '6px', backgroundColor: 'var(--bg-elevated)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                <div style={{ width: `${event.confidence.magnitude_score * 100}%`, height: '100%', backgroundColor: 'var(--amber-500)' }} />
              </div>
            </div>

            {/* Spatial Consistency */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Spatial Clustering & Contiguity</span>
                <span className="font-mono" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {Math.round(event.confidence.spatial_consistency_score * 100)}%
                </span>
              </div>
              <div style={{ height: '6px', backgroundColor: 'var(--bg-elevated)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                <div style={{ width: `${event.confidence.spatial_consistency_score * 100}%`, height: '100%', backgroundColor: 'var(--emerald-500)' }} />
              </div>
            </div>

            {/* Image Quality */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Image Clarity & Cloud Masking</span>
                <span className="font-mono" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {Math.round(event.confidence.image_quality_score * 100)}%
                </span>
              </div>
              <div style={{ height: '6px', backgroundColor: 'var(--bg-elevated)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                <div style={{ width: `${event.confidence.image_quality_score * 100}%`, height: '100%', backgroundColor: 'var(--teal-500)' }} />
              </div>
            </div>

            {/* Temporal Persistence */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Temporal Persistence Score</span>
                <span className="font-mono" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {Math.round(event.confidence.persistence_score * 100)}%
                </span>
              </div>
              <div style={{ height: '6px', backgroundColor: 'var(--bg-elevated)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                <div style={{ width: `${event.confidence.persistence_score * 100}%`, height: '100%', backgroundColor: 'var(--copper-500)' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Human Verification Controls */}
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Human Verification & Audit Log
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Auditors can confirm physical changes or flag false detections to retrain thresholds
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => handleStatusChange('VERIFIED')}
              disabled={isSaving}
              className={`btn btn-sm ${event.review_status === 'VERIFIED' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1 }}
            >
              <CheckCircle size={14} />
              <span>Mark Verified</span>
            </button>

            <button
              onClick={() => handleStatusChange('FALSE_POSITIVE')}
              disabled={isSaving}
              className={`btn btn-sm ${event.review_status === 'FALSE_POSITIVE' ? 'btn-amber' : 'btn-secondary'}`}
              style={{ flex: 1 }}
            >
              <XCircle size={14} />
              <span>False Positive</span>
            </button>

            <button
              onClick={() => handleStatusChange('NEEDS_REVIEW')}
              disabled={isSaving}
              className={`btn btn-sm ${event.review_status === 'NEEDS_REVIEW' ? 'btn-amber' : 'btn-secondary'}`}
              style={{ flex: 1 }}
            >
              <AlertTriangle size={14} />
              <span>Field Audit Req</span>
            </button>
          </div>

          {/* Review Notes Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Auditor Comments & Inspection Notes:
            </span>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Confirmed with divisional forest department patrol logs..."
              style={{
                padding: '10px',
                fontSize: '13px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
                outline: 'none',
                fontFamily: 'var(--font-sans)',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {saveSuccess && (
              <span style={{ fontSize: '12px', color: 'var(--emerald-500)', fontWeight: 600 }}>
                ✓ Verification status updated & logged!
              </span>
            )}
            <button
              onClick={() => handleStatusChange(event.review_status)}
              disabled={isSaving}
              className="btn btn-secondary btn-sm"
              style={{ marginLeft: 'auto' }}
            >
              <FileText size={13} />
              <span>Save Notes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
