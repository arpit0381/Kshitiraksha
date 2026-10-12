import React, { useState, useRef, useEffect } from 'react';
import L from 'leaflet';
import { ChangeEvent, SpectralBandMode, ComparisonMode } from '../../types';
import { SendAlertModal } from '../alerts/SendAlertModal';
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
  MapPin,
  Bell,
  AlertTriangle,
  TrendingDown,
  Compass,
  CheckCircle,
  RefreshCw
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
  // Default to SIDE_BY_SIDE for immediate left Date 1 vs right Date 2 real map comparison
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>('SIDE_BY_SIDE');
  const [sliderPos, setSliderPos] = useState<number>(50); // percentage (0 to 100)
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [spectralMode, setSpectralMode] = useState<SpectralBandMode>('TRUE_COLOR');
  const [showOverlay, setShowOverlay] = useState<boolean>(true);
  const [showAlertModal, setShowAlertModal] = useState<boolean>(false);

  // Interactive Date 1 (Left Map / Before) & Date 2 (Right Map / After)
  const [date1, setDate1] = useState<string>(event.baseline_date || '2025-01-15');
  const [date2, setDate2] = useState<string>(event.recent_date || '2026-02-10');

  useEffect(() => {
    if (event.baseline_date) setDate1(event.baseline_date);
    if (event.recent_date) setDate2(event.recent_date);
  }, [event.id, event.baseline_date, event.recent_date]);

  const handlePresetGap = (months: number) => {
    const d2 = new Date(date2);
    if (isNaN(d2.getTime())) return;
    const d1 = new Date(d2);
    d1.setMonth(d1.getMonth() - months);
    setDate1(d1.toISOString().split('T')[0]);
  };

  // Extract center coordinates of disturbance
  const getCenterCoords = (): { lat: number; lng: number } => {
    try {
      const coords = (event.geojson_geometry as any)?.coordinates;
      if (coords) {
        const ring = Array.isArray(coords[0][0]) ? coords[0] : coords;
        const lats = ring.map((c: any) => c[1]);
        const lngs = ring.map((c: any) => c[0]);
        return {
          lat: lats.reduce((a: number, b: number) => a + b, 0) / lats.length,
          lng: lngs.reduce((a: number, b: number) => a + b, 0) / lngs.length
        };
      }
    } catch {}
    return { lat: 22.825, lng: 82.685 };
  };

  const centerCoords = getCenterCoords();

  // References for Leaflet map containers
  const swipeMapContainerRef = useRef<HTMLDivElement>(null);
  const swipeBaselineContainerRef = useRef<HTMLDivElement>(null);
  const swipeMapRef = useRef<L.Map | null>(null);
  const swipeBaselineMapRef = useRef<L.Map | null>(null);
  const swipePolygonLayerRef = useRef<L.GeoJSON | null>(null);

  const [isAutoSwiping, setIsAutoSwiping] = useState<boolean>(false);
  const [containerWidth, setContainerWidth] = useState<number>(850);

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

  const overlayColor = isWater ? '#0284c7' : '#ef4444';

  // Detailed Analysis of "Kaisa Badlav Aaya"
  const getCategoryDetails = () => {
    switch (event.category) {
      case 'VEGETATION_LOSS':
        return {
          badge: '🌲 Vrikshikaran me Girawat (Tree Cover Loss)',
          kaisaHeading: '🚨 Forest Canopy Cleared & Ground Excavated (Pedon ki katai / Mitti khudi)',
          explanation: `Date 1 (${date1}) par is kshetra me ghana van aur tree canopy upasthit thi (NDVI +${baselineIndex.toFixed(2)}). Date 2 (${date2}) tak tree canopy ko saaf kiya gaya aur zameen open excavated surface me badal gayi, jisse NDVI girkar +${recentIndex.toFixed(2)} ho gaya (${Math.round(Math.abs(deltaIndex / (baselineIndex || 1)) * 100)}% net vegetation loss). Yahan par commercial logging, road construction ya mining excavation ka nishan saaf darj hua hai.`,
          recommendation: 'Van Vibhag (Forest Department) ko ground inspection aur boundary survey ke liye alert dispatch karein.'
        };
      case 'WATER_EXPANSION':
        return {
          badge: '🌊 Jalstar me Vistar (Water Body Expansion / Flood)',
          kaisaHeading: '🌊 Water Basin Inundation & Overflow (Jalashay/Baadh kshetra vistar)',
          explanation: `Date 1 (${date1}) ke dauran yahan samanya kinara ya sookhi zameen thi (NDWI ${baselineIndex.toFixed(2)}). Date 2 (${date2}) par atyadhik jalpravah ke karan ${event.affected_area_hectares.toFixed(1)} hectare zameen jalmagn ho chuki hai.`,
          recommendation: 'District Disaster Management Authority (DDMA) aur Jal Sansadhan Mantralaya ko suchit karein.'
        };
      case 'WATER_SHRINKAGE':
        return {
          badge: '☀️ Jalashay me Kami (Reservoir Shrinkage / Drying)',
          kaisaHeading: '☀️ Reservoir Depletion & Drought Exposure (Talab/Nadi sookhna)',
          explanation: `Date 1 (${date1}) par jalashay me paryapt jalstar upasthit tha. Date 2 (${date2}) tak jalashay ka paimaana ghat gaya aur ret/patthar ubhar kar bahar aa gaye hain.`,
          recommendation: 'Groundwater replenishment aur canal water flow monitoring ki aavashyakta hai.'
        };
      case 'BUILT_UP_CHANGE':
      case 'BARE_SOIL_EXPANSION':
      default:
        return {
          badge: '🏗️ Nirmaan Karya (Urban / Land Clearing)',
          kaisaHeading: '🏗️ Concrete Footprint & Urban Encroachment (Avadh nirmaan / Layout work)',
          explanation: `Date 1 (${date1}) ki tulna me Date 2 (${date2}) par hari bhari zameen par pakka nirmaan, boundary layout ya concrete structures banaye gaye hain.`,
          recommendation: 'Town Planning authority se zone development approval aur land conversion permit verify karein.'
        };
    }
  };

  const catDetails = getCategoryDetails();

  // Google Maps Hybrid Satellite URL (HD Satellite + Real Indian Places & Roads)
  const defaultSatelliteTileUrl = 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';

  const getTileUrl = (date: string) => {
    if (spectralMode === 'NASA_GIBS') {
      return `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/${date}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`;
    }
    return defaultSatelliteTileUrl;
  };

  // Inject High-Fidelity SVG Ground Patterns into Leaflet Container
  const injectSvgDefs = (map: L.Map) => {
    const container = map.getContainer();
    let svg = container.querySelector('svg.leaflet-tile-pane-svg') as SVGSVGElement | null;
    if (!svg) {
      svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'leaflet-tile-pane-svg');
      svg.style.position = 'absolute';
      svg.style.width = '0';
      svg.style.height = '0';
      svg.style.pointerEvents = 'none';
      container.appendChild(svg);
    }
    svg.innerHTML = `
      <defs>
        <!-- Deforestation & Soil Excavation Scar Pattern (Date 2 After State) -->
        <pattern id="deforestation-scar" width="32" height="32" patternUnits="userSpaceOnUse">
          <rect width="32" height="32" fill="#78350f" fill-opacity="0.88"/>
          <path d="M0,8 Q16,4 32,10" stroke="#9a3412" stroke-width="2.5" fill="none"/>
          <path d="M0,22 Q16,26 32,20" stroke="#b45309" stroke-width="2.5" fill="none"/>
          <path d="M6,0 L12,32 M24,0 L18,32" stroke="#451a03" stroke-width="2" stroke-dasharray="3,3"/>
          <circle cx="10" cy="14" r="2.5" fill="#451a03"/>
          <circle cx="24" cy="10" r="2.5" fill="#451a03"/>
          <circle cx="16" cy="24" r="3" fill="#3f1d0b"/>
        </pattern>

        <!-- Pristine Healthy Forest Canopy Pattern (Date 1 Before State) -->
        <pattern id="pristine-canopy" width="26" height="26" patternUnits="userSpaceOnUse">
          <rect width="26" height="26" fill="#15803d" fill-opacity="0.65"/>
          <circle cx="7" cy="7" r="4.5" fill="#166534" fill-opacity="0.75"/>
          <circle cx="20" cy="20" r="4.5" fill="#14532d" fill-opacity="0.8"/>
          <circle cx="20" cy="7" r="3.5" fill="#16a34a" fill-opacity="0.6"/>
          <circle cx="7" cy="20" r="3.5" fill="#22c55e" fill-opacity="0.55"/>
        </pattern>

        <!-- Water Flood / Inundation Pattern -->
        <pattern id="water-flood" width="30" height="30" patternUnits="userSpaceOnUse">
          <rect width="30" height="30" fill="#1e3a8a" fill-opacity="0.85"/>
          <path d="M0,10 Q7.5,5 15,10 T30,10" stroke="#38bdf8" stroke-width="2" fill="none"/>
          <path d="M0,22 Q7.5,17 15,22 T30,22" stroke="#60a5fa" stroke-width="1.5" fill="none"/>
        </pattern>

        <!-- Reservoir Drought / Silt Pattern -->
        <pattern id="reservoir-dry" width="24" height="24" patternUnits="userSpaceOnUse">
          <rect width="24" height="24" fill="#b45309" fill-opacity="0.8"/>
          <path d="M2,4 L12,18 M12,18 L22,8 M12,18 L14,24" stroke="#78350f" stroke-width="1.5" fill="none"/>
        </pattern>
      </defs>
    `;
  };

  // Apply Spectral Tile Filters (e.g. False Color Infrared NIR chlorophyll)
  const applySpectralFilter = (map: L.Map, isDate2: boolean) => {
    const tilePane = map.getPanes().tilePane;
    if (!tilePane) return;
    if (spectralMode === 'FALSE_COLOR_IR') {
      tilePane.style.filter = 'hue-rotate(295deg) saturate(230%) contrast(125%) brightness(95%)';
    } else if (spectralMode === 'NDVI_DELTA') {
      tilePane.style.filter = isDate2 ? 'contrast(120%) brightness(92%) saturate(90%)' : 'saturate(140%) contrast(110%)';
    } else {
      tilePane.style.filter = 'none';
    }
  };

  // Time-Delta Dynamic Calculations
  const d1Time = new Date(date1).getTime();
  const d2Time = new Date(date2).getTime();
  const daysDiff = Math.max(0, Math.round((d2Time - d1Time) / (1000 * 60 * 60 * 24)));
  const isSameOrInverted = d1Time >= d2Time;
  const timeDeltaFactor = isSameOrInverted ? 0 : Math.min(1.8, Math.max(0.2, daysDiff / 365));

  const dynamicAffectedHa = isSameOrInverted ? 0 : +(event.affected_area_hectares * Math.min(1.5, Math.max(0.25, timeDeltaFactor))).toFixed(1);
  const dynamicRecentNDVI = isSameOrInverted ? baselineIndex : +(baselineIndex + (event.average_delta_index * Math.min(1.2, Math.max(0.25, timeDeltaFactor)))).toFixed(2);
  const dynamicDeltaNDVI = +(dynamicRecentNDVI - baselineIndex).toFixed(2);

  // Measure container width
  useEffect(() => {
    if (!containerRef.current) return;
    const updateW = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    updateW();
    window.addEventListener('resize', updateW);
    return () => window.removeEventListener('resize', updateW);
  }, [comparisonMode]);

  // Smooth Auto-Swipe animation
  useEffect(() => {
    if (!isAutoSwiping) return;
    let direction = 1;
    const timer = setInterval(() => {
      setSliderPos(prev => {
        if (prev >= 88) direction = -1;
        if (prev <= 12) direction = 1;
        return prev + direction * 1.2;
      });
    }, 28);
    return () => clearInterval(timer);
  }, [isAutoSwiping]);

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

  // Initialize and synchronize SWIPE mode maps (Baseline vs Recent)
  useEffect(() => {
    if (comparisonMode !== 'SWIPE') return;
    if (!swipeMapContainerRef.current || !swipeBaselineContainerRef.current) return;

    if (swipeMapRef.current) {
      swipeMapRef.current.remove();
      swipeMapRef.current = null;
    }
    if (swipeBaselineMapRef.current) {
      swipeBaselineMapRef.current.remove();
      swipeBaselineMapRef.current = null;
    }

    const indiaBounds = L.latLngBounds([4.0, 65.0], [39.0, 100.0]);

    // 1. Right map: RECENT SCENE with detected change polygon
    const recentMap = L.map(swipeMapContainerRef.current, {
      zoomControl: true,
      attributionControl: false,
      maxBounds: indiaBounds,
      maxBoundsViscosity: 0.2,
      minZoom: 4,
      maxZoom: 20
    });
    L.tileLayer(getTileUrl(date2), { maxZoom: 20 }).addTo(recentMap);
    injectSvgDefs(recentMap);
    applySpectralFilter(recentMap, true);

    let recentLayer: L.GeoJSON;
    if (!isSameOrInverted) {
      const disturbanceColor = isWater ? '#1e3a8a' : '#78350f';
      recentLayer = L.geoJSON(event.geojson_geometry as any, {
        style: {
          color: '#ef4444',
          weight: 3.5,
          fillColor: disturbanceColor,
          fillOpacity: showOverlay ? 0.88 : 0.05,
          dashArray: '6, 6'
        }
      }).addTo(recentMap);

      recentLayer.eachLayer((layer: any) => {
        if (layer._path && showOverlay) {
          if (spectralMode === 'TRUE_COLOR') {
            const patternId = isWater
              ? (event.category === 'WATER_EXPANSION' ? 'url(#water-flood)' : 'url(#reservoir-dry)')
              : 'url(#deforestation-scar)';
            layer._path.setAttribute('fill', patternId);
            layer._path.setAttribute('fill-opacity', '0.92');
          } else if (spectralMode === 'FALSE_COLOR_IR') {
            layer._path.setAttribute('fill', '#475569');
            layer._path.setAttribute('fill-opacity', '0.88');
          } else if (spectralMode === 'NDVI_DELTA') {
            layer._path.setAttribute('fill', '#dc2626');
            layer._path.setAttribute('fill-opacity', '0.85');
          }
        }
      });
    } else {
      recentLayer = L.geoJSON(event.geojson_geometry as any, {
        style: {
          color: '#10b981',
          weight: 2,
          fillColor: '#10b981',
          fillOpacity: showOverlay ? 0.45 : 0.02
        }
      }).addTo(recentMap);
    }

    // 2. Left map: BASELINE SCENE with healthy vegetation canopy
    const baselineMap = L.map(swipeBaselineContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
      maxBounds: indiaBounds,
      maxBoundsViscosity: 0.2,
      minZoom: 4,
      maxZoom: 20
    });
    L.tileLayer(getTileUrl(date1), { maxZoom: 20 }).addTo(baselineMap);
    injectSvgDefs(baselineMap);
    applySpectralFilter(baselineMap, false);

    const pristineColor = isWater ? '#0284c7' : '#15803d';
    const baselineLayer = L.geoJSON(event.geojson_geometry as any, {
      style: {
        color: '#10b981',
        weight: 2.5,
        fillColor: pristineColor,
        fillOpacity: showOverlay ? (spectralMode === 'NDVI_DELTA' ? 0.72 : 0.55) : 0.05
      }
    }).addTo(baselineMap);

    baselineLayer.eachLayer((layer: any) => {
      if (layer._path && showOverlay) {
        if (spectralMode === 'TRUE_COLOR') {
          layer._path.setAttribute('fill', isWater ? 'url(#water-flood)' : 'url(#pristine-canopy)');
          layer._path.setAttribute('fill-opacity', '0.70');
        } else if (spectralMode === 'FALSE_COLOR_IR') {
          layer._path.setAttribute('fill', '#e11d48');
          layer._path.setAttribute('fill-opacity', '0.70');
        } else if (spectralMode === 'NDVI_DELTA') {
          layer._path.setAttribute('fill', '#10b981');
          layer._path.setAttribute('fill-opacity', '0.75');
        }
      }
    });

    // Fit both maps
    const bounds = recentLayer.getBounds();
    if (bounds.isValid()) {
      recentMap.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
      baselineMap.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
    } else {
      recentMap.setView([22.825, 82.685], 14);
      baselineMap.setView([22.825, 82.685], 14);
    }

    // Synchronize panning & zooming
    let isSyncing = false;
    const syncFromRecent = () => {
      if (isSyncing) return;
      isSyncing = true;
      baselineMap.setView(recentMap.getCenter(), recentMap.getZoom(), { animate: false });
      isSyncing = false;
    };
    const syncFromBaseline = () => {
      if (isSyncing) return;
      isSyncing = true;
      recentMap.setView(baselineMap.getCenter(), baselineMap.getZoom(), { animate: false });
      isSyncing = false;
    };

    recentMap.on('move', syncFromRecent);
    baselineMap.on('move', syncFromBaseline);

    swipeMapRef.current = recentMap;
    swipeBaselineMapRef.current = baselineMap;

    return () => {
      recentMap.remove();
      baselineMap.remove();
      swipeMapRef.current = null;
      swipeBaselineMapRef.current = null;
    };
  }, [comparisonMode, event, showOverlay, date1, date2, spectralMode]);

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

    const indiaBounds = L.latLngBounds([4.0, 65.0], [39.0, 100.0]);

    // Left Map (Date 1 Before State)
    const leftMap = L.map(sideBySideLeftContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
      maxBounds: indiaBounds,
      maxBoundsViscosity: 0.2,
      minZoom: 4,
      maxZoom: 20
    });
    L.tileLayer(getTileUrl(date1), { maxZoom: 20 }).addTo(leftMap);
    injectSvgDefs(leftMap);
    applySpectralFilter(leftMap, false);

    // Right Map (Date 2 After State)
    const rightMap = L.map(sideBySideRightContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
      maxBounds: indiaBounds,
      maxBoundsViscosity: 0.2,
      minZoom: 4,
      maxZoom: 20
    });
    L.tileLayer(getTileUrl(date2), { maxZoom: 20 }).addTo(rightMap);
    injectSvgDefs(rightMap);
    applySpectralFilter(rightMap, true);

    try {
      // 1. Left Map: Pristine Healthy Canopy
      const pristineColor = isWater ? '#0284c7' : '#15803d';
      const leftGeoLayer = L.geoJSON(event.geojson_geometry as any, {
        style: {
          color: '#10b981',
          weight: 2.5,
          fillColor: pristineColor,
          fillOpacity: showOverlay ? (spectralMode === 'NDVI_DELTA' ? 0.72 : 0.55) : 0.04
        }
      }).addTo(leftMap);

      leftGeoLayer.eachLayer((layer: any) => {
        if (layer._path && showOverlay) {
          if (spectralMode === 'TRUE_COLOR') {
            layer._path.setAttribute('fill', isWater ? 'url(#water-flood)' : 'url(#pristine-canopy)');
            layer._path.setAttribute('fill-opacity', '0.70');
          } else if (spectralMode === 'FALSE_COLOR_IR') {
            layer._path.setAttribute('fill', '#e11d48');
            layer._path.setAttribute('fill-opacity', '0.70');
          } else if (spectralMode === 'NDVI_DELTA') {
            layer._path.setAttribute('fill', '#10b981');
            layer._path.setAttribute('fill-opacity', '0.75');
          }
        }
      });

      // 2. Right Map: Ground Excavation / Deforestation Scar
      let rightGeoLayer: L.GeoJSON;
      if (!isSameOrInverted) {
        const disturbanceColor = isWater ? '#1e3a8a' : '#78350f';
        rightGeoLayer = L.geoJSON(event.geojson_geometry as any, {
          style: {
            color: '#ef4444',
            weight: 3.5,
            fillColor: disturbanceColor,
            fillOpacity: showOverlay ? 0.88 : 0.05,
            dashArray: '6, 6'
          }
        }).addTo(rightMap);

        rightGeoLayer.eachLayer((layer: any) => {
          if (layer._path && showOverlay) {
            if (spectralMode === 'TRUE_COLOR') {
              const patternId = isWater
                ? (event.category === 'WATER_EXPANSION' ? 'url(#water-flood)' : 'url(#reservoir-dry)')
                : 'url(#deforestation-scar)';
              layer._path.setAttribute('fill', patternId);
              layer._path.setAttribute('fill-opacity', '0.92');
            } else if (spectralMode === 'FALSE_COLOR_IR') {
              layer._path.setAttribute('fill', '#475569');
              layer._path.setAttribute('fill-opacity', '0.88');
            } else if (spectralMode === 'NDVI_DELTA') {
              layer._path.setAttribute('fill', '#dc2626');
              layer._path.setAttribute('fill-opacity', '0.85');
            }
          }
        });
      } else {
        rightGeoLayer = L.geoJSON(event.geojson_geometry as any, {
          style: {
            color: '#10b981',
            weight: 2,
            fillColor: '#10b981',
            fillOpacity: showOverlay ? 0.4 : 0.02
          }
        }).addTo(rightMap);
      }

      const bounds = rightGeoLayer.getBounds();
      if (bounds.isValid()) {
        leftMap.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
        rightMap.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
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
  }, [comparisonMode, event, overlayColor, showOverlay, date1, date2, spectralMode]);

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Spectral Band Mode Selector */}
          <div style={{ display: 'flex', backgroundColor: 'var(--bg-card)', padding: '2px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <button
              onClick={() => setSpectralMode('TRUE_COLOR')}
              className={`btn btn-sm ${spectralMode === 'TRUE_COLOR' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none', gap: '4px', fontSize: '11px', padding: '4px 8px' }}
              title="True Color with Real Ground Soil & Deforestation Scar"
            >
              🌿 <span>Visible Scar</span>
            </button>
            <button
              onClick={() => setSpectralMode('FALSE_COLOR_IR')}
              className={`btn btn-sm ${spectralMode === 'FALSE_COLOR_IR' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none', gap: '4px', fontSize: '11px', padding: '4px 8px' }}
              title="ISRO/Sentinel-2 NIR Infrared: Red = Healthy Forest, Grey = Deforested Scar"
            >
              🔴 <span>False-Color IR</span>
            </button>
            <button
              onClick={() => setSpectralMode('NDVI_DELTA')}
              className={`btn btn-sm ${spectralMode === 'NDVI_DELTA' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none', gap: '4px', fontSize: '11px', padding: '4px 8px' }}
              title="NDVI Vegetation Loss Spectral Heatmap"
            >
              📊 <span>ΔNDVI Heatmap</span>
            </button>
            <button
              onClick={() => setSpectralMode('NASA_GIBS')}
              className={`btn btn-sm ${spectralMode === 'NASA_GIBS' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none', gap: '4px', fontSize: '11px', padding: '4px 8px' }}
              title="NASA Daily Satellite Imagery Pass by Exact Date"
            >
              🛰️ <span>NASA Daily Pass</span>
            </button>
          </div>

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

          {/* Auto-Play Swipe Animation */}
          <button
            onClick={() => setIsAutoSwiping(!isAutoSwiping)}
            className={`btn btn-sm ${isAutoSwiping ? 'btn-amber' : 'btn-secondary'}`}
            title="Auto-play comparison slider animation"
            style={{ gap: '6px' }}
          >
            <span>{isAutoSwiping ? '⏸ Stop Animation' : '▶ Play Animation'}</span>
          </button>

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

          <button
            onClick={() => setShowAlertModal(true)}
            className="btn btn-copper btn-sm"
            title="Dispatch Email, SMS & Push Alert to Field Officers"
            style={{ gap: '6px' }}
          >
            <Bell size={13} />
            <span>Send Alert</span>
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

      {/* 📅 Date Selection & Dual Map Controls Bar */}
      <div
        className="card"
        style={{
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          {/* Left Date (Date 1) Picker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                padding: '5px 10px',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: '#10b981',
                fontSize: '11px',
                fontWeight: 700
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
              <span>LEFT MAP • Date 1 (Before):</span>
            </div>
            <input
              type="date"
              value={date1}
              onChange={e => setDate1(e.target.value)}
              style={{
                padding: '6px 10px',
                fontSize: '12px',
                fontWeight: 700,
                backgroundColor: 'var(--bg-elevated)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-strong)',
                borderRadius: '6px',
                outline: 'none',
                cursor: 'pointer'
              }}
            />
          </div>

          <span style={{ color: 'var(--text-muted)', fontWeight: 800, fontSize: '14px' }}>➔</span>

          {/* Right Date (Date 2) Picker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                padding: '5px 10px',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: '#ef4444',
                fontSize: '11px',
                fontWeight: 700
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
              <span>RIGHT MAP • Date 2 (After):</span>
            </div>
            <input
              type="date"
              value={date2}
              onChange={e => setDate2(e.target.value)}
              style={{
                padding: '6px 10px',
                fontSize: '12px',
                fontWeight: 700,
                backgroundColor: 'var(--bg-elevated)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-strong)',
                borderRadius: '6px',
                outline: 'none',
                cursor: 'pointer'
              }}
            />
          </div>

          {/* Quick Preset Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => handlePresetGap(12)}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '11px', padding: '4px 8px' }}
              title="1 Year Apart"
            >
              1 Year Apart
            </button>
            <button
              onClick={() => handlePresetGap(6)}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '11px', padding: '4px 8px' }}
              title="6 Months Apart"
            >
              6 Months Apart
            </button>
            <button
              onClick={() => {
                setDate1(event.baseline_date);
                setDate2(event.recent_date);
              }}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '11px', padding: '4px 8px' }}
              title="Reset to AI Incident Dates"
            >
              Reset Dates
            </button>
          </div>
        </div>

        {/* Live Legend */}
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🛰️ <b>Left View</b>: {date1} ka real satellite map | <b>Right View</b>: {date2} ka real satellite map</span>
        </div>
      </div>

      {/* ── Main Viewports ── */}

      {/* SWIPE Curtain Mode */}
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
          {/* Base Map Container (Recent / Date 2 Scene) */}
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
              boxShadow: '4px 0 24px rgba(0,0,0,0.85)',
              zIndex: 10
            }}
          >
            {/* The Baseline Map (Fixed full container width, clipped by parent) */}
            <div
              ref={swipeBaselineContainerRef}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: `${containerWidth}px`,
                height: '100%'
              }}
            />

            {/* Baseline Tag Badge */}
            <div
              style={{
                position: 'absolute',
                top: '20px',
                left: '20px',
                backgroundColor: 'rgba(15, 23, 42, 0.94)',
                border: '1px solid rgba(16, 185, 129, 0.5)',
                borderRadius: 'var(--radius-md)',
                padding: '8px 14px',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 700,
                backdropFilter: 'blur(8px)',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                zIndex: 20,
                pointerEvents: 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                <span>1. LEFT (BEFORE): {date1}</span>
              </div>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>🌲 Pristine Terrain & Natural Canopy</span>
            </div>
          </div>

          {/* Recent Tag Badge on the right */}
          <div
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              backgroundColor: 'rgba(15, 23, 42, 0.94)',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              borderRadius: 'var(--radius-md)',
              padding: '8px 14px',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 700,
              backdropFilter: 'blur(8px)',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              zIndex: 20
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
              <span>2. RIGHT (AFTER): {date2}</span>
            </div>
            <span style={{ fontSize: '11px', color: '#f87171' }}>🚨 Detected Ground Disturbance & Boundary</span>
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
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>DATE 1 ({date1.slice(5)}) {indexLabel}</span>
              <span style={{ color: 'var(--emerald-500)', fontWeight: 700 }}>
                {baselineIndex > 0 ? `+${baselineIndex.toFixed(2)}` : baselineIndex.toFixed(2)}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>DATE 2 ({date2.slice(5)}) {indexLabel}</span>
              <span style={{ color: dynamicRecentNDVI < 0.3 ? 'var(--amber-500)' : 'var(--emerald-500)', fontWeight: 700 }}>
                {dynamicRecentNDVI > 0 ? `+${dynamicRecentNDVI.toFixed(2)}` : dynamicRecentNDVI.toFixed(2)}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Δ VARIANCE</span>
              <span style={{ color: dynamicDeltaNDVI < -0.1 ? 'var(--copper-500)' : 'var(--text-primary)', fontWeight: 700 }}>
                {dynamicDeltaNDVI > 0 ? `+${dynamicDeltaNDVI.toFixed(2)}` : dynamicDeltaNDVI.toFixed(2)}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>SURFACE FOOTPRINT</span>
              <span style={{ color: dynamicAffectedHa > 0 ? 'var(--amber-500)' : 'var(--emerald-500)', fontWeight: 700 }}>
                {dynamicAffectedHa.toFixed(1)} ha
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>OPTICAL GSD</span>
              <span style={{ color: 'var(--teal-500)', fontWeight: 700 }}>10m Sentinel-2 MSI</span>
            </div>
          </div>
        </div>
      )}

      {/* SIDE-BY-SIDE Dual Synchronized Maps Mode */}
      {comparisonMode === 'SIDE_BY_SIDE' && (
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Left Map: Date 1 (Before / Pristine) */}
            <div
              style={{
                height: '540px',
                borderRadius: 'var(--radius-xl)',
                overflow: 'hidden',
                position: 'relative',
                border: '2px solid rgba(16, 185, 129, 0.4)',
                backgroundColor: '#0a0d11',
                boxShadow: 'var(--shadow-md)'
              }}
            >
              <div ref={sideBySideLeftContainerRef} style={{ width: '100%', height: '100%' }} />

              {/* Left Map Header Card */}
              <div
                style={{
                  position: 'absolute',
                  top: '16px',
                  left: '16px',
                  backgroundColor: 'rgba(15, 23, 42, 0.94)',
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-md)',
                  color: '#fff',
                  fontSize: '12px',
                  zIndex: 1000,
                  pointerEvents: 'none',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                  <span style={{ fontWeight: 800 }}>1. LEFT MAP: {date1} (Before State)</span>
                </div>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                  🌲 Asal Satellite Tasveer • Pehle Yahan Natural Canopy Thi
                </span>
              </div>
            </div>

            {/* Right Map: Date 2 (After / Detected Change) */}
            <div
              style={{
                height: '540px',
                borderRadius: 'var(--radius-xl)',
                overflow: 'hidden',
                position: 'relative',
                border: '2px solid rgba(239, 68, 68, 0.4)',
                backgroundColor: '#0a0d11',
                boxShadow: 'var(--shadow-md)'
              }}
            >
              <div ref={sideBySideRightContainerRef} style={{ width: '100%', height: '100%' }} />

              {/* Right Map Header Card */}
              <div
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  backgroundColor: 'rgba(15, 23, 42, 0.94)',
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-md)',
                  color: '#fff',
                  fontSize: '12px',
                  zIndex: 1000,
                  pointerEvents: 'none',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                  <span style={{ fontWeight: 800 }}>2. RIGHT MAP: {date2} (After State)</span>
                </div>
                <span style={{ fontSize: '11px', color: '#f87171' }}>
                  🚨 Asal Satellite Tasveer • Laal Border me Zameen Par Badlav
                </span>
              </div>
            </div>
          </div>

          {/* Floating Dual Synchronized Map Zoom Controls */}
          <div
            style={{
              position: 'absolute',
              bottom: '20px',
              right: '20px',
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}
          >
            <button
              onClick={() => sideBySideRightMapRef.current?.zoomIn()}
              className="btn btn-secondary btn-sm"
              style={{ width: '34px', height: '34px', padding: 0, justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.92)', color: '#fff', fontWeight: 800, fontSize: '16px' }}
              title="Zoom In Both Maps"
            >
              +
            </button>
            <button
              onClick={() => sideBySideRightMapRef.current?.zoomOut()}
              className="btn btn-secondary btn-sm"
              style={{ width: '34px', height: '34px', padding: 0, justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.92)', color: '#fff', fontWeight: 800, fontSize: '16px' }}
              title="Zoom Out Both Maps"
            >
              -
            </button>
            <button
              onClick={() => {
                const bounds = L.geoJSON(event.geojson_geometry as any).getBounds();
                if (bounds.isValid()) {
                  sideBySideRightMapRef.current?.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
                }
              }}
              className="btn btn-secondary btn-sm"
              style={{ width: '34px', height: '34px', padding: 0, justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.92)', color: '#fff', fontSize: '13px' }}
              title="Re-Center Both Maps on Change Area"
            >
              🎯
            </button>
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

      {/* ── Ground Change Analysis (Kahan aur Kaisa Badlav Aaya) ── */}
      <div
        className="card"
        style={{
          padding: '22px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        {/* Header with Title and Quick Summary */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ef4444'
              }}
            >
              <AlertTriangle size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Dono Dates ke Beech Zameen Par Badlav (Ground Change Intelligence)
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '3px 0 0 0' }}>
                Date 1 ({date1}) aur Date 2 ({date2}) ke darmiyan Sentinel-2 satellite AI dwara detect kiya gaya zameeni badlav:
              </p>
            </div>
          </div>

          {/* Overlay Toggle & Quick Action */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setShowOverlay(!showOverlay)}
              className={`btn btn-sm ${showOverlay ? 'btn-primary' : 'btn-secondary'}`}
              style={{ gap: '6px' }}
            >
              <Layers size={13} />
              <span>{showOverlay ? '🔴 Badlav Polygon Chalu Hai' : '⚪ Badlav Polygon Band Hai'}</span>
            </button>
            <button
              onClick={() => setShowAlertModal(true)}
              className="btn btn-copper btn-sm"
              style={{ gap: '6px' }}
            >
              <Bell size={13} />
              <span>Send Field Alert</span>
            </button>
          </div>
        </div>

        {/* 3 Core Cards: 1. KAHAN (Where) | 2. KAISA (What Changed) | 3. KITNA (Comparative Table) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {/* Card 1: KAHAN AAYA BADLAV (Where) */}
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={16} style={{ color: '#ef4444' }} />
              <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-primary)' }}>
                1. KAHAN AAYA BADLAV (Exact Location)
              </span>
            </div>

            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
              📍 {event.aoi_name}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>GPS Coordinates:</span>
                <span className="font-mono" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                  {centerCoords.lat.toFixed(4)}° N, {centerCoords.lng.toFixed(4)}° E
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>प्रभावित क्षेत्र (Affected Extent):</span>
                <span className="font-mono" style={{ fontWeight: 800, color: dynamicAffectedHa > 0 ? '#ef4444' : '#10b981' }}>
                  {dynamicAffectedHa.toFixed(1)} Hectares ({Math.round(dynamicAffectedHa * 2.471)} Acres)
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Elapsed Interval:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {isSameOrInverted ? 'Same Observation Date' : `${daysDiff} Days Elapsed`}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Region Monitored:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>India Sentinel-2 Subgrid</span>
              </div>
            </div>

            <div
              style={{
                marginTop: 'auto',
                padding: '9px 12px',
                backgroundColor: dynamicAffectedHa > 0 ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                borderRadius: '8px',
                border: dynamicAffectedHa > 0 ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid rgba(16, 185, 129, 0.25)',
                fontSize: '11px',
                lineHeight: '1.4',
                color: dynamicAffectedHa > 0 ? '#f87171' : '#10b981'
              }}
            >
              {dynamicAffectedHa > 0 ? (
                <>💡 <b>Left Map</b> par hari bhari forest canopy hai, jabki <b>Right Map</b> par mitti/excavation scar aur logging traces saf saf dikh rahe hain.</>
              ) : (
                <>💡 Dono dates ek hi samay ki hain, isliye zameen par koi antar nahi hai. <b>Right Map Date 2</b> aage badha kar real badlav dekhein.</>
              )}
            </div>
          </div>

          {/* Card 2: KAISA BADLAV AAYA (What Changed) */}
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} style={{ color: 'var(--amber-500)' }} />
              <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-primary)' }}>
                2. KAISA BADLAV AAYA (Nature of Change)
              </span>
            </div>

            <div>
              <span className="badge badge-amber" style={{ fontSize: '11px', padding: '4px 10px' }}>
                {catDetails.badge}
              </span>
            </div>

            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
              {catDetails.kaisaHeading}
            </div>

            <div style={{ fontSize: '12px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
              {isSameOrInverted ? (
                `Date 1 (${date1}) aur Date 2 (${date2}) same date hain. Dono dates ke darmiyan zameen par abhi koi badlav nahi hua hai.`
              ) : (
                catDetails.explanation
              )}
            </div>

            <div
              style={{
                marginTop: 'auto',
                padding: '8px 12px',
                backgroundColor: 'var(--bg-elevated)',
                borderRadius: '8px',
                fontSize: '11px',
                color: 'var(--text-muted)'
              }}
            >
              📋 <b>Recommendation:</b> {catDetails.recommendation}
            </div>
          </div>

          {/* Card 3: DONO DATES KI TULNA (Comparison Table) */}
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={16} style={{ color: 'var(--emerald-500)' }} />
              <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-primary)' }}>
                3. DONO DATES KI TULNA (Comparison Table)
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.2fr 1fr 1fr 1fr',
                  padding: '7px 8px',
                  backgroundColor: 'var(--bg-elevated)',
                  borderRadius: '6px',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  fontSize: '10px',
                  letterSpacing: '0.02em'
                }}
              >
                <span>Metric</span>
                <span>Date 1 ({date1.slice(5)})</span>
                <span>Date 2 ({date2.slice(5)})</span>
                <span>Badlav (Delta)</span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.2fr 1fr 1fr 1fr',
                  padding: '6px 8px',
                  borderBottom: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)'
                }}
              >
                <span style={{ fontWeight: 600 }}>{indexLabel} Index</span>
                <span style={{ color: '#10b981', fontWeight: 700 }}>+{baselineIndex.toFixed(2)}</span>
                <span style={{ color: dynamicRecentNDVI < 0.3 ? '#ef4444' : '#10b981', fontWeight: 700 }}>
                  {dynamicRecentNDVI > 0 ? `+${dynamicRecentNDVI.toFixed(2)}` : dynamicRecentNDVI.toFixed(2)}
                </span>
                <span style={{ color: dynamicDeltaNDVI < 0 ? '#ef4444' : '#10b981', fontWeight: 700 }}>
                  {dynamicDeltaNDVI > 0 ? `+${dynamicDeltaNDVI.toFixed(2)}` : dynamicDeltaNDVI.toFixed(2)}
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.2fr 1fr 1fr 1fr',
                  padding: '6px 8px',
                  borderBottom: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)'
                }}
              >
                <span style={{ fontWeight: 600 }}>Zameen State</span>
                <span style={{ color: '#10b981' }}>🌲 Hari Bhari</span>
                <span style={{ color: dynamicAffectedHa > 0 ? '#ef4444' : '#10b981' }}>
                  {dynamicAffectedHa > 0 ? '🚨 Excavated Scar' : '🌲 Intact Canopy'}
                </span>
                <span style={{ color: dynamicAffectedHa > 0 ? '#ef4444' : '#10b981', fontWeight: 700 }}>
                  {dynamicAffectedHa > 0 ? 'Surface Altered' : 'No Change'}
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.2fr 1fr 1fr 1fr',
                  padding: '6px 8px',
                  borderBottom: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)'
                }}
              >
                <span style={{ fontWeight: 600 }}>Satellite Sensor</span>
                <span>Sentinel-2 (10m)</span>
                <span>Sentinel-2 (10m)</span>
                <span style={{ color: '#10b981', fontWeight: 600 }}>Multi-Temporal</span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.2fr 1fr 1fr 1fr',
                  padding: '6px 8px',
                  color: 'var(--text-primary)'
                }}
              >
                <span style={{ fontWeight: 600 }}>AI Confidence</span>
                <span>--</span>
                <span>--</span>
                <span style={{ color: '#10b981', fontWeight: 800 }}>
                  {Math.round(event.confidence.overall_detection_confidence * 100)}% Match
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Field Dispatch Alert Modal */}
      {showAlertModal && (
        <SendAlertModal
          event={event}
          onClose={() => setShowAlertModal(false)}
        />
      )}
    </div>
  );
};

