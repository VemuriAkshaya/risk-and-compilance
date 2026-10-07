import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { AlertTriangle, ShieldAlert, CheckCircle2, Trash2 } from 'lucide-react';

export type ActionType = 'BLOCK' | 'REJECT' | 'DELETE' | 'APPROVE_HIGH_RISK';

interface ConfirmActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionType: ActionType;
  supplierName: string;
  supplierId: string;
  onConfirm: (reason: string) => Promise<void>;
}

export const ConfirmActionModal: React.FC<ConfirmActionModalProps> = ({
  isOpen,
  onClose,
  actionType,
  supplierName,
  supplierId,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

  const config = {
    BLOCK: {
      title: 'Confirm Block Supplier',
      icon: <ShieldAlert color="#ba1717" size={24} />,
      btnText: 'Block Supplier',
      btnClass: 'btn-danger',
      requireReason: true,
      promptText: `Are you sure you want to block ${supplierName} (${supplierId})? When blocked, active purchase orders will be placed on compliance hold and no new contracts may be executed.`,
      reasonPlaceholder: 'Enter mandatory audit reason for blocking this supplier...',
    },
    REJECT: {
      title: 'Confirm Reject Supplier Application',
      icon: <AlertTriangle color="#c25900" size={24} />,
      btnText: 'Reject Supplier',
      btnClass: 'btn-danger',
      requireReason: true,
      promptText: `Are you sure you want to reject ${supplierName} (${supplierId})? The onboarding process will be terminated.`,
      reasonPlaceholder: 'Specify formal reason for rejection (e.g. failed due diligence, sanctions violation)...',
    },
    DELETE: {
      title: 'Confirm Supplier Record Deletion',
      icon: <Trash2 color="#ba1717" size={24} />,
      btnText: 'Delete Record',
      btnClass: 'btn-danger',
      requireReason: false,
      promptText: `Are you sure you want to delete supplier record for ${supplierName} (${supplierId})? This will remove the supplier and associated local audit history.`,
      reasonPlaceholder: 'Optional notes...',
    },
    APPROVE_HIGH_RISK: {
      title: 'Executive Risk Review Authorization',
      icon: <AlertTriangle color="#c25900" size={24} />,
      btnText: 'Confirm & Approve High Risk',
      btnClass: 'btn-warning',
      requireReason: true,
      promptText: `Supplier ${supplierName} (${supplierId}) has a HIGH Risk Score (61-100). Per enterprise compliance policy, high-risk suppliers require formal executive review justification before approval.`,
      reasonPlaceholder: 'Document executive compliance approval notes and risk mitigation controls...',
    },
  }[actionType];

  const handleConfirm = async () => {
    if (config.requireReason && !reason.trim()) {
      setValidationError('A formal justification reason is mandatory.');
      return;
    }

    setValidationError('');
    setIsSubmitting(true);
    try {
      await onConfirm(reason.trim());
      setReason('');
      onClose();
    } catch {
      // Error handled by parent toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {config.icon}
          <span>{config.title}</span>
        </div>
      }
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button
            type="button"
            className={`btn ${config.btnClass}`}
            onClick={handleConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Processing...' : config.btnText}
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <p style={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.5 }}>
          {config.promptText}
        </p>

        {config.requireReason && (
          <div className="form-group">
            <label className="form-label">
              Justification / Audit Notes <span className="req">*</span>
            </label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder={config.reasonPlaceholder}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (validationError) setValidationError('');
              }}
            />
            {validationError && (
              <span style={{ fontSize: '0.78rem', color: 'var(--sap-error)', fontWeight: 600 }}>
                {validationError}
              </span>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
