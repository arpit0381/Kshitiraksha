import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AOI, ChangeEvent, AnalysisRunParams, ReviewStatus } from './types';
import { ApiService } from './services/api';
import { Header } from './components/common/Header';
import { MetricsGrid } from './components/dashboard/MetricsGrid';
import { CategoryBreakdown } from './components/dashboard/CategoryBreakdown';
import { RecentEventsList } from './components/dashboard/RecentEventsList';
import { MapWorkspace } from './components/map/MapWorkspace';
import { SwipeComparison } from './components/comparison/SwipeComparison';
import { EventReviewStudio } from './components/events/EventReviewStudio';
import { AlertsCenter } from './components/alerts/AlertsCenter';
import { ProjectsStudio } from './components/projects/ProjectsStudio';
import { X402PaymentModal } from './components/payments/X402PaymentModal';
import Loading from './components/landing/loading';
import { Layers, Bell, Zap, Eye } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
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
      // Navigate to comparison studio to view immediate evidence
      setCurrentTab('swipe');
    }
  };

  const handleUpdateStatus = async (eventId: string, status: ReviewStatus, notes?: string) => {
    const updated = await ApiService.updateReviewStatus(eventId, status, notes);
    setEvents(prev => prev.map(e => (e.id === eventId ? updated : e)));
    setSelectedEvent(updated);
  };

  const handleSelectEventForReview = (event: ChangeEvent) => {
    setSelectedEvent(event);
    setCurrentTab('review');
  };

  const handleOpenSwipe = (event: ChangeEvent) => {
    setSelectedEvent(event);
    setCurrentTab('swipe');
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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-canvas)' }}>
      {/* Top Navigation Header */}
      <Header
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        pendingAlertsCount={pendingAlertsCount}
      />

      {/* Main Content Area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {currentTab === 'dashboard' && (
          <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Quick Action Banner */}
            <div
              className="card"
              style={{
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-card) 100%)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Active Satellite Watch: <b>{aois.length} AOIs Protected</b>
                </span>
                <span className="badge badge-emerald font-mono">10m Sentinel-2 Pass Ready</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <button onClick={() => setCurrentTab('map')} className="btn btn-primary btn-sm" style={{ gap: '6px' }}>
                  <Layers size={14} />
                  <span>Launch Map Workspace</span>
                </button>
                <button onClick={() => setCurrentTab('swipe')} className="btn btn-secondary btn-sm" style={{ gap: '6px' }}>
                  <Eye size={14} />
                  <span>Open Comparison Studio</span>
                </button>
                <button onClick={() => setCurrentTab('alerts')} className="btn btn-secondary btn-sm" style={{ gap: '6px' }}>
                  <Bell size={14} />
                  <span>Emergency Alerts ({pendingAlertsCount})</span>
                </button>
                <button onClick={() => setCurrentTab('x402')} className="btn btn-amber btn-sm" style={{ gap: '6px' }}>
                  <Zap size={14} />
                  <span>x402 Micropayments</span>
                </button>
              </div>
            </div>

            {/* Top Metrics Row */}
            <MetricsGrid aois={aois} events={events} />

            {/* Disturbance Distribution */}
            <CategoryBreakdown events={events} />

            {/* Recent Anomaly Events with Search & Filters */}
            <RecentEventsList
              events={events}
              onSelectEvent={handleSelectEventForReview}
              onOpenSwipe={handleOpenSwipe}
            />
          </div>
        )}

        {currentTab === 'projects' && (
          <ProjectsStudio
            aois={aois}
            onSelectAoi={(aoi) => {
              setSelectedAoi(aoi);
              setCurrentTab('map');
            }}
            onNavigateToMap={() => setCurrentTab('map')}
          />
        )}

        {currentTab === 'map' && selectedAoi && (
          <MapWorkspace
            aois={aois}
            events={events}
            selectedAoi={selectedAoi}
            onSelectAoi={setSelectedAoi}
            onRunAnalysis={handleRunAnalysis}
            onOpenEventReview={handleSelectEventForReview}
            onAoiCreated={handleAoiCreated}
          />
        )}

        {currentTab === 'swipe' && selectedEvent && (
          <SwipeComparison
            event={selectedEvent}
            events={events}
            onSelectEvent={setSelectedEvent}
            onBackToMap={() => setCurrentTab('map')}
            onNavigateToReview={handleSelectEventForReview}
          />
        )}

        {currentTab === 'review' && selectedEvent && (
          <EventReviewStudio
            event={selectedEvent}
            events={events}
            onSelectEvent={setSelectedEvent}
            onUpdateStatus={handleUpdateStatus}
            onOpenSwipe={handleOpenSwipe}
          />
        )}

        {currentTab === 'alerts' && (
          <AlertsCenter
            events={events}
            aois={aois}
            onSelectEventForReview={handleSelectEventForReview}
          />
        )}

        {currentTab === 'x402' && (
          <X402PaymentModal />
        )}
      </main>

      {/* Footer Status Bar */}
      <footer
        style={{
          padding: '10px 24px',
          backgroundColor: 'var(--bg-surface)',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: '11px',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span>Kshitiraksha • Satellite Change Detection System</span>
          <span>Optical Sensor: <b>Sentinel-2 MSI (10m L2A BOA)</b></span>
          <span>Processing Engine: <b>OpenCV + NumPy + GeoJSON</b></span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }} className="font-mono">
          <span>AlgoKit Facilitator: <b>Online</b></span>
          <span style={{ color: 'var(--emerald-500)' }}>● Live Backend Connected</span>
        </div>
      </footer>
    </div>
  );
};
