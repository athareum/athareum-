import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

export default function ApproveForm({ writeContract, isConnected, addToast }) {
  const [spender, setSpender] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [decimals, setDecimals] = useState(18);
  const [symbol, setSymbol] = useState('BTCS');
  const [isUnlimited, setIsUnlimited] = useState(false);

  useEffect(() => {
    if (!writeContract) return;
    writeContract.decimals?.().then(d => setDecimals(Number(d))).catch(() => {});
    writeContract.symbol?.().then(s => setSymbol(s)).catch(() => {});
  }, [writeContract]);

  const handleApprove = async (e) => {
    e.preventDefault();
    if (!writeContract || !isConnected) return;
    if (!ethers.isAddress(spender)) { addToast('Invalid spender address.', 'error'); return; }
    if (!isUnlimited && (!amount || isNaN(amount) || Number(amount) <= 0)) {
      addToast('Enter a valid amount or select Unlimited.', 'error');
      return;
    }
    setLoading(true);
    try {
      let approveAmount;
      if (isUnlimited) {
        approveAmount = ethers.MaxUint256;
      } else {
        approveAmount = ethers.parseUnits(amount, decimals);
      }
      const tx = await writeContract.approve(spender, approveAmount);
      addToast('Approval submitted! Waiting...', 'info', tx.hash);
      await tx.wait();
      const displayAmt = isUnlimited ? 'unlimited' : `${amount} ${symbol}`;
      addToast(`✓ Approved ${displayAmt} for ${spender.slice(0, 10)}...`, 'success', tx.hash);
      setSpender('');
      setAmount('');
      setIsUnlimited(false);
    } catch (err) {
      const msg = err?.reason || err?.shortMessage || err?.message || 'Approval failed.';
      addToast(msg.slice(0, 120), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async () => {
    if (!writeContract || !isConnected) return;
    if (!ethers.isAddress(spender)) { addToast('Enter the spender address to revoke.', 'error'); return; }
    setLoading(true);
    try {
      const tx = await writeContract.approve(spender, 0n);
      addToast('Revoke submitted! Waiting...', 'info', tx.hash);
      await tx.wait();
      addToast(`✓ Approval revoked for ${spender.slice(0, 10)}...`, 'success', tx.hash);
      setSpender('');
    } catch (err) {
      const msg = err?.reason || err?.shortMessage || err?.message || 'Revoke failed.';
      addToast(msg.slice(0, 120), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
        <span style={{ fontSize: '20px', color: '#22c55e' }}>✓</span>
        <div>
          <div style={{ fontWeight: 600, fontSize: '15px' }}>Approve Spender</div>
          <div style={{ fontSize: '12px', color: '#555' }}>Grant another address permission to spend your tokens</div>
        </div>
      </div>

      <form onSubmit={handleApprove} style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '520px' }}>
        <div>
          <div className="section-label" style={{ marginBottom: '6px' }}>Spender Address</div>
          <input
            className="btc-input btc-input-mono"
            type="text"
            placeholder="0x... (address to approve)"
            value={spender}
            onChange={e => setSpender(e.target.value)}
            disabled={!isConnected || loading}
          />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <div className="section-label">Allowance Amount ({symbol})</div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isUnlimited}
                onChange={e => setIsUnlimited(e.target.checked)}
                disabled={!isConnected || loading}
                style={{ accentColor: '#f7931a', width: '14px', height: '14px' }}
              />
              <span style={{ fontSize: '12px', color: '#666' }}>Unlimited</span>
            </label>
          </div>
          <input
            className="btc-input"
            type="number"
            min="0"
            step="any"
            placeholder={isUnlimited ? 'Max allowance (∞)' : '0.00'}
            value={isUnlimited ? '' : amount}
            onChange={e => setAmount(e.target.value)}
            disabled={!isConnected || loading || isUnlimited}
            style={{ opacity: isUnlimited ? 0.4 : 1 }}
          />
        </div>

        {isUnlimited && (
          <div style={{
            background: 'rgba(247,147,26,0.05)',
            border: '1px solid rgba(247,147,26,0.1)',
            borderRadius: '8px',
            padding: '10px 12px',
            fontSize: '12px',
            color: '#f7931a',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <span>⚠</span>
            Granting unlimited allowance lets the spender use all your tokens. Only do this for trusted contracts.
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="submit"
            className="btn-btc"
            disabled={!isConnected || loading || !spender || (!isUnlimited && !amount)}
            style={{ padding: '11px 20px', fontSize: '13px' }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="spinner" style={{ width: '14px', height: '14px', borderTopColor: '#000', borderColor: 'rgba(0,0,0,0.2)' }} />
                Approving...
              </span>
            ) : `✓ Approve ${isUnlimited ? '∞' : symbol}`}
          </button>

          <button
            type="button"
            className="btn-danger"
            onClick={handleRevoke}
            disabled={!isConnected || loading || !spender}
            style={{ padding: '11px 20px', fontSize: '13px' }}
          >
            {loading ? 'Revoking...' : '✕ Revoke'}
          </button>
        </div>
      </form>

      {/* Info box */}
      <div style={{
        marginTop: '20px',
        background: '#0a0a0a',
        border: '1px solid #141414',
        borderRadius: '10px',
        padding: '14px',
        fontSize: '12px',
        color: '#333',
        lineHeight: 1.7,
      }}>
        <div style={{ color: '#3b3b3b', fontWeight: 600, marginBottom: '4px' }}>How Approvals Work</div>
        Approvals allow DeFi protocols (DEXes, lending platforms) to move tokens on your behalf. Always verify the contract address before granting allowance. Use "Revoke" (approve 0) to remove access.
      </div>
    </div>
  );
}
