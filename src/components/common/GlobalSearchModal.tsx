import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supplierService } from '../../services/supplierService';
import { GlobalSearchResultItem } from '../../types/supplier';
import {
  Search,
  X,
  Building2,
  FileCheck,
  ShieldAlert,
  History,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GlobalSearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await supplierService.searchGlobal(query);
        setResults(res);
      } finally {
        setIsLoading(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const handleSelectResult = (item: GlobalSearchResultItem) => {
    onClose();
    navigate(item.link);
  };

  const suppliersList = results.filter((r) => r.type === 'SUPPLIER');
  const documentsList = results.filter((r) => r.type === 'DOCUMENT');
  const risksList = results.filter((r) => r.type === 'RISK');
  const auditList = results.filter((r) => r.type === 'AUDIT');

  return (
    <div className="modal-overlay" onClick={onClose} style={{ alignItems: 'flex-start', paddingTop: '10vh' }}>
      <div
        className="modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{ width: '640px', maxWidth: '95vw', maxHeight: '75vh', overflow: 'hidden' }}
      >
        {/* Search Input Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px 20px',
            borderBottom: '1px solid var(--sap-border)',
            background: '#ffffff',
          }}
        >
          <Search size={20} color="#0070f2" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search suppliers, certificates, risk tiers, audit logs..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '1.05rem',
              fontFamily: 'inherit',
              color: 'var(--sap-text-primary)',
            }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
            >
              <X size={18} />
            </button>
          )}
          <span style={{ fontSize: '0.72rem', color: '#94a3b8', background: '#f1f5f9', padding: '3px 8px', borderRadius: '4px' }}>
            ESC to close
          </span>
        </div>

        {/* Results Container */}
        <div style={{ padding: '16px 20px', overflowY: 'auto', maxHeight: '55vh' }}>
          {isLoading && (
            <div style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
              Searching enterprise index...
            </div>
          )}

          {!isLoading && !query.trim() && (
            <div style={{ padding: '20px 0', color: '#64748b', fontSize: '0.84rem' }}>
              <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>Search Suggestions:</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span
                  onClick={() => setQuery('Siemens')}
                  style={{ background: '#f1f5f9', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Siemens
                </span>
                <span
                  onClick={() => setQuery('ISO 9001')}
                  style={{ background: '#f1f5f9', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer' }}
                >
                  ISO 9001
                </span>
                <span
                  onClick={() => setQuery('HIGH')}
                  style={{ background: '#f1f5f9', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer' }}
                >
                  High Risk
                </span>
                <span
                  onClick={() => setQuery('BLOCK')}
                  style={{ background: '#f1f5f9', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Blocked Status
                </span>
              </div>
            </div>
          )}

          {!isLoading && query.trim() && results.length === 0 && (
            <div style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
              No matches found for &quot;<strong>{query}</strong>&quot;. Try another search term.
            </div>
          )}

          {/* Group 1: Suppliers */}
          {suppliersList.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 700, color: '#64748b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building2 size={13} color="#0070f2" />
                <span>Suppliers ({suppliersList.length})</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {suppliersList.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectResult(item)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '6px',
                      background: '#f8fafc',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#eff6ff')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#1e293b' }}>{item.title}</div>
                      <div style={{ fontSize: '0.76rem', color: '#64748b' }}>{item.subtitle}</div>
                    </div>
                    {item.badge && (
                      <span className={`sap-badge badge-risk-${item.badgeType === 'error' ? 'high' : item.badgeType === 'warning' ? 'medium' : 'low'}`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Group 2: Documents */}
          {documentsList.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 700, color: '#64748b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileCheck size={13} color="#0d7f3e" />
                <span>Compliance Certificates &amp; Documents ({documentsList.length})</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {documentsList.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectResult(item)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '6px',
                      background: '#f8fafc',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#eff6ff')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#1e293b' }}>{item.title}</div>
                      <div style={{ fontSize: '0.76rem', color: '#64748b' }}>{item.subtitle}</div>
                    </div>
                    {item.badge && (
                      <span className={`sap-badge badge-compliance-${item.badgeType === 'error' ? 'expired' : item.badgeType === 'warning' ? 'expiring_soon' : 'valid'}`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Group 3: Risks */}
          {risksList.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 700, color: '#64748b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldAlert size={13} color="#c25900" />
                <span>Risk Profiles ({risksList.length})</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {risksList.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectResult(item)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '6px',
                      background: '#f8fafc',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#eff6ff')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#1e293b' }}>{item.title}</div>
                      <div style={{ fontSize: '0.76rem', color: '#64748b' }}>{item.subtitle}</div>
                    </div>
                    {item.badge && (
                      <span className={`sap-badge badge-risk-${item.badgeType === 'error' ? 'high' : 'medium'}`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Group 4: Audit */}
          {auditList.length > 0 && (
            <div>
              <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 700, color: '#64748b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <History size={13} color="#8b5cf6" />
                <span>Audit Trail Records ({auditList.length})</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {auditList.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectResult(item)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '6px',
                      background: '#f8fafc',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#eff6ff')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#1e293b' }}>{item.title}</div>
                      <div style={{ fontSize: '0.76rem', color: '#64748b' }}>{item.subtitle}</div>
                    </div>
                    <ArrowRight size={15} color="#94a3b8" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
