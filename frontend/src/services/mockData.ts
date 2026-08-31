import { AOI, ChangeEvent } from '../types';

export const BENCHMARK_AOIS: AOI[] = [
  {
    id: 'aoi-hasdeo',
    name: 'Hasdeo Arand Forest Range',
    description: 'Continuous monitoring of dense Sal forest canopy against open-cast coal mining encroachment in north Chhattisgarh.',
    preset_key: 'hasdeo',
    center: [22.825, 82.685],
    zoom: 13,
    area_hectares: 1420.5,
    created_at: '2025-01-10T08:30:00Z',
    last_monitored_at: '2026-02-28T14:15:00Z',
    active_alerts_count: 2,
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [82.650, 22.800],
        [82.720, 22.800],
        [82.720, 22.850],
        [82.650, 22.850],
        [82.650, 22.800]
      ]]
    }
  },
  {
    id: 'aoi-sundarbans',
    name: 'Sundarbans Biosphere Delta',
    description: 'Monitoring tidal mangrove loss, delta erosion, and salinity changes along the Hugli-Matla estuary.',
    preset_key: 'sundarbans',
    center: [21.945, 88.850],
    zoom: 12,
    area_hectares: 3250.0,
    created_at: '2025-01-12T11:00:00Z',
    last_monitored_at: '2026-02-27T09:45:00Z',
    active_alerts_count: 1,
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [88.800, 21.900],
        [88.900, 21.900],
        [88.900, 21.990],
        [88.800, 21.990],
        [88.800, 21.900]
      ]]
    }
  },
  {
    id: 'aoi-bellandur',
    name: 'Bellandur Lake Wetland',
    description: 'Urban water body surface shrinkage, marsh vegetation degradation, and encroachment detection.',
    preset_key: 'bellandur',
    center: [12.935, 77.670],
    zoom: 14,
    area_hectares: 380.2,
    created_at: '2025-02-01T06:20:00Z',
    last_monitored_at: '2026-02-25T17:00:00Z',
    active_alerts_count: 1,
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [77.655, 12.925],
        [77.685, 12.925],
        [77.685, 12.945],
        [77.655, 12.945],
        [77.655, 12.925]
      ]]
    }
  },
  {
    id: 'aoi-wayanad',
    name: 'Wayanad Western Ghats Slope',
    description: 'Rapid slope scar detection, landslide debris runout, and canopy displacement monitoring.',
    preset_key: 'wayanad',
    center: [11.550, 76.180],
    zoom: 13,
    area_hectares: 890.0,
    created_at: '2025-02-05T10:15:00Z',
    last_monitored_at: '2026-02-26T12:30:00Z',
    active_alerts_count: 2,
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [76.150, 11.530],
        [76.210, 11.530],
        [76.210, 11.570],
        [76.150, 11.570],
        [76.150, 11.530]
      ]]
    }
  }
];

export const INITIAL_CHANGE_EVENTS: ChangeEvent[] = [
  {
    id: 'evt-hasdeo-001',
    aoi_id: 'aoi-hasdeo',
    aoi_name: 'Hasdeo Arand Forest Range',
    analysis_run_id: 'run-98231',
    category: 'VEGETATION_LOSS',
    title: 'Severe Canopy Clearance & Soil Exposure',
    description: 'High-confidence deforestation cluster detected in the central forest corridor. Delta NDVI dropped below -0.45 across 64 continuous hectares indicating mechanical timber removal.',
    baseline_date: '2025-01-15',
    recent_date: '2026-02-10',
    affected_area_hectares: 68.4,
    average_delta_index: -0.48,
    confidence: {
      magnitude_score: 0.94,
      spatial_consistency_score: 0.96,
      image_quality_score: 0.92,
      persistence_score: 0.88,
      overall_detection_confidence: 0.925,
      classification_confidence: 0.870
    },
    geojson_geometry: {
      type: 'MultiPolygon',
      coordinates: [
        [[
          [82.670, 22.815],
          [82.695, 22.818],
          [82.698, 22.835],
          [82.675, 22.832],
          [82.670, 22.815]
        ]]
      ]
    },
    review_status: 'PENDING',
    review_notes: 'Awaiting divisional forest officer field cross-check.',
    created_at: '2026-02-10T14:22:00Z'
  },
  {
    id: 'evt-sundarbans-002',
    aoi_id: 'aoi-sundarbans',
    aoi_name: 'Sundarbans Biosphere Delta',
    analysis_run_id: 'run-98232',
    category: 'WATER_EXPANSION',
    title: 'Estuarine Breach & Mangrove Submergence',
    description: 'Sudden high NDWI index surge detected across low-lying mudflat embankment with 84 hectares of mangrove fringing submerged by saline surge.',
    baseline_date: '2025-02-01',
    recent_date: '2026-02-18',
    affected_area_hectares: 84.2,
    average_delta_index: 0.52,
    confidence: {
      magnitude_score: 0.91,
      spatial_consistency_score: 0.93,
      image_quality_score: 0.89,
      persistence_score: 0.85,
      overall_detection_confidence: 0.895,
      classification_confidence: 0.842
    },
    geojson_geometry: {
      type: 'MultiPolygon',
      coordinates: [
        [[
          [88.835, 21.930],
          [88.865, 21.935],
          [88.860, 21.960],
          [88.830, 21.955],
          [88.835, 21.930]
        ]]
      ]
    },
    review_status: 'VERIFIED',
    review_notes: 'Confirmed by regional coastal zone management authority sensor buoy.',
    created_at: '2026-02-18T10:10:00Z'
  },
  {
    id: 'evt-bellandur-003',
    aoi_id: 'aoi-bellandur',
    aoi_name: 'Bellandur Lake Wetland',
    analysis_run_id: 'run-98233',
    category: 'WATER_SHRINKAGE',
    title: 'Wetland Desiccation & Perimeter Infill',
    description: 'Continuous reduction of open water sheet accompanied by artificial earth backfilling on the eastern inlet channel.',
    baseline_date: '2025-01-20',
    recent_date: '2026-02-22',
    affected_area_hectares: 18.6,
    average_delta_index: -0.38,
    confidence: {
      magnitude_score: 0.86,
      spatial_consistency_score: 0.90,
      image_quality_score: 0.95,
      persistence_score: 0.87,
      overall_detection_confidence: 0.895,
      classification_confidence: 0.850
    },
    geojson_geometry: {
      type: 'MultiPolygon',
      coordinates: [
        [[
          [77.668, 12.930],
          [77.680, 12.932],
          [77.678, 12.940],
          [77.666, 12.938],
          [77.668, 12.930]
        ]]
      ]
    },
    review_status: 'NEEDS_REVIEW',
    review_notes: 'Suspected seasonal water hyacinth blanket vs true earth reclamation.',
    created_at: '2026-02-22T16:45:00Z'
  },
  {
    id: 'evt-wayanad-004',
    aoi_id: 'aoi-wayanad',
    aoi_name: 'Wayanad Western Ghats Slope',
    analysis_run_id: 'run-98234',
    category: 'VEGETATION_LOSS',
    title: 'High-Relief Slope Scarring & Sediment Flow',
    description: 'Catastrophic canopy loss with exposed granitic substrate along steep valley drainage channel after intense monsoon precipitations.',
    baseline_date: '2025-03-01',
    recent_date: '2026-02-24',
    affected_area_hectares: 32.1,
    average_delta_index: -0.62,
    confidence: {
      magnitude_score: 0.98,
      spatial_consistency_score: 0.97,
      image_quality_score: 0.91,
      persistence_score: 0.92,
      overall_detection_confidence: 0.945,
      classification_confidence: 0.910
    },
    geojson_geometry: {
      type: 'MultiPolygon',
      coordinates: [
        [[
          [76.170, 11.540],
          [76.195, 11.545],
          [76.190, 11.560],
          [76.168, 11.555],
          [76.170, 11.540]
        ]]
      ]
    },
    review_status: 'VERIFIED',
    review_notes: 'Survey of India emergency topographic drone survey correlated.',
    created_at: '2026-02-24T18:05:00Z'
  }
];
