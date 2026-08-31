import React, { useState, useRef, useEffect } from 'react';
import { ChangeEvent, SpectralBandMode } from '../../types';
import { Sliders, Eye, Maximize, Layers, Info, Calendar, Download } from 'lucide-react';

interface SwipeComparisonProps {
  event: ChangeEvent;
  onBackToMap?: () => void;
}

export const SwipeComparison: React.FC<SwipeComparisonProps> = ({ event }) => {
  const [sliderPos, setSliderPos] = useState<number>(50); // percentage (0 to 100)
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [spectralMode, setSpectralMode] = useState<SpectralBandMode>('TRUE_COLOR');
  const [showOverlay, setShowOverlay] = useState<boolean>(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Inspector readout under cursor
  const [cursorX, setCursorX] = useState<number>(50);
  const [inspectorData, setInspectorData] = useState({
    baselineNdvi: 0.74,
    recentNdvi: 0.22,
    delta: -0.52,
    gsd: '10.0m'
  });

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const pct = (x / rect.width) * 100;
    
    if (isDragging) {
      setSliderPos(pct);
    }
    setCursorX(pct);

    // Simulate localized spectral variance
    const isDeforestedZone = pct > 35 && pct < 75;
    setInspectorData({
      baselineNdvi: isDeforestedZone ? 0.76 : 0.68,
      recentNdvi: isDeforestedZone ? 0.21 : 0.65,
      delta: isDeforestedZone ? -0.55 : -0.03,
      gsd: '10.0m'
    });
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

  // Render authentic simulated remote sensing canvas surfaces
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
      {/* Top Banner with Event Meta */}
      <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="badge badge-amber">{event.category.replace('_', ' ')}</span>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {event.title}
            </h2>
            <span className="badge badge-neutral font-mono">{event.aoi_name}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
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

        {/* Spectral Band Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Spectral Mode:
          </span>
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
              title="Near-Infrared / B8-B4-B3"
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
          </div>

          <button
            onClick={() => setShowOverlay(!showOverlay)}
            className={`btn btn-sm ${showOverlay ? 'btn-amber' : 'btn-secondary'}`}
            title="Toggle Change Polygon Overlay"
          >
            <Layers size={14} />
            <span>Polygon Vector</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Swipe Container */}
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
        {/* Layer 1: RECENT Image (Underneath) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: spectralMode === 'TRUE_COLOR'
              ? 'radial-gradient(circle at 50% 50%, #4a3b2c 10%, #263321 45%, #182216 90%)'
              : spectralMode === 'FALSE_COLOR_IR'
              ? 'radial-gradient(circle at 50% 50%, #87a9b0 10%, #6e1c24 45%, #3d0d12 90%)'
              : 'radial-gradient(circle at 50% 50%, #b45309 15%, #059669 65%, #064e3b 95%)',
            backgroundSize: 'cover'
          }}
        >
          {/* Simulated Satellite Terrain Texture */}
          <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.85 }}>
            <defs>
              <filter id="noiseFilter">
                <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="4" result="noise" />
                <feColorMatrix type="matrix" values="0.33 0 0 0 0  0 0.33 0 0 0  0 0 0.33 0 0  0 0 0 0.15 0" />
              </filter>
            </defs>
            <rect width="100%" height="100%" filter="url(#noiseFilter)" />
            
            {/* Deforested / Mining Pit Scar visible in Recent observation */}
            <path
              d="M 450 180 Q 560 140 680 200 T 780 320 Q 720 440 580 420 T 430 310 Z"
              fill={
                spectralMode === 'TRUE_COLOR' ? '#786149' :
                spectralMode === 'FALSE_COLOR_IR' ? '#c4b5a5' : '#ea580c'
              }
              opacity="0.9"
            />
            {/* Inner extraction trench */}
            <path
              d="M 480 220 Q 580 180 660 230 T 720 310 Q 660 380 540 370 Z"
              fill={
                spectralMode === 'TRUE_COLOR' ? '#92795d' :
                spectralMode === 'FALSE_COLOR_IR' ? '#d9cbbe' : '#dc2626'
              }
              opacity="0.95"
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
            RECENT: {event.recent_date} (Sentinel-2A)
          </div>
        </div>

        {/* Layer 2: BASELINE Image (Clipped by Swipe Slider) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            width: `${sliderPos}%`,
            overflow: 'hidden',
            borderRight: '2px solid #ffffff',
            boxShadow: '4px 0 16px rgba(0, 0, 0, 0.5)',
            backgroundImage: spectralMode === 'TRUE_COLOR'
              ? 'radial-gradient(circle at 50% 50%, #1e3a1e 10%, #182c18 45%, #122012 90%)'
              : spectralMode === 'FALSE_COLOR_IR'
              ? 'radial-gradient(circle at 50% 50%, #9e1b2b 10%, #7d1522 45%, #4a0c14 90%)'
              : 'radial-gradient(circle at 50% 50%, #10b981 15%, #059669 65%, #047857 95%)',
            backgroundSize: 'cover'
          }}
        >
          {/* Simulated Baseline Texture (Pristine Forest Canopy) */}
          <svg width="1400px" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.85 }}>
            <rect width="1400px" height="100%" filter="url(#noiseFilter)" />
            {/* Pristine undisturbed vegetation canopy */}
            <circle cx="560" cy="280" r="160" fill={
              spectralMode === 'TRUE_COLOR' ? '#254425' :
              spectralMode === 'FALSE_COLOR_IR' ? '#b02334' : '#059669'
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
            BASELINE: {event.baseline_date} (Sentinel-2B)
          </div>
        </div>

        {/* Optional Change Polygon Vector Overlay */}
        {showOverlay && (
          <svg
            width="100%"
            height="100%"
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              zIndex: 20
            }}
          >
            {/* Change Boundary Polygon */}
            <path
              d="M 450 180 Q 560 140 680 200 T 780 320 Q 720 440 580 420 T 430 310 Z"
              fill="none"
              stroke="var(--amber-500)"
              strokeWidth="2.5"
              strokeDasharray="6, 4"
            />
            <path
              d="M 480 220 Q 580 180 660 230 T 720 310 Q 660 380 540 370 Z"
              fill="rgba(245, 158, 11, 0.15)"
              stroke="var(--copper-500)"
              strokeWidth="1.5"
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

        {/* Live Cursor Inspector HUD */}
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
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>BASELINE NDVI</span>
            <span style={{ color: 'var(--emerald-500)', fontWeight: 700 }}>
              +{inspectorData.baselineNdvi.toFixed(2)}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>RECENT NDVI</span>
            <span style={{ color: inspectorData.recentNdvi < 0.3 ? 'var(--amber-500)' : 'var(--emerald-500)', fontWeight: 700 }}>
              +{inspectorData.recentNdvi.toFixed(2)}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Δ SPECTRAL SHIFT</span>
            <span style={{ color: inspectorData.delta < -0.2 ? 'var(--copper-500)' : 'var(--text-primary)', fontWeight: 700 }}>
              {inspectorData.delta.toFixed(2)}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>PIXEL GSD</span>
            <span style={{ color: 'var(--text-secondary)' }}>{inspectorData.gsd}</span>
          </div>
        </div>
      </div>

      {/* Swipe Instruction Guide */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '12px' }}>
        <span>💡 Click and drag the white vertical slider across the scene to wipe between Baseline and Recent observations.</span>
        <span className="font-mono">Curtain Position: {sliderPos.toFixed(0)}%</span>
      </div>
    </div>
  );
};
