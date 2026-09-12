export type ChangeCategory =
  | 'VEGETATION_LOSS'
  | 'WATER_EXPANSION'
  | 'WATER_SHRINKAGE'
  | 'BARE_SOIL_EXPANSION'
  | 'BUILT_UP_CHANGE'
  | 'FLOODING'
  | 'UNKNOWN_SIGNIFICANT_CHANGE';

export type ReviewStatus = 'PENDING' | 'VERIFIED' | 'FALSE_POSITIVE' | 'NEEDS_REVIEW';

export type SpectralBandMode = 'TRUE_COLOR' | 'FALSE_COLOR_IR' | 'NDVI_DELTA' | 'NDWI';

export type ComparisonMode = 'SWIPE' | 'SIDE_BY_SIDE' | 'DIFFERENCE_MASK';

export interface ConfidenceBreakdown {
  magnitude_score: number;
  spatial_consistency_score: number;
  image_quality_score: number;
  persistence_score: number;
  overall_detection_confidence: number;
  classification_confidence: number;
}

export interface AOI {
  id: string;
  project_id?: string;
  name: string;
  description?: string;
  preset_key?: string;
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
  center: [number, number]; // [lat, lng]
  zoom: number;
  area_hectares: number;
  created_at: string;
  last_monitored_at?: string;
  active_alerts_count: number;
  category?: ChangeCategory;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  department: string;
  created_at: string;
  aoi_ids: string[];
  monitoring_frequency: 'DAILY' | 'ORBITAL_5DAY' | 'WEEKLY' | 'MONTHLY';
  status: 'ACTIVE' | 'PAUSED';
}

export interface SatelliteObservation {
  id: string;
  aoi_id: string;
  satellite: 'Sentinel-2A' | 'Sentinel-2B' | 'Landsat-9' | 'EOS-04';
  date: string;
  cloud_cover_pct: number;
  gsd_m: number;
  sun_elevation_deg: number;
  tile_id: string;
  preview_url?: string;
  quality_grade: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR_CLOUD_COVER';
}

export interface ChangeEvent {
  id: string;
  aoi_id: string;
  aoi_name: string;
  analysis_run_id: string;
  category: ChangeCategory;
  title: string;
  description: string;
  baseline_date: string;
  recent_date: string;
  affected_area_hectares: number;
  average_delta_index: number;
  confidence: ConfidenceBreakdown;
  geojson_geometry: {
    type: 'MultiPolygon' | 'Polygon';
    coordinates: any[];
  };
  review_status: ReviewStatus;
  review_notes?: string;
  created_at: string;
  baseline_image_url?: string;
  recent_image_url?: string;
}

export interface AlertNotification {
  id: string;
  event_id: string;
  event_title: string;
  aoi_name: string;
  category: ChangeCategory;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO';
  sent_at: string;
  channel: 'DASHBOARD' | 'EMAIL' | 'WEBHOOK' | 'SMS';
  recipient: string;
  status: 'DELIVERED' | 'DISPATCHED' | 'FAILED';
  affected_area_hectares: number;
  confidence_pct: number;
}

export interface AlertRule {
  id: string;
  aoi_id: string;
  category: ChangeCategory;
  min_confidence: number;
  min_area_hectares: number;
  delta_threshold: number;
  channels: ('DASHBOARD' | 'EMAIL' | 'WEBHOOK' | 'SMS')[];
  enabled: boolean;
}

export interface AnalysisRunParams {
  aoi_id: string;
  baseline_date: string;
  recent_date: string;
  vegetation_loss_threshold: number;
  min_area_hectares: number;
  cloud_mask_strictness: number;
  priority_level: 'STANDARD' | 'PRIORITY';
}

export interface X402Challenge {
  status: 'PAYMENT_REQUIRED';
  code: 402;
  resource: string;
  amount_algo: number;
  currency: 'ALGO';
  network: string;
  destination_address: string;
  challenge_token: string;
  expires_in_seconds: number;
  instructions: string;
}

export interface X402PaymentRecord {
  tx_id: string;
  resource: string;
  service_name: string;
  amount_algo: number;
  timestamp: string;
  sender: string;
  status: 'CONFIRMED' | 'PENDING' | 'FAILED';
  block_number: number;
}
