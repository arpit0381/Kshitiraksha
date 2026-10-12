import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AOI, ChangeEvent, AnalysisRunParams, ReviewStatus } from './types';
import { ApiService } from './services/api';
import { Header } from './components/common/Header';
import { MapWorkspace } from './components/map/MapWorkspace';
import { SwipeComparison } from './components/comparison/SwipeComparison';
import { EventReviewStudio } from './components/events/EventReviewStudio';
import { ProjectsStudio } from './components/projects/ProjectsStudio';
import { X402PaymentModal } from './components/payments/X402PaymentModal';
import Loading from './components/landing/loading';
import { Layers, Eye, ShieldCheck, Zap, X, ArrowLeft, RefreshCw, Activity } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentTab, setCurrentTab] = useState<string>('map');
  const [drawerTab, setDrawerTab] = useState<'sweep' | 'analytics' | 'incidents'>('sweep');
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
      {/* Top Google Maps Style Header */}
      <Header
        currentTab={currentTab === 'map' ? (drawerTab === 'analytics' ? 'dashboard' : drawerTab === 'incidents' ? 'alerts' : 'map') : currentTab}
        onTabChange={handleTabChange}
        pendingAlertsCount={pendingAlertsCount}
      />

      {/* Main Unified Viewport */}
      <main style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {currentTab === 'projects' ? (
          <div style={{ height: '100%', overflowY: 'auto', backgroundColor: 'var(--bg-canvas)' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                  <span>Return to Interactive Map</span>
                </button>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Monitored Conservation Projects
                </span>
              </div>
              <span className="badge badge-emerald font-mono">{aois.length} Active Reserves</span>
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
          /* Map-Centric Foundation (Always visible and living) */
          selectedAoi ? (
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
            />
          ) : (
            <div style={{ padding: '48px 24px', maxWidth: '800px', margin: '40px auto', textAlign: 'center' }} className="card">
              <Layers size={40} style={{ color: 'var(--emerald-500)', margin: '0 auto 16px auto' }} />
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                Loading Protected Surveillance Areas...
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                Connecting to Sentinel-2 multi-spectral GIS catalog.
              </p>
            </div>
          )
        )}

        {/* Dual-Pass Satellite Comparison Inspector Modal */}
        {activeModal === 'swipe' && selectedEvent && (
          <div className="modal-overlay" style={{ padding: '16px' }}>
            <div
              className="modal-content"
              style={{
                maxWidth: '1320px',
                width: '100%',
                height: '92vh',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                backgroundColor: 'var(--bg-surface)'
              }}
            >
              {/* Modal Top Bar */}
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
                      Sentinel-2 Dual-Pass Optical Evidence Inspector
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '8px' }}>
                      • {selectedEvent.title} ({selectedEvent.affected_area_hectares.toFixed(1)} ha)
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
                    <span>Proceed to Verification</span>
                  </button>
                  <button
                    onClick={() => setActiveModal('none')}
                    className="btn btn-secondary btn-sm"
                    style={{ gap: '6px' }}
                  >
                    <X size={14} />
                    <span>Close to Map</span>
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

        {/* Ground Truth Verification Studio Modal */}
        {activeModal === 'review' && selectedEvent && (
          <div className="modal-overlay" style={{ padding: '16px' }}>
            <div
              className="modal-content"
              style={{
                maxWidth: '1240px',
                width: '100%',
                height: '92vh',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                backgroundColor: 'var(--bg-surface)'
              }}
            >
              {/* Modal Top Bar */}
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
                      Incident Verification & Ground Truth Dossier
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
                    <span>View Dual-Pass Swipe</span>
                  </button>
                  <button
                    onClick={() => setActiveModal('none')}
                    className="btn btn-secondary btn-sm"
                    style={{ gap: '6px' }}
                  >
                    <X size={14} />
                    <span>Close to Map</span>
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

        {/* AlgoKit x402 Micropayments Modal */}
        {activeModal === 'x402' && (
          <div className="modal-overlay" style={{ padding: '16px' }}>
            <div
              className="modal-content"
              style={{
                maxWidth: '900px',
                width: '100%',
                maxHeight: '88vh',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 'var(--radius-lg)',
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
                    AlgoKit x402 Micropayments & Verification Ledger
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
          padding: '8px 20px',
          backgroundColor: 'var(--bg-surface)',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: '11px',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          zIndex: 800
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span>Kshitiraksha • Google Earth Style Satellite GIS</span>
          <span>Sensor: <b>Sentinel-2 MSI (10m L2A BOA)</b></span>
          <span>Processing: <b>OpenCV Morphology & Multi-spectral Differencing</b></span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }} className="font-mono">
          <span>AlgoKit Protocol: <b>Online</b></span>
          <span style={{ color: 'var(--emerald-500)' }}>● Live Backend Synced</span>
        </div>
      </footer>
    </div>
  );
};
