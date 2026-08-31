import React from 'react';
import { Compass, Maximize2, Shield } from 'lucide-react';

interface CoordinateBarProps {
  cursorLat: number | null;
  cursorLng: number | null;
  zoom: number;
  selectedAoiName: string;
  selectedAoiArea: number;
  basemap: string;
  onBasemapChange: (basemap: string) => void;
}

export const CoordinateBar: React.FC<CoordinateBarProps> = ({
  cursorLat,
  cursorLng,
  zoom,
  selectedAoiName,
  selectedAoiArea,
  basemap,
  onBasemapChange
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 16px',
        backgroundColor: 'var(--bg-surface)',
        borderTop: '1px solid var(--border-subtle)',
        fontSize: '12px',
        color: 'var(--text-secondary)',
        gap: '16px',
        flexWrap: 'wrap'
      }}
    >
      {/* Telemetry Readout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }} className="font-mono">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Compass size={14} style={{ color: 'var(--emerald-500)' }} />
          <span>
            {cursorLat !== null && cursorLng !== null
              ? `${cursorLat.toFixed(4)}°N, ${cursorLng.toFixed(4)}°E`
              : 'Hover map for coordinates'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Maximize2 size={13} />
          <span>Zoom: {zoom}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Shield size={13} style={{ color: 'var(--amber-500)' }} />
          <span>AOI: {selectedAoiName} ({selectedAoiArea.toFixed(1)} ha)</span>
        </div>
      </div>

      {/* Basemap Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>
          Basemap:
        </span>
        <select
          value={basemap}
          onChange={e => onBasemapChange(e.target.value)}
          style={{
            padding: '3px 8px',
            fontSize: '11px',
            fontWeight: 600,
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--bg-card)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-subtle)',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          <option value="satellite">Esri World Imagery (Satellite)</option>
          <option value="carto-dark">Carto Dark Matter (Vector Dark)</option>
          <option value="carto-light">Carto Positron (Vector Light)</option>
          <option value="osm">OpenStreetMap Standard</option>
        </select>
      </div>
    </div>
  );
};
