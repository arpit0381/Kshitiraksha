import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { AOI, ChangeEvent, AnalysisRunParams } from '../../types';
import { CoordinateBar } from './CoordinateBar';
import { Play, Sliders, RefreshCw, Crosshair, PlusCircle, CheckCircle2 } from 'lucide-react';

interface MapWorkspaceProps {
  aois: AOI[];
  events: ChangeEvent[];
  selectedAoi: AOI;
  onSelectAoi: (aoi: AOI) => void;
  onRunAnalysis: (params: AnalysisRunParams) => Promise<void>;
  onOpenEventReview: (event: ChangeEvent) => void;
}

export const MapWorkspace: React.FC<MapWorkspaceProps> = ({
  aois,
  events,
  selectedAoi,
  onSelectAoi,
  onRunAnalysis,
  onOpenEventReview
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const aoiLayerRef = useRef<L.Polygon | null>(null);
  const eventsLayerGroupRef = useRef<L.LayerGroup | null>(null);

  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(selectedAoi.zoom);
  const [basemap, setBasemap] = useState<string>('satellite');
  
  // Analysis Parameters
  const [baselineDate, setBaselineDate] = useState<string>('2025-01-15');
  const [recentDate, setRecentDate] = useState<string>('2026-02-10');
  const [threshold, setThreshold] = useState<number>(-0.25);
  const [minAreaHa, setMinAreaHa] = useState<number>(1.0);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisStep, setAnalysisStep] = useState<string>('');

  // Tile Layer URLs
  const basemapUrls: Record<string, { url: string; attribution: string }> = {
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Esri, Maxar, Earthstar Geographics'
    },
    'carto-dark': {
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; OpenStreetMap &copy; CARTO'
    },
    'carto-light': {
      url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; OpenStreetMap &copy; CARTO'
    },
    osm: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; OpenStreetMap contributors'
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    const map = L.map(mapContainerRef.current, {
      center: selectedAoi.center,
      zoom: selectedAoi.zoom,
      zoomControl: false
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Initial tile layer
    const { url, attribution } = basemapUrls[basemap];
    const tileLayer = L.tileLayer(url, { attribution, maxZoom: 18 }).addTo(map);
    tileLayerRef.current = tileLayer;

    // Events Layer Group
    const eventsGroup = L.layerGroup().addTo(map);
    eventsLayerGroupRef.current = eventsGroup;

    // Map listeners
    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      setCursorCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    map.on('zoomend', () => {
      setZoomLevel(map.getZoom());
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Basemap
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    const { url, attribution } = basemapUrls[basemap];
    tileLayerRef.current.setUrl(url);
  }, [basemap]);

  // Update AOI and Events on map
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Center map on selected AOI
    map.setView(selectedAoi.center, selectedAoi.zoom);

    // Redraw AOI Polygon boundary
    if (aoiLayerRef.current) {
      map.removeLayer(aoiLayerRef.current);
    }

    if (selectedAoi.geometry && selectedAoi.geometry.coordinates[0]) {
      const coords = (selectedAoi.geometry.coordinates[0] as [number, number][]).map(
        ([lng, lat]) => [lat, lng] as [number, number]
      );

      const aoiPoly = L.polygon(coords, {
        color: '#10b981', // Emerald green
        weight: 2.5,
        dashArray: '5, 5',
        fillColor: '#10b981',
        fillOpacity: 0.08
      }).addTo(map);

      aoiPoly.bindTooltip(`<b>${selectedAoi.name}</b><br/>Area: ${selectedAoi.area_hectares.toFixed(1)} ha`, {
        sticky: true,
        className: 'font-mono'
      });

      aoiLayerRef.current = aoiPoly;
    }

    // Render Detected Change Polygons for this AOI
    if (eventsLayerGroupRef.current) {
      eventsLayerGroupRef.current.clearLayers();

      const aoiEvents = events.filter(e => e.aoi_id === selectedAoi.id);
      aoiEvents.forEach(evt => {
        if (evt.geojson_geometry && evt.geojson_geometry.coordinates) {
          const polys = evt.geojson_geometry.coordinates;
          polys.forEach((ring: any) => {
            const latLngs = (ring[0] || ring).map(([lng, lat]: [number, number]) => [lat, lng]);
            
            const color = evt.category === 'WATER_EXPANSION' ? '#0d9488' : '#d97706'; // Teal for water, Amber for vegetation loss
            
            const eventPoly = L.polygon(latLngs, {
              color: color,
              weight: 2,
              fillColor: color,
              fillOpacity: 0.35
            });

            eventPoly.bindPopup(`
              <div style="font-family: var(--font-sans); min-width: 200px;">
                <div style="font-weight: 700; font-size: 13px; color: ${color}; margin-bottom: 4px;">
                  ${evt.title}
                </div>
                <div style="font-size: 11px; color: #4b5563; margin-bottom: 8px;">
                  ${evt.affected_area_hectares.toFixed(1)} ha affected • Conf: ${Math.round(evt.confidence.overall_detection_confidence * 100)}%
                </div>
                <button id="btn-popup-${evt.id}" style="
                  background: #151920; color: #fff; border: none; padding: 4px 8px;
                  font-size: 11px; border-radius: 4px; cursor: pointer; width: 100%;
                ">
                  Inspect in Review Studio →
                </button>
              </div>
            `);

            eventPoly.on('popupopen', () => {
              const btn = document.getElementById(`btn-popup-${evt.id}`);
              if (btn) {
                btn.onclick = () => onOpenEventReview(evt);
              }
            });

            eventsLayerGroupRef.current?.addLayer(eventPoly);
          });
        }
      });
    }
  }, [selectedAoi, events]);

  // Handle Analysis Run with multi-step feedback
  const handleExecute = async () => {
    setIsAnalyzing(true);
    setAnalysisStep('Querying Sentinel-2 MSI catalog & cloud masking...');
    
    await new Promise(r => setTimeout(r, 600));
    setAnalysisStep('Calculating multi-spectral NDVI & NDWI rasters...');

    await new Promise(r => setTimeout(r, 600));
    setAnalysisStep('Running OpenCV morphology & connected components...');

    await new Promise(r => setTimeout(r, 500));
    setAnalysisStep('Vectorizing polygons & scoring 4-factor confidence...');

    await onRunAnalysis({
      aoi_id: selectedAoi.id,
      baseline_date: baselineDate,
      recent_date: recentDate,
      vegetation_loss_threshold: threshold,
      min_area_hectares: minAreaHa,
      cloud_mask_strictness: 0.25,
      priority_level: 'STANDARD'
    });

    setIsAnalyzing(false);
    setAnalysisStep('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 65px)', position: 'relative' }}>
      {/* Top GIS Control Ribbon */}
      <div
        style={{
          padding: '12px 20px',
          backgroundColor: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
          zIndex: 500
        }}
      >
        {/* Left: AOI Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>
              Area of Interest (AOI):
            </span>
            <select
              value={selectedAoi.id}
              onChange={e => {
                const found = aois.find(a => a.id === e.target.value);
                if (found) onSelectAoi(found);
              }}
              style={{
                padding: '6px 12px',
                fontSize: '13px',
                fontWeight: 600,
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-strong)',
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

          {/* Temporal Range */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>
                Baseline Date:
              </span>
              <input
                type="date"
                value={baselineDate}
                onChange={e => setBaselineDate(e.target.value)}
                style={{
                  padding: '5px 8px',
                  fontSize: '12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-subtle)'
                }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>
                Recent Date:
              </span>
              <input
                type="date"
                value={recentDate}
                onChange={e => setRecentDate(e.target.value)}
                style={{
                  padding: '5px 8px',
                  fontSize: '12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-subtle)'
                }}
              />
            </div>
          </div>
        </div>

        {/* Center: Detection Parameters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: '130px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600 }}>
              <span style={{ color: 'var(--text-muted)' }}>ΔNDVI Cutoff:</span>
              <span className="font-mono" style={{ color: 'var(--amber-500)' }}>{threshold.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="-0.50"
              max="-0.10"
              step="0.05"
              value={threshold}
              onChange={e => setThreshold(parseFloat(e.target.value))}
              style={{ accentColor: 'var(--amber-500)', cursor: 'pointer', height: '4px' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', minWidth: '110px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600 }}>
              <span style={{ color: 'var(--text-muted)' }}>Min Area:</span>
              <span className="font-mono" style={{ color: 'var(--emerald-500)' }}>{minAreaHa.toFixed(1)} ha</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="5.0"
              step="0.5"
              value={minAreaHa}
              onChange={e => setMinAreaHa(parseFloat(e.target.value))}
              style={{ accentColor: 'var(--emerald-500)', cursor: 'pointer', height: '4px' }}
            />
          </div>
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleExecute}
            disabled={isAnalyzing}
            className="btn btn-primary"
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              backgroundColor: isAnalyzing ? 'var(--bg-elevated)' : 'var(--emerald-600)'
            }}
          >
            {isAnalyzing ? (
              <>
                <RefreshCw size={15} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Play size={15} />
                <span>Run Change Detection</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Analysis Progress Banner */}
      {isAnalyzing && (
        <div
          style={{
            position: 'absolute',
            top: '75px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--emerald-500)',
            borderRadius: 'var(--radius-lg)',
            padding: '12px 20px',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: 'var(--emerald-500)',
              boxShadow: '0 0 8px var(--emerald-500)'
            }}
          />
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {analysisStep}
          </span>
        </div>
      )}

      {/* Map Element */}
      <div ref={mapContainerRef} style={{ flex: 1, width: '100%', position: 'relative' }} />

      {/* Bottom Coordinate & Telemetry Bar */}
      <CoordinateBar
        cursorLat={cursorCoords?.lat ?? null}
        cursorLng={cursorCoords?.lng ?? null}
        zoom={zoomLevel}
        selectedAoiName={selectedAoi.name}
        selectedAoiArea={selectedAoi.area_hectares}
        basemap={basemap}
        onBasemapChange={setBasemap}
      />
    </div>
  );
};
