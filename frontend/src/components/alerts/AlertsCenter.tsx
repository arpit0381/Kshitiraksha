import React, { useState, useEffect } from 'react';
import { AlertNotification, AlertRule, ChangeEvent, AOI } from '../../types';
import { ApiService } from '../../services/api';
import {
  Bell,
  Mail,
  Smartphone,
  Webhook,
  Send,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Shield,
  PlusCircle,
  Radio,
  ExternalLink
} from 'lucide-react';

interface AlertsCenterProps {
  events: ChangeEvent[];
  aois: AOI[];
  onSelectEventForReview?: (event: ChangeEvent) => void;
}

export const AlertsCenter: React.FC<AlertsCenterProps> = ({ events, aois, onSelectEventForReview }) => {
  const [alerts, setAlerts] = useState<AlertNotification[]>([]);
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const [dispatchSuccess, setDispatchSuccess] = useState<boolean>(false);

  // Manual Dispatch Form State
  const [dispatchRecipient, setDispatchRecipient] = useState<string>('dfo.korba@forest.gov.in');
  const [dispatchChannel, setDispatchChannel] = useState<'EMAIL' | 'SMS' | 'WEBHOOK'>('EMAIL');
  const [selectedEventId, setSelectedEventId] = useState<string>(events[0]?.id || '');

  // Rule configuration modal state
  const [showRuleModal, setShowRuleModal] = useState<boolean>(false);
  const [newRuleAoi, setNewRuleAoi] = useState<string>(aois[0]?.id || '');
  const [newRuleThreshold, setNewRuleThreshold] = useState<number>(-0.25);
  const [newRuleMinArea, setNewRuleMinArea] = useState<number>(2.0);

  useEffect(() => {
    const loadAlerts = async () => {
      const fetchedAlerts = await ApiService.getAlertNotifications();
      setAlerts(fetchedAlerts);
      const fetchedRules = await ApiService.getAlertRules();
      setRules(fetchedRules);
    };
    loadAlerts();
  }, []);

  const handleManualDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    const event = events.find(ev => ev.id === selectedEventId) || events[0];
    if (!event) return;

    setIsDispatching(true);
    const newAlert = await ApiService.dispatchAlert({
      event_id: event.id,
      event_title: event.title,
      aoi_name: event.aoi_name,
      category: event.category,
      severity: event.affected_area_hectares > 30 ? 'CRITICAL' : 'HIGH',
      channel: dispatchChannel,
      recipient: dispatchRecipient,
      affected_area_hectares: event.affected_area_hectares,
      confidence_pct: Math.round(event.confidence.overall_detection_confidence * 100)
    });

    setAlerts(prev => [newAlert, ...prev]);
    setIsDispatching(false);
    setDispatchSuccess(true);
    setTimeout(() => setDispatchSuccess(false), 3000);
  };

  const handleCreateRule = async () => {
    const aoi = aois.find(a => a.id === newRuleAoi) || aois[0];
    const rule = await ApiService.saveAlertRule({
      aoi_id: aoi.id,
      category: aoi.category || 'VEGETATION_LOSS',
      delta_threshold: newRuleThreshold,
      min_area_hectares: newRuleMinArea,
      min_confidence: 0.85,
      channels: ['DASHBOARD', 'EMAIL', 'WEBHOOK'],
      enabled: true
    });
    setRules(prev => [rule, ...prev]);
    setShowRuleModal(false);
  };

  const filteredAlerts = selectedSeverity === 'ALL'
    ? alerts
    : alerts.filter(a => a.severity === selectedSeverity);

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Banner */}
      <div className="card" style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--amber-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--amber-500)'
              }}
            >
              <Bell size={18} />
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Geospatial Alert & Notification Center
            </h1>
            <span className="badge badge-amber font-mono">{alerts.length} Dispatched</span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '850px' }}>
            Automated multi-channel alerting pipeline (Email, Webhook, SMS) triggered when Sentinel-2 index differencing exceeds user-defined spatial & spectral thresholds.
          </p>
        </div>

        <button onClick={() => setShowRuleModal(true)} className="btn btn-primary" style={{ gap: '6px' }}>
          <PlusCircle size={15} />
          <span>Configure Trigger Rule</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Left: Active Alerts Feed */}
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Alert Notification Stream
            </h3>
            {/* Severity Filter */}
            <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--bg-canvas)', padding: '2px', borderRadius: 'var(--radius-sm)' }}>
              {['ALL', 'CRITICAL', 'HIGH'].map(s => (
                <button
                  key={s}
                  onClick={() => setSelectedSeverity(s)}
                  className={`btn btn-sm ${selectedSeverity === s ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '11px', padding: '2px 8px', border: 'none' }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '520px', overflowY: 'auto' }}>
            {filteredAlerts.map(alt => (
              <div
                key={alt.id}
                style={{
                  padding: '14px',
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      className={`badge ${
                        alt.severity === 'CRITICAL' ? 'badge-copper' : 'badge-amber'
                      } font-mono`}
                      style={{ fontSize: '10px' }}
                    >
                      {alt.severity}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {alt.event_title}
                    </span>
                  </div>
                  <span className="badge badge-emerald font-mono" style={{ fontSize: '10px' }}>
                    {alt.status}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span>AOI: <b style={{ color: 'var(--text-primary)' }}>{alt.aoi_name}</b></span>
                  <span>Area: <b style={{ color: 'var(--amber-500)' }}>{alt.affected_area_hectares} ha</b></span>
                  <span>Confidence: <b>{alt.confidence_pct}%</b></span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-subtle)', paddingTop: '6px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {alt.channel === 'EMAIL' && <Mail size={12} />}
                    {alt.channel === 'SMS' && <Smartphone size={12} />}
                    {alt.channel === 'WEBHOOK' && <Webhook size={12} />}
                    <span className="font-mono">{alt.recipient}</span>
                  </span>
                  <span className="font-mono" style={{ color: 'var(--text-muted)' }}>
                    {new Date(alt.sent_at).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Manual Alert Dispatcher & Active Trigger Rules */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Dispatcher Box */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Send size={16} style={{ color: 'var(--emerald-500)' }} />
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Simulate Emergency Dispatch
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>
              Manually dispatch formatted geo-alert payloads to designated field agents or GIS webhook endpoints.
            </p>

            <form onSubmit={handleManualDispatch} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Select Anomaly Event:
                </label>
                <select
                  value={selectedEventId}
                  onChange={e => setSelectedEventId(e.target.value)}
                  style={{
                    padding: '8px 10px',
                    fontSize: '12px',
                    backgroundColor: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)'
                  }}
                >
                  {events.map(ev => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title} ({ev.affected_area_hectares} ha - {ev.aoi_name})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Channel:</label>
                  <select
                    value={dispatchChannel}
                    onChange={e => setDispatchChannel(e.target.value as any)}
                    style={{
                      padding: '8px 10px',
                      fontSize: '12px',
                      backgroundColor: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)'
                    }}
                  >
                    <option value="EMAIL">Email Dispatch</option>
                    <option value="WEBHOOK">GIS Webhook</option>
                    <option value="SMS">Emergency SMS</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Recipient Endpoint:</label>
                  <input
                    type="text"
                    value={dispatchRecipient}
                    onChange={e => setDispatchRecipient(e.target.value)}
                    style={{
                      padding: '8px 10px',
                      fontSize: '12px',
                      backgroundColor: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                {dispatchSuccess && (
                  <span style={{ fontSize: '12px', color: 'var(--emerald-500)', fontWeight: 600 }}>
                    ✓ Geo-alert dispatched successfully!
                  </span>
                )}
                <button
                  type="submit"
                  disabled={isDispatching}
                  className="btn btn-primary btn-sm"
                  style={{ marginLeft: 'auto', gap: '6px' }}
                >
                  <Send size={13} />
                  <span>{isDispatching ? 'Transmitting...' : 'Dispatch Alert'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Trigger Rules List */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sliders size={16} style={{ color: 'var(--teal-500)' }} />
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Active Trigger Rules
                </h3>
              </div>
              <span className="badge badge-neutral font-mono">{rules.length} Rules Active</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {rules.map(rule => {
                const aoi = aois.find(a => a.id === rule.aoi_id);
                return (
                  <div
                    key={rule.id}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {aoi?.name || 'All Monitored AOIs'}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }} className="font-mono">
                        ΔNDVI &lt; {rule.delta_threshold} • Area &gt; {rule.min_area_hectares} ha • Conf &gt; {Math.round(rule.min_confidence * 100)}%
                      </div>
                    </div>
                    <span className="badge badge-emerald font-mono" style={{ fontSize: '10px' }}>
                      ENABLED
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Trigger Rule Modal */}
      {showRuleModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Configure Monitoring Alert Rule
              </h3>
              <button
                onClick={() => setShowRuleModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Target AOI:</label>
              <select
                value={newRuleAoi}
                onChange={e => setNewRuleAoi(e.target.value)}
                style={{
                  padding: '8px 10px',
                  fontSize: '12px',
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)'
                }}
              >
                {aois.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Δ Spectral Shift Threshold:</span>
                <span className="font-mono" style={{ color: 'var(--amber-500)' }}>{newRuleThreshold.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="-0.50"
                max="-0.10"
                step="0.05"
                value={newRuleThreshold}
                onChange={e => setNewRuleThreshold(parseFloat(e.target.value))}
                style={{ accentColor: 'var(--amber-500)' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Minimum Affected Area:</span>
                <span className="font-mono" style={{ color: 'var(--emerald-500)' }}>{newRuleMinArea.toFixed(1)} ha</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="10.0"
                step="0.5"
                value={newRuleMinArea}
                onChange={e => setNewRuleMinArea(parseFloat(e.target.value))}
                style={{ accentColor: 'var(--emerald-500)' }}
              />
            </div>

            <button onClick={handleCreateRule} className="btn btn-primary" style={{ marginTop: '8px' }}>
              Save & Activate Rule
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
