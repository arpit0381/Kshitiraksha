import React, { useState, useEffect } from 'react';
import { Project, AOI } from '../../types';
import { ApiService } from '../../services/api';
import {
  FolderKanban,
  PlusCircle,
  MapPin,
  Calendar,
  Layers,
  CheckCircle2,
  Clock,
  Building2,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

interface ProjectsStudioProps {
  aois: AOI[];
  onSelectAoi: (aoi: AOI) => void;
  onNavigateToMap: () => void;
}

export const ProjectsStudio: React.FC<ProjectsStudioProps> = ({ aois, onSelectAoi, onNavigateToMap }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  // Form State
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [department, setDepartment] = useState<string>('National Remote Sensing Centre (NRSC / ISRO)');
  const [frequency, setFrequency] = useState<'DAILY' | 'ORBITAL_5DAY' | 'WEEKLY' | 'MONTHLY'>('ORBITAL_5DAY');
  const [selectedAoiIds, setSelectedAoiIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchProjects = async () => {
      const data = await ApiService.getProjects();
      setProjects(data);
    };
    fetchProjects();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const created = await ApiService.createProject({
      name,
      description,
      department,
      monitoring_frequency: frequency,
      aoi_ids: selectedAoiIds.length > 0 ? selectedAoiIds : [aois[0].id]
    });

    setProjects(prev => [created, ...prev]);
    setShowCreateModal(false);
    setName('');
    setDescription('');
  };

  const toggleAoiSelection = (id: string) => {
    setSelectedAoiIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

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
                backgroundColor: 'var(--emerald-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--emerald-500)'
              }}
            >
              <FolderKanban size={18} />
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Monitoring Projects & Jurisdictions
            </h1>
            <span className="badge badge-emerald font-mono">{projects.length} Active Projects</span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '850px' }}>
            Organize Areas of Interest (AOIs) by department, surveillance frequency, and statutory mandate (Forestry, Urban Planning, Disaster Management).
          </p>
        </div>

        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary" style={{ gap: '6px' }}>
          <PlusCircle size={15} />
          <span>New Monitoring Project</span>
        </button>
      </div>

      {/* Projects Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '20px' }}>
        {projects.map(proj => {
          const projectAois = aois.filter(a => proj.aoi_ids?.includes(a.id) || a.project_id === proj.id);
          const totalAreaHa = projectAois.reduce((acc, a) => acc + a.area_hectares, 0);

          return (
            <div
              key={proj.id}
              className="card"
              style={{
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  backgroundColor: 'var(--emerald-500)'
                }}
              />

              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                <div>
                  <span className="badge badge-neutral font-mono" style={{ fontSize: '10px', marginBottom: '6px' }}>
                    {proj.monitoring_frequency.replace('_', ' ')} PASS
                  </span>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {proj.name}
                  </h3>
                </div>
                <span className="badge badge-emerald font-mono">ACTIVE</span>
              </div>

              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', minHeight: '36px' }}>
                {proj.description}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                <Building2 size={13} />
                <span>{proj.department}</span>
              </div>

              {/* Monitored AOIs List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Assigned AOIs ({projectAois.length}):</span>
                  <span className="font-mono" style={{ color: 'var(--emerald-500)' }}>{totalAreaHa.toFixed(0)} ha</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {projectAois.map(a => (
                    <div
                      key={a.id}
                      onClick={() => {
                        onSelectAoi(a);
                        onNavigateToMap();
                      }}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                        <MapPin size={12} style={{ color: 'var(--emerald-500)' }} />
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{a.name}</span>
                      </div>
                      <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {a.area_hectares.toFixed(0)} ha →
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
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
          <div className="card" style={{ maxWidth: '520px', width: '100%', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Create New Monitoring Project
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProject} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Project Name:</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Western Ghats Landslide & Slope Watch"
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Surveillance Objective & Scope:</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe target change dynamics..."
                  style={{
                    padding: '8px 10px',
                    fontSize: '12px',
                    backgroundColor: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Department:</label>
                  <input
                    type="text"
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
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

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Monitoring Cadence:</label>
                  <select
                    value={frequency}
                    onChange={e => setFrequency(e.target.value as any)}
                    style={{
                      padding: '8px 10px',
                      fontSize: '12px',
                      backgroundColor: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)'
                    }}
                  >
                    <option value="ORBITAL_5DAY">Sentinel-2 5-Day Orbital Revisit</option>
                    <option value="DAILY">Daily Composite</option>
                    <option value="WEEKLY">Weekly Aggregated Pass</option>
                    <option value="MONTHLY">Monthly Baseline</option>
                  </select>
                </div>
              </div>

              {/* AOI Checkboxes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Assign AOIs:</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  {aois.map(a => (
                    <label
                      key={a.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12px',
                        padding: '6px 8px',
                        backgroundColor: 'var(--bg-card)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        border: '1px solid var(--border-subtle)'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedAoiIds.includes(a.id)}
                        onChange={() => toggleAoiSelection(a.id)}
                      />
                      <span>{a.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>
                Initialize Monitoring Project
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
