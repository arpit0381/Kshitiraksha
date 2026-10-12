import React, { useState } from 'react';
import { ChangeEvent } from '../../types';
import {
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  X,
  Send,
  ShieldAlert,
  MapPin,
  Calendar
} from 'lucide-react';

interface SendAlertModalProps {
  event: ChangeEvent;
  onClose: () => void;
}

export const SendAlertModal: React.FC<SendAlertModalProps> = ({ event, onClose }) => {
  const [channels, setChannels] = useState({
    email: true,
    sms: true,
    push: true
  });
  const [recipient, setRecipient] = useState('dfo-patrol@forest.gov.in, rfo-field@up.gov.in');
  const [phoneNumbers, setPhoneNumbers] = useState('+91 98765 43210, +91 94150 12345');
  const [urgency, setUrgency] = useState<'URGENT' | 'HIGH' | 'NORMAL'>('URGENT');
  const [customNote, setCustomNote] = useState(
    'Satellite change detected in monitoring zone. Verified disturbance with high AI confidence score. Requesting immediate ground patrol.'
  );
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const toggleChannel = (key: 'email' | 'sms' | 'push') => {
    setChannels(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSend = async () => {
    setIsSending(true);
    // Simulate real alert dispatch through SMS gateway and Email relay
    await new Promise(r => setTimeout(r, 1200));
    setIsSending(false);
    setIsSent(true);
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 2600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: '560px',
          width: '100%',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--border-subtle)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: 'rgba(234, 67, 53, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ea4335'
            }}>
              <Bell size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Dispatch Field Alert
              </h2>
              <p style={{ fontSize: '12px', margin: 0, color: 'var(--text-secondary)' }}>
                Send multi-channel notification (Email • SMS • Push) to field officers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-secondary btn-sm"
            style={{ padding: '6px', borderRadius: '50%' }}
          >
            <X size={16} />
          </button>
        </div>

        {isSent ? (
          <div style={{ textAlign: 'center', padding: '32px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <CheckCircle2 size={52} style={{ color: 'var(--emerald-500)' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Alert Dispatched Successfully!
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '400px', margin: 0 }}>
              Field officials have received notifications via Email, SMS & App Push. Coordinates and GeoJSON attached.
            </p>
          </div>
        ) : (
          <>
            {/* Event Summary Card */}
            <div style={{
              padding: '12px 14px',
              backgroundColor: 'var(--bg-elevated)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              fontSize: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={13} style={{ color: 'var(--primary-500)' }} />
                  {event.title}
                </span>
                <span className="badge badge-amber font-mono" style={{ fontSize: '10px' }}>
                  {event.affected_area_hectares.toFixed(1)} ha affected
                </span>
              </div>
              <div style={{ display: 'flex', gap: '16px', color: 'var(--text-muted)', fontSize: '11px' }}>
                <span>Area: <b>{event.aoi_name}</b></span>
                <span>Date: <b>{event.recent_date}</b></span>
                <span>Confidence: <b>{Math.round(event.confidence.overall_detection_confidence * 100)}%</b></span>
              </div>
            </div>

            {/* Channels Select */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>
                Notification Channels:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => toggleChannel('email')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${channels.email ? 'var(--primary-500)' : 'var(--border-subtle)'}`,
                    backgroundColor: channels.email ? 'rgba(26, 115, 232, 0.08)' : 'var(--bg-surface)',
                    color: channels.email ? 'var(--primary-500)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                >
                  <Mail size={14} />
                  <span>Email</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleChannel('sms')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${channels.sms ? 'var(--emerald-500)' : 'var(--border-subtle)'}`,
                    backgroundColor: channels.sms ? 'rgba(30, 142, 62, 0.08)' : 'var(--bg-surface)',
                    color: channels.sms ? 'var(--emerald-500)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                >
                  <MessageSquare size={14} />
                  <span>SMS</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleChannel('push')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${channels.push ? 'var(--amber-500)' : 'var(--border-subtle)'}`,
                    backgroundColor: channels.push ? 'rgba(249, 171, 0, 0.08)' : 'var(--bg-surface)',
                    color: channels.push ? 'var(--amber-500)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                >
                  <Smartphone size={14} />
                  <span>App Push</span>
                </button>
              </div>
            </div>

            {/* Email Recipients */}
            {channels.email && (
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Email Recipients (DFO / Enforcement):
                </label>
                <input
                  type="text"
                  value={recipient}
                  onChange={e => setRecipient(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    fontSize: '12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    marginTop: '4px'
                  }}
                />
              </div>
            )}

            {/* SMS Mobile Numbers */}
            {channels.sms && (
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Patrol SMS Mobile Numbers:
                </label>
                <input
                  type="text"
                  value={phoneNumbers}
                  onChange={e => setPhoneNumbers(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    fontSize: '12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    marginTop: '4px'
                  }}
                />
              </div>
            )}

            {/* Alert Message */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Patrol Dispatch Instructions:
              </label>
              <textarea
                rows={3}
                value={customNote}
                onChange={e => setCustomNote(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  fontSize: '12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  marginTop: '4px',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '6px' }}>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={isSending || (!channels.email && !channels.sms && !channels.push)}
                className="btn btn-primary btn-sm"
                style={{ gap: '6px', minWidth: '130px' }}
              >
                {isSending ? (
                  <span>Sending Alerts...</span>
                ) : (
                  <>
                    <Send size={14} />
                    <span>Send Alert Now</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
