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
  ChevronLeft,
  Info,
  MapPin,
  Search,
  Maximize2,
  BarChart2,
  AlertTriangle,
  Eye,
  ShieldCheck,
  Activity,
  Filter,
  CheckCircle
} from 'lucide-react';

interface MapWorkspaceProps {
  aois: AOI[];
  events: ChangeEvent[];
  selectedAoi: AOI;
  onSelectAoi: (aoi: AOI) => void;
  onRunAnalysis: (params: AnalysisRunParams) => Promise<void>;
  onOpenEventReview: (event: ChangeEvent) => void;
  onOpenSwipe?: (event: ChangeEvent) => void;
  onAoiCreated?: (newAoi: AOI) => void;
  activeDrawerTab?: 'sweep' | 'analytics' | 'incidents';
  onDrawerTabChange?: (tab: 'sweep' | 'analytics' | 'incidents') => void;
}

export const MapWorkspace: React.FC<MapWorkspaceProps> = ({
  aois,
  events,
  selectedAoi,
  onSelectAoi,
  onRunAnalysis,
  onOpenEventReview,
  onOpenSwipe,
  onAoiCreated,
  activeDrawerTab,
  onDrawerTabChange
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const aoiLayerRef = useRef<L.Polygon | null>(null);
  const eventsLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const drawLayerGroupRef = useRef<L.LayerGroup | null>(null);

  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(selectedAoi?.zoom || 13);
  const [basemap, setBasemap] = useState<string>('satellite');

  // Drawer & Panel Visibility
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [showObsDrawer, setShowObsDrawer] = useState<boolean>(false);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string>('');

  // Observations for selected AOI
  const [observations, setObservations] = useState<SatelliteObservation[]>([]);

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

  // Google Maps Panel Tab & Incident Filters
  const [drawerTab, setDrawerTab] = useState<'sweep' | 'analytics' | 'incidents'>(activeDrawerTab || 'sweep');
  const [incidentSearch, setIncidentSearch] = useState<string>('');
  const [incidentCategoryFilter, setIncidentCategoryFilter] = useState<string>('ALL');
  const [incidentStatusFilter, setIncidentStatusFilter] = useState<string>('ALL');

  useEffect(() => {
    if (activeDrawerTab) {
      setDrawerTab(activeDrawerTab);
      setIsSidebarOpen(true);
    }
  }, [activeDrawerTab]);

  const handleTabSwitch = (tab: 'sweep' | 'analytics' | 'incidents') => {
    setDrawerTab(tab);
    if (onDrawerTabChange) onDrawerTabChange(tab);
  };

  const flyToEvent = (evt: ChangeEvent) => {
    if (!mapInstanceRef.current || !evt.geojson_geometry?.coordinates) return;
    try {
      const coords = evt.geojson_geometry.coordinates;
      const ring = Array.isArray(coords[0][0]) ? coords[0] : coords;
      const lats = ring.map((c: any) => c[1]);
      const lngs = ring.map((c: any) => c[0]);
      const centerLat = lats.reduce((a: number, b: number) => a + b, 0) / lats.length;
      const centerLng = lngs.reduce((a: number, b: number) => a + b, 0) / lngs.length;
      mapInstanceRef.current.flyTo([centerLat, centerLng], 15, { duration: 1.2 });
    } catch (err) {
      console.error('Failed to fly to event:', err);
    }
  };

  // Basemap URLs
  const basemapUrls: Record<string, { url: string; attribution: string }> = {
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Esri, Maxar, Earthstar Geographics'
    },
    'carto-light': {
      url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; OpenStreetMap &copy; CARTO'
    },
    'carto-dark': {
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; OpenStreetMap &copy; CARTO'
    },
    osm: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; OpenStreetMap contributors'
    }
  };

  // Load observations when selected AOI changes
  useEffect(() => {
    if (!selectedAoi) return;
    const fetchObs = async () => {
      try {
        const obs = await ApiService.getObservations(selectedAoi.id);
        setObservations(obs);
        if (obs && obs.length >= 2) {
          setRecentDate(obs[0].acquisition_date);
          setBaselineDate(obs[obs.length - 1].acquisition_date);
        }
      } catch (e) {
        console.error('Failed to load observations:', e);
      }
    };
    fetchObs();
  }, [selectedAoi]);

  // Spherical Shoelace for Area Calculation
  const calculateAreaHectares = (points: [number, number][]): number => {
    if (points.length < 3) return 0;
    const rad = Math.PI / 180;
    const R = 6378137;
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      const p1 = points[i];
      const p2 = points[j];
      area += (p2[1] * rad - p1[1] * rad) * (2 + Math.sin(p1[0] * rad) + Math.sin(p2[0] * rad));
    }
    area = Math.abs((area * R * R) / 2.0);
    return Math.round((area / 10000) * 10) / 10;
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const initialCenter = selectedAoi?.center || [22.825, 82.685];
    const initialZoom = selectedAoi?.zoom || 13;

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
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

  // Update Basemap
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    const { url, attribution } = basemapUrls[basemap];
    tileLayerRef.current.setUrl(url);
  }, [basemap]);

  // Click handler for drawing AOI points
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

  // Render Drawing Preview
  useEffect(() => {
    if (!drawLayerGroupRef.current) return;
    drawLayerGroupRef.current.clearLayers();

    if (drawnPoints.length > 0) {
      drawnPoints.forEach(([lat, lng]) => {
        const marker = L.circleMarker([lat, lng], {
          radius: 5,
          color: '#ffffff',
          fillColor: '#1a73e8',
          fillOpacity: 1,
          weight: 2
        });
        drawLayerGroupRef.current?.addLayer(marker);
      });

      if (drawnPoints.length > 1) {
        const poly = L.polygon(drawnPoints, {
          color: '#1a73e8',
          weight: 2,
          dashArray: '4, 4',
          fillColor: '#1a73e8',
          fillOpacity: 0.15
        });
        drawLayerGroupRef.current?.addLayer(poly);
      }
    }
  }, [drawnPoints]);

  // Render AOI and Events on Map
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedAoi) return;
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
        color: '#1e8e3e',
        weight: 2.5,
        dashArray: '6, 4',
        fillColor: '#1e8e3e',
        fillOpacity: 0.08
      }).addTo(map);

      aoiPoly.bindTooltip(`<b>${selectedAoi.name}</b><br/>Area: ${selectedAoi.area_hectares.toFixed(1)} ha`, {
        sticky: true
      });

      aoiLayerRef.current = aoiPoly;
    }

    // Render Change Event Polygons
    if (eventsLayerGroupRef.current) {
      eventsLayerGroupRef.current.clearLayers();

      const aoiEvents = events.filter(e => e.aoi_id === selectedAoi.id);
      aoiEvents.forEach(evt => {
        if (evt.geojson_geometry && evt.geojson_geometry.coordinates) {
          const polys = evt.geojson_geometry.coordinates;
          polys.forEach((ring: any) => {
            const latLngs = (ring[0] || ring).map(([lng, lat]: [number, number]) => [lat, lng]);
            const color = evt.category === 'WATER_EXPANSION' ? '#007b83' : '#e37426';

            const eventPoly = L.polygon(latLngs, {
              color: color,
              weight: 2.5,
              fillColor: color,
              fillOpacity: 0.4
            });

            eventPoly.bindPopup(`
              <div style="font-family: var(--font-sans); min-width: 230px; padding: 4px;">
                <div style="font-weight: 700; font-size: 13px; color: ${color}; margin-bottom: 4px;">
                  ${evt.title}
                </div>
                <div style="font-size: 12px; color: #5f6368; margin-bottom: 8px;">
                  ${evt.affected_area_hectares.toFixed(1)} ha • Conf: ${Math.round(evt.confidence.overall_detection_confidence * 100)}%
                </div>
                <div style="display: flex; gap: 6px;">
                  <button id="btn-popup-swipe-${evt.id}" style="
                    background: #1a73e8; color: #fff; border: none; padding: 6px 10px;
                    font-size: 11px; border-radius: 16px; cursor: pointer; flex: 1; font-weight: 600;
                  ">
                    🔍 Swipe
                  </button>
                  <button id="btn-popup-review-${evt.id}" style="
                    background: #f1f3f4; color: #202124; border: 1px solid #dadce0; padding: 6px 10px;
                    font-size: 11px; border-radius: 16px; cursor: pointer; flex: 1; font-weight: 600;
                  ">
                    🛡️ Verify
                  </button>
                </div>
              </div>
            `);

            eventPoly.on('popupopen', () => {
              const swipeBtn = document.getElementById(`btn-popup-swipe-${evt.id}`);
              if (swipeBtn && onOpenSwipe) {
                swipeBtn.onclick = () => onOpenSwipe(evt);
              }
              const reviewBtn = document.getElementById(`btn-popup-review-${evt.id}`);
              if (reviewBtn) {
                reviewBtn.onclick = () => onOpenEventReview(evt);
              }
            });

            eventsLayerGroupRef.current?.addLayer(eventPoly);
          });
        }
      });
    }
  }, [selectedAoi, events]);

  // Execute Analysis
  const handleExecute = async () => {
    if (!selectedAoi) return;
    setIsAnalyzing(true);
    setAnalysisStep('Querying Sentinel-2 MSI catalogue & cloud masking...');

    await new Promise(r => setTimeout(r, 600));
    setAnalysisStep('Computing multi-spectral NDVI & NDWI rasters...');

    await new Promise(r => setTimeout(r, 600));
    setAnalysisStep('Running OpenCV morphology & contour extraction...');

    await new Promise(r => setTimeout(r, 500));
    setAnalysisStep('Scoring 4-factor confidence & vectorizing...');

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

  // Save Drawn AOI
  const handleSaveDrawnAoi = async () => {
    if (drawnPoints.length < 3) return;
    const areaHa = calculateAreaHectares(drawnPoints);
    const coords = drawnPoints.map(([lat, lng]) => [lng, lat]);
    coords.push(coords[0]);

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

  // Handle File Upload
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
          name: file.name.replace(/\.[^/.]+$/, ''),
          category: 'VEGETATION_LOSS',
          area_hectares: areaHa || 100.0,
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
        setUploadError(err.message || 'Failed to parse GeoJSON file');
      }
    };
    reader.readAsText(file);
  };

  const aoiEvents = events.filter(e => e.aoi_id === selectedAoi?.id);
  const totalMonitoredHectares = aois.reduce((acc, a) => acc + a.area_hectares, 0);
  const totalAffectedHectares = events.reduce((acc, e) => acc + e.affected_area_hectares, 0);
  const verifiedCount = events.filter(e => e.review_status === 'VERIFIED').length;
  const avgConfidence = events.length > 0
    ? `${Math.round((events.reduce((acc, e) => acc + e.confidence.overall_detection_confidence, 0) / events.length) * 100)}%`
    : '--';

  const filteredEvents = events.filter(e => {
    const matchesSearch =
      e.title.toLowerCase().includes(incidentSearch.toLowerCase()) ||
      e.aoi_name.toLowerCase().includes(incidentSearch.toLowerCase()) ||
      e.category.toLowerCase().includes(incidentSearch.toLowerCase());
    const matchesCategory = incidentCategoryFilter === 'ALL' || e.category === incidentCategoryFilter;
    const matchesStatus = incidentStatusFilter === 'ALL' || e.review_status === incidentStatusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div style={{ position: 'relative', width: '100%', height: 'calc(100vh - 65px)', overflow: 'hidden' }}>
      {/* Full-bleed Leaflet Map */}
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

      {/* Floating Google Maps Style Left Control Drawer */}
      <div
        className="floating-panel"
        style={{
          position: 'absolute',
          top: '16px',
          left: isSidebarOpen ? '16px' : '-440px',
          width: '420px',
          maxHeight: 'calc(100% - 70px)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 900,
          transition: 'left 250ms cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-floating)',
          border: '1px solid var(--border-subtle)'
        }}
      >
        {/* Drawer Header & Quick AOI Selector */}
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={18} style={{ color: 'var(--primary-500)' }} />
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Satellite GIS Platform
              </h2>
            </div>
            <span className="badge badge-emerald font-mono">{aois.length} AOIs Active</span>
          </div>

          {/* Quick AOI Selector Dropdown */}
          <select
            value={selectedAoi?.id || ''}
            onChange={e => {
              const match = aois.find(a => a.id === e.target.value);
              if (match) onSelectAoi(match);
            }}
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: '13px',
              fontWeight: 600,
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-subtle)',
              outline: 'none',
              cursor: 'pointer',
              marginBottom: '12px'
            }}
          >
            {aois.map(a => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.area_hectares.toFixed(0)} ha)
              </option>
            ))}
          </select>

          {/* Google Material 3-Tab Pill Switcher */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => handleTabSwitch('sweep')}
              className={`btn btn-sm ${drawerTab === 'sweep' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, fontSize: '11px', padding: '6px 8px' }}
            >
              <Sliders size={13} />
              <span>Surveillance</span>
            </button>
            <button
              onClick={() => handleTabSwitch('analytics')}
              className={`btn btn-sm ${drawerTab === 'analytics' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, fontSize: '11px', padding: '6px 8px' }}
            >
              <BarChart2 size={13} />
              <span>Analytics</span>
            </button>
            <button
              onClick={() => handleTabSwitch('incidents')}
              className={`btn btn-sm ${drawerTab === 'incidents' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, fontSize: '11px', padding: '6px 8px' }}
            >
              <AlertTriangle size={13} />
              <span>Incidents ({events.length})</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Surveillance & Detection Sweep */}
        {drawerTab === 'sweep' && (
          <div style={{ padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {selectedAoi && (
              <div className="card" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {selectedAoi.name}
                  </span>
                  <button
                    onClick={() => mapInstanceRef.current?.setView(selectedAoi.center, selectedAoi.zoom)}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '10px', padding: '2px 8px' }}
                    title="Center map on AOI"
                  >
                    Center Map
                  </button>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {selectedAoi.description || 'Continuous Sentinel-2 MSI multi-spectral surface surveillance.'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
                  <span className="badge badge-neutral font-mono">Area: {selectedAoi.area_hectares.toFixed(1)} ha</span>
                  <span className="badge badge-amber font-mono">
                    {aoiEvents.length > 0 ? `${aoiEvents.length} Anomalies` : 'Clean Pass'}
                  </span>
                </div>
              </div>
            )}

            {/* Sentinel-2 Re-scan Parameters */}
            <div style={{ padding: '14px', backgroundColor: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.04em' }}>
                Sentinel-2 Detection Sweep
              </span>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)' }}>Baseline Pass:</label>
                  <input
                    type="date"
                    value={baselineDate}
                    onChange={e => setBaselineDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '4px 6px',
                      fontSize: '11px',
                      borderRadius: 'var(--radius-xs)',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: 'var(--bg-surface)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)' }}>Recent Pass:</label>
                  <input
                    type="date"
                    value={recentDate}
                    onChange={e => setRecentDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '4px 6px',
                      fontSize: '11px',
                      borderRadius: 'var(--radius-xs)',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: 'var(--bg-surface)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>ΔNDVI Threshold Sensitivity:</span>
                <span className="font-mono" style={{ fontWeight: 700, color: 'var(--amber-500)' }}>{threshold.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="-0.50"
                max="-0.10"
                step="0.05"
                value={threshold}
                onChange={e => setThreshold(parseFloat(e.target.value))}
                style={{ accentColor: 'var(--primary-500)', cursor: 'pointer', height: '4px' }}
              />

              <button
                onClick={handleExecute}
                disabled={isAnalyzing || isDrawingAoi}
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '4px' }}
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Processing OpenCV Sweep...</span>
                  </>
                ) : (
                  <>
                    <Play size={14} />
                    <span>Run Detection Sweep</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Boundary Tools */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                onClick={() => {
                  setIsDrawingAoi(!isDrawingAoi);
                  setDrawnPoints([]);
                }}
                className={`btn btn-sm ${isDrawingAoi ? 'btn-amber' : 'btn-secondary'}`}
                style={{ width: '100%', fontSize: '11px', gap: '4px' }}
              >
                <Edit3 size={13} />
                <span>{isDrawingAoi ? 'Cancel Draw' : 'Draw Polygon'}</span>
              </button>

              <button
                onClick={() => setShowUploadModal(true)}
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', fontSize: '11px', gap: '4px' }}
              >
                <UploadCloud size={13} />
                <span>Import GeoJSON</span>
              </button>
            </div>

            {/* Recent Detected Events in this AOI */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Detected Disturbances ({aoiEvents.length})
                </span>
              </div>

              {aoiEvents.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '11px', backgroundColor: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
                  No active anomalies detected in this AOI. Run a sweep above to analyze.
                </div>
              ) : (
                aoiEvents.map(evt => (
                  <div
                    key={evt.id}
                    className="card"
                    style={{
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-card)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px'
                    }}
                  >
                    <div
                      onClick={() => flyToEvent(evt)}
                      style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                    >
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {evt.title}
                      </span>
                      <span className="badge badge-amber font-mono" style={{ fontSize: '9px' }}>
                        {evt.affected_area_hectares.toFixed(1)} ha
                      </span>
                    </div>

                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {evt.recent_date} • Conf: {Math.round(evt.confidence.overall_detection_confidence * 100)}%
                    </div>

                    <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                      {onOpenSwipe && (
                        <button
                          onClick={() => onOpenSwipe(evt)}
                          className="btn btn-primary btn-sm"
                          style={{ flex: 1, fontSize: '10px', padding: '4px 6px' }}
                        >
                          <Eye size={11} />
                          <span>Swipe</span>
                        </button>
                      )}
                      <button
                        onClick={() => onOpenEventReview(evt)}
                        className="btn btn-secondary btn-sm"
                        style={{ flex: 1, fontSize: '10px', padding: '4px 6px' }}
                      >
                        <ShieldCheck size={11} />
                        <span>Verify</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Analytics & Metrics */}
        {drawerTab === 'analytics' && (
          <div style={{ padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="card" style={{ padding: '12px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>Monitored Territory</span>
                <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--emerald-600)', display: 'block', marginTop: '2px' }}>
                  {Math.round(totalMonitoredHectares).toLocaleString()} ha
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{(totalMonitoredHectares / 100).toFixed(1)} km² total</span>
              </div>

              <div className="card" style={{ padding: '12px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>Protected AOIs</span>
                <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary-500)', display: 'block', marginTop: '2px' }}>
                  {aois.length} Regions
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Sentinel-2 10m L2A</span>
              </div>

              <div className="card" style={{ padding: '12px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>Disturbance Area</span>
                <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--amber-500)', display: 'block', marginTop: '2px' }}>
                  {totalAffectedHectares.toFixed(1)} ha
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{events.length} physical clusters</span>
              </div>

              <div className="card" style={{ padding: '12px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>Verified Ground Truth</span>
                <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--teal-500)', display: 'block', marginTop: '2px' }}>
                  {verifiedCount} / {events.length}
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  {events.length > 0 ? `${Math.round((verifiedCount / events.length) * 100)}% verified` : '0%'}
                </span>
              </div>
            </div>

            <div className="card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Mean Composite Confidence
                </span>
                <span className="badge badge-teal font-mono">{avgConfidence}</span>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                Calculated via 4-Factor Engine: Spectral Magnitude, Spatial Coherence, Temporal Persistence, and Cloud Mask Integrity.
              </p>
            </div>

            {/* Disturbance Distribution Breakdown */}
            <div className="card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Disturbance Classification
              </span>
              <div
                style={{
                  display: 'flex',
                  height: '10px',
                  borderRadius: 'var(--radius-full)',
                  overflow: 'hidden',
                  backgroundColor: 'var(--bg-elevated)'
                }}
              >
                {['VEGETATION_LOSS', 'WATER_EXPANSION', 'WATER_SHRINKAGE', 'BARE_SOIL_EXPANSION'].map(cat => {
                  const catArea = events.filter(e => e.category === cat).reduce((acc, e) => acc + e.affected_area_hectares, 0);
                  const pct = totalAffectedHectares > 0 ? (catArea / totalAffectedHectares) * 100 : 0;
                  const color = cat === 'WATER_EXPANSION' ? '#007b83' : cat === 'WATER_SHRINKAGE' ? '#e37426' : '#1e8e3e';
                  if (pct === 0) return null;
                  return <div key={cat} style={{ width: `${pct}%`, backgroundColor: color }} title={`${cat}: ${catArea.toFixed(1)} ha`} />;
                })}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', marginTop: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>🌲 Vegetation Loss:</span>
                  <span className="font-mono" style={{ fontWeight: 600 }}>
                    {events.filter(e => e.category === 'VEGETATION_LOSS').reduce((acc, e) => acc + e.affected_area_hectares, 0).toFixed(1)} ha
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>🌊 Water Expansion / Flood:</span>
                  <span className="font-mono" style={{ fontWeight: 600 }}>
                    {events.filter(e => e.category === 'WATER_EXPANSION').reduce((acc, e) => acc + e.affected_area_hectares, 0).toFixed(1)} ha
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>🏜️ Water Shrinkage:</span>
                  <span className="font-mono" style={{ fontWeight: 600 }}>
                    {events.filter(e => e.category === 'WATER_SHRINKAGE').reduce((acc, e) => acc + e.affected_area_hectares, 0).toFixed(1)} ha
                  </span>
                </div>
              </div>
            </div>

            {/* Platform Specifications */}
            <div style={{ padding: '12px', backgroundColor: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Satellite Telemetry Specifications</div>
              <div>Optical Sensor: <b>Sentinel-2 MSI (10m L2A BOA)</b></div>
              <div>Spectral Bands: <b>B04 (Red), B08 (NIR), B03 (Green), B11 (SWIR)</b></div>
              <div>Facilitator Engine: <b>AlgoKit x402 Micropayments Live</b></div>
            </div>
          </div>
        )}

        {/* Tab 3: All Detected Incidents */}
        {drawerTab === 'incidents' && (
          <div style={{ padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Search Input */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 10px',
                backgroundColor: 'var(--bg-elevated)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <Search size={14} style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                value={incidentSearch}
                onChange={e => setIncidentSearch(e.target.value)}
                placeholder="Search events, AOI, title..."
                style={{
                  border: 'none',
                  backgroundColor: 'transparent',
                  outline: 'none',
                  fontSize: '12px',
                  width: '100%',
                  color: 'var(--text-primary)'
                }}
              />
            </div>

            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {['ALL', 'VEGETATION_LOSS', 'WATER_EXPANSION', 'WATER_SHRINKAGE'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setIncidentCategoryFilter(cat)}
                  style={{
                    padding: '3px 8px',
                    fontSize: '10px',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    backgroundColor: incidentCategoryFilter === cat ? 'var(--primary-bg)' : 'var(--bg-surface)',
                    color: incidentCategoryFilter === cat ? 'var(--primary-500)' : 'var(--text-secondary)',
                    fontWeight: incidentCategoryFilter === cat ? 700 : 500
                  }}
                >
                  {cat === 'ALL' ? 'All Types' : cat.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* Incident Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredEvents.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                  No matching anomaly events found.
                </div>
              ) : (
                filteredEvents.map(evt => (
                  <div
                    key={evt.id}
                    className="card"
                    style={{
                      padding: '12px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-card)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div
                      onClick={() => flyToEvent(evt)}
                      style={{ cursor: 'pointer', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}
                    >
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {evt.title}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {evt.aoi_name} • {evt.recent_date}
                        </div>
                      </div>
                      <span className="badge badge-amber font-mono" style={{ fontSize: '10px' }}>
                        {evt.affected_area_hectares.toFixed(1)} ha
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        Confidence: <b>{Math.round(evt.confidence.overall_detection_confidence * 100)}%</b>
                      </span>
                      <span className={`badge ${evt.review_status === 'VERIFIED' ? 'badge-emerald' : 'badge-neutral'}`} style={{ fontSize: '10px' }}>
                        {evt.review_status}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                      <button
                        onClick={() => flyToEvent(evt)}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '10px', padding: '4px 8px' }}
                      >
                        <Crosshair size={11} />
                        <span>Locate</span>
                      </button>
                      {onOpenSwipe && (
                        <button
                          onClick={() => onOpenSwipe(evt)}
                          className="btn btn-primary btn-sm"
                          style={{ flex: 1, fontSize: '10px', padding: '4px 8px' }}
                        >
                          <Eye size={11} />
                          <span>Swipe Compare</span>
                        </button>
                      )}
                      <button
                        onClick={() => onOpenEventReview(evt)}
                        className="btn btn-secondary btn-sm"
                        style={{ flex: 1, fontSize: '10px', padding: '4px 8px' }}
                      >
                        <ShieldCheck size={11} />
                        <span>Verify</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Floating Toggle Drawer Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        style={{
          position: 'absolute',
          top: '24px',
          left: isSidebarOpen ? '446px' : '16px',
          zIndex: 910,
          width: '32px',
          height: '32px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'var(--text-primary)',
          transition: 'left 250ms cubic-bezier(0.4, 0, 0.2, 1)'
        }}
        title={isSidebarOpen ? 'Collapse panel' : 'Expand panel'}
      >
        {isSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>

      {/* Drawing Mode floating notification */}
      {isDrawingAoi && (
        <div
          className="floating-panel"
          style={{
            position: 'absolute',
            top: '16px',
            right: '60px',
            zIndex: 900,
            padding: '16px',
            width: '280px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Edit3 size={16} style={{ color: 'var(--primary-500)' }} />
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Drawing Custom Boundary
            </span>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>
            Click on map to place polygon points. Points placed: <b>{drawnPoints.length}</b>
          </p>

          <input
            type="text"
            value={customAoiName}
            onChange={e => setCustomAoiName(e.target.value)}
            placeholder="AOI Name"
            style={{
              padding: '6px 10px',
              fontSize: '12px',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-primary)'
            }}
          />

          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary-500)' }} className="font-mono">
            Calculated: {calculateAreaHectares(drawnPoints).toFixed(1)} ha
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={handleSaveDrawnAoi}
              disabled={drawnPoints.length < 3}
              className="btn btn-primary btn-sm"
              style={{ flex: 1 }}
            >
              Save AOI
            </button>
            <button
              onClick={() => {
                setIsDrawingAoi(false);
                setDrawnPoints([]);
              }}
              className="btn btn-secondary btn-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Upload GeoJSON Boundary Modal */}
      {showUploadModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UploadCloud size={20} style={{ color: 'var(--primary-500)' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Import GeoJSON Boundary
                </h3>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Upload WGS84 GeoJSON / KML polygon coordinates to create a monitored surveillance boundary.
            </p>

            <div
              style={{
                border: '2px dashed var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '24px 16px',
                textAlign: 'center',
                backgroundColor: 'var(--bg-elevated)',
                cursor: 'pointer'
              }}
            >
              <input
                type="file"
                accept=".geojson,.json,.kml"
                onChange={handleFileUpload}
                id="geojson-upload-input"
                style={{ display: 'none' }}
              />
              <label htmlFor="geojson-upload-input" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <UploadCloud size={28} style={{ color: 'var(--primary-500)' }} />
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Click to select file
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Supports .geojson, .json
                </span>
              </label>
            </div>

            {uploadError && (
              <div style={{ fontSize: '11px', color: 'var(--crimson-500)', marginTop: '10px' }}>
                {uploadError}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Analysis Progress Pill */}
      {isAnalyzing && (
        <div
          className="floating-panel"
          style={{
            position: 'absolute',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            padding: '10px 20px',
            borderRadius: 'var(--radius-full)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: 'var(--shadow-floating)'
          }}
        >
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-500)',
              animation: 'pulse 1.5s infinite'
            }}
          />
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {analysisStep}
          </span>
        </div>
      )}

      {/* Bottom Coordinate Bar */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 800 }}>
        <CoordinateBar
          cursorLat={cursorCoords?.lat ?? null}
          cursorLng={cursorCoords?.lng ?? null}
          zoom={zoomLevel}
          selectedAoiName={selectedAoi?.name || 'Global View'}
          selectedAoiArea={selectedAoi?.area_hectares || 0}
          basemap={basemap}
          onBasemapChange={setBasemap}
        />
      </div>
    </div>
  );
};
