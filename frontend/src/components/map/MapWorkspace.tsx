import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { AOI, ChangeEvent, AnalysisRunParams, SatelliteObservation } from '../../types';
import { CoordinateBar } from './CoordinateBar';
import { ApiService } from '../../services/api';
import { AreaSearchBar, SelectedLocation, INDIAN_HOTSPOTS } from './AreaSearchBar';
import { AnalysisFlowModal } from './AnalysisFlowModal';
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
  CheckCircle,
  Columns,
  Globe
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
  onSwitchToGlobe?: () => void;
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
  onDrawerTabChange,
  onSwitchToGlobe
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const aoiLayerRef = useRef<L.Polygon | null>(null);
  const eventsLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const drawLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const lastViewedAoiIdRef = useRef<string | null>(null);

  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(selectedAoi?.zoom || 13);
  const [basemap, setBasemap] = useState<string>('google-hybrid');
  const [changeViewMode, setChangeViewMode] = useState<'OVERLAY' | 'BASELINE' | 'RECENT' | 'BLINK'>('OVERLAY');
  const [blinkState, setBlinkState] = useState<boolean>(true);

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
  const [showFlowModal, setShowFlowModal] = useState<boolean>(false);

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
    'google-hybrid': {
      url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
      attribution: 'Google Maps India (Satellite & Roads)'
    },
    'google-sat': {
      url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
      attribution: 'Google Satellite Imagery'
    },
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Esri, Maxar, Earthstar Geographics'
    },
    osm: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; OpenStreetMap contributors'
    }
  };

  // Blink timer for real change visualization
  useEffect(() => {
    if (changeViewMode !== 'BLINK') {
      setBlinkState(true);
      return;
    }
    const timer = setInterval(() => {
      setBlinkState(prev => !prev);
    }, 650);
    return () => clearInterval(timer);
  }, [changeViewMode]);

  // Load observations when selected AOI changes
  useEffect(() => {
    if (!selectedAoi) return;
    const fetchObs = async () => {
      try {
        const obs = await ApiService.getObservations(selectedAoi.id);
        setObservations(obs);
        if (obs && obs.length >= 2) {
          setRecentDate(obs[0].date || (obs[0] as any).acquisition_date || '2026-02-10');
          setBaselineDate(obs[obs.length - 1].date || (obs[obs.length - 1] as any).acquisition_date || '2025-01-15');
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

  // Initialize Leaflet Map locked to India bounds
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Generous India boundary to prevent edge bouncing while staying within subcontinent
    const indiaBounds = L.latLngBounds([4.0, 65.0], [39.0, 100.0]);

    const initialCenter = selectedAoi?.center || [22.825, 82.685];
    const initialZoom = selectedAoi?.zoom || 13;

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      minZoom: 3,
      maxZoom: 20,
      maxBounds: indiaBounds,
      maxBoundsViscosity: 0.2,
      zoomControl: false
    });

    const { url, attribution } = basemapUrls[basemap] || basemapUrls['google-hybrid'];
    const tileLayer = L.tileLayer(url, { attribution, maxZoom: 20 }).addTo(map);
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

  // Center/View map ONLY when user switches to a DIFFERENT AOI (never resets user's zoom while inspecting!)
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedAoi) return;
    if (lastViewedAoiIdRef.current === selectedAoi.id) return;

    lastViewedAoiIdRef.current = selectedAoi.id;
    mapInstanceRef.current.setView(selectedAoi.center, selectedAoi.zoom || 13);
  }, [selectedAoi?.id]);

  // Update Basemap
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    const { url } = basemapUrls[basemap] || basemapUrls['google-hybrid'];
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

  // Render AOI and Events on Map (without resetting user's zoom/pan)
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedAoi) return;
    const map = mapInstanceRef.current;

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
            const isPristine = changeViewMode === 'BASELINE' || (changeViewMode === 'BLINK' && blinkState);
            const isWater = evt.category === 'WATER_EXPANSION' || evt.category === 'WATER_SHRINKAGE';
            const color = isPristine ? '#10b981' : (isWater ? '#06b6d4' : '#ef4444');
            const fillColor = isPristine ? '#059669' : (isWater ? '#0284c7' : '#dc2626');
            const fillOpacity = changeViewMode === 'RECENT' ? 0.08 : 0.65;
            const weight = isPristine ? 2 : 3.5;
            const dashArray = isPristine ? '3, 3' : '6, 6';

            const eventPoly = L.polygon(latLngs, {
              color: color,
              weight: weight,
              fillColor: fillColor,
              fillOpacity: fillOpacity,
              dashArray: dashArray
            });

            eventPoly.bindPopup(`
              <div style="font-family: var(--font-sans); min-width: 240px; padding: 4px;">
                <div style="font-weight: 700; font-size: 13px; color: ${color}; margin-bottom: 4px;">
                  ${evt.title}
                </div>
                <div style="font-size: 12px; color: #5f6368; margin-bottom: 8px;">
                  Area: <b>${evt.affected_area_hectares.toFixed(1)} ha</b> • Conf: <b>${Math.round(evt.confidence.overall_detection_confidence * 100)}%</b>
                </div>
                <div style="display: flex; gap: 6px;">
                  <button id="btn-popup-swipe-${evt.id}" style="
                    background: #1a73e8; color: #fff; border: none; padding: 6px 12px;
                    font-size: 11px; border-radius: 16px; cursor: pointer; flex: 1; font-weight: 700;
                  ">
                    🔍 Compare Before/After
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
  }, [selectedAoi, events, changeViewMode, blinkState]);

  // Select or Create Searched Location
  const handleLocationSelected = async (loc: SelectedLocation) => {
    // 1. If it's an existing AOI id
    if (loc.isExistingAoiId) {
      const match = aois.find(a => a.id === loc.isExistingAoiId);
      if (match) {
        onSelectAoi(match);
        mapInstanceRef.current?.flyTo(match.center, match.zoom || 13, { duration: 1.2 });
        return;
      }
    }

    // 2. If an AOI with this exact name already exists
    const matchByName = aois.find(a => a.name.toLowerCase() === loc.name.toLowerCase());
    if (matchByName) {
      onSelectAoi(matchByName);
      mapInstanceRef.current?.flyTo(matchByName.center, matchByName.zoom || 13, { duration: 1.2 });
      return;
    }

    // 3. Otherwise create a new AOI around this center (~3km bounding box)
    const dLat = 0.012;
    const dLng = 0.015;
    const [cLat, cLng] = loc.center;
    const coords: [number, number][] = [
      [cLng - dLng, cLat - dLat],
      [cLng + dLng, cLat - dLat],
      [cLng + dLng, cLat + dLat],
      [cLng - dLng, cLat + dLat],
      [cLng - dLng, cLat - dLat]
    ];

    try {
      const newAoi = await ApiService.createAoi({
        name: loc.name,
        category: loc.category,
        area_hectares: loc.area_hectares || 250.0,
        center: loc.center,
        zoom: loc.zoom || 13,
        description: loc.description,
        geometry: {
          type: 'Polygon',
          coordinates: [coords]
        }
      });
      if (onAoiCreated) onAoiCreated(newAoi);
      onSelectAoi(newAoi);
      mapInstanceRef.current?.flyTo(loc.center, loc.zoom || 13, { duration: 1.2 });
    } catch (err) {
      console.warn('Backend AOI creation fallback to client state:', err);
      const fallbackAoi: AOI = {
        id: `aoi-${Date.now()}`,
        name: loc.name,
        description: loc.description,
        category: loc.category,
        area_hectares: loc.area_hectares || 250.0,
        center: loc.center,
        zoom: loc.zoom || 13,
        created_at: new Date().toISOString(),
        active_alerts_count: 0,
        geometry: {
          type: 'Polygon',
          coordinates: [coords]
        }
      };
      if (onAoiCreated) onAoiCreated(fallbackAoi);
      onSelectAoi(fallbackAoi);
      mapInstanceRef.current?.flyTo(loc.center, loc.zoom || 13, { duration: 1.2 });
    }
  };

  // Execute Analysis with Visual Flow Modal
  const handleExecute = () => {
    if (!selectedAoi) return;
    setShowFlowModal(true);
  };

  const handleFlowComplete = async () => {
    setShowFlowModal(false);
    setIsAnalyzing(true);
    setAnalysisStep('Finalizing detection report and disturbance boundary...');
    try {
      await onRunAnalysis({
        aoi_id: selectedAoi.id,
        baseline_date: baselineDate,
        recent_date: recentDate,
        vegetation_loss_threshold: threshold,
        min_area_hectares: minAreaHa,
        cloud_mask_strictness: 0.25,
        priority_level: 'STANDARD'
      });
    } catch (err) {
      console.error('Error running change detection:', err);
    } finally {
      setIsAnalyzing(false);
      setAnalysisStep('');
    }
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

      {/* Floating Top Center Command & Search Bar */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 850,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          width: '92%',
          maxWidth: '840px',
          pointerEvents: 'none'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            width: '100%',
            pointerEvents: 'auto'
          }}
        >
          {/* Universal Area Search */}
          <div style={{ flex: 1 }}>
            <AreaSearchBar
              existingAois={aois}
              selectedAoi={selectedAoi}
              onSelectLocation={handleLocationSelected}
            />
          </div>

          {/* Quick Guided Flow Action Badge */}
          {selectedAoi && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 4px 18px rgba(0, 0, 0, 0.14)',
                border: '1px solid var(--border-subtle)',
                flexShrink: 0
              }}
            >
              <button
                onClick={handleExecute}
                disabled={isAnalyzing || isDrawingAoi}
                className="btn btn-primary btn-sm"
                style={{ gap: '6px', fontWeight: 700 }}
              >
                <Play size={13} />
                <span>Run Change Detection</span>
              </button>

              {aoiEvents.length > 0 && onOpenSwipe && (
                <button
                  onClick={() => onOpenSwipe(aoiEvents[0])}
                  className="btn btn-secondary btn-sm"
                  style={{ gap: '6px' }}
                >
                  <Eye size={13} />
                  <span>Compare ({aoiEvents.length})</span>
                </button>
              )}

              {onSwitchToGlobe && (
                <button
                  onClick={onSwitchToGlobe}
                  className="btn btn-secondary btn-sm"
                  style={{ gap: '6px', fontSize: '11px', fontWeight: 700 }}
                  title="Switch to MapLibre GL 3D Globe WebGL view"
                >
                  <Globe size={13} style={{ color: '#0284c7' }} />
                  <span>🌐 3D Globe</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Quick Hotspot Chips */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            overflowX: 'auto',
            maxWidth: '100%',
            padding: '2px 4px',
            pointerEvents: 'auto'
          }}
        >
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#ffffff', textShadow: '0 1px 3px rgba(0,0,0,0.85)', whiteSpace: 'nowrap' }}>
            Hotspots:
          </span>
          {INDIAN_HOTSPOTS.map((hot, idx) => (
            <button
              key={idx}
              onClick={() => handleLocationSelected(hot)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 10px',
                borderRadius: 'var(--radius-full)',
                fontSize: '11px',
                fontWeight: 600,
                backgroundColor: selectedAoi?.name === hot.name ? 'var(--primary-500)' : 'rgba(255, 255, 255, 0.94)',
                color: selectedAoi?.name === hot.name ? '#ffffff' : '#1f2937',
                border: '1px solid rgba(0,0,0,0.1)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 150ms'
              }}
            >
              <MapPin size={11} style={{ color: selectedAoi?.name === hot.name ? '#ffffff' : 'var(--primary-500)' }} />
              <span>{hot.name.split('&')[0].trim()}</span>
            </button>
          ))}
        </div>

        {/* Real Visible Change Switcher */}
        {aoiEvents.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(15, 23, 42, 0.90)',
              backdropFilter: 'blur(8px)',
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 4px 18px rgba(0,0,0,0.35)',
              pointerEvents: 'auto',
              flexWrap: 'wrap'
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <AlertTriangle size={13} />
              <span>Visible Change:</span>
            </span>

            <button
              onClick={() => setChangeViewMode('OVERLAY')}
              style={{
                padding: '3px 9px',
                borderRadius: 'var(--radius-full)',
                fontSize: '11px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: changeViewMode === 'OVERLAY' ? '#ef4444' : 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff'
              }}
            >
              🔴 Change Footprint
            </button>

            <button
              onClick={() => setChangeViewMode('BASELINE')}
              style={{
                padding: '3px 9px',
                borderRadius: 'var(--radius-full)',
                fontSize: '11px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: changeViewMode === 'BASELINE' ? '#10b981' : 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff'
              }}
            >
              🌲 Before (Pristine)
            </button>

            <button
              onClick={() => setChangeViewMode('RECENT')}
              style={{
                padding: '3px 9px',
                borderRadius: 'var(--radius-full)',
                fontSize: '11px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: changeViewMode === 'RECENT' ? '#3b82f6' : 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff'
              }}
            >
              🛰️ After (Current)
            </button>

            <button
              onClick={() => setChangeViewMode('BLINK')}
              style={{
                padding: '3px 9px',
                borderRadius: 'var(--radius-full)',
                fontSize: '11px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: changeViewMode === 'BLINK' ? '#f59e0b' : 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                gap: '3px'
              }}
            >
              ⚡ Flash/Blink Change
            </button>
          </div>
        )}
      </div>

      {/* Floating Zoom & India Center Controls */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 850,
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}
      >
        <button
          onClick={() => mapInstanceRef.current?.zoomIn()}
          className="btn btn-secondary btn-sm"
          style={{
            width: '38px',
            height: '38px',
            padding: 0,
            justifyContent: 'center',
            fontSize: '18px',
            fontWeight: 700,
            borderRadius: '10px',
            boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
            backgroundColor: 'var(--bg-surface)'
          }}
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={() => mapInstanceRef.current?.zoomOut()}
          className="btn btn-secondary btn-sm"
          style={{
            width: '38px',
            height: '38px',
            padding: 0,
            justifyContent: 'center',
            fontSize: '18px',
            fontWeight: 700,
            borderRadius: '10px',
            boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
            backgroundColor: 'var(--bg-surface)'
          }}
          title="Zoom Out"
        >
          -
        </button>
        <button
          onClick={() => {
            if (selectedAoi && mapInstanceRef.current) {
              mapInstanceRef.current.flyTo(selectedAoi.center, selectedAoi.zoom || 14, { duration: 1 });
            }
          }}
          className="btn btn-secondary btn-sm"
          style={{
            width: '38px',
            height: '38px',
            padding: 0,
            justifyContent: 'center',
            borderRadius: '10px',
            boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
            backgroundColor: 'var(--bg-surface)',
            fontSize: '15px'
          }}
          title="Center on Monitored Area"
        >
          🎯
        </button>
        <button
          onClick={() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.flyTo([22.5, 82.0], 5, { duration: 1.2 });
            }
          }}
          className="btn btn-secondary btn-sm"
          style={{
            width: '38px',
            height: '38px',
            padding: 0,
            justifyContent: 'center',
            borderRadius: '10px',
            boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
            backgroundColor: 'var(--bg-surface)',
            fontSize: '15px'
          }}
          title="Whole India View"
        >
          🇮🇳
        </button>
        {onSwitchToGlobe && (
          <button
            onClick={onSwitchToGlobe}
            className="btn btn-secondary btn-sm"
            style={{
              width: '38px',
              height: '38px',
              padding: 0,
              justifyContent: 'center',
              borderRadius: '10px',
              boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
              backgroundColor: 'var(--bg-surface)',
              fontSize: '15px'
            }}
            title="Switch to MapLibre GL 3D Globe View"
          >
            🌐
          </button>
        )}
      </div>

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
                Control Panel
              </h2>
            </div>
            <span className="badge badge-emerald font-mono">{aois.length} Areas</span>
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
              <span>Monitor</span>
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
              <span>Changes ({events.length})</span>
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
                  {selectedAoi.description || 'This area is being monitored for environmental changes.'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
                  <span className="badge badge-neutral font-mono">Area: {selectedAoi.area_hectares.toFixed(1)} ha</span>
                  <span className="badge badge-amber font-mono">
                    {aoiEvents.length > 0 ? `${aoiEvents.length} Changes Found` : 'No Changes'}
                  </span>
                </div>
              </div>
            )}

            {/* Sentinel-2 Re-scan Parameters */}
            <div style={{ padding: '14px', backgroundColor: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.04em' }}>
                Run Change Detection
              </span>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '10px', fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                    Date 1 (Left Map • Before):
                  </label>
                  <input
                    type="date"
                    value={baselineDate}
                    onChange={e => setBaselineDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '5px 6px',
                      fontSize: '11px',
                      fontWeight: 600,
                      borderRadius: 'var(--radius-xs)',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: 'var(--bg-surface)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '10px', fontWeight: 700, color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                    Date 2 (Right Map • After):
                  </label>
                  <input
                    type="date"
                    value={recentDate}
                    onChange={e => setRecentDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '5px 6px',
                      fontSize: '11px',
                      fontWeight: 600,
                      borderRadius: 'var(--radius-xs)',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: 'var(--bg-surface)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
              </div>

              <div style={{ fontSize: '10px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                💡 <b>Date 1</b> ka map left side dikhega aur <b>Date 2</b> ka map right side dikhega, aur AI dono dates ke beech ke saare changes highlight karega.
              </div>

              {aoiEvents.length > 0 && onOpenSwipe && (
                <button
                  onClick={() => onOpenSwipe(aoiEvents[0])}
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%', gap: '6px', fontSize: '11px', fontWeight: 600 }}
                >
                  <Columns size={13} />
                  <span>Dono Dates Ka Side-by-Side Map Dekhein ({aoiEvents.length} Badlav)</span>
                </button>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Detection Sensitivity:</span>
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
                    <span>Analyzing satellite images...</span>
                  </>
                ) : (
                  <>
                    <Play size={14} />
                    <span>Detect Changes Now</span>
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
                <span>{isDrawingAoi ? 'Cancel' : 'Draw Area on Map'}</span>
              </button>

              <button
                onClick={() => setShowUploadModal(true)}
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', fontSize: '11px', gap: '4px' }}
              >
                <UploadCloud size={13} />
                <span>Upload File</span>
              </button>
            </div>

            {/* Recent Detected Events in this AOI */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Changes Detected ({aoiEvents.length})
                </span>
              </div>

              {aoiEvents.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '11px', backgroundColor: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
                  No changes detected yet. Click "Detect Changes Now" above to scan this area.
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
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>Total Area Monitored</span>
                <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--emerald-600)', display: 'block', marginTop: '2px' }}>
                  {Math.round(totalMonitoredHectares).toLocaleString()} ha
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{(totalMonitoredHectares / 100).toFixed(1)} km² total</span>
              </div>

              <div className="card" style={{ padding: '12px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>Monitored Areas</span>
                <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary-500)', display: 'block', marginTop: '2px' }}>
                  {aois.length} Regions
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Satellite monitored</span>
              </div>

              <div className="card" style={{ padding: '12px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>Changed Area</span>
                <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--amber-500)', display: 'block', marginTop: '2px' }}>
                  {totalAffectedHectares.toFixed(1)} ha
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{events.length} changes found</span>
              </div>

              <div className="card" style={{ padding: '12px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>Verified Changes</span>
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
                  Average Detection Accuracy
                </span>
                <span className="badge badge-teal font-mono">{avgConfidence}</span>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                How confident the AI is about the detected changes, based on image quality and analysis.
              </p>
            </div>

            {/* Disturbance Distribution Breakdown */}
            <div className="card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Types of Changes
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
                  <span style={{ color: 'var(--text-secondary)' }}>🌲 Trees/Plants Lost:</span>
                  <span className="font-mono" style={{ fontWeight: 600 }}>
                    {events.filter(e => e.category === 'VEGETATION_LOSS').reduce((acc, e) => acc + e.affected_area_hectares, 0).toFixed(1)} ha
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>🌊 Water Increased (Flood):</span>
                  <span className="font-mono" style={{ fontWeight: 600 }}>
                    {events.filter(e => e.category === 'WATER_EXPANSION').reduce((acc, e) => acc + e.affected_area_hectares, 0).toFixed(1)} ha
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>🏜️ Water Decreased:</span>
                  <span className="font-mono" style={{ fontWeight: 600 }}>
                    {events.filter(e => e.category === 'WATER_SHRINKAGE').reduce((acc, e) => acc + e.affected_area_hectares, 0).toFixed(1)} ha
                  </span>
                </div>
              </div>
            </div>

            {/* Platform Specifications */}
            <div style={{ padding: '12px', backgroundColor: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Technical Details</div>
              <div>Satellite: <b>Sentinel-2 (10m resolution)</b></div>
              <div>Image Bands: <b>Red, Near-IR, Green, SWIR</b></div>
              <div>Payments: <b>Algorand Blockchain (x402)</b></div>
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
                placeholder="Search changes by name or area..."
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
                  {cat === 'ALL' ? 'All' : cat === 'VEGETATION_LOSS' ? 'Trees Lost' : cat === 'WATER_EXPANSION' ? 'Water Rise' : 'Water Drop'}
                </button>
              ))}
            </div>

            {/* Incident Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredEvents.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                  No changes found matching your filters.
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
                          <span>Compare</span>
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
              Drawing Your Area
            </span>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>
            Click on the map to mark boundary points. Points marked: <b>{drawnPoints.length}</b>
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
              Save Area
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
                  Upload Area Boundary
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
              Upload a GeoJSON or JSON file that contains the boundary of the area you want to monitor.
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

      {/* Visual Satellite Processing Pipeline Modal */}
      <AnalysisFlowModal
        isOpen={showFlowModal}
        aoiName={selectedAoi?.name || 'Selected Area'}
        onComplete={handleFlowComplete}
      />

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
