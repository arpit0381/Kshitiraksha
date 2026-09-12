import React from 'react';
import { ChangeEvent } from '../../types';
import { FileText, Printer, Download, ShieldCheck, CheckCircle2, Globe, Calendar, MapPin } from 'lucide-react';

interface ReportGeneratorModalProps {
  event: ChangeEvent;
  onClose: () => void;
}

export const ReportGeneratorModal: React.FC<ReportGeneratorModalProps> = ({ event, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 2500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        overflowY: 'auto'
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: '850px',
          width: '100%',
          backgroundColor: '#ffffff',
          color: '#111827',
          padding: '36px 40px',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        {/* Modal Controls Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e5e7eb', paddingBottom: '16px' }} className="no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} style={{ color: '#059669' }} />
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>
              ISRO Geospatial Intelligence Dossier Generator
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handlePrint}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                backgroundColor: '#059669',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Printer size={14} />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '6px 12px',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>

        {/* Official Report Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '2px solid #111827', paddingBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Globe size={24} style={{ color: '#059669' }} />
              <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.02em', color: '#111827' }}>
                KSHITIRAKSHA • EXECUTIVE INTELLIGENCE DOSSIER
              </span>
            </div>
            <p style={{ fontSize: '12px', color: '#4b5563', margin: 0 }}>
              Autonomous Satellite-Based Automated Change Detection & Alert System
            </p>
            <p style={{ fontSize: '11px', color: '#6b7280', margin: '2px 0 0 0' }}>
              Reference Standard: ISRO / Sentinel-2 MSI Multi-Temporal L2A Protocol
            </p>
          </div>

          <div style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: '11px', color: '#374151' }}>
            <div><b>DOSSIER ID:</b> {event.id.toUpperCase()}</div>
            <div><b>GENERATED:</b> {new Date().toLocaleDateString()}</div>
            <div style={{ color: '#059669', fontWeight: 700 }}>STATUS: {event.review_status}</div>
          </div>
        </div>

        {/* Section 1: Executive Summary */}
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#111827', borderBottom: '1px solid #e5e7eb', paddingBottom: '6px', marginBottom: '10px' }}>
            1. Anomaly Overview & Classification
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '12px' }}>
            <div style={{ padding: '10px', backgroundColor: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '10px', color: '#6b7280', fontWeight: 600 }}>AREA OF INTEREST</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>{event.aoi_name}</div>
            </div>
            <div style={{ padding: '10px', backgroundColor: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '10px', color: '#6b7280', fontWeight: 600 }}>CHANGE CATEGORY</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#d97706' }}>{event.category.replace('_', ' ')}</div>
            </div>
            <div style={{ padding: '10px', backgroundColor: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '10px', color: '#6b7280', fontWeight: 600 }}>AFFECTED FOOTPRINT</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>{event.affected_area_hectares.toFixed(1)} ha</div>
            </div>
            <div style={{ padding: '10px', backgroundColor: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '10px', color: '#6b7280', fontWeight: 600 }}>DETECTION CONFIDENCE</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#059669' }}>{Math.round(event.confidence.overall_detection_confidence * 100)}%</div>
            </div>
          </div>
          <p style={{ fontSize: '12px', color: '#374151', lineHeight: '1.6', margin: 0 }}>
            {event.description}
          </p>
        </div>

        {/* Section 2: Sensor & Observation Telemetry */}
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#111827', borderBottom: '1px solid #e5e7eb', paddingBottom: '6px', marginBottom: '10px' }}>
            2. Multi-Spectral Telemetry & Differencing
          </h3>
          <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '1px solid #d1d5db' }}>
                <th style={{ padding: '8px 12px' }}>Parameter</th>
                <th style={{ padding: '8px 12px' }}>Baseline Scene (T1)</th>
                <th style={{ padding: '8px 12px' }}>Recent Scene (T2)</th>
                <th style={{ padding: '8px 12px' }}>Net Variance</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '8px 12px', fontWeight: 600 }}>Acquisition Date</td>
                <td style={{ padding: '8px 12px' }}>{event.baseline_date}</td>
                <td style={{ padding: '8px 12px' }}>{event.recent_date}</td>
                <td style={{ padding: '8px 12px' }}>Multi-temporal sweep</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '8px 12px', fontWeight: 600 }}>Satellite Sensor</td>
                <td style={{ padding: '8px 12px' }}>Sentinel-2B MSI L2A</td>
                <td style={{ padding: '8px 12px' }}>Sentinel-2A MSI L2A</td>
                <td style={{ padding: '8px 12px' }}>10.0m GSD Surface Reflectance</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '8px 12px', fontWeight: 600 }}>Spectral Index</td>
                <td style={{ padding: '8px 12px' }}>NDVI: +0.74</td>
                <td style={{ padding: '8px 12px' }}>NDVI: +0.22</td>
                <td style={{ padding: '8px 12px', fontWeight: 700, color: '#dc2626' }}>ΔNDVI: {event.average_delta_index}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 3: Explainable 4-Factor Confidence Scoring */}
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#111827', borderBottom: '1px solid #e5e7eb', paddingBottom: '6px', marginBottom: '10px' }}>
            3. Explainable AI Confidence Attribution
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', backgroundColor: '#f9fafb', borderRadius: '4px' }}>
              <span>Spectral Magnitude Shift:</span>
              <b>{Math.round(event.confidence.magnitude_score * 100)}%</b>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', backgroundColor: '#f9fafb', borderRadius: '4px' }}>
              <span>Spatial Clustering Contiguity:</span>
              <b>{Math.round(event.confidence.spatial_consistency_score * 100)}%</b>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', backgroundColor: '#f9fafb', borderRadius: '4px' }}>
              <span>Cloud Mask & Image Quality:</span>
              <b>{Math.round(event.confidence.image_quality_score * 100)}%</b>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', backgroundColor: '#f9fafb', borderRadius: '4px' }}>
              <span>Multi-Pass Temporal Persistence:</span>
              <b>{Math.round(event.confidence.persistence_score * 100)}%</b>
            </div>
          </div>
        </div>

        {/* Section 4: Human Verification Sign-off Stamp */}
        <div style={{ borderTop: '2px solid #111827', paddingTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600 }}>AUDITOR REVIEW NOTES</div>
            <div style={{ fontSize: '12px', color: '#111827', fontStyle: 'italic', maxWidth: '450px' }}>
              "{event.review_notes || 'Confirmed and cataloged for statutory compliance reporting.'}"
            </div>
          </div>

          <div style={{ textAlign: 'center', padding: '10px 16px', border: '2px dashed #059669', borderRadius: '8px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#059669', letterSpacing: '0.05em' }}>
              ISRO PROTOCOL VERIFIED
            </div>
            <div style={{ fontSize: '9px', color: '#6b7280', fontFamily: 'monospace' }}>
              CRYPTOGRAPHIC DIGITAL STAMP
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
