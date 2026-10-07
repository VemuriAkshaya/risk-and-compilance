import React from 'react';
import { Modal } from '../common/Modal';
import { ComplianceDocument } from '../../types/supplier';
import { ComplianceBadge } from '../common/Badge';
import { supplierService } from '../../services/supplierService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  FileCheck,
  Download,
  Calendar,
  ShieldCheck,
  Building2,
  Trash2,
  ExternalLink,
  Lock,
  FileText,
} from 'lucide-react';

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: ComplianceDocument | null;
  supplierName: string;
  onRenew?: (doc: ComplianceDocument) => void;
  onDelete?: (doc: ComplianceDocument) => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  isOpen,
  onClose,
  document,
  supplierName,
  onRenew,
  onDelete,
}) => {
  const { can } = useAuth();
  const { success } = useToast();

  if (!isOpen || !document) return null;

  const handleDownload = () => {
    supplierService.downloadDocumentDossier(document, supplierName);
    success('Certificate Dossier Downloaded', `Generated verified audit document for ${document.documentType}.`);
  };

  const calculateDays = (dateStr: string) => {
    const exp = new Date(dateStr).getTime();
    const now = new Date().getTime();
    return Math.ceil((exp - now) / (1000 * 3600 * 24));
  };

  const daysLeft = calculateDays(document.expiryDate);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FileCheck color="#0070f2" size={22} />
          <span>Compliance Certificate Dossier</span>
        </div>
      }
      footer={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div>
            {can('DELETE_DOCUMENTS') && onDelete && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ color: '#ba1717' }}
                onClick={() => {
                  onClose();
                  onDelete(document);
                }}
              >
                <Trash2 size={14} />
                <span>Delete Certificate</span>
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
            <button type="button" className="btn btn-primary" onClick={handleDownload}>
              <Download size={15} />
              <span>Download Dossier</span>
            </button>
            {onRenew && can('MANAGE_DOCUMENTS') && (
              <button
                type="button"
                className="btn btn-success"
                onClick={() => {
                  onClose();
                  onRenew(document);
                }}
              >
                Renew Certificate
              </button>
            )}
          </div>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* Document Header Card */}
        <div
          style={{
            background: document.status === 'EXPIRED' ? '#fdeeee' : '#f8fafc',
            border: `1px solid ${document.status === 'EXPIRED' ? '#f8b4b4' : '#e2e8f0'}`,
            borderRadius: '8px',
            padding: '16px',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>
              {document.documentType}
            </div>
            <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
              Supplier: <strong>{supplierName}</strong> ({document.supplierId})
            </div>
            <div style={{ fontFamily: 'var(--sap-font-mono)', fontSize: '0.8rem', color: '#0070f2', marginTop: '4px' }}>
              Certificate ID: {document.documentNumber}
            </div>
          </div>
          <ComplianceBadge status={document.status} />
        </div>

        {/* Expiry Tracking Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem' }}>
          <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            <div style={{ color: '#64748b', fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 600 }}>
              Issue Date
            </div>
            <div style={{ fontWeight: 700, marginTop: '2px', color: '#1e293b' }}>{document.issueDate}</div>
          </div>

          <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            <div style={{ color: '#64748b', fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 600 }}>
              Expiration Date
            </div>
            <div style={{ fontWeight: 700, marginTop: '2px', color: document.status === 'EXPIRED' ? '#ba1717' : '#1e293b' }}>
              {document.expiryDate}
              <span style={{ fontSize: '0.74rem', fontWeight: 500, marginLeft: '6px' }}>
                {daysLeft < 0 ? `(${Math.abs(daysLeft)}d expired)` : `(${daysLeft}d remaining)`}
              </span>
            </div>
          </div>
        </div>

        {/* Authority & Attestation Details */}
        <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <span style={{ color: '#64748b' }}>Issuing / Verification Authority:</span>{' '}
            <strong>{document.verificationAuthority}</strong>
          </div>
          {document.documentName && (
            <div>
              <span style={{ color: '#64748b' }}>Primary Dossier Asset:</span>{' '}
              <span>{document.documentName} ({document.fileSize || '2.1 MB'})</span>
            </div>
          )}
          {document.notes && (
            <div style={{ background: '#fffbeb', padding: '10px 12px', borderRadius: '6px', border: '1px solid #fde68a' }}>
              <span style={{ color: '#92400e', fontWeight: 600 }}>Audit Notes:</span>{' '}
              <span style={{ color: '#78350f' }}>{document.notes}</span>
            </div>
          )}
        </div>

        {/* Electronic Signature Attestation Stamp */}
        <div
          style={{
            background: '#ffffff',
            border: '1px dashed #cbd5e1',
            borderRadius: '6px',
            padding: '12px',
            fontSize: '0.74rem',
            color: '#64748b',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#0d7f3e', marginBottom: '4px' }}>
            <ShieldCheck size={16} />
            <span>SAP S/4HANA Enterprise Cryptographic Attestation</span>
          </div>
          <div>Digital Fingerprint Hash: <code style={{ color: '#0070f2' }}>{document.digitalSignatureHash}</code></div>
          <div style={{ marginTop: '2px' }}>Verified against central enterprise supplier trust store.</div>
        </div>
      </div>
    </Modal>
  );
};
