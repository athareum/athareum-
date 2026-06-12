import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

export default function MintSection({ writeContract, isConnected, addToast }) {
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [decimals, setDecimals] = useState(18);
  const [symbol, setSymbol] = useState('BTCS');

  useEffect(() => {
    if (!writeContract) return;
    writeContract.decimals?.().then(d => setDecimals(Number(d))).catch(() => {});
    writeContract.symbol?.().then(s => setSymbol(s)).catch(() => {});
  }, [writeContract]);

  const handleMint = async (e) => {
    e.preventDefault();
    if (!writeContract || !isConnected) return;
    if (!ethers.isAddress(to)) { addToast('Invalid recipient address.', 'error'); return; }
    if (!amount || isNaN(amount) || Number(amount) <= 0) { addToast('Enter a valid amount.', 'error'); return; }
    setLoading(true);
    try {
      const amountWei = ethers.parseUnits(amount, decimals);
      const tx = await writeContract.mint(to, amountWei);
      addToast('Mint transaction submitted! Waiting...', 'info', tx.hash);
      await tx.wait();
      addToast(`✓ Minted ${amount} ${symbol} to ${to.slice(0, 10)}...`, 'success', tx.hash);
      setTo('');
      setAmount('');
    } catch (err) {
      const msg = err?.reason || err?.shortMessage || err?.message || 'Mint failed.';
      addToast(msg.slice(0, 120), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
        <div style={{
          width: '32px', height: '32px',
          background: 'rgba(247,147,26,0.1)',
          border: '1px solid rgba(247,147,26,0.2)',
          borderRadius: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '16px',
          color: '#f7931a',
        }}>⊕</div>
        <div>
          <div style={{ fontWeight: 600, fontSize: '15px' }}>Mint New Tokens</div>
          <div style={{ fontSize: '12px', color: '#555' }}>Create and send new {symbol} tokens to any address</div>
        </div>
      </div>

      <form onSubmit={handleMint} style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '480px' }}>
        <div>
          <div className="section-label" style={{ marginBottom: '6px' }}>Recipient Address</div>
          <input
            className="btc-input btc-input-mono"
            type="text"
            placeholder="0x... (who receives the minted tokens)"
            value={to}
            onChange={e => setTo(e.target.value)}
            disabled={!isConnected || loading}
          />
        </div>

        <div>
          <div className="section-label" style={{ marginBottom: '6px' }}>Amount to Mint ({symbol})</div>
          <input
            className="btc-input"
            type="number"
            min="0"
            step="any"
            placeholder="0.00"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            disabled={!isConnected || loading}
          />
        </div>

        {/* Preview */}
        {to && amount && ethers.isAddress(to) && Number(amount) > 0 && (
          <div style={{
            background: 'rgba(247,147,26,0.04)',
            border: '1px solid rgba(247,147,26,0.1)',
            borderRadius: '10px',
            padding: '12px 14px',
            fontSize: '12.5px',
            color: '#888',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <span style={{ color: '#f7931a' }}>⊕</span>
            Mint <strong style={{ color: '#f7931a' }}>{amount} {symbol}</strong> → {to.slice(0, 10)}...{to.slice(-6)}
          </div>
        )}

        <button
          type="submit"
          className="btn-btc"
          disabled={!isConnected || loading || !to || !amount}
          style={{ padding: '12px 24px', maxWidth: '200px', fontSize: '13.5px' }}
        >
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="spinner" style={{ width: '15px', height: '15px', borderTopColor: '#000', borderColor: 'rgba(0,0,0,0.2)' }} />
              Minting...
            </span>
          ) : `⊕ Mint ${symbol}`}
        </button>
      </form>

      <div style={{
        marginTop: '18px',
        background: '#0a0a0a',
        border: '1px solid #141414',
        borderRadius: '10px',
        padding: '12px 14px',
        fontSize: '12px',
        color: '#2a2a2a',
        lineHeight: 1.6,
      }}>
        <span style={{ color: '#333', fontWeight: 600 }}>Owner-only function.</span> Minting increases the total supply. Only the contract owner can call this function.
      </div>
    </div>
  );
}
