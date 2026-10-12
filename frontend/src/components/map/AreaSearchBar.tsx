import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Sparkles, X, Loader2, Navigation } from 'lucide-react';
import { AOI } from '../../types';

export interface SelectedLocation {
  name: string;
  description: string;
  center: [number, number]; // [lat, lng]
  zoom: number;
  category: 'VEGETATION_LOSS' | 'WATER_EXPANSION' | 'WATER_SHRINKAGE' | 'BUILT_UP_CHANGE';
  area_hectares: number;
  coordinates?: [number, number][]; // [lng, lat]
  isExistingAoiId?: string;
}

interface AreaSearchBarProps {
  existingAois: AOI[];
  selectedAoi: AOI | null;
  onSelectLocation: (location: SelectedLocation) => void;
}

// Curated high-priority hotspots across India matching environmental, forestry, and water monitoring use cases
export const INDIAN_HOTSPOTS: SelectedLocation[] = [
  {
    name: 'PSIT Kanpur & NH-19 Urban Buffer',
    description: 'Kanpur Nagar, Uttar Pradesh • Campus & urban growth corridor',
    center: [26.4725, 80.2031],
    zoom: 14,
    category: 'BUILT_UP_CHANGE',
    area_hectares: 240.0
  },
  {
    name: 'Hasdeo Arand Forest Dense Canopy',
    description: 'Korba & Surguja, Chhattisgarh • Sal & teak biodiversity corridor',
    center: [22.825, 82.685],
    zoom: 13,
    category: 'VEGETATION_LOSS',
    area_hectares: 480.0
  },
  {
    name: 'Aarey Milk Colony & SGNP Edge',
    description: 'Mumbai Suburban, Maharashtra • Urban green lung and infra watch',
    center: [19.148, 72.883],
    zoom: 14,
    category: 'VEGETATION_LOSS',
    area_hectares: 175.0
  },
  {
    name: 'National Chambal River Sanctuary',
    description: 'Morena, Madhya Pradesh • Riverine sand mining and gravel monitoring',
    center: [26.702, 78.182],
    zoom: 13,
    category: 'WATER_SHRINKAGE',
    area_hectares: 350.0
  },
  {
    name: 'Kaziranga National Park Floodplain',
    description: 'Golaghat & Nagaon, Assam • Brahmaputra wetlands & wildlife corridor',
    center: [26.577, 93.171],
    zoom: 13,
    category: 'WATER_EXPANSION',
    area_hectares: 620.0
  },
  {
    name: 'Sundarbans Mangrove Biosphere',
    description: 'South 24 Parganas, West Bengal • Tidal mangrove erosion & conservation',
    center: [21.949, 88.899],
    zoom: 12,
    category: 'VEGETATION_LOSS',
    area_hectares: 850.0
  },
  {
    name: 'Rajaji National Park & Dehradun Forest',
    description: 'Dehradun, Uttarakhand • Shivalik foothill forest fringe surveillance',
    center: [30.155, 78.156],
    zoom: 13,
    category: 'VEGETATION_LOSS',
    area_hectares: 390.0
  },
  {
    name: 'Bellandur & Varthur Wetland Catchment',
    description: 'Bengaluru, Karnataka • Urban lake encroachment & seasonal change',
    center: [12.936, 77.674],
    zoom: 14,
    category: 'WATER_SHRINKAGE',
    area_hectares: 210.0
  }
];

export const AreaSearchBar: React.FC<AreaSearchBarProps> = ({
  existingAois,
  selectedAoi,
  onSelectLocation
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [onlineResults, setOnlineResults] = useState<SelectedLocation[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search with Nominatim fallback
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setOnlineResults([]);
      setIsSearchingOnline(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingOnline(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&countrycodes=in&viewbox=68.0,37.5,97.5,6.5&bounded=1&limit=5&addressdetails=1`;
        const res = await fetch(url, {
          headers: { 'Accept-Language': 'en' }
        });
        if (res.ok) {
          const data = await res.json();
          const parsed: SelectedLocation[] = data.map((item: any) => ({
            name: item.name || item.display_name.split(',')[0],
            description: item.display_name,
            center: [parseFloat(item.lat), parseFloat(item.lon)],
            zoom: 13,
            category: 'VEGETATION_LOSS' as const,
            area_hectares: 250.0
          }));
          setOnlineResults(parsed);
        }
      } catch (err) {
        console.warn('Geocoding search error:', err);
      } finally {
        setIsSearchingOnline(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  // Filter existing AOIs
  const matchedExistingAois: SelectedLocation[] = existingAois
    .filter(
      a =>
        a.name.toLowerCase().includes(query.toLowerCase()) ||
        (a.description && a.description.toLowerCase().includes(query.toLowerCase()))
    )
    .map(a => ({
      name: a.name,
      description: a.description || `Monitored Area (${a.area_hectares.toFixed(1)} ha)`,
      center: a.center,
      zoom: a.zoom || 13,
      category: a.category as any,
      area_hectares: a.area_hectares,
      isExistingAoiId: a.id
    }));

  // Filter hotspots
  const matchedHotspots = INDIAN_HOTSPOTS.filter(
    h =>
      h.name.toLowerCase().includes(query.toLowerCase()) ||
      h.description.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (loc: SelectedLocation) => {
    onSelectLocation(loc);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', maxWidth: '440px' }}>
      {/* Search Bar Input */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 4px 18px rgba(0, 0, 0, 0.12)',
          border: '1px solid var(--border-subtle)',
          transition: 'all 200ms ease'
        }}
      >
        <Search size={16} style={{ color: 'var(--primary-500)', flexShrink: 0 }} />
        <input
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={e => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          placeholder="Search any area, city, forest, or river in India..."
          style={{
            border: 'none',
            outline: 'none',
            backgroundColor: 'transparent',
            fontSize: '13px',
            color: 'var(--text-primary)',
            width: '100%',
            fontWeight: 500
          }}
        />

        {isSearchingOnline && (
          <Loader2 size={15} style={{ animation: 'spin 1s linear infinite', color: 'var(--text-muted)' }} />
        )}

        {query && (
          <button
            onClick={() => {
              setQuery('');
              setOnlineResults([]);
            }}
            style={{
              background: 'none',
              border: 'none',
              padding: '2px',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            maxHeight: '380px',
            overflowY: 'auto',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-floating)',
            border: '1px solid var(--border-subtle)',
            zIndex: 1100,
            padding: '8px'
          }}
        >
          {/* Quick preset chips when input is empty */}
          {!query && (
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 8px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}
              >
                <Sparkles size={12} style={{ color: 'var(--primary-500)' }} />
                <span>Featured Monitoring Hotspots</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {INDIAN_HOTSPOTS.map((h, i) => (
                  <div
                    key={i}
                    onClick={() => handleSelect(h)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                      transition: 'background 150ms'
                    }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-elevated)')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                      <MapPin size={14} style={{ color: 'var(--primary-500)', flexShrink: 0 }} />
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                          {h.name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                          {h.description}
                        </div>
                      </div>
                    </div>
                    <span className="badge badge-neutral font-mono" style={{ fontSize: '9px', flexShrink: 0 }}>
                      {h.area_hectares} ha
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* When user typed something */}
          {query && (
            <>
              {/* Existing monitored AOIs */}
              {matchedExistingAois.length > 0 && (
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ padding: '4px 8px', fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Saved Monitoring Areas
                  </div>
                  {matchedExistingAois.map((a, i) => (
                    <div
                      key={`aoi-${i}`}
                      onClick={() => handleSelect(a)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px'
                      }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-elevated)')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Navigation size={14} style={{ color: 'var(--emerald-500)' }} />
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{a.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{a.description}</div>
                        </div>
                      </div>
                      <span className="badge badge-emerald font-mono" style={{ fontSize: '9px' }}>Saved</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Matching Indian Hotspots */}
              {matchedHotspots.length > 0 && (
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ padding: '4px 8px', fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Hotspot Matches
                  </div>
                  {matchedHotspots.map((h, i) => (
                    <div
                      key={`hot-${i}`}
                      onClick={() => handleSelect(h)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px'
                      }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-elevated)')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MapPin size={14} style={{ color: 'var(--primary-500)' }} />
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{h.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{h.description}</div>
                        </div>
                      </div>
                      <span className="badge badge-neutral font-mono" style={{ fontSize: '9px' }}>{h.area_hectares} ha</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Online Geocoding Results */}
              {onlineResults.length > 0 && (
                <div>
                  <div style={{ padding: '4px 8px', fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Locations in India (OpenStreetMap)
                  </div>
                  {onlineResults.map((r, i) => (
                    <div
                      key={`online-${i}`}
                      onClick={() => handleSelect(r)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-elevated)')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <MapPin size={14} style={{ color: 'var(--amber-500)', flexShrink: 0 }} />
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                          {r.name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                          {r.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {matchedExistingAois.length === 0 && matchedHotspots.length === 0 && onlineResults.length === 0 && !isSearchingOnline && (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                  No locations found. Try searching a city, district, or landmark name.
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
