import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { AOI, ChangeEvent } from '../../types';
import {
  Globe,
  Layers,
  RotateCw,
  Compass,
  MapPin,
  Calendar,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  Sliders,
  Play,
  Eye,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

interface MapLibreGlobeWorkspaceProps {
  aois: AOI[];
  events: ChangeEvent[];
  selectedAoi?: AOI | null;
  onSelectAoi: (aoi: AOI) => void;
  onSwitchToLeaflet: () => void;
  onOpenEventReview?: (event: ChangeEvent) => void;
  onOpenSwipe?: (event: ChangeEvent) => void;
}

export const MapLibreGlobeWorkspace: React.FC<MapLibreGlobeWorkspaceProps> = ({
  aois,
  events,
  selectedAoi,
  onSelectAoi,
  onSwitchToLeaflet,
  onOpenEventReview,
  onOpenSwipe
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);

  // Globe Styles
  const [globeStyle, setGlobeStyle] = useState<'demo-globe' | 'satellite-globe' | 'dark-globe'>('demo-globe');
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [pitch3d, setPitch3d] = useState<number>(35);
  const [selectedEvent, setSelectedEvent] = useState<ChangeEvent | null>(null);

  const spinIntervalRef = useRef<any>(null);

  // Style URLs
  const getStyleUrl = (type: 'demo-globe' | 'satellite-globe' | 'dark-globe') => {
    switch (type) {
      case 'demo-globe':
        // Exactly user requested 3D globe style URL
        return 'https://demotiles.maplibre.org/globe.json';
      case 'dark-globe':
        return 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
      case 'satellite-globe':
      default:
        // High-res satellite 3D globe style
        return {
          version: 8,
          sources: {
            'satellite-tiles': {
              type: 'raster',
              tiles: [
                'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'
              ],
              tileSize: 256
            }
          },
          layers: [
            {
              id: 'satellite-layer',
              type: 'raster',
              source: 'satellite-tiles',
              minzoom: 0,
              maxzoom: 22
            }
          ]
        } as any;
    }
  };

  // Initialize MapLibre GL 3D Globe
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const initialCenter: [number, number] = selectedAoi?.center
      ? [selectedAoi.center[1], selectedAoi.center[0]] // [lng, lat]
      : [82.685, 22.825]; // India central

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: getStyleUrl(globeStyle),
      center: initialCenter,
      zoom: selectedAoi ? selectedAoi.zoom : 3.5,
      pitch: pitch3d,
      bearing: 0,
      attributionControl: false
    });

    // Add navigation control
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');

    map.on('load', () => {
      // 1. Add AOI GeoJSON Source & Layers
      if (selectedAoi?.geometry) {
        map.addSource('selected-aoi-source', {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: selectedAoi.geometry as any,
            properties: { name: selectedAoi.name }
          }
        });

        map.addLayer({
          id: 'selected-aoi-fill',
          type: 'fill',
          source: 'selected-aoi-source',
          paint: {
            'fill-color': '#10b981',
            'fill-opacity': 0.18
          }
        });

        map.addLayer({
          id: 'selected-aoi-line',
          type: 'line',
          source: 'selected-aoi-source',
          paint: {
            'line-color': '#10b981',
            'line-width': 2.5
          }
        });
      }

      // 2. Add Change Events GeoJSON Source & Layers
      const features = events.map(ev => ({
        type: 'Feature' as const,
        geometry: ev.geojson_geometry as any,
        properties: {
          id: ev.id,
          title: ev.title,
          aoi_name: ev.aoi_name,
          category: ev.category,
          area_ha: ev.affected_area_hectares,
          confidence: ev.confidence.overall_detection_confidence
        }
      }));

      map.addSource('events-source', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features
        }
      });

      // Red Disturbance Fill
      map.addLayer({
        id: 'events-fill',
        type: 'fill',
        source: 'events-source',
        paint: {
          'fill-color': '#ef4444',
          'fill-opacity': 0.65
        }
      });

      // Pulsing Disturbance Outline
      map.addLayer({
        id: 'events-line',
        type: 'line',
        source: 'events-source',
        paint: {
          'line-color': '#ef4444',
          'line-width': 3.5
        }
      });

      // Click on event polygon
      map.on('click', 'events-fill', (e: any) => {
        if (!e.features || !e.features[0]) return;
        const clickedId = e.features[0].properties?.id;
        const matched = events.find(ev => ev.id === clickedId);
        if (matched) {
          setSelectedEvent(matched);
        }
      });

      // Change cursor on hover
      map.on('mouseenter', 'events-fill', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'events-fill', () => {
        map.getCanvas().style.cursor = '';
      });
    });

    mapInstanceRef.current = map;

    return () => {
      if (spinIntervalRef.current) clearInterval(spinIntervalRef.current);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [globeStyle, selectedAoi?.id]);

  // Handle Auto-Spin Globe Animation
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (spinIntervalRef.current) clearInterval(spinIntervalRef.current);

    if (isSpinning) {
      spinIntervalRef.current = setInterval(() => {
        if (!mapInstanceRef.current) return;
        const currentCenter = mapInstanceRef.current.getCenter();
        const newLng = (currentCenter.lng + 0.3) % 360;
        mapInstanceRef.current.easeTo({
          center: [newLng, currentCenter.lat],
          duration: 100,
          easing: (t: number) => t
        });
      }, 50);
    }

    return () => {
      if (spinIntervalRef.current) clearInterval(spinIntervalRef.current);
    };
  }, [isSpinning]);

  // Fly to India center
  const flyToIndia = () => {
    if (!mapInstanceRef.current) return;
    setIsSpinning(false);
    mapInstanceRef.current.flyTo({
      center: [78.9629, 22.5937],
      zoom: 4.5,
      pitch: 40,
      bearing: 0,
      essential: true
    });
  };

  // Fly to selected AOI
  const flyToAoi = () => {
    if (!mapInstanceRef.current || !selectedAoi) return;
    setIsSpinning(false);
    mapInstanceRef.current.flyTo({
      center: [selectedAoi.center[1], selectedAoi.center[0]],
      zoom: selectedAoi.zoom || 13,
      pitch: pitch3d,
      essential: true
    });
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: 'calc(100vh - 65px)', overflow: 'hidden' }}>
      {/* MapLibre WebGL Canvas Container */}
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%', backgroundColor: '#030712' }} />

      {/* Top Floating Header & Engine Switcher */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 850,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          backgroundColor: 'rgba(15, 23, 42, 0.94)',
          backdropFilter: 'blur(10px)',
          padding: '8px 18px',
          borderRadius: 'var(--radius-full)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          flexWrap: 'wrap'
        }}
      >
        {/* Engine Switcher Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={onSwitchToLeaflet}
            className="btn btn-secondary btn-sm"
            style={{ borderRadius: 'var(--radius-full)', fontSize: '12px', gap: '6px' }}
            title="Switch back to 2D Leaflet High-Res Satellite Engine"
          >
            <span>🗺️ 2D Leaflet Engine</span>
          </button>

          <button
            className="btn btn-primary btn-sm"
            style={{ borderRadius: 'var(--radius-full)', fontSize: '12px', gap: '6px' }}
            title="Currently Active: MapLibre GL 3D Globe WebGL Engine"
          >
            <Globe size={14} />
            <span>🌐 MapLibre 3D Globe Active</span>
          </button>
        </div>

        <span style={{ width: '1px', height: '20px', backgroundColor: 'rgba(255,255,255,0.2)' }} />

        {/* Globe Style Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={() => setGlobeStyle('demo-globe')}
            className={`btn btn-sm ${globeStyle === 'demo-globe' ? 'btn-amber' : 'btn-secondary'}`}
            style={{ fontSize: '11px', padding: '4px 10px', borderRadius: 'var(--radius-full)' }}
            title="MapLibre Official Demo 3D Globe (https://demotiles.maplibre.org/globe.json)"
          >
            <span>🌐 Vector 3D Globe</span>
          </button>

          <button
            onClick={() => setGlobeStyle('satellite-globe')}
            className={`btn btn-sm ${globeStyle === 'satellite-globe' ? 'btn-amber' : 'btn-secondary'}`}
            style={{ fontSize: '11px', padding: '4px 10px', borderRadius: 'var(--radius-full)' }}
            title="Google/ESRI High-Res Satellite Tiles in 3D WebGL Projection"
          >
            <span>🛰️ Satellite 3D Globe</span>
          </button>

          <button
            onClick={() => setGlobeStyle('dark-globe')}
            className={`btn btn-sm ${globeStyle === 'dark-globe' ? 'btn-amber' : 'btn-secondary'}`}
            style={{ fontSize: '11px', padding: '4px 10px', borderRadius: 'var(--radius-full)' }}
            title="Dark Carto Vector Night Globe"
          >
            <span>🌑 Dark 3D Globe</span>
          </button>
        </div>

        <span style={{ width: '1px', height: '20px', backgroundColor: 'rgba(255,255,255,0.2)' }} />

        {/* 3D Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => setIsSpinning(!isSpinning)}
            className={`btn btn-sm ${isSpinning ? 'btn-emerald' : 'btn-secondary'}`}
            style={{ borderRadius: 'var(--radius-full)', fontSize: '11px', gap: '4px' }}
            title="Auto-rotate earth around planetary axis"
          >
            <RotateCw size={12} style={{ animation: isSpinning ? 'spin 3s linear infinite' : 'none' }} />
            <span>{isSpinning ? 'Pause Spin' : 'Spin 3D'}</span>
          </button>

          <button
            onClick={flyToIndia}
            className="btn btn-secondary btn-sm"
            style={{ borderRadius: 'var(--radius-full)', fontSize: '11px', gap: '4px' }}
            title="Fly camera to whole India view"
          >
            <span>🇮🇳 India View</span>
          </button>

          {selectedAoi && (
            <button
              onClick={flyToAoi}
              className="btn btn-secondary btn-sm"
              style={{ borderRadius: 'var(--radius-full)', fontSize: '11px', gap: '4px' }}
              title="Fly camera to selected AOI boundary"
            >
              <span>🎯 Focus AOI</span>
            </button>
          )}
        </div>
      </div>

      {/* Floating Left AOI & Telemetry HUD */}
      <div
        className="floating-panel"
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          width: '320px',
          backgroundColor: 'rgba(15, 23, 42, 0.92)',
          backdropFilter: 'blur(10px)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          padding: '16px',
          color: '#ffffff',
          boxShadow: 'var(--shadow-floating)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          zIndex: 800
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Globe size={18} style={{ color: '#38bdf8' }} />
            <span style={{ fontSize: '14px', fontWeight: 800 }}>MapLibre 3D Earth</span>
          </div>
          <span className="badge badge-emerald font-mono" style={{ fontSize: '10px' }}>WebGL 2.0</span>
        </div>

        <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: '1.4' }}>
          Real-time WebGL hardware-accelerated spherical projection powered by MapLibre GL v6.14.0.
        </div>

        {/* Selected AOI Quick Switcher */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8' }}>MONITORED REGION:</label>
          <select
            value={selectedAoi?.id || ''}
            onChange={e => {
              const matched = aois.find(a => a.id === e.target.value);
              if (matched) {
                onSelectAoi(matched);
                if (mapInstanceRef.current) {
                  mapInstanceRef.current.flyTo({
                    center: [matched.center[1], matched.center[0]],
                    zoom: matched.zoom || 13,
                    essential: true
                  });
                }
              }
            }}
            style={{
              padding: '6px 10px',
              backgroundColor: 'rgba(30, 41, 59, 0.85)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '6px',
              fontSize: '12px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {aois.map(a => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.area_hectares.toFixed(0)} ha)
              </option>
            ))}
          </select>
        </div>

        {/* Pitch / 3D Tilt Slider */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8' }}>
            <span>3D Horizon Tilt:</span>
            <span className="font-mono" style={{ color: '#38bdf8', fontWeight: 700 }}>{pitch3d}°</span>
          </div>
          <input
            type="range"
            min="0"
            max="65"
            value={pitch3d}
            onChange={e => {
              const val = parseInt(e.target.value);
              setPitch3d(val);
              mapInstanceRef.current?.setPitch(val);
            }}
            style={{ accentColor: '#38bdf8', cursor: 'pointer', height: '4px' }}
          />
        </div>

        {/* Changes Indicator */}
        <div style={{ padding: '8px 10px', backgroundColor: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171' }}>
          <AlertTriangle size={15} />
          <span><b>{events.length} Disturbance Hotspots</b> highlighted in red 3D polygons on the globe.</span>
        </div>

        {events.length > 0 && onOpenSwipe && (
          <button
            onClick={() => onOpenSwipe(events[0])}
            className="btn btn-primary btn-sm"
            style={{ width: '100%', gap: '6px', fontSize: '11px', fontWeight: 700 }}
          >
            <Eye size={13} />
            <span>Open Side-by-Side Comparison</span>
          </button>
        )}
      </div>

      {/* Selected Event Popup Card */}
      {selectedEvent && (
        <div
          style={{
            position: 'absolute',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '90%',
            maxWidth: '560px',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(12px)',
            borderRadius: 'var(--radius-lg)',
            border: '2px solid rgba(239, 68, 68, 0.5)',
            padding: '16px 20px',
            color: '#ffffff',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            zIndex: 900
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
              <span style={{ fontSize: '14px', fontWeight: 800 }}>{selectedEvent.title}</span>
              <span className="badge badge-amber" style={{ fontSize: '10px' }}>{selectedEvent.category}</span>
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
              📍 <b>{selectedEvent.aoi_name}</b> • Footprint: <b style={{ color: '#ef4444' }}>{selectedEvent.affected_area_hectares.toFixed(1)} ha</b> • Confidence: <b style={{ color: '#10b981' }}>{Math.round(selectedEvent.confidence.overall_detection_confidence * 100)}%</b>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {onOpenSwipe && (
              <button
                onClick={() => onOpenSwipe(selectedEvent)}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '11px', gap: '4px' }}
              >
                <Eye size={13} />
                <span>Compare</span>
              </button>
            )}

            {onOpenEventReview && (
              <button
                onClick={() => onOpenEventReview(selectedEvent)}
                className="btn btn-primary btn-sm"
                style={{ fontSize: '11px', gap: '4px' }}
              >
                <span>Verify →</span>
              </button>
            )}

            <button
              onClick={() => setSelectedEvent(null)}
              className="btn btn-secondary btn-sm"
              style={{ padding: '4px 8px' }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
