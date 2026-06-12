import React, { useState } from 'react';

function truncate(addr) {
  if (!addr) return '';
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}

export default function Header({ account, chainId, targetChainId, onConnect, onDisconnect, onSwitchNetwork, connecting, config }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const title = config?.title || 'BTCS Token Dashboard';
  const contractAddr = config?.contractAddress || '0x11eBbdF5637B40B2345Dde1FD44fAa068ff23027';
  const isConnected = !!account && chainId === targetChainId;
  const isWrongNetwork = !!account && chainId !== targetChainId;

  return (
    <header style={{
      background: '#0a0a0a',
      borderBottom: '1px solid #141414',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backdropFilter: 'blur(10px)',
    }}>
      <div style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '0 20px',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
      }}>
        {/* ── Logo ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '34px', height: '34px',
            background: 'linear-gradient(135deg, #f7931a, #e07b0a)',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '17px', fontWeight: 900, color: '#000',
            boxShadow: '0 0 16px rgba(247,147,26,0.25)',
            flexShrink: 0,
          }}>₿</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '15px', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              <span className="btc-gradient">BTCS</span>
            </div>
            <div style={{ fontSize: '10px', color: '#333', letterSpacing: '0.05em', textTransform: 'uppercase', lineHeight: 1 }}>
              Sepolia Testnet
            </div>
          </div>
        </div>

        {/* ── Contract Address ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: '#0d0d0d',
          border: '1px solid #181818',
          borderRadius: '8px',
          padding: '5px 10px',
          cursor: 'pointer',
          transition: 'border-color 0.2s',
        }}
          onClick={() => { navigator.clipboard?.writeText(contractAddr); }}
          title={`Copy: ${contractAddr}`}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#2a2a2a'}
          onMouseLeave={e => e.currentTarget.style.borderColor = '#181818'}
        >
          <span style={{ fontSize: '10px', color: '#333' }}>⬡</span>
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '11px',
            color: '#444',
            letterSpacing: '0.03em',
          }}>
            {contractAddr.slice(0, 8)}...{contractAddr.slice(-6)}
          </span>
          <span style={{ fontSize: '10px', color: '#2a2a2a' }}>⎘</span>
        </div>

        {/* ── Wallet Controls ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {!account ? (
            <button
              className="btn-btc"
              onClick={onConnect}
              disabled={connecting}
              style={{ padding: '8px 16px', fontSize: '13px' }}
            >
              {connecting ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="spinner" style={{ width: '13px', height: '13px', borderTopColor: '#000', borderColor: 'rgba(0,0,0,0.2)' }} />
                  Connecting
                </span>
              ) : '🔗 Connect Wallet'}
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Network indicator */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                background: isConnected ? 'rgba(34,197,94,0.06)' : 'rgba(245,158,11,0.06)',
                border: `1px solid ${isConnected ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)'}`,
                borderRadius: '8px',
                padding: '5px 10px',
                fontSize: '12px',
                cursor: isWrongNetwork ? 'pointer' : 'default',
              }}
                onClick={isWrongNetwork ? onSwitchNetwork : undefined}
                title={isWrongNetwork ? 'Click to switch to Sepolia' : 'Sepolia Testnet'}
              >
                <span style={{
                  width: '7px', height: '7px',
                  borderRadius: '50%',
                  background: isConnected ? '#22c55e' : '#f59e0b',
                  boxShadow: `0 0 6px ${isConnected ? '#22c55e' : '#f59e0b'}`,
                  flexShrink: 0,
                }} />
                <span style={{ color: isConnected ? '#22c55e' : '#f59e0b', fontWeight: 500 }}>
                  {isConnected ? 'Sepolia' : 'Wrong Network'}
                </span>
              </div>

              {/* Account button */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setMenuOpen(v => !v)}
                  style={{
                    background: '#111',
                    border: '1px solid #1e1e1e',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '7px',
                    transition: 'border-color 0.2s',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '12px',
                    color: '#ccc',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#2a2a2a'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#1e1e1e'}
                >
                  <span style={{
                    width: '20px', height: '20px',
                    background: 'linear-gradient(135deg, #f7931a, #3b82f6)',
                    borderRadius: '50%',
                    flexShrink: 0,
                  }} />
                  {truncate(account)}
                  <span style={{ color: '#333', fontSize: '10px' }}>▾</span>
                </button>

                {menuOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 6px)',
                      right: 0,
                      background: '#111',
                      border: '1px solid #1e1e1e',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                      minWidth: '200px',
                      zIndex: 200,
                    }}
                  >
                    <div style={{ padding: '12px 14px', borderBottom: '1px solid #1a1a1a' }}>
                      <div style={{ fontSize: '11px', color: '#444', marginBottom: '4px' }}>Connected Account</div>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: '#888', wordBreak: 'break-all' }}>
                        {account}
                      </div>
                    </div>
                    <button
                      onClick={() => { onDisconnect(); setMenuOpen(false); }}
                      style={{
                        width: '100%',
                        background: 'none',
                        border: 'none',
                        padding: '12px 14px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '13px',
                        color: '#ef4444',
                        display: 'flex', alignItems: 'center', gap: '8px',
                        transition: 'background 0.15s',
                        fontFamily: 'Inter, sans-serif',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.05)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      ⏻ Disconnect
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Click-outside to close menu */}
      {menuOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 150 }}
          onClick={() => setMenuOpen(false)}
        />
      )}
    </header>
  );
}
