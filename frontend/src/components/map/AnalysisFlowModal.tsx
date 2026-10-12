import React, { useEffect, useState } from 'react';
import {
  Satellite,
  CloudOff,
  GitCompare,
  AlertTriangle,
  FileText,
  Bell,
  Download,
  CheckCircle2,
  Loader2,
  Sparkles
} from 'lucide-react';

interface AnalysisFlowModalProps {
  isOpen: boolean;
  aoiName: string;
  onComplete: () => void;
}

interface FlowStep {
  id: number;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  color: string;
}

const FLOW_STEPS: FlowStep[] = [
  {
    id: 1,
    title: 'Select AOI on Map',
    subtitle: 'Area boundary verified (forest, farm, river, lake, or urban)',
    icon: Sparkles,
    color: '#1a73e8'
  },
  {
    id: 2,
    title: 'Download Latest Satellite Image',
    subtitle: 'Fetching newest Sentinel-2 MSI 10m L2A multispectral scene',
    icon: Satellite,
    color: '#059669'
  },
  {
    id: 3,
    title: 'Remove Clouds & Shadows',
    subtitle: 'Filters false signals before comparing (the critical QA step)',
    icon: CloudOff,
    color: '#f9ab00'
  },
  {
    id: 4,
    title: 'Compare with Previous Image',
    subtitle: 'Computing NDVI / NDWI delta against stored baseline history',
    icon: GitCompare,
    color: '#8b5cf6'
  },
  {
    id: 5,
    title: 'Detect Ground Changes',
    subtitle: 'Isolating trees removed, new roads, construction & encroachment',
    icon: AlertTriangle,
    color: '#ea4335'
  },
  {
    id: 6,
    title: 'Generate Intelligence Report',
    subtitle: 'Location, date, change type & percentage impact calculated',
    icon: FileText,
    color: '#0d9488'
  },
  {
    id: 7,
    title: 'Ready for Field Alert & Export',
    subtitle: 'Dispatched to Review Studio • GeoJSON / Shapefile export ready',
    icon: Bell,
    color: '#16a34a'
  }
];

export const AnalysisFlowModal: React.FC<AnalysisFlowModalProps> = ({
  isOpen,
  aoiName,
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1);
      return;
    }

    // Progress through the steps realistically matching the Tech Expo PPT flow
    const intervals = [
      400,  // Step 1
      600,  // Step 2
      650,  // Step 3
      700,  // Step 4
      650,  // Step 5
      600,  // Step 6
      500   // Step 7
    ];

    let step = 1;
    let timer: any;

    const nextStep = () => {
      if (step < FLOW_STEPS.length) {
        step++;
        setCurrentStep(step);
        timer = setTimeout(nextStep, intervals[step - 1] || 600);
      } else {
        // All finished
        setTimeout(() => {
          onComplete();
        }, 400);
      }
    };

    timer = setTimeout(nextStep, intervals[0]);

    return () => clearTimeout(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(8px)',
        zIndex: 2800,
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
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-floating)',
          border: '1px solid var(--border-subtle)',
          padding: '28px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'rgba(26, 115, 232, 0.1)',
              color: 'var(--primary-500)',
              fontSize: '11px',
              fontWeight: 700,
              marginBottom: '8px'
            }}
          >
            <Sparkles size={13} />
            <span>Kshitiraksha Automated AI Pipeline</span>
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
            Processing: {aoiName}
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
            Executing multi-temporal satellite change detection workflow
          </p>
        </div>

        {/* Stepper Timeline List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {FLOW_STEPS.map(step => {
            const isDone = currentStep > step.id;
            const isCurrent = currentStep === step.id;
            const isPending = currentStep < step.id;
            const Icon = step.icon;

            return (
              <div
                key={step.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isCurrent
                    ? 'var(--bg-elevated)'
                    : isDone
                    ? 'rgba(30, 142, 62, 0.05)'
                    : 'transparent',
                  border: isCurrent
                    ? `1px solid ${step.color}`
                    : '1px solid transparent',
                  transition: 'all 200ms ease'
                }}
              >
                {/* Step Status Icon */}
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: isDone
                      ? 'rgba(30, 142, 62, 0.15)'
                      : isCurrent
                      ? `${step.color}20`
                      : 'var(--bg-elevated)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isDone ? '#1e8e3e' : isCurrent ? step.color : 'var(--text-muted)',
                    flexShrink: 0
                  }}
                >
                  {isDone ? (
                    <CheckCircle2 size={18} style={{ color: '#1e8e3e' }} />
                  ) : isCurrent ? (
                    <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <Icon size={16} />
                  )}
                </div>

                {/* Step Details */}
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: isCurrent ? 700 : 600,
                      color: isPending ? 'var(--text-muted)' : 'var(--text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>{step.title}</span>
                    {isCurrent && (
                      <span
                        className="badge badge-amber font-mono"
                        style={{ fontSize: '9px', padding: '1px 6px' }}
                      >
                        Active
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: isPending ? 'var(--text-muted)' : 'var(--text-secondary)',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden'
                    }}
                  >
                    {step.subtitle}
                  </div>
                </div>

                {/* Step Number */}
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: isDone ? '#1e8e3e' : isCurrent ? step.color : 'var(--text-muted)',
                    fontFamily: 'monospace'
                  }}
                >
                  {step.id}/7
                </span>
              </div>
            );
          })}
        </div>

        {/* Footer Progress Note */}
        <div
          style={{
            textAlign: 'center',
            fontSize: '11px',
            color: 'var(--text-muted)',
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '12px'
          }}
        >
          {currentStep === FLOW_STEPS.length ? (
            <span style={{ color: 'var(--emerald-500)', fontWeight: 600 }}>
              ✓ Analysis complete! Opening Before & After Comparison...
            </span>
          ) : (
            <span>Applying cloud masking and AI morphological filtering...</span>
          )}
        </div>
      </div>
    </div>
  );
};
