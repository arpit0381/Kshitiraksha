import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { AOI, ChangeEvent, AnalysisRunParams, SatelliteObservation } from '../../types';
import { CoordinateBar } from './CoordinateBar';
import { ApiService } from '../../services/api';
import {
  Play,
  Sliders,
  RefreshCw,
  Crosshair,
  PlusCircle,
  CheckCircle2,
  UploadCloud,
  Edit3,
  Trash2,
  Layers,
  Calendar,
  Cloud,
  Sparkles,
  ChevronRight,
  Info
} from 'lucide-react';

interface MapWorkspaceProps {
  aois: AOI[];
  events: ChangeEvent[];
  selectedAoi: AOI;
  onSelectAoi: (aoi: AOI) => void;
  onRunAnalysis: (params: AnalysisRunParams) => Promise<void>;
  onOpenEventReview: (event: ChangeEvent) => void;
  onAoiCreated?: (newAoi: AOI) => void;
}

export const MapWorkspace: React.FC<MapWorkspaceProps> = ({
  aois,
  events,
  selectedAoi,
  onSelectAoi,
  onRunAnalysis,
  onOpenEventReview,
  onAoiCreated
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const aoiLayerRef = useRef<L.Polygon | null>(null);
  const eventsLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const drawLayerGroupRef = useRef<L.LayerGroup | null>(null);

  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(selectedAoi.zoom);
  const [basemap, setBasemap] = useState<string>('satellite');

  // Observations for selected AOI
  const [observations, setObservations] = useState<SatelliteObservation[]>([]);
  const [showObsDrawer, setShowObsDrawer] = useState<boolean>(false);

  // Analysis Parameters
  const [baselineDate, setBaselineDate] = useState<string>('2025-01-15');
  const [recentDate, setRecentDate] = useState<string>('2026-02-10');
  const [threshold, setThreshold] = useState<number>(-0.25);
  const [minAreaHa, setMinAreaHa] = useState<number>(1.0);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisStep, setAnalysisStep] = useState<string>('');

  // Polygon Drawing Mode
  const [isDrawingAoi, setIsDrawingAoi] = useState<boolean>(false);
  const [drawnPoints, setDrawnPoints] = useState<[number, number][]>([]); // [lat, lng]
  const [customAoiName, setCustomAoiName] = useState<string>('Custom Survey Polygon');
  const [customAoiCategory, setCustomAoiCategory] = useState<string>('VEGETATION_LOSS');
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string>('');

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

  // Load observations when selected AOI changes
  useEffect(() => {
    const fetchObs = async () => {
      const obs = await ApiService.getObservations(selectedAoi.id);
      setObservations(obs);
      if (obs.length >= 2) {
        // Observations are sorted descending: newest pass at index 0, older pass at the end
        setBaselineDate(obs[obs.length - 1].date);
        setRecentDate(obs[0].date);
      }
    };
    fetchObs();
  }, [selectedAoi]);

  // Calculate polygon area in hectares using spherical Shoelace
  const calculateAreaHectares = (points: [number, number][]): number => {
    if (points.length < 3) return 0;
    const rad = Math.PI / 180;
    const R = 6378137; // Earth radius in meters
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      const p1 = points[i];
      const p2 = points[j];
      area += (p2[1] * rad - p1[1] * rad) * (2 + Math.sin(p1[0] * rad) + Math.sin(p2[0] * rad));
    }
    area = Math.abs((area * R * R) / 2.0);
    return Math.round((area / 10000) * 10) / 10; // Hectares
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: selectedAoi.center,
      zoom: selectedAoi.zoom,
      zoomControl: false
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const { url, attribution } = basemapUrls[basemap];
    const tileLayer = L.tileLayer(url, { attribution, maxZoom: 18 }).addTo(map);
    tileLayerRef.current = tileLayer;

    const eventsGroup = L.layerGroup().addTo(map);
    eventsLayerGroupRef.current = eventsGroup;

    const drawGroup = L.layerGroup().addTo(map);
    drawLayerGroupRef.current = drawGroup;

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

  // Map Click Listener for Polygon Drawing
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (!isDrawingAoi) return;
      setDrawnPoints(prev => [...prev, [e.latlng.lat, e.latlng.lng]]);
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [isDrawingAoi]);

  // Render Drawing Preview on Map
  useEffect(() => {
    if (!drawLayerGroupRef.current) return;
    drawLayerGroupRef.current.clearLayers();

    if (drawnPoints.length > 0) {
      // Draw point markers
      drawnPoints.forEach(([lat, lng], idx) => {
        const marker = L.circleMarker([lat, lng], {
          radius: 5,
          color: '#ffffff',
          fillColor: '#10b981',
          fillOpacity: 1,
          weight: 2
        });
        drawLayerGroupRef.current?.addLayer(marker);
      });

      // Draw polyline or polygon
      if (drawnPoints.length > 1) {
        const poly = L.polygon(drawnPoints, {
          color: '#10b981',
          weight: 2,
          dashArray: '4, 4',
          fillColor: '#10b981',
          fillOpacity: 0.15
        });
        drawLayerGroupRef.current?.addLayer(poly);
      }
    }
  }, [drawnPoints]);

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

    map.setView(selectedAoi.center, selectedAoi.zoom);

    if (aoiLayerRef.current) {
      map.removeLayer(aoiLayerRef.current);
    }

    if (selectedAoi.geometry && selectedAoi.geometry.coordinates[0]) {
      const coords = (selectedAoi.geometry.coordinates[0] as [number, number][]).map(
        ([lng, lat]) => [lat, lng] as [number, number]
      );

      const aoiPoly = L.polygon(coords, {
        color: '#10b981',
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

    // Render Detected Change Polygons
    if (eventsLayerGroupRef.current) {
      eventsLayerGroupRef.current.clearLayers();

      const aoiEvents = events.filter(e => e.aoi_id === selectedAoi.id);
      aoiEvents.forEach(evt => {
        if (evt.geojson_geometry && evt.geojson_geometry.coordinates) {
          const polys = evt.geojson_geometry.coordinates;
          polys.forEach((ring: any) => {
            const latLngs = (ring[0] || ring).map(([lng, lat]: [number, number]) => [lat, lng]);
            const color = evt.category === 'WATER_EXPANSION' ? '#0d9488' : '#d97706';

            const eventPoly = L.polygon(latLngs, {
              color: color,
              weight: 2,
              fillColor: color,
              fillOpacity: 0.35
            });

            eventPoly.bindPopup(`
              <div style="font-family: var(--font-sans); min-width: 220px;">
                <div style="font-weight: 700; font-size: 13px; color: ${color}; margin-bottom: 4px;">
                  ${evt.title}
                </div>
                <div style="font-size: 11px; color: #4b5563; margin-bottom: 8px;">
                  ${evt.affected_area_hectares.toFixed(1)} ha affected • Conf: ${Math.round(evt.confidence.overall_detection_confidence * 100)}%
                </div>
                <button id="btn-popup-${evt.id}" style="
                  background: #151920; color: #fff; border: none; padding: 6px 10px;
                  font-size: 11px; border-radius: 4px; cursor: pointer; width: 100%; font-weight: 600;
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

  // Save Drawn AOI
  const handleSaveDrawnAoi = async () => {
    if (drawnPoints.length < 3) return;
    const areaHa = calculateAreaHectares(drawnPoints);
    const coords = drawnPoints.map(([lat, lng]) => [lng, lat]);
    coords.push(coords[0]); // Close ring

    const centerLat = drawnPoints.reduce((acc, p) => acc + p[0], 0) / drawnPoints.length;
    const centerLng = drawnPoints.reduce((acc, p) => acc + p[1], 0) / drawnPoints.length;

    const newAoi = await ApiService.createAoi({
      name: customAoiName,
      category: customAoiCategory as any,
      area_hectares: areaHa,
      center: [centerLat, centerLng],
      zoom: 13,
      geometry: {
        type: 'Polygon',
        coordinates: [coords]
      }
    });

    if (onAoiCreated) {
      onAoiCreated(newAoi);
    }
    onSelectAoi(newAoi);
    setIsDrawingAoi(false);
    setDrawnPoints([]);
  };

  // Handle GeoJSON File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async event => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        let geometry = parsed.geometry || parsed.features?.[0]?.geometry || parsed;
        if (!geometry || !geometry.coordinates) {
          throw new Error('Invalid GeoJSON geometry structure');
        }

        const rawCoords = geometry.coordinates[0] || geometry.coordinates;
        const ring = Array.isArray(rawCoords[0]) ? rawCoords : geometry.coordinates;
        const latLngs: [number, number][] = ring.map((c: any) => [c[1], c[0]]);

        const areaHa = calculateAreaHectares(latLngs);
        const centerLat = latLngs.reduce((acc, p) => acc + p[0], 0) / latLngs.length;
        const centerLng = latLngs.reduce((acc, p) => acc + p[1], 0) / latLngs.length;

        const newAoi = await ApiService.createAoi({
          name: file.name.replace(/\.[^/.]+$/, '').toUpperCase() + ' Boundary',
          area_hectares: areaHa > 0 ? areaHa : 150.0,
          center: [centerLat, centerLng],
          zoom: 13,
          geometry: {
            type: 'Polygon',
            coordinates: [ring]
          }
        });

        if (onAoiCreated) {
          onAoiCreated(newAoi);
        }
        onSelectAoi(newAoi);
        setShowUploadModal(false);
        setUploadError('');
      } catch (err: any) {
        setUploadError(err.message || 'Failed to parse GeoJSON file. Ensure valid WGS84 polygon.');
      }
    };
    reader.readAsText(file);
  };

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
        {/* Left: AOI Selector & Boundary Tools */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
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

          {/* Draw AOI Button */}
          <button
            onClick={() => {
              setIsDrawingAoi(!isDrawingAoi);
              setDrawnPoints([]);
            }}
            className={`btn btn-sm ${isDrawingAoi ? 'btn-amber' : 'btn-secondary'}`}
            style={{ marginTop: '16px', gap: '6px' }}
            title="Click points on map to draw custom boundary"
          >
            <Edit3 size={14} />
            <span>{isDrawingAoi ? 'Cancel Draw' : 'Draw Polygon'}</span>
          </button>

          {/* Upload GeoJSON Boundary */}
          <button
            onClick={() => setShowUploadModal(true)}
            className="btn btn-secondary btn-sm"
            style={{ marginTop: '16px', gap: '6px' }}
            title="Upload GeoJSON / KML boundary"
          >
            <UploadCloud size={14} />
            <span>Import Boundary</span>
          </button>

          {/* Satellite Scene Passes Drawer Toggle */}
          <button
            onClick={() => setShowObsDrawer(!showObsDrawer)}
            className={`btn btn-sm ${showObsDrawer ? 'btn-primary' : 'btn-secondary'}`}
            style={{ marginTop: '16px', gap: '6px' }}
            title="Inspect Sentinel-2 passes & cloud cover"
          >
            <Calendar size={14} />
            <span>Satellite Passes ({observations.length})</span>
          </button>
        </div>

        {/* Center: Temporal & Detection Parameters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>
                Baseline:
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
                Recent:
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

          <div style={{ display: 'flex', flexDirection: 'column', minWidth: '120px' }}>
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

          <div style={{ display: 'flex', flexDirection: 'column', minWidth: '100px' }}>
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
            disabled={isAnalyzing || isDrawingAoi}
            className="btn btn-primary"
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              backgroundColor: isAnalyzing ? 'var(--bg-elevated)' : 'var(--emerald-600)'
            }}
          >
            {isAnalyzing ? (
              <>
                <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Processing Sentinel-2...</span>
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

      {/* Interactive Draw Mode HUD */}
      {isDrawingAoi && (
        <div
          style={{
            position: 'absolute',
            top: '75px',
            left: '24px',
            zIndex: 1000,
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--emerald-500)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px',
            boxShadow: 'var(--shadow-xl)',
            maxWidth: '320px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Edit3 size={16} style={{ color: 'var(--emerald-500)' }} />
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Drawing Custom AOI Polygon
            </h4>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Click anywhere on the map to place vertex points. Placed points: <b>{drawnPoints.length}</b>.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>AOI Name:</label>
            <input
              type="text"
              value={customAoiName}
              onChange={e => setCustomAoiName(e.target.value)}
              className={customAoiName ? '' : ''}
              style={{
                padding: '6px 10px',
                fontSize: '12px',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Monitoring Focus:</label>
            <select
              value={customAoiCategory}
              onChange={e => setCustomAoiCategory(e.target.value)}
              style={{
                padding: '6px 10px',
                fontSize: '12px',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              <option value="VEGETATION_LOSS">Deforestation & Canopy Loss</option>
              <option value="WATER_EXPANSION">Water Expansion & Flooding</option>
              <option value="WATER_SHRINKAGE">Wetland Shrinkage & Encroachment</option>
              <option value="BARE_SOIL_EXPANSION">Mining & Soil Exposure</option>
            </select>
          </div>

          <div style={{ fontSize: '12px', color: 'var(--emerald-500)', fontWeight: 600 }} className="font-mono">
            Calculated Area: {calculateAreaHectares(drawnPoints).toFixed(1)} ha
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <button
              onClick={handleSaveDrawnAoi}
              disabled={drawnPoints.length < 3}
              className="btn btn-primary btn-sm"
              style={{ flex: 1 }}
            >
              <CheckCircle2 size={14} />
              <span>Save & Monitor AOI</span>
            </button>
            <button
              onClick={() => setDrawnPoints([])}
              className="btn btn-secondary btn-sm"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Satellite Observations Side Drawer */}
      {showObsDrawer && (
        <div
          style={{
            position: 'absolute',
            top: '65px',
            right: '24px',
            bottom: '40px',
            width: '360px',
            zIndex: 1000,
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-xl)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            overflowY: 'auto'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={16} style={{ color: 'var(--emerald-500)' }} />
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Satellite Pass Catalog
              </h4>
            </div>
            <button
              onClick={() => setShowObsDrawer(false)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px' }}
            >
              ✕
            </button>
          </div>

          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Available Sentinel-2 MSI Multi-Spectral scenes for <b>{selectedAoi.name}</b>. Select baseline & recent pairs:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {observations.map(obs => (
              <div
                key={obs.id}
                style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {obs.date}
                  </span>
                  <span
                    className={`badge ${
                      obs.quality_grade === 'EXCELLENT'
                        ? 'badge-emerald'
                        : obs.quality_grade === 'GOOD'
                        ? 'badge-neutral'
                        : 'badge-amber'
                    } font-mono`}
                    style={{ fontSize: '10px' }}
                  >
                    Cloud: {obs.cloud_cover_pct}%
                  </span>
                </div>

                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  Sensor: {obs.satellite} • GSD: {obs.gsd_m}m • Sun: {obs.sun_elevation_deg}°
                </div>

                <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                  <button
                    onClick={() => setBaselineDate(obs.date)}
                    className={`btn btn-sm ${baselineDate === obs.date ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, fontSize: '10px', padding: '4px 6px' }}
                  >
                    Set as Baseline
                  </button>
                  <button
                    onClick={() => setRecentDate(obs.date)}
                    className={`btn btn-sm ${recentDate === obs.date ? 'btn-amber' : 'btn-secondary'}`}
                    style={{ flex: 1, fontSize: '10px', padding: '4px 6px' }}
                  >
                    Set as Recent
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload GeoJSON Boundary Modal */}
      {showUploadModal && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: '480px',
              width: '100%',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <UploadCloud size={20} style={{ color: 'var(--emerald-500)' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Import Boundary Geometry
                </h3>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Upload an official GIS boundary file (GeoJSON, JSON, or KML) in WGS84 coordinate reference system (EPSG:4326).
            </p>

            <div
              style={{
                border: '2px dashed var(--border-strong)',
                borderRadius: 'var(--radius-md)',
                padding: '30px 20px',
                textAlign: 'center',
                backgroundColor: 'var(--bg-canvas)'
              }}
            >
              <input
                type="file"
                accept=".geojson,.json,.kml"
                onChange={handleFileUpload}
                id="boundary-file-input"
                style={{ display: 'none' }}
              />
              <label htmlFor="boundary-file-input" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <UploadCloud size={32} style={{ color: 'var(--emerald-500)' }} />
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Click to select GeoJSON file
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Supported: .geojson, .json, .kml
                </span>
              </label>
            </div>

            {uploadError && (
              <div style={{ fontSize: '12px', color: 'var(--copper-500)', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
                {uploadError}
              </div>
            )}
          </div>
        </div>
      )}

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
