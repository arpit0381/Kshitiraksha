import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { ChangeEvent, ReviewStatus } from '../../types';
import { ReportGeneratorModal } from '../reports/ReportGeneratorModal';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Download,
  FileText,
  Calendar,
  MapPin,
  Share2,
  Printer,
  Send,
  Eye,
  ChevronDown
} from 'lucide-react';

interface EventMiniMapProps {
  geometry: any;
  showOverlay?: boolean;
  color?: string;
  badge: React.ReactNode;
}

const EventMiniMap: React.FC<EventMiniMapProps> = ({ geometry, showOverlay = false, color = '#d97706', badge }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: false,
      dragging: true
    });

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 18
    }).addTo(map);

    try {
      const geoLayer = L.geoJSON(geometry as any, {
        style: {
          color: showOverlay ? color : 'transparent',
          weight: showOverlay ? 2.5 : 0,
          fillColor: showOverlay ? color : 'transparent',
          fillOpacity: showOverlay ? 0.35 : 0
        }
      }).addTo(map);

      const bounds = geoLayer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [20, 20], maxZoom: 15 });
      } else {
        map.setView([22.825, 82.685], 13);
      }
    } catch {
      map.setView([22.825, 82.685], 13);
    }

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [geometry, showOverlay, color]);

  return (
    <div style={{ height: '240px', width: '100%', position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      <div
        style={{
          position: 'absolute',
          bottom: '10px',
          left: '10px',
          backgroundColor: 'rgba(15, 18, 22, 0.85)',
          padding: '4px 10px',
          borderRadius: 'var(--radius-sm)',
          fontSize: '11px',
          color: '#fff',
          fontFamily: 'var(--font-mono)',
          zIndex: 1000,
          pointerEvents: 'none'
        }}
      >
        {badge}
      </div>
    </div>
  );
};

interface EventReviewStudioProps {
  event: ChangeEvent;
  events?: ChangeEvent[];
  onSelectEvent?: (event: ChangeEvent) => void;
  onUpdateStatus: (eventId: string, status: ReviewStatus, notes?: string) => Promise<void>;
  onOpenSwipe: (event: ChangeEvent) => void;
}

export const EventReviewStudio: React.FC<EventReviewStudioProps> = ({
  event,
  events,
  onSelectEvent,
  onUpdateStatus,
  onOpenSwipe
}) => {
  const [notes, setNotes] = useState<string>(event.review_notes || '');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);

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

  const quickNotes = [
    'Confirmed with Divisional Forest patrol report.',
    'Monsoon cloud-shadow artifact flagged for dismissal.',
    'Suspected illegal sand / gravel mining expansion.',
    'Urgent ground inspection recommended.'
  ];

  const baselineIndexVal = event.category === 'WATER_EXPANSION' ? -0.38 : 0.72;
  const recentIndexVal = baselineIndexVal + event.average_delta_index;
  const indexLabel = event.category === 'WATER_EXPANSION' || event.category === 'WATER_SHRINKAGE' ? 'NDWI' : 'NDVI';

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Event Header Banner */}
      <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
            {/* Event Selector Dropdown if multiple exist */}
            {events && events.length > 0 && onSelectEvent ? (
              <select
                value={event.id}
                onChange={e => {
                  const found = events.find(ev => ev.id === e.target.value);
                  if (found) {
                    onSelectEvent(found);
                    setNotes(found.review_notes || '');
                  }
                }}
                style={{
                  padding: '6px 12px',
                  fontSize: '14px',
                  fontWeight: 700,
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: 'var(--radius-md)',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {events.map(ev => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title} ({ev.aoi_name})
                  </option>
                ))}
              </select>
            ) : (
              <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {event.title}
              </h1>
            )}

            <span className="badge badge-amber">{event.category.replace('_', ' ')}</span>
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

        {/* Export & Studio Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={() => onOpenSwipe(event)} className="btn btn-secondary btn-sm" style={{ gap: '6px' }}>
            <Eye size={14} />
            <span>Swipe Studio</span>
          </button>

          <button onClick={() => setShowReportModal(true)} className="btn btn-amber btn-sm" style={{ gap: '6px' }}>
            <FileText size={14} />
            <span>Generate Dossier PDF</span>
          </button>

          <button onClick={handleExportGeoJson} className="btn btn-primary btn-sm" style={{ gap: '6px' }}>
            <Download size={14} />
            <span>Export GeoJSON</span>
          </button>
        </div>
      </div>

      {/* 3-Panel Visual Evidence Display */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {/* Panel 1: Baseline */}
        <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700 }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--emerald-500)' }} />
              <span>1. Baseline Observation</span>
            </div>
            <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Sentinel-2B MSI L2A
            </span>
          </div>

          <EventMiniMap
            geometry={event.geojson_geometry}
            showOverlay={false}
            badge={<>Date: {event.baseline_date} • Clarity: {Math.round(event.confidence.image_quality_score * 100)}%</>}
          />
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Baseline terrain reflectance. Baseline {indexLabel}: <b>{baselineIndexVal > 0 ? `+${baselineIndexVal.toFixed(2)}` : baselineIndexVal.toFixed(2)}</b>
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
              Sentinel-2A MSI L2A
            </span>
          </div>

          <EventMiniMap
            geometry={event.geojson_geometry}
            showOverlay={false}
            badge={<>Date: {event.recent_date} • Persistence: {Math.round(event.confidence.persistence_score * 100)}%</>}
          />
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Recent optical sweep. Observed {indexLabel}: <b>{recentIndexVal > 0 ? `+${recentIndexVal.toFixed(2)}` : recentIndexVal.toFixed(2)}</b>
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

          <EventMiniMap
            geometry={event.geojson_geometry}
            showOverlay={true}
            color={event.category === 'WATER_EXPANSION' ? '#0d9488' : '#d97706'}
            badge={<>Δ{indexLabel}: {event.average_delta_index > 0 ? `+${event.average_delta_index.toFixed(2)}` : event.average_delta_index.toFixed(2)} • {event.affected_area_hectares.toFixed(1)} ha</>}
          />
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Vectorized after OpenCV morphological contouring and minimum area threshold filter.
          </div>
        </div>
      </div>

      {/* Confidence Breakdown & Auditor Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '16px' }}>
        {/* Left: Explainable Confidence */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Explainable AI Confidence Engine
            </h3>
            <span className="badge badge-emerald font-mono">
              Overall: {Math.round(event.confidence.overall_detection_confidence * 100)}%
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Magnitude */}
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

            {/* Persistence */}
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

          {/* Quick Note Tags */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Quick Comment Presets:</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {quickNotes.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => setNotes(q)}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '10px', padding: '2px 6px' }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Notes */}
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

      {/* Executive Report Modal */}
      {showReportModal && (
        <ReportGeneratorModal
          event={event}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
};
