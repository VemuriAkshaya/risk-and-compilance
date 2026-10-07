import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { ComplianceDocument } from '../../types/supplier';
import { FileCheck, Upload } from 'lucide-react';

interface RenewDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplierId: string;
  supplierName: string;
  document?: ComplianceDocument | null;
  onSave: (docData: {
    documentType: string;
    documentNumber: string;
    issueDate: string;
    expiryDate: string;
    verificationAuthority: string;
    notes?: string;
  }) => Promise<void>;
}

export const RenewDocumentModal: React.FC<RenewDocumentModalProps> = ({
  isOpen,
  onClose,
  supplierId,
  supplierName,
  document,
  onSave,
}) => {
  const isEditing = Boolean(document);

  const [documentType, setDocumentType] = useState(document?.documentType || 'ISO 9001 Quality Management');
  const [documentNumber, setDocumentNumber] = useState(document?.documentNumber || '');
  const [issueDate, setIssueDate] = useState(document?.issueDate || new Date().toISOString().slice(0, 10));
  
  // Default new expiry date to 2 years in the future
  const defaultFutureDate = () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 2);
    return d.toISOString().slice(0, 10);
  };

  const [expiryDate, setExpiryDate] = useState(
    document ? (document.status === 'EXPIRED' ? defaultFutureDate() : document.expiryDate) : defaultFutureDate()
  );
  const [verificationAuthority, setVerificationAuthority] = useState(
    document?.verificationAuthority || 'TÜV Rheinland / DNV / Bureau Veritas'
  );
  const [notes, setNotes] = useState(document?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const standardDocTypes = [
    'ISO 9001 Quality Management',
    'Anti-Bribery & Corruption (ISO 37001 / FCPA)',
    'ESG Sustainability Audit (EcoVadis / RBA)',
    'ISO 14001 Environmental Management',
    'Corporate Tax Clearance Certificate',
    'Cyber Security & ISO 27001 / SOC 2',
    'Dual-Use Export Compliance License',
    'RoHS & REACH Chemical Compliance',
    'Conflict Minerals Free Declaration',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!documentNumber.trim()) {
      setErrorMsg('Certificate/Document Number is required.');
      return;
    }
    if (!issueDate) {
      setErrorMsg('Issue Date is required.');
      return;
    }
    if (!expiryDate) {
      setErrorMsg('Expiry Date is required.');
      return;
    }
    if (expiryDate <= issueDate) {
      setErrorMsg('Expiry Date must be after Issue Date.');
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);
    try {
      await onSave({
        documentType,
        documentNumber: documentNumber.trim(),
        issueDate,
        expiryDate,
        verificationAuthority: verificationAuthority.trim(),
        notes: notes.trim(),
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
      size="md"
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FileCheck color="#0d7f3e" size={22} />
          <span>{isEditing ? `Renew Document • ${document?.documentType}` : `Upload Compliance Document`}</span>
        </div>
      }
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-success"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Verifying & Saving...' : isEditing ? 'Confirm Renewal' : 'Save Certificate'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ fontSize: '0.85rem', color: '#475569' }}>
          Updating compliance for supplier: <strong>{supplierName}</strong> ({supplierId})
        </div>

        {errorMsg && (
          <div className="sap-alert-banner alert-danger" style={{ padding: '8px 12px' }}>
            {errorMsg}
          </div>
        )}

        <div className="form-group">
          <label className="form-label">
            Document Type <span className="req">*</span>
          </label>
          {isEditing ? (
            <input
              type="text"
              className="form-input"
              value={documentType}
              readOnly
              style={{ backgroundColor: '#f1f5f9' }}
            />
          ) : (
            <select
              className="sap-select"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
            >
              {standardDocTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">
            Certificate / License Number <span className="req">*</span>
          </label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. ISO-QM-2026-991"
            value={documentNumber}
            onChange={(e) => setDocumentNumber(e.target.value)}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">
              Issue Date <span className="req">*</span>
            </label>
            <input
              type="date"
              className="form-input"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Expiry Date <span className="req">*</span>
            </label>
            <input
              type="date"
              className="form-input"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Auditing / Verification Authority</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. TÜV SÜD / BSI Group / SGS"
            value={verificationAuthority}
            onChange={(e) => setVerificationAuthority(e.target.value)}
          />
        </div>

        {/* Mock File Upload Box */}
        <div
          style={{
            border: '2px dashed #cbd5e1',
            borderRadius: '8px',
            padding: '16px',
            textAlign: 'center',
            backgroundColor: '#f8fafc',
            cursor: 'pointer',
          }}
        >
          <Upload size={24} style={{ color: '#64748b', margin: '0 auto 6px' }} />
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
            Attach Signed Audit PDF / Certification Dossier
          </div>
          <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
            Max 25 MB • Signed X.509 cryptographic validation
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Audit Notes & Governance Comments</label>
          <textarea
            className="form-textarea"
            rows={2}
            placeholder="Record audit report link or notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
};
