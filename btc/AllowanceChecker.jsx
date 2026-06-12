import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

function fmtAllowance(val, decimals = 18) {
  try {
    if (val === ethers.MaxUint256) return '∞ Unlimited';
    const n = parseFloat(ethers.formatUnits(val, decimals));
    if (n >= 1e9) return (n / 1e9).toFixed(4) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(4) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(4) + 'K';
    return n.toFixed(6);
  } catch { return '—'; }
}

export default function AllowanceChecker({ readContract, account, isConnected }) {
  const [owner, setOwner] = useState('');
  const [spender, setSpender] = useState('');
  const [allowance, setAllowance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [decimals, setDecimals] = useState(18);
  const [symbol, setSymbol] = useState('BTCS');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!readContract) return;
    readContract.decimals?.().then(d => setDecimals(Number(d))).catch(() => {});
    readContract.symbol?.().then(s => setSymbol(s)).catch(() => {});
  }, [readContract]);

  const fillMyAddress = () => {
    if (account) setOwner(account);
  };

  const handleCheck = async (e) => {
    e.preventDefault();
    setError('');
    setAllowance(null);
    if (!readContract) return;
    if (!ethers.isAddress(owner)) { setError('Invalid owner address.'); return; }
    if (!ethers.isAddress(spender)) { setError('Invalid spender address.'); return; }
    setLoading(true);
    try {
      const val = await readContract.allowance(owner, spender);
      setAllowance(val);
    } catch (err) {
      setError(err?.message || 'Failed to fetch allowance.');
    } finally {
      setLoading(false);
    }
  };

  const isUnlimited = allowance !== null && allowance === ethers.MaxUint256;
  const isZero = allowance !== null && allowance === 0n;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
        <span style={{ fontSize: '20px', color: '#a855f7' }}>⊙</span>
        <div>
          <div style={{ fontWeight: 600, fontSize: '15px' }}>Check Allowance</div>
          <div style={{ fontSize: '12px', color: '#555' }}>Query how many tokens a spender is approved to use</div>
        </div>
      </div>

      <form onSubmit={handleCheck} style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '520px' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <div className="section-label">Owner Address</div>
            {isConnected && (
              <button
                type="button"
                className="btn-ghost"
                onClick={fillMyAddress}
                style={{ fontSize: '11px', padding: '3px 10px' }}
              >
                Use My Address
              </button>
            )}
          </div>
          <input
            className="btc-input btc-input-mono"
            type="text"
            placeholder="0x... (token holder)"
            value={owner}
            onChange={e => setOwner(e.target.value)}
            disabled={loading}
          />
        </div>

        <div>
          <div className="section-label" style={{ marginBottom: '6px' }}>Spender Address</div>
          <input
            className="btc-input btc-input-mono"
            type="text"
            placeholder="0x... (approved spender)"
            value={spender}
            onChange={e => setSpender(e.target.value)}
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          className="btn-outline"
          disabled={loading || !owner || !spender || !readContract}
          style={{ padding: '11px 20px', maxWidth: '200px', fontSize: '13px' }}
        >
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="spinner" style={{ width: '14px', height: '14px' }} />
              Checking...
            </span>
          ) : '⊙ Check Allowance'}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div style={{
          marginTop: '14px',
          background: 'rgba(239,68,68,0.06)',
          border: '1px solid rgba(239,68,68,0.15)',
          borderRadius: '10px',
          padding: '12px 14px',
          fontSize: '13px',
          color: '#ef4444',
        }}>{error}</div>
      )}

      {/* Result */}
      {allowance !== null && !error && (
        <div style={{
          marginTop: '16px',
          background: '#0d0d0d',
          border: `1px solid ${isZero ? '#1a1a1a' : isUnlimited ? 'rgba(247,147,26,0.15)' : 'rgba(34,197,94,0.15)'}`,
          borderRadius: '12px',
          padding: '18px 20px',
        }}>
          <div style={{ fontSize: '11px', color: '#444', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
            Allowance Result
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.02em', color: isZero ? '#333' : isUnlimited ? '#f7931a' : '#22c55e' }}>
            {fmtAllowance(allowance, decimals)}
          </div>
          <div style={{ marginTop: '6px', fontSize: '12px', color: '#444' }}>
            {isZero
              ? `No allowance set — ${spender.slice(0, 10)}... cannot spend tokens`
              : isUnlimited
              ? `${spender.slice(0, 10)}... has unlimited spending access`
              : `${spender.slice(0, 10)}... can spend up to ${fmtAllowance(allowance, decimals)} ${symbol}`}
          </div>

          {/* Raw value */}
          {!isUnlimited && (
            <div style={{
              marginTop: '12px',
              background: '#0a0a0a',
              border: '1px solid #141414',
              borderRadius: '8px',
              padding: '8px 12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span style={{ fontSize: '11px', color: '#333' }}>Raw (wei)</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#444' }}>
                {allowance.toString().slice(0, 20)}{allowance.toString().length > 20 ? '...' : ''}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
