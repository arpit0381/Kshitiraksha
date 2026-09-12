import React, { useState, useRef } from 'react';
import { ChangeEvent, SpectralBandMode, ComparisonMode } from '../../types';
import {
  Sliders,
  Eye,
  Layers,
  Calendar,
  Download,
  Columns,
  SplitSquareVertical,
  Activity,
  Maximize2,
  Sparkles,
  ArrowLeft,
  ChevronDown
} from 'lucide-react';

interface SwipeComparisonProps {
  event: ChangeEvent;
  events?: ChangeEvent[];
  onSelectEvent?: (event: ChangeEvent) => void;
  onBackToMap?: () => void;
  onNavigateToReview?: (event: ChangeEvent) => void;
}

export const SwipeComparison: React.FC<SwipeComparisonProps> = ({
  event,
  events,
  onSelectEvent,
  onBackToMap,
  onNavigateToReview
}) => {
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>('SWIPE');
  const [sliderPos, setSliderPos] = useState<number>(50); // percentage (0 to 100)
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [spectralMode, setSpectralMode] = useState<SpectralBandMode>('TRUE_COLOR');
  const [showOverlay, setShowOverlay] = useState<boolean>(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Inspector readout under cursor
  const [inspectorData, setInspectorData] = useState({
    baselineIndex: 0.74,
    recentIndex: 0.22,
    delta: -0.52,
    gsd: '10.0m Sentinel-2 L2A',
    surfaceType: 'Deforested Clearance Scar'
  });

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const pct = (x / rect.width) * 100;

    if (isDragging) {
      setSliderPos(pct);
    }

    const isDisturbedZone = pct > 35 && pct < 75;
    if (spectralMode === 'NDWI') {
      setInspectorData({
        baselineIndex: isDisturbedZone ? -0.35 : -0.42,
        recentIndex: isDisturbedZone ? 0.48 : -0.38,
        delta: isDisturbedZone ? 0.83 : 0.04,
        gsd: '10.0m Sentinel-2 MSI',
        surfaceType: isDisturbedZone ? 'Inundated Water Surface' : 'Dry Marshland'
      });
    } else {
      setInspectorData({
        baselineIndex: isDisturbedZone ? 0.76 : 0.68,
        recentIndex: isDisturbedZone ? 0.21 : 0.65,
        delta: isDisturbedZone ? -0.55 : -0.03,
        gsd: '10.0m Sentinel-2 MSI',
        surfaceType: isDisturbedZone ? 'Deforested Canopy Clearance' : 'Dense Sal Canopy'
      });
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    setSliderPos((x / rect.width) * 100);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const getGradientForMode = (isBaseline: boolean) => {
    if (spectralMode === 'TRUE_COLOR') {
      return isBaseline
        ? 'radial-gradient(circle at 50% 50%, #1e3a1e 10%, #182c18 45%, #122012 90%)'
        : 'radial-gradient(circle at 50% 50%, #4a3b2c 10%, #263321 45%, #182216 90%)';
    }
    if (spectralMode === 'FALSE_COLOR_IR') {
      return isBaseline
        ? 'radial-gradient(circle at 50% 50%, #9e1b2b 10%, #7d1522 45%, #4a0c14 90%)'
        : 'radial-gradient(circle at 50% 50%, #87a9b0 10%, #6e1c24 45%, #3d0d12 90%)';
    }
    if (spectralMode === 'NDWI') {
      return isBaseline
        ? 'radial-gradient(circle at 50% 50%, #374151 10%, #1f2937 45%, #111827 90%)'
        : 'radial-gradient(circle at 50% 50%, #0284c7 15%, #0369a1 55%, #075985 90%)';
    }
    return isBaseline
      ? 'radial-gradient(circle at 50% 50%, #10b981 15%, #059669 65%, #047857 95%)'
      : 'radial-gradient(circle at 50% 50%, #b45309 15%, #059669 65%, #064e3b 95%)';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
      {/* Top Banner with Event Meta & Event Switcher */}
      <div className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {onBackToMap && (
              <button onClick={onBackToMap} className="btn btn-secondary btn-sm" style={{ padding: '4px 8px', gap: '4px' }}>
                <ArrowLeft size={13} />
                <span>Map</span>
              </button>
            )}

            {/* Event Selector Dropdown if multiple events exist */}
            {events && events.length > 0 && onSelectEvent ? (
              <select
                value={event.id}
                onChange={e => {
                  const found = events.find(ev => ev.id === e.target.value);
                  if (found) onSelectEvent(found);
                }}
                style={{
                  padding: '6px 12px',
                  fontSize: '13px',
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
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {event.title}
              </h2>
            )}

            <span className="badge badge-amber">{event.category.replace('_', ' ')}</span>
            <span className="badge badge-neutral font-mono">{event.aoi_name}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={13} />
              Baseline: <b style={{ color: 'var(--text-primary)' }}>{event.baseline_date}</b>
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={13} />
              Recent: <b style={{ color: 'var(--text-primary)' }}>{event.recent_date}</b>
            </span>
            <span className="font-mono">
              Footprint: <b style={{ color: 'var(--amber-500)' }}>{event.affected_area_hectares.toFixed(1)} ha</b>
            </span>
            <span className="font-mono">
              Detection Confidence: <b style={{ color: 'var(--emerald-500)' }}>{Math.round(event.confidence.overall_detection_confidence * 100)}%</b>
            </span>
          </div>
        </div>

        {/* View Mode & Spectral Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* View Mode Toggle */}
          <div style={{ display: 'flex', backgroundColor: 'var(--bg-card)', padding: '2px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <button
              onClick={() => setComparisonMode('SWIPE')}
              className={`btn btn-sm ${comparisonMode === 'SWIPE' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none', gap: '4px' }}
              title="Curtain Swipe"
            >
              <SplitSquareVertical size={13} />
              <span>Swipe</span>
            </button>
            <button
              onClick={() => setComparisonMode('SIDE_BY_SIDE')}
              className={`btn btn-sm ${comparisonMode === 'SIDE_BY_SIDE' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none', gap: '4px' }}
              title="Synchronized Side-by-Side Dual Viewport"
            >
              <Columns size={13} />
              <span>Side-by-Side</span>
            </button>
            <button
              onClick={() => setComparisonMode('DIFFERENCE_MASK')}
              className={`btn btn-sm ${comparisonMode === 'DIFFERENCE_MASK' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none', gap: '4px' }}
              title="Direct Difference Mask"
            >
              <Activity size={13} />
              <span>Mask Only</span>
            </button>
          </div>

          {/* Spectral Bands */}
          <div style={{ display: 'flex', backgroundColor: 'var(--bg-card)', padding: '2px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <button
              onClick={() => setSpectralMode('TRUE_COLOR')}
              className={`btn btn-sm ${spectralMode === 'TRUE_COLOR' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none' }}
            >
              True Color (RGB)
            </button>
            <button
              onClick={() => setSpectralMode('FALSE_COLOR_IR')}
              className={`btn btn-sm ${spectralMode === 'FALSE_COLOR_IR' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none' }}
              title="Near-Infrared (B8-B4-B3)"
            >
              False Color IR
            </button>
            <button
              onClick={() => setSpectralMode('NDVI_DELTA')}
              className={`btn btn-sm ${spectralMode === 'NDVI_DELTA' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none' }}
              title="Normalized Difference Vegetation Index"
            >
              ΔNDVI Heatmap
            </button>
            <button
              onClick={() => setSpectralMode('NDWI')}
              className={`btn btn-sm ${spectralMode === 'NDWI' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none' }}
              title="Normalized Difference Water Index"
            >
              NDWI Water
            </button>
          </div>

          <button
            onClick={() => setShowOverlay(!showOverlay)}
            className={`btn btn-sm ${showOverlay ? 'btn-amber' : 'btn-secondary'}`}
            title="Toggle Change Vector Polygon"
          >
            <Layers size={14} />
            <span>Polygon Vector</span>
          </button>

          {onNavigateToReview && (
            <button
              onClick={() => onNavigateToReview(event)}
              className="btn btn-primary btn-sm"
              style={{ gap: '6px' }}
            >
              <span>Audit & Verify →</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Viewport */}
      {comparisonMode === 'SWIPE' && (
        <div
          ref={containerRef}
          onPointerMove={handlePointerMove}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          style={{
            position: 'relative',
            width: '100%',
            height: '560px',
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
            cursor: isDragging ? 'ew-resize' : 'crosshair',
            userSelect: 'none',
            boxShadow: 'var(--shadow-md)',
            border: '1px solid var(--border-strong)',
            backgroundColor: '#0a0d11'
          }}
        >
          {/* Layer 1: RECENT Image */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: getGradientForMode(false),
              backgroundSize: 'cover'
            }}
          >
            <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.85 }}>
              <defs>
                <filter id="noiseFilter">
                  <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="4" result="noise" />
                  <feColorMatrix type="matrix" values="0.33 0 0 0 0  0 0.33 0 0 0  0 0 0.33 0 0  0 0 0 0.15 0" />
                </filter>
              </defs>
              <rect width="100%" height="100%" filter="url(#noiseFilter)" />

              <path
                d="M 450 180 Q 560 140 680 200 T 780 320 Q 720 440 580 420 T 430 310 Z"
                fill={
                  spectralMode === 'TRUE_COLOR' ? '#786149' :
                  spectralMode === 'FALSE_COLOR_IR' ? '#c4b5a5' :
                  spectralMode === 'NDWI' ? '#0284c7' : '#ea580c'
                }
                opacity="0.9"
              />
            </svg>

            {/* Label Badge: RECENT */}
            <div
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                backgroundColor: 'rgba(21, 25, 32, 0.85)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '6px 12px',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--amber-500)' }} />
              RECENT: {event.recent_date} (Sentinel-2A MSI)
            </div>
          </div>

          {/* Layer 2: BASELINE Image (Clipped by Slider) */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              width: `${sliderPos}%`,
              overflow: 'hidden',
              borderRight: '2px solid #ffffff',
              boxShadow: '4px 0 16px rgba(0, 0, 0, 0.5)',
              backgroundImage: getGradientForMode(true),
              backgroundSize: 'cover'
            }}
          >
            <svg width="1400px" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.85 }}>
              <rect width="1400px" height="100%" filter="url(#noiseFilter)" />
              <circle cx="560" cy="280" r="160" fill={
                spectralMode === 'TRUE_COLOR' ? '#254425' :
                spectralMode === 'FALSE_COLOR_IR' ? '#b02334' :
                spectralMode === 'NDWI' ? '#334155' : '#059669'
              } opacity="0.4" />
            </svg>

            {/* Label Badge: BASELINE */}
            <div
              style={{
                position: 'absolute',
                top: '20px',
                left: '20px',
                backgroundColor: 'rgba(21, 25, 32, 0.85)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '6px 12px',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--emerald-500)' }} />
              BASELINE: {event.baseline_date} (Sentinel-2B MSI)
            </div>
          </div>

          {/* Change Polygon Vector Overlay */}
          {showOverlay && (
            <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 20 }}>
              <path
                d="M 450 180 Q 560 140 680 200 T 780 320 Q 720 440 580 420 T 430 310 Z"
                fill="rgba(245, 158, 11, 0.18)"
                stroke="var(--amber-500)"
                strokeWidth="2.5"
                strokeDasharray="6, 4"
              />
            </svg>
          )}

          {/* Draggable Divider Handle */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: `${sliderPos}%`,
              transform: 'translateX(-50%)',
              width: '4px',
              backgroundColor: '#ffffff',
              boxShadow: '0 0 12px rgba(0, 0, 0, 0.7)',
              zIndex: 30,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none'
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: '#ffffff',
                color: '#151920',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
                fontSize: '14px',
                fontWeight: 800
              }}
            >
              ↔
            </div>
          </div>

          {/* Telemetry HUD */}
          <div
            style={{
              position: 'absolute',
              bottom: '20px',
              left: '20px',
              backgroundColor: 'rgba(15, 18, 22, 0.88)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 16px',
              backdropFilter: 'blur(6px)',
              zIndex: 40,
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              fontSize: '12px'
            }}
            className="font-mono"
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>BASELINE INDEX</span>
              <span style={{ color: 'var(--emerald-500)', fontWeight: 700 }}>
                +{inspectorData.baselineIndex.toFixed(2)}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>RECENT INDEX</span>
              <span style={{ color: inspectorData.recentIndex < 0.3 ? 'var(--amber-500)' : 'var(--emerald-500)', fontWeight: 700 }}>
                +{inspectorData.recentIndex.toFixed(2)}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Δ SPECTRAL SHIFT</span>
              <span style={{ color: inspectorData.delta < -0.2 ? 'var(--copper-500)' : 'var(--text-primary)', fontWeight: 700 }}>
                {inspectorData.delta.toFixed(2)}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>CLASSIFICATION</span>
              <span style={{ color: 'var(--amber-500)', fontWeight: 700 }}>{inspectorData.surfaceType}</span>
            </div>
          </div>
        </div>
      )}

      {/* Side-by-Side Dual Viewport Mode */}
      {comparisonMode === 'SIDE_BY_SIDE' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div
            style={{
              height: '520px',
              borderRadius: 'var(--radius-xl)',
              overflow: 'hidden',
              position: 'relative',
              backgroundImage: getGradientForMode(true),
              border: '1px solid var(--border-subtle)'
            }}
          >
            <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.85 }}>
              <rect width="100%" height="100%" filter="url(#noiseFilter)" />
              <circle cx="50%" cy="50%" r="140" fill="#254425" opacity="0.5" />
            </svg>
            <div
              style={{
                position: 'absolute',
                top: '16px',
                left: '16px',
                backgroundColor: 'rgba(21, 25, 32, 0.85)',
                padding: '6px 12px',
                borderRadius: 'var(--radius-md)',
                color: '#fff',
                fontSize: '12px',
                fontFamily: 'var(--font-mono)'
              }}
            >
              1. BASELINE: {event.baseline_date} (Sentinel-2B)
            </div>
          </div>

          <div
            style={{
              height: '520px',
              borderRadius: 'var(--radius-xl)',
              overflow: 'hidden',
              position: 'relative',
              backgroundImage: getGradientForMode(false),
              border: '1px solid var(--border-subtle)'
            }}
          >
            <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.85 }}>
              <rect width="100%" height="100%" filter="url(#noiseFilter)" />
              <path
                d="M 180 140 Q 280 100 380 160 T 460 260 Q 400 360 280 340 T 160 240 Z"
                fill="#786149"
                opacity="0.9"
              />
              {showOverlay && (
                <path
                  d="M 180 140 Q 280 100 380 160 T 460 260 Q 400 360 280 340 T 160 240 Z"
                  fill="rgba(245, 158, 11, 0.2)"
                  stroke="var(--amber-500)"
                  strokeWidth="2.5"
                  strokeDasharray="6, 4"
                />
              )}
            </svg>
            <div
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                backgroundColor: 'rgba(21, 25, 32, 0.85)',
                padding: '6px 12px',
                borderRadius: 'var(--radius-md)',
                color: '#fff',
                fontSize: '12px',
                fontFamily: 'var(--font-mono)'
              }}
            >
              2. RECENT: {event.recent_date} (Sentinel-2A)
            </div>
          </div>
        </div>
      )}

      {/* Difference Mask Mode */}
      {comparisonMode === 'DIFFERENCE_MASK' && (
        <div
          style={{
            height: '520px',
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
            position: 'relative',
            backgroundColor: '#090c10',
            border: '1px solid var(--border-strong)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
            <rect width="100%" height="100%" fill="#05080c" />
            <path
              d="M 450 180 Q 560 140 680 200 T 780 320 Q 720 440 580 420 T 430 310 Z"
              fill="rgba(245, 158, 11, 0.35)"
              stroke="var(--amber-500)"
              strokeWidth="3"
            />
          </svg>
          <div
            style={{
              position: 'absolute',
              bottom: '20px',
              left: '20px',
              backgroundColor: 'rgba(15, 18, 22, 0.9)',
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              color: 'var(--amber-500)',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px'
            }}
          >
            Continuous Change Contour: {event.affected_area_hectares.toFixed(1)} ha • ΔNDVI Mean: {event.average_delta_index}
          </div>
        </div>
      )}
    </div>
  );
};
