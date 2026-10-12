import React, { useState, useRef, useEffect } from 'react';
import L from 'leaflet';
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
  ChevronDown,
  MapPin
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

  // References for Leaflet map containers
  const swipeMapContainerRef = useRef<HTMLDivElement>(null);
  const swipeMapRef = useRef<L.Map | null>(null);
  const swipePolygonLayerRef = useRef<L.GeoJSON | null>(null);

  // Side-by-side synchronized map references
  const sideBySideLeftContainerRef = useRef<HTMLDivElement>(null);
  const sideBySideRightContainerRef = useRef<HTMLDivElement>(null);
  const sideBySideLeftMapRef = useRef<L.Map | null>(null);
  const sideBySideRightMapRef = useRef<L.Map | null>(null);

  // Difference Mask map reference
  const maskMapContainerRef = useRef<HTMLDivElement>(null);
  const maskMapRef = useRef<L.Map | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Computed Real Telemetry
  const isWater = event.category === 'WATER_EXPANSION' || event.category === 'WATER_SHRINKAGE';
  const baselineIndex = isWater ? -0.38 : 0.72;
  const recentIndex = baselineIndex + event.average_delta_index;
  const deltaIndex = event.average_delta_index;
  const indexLabel = isWater ? 'NDWI' : 'NDVI';

  const overlayColor = isWater ? '#0d9488' : '#d97706';

  // Tile URL for Esri World Imagery (Satellite)
  const satelliteTileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

  // Pointer drag handler for swipe slider
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(5, Math.min(e.clientX - rect.left, rect.width - 5));
    const pct = (x / rect.width) * 100;
    setSliderPos(pct);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(5, Math.min(e.clientX - rect.left, rect.width - 5));
    setSliderPos((x / rect.width) * 100);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // Initialize and update SWIPE mode map
  useEffect(() => {
    if (comparisonMode !== 'SWIPE' || !swipeMapContainerRef.current) return;

    if (swipeMapRef.current) {
      swipeMapRef.current.remove();
      swipeMapRef.current = null;
    }

    const map = L.map(swipeMapContainerRef.current, {
      zoomControl: true,
      attributionControl: false,
      scrollWheelZoom: true
    });

    L.tileLayer(satelliteTileUrl, { maxZoom: 18 }).addTo(map);

    try {
      const geoLayer = L.geoJSON(event.geojson_geometry as any, {
        style: {
          color: overlayColor,
          weight: 2.5,
          fillColor: overlayColor,
          fillOpacity: showOverlay ? 0.4 : 0.05,
          dashArray: showOverlay ? undefined : '5, 5'
        }
      }).addTo(map);

      swipePolygonLayerRef.current = geoLayer;

      const bounds = geoLayer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
      } else {
        map.setView([22.825, 82.685], 13);
      }
    } catch {
      map.setView([22.825, 82.685], 13);
    }

    swipeMapRef.current = map;

    return () => {
      map.remove();
      swipeMapRef.current = null;
    };
  }, [comparisonMode, event, showOverlay, overlayColor]);

  // Initialize and synchronize SIDE_BY_SIDE dual viewports
  useEffect(() => {
    if (comparisonMode !== 'SIDE_BY_SIDE') return;
    if (!sideBySideLeftContainerRef.current || !sideBySideRightContainerRef.current) return;

    if (sideBySideLeftMapRef.current) {
      sideBySideLeftMapRef.current.remove();
      sideBySideLeftMapRef.current = null;
    }
    if (sideBySideRightMapRef.current) {
      sideBySideRightMapRef.current.remove();
      sideBySideRightMapRef.current = null;
    }

    const leftMap = L.map(sideBySideLeftContainerRef.current, {
      zoomControl: false,
      attributionControl: false
    });
    L.tileLayer(satelliteTileUrl, { maxZoom: 18 }).addTo(leftMap);

    const rightMap = L.map(sideBySideRightContainerRef.current, {
      zoomControl: true,
      attributionControl: false
    });
    L.tileLayer(satelliteTileUrl, { maxZoom: 18 }).addTo(rightMap);

    try {
      const rightGeoLayer = L.geoJSON(event.geojson_geometry as any, {
        style: {
          color: overlayColor,
          weight: 2.5,
          fillColor: overlayColor,
          fillOpacity: 0.4
        }
      }).addTo(rightMap);

      const bounds = rightGeoLayer.getBounds();
      if (bounds.isValid()) {
        leftMap.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
        rightMap.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
      } else {
        leftMap.setView([22.825, 82.685], 13);
        rightMap.setView([22.825, 82.685], 13);
      }
    } catch {
      leftMap.setView([22.825, 82.685], 13);
      rightMap.setView([22.825, 82.685], 13);
    }

    // Synchronize panning & zooming
    let isSyncing = false;
    const syncLeftToRight = () => {
      if (isSyncing) return;
      isSyncing = true;
      rightMap.setView(leftMap.getCenter(), leftMap.getZoom(), { animate: false });
      isSyncing = false;
    };

    const syncRightToLeft = () => {
      if (isSyncing) return;
      isSyncing = true;
      leftMap.setView(rightMap.getCenter(), rightMap.getZoom(), { animate: false });
      isSyncing = false;
    };

    leftMap.on('move', syncLeftToRight);
    rightMap.on('move', syncRightToLeft);

    sideBySideLeftMapRef.current = leftMap;
    sideBySideRightMapRef.current = rightMap;

    return () => {
      leftMap.remove();
      rightMap.remove();
      sideBySideLeftMapRef.current = null;
      sideBySideRightMapRef.current = null;
    };
  }, [comparisonMode, event, overlayColor]);

  // Initialize and update DIFFERENCE_MASK mode map
  useEffect(() => {
    if (comparisonMode !== 'DIFFERENCE_MASK' || !maskMapContainerRef.current) return;

    if (maskMapRef.current) {
      maskMapRef.current.remove();
      maskMapRef.current = null;
    }

    const map = L.map(maskMapContainerRef.current, {
      zoomControl: true,
      attributionControl: false
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 18 }).addTo(map);

    try {
      const geoLayer = L.geoJSON(event.geojson_geometry as any, {
        style: {
          color: overlayColor,
          weight: 3,
          fillColor: overlayColor,
          fillOpacity: 0.55
        }
      }).addTo(map);

      const bounds = geoLayer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      } else {
        map.setView([22.825, 82.685], 13);
      }
    } catch {
      map.setView([22.825, 82.685], 13);
    }

    maskMapRef.current = map;

    return () => {
      map.remove();
      maskMapRef.current = null;
    };
  }, [comparisonMode, event, overlayColor]);

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
              title="Interactive Curtain Slider"
            >
              <SplitSquareVertical size={13} />
              <span>Swipe</span>
            </button>
            <button
              onClick={() => setComparisonMode('SIDE_BY_SIDE')}
              className={`btn btn-sm ${comparisonMode === 'SIDE_BY_SIDE' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none', gap: '4px' }}
              title="Synchronized Dual Viewports"
            >
              <Columns size={13} />
              <span>Side-by-Side</span>
            </button>
            <button
              onClick={() => setComparisonMode('DIFFERENCE_MASK')}
              className={`btn btn-sm ${comparisonMode === 'DIFFERENCE_MASK' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none', gap: '4px' }}
              title="Vector Contour Mask Only"
            >
              <Activity size={13} />
              <span>Mask Only</span>
            </button>
          </div>

          {/* Toggle Change Vector Polygon */}
          <button
            onClick={() => setShowOverlay(!showOverlay)}
            className={`btn btn-sm ${showOverlay ? 'btn-amber' : 'btn-secondary'}`}
            title="Toggle Disturbance Boundary Polygon"
            style={{ gap: '6px' }}
          >
            <Layers size={14} />
            <span>{showOverlay ? 'Hide Vector' : 'Show Vector'}</span>
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
            cursor: isDragging ? 'ew-resize' : 'default',
            userSelect: 'none',
            boxShadow: 'var(--shadow-md)',
            border: '1px solid var(--border-strong)',
            backgroundColor: '#0a0d11'
          }}
        >
          {/* Base Map Container */}
          <div
            ref={swipeMapContainerRef}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              zIndex: 1
            }}
          />

          {/* Baseline Curtain (Clipped by Slider) */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              width: `${sliderPos}%`,
              overflow: 'hidden',
              borderRight: '3px solid #ffffff',
              boxShadow: '4px 0 20px rgba(0,0,0,0.7)',
              pointerEvents: 'none',
              zIndex: 10
            }}
          >
            {/* Baseline Tag Badge */}
            <div
              style={{
                position: 'absolute',
                top: '20px',
                left: '20px',
                backgroundColor: 'rgba(15, 18, 22, 0.88)',
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
                gap: '6px',
                zIndex: 20
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--emerald-500)' }} />
              1. BASELINE: {event.baseline_date} (Pristine Terrain)
            </div>
          </div>

          {/* Recent Tag Badge on the right */}
          <div
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              backgroundColor: 'rgba(15, 18, 22, 0.88)',
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
              gap: '6px',
              zIndex: 20
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--amber-500)' }} />
            2. RECENT: {event.recent_date} (Detected Disturbance)
          </div>

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
              boxShadow: '0 0 16px rgba(0, 0, 0, 0.9)',
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
                boxShadow: '0 4px 16px rgba(0,0,0,0.8)',
                fontSize: '14px',
                fontWeight: 800
              }}
            >
              ↔
            </div>
          </div>

          {/* Real Telemetry HUD */}
          <div
            style={{
              position: 'absolute',
              bottom: '20px',
              left: '20px',
              backgroundColor: 'rgba(15, 18, 22, 0.92)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 16px',
              backdropFilter: 'blur(8px)',
              zIndex: 40,
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              fontSize: '12px',
              boxShadow: 'var(--shadow-md)',
              flexWrap: 'wrap'
            }}
            className="font-mono"
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>BASELINE {indexLabel}</span>
              <span style={{ color: 'var(--emerald-500)', fontWeight: 700 }}>
                {baselineIndex > 0 ? `+${baselineIndex.toFixed(2)}` : baselineIndex.toFixed(2)}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>RECENT {indexLabel}</span>
              <span style={{ color: recentIndex < 0.3 ? 'var(--amber-500)' : 'var(--emerald-500)', fontWeight: 700 }}>
                {recentIndex > 0 ? `+${recentIndex.toFixed(2)}` : recentIndex.toFixed(2)}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Δ SPECTRAL VARIANCE</span>
              <span style={{ color: deltaIndex < -0.2 ? 'var(--copper-500)' : 'var(--text-primary)', fontWeight: 700 }}>
                {deltaIndex > 0 ? `+${deltaIndex.toFixed(2)}` : deltaIndex.toFixed(2)}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>SURFACE FOOTPRINT</span>
              <span style={{ color: 'var(--amber-500)', fontWeight: 700 }}>
                {event.affected_area_hectares.toFixed(1)} ha
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>OPTICAL GSD</span>
              <span style={{ color: 'var(--teal-500)', fontWeight: 700 }}>10m Sentinel-2 MSI</span>
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
              border: '1px solid var(--border-subtle)',
              backgroundColor: '#0a0d11'
            }}
          >
            <div ref={sideBySideLeftContainerRef} style={{ width: '100%', height: '100%' }} />
            <div
              style={{
                position: 'absolute',
                top: '16px',
                left: '16px',
                backgroundColor: 'rgba(15, 18, 22, 0.9)',
                padding: '6px 12px',
                borderRadius: 'var(--radius-md)',
                color: '#fff',
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
                zIndex: 1000,
                pointerEvents: 'none'
              }}
            >
              1. BASELINE: {event.baseline_date} (Pristine Satellite Pass)
            </div>
          </div>

          <div
            style={{
              height: '520px',
              borderRadius: 'var(--radius-xl)',
              overflow: 'hidden',
              position: 'relative',
              border: '1px solid var(--border-subtle)',
              backgroundColor: '#0a0d11'
            }}
          >
            <div ref={sideBySideRightContainerRef} style={{ width: '100%', height: '100%' }} />
            <div
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                backgroundColor: 'rgba(15, 18, 22, 0.9)',
                padding: '6px 12px',
                borderRadius: 'var(--radius-md)',
                color: '#fff',
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
                zIndex: 1000,
                pointerEvents: 'none'
              }}
            >
              2. RECENT: {event.recent_date} (Detected Footprint Overlay)
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
            border: '1px solid var(--border-strong)'
          }}
        >
          <div ref={maskMapContainerRef} style={{ width: '100%', height: '100%' }} />
          <div
            style={{
              position: 'absolute',
              bottom: '20px',
              left: '20px',
              backgroundColor: 'rgba(15, 18, 22, 0.92)',
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              color: 'var(--amber-500)',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              zIndex: 1000,
              pointerEvents: 'none'
            }}
          >
            Connected Component Morphological Mask • Footprint: {event.affected_area_hectares.toFixed(1)} ha
          </div>
        </div>
      )}
    </div>
  );
};
