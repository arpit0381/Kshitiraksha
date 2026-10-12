import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AOI, ChangeEvent, AnalysisRunParams, ReviewStatus } from './types';
import { ApiService } from './services/api';
import { Header } from './components/common/Header';
import { MapWorkspace } from './components/map/MapWorkspace';
import { MapLibreGlobeWorkspace } from './components/map/MapLibreGlobeWorkspace';
import { SwipeComparison } from './components/comparison/SwipeComparison';
import { EventReviewStudio } from './components/events/EventReviewStudio';
import { ProjectsStudio } from './components/projects/ProjectsStudio';
import { X402PaymentModal } from './components/payments/X402PaymentModal';
import Loading from './components/landing/loading';
import { Layers, Eye, ShieldCheck, Zap, X, ArrowLeft, MapPin, Globe } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentTab, setCurrentTab] = useState<string>('map');
  const [drawerTab, setDrawerTab] = useState<'sweep' | 'analytics' | 'incidents'>('sweep');
  const [mapEngine, setMapEngine] = useState<'leaflet' | 'maplibre_globe'>('leaflet');
  const [activeModal, setActiveModal] = useState<'none' | 'swipe' | 'review' | 'x402'>('none');
  const [aois, setAois] = useState<AOI[]>([]);
  const [events, setEvents] = useState<ChangeEvent[]>([]);
  const [selectedAoi, setSelectedAoi] = useState<AOI | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<ChangeEvent | null>(null);

  // Load initial data from real live Backend API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const me = await ApiService.getMe();
        if (!me) {
          ApiService.logout();
          navigate('/login');
          return;
        }

        const [fetchedAois, fetchedEvents] = await Promise.all([
          ApiService.getAois(),
          ApiService.getEvents()
        ]);
        if (fetchedAois && fetchedAois.length > 0) {
          setAois(fetchedAois);
          setSelectedAoi(fetchedAois[0]);
        }
        if (fetchedEvents && fetchedEvents.length > 0) {
          setEvents(fetchedEvents);
          setSelectedEvent(fetchedEvents[0]);
        }
      } catch (err) {
        console.error('Failed to load initial data from backend:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  // Real-time live synchronization: polls every 6 seconds to capture newly detected alerts and events
  useEffect(() => {
    const syncRealtimeData = async () => {
      try {
        const [freshAois, freshEvents] = await Promise.all([
          ApiService.getAois(),
          ApiService.getEvents()
        ]);
        if (freshAois && freshAois.length > 0) {
          setAois(freshAois);
        }
        if (freshEvents && freshEvents.length > 0) {
          setEvents(freshEvents);
        }
      } catch (err) {
        // Silent real-time retry
      }
    };

    const timer = setInterval(syncRealtimeData, 6000);
    return () => clearInterval(timer);
  }, []);

  const handleTabChange = (tab: string) => {
    if (tab === 'map') {
      setCurrentTab('map');
      setDrawerTab('sweep');
      setActiveModal('none');
    } else if (tab === 'dashboard') {
      setCurrentTab('map');
      setDrawerTab('analytics');
      setActiveModal('none');
    } else if (tab === 'alerts') {
      setCurrentTab('map');
      setDrawerTab('incidents');
      setActiveModal('none');
    } else if (tab === 'swipe') {
      if (events.length > 0) {
        if (!selectedEvent) setSelectedEvent(events[0]);
        setActiveModal('swipe');
      }
    } else if (tab === 'review') {
      if (events.length > 0) {
        if (!selectedEvent) setSelectedEvent(events[0]);
        setActiveModal('review');
      }
    } else if (tab === 'x402') {
      setActiveModal('x402');
    } else if (tab === 'projects') {
      setCurrentTab('projects');
      setActiveModal('none');
    } else {
      setCurrentTab(tab);
    }
  };

  const handleRunAnalysis = async (params: AnalysisRunParams) => {
    const result = await ApiService.runAnalysis(params);
    if (result && result.event) {
      setEvents(prev => [result.event, ...prev]);
      setSelectedEvent(result.event);
      try {
        const freshAois = await ApiService.getAois();
        if (freshAois && freshAois.length > 0) {
          setAois(freshAois);
          const match = freshAois.find(a => a.id === params.aoi_id);
          if (match) setSelectedAoi(match);
        }
      } catch (e) {
        console.error('Failed to refresh AOI stats:', e);
      }
      // Immediately open the comparison inspector to review the detected disturbance
      setActiveModal('swipe');
    }
  };

  const handleUpdateStatus = async (eventId: string, status: ReviewStatus, notes?: string) => {
    const updated = await ApiService.updateReviewStatus(eventId, status, notes);
    setEvents(prev => prev.map(e => (e.id === eventId ? updated : e)));
    setSelectedEvent(updated);
  };

  const handleSelectEventForReview = (event: ChangeEvent) => {
    setSelectedEvent(event);
    setActiveModal('review');
  };

  const handleOpenSwipe = (event: ChangeEvent) => {
    setSelectedEvent(event);
    setActiveModal('swipe');
  };

  const handleAoiCreated = (newAoi: AOI) => {
    setAois(prev => [newAoi, ...prev]);
    setSelectedAoi(newAoi);
  };

  const pendingAlertsCount = events.filter(e => e.review_status === 'PENDING').length;

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-canvas)', overflow: 'hidden' }}>
      {/* Header Navigation */}
      <Header
        currentTab={currentTab === 'map' ? (drawerTab === 'analytics' ? 'dashboard' : drawerTab === 'incidents' ? 'alerts' : 'map') : currentTab}
        onTabChange={handleTabChange}
        pendingAlertsCount={pendingAlertsCount}
      />

      {/* Main Content */}
      <main style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {currentTab === 'projects' ? (
          <div style={{ height: '100%', overflowY: 'auto', backgroundColor: 'var(--bg-canvas)' }}>
            <div style={{
              padding: '14px 24px',
              borderBottom: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-surface)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={() => {
                    setCurrentTab('map');
                    setDrawerTab('sweep');
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ gap: '6px' }}
                >
                  <ArrowLeft size={14} />
                  <span>Back to Map</span>
                </button>
                <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  My Monitored Areas
                </span>
              </div>
              <span className="badge badge-emerald font-mono">{aois.length} Areas</span>
            </div>

            <ProjectsStudio
              aois={aois}
              onSelectAoi={(aoi) => {
                setSelectedAoi(aoi);
                setCurrentTab('map');
                setDrawerTab('sweep');
              }}
              onNavigateToMap={() => {
                setCurrentTab('map');
                setDrawerTab('sweep');
              }}
            />
          </div>
        ) : (
          /* Map View (Supports both Leaflet HD Satellite and MapLibre 3D Globe) */
          selectedAoi ? (
            mapEngine === 'maplibre_globe' ? (
              <MapLibreGlobeWorkspace
                aois={aois}
                events={events}
                selectedAoi={selectedAoi}
                onSelectAoi={setSelectedAoi}
                onSwitchToLeaflet={() => setMapEngine('leaflet')}
                onOpenEventReview={handleSelectEventForReview}
                onOpenSwipe={handleOpenSwipe}
              />
            ) : (
              <MapWorkspace
                aois={aois}
                events={events}
                selectedAoi={selectedAoi}
                onSelectAoi={setSelectedAoi}
                onRunAnalysis={handleRunAnalysis}
                onOpenEventReview={handleSelectEventForReview}
                onOpenSwipe={handleOpenSwipe}
                onAoiCreated={handleAoiCreated}
                activeDrawerTab={drawerTab}
                onDrawerTabChange={setDrawerTab}
                onSwitchToGlobe={() => setMapEngine('maplibre_globe')}
              />
            )
          ) : (
            /* Welcome / Empty State */
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              padding: '24px'
            }}>
              <div style={{
                textAlign: 'center',
                padding: '48px 40px',
                maxWidth: '500px',
                background: 'var(--bg-surface)',
                borderRadius: '20px',
                border: '1px solid var(--border-subtle)',
                boxShadow: '0 4px 20px rgba(60,64,67,0.1)'
              }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, rgba(26,115,232,0.1), rgba(30,142,62,0.1))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px'
                }}>
                  <MapPin size={28} style={{ color: 'var(--primary-500)' }} />
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  Welcome to Kshitiraksha!
                </h2>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '4px' }}>
                  Loading your monitored areas...
                </p>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  If this is your first time, draw an area on the map or upload a GeoJSON file to start monitoring.
                </p>
              </div>
            </div>
          )
        )}

        {/* ── Before & After Comparison Modal ── */}
        {activeModal === 'swipe' && selectedEvent && (
          <div className="modal-overlay" style={{ padding: '12px' }}>
            <div
              className="modal-content"
              style={{
                maxWidth: '1320px',
                width: '100%',
                height: '92vh',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '16px',
                overflow: 'hidden',
                backgroundColor: 'var(--bg-surface)'
              }}
            >
              {/* Modal Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 20px',
                  borderBottom: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-surface)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Eye size={18} style={{ color: 'var(--primary-500)' }} />
                  <div>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Before & After Comparison
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '8px' }}>
                      • {selectedEvent.title} ({selectedEvent.affected_area_hectares.toFixed(1)} ha affected)
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => setActiveModal('review')}
                    className="btn btn-primary btn-sm"
                    style={{ gap: '6px' }}
                  >
                    <ShieldCheck size={14} />
                    <span>Verify This Change</span>
                  </button>
                  <button
                    onClick={() => setActiveModal('none')}
                    className="btn btn-secondary btn-sm"
                    style={{ gap: '6px' }}
                  >
                    <X size={14} />
                    <span>Close</span>
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div style={{ flex: 1, overflowY: 'auto' }}>
                <SwipeComparison
                  event={selectedEvent}
                  events={events}
                  onSelectEvent={setSelectedEvent}
                  onBackToMap={() => setActiveModal('none')}
                  onNavigateToReview={(evt) => {
                    setSelectedEvent(evt);
                    setActiveModal('review');
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Verification Studio Modal ── */}
        {activeModal === 'review' && selectedEvent && (
          <div className="modal-overlay" style={{ padding: '12px' }}>
            <div
              className="modal-content"
              style={{
                maxWidth: '1240px',
                width: '100%',
                height: '92vh',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '16px',
                overflow: 'hidden',
                backgroundColor: 'var(--bg-surface)'
              }}
            >
              {/* Modal Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 20px',
                  borderBottom: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-surface)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ShieldCheck size={18} style={{ color: 'var(--copper-500)' }} />
                  <div>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Verify Change
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '8px' }}>
                      • {selectedEvent.title}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => setActiveModal('swipe')}
                    className="btn btn-secondary btn-sm"
                    style={{ gap: '6px' }}
                  >
                    <Eye size={14} />
                    <span>View Comparison</span>
                  </button>
                  <button
                    onClick={() => setActiveModal('none')}
                    className="btn btn-secondary btn-sm"
                    style={{ gap: '6px' }}
                  >
                    <X size={14} />
                    <span>Close</span>
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div style={{ flex: 1, overflowY: 'auto' }}>
                <EventReviewStudio
                  event={selectedEvent}
                  events={events}
                  onSelectEvent={setSelectedEvent}
                  onUpdateStatus={handleUpdateStatus}
                  onOpenSwipe={handleOpenSwipe}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Blockchain Payments Modal ── */}
        {activeModal === 'x402' && (
          <div className="modal-overlay" style={{ padding: '12px' }}>
            <div
              className="modal-content"
              style={{
                maxWidth: '900px',
                width: '100%',
                maxHeight: '88vh',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '16px',
                overflow: 'hidden',
                backgroundColor: 'var(--bg-surface)'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 20px',
                  borderBottom: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-surface)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Zap size={18} style={{ color: 'var(--amber-500)' }} />
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Blockchain Payments (AlgoKit x402)
                  </span>
                </div>
                <button
                  onClick={() => setActiveModal('none')}
                  className="btn btn-secondary btn-sm"
                >
                  <X size={14} />
                  <span>Close</span>
                </button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto' }}>
                <X402PaymentModal />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer Status Bar */}
      <footer
        style={{
          padding: '6px 20px',
          backgroundColor: 'var(--bg-surface)',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: '11px',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          zIndex: 800
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span>Kshitiraksha • Satellite Change Detection Platform</span>
          <span>Sensor: <b>Sentinel-2 (10m resolution)</b></span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }} className="font-mono">
          <span style={{ color: 'var(--emerald-500)' }}>● Connected</span>
        </div>
      </footer>
    </div>
  );
};
