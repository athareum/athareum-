import React, { useEffect } from 'react';

const TOAST_DURATION = 6000;

const ICONS = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: '◉',
};

const COLORS = {
  success: { bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.2)', icon: '#22c55e', text: '#86efac' },
  error:   { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', icon: '#ef4444', text: '#fca5a5' },
  warning: { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', icon: '#f59e0b', text: '#fcd34d' },
  info:    { bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)', icon: '#3b82f6', text: '#93c5fd' },
};

function ToastItem({ toast, onRemove }) {
  const c = COLORS[toast.type] || COLORS.info;

  useEffect(() => {
    const t = setTimeout(() => onRemove(toast.id), TOAST_DURATION);
    return () => clearTimeout(t);
  }, [toast.id, onRemove]);

  const etherscanUrl = toast.txHash
    ? `https://sepolia.etherscan.io/tx/${toast.txHash}`
    : null;

  return (
    <div style={{
      background: '#111',
      border: `1px solid ${c.border}`,
      borderRadius: '12px',
      padding: '14px 16px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      animation: 'toast-in 0.25s ease',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      maxWidth: '360px',
      width: '100%',
      position: 'relative',
    }}>
      {/* Icon */}
      <div style={{
        width: '28px', height: '28px',
        background: c.bg,
        borderRadius: '8px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '13px',
        color: c.icon,
        flexShrink: 0,
        fontWeight: 700,
      }}>
        {ICONS[toast.type] || '◉'}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '13px',
          color: '#ccc',
          lineHeight: 1.5,
          wordBreak: 'break-word',
        }}>
          {toast.message}
        </div>
        {etherscanUrl && (
          <a
            href={etherscanUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              marginTop: '6px',
              fontSize: '11.5px',
              color: '#f7931a',
              textDecoration: 'none',
              fontFamily: 'JetBrains Mono, monospace',
            }}
            onMouseEnter={e => e.target.style.textDecoration = 'underline'}
            onMouseLeave={e => e.target.style.textDecoration = 'none'}
          >
            {toast.txHash.slice(0, 10)}...{toast.txHash.slice(-6)} ↗
          </a>
        )}
      </div>

      {/* Close */}
      <button
        onClick={() => onRemove(toast.id)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#333',
          fontSize: '14px',
          padding: '0',
          lineHeight: 1,
          flexShrink: 0,
          transition: 'color 0.15s',
        }}
        onMouseEnter={e => e.target.style.color = '#888'}
        onMouseLeave={e => e.target.style.color = '#333'}
        aria-label="Close notification"
      >✕</button>
    </div>
  );
}

export default function Toast({ toasts, onRemove }) {
  if (!toasts?.length) return null;
  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      alignItems: 'flex-end',
    }}>
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}
