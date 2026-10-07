import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { RiskBadge } from '../common/Badge';
import { calculateRiskLevel } from '../../services/storageService';
import { RiskAssessment, RiskLevel } from '../../types/supplier';
import { ShieldCheck, Sliders, AlertTriangle } from 'lucide-react';

interface ReassessRiskModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplierId: string;
  supplierName: string;
  currentAssessment?: RiskAssessment;
  onSave: (factors: {
    financialScore: number;
    operationalScore: number;
    geopoliticalScore: number;
    esgScore: number;
    cyberScore: number;
    notes?: string;
  }) => Promise<void>;
}

export const ReassessRiskModal: React.FC<ReassessRiskModalProps> = ({
  isOpen,
  onClose,
  supplierId,
  supplierName,
  currentAssessment,
  onSave,
}) => {
  const [financial, setFinancial] = useState(30);
  const [operational, setOperational] = useState(30);
  const [geopolitical, setGeopolitical] = useState(30);
  const [esg, setEsg] = useState(30);
  const [cyber, setCyber] = useState(30);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (currentAssessment) {
      setFinancial(currentAssessment.financialScore ?? 30);
      setOperational(currentAssessment.operationalScore ?? 30);
      setGeopolitical(currentAssessment.geopoliticalScore ?? 30);
      setEsg(currentAssessment.esgScore ?? 30);
      setCyber(currentAssessment.cyberScore ?? 30);
      setNotes(currentAssessment.mitigationNotes || '');
    }
  }, [currentAssessment, isOpen]);

  // Live calculation of overall risk score
  const liveScore = Math.round(
    financial * 0.25 + operational * 0.25 + geopolitical * 0.2 + esg * 0.15 + cyber * 0.15
  );
  const liveLevel: RiskLevel = calculateRiskLevel(liveScore);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave({
        financialScore: financial,
        operationalScore: operational,
        geopoliticalScore: geopolitical,
        esgScore: esg,
        cyberScore: cyber,
        notes,
      });
      onClose();
    } catch {
      // Handled by toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Sliders color="#0070f2" size={22} />
          <span>Reassess Risk Profile • {supplierName}</span>
        </div>
      }
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Calculating...' : 'Commit Risk Reassessment'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Real-time Score Preview Card */}
        <div
          style={{
            background: liveLevel === 'HIGH' ? '#fdeeee' : liveLevel === 'MEDIUM' ? '#fff5eb' : '#eaf8f0',
            border: `1px solid ${liveLevel === 'HIGH' ? '#f8b4b4' : liveLevel === 'MEDIUM' ? '#fcd5ab' : '#9ee3bd'}`,
            borderRadius: '8px',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 700, color: '#475569' }}>
              Calculated Overall Risk Score
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '2px' }}>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b' }}>{liveScore}</span>
              <span style={{ fontSize: '0.9rem', color: '#64748b' }}>/ 100</span>
              <RiskBadge level={liveLevel} />
            </div>
          </div>

          <div style={{ textAlign: 'right', fontSize: '0.78rem', color: '#475569', maxWidth: '280px' }}>
            {liveLevel === 'HIGH' && (
              <div style={{ color: '#ba1717', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                <AlertTriangle size={16} />
                <span>Score &ge; 61 requires mandatory governance review before approval.</span>
              </div>
            )}
            {liveLevel === 'MEDIUM' && <span>Score 31–60: Standard continuous audit cycle.</span>}
            {liveLevel === 'LOW' && (
              <div style={{ color: '#0d7f3e', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                <ShieldCheck size={16} />
                <span>Score &le; 30: Prime tier status verified.</span>
              </div>
            )}
          </div>
        </div>

        {/* 5 Risk Dimensions with Sliders and Number Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Financial Risk */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', fontWeight: 600 }}>
              <span>Financial Stability (Weight: 25%)</span>
              <span style={{ color: '#0070f2' }}>{financial} / 100</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                type="range"
                min="0"
                max="100"
                value={financial}
                onChange={(e) => setFinancial(Number(e.target.value))}
                style={{ flex: 1, accentColor: '#0070f2', cursor: 'pointer' }}
              />
              <input
                type="number"
                min="0"
                max="100"
                value={financial}
                onChange={(e) => setFinancial(Math.max(0, Math.min(100, Number(e.target.value))))}
                className="form-input"
                style={{ width: '70px', padding: '4px 8px', textAlign: 'center' }}
              />
            </div>
          </div>

          {/* Operational Continuity */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', fontWeight: 600 }}>
              <span>Operational Continuity & Production Capacity (Weight: 25%)</span>
              <span style={{ color: '#0070f2' }}>{operational} / 100</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                type="range"
                min="0"
                max="100"
                value={operational}
                onChange={(e) => setOperational(Number(e.target.value))}
                style={{ flex: 1, accentColor: '#0070f2', cursor: 'pointer' }}
              />
              <input
                type="number"
                min="0"
                max="100"
                value={operational}
                onChange={(e) => setOperational(Math.max(0, Math.min(100, Number(e.target.value))))}
                className="form-input"
                style={{ width: '70px', padding: '4px 8px', textAlign: 'center' }}
              />
            </div>
          </div>

          {/* Geopolitical Risk */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', fontWeight: 600 }}>
              <span>Geopolitical & Trade Tariffs Exposure (Weight: 20%)</span>
              <span style={{ color: '#0070f2' }}>{geopolitical} / 100</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                type="range"
                min="0"
                max="100"
                value={geopolitical}
                onChange={(e) => setGeopolitical(Number(e.target.value))}
                style={{ flex: 1, accentColor: '#0070f2', cursor: 'pointer' }}
              />
              <input
                type="number"
                min="0"
                max="100"
                value={geopolitical}
                onChange={(e) => setGeopolitical(Math.max(0, Math.min(100, Number(e.target.value))))}
                className="form-input"
                style={{ width: '70px', padding: '4px 8px', textAlign: 'center' }}
              />
            </div>
          </div>

          {/* ESG */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', fontWeight: 600 }}>
              <span>ESG, Environmental & Labor Compliance (Weight: 15%)</span>
              <span style={{ color: '#0070f2' }}>{esg} / 100</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                type="range"
                min="0"
                max="100"
                value={esg}
                onChange={(e) => setEsg(Number(e.target.value))}
                style={{ flex: 1, accentColor: '#0070f2', cursor: 'pointer' }}
              />
              <input
                type="number"
                min="0"
                max="100"
                value={esg}
                onChange={(e) => setEsg(Math.max(0, Math.min(100, Number(e.target.value))))}
                className="form-input"
                style={{ width: '70px', padding: '4px 8px', textAlign: 'center' }}
              />
            </div>
          </div>

          {/* Cyber Security */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', fontWeight: 600 }}>
              <span>Cyber Security & IP Protection (Weight: 15%)</span>
              <span style={{ color: '#0070f2' }}>{cyber} / 100</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                type="range"
                min="0"
                max="100"
                value={cyber}
                onChange={(e) => setCyber(Number(e.target.value))}
                style={{ flex: 1, accentColor: '#0070f2', cursor: 'pointer' }}
              />
              <input
                type="number"
                min="0"
                max="100"
                value={cyber}
                onChange={(e) => setCyber(Math.max(0, Math.min(100, Number(e.target.value))))}
                className="form-input"
                style={{ width: '70px', padding: '4px 8px', textAlign: 'center' }}
              />
            </div>
          </div>
        </div>

        {/* Audit / Mitigation notes */}
        <div className="form-group">
          <label className="form-label">Risk Assessor Audit Notes / Mitigation Action Plan</label>
          <textarea
            className="form-textarea"
            rows={2}
            placeholder="Record audit rationale, stress test outcome, or supplier mitigation commitment..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
};
