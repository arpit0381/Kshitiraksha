import React, { useState, useEffect } from 'react';
import { AOI, ChangeEvent, AnalysisRunParams, ReviewStatus } from './types';
import { BENCHMARK_AOIS, INITIAL_CHANGE_EVENTS } from './services/mockData';
import { ApiService } from './services/api';
import { Header } from './components/common/Header';
import { MetricsGrid } from './components/dashboard/MetricsGrid';
import { CategoryBreakdown } from './components/dashboard/CategoryBreakdown';
import { RecentEventsList } from './components/dashboard/RecentEventsList';
import { MapWorkspace } from './components/map/MapWorkspace';
import { SwipeComparison } from './components/comparison/SwipeComparison';
import { EventReviewStudio } from './components/events/EventReviewStudio';
import { X402PaymentModal } from './components/payments/X402PaymentModal';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [aois, setAois] = useState<AOI[]>(BENCHMARK_AOIS);
  const [events, setEvents] = useState<ChangeEvent[]>(INITIAL_CHANGE_EVENTS);
  const [selectedAoi, setSelectedAoi] = useState<AOI>(BENCHMARK_AOIS[0]);
  const [selectedEvent, setSelectedEvent] = useState<ChangeEvent>(INITIAL_CHANGE_EVENTS[0]);

  // Load initial data from API (with mock fallback)
  useEffect(() => {
    const fetchData = async () => {
      const fetchedAois = await ApiService.getAois();
      if (fetchedAois && fetchedAois.length > 0) {
        setAois(fetchedAois);
        setSelectedAoi(fetchedAois[0]);
      }
      const fetchedEvents = await ApiService.getEvents();
      if (fetchedEvents && fetchedEvents.length > 0) {
        setEvents(fetchedEvents);
        setSelectedEvent(fetchedEvents[0]);
      }
    };
    fetchData();
  }, []);

  const handleRunAnalysis = async (params: AnalysisRunParams) => {
    const result = await ApiService.runAnalysis(params);
    if (result && result.event) {
      setEvents(prev => [result.event, ...prev]);
      setSelectedEvent(result.event);
      // Navigate to swipe studio to view immediate evidence
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

  const pendingAlertsCount = events.filter(e => e.review_status === 'PENDING').length;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-canvas)' }}>
      {/* Human-Crafted Top Navigation Header */}
      <Header
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        pendingAlertsCount={pendingAlertsCount}
      />

      {/* Main Content Area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {currentTab === 'dashboard' && (
          <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
            {/* Top Metrics Row */}
            <MetricsGrid aois={aois} events={events} />

            {/* Disturbance Distribution */}
            <CategoryBreakdown events={events} />

            {/* Recent Anomaly Events */}
            <RecentEventsList
              events={events}
              onSelectEvent={handleSelectEventForReview}
              onOpenSwipe={handleOpenSwipe}
            />
          </div>
        )}

        {currentTab === 'map' && (
          <MapWorkspace
            aois={aois}
            events={events}
            selectedAoi={selectedAoi}
            onSelectAoi={setSelectedAoi}
            onRunAnalysis={handleRunAnalysis}
            onOpenEventReview={handleSelectEventForReview}
          />
        )}

        {currentTab === 'swipe' && (
          <SwipeComparison
            event={selectedEvent}
            onBackToMap={() => setCurrentTab('map')}
          />
        )}

        {currentTab === 'review' && (
          <EventReviewStudio
            event={selectedEvent}
            onUpdateStatus={handleUpdateStatus}
            onOpenSwipe={handleOpenSwipe}
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
          <span>GeoWatch Earth • Satellite Change Detection System</span>
          <span>Optical Sensor: <b>Sentinel-2 MSI (10m L2A)</b></span>
          <span>Processing Engine: <b>OpenCV + NumPy + GeoJSON</b></span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }} className="font-mono">
          <span>AlgoKit Facilitator: <b>Online</b></span>
          <span style={{ color: 'var(--emerald-500)' }}>● All Systems Operational</span>
        </div>
      </footer>
    </div>
  );
};
