import React, { useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';

function fmtPrice(raw) {
  // Chainlink BTC/USD returns price with 8 decimals
  try {
    const n = Number(raw) / 1e8;
    return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  } catch { return '—'; }
}

function fmtSupply(val, decimals = 18) {
  try {
    const n = parseFloat(ethers.formatUnits(val, decimals));
    if (n >= 1e9) return (n / 1e9).toFixed(3) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(3) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(3) + 'K';
    return n.toFixed(4);
  } catch { return '—'; }
}

function fmtBalance(val, decimals = 18) {
  try {
    const n = parseFloat(ethers.formatUnits(val, decimals));
    if (n >= 1e6) return (n / 1e6).toFixed(3) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(3) + 'K';
    return n.toFixed(4);
  } catch { return '—'; }
}

function SkeletonBox({ w = '80px', h = '28px' }) {
  return (
    <div style={{
      width: w, height: h,
      background: '#181818',
      borderRadius: '6px',
      animation: 'pulse 1.4s ease-in-out infinite',
    }} />
  );
}

// ── BTC Price Ticker ──
function BTCTicker({ btcPrice, symbol }) {
  const priceStr = btcPrice ? `$${fmtPrice(btcPrice)}` : '---';
  const items = Array(8).fill(null).map((_, i) => (
    <span key={i} className="ticker-item">
      <span style={{ color: '#f7931a', marginRight: '6px' }}>₿</span>
      <span style={{ color: '#f7931a', fontWeight: 600 }}>BTC/USD</span>
      <span style={{ color: '#333', margin: '0 8px' }}>•</span>
      <span style={{ color: '#888' }}>{priceStr}</span>
      <span style={{ color: '#1e1e1e', margin: '0 16px' }}>|</span>
      <span style={{ color: '#555', marginRight: '6px' }}>{symbol || 'BTCS'}</span>
      <span style={{ color: '#2a2a2a' }}>Sepolia</span>
      <span style={{ color: '#1e1e1e', margin: '0 16px' }}>|</span>
    </span>
  ));

  return (
    <div className="btc-ticker" style={{ marginBottom: '20px' }}>
      <div className="ticker-track">
        {items}
        {items}
      </div>
    </div>
  );
}

// ── USD Value Calculator ──
function ValueCalculator({ readContract, decimals, symbol }) {
  const [amount, setAmount] = useState('');
  const [usdValue, setUsdValue] = useState(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!readContract || !amount || isNaN(amount) || Number(amount) <= 0) {
      setUsdValue(null);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const amtWei = ethers.parseUnits(amount, decimals);
        const val = await readContract.getValueInUSD(amtWei);
        setUsdValue(val);
      } catch { setUsdValue(null); }
      finally { setLoading(false); }
    }, 500);
    return () => clearTimeout(debounceRef.current);
  }, [amount, readContract, decimals]);

  return (
    <div style={{
      background: '#0d0d0d',
      border: '1px solid #181818',
      borderRadius: '12px',
      padding: '16px',
    }}>
      <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#444', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
        Token Value Calculator
      </div>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '140px' }}>
          <input
            className="btc-input"
            type="number"
            min="0"
            step="any"
            placeholder="Enter amount..."
            value={amount}
            onChange={e => setAmount(e.target.value)}
            style={{ paddingRight: '52px' }}
          />
          <span style={{
            position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
            fontSize: '12px', color: '#f7931a', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace',
          }}>{symbol || 'BTCS'}</span>
        </div>
        <span style={{ color: '#2a2a2a', fontSize: '18px', flexShrink: 0 }}>=</span>
        <div style={{
          flex: 1, minWidth: '140px',
          background: '#0a0a0a',
          border: '1px solid #1a1a1a',
          borderRadius: '10px',
          padding: '10px 14px',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          {loading ? (
            <span className="spinner" style={{ width: '14px', height: '14px' }} />
          ) : usdValue !== null ? (
            <span style={{ fontSize: '16px', fontWeight: 700, color: '#22c55e' }}>
              ${fmtPrice(usdValue)}
            </span>
          ) : (
            <span style={{ fontSize: '13px', color: '#2a2a2a' }}>USD value</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TokenStats({ readContract, account, isConnected }) {
  const [stats, setStats] = useState({
    name: null,
    symbol: null,
    decimals: null,
    totalSupply: null,
    balance: null,
    btcPrice: null,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!readContract) return;
    setLoading(true);
    const fetchAll = async () => {
      try {
        const [name, symbol, decimals, totalSupply, btcPrice] = await Promise.all([
          readContract.name().catch(() => 'BTCS Token'),
          readContract.symbol().catch(() => 'BTCS'),
          readContract.decimals().catch(() => 18),
          readContract.totalSupply().catch(() => null),
          readContract.getLatestBTCPrice().catch(() => null),
        ]);
        let balance = null;
        if (account) {
          balance = await readContract.balanceOf(account).catch(() => null);
        }
        setStats({ name, symbol, decimals: Number(decimals), totalSupply, balance, btcPrice });
      } catch {}
      finally { setLoading(false); }
    };
    fetchAll();
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, [readContract, account]);

  const dec = stats.decimals ?? 18;
  const sym = stats.symbol || 'BTCS';

  const STAT_CARDS = [
    {
      label: 'BTC / USD Price',
      value: stats.btcPrice !== null ? `$${fmtPrice(stats.btcPrice)}` : null,
      icon: '₿',
      iconBg: 'rgba(247,147,26,0.12)',
      iconColor: '#f7931a',
      accent: '#f7931a',
      sub: 'via Chainlink',
    },
    {
      label: 'Total Supply',
      value: stats.totalSupply !== null ? fmtSupply(stats.totalSupply, dec) : null,
      icon: '◎',
      iconBg: 'rgba(59,130,246,0.1)',
      iconColor: '#3b82f6',
      accent: '#3b82f6',
      sub: sym,
    },
    {
      label: 'My Balance',
      value: stats.balance !== null ? fmtBalance(stats.balance, dec) : (isConnected ? null : '—'),
      icon: '◈',
      iconBg: 'rgba(34,197,94,0.1)',
      iconColor: '#22c55e',
      accent: '#22c55e',
      sub: isConnected ? sym : 'Connect wallet',
    },
    {
      label: 'Token Decimals',
      value: stats.decimals !== null ? String(stats.decimals) : null,
      icon: '#',
      iconBg: 'rgba(168,85,247,0.1)',
      iconColor: '#a855f7',
      accent: '#a855f7',
      sub: stats.name || 'BTCS Token',
    },
  ];

  return (
    <div>
      {/* BTC Ticker */}
      <BTCTicker btcPrice={stats.btcPrice} symbol={sym} />

      {/* Stat Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '14px',
        marginBottom: '20px',
      }}>
        {STAT_CARDS.map((card, i) => (
          <div
            key={i}
            className="glass-card stat-card"
            style={{ padding: '18px 20px' }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{
                width: '36px', height: '36px',
                background: card.iconBg,
                borderRadius: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '17px',
                color: card.iconColor,
                fontWeight: 700,
              }}>{card.icon}</div>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: card.accent, marginTop: '4px', boxShadow: `0 0 8px ${card.accent}` }} />
            </div>
            <div style={{ fontSize: '11px', color: '#444', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
              {card.label}
            </div>
            {loading || (card.value === null && isConnected) ? (
              <SkeletonBox w="100px" h="26px" />
            ) : (
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#e5e5e5', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                {card.value ?? '—'}
              </div>
            )}
            <div style={{ marginTop: '6px', fontSize: '11.5px', color: '#333' }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Value Calculator */}
      {readContract && (
        <ValueCalculator readContract={readContract} decimals={dec} symbol={sym} />
      )}
    </div>
  );
}
