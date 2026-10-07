import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supplierService } from '../../services/supplierService';
import { NotificationItem, NotificationCategory } from '../../types/supplier';
import {
  Bell,
  X,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  ShieldAlert,
  CheckCheck,
  ExternalLink,
  Trash2,
} from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCountUpdate?: (count: number) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  onCountUpdate,
}) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filterCategory, setFilterCategory] = useState<NotificationCategory | 'ALL'>('ALL');
  const [isLoading, setIsLoading] = useState(false);

  const loadNotifications = async () => {
    try {
      const data = await supplierService.getNotifications();
      setNotifications(data);
      const unreadCount = data.filter((n) => !n.isRead).length;
      if (onCountUpdate) onCountUpdate(unreadCount);
    } catch {
      // Ignore background load error
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 6000);
    return () => clearInterval(interval);
  }, []);

  if (!isOpen) return null;

  const filtered = notifications.filter((n) => {
    if (filterCategory === 'ALL') return true;
    return n.category === filterCategory;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = async () => {
    await supplierService.markAllNotificationsAsRead();
    loadNotifications();
  };

  const handleItemClick = async (notif: NotificationItem) => {
    if (!notif.isRead) {
      await supplierService.markNotificationAsRead(notif.id);
      loadNotifications();
    }
    if (notif.targetUrl) {
      onClose();
      navigate(notif.targetUrl);
    }
  };

  const handleDismiss = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await supplierService.dismissNotification(id);
    loadNotifications();
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ justifyContent: 'flex-end', padding: 0 }}>
      <div
        className="modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{
          height: '100vh',
          maxHeight: '100vh',
          width: '420px',
          maxWidth: '100%',
          borderRadius: '12px 0 0 12px',
          margin: 0,
        }}
      >
        {/* Header */}
        <div className="modal-header" style={{ padding: '16px 20px', background: 'var(--sap-shell-bg)', color: '#ffffff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ position: 'relative' }}>
              <Bell size={20} color="#38bdf8" />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-6px',
                    backgroundColor: '#ef4444',
                    color: '#ffffff',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    padding: '1px 5px',
                    borderRadius: '10px',
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>Notification Center</div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                {unreadCount} unread enterprise alert{unreadCount === 1 ? '' : 's'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {unreadCount > 0 && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={handleMarkAllRead}
                style={{ color: '#38bdf8', padding: '4px 8px', fontSize: '0.74rem' }}
                title="Mark all notifications as read"
              >
                <CheckCheck size={14} />
                <span>Read All</span>
              </button>
            )}

            <button
              type="button"
              className="modal-close-btn"
              onClick={onClose}
              style={{ color: '#cbd5e1' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '10px 16px',
            borderBottom: '1px solid var(--sap-border)',
            background: '#f8fafc',
            overflowX: 'auto',
          }}
        >
          <button
            type="button"
            className={`btn btn-sm ${filterCategory === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterCategory('ALL')}
            style={{ fontSize: '0.75rem', padding: '3px 10px' }}
          >
            All ({notifications.length})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${filterCategory === 'EXPIRY' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterCategory('EXPIRY')}
            style={{ fontSize: '0.75rem', padding: '3px 10px' }}
          >
            Expiry Alerts
          </button>
          <button
            type="button"
            className={`btn btn-sm ${filterCategory === 'HIGH_RISK' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterCategory('HIGH_RISK')}
            style={{ fontSize: '0.75rem', padding: '3px 10px' }}
          >
            High Risk
          </button>
          <button
            type="button"
            className={`btn btn-sm ${filterCategory === 'APPROVAL' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterCategory('APPROVAL')}
            style={{ fontSize: '0.75rem', padding: '3px 10px' }}
          >
            Approvals
          </button>
        </div>

        {/* Notification List */}
        <div className="modal-body" style={{ padding: '12px 16px', flex: 1, overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: '#64748b' }}>
              <Bell size={32} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
              <div style={{ fontWeight: 600 }}>No notifications in this view</div>
              <div style={{ fontSize: '0.76rem', marginTop: '4px' }}>All compliance alerts have been cleared.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filtered.map((item) => {
                const icon = {
                  EXPIRY: <AlertCircle size={18} color="#ba1717" />,
                  HIGH_RISK: <ShieldAlert size={18} color="#c25900" />,
                  APPROVAL: <CheckCircle2 size={18} color="#0d7f3e" />,
                  SYSTEM: <Bell size={18} color="#0070f2" />,
                }[item.category];

                return (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: `1px solid ${item.isRead ? '#e2e8f0' : '#bfdbfe'}`,
                      backgroundColor: item.isRead ? '#ffffff' : '#f0f7ff',
                      cursor: item.targetUrl ? 'pointer' : 'default',
                      transition: 'all 0.15s ease',
                      position: 'relative',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <div style={{ flexShrink: 0, marginTop: '2px' }}>{icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                          <span style={{ fontSize: '0.86rem', fontWeight: item.isRead ? 600 : 700, color: '#1e293b' }}>
                            {item.title}
                          </span>
                          {!item.isRead && (
                            <span
                              style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: '#0070f2',
                                flexShrink: 0,
                              }}
                              title="Unread"
                            />
                          )}
                        </div>

                        <p style={{ fontSize: '0.8rem', color: '#475569', marginTop: '3px', lineHeight: 1.35 }}>
                          {item.message}
                        </p>

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginTop: '6px',
                            fontSize: '0.72rem',
                            color: '#94a3b8',
                          }}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} />
                            {item.timestamp}
                          </span>

                          <button
                            type="button"
                            onClick={(e) => handleDismiss(e, item.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#94a3b8',
                              cursor: 'pointer',
                              padding: '2px',
                            }}
                            title="Dismiss notification"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
