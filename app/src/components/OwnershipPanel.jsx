import React, { useState } from 'react';
import { ethers } from 'ethers';

export default function OwnershipPanel({ writeContract, isConnected, ownerAddress, addToast }) {
  const [newOwner, setNewOwner] = useState('');
  const [loadingTransfer, setLoadingTransfer] = useState(false);
  const [loadingRenounce, setLoadingRenounce] = useState(false);
  const [confirmRenounce, setConfirmRenounce] = useState(false);

  const handleTransferOwnership = async (e) => {
    e.preventDefault();
    if (!writeContract || !isConnected) return;
    if (!ethers.isAddress(newOwner)) { addToast('Invalid new owner address.', 'error'); return; }
    if (newOwner.toLowerCase() === ownerAddress?.toLowerCase()) {
      addToast('New owner cannot be the same as current owner.', 'warning');
      return;
    }
    setLoadingTransfer(true);
    try {
      const tx = await writeContract.transferOwnership(newOwner);
      addToast('Ownership transfer submitted! Waiting...', 'info', tx.hash);
      await tx.wait();
      addToast(`✓ Ownership transferred to ${newOwner.slice(0, 10)}...`, 'success', tx.hash);
      setNewOwner('');
    } catch (err) {
      const msg = err?.reason || err?.shortMessage || err?.message || 'Transfer failed.';
      addToast(msg.slice(0, 120), 'error');
    } finally {
      setLoadingTransfer(false);
    }
  };

  const handleRenounce = async () => {
    if (!writeContract || !isConnected) return;
    if (!confirmRenounce) {
      setConfirmRenounce(true);
      addToast('⚠ Are you sure? Click Renounce again to confirm. This is IRREVERSIBLE.', 'warning');
      setTimeout(() => setConfirmRenounce(false), 8000);
      return;
    }
    setLoadingRenounce(true);
    try {
      const tx = await writeContract.renounceOwnership();
      addToast('Renounce submitted! Waiting...', 'info', tx.hash);
      await tx.wait();
      addToast('✓ Ownership renounced. Contract is now ownerless.', 'success', tx.hash);
      setConfirmRenounce(false);
    } catch (err) {
      const msg = err?.reason || err?.shortMessage || err?.message || 'Renounce failed.';
      addToast(msg.slice(0, 120), 'error');
    } finally {
      setLoadingRenounce(false);
    }
  };

  return (
    <div>
      {/* Current Owner */}
      <div style={{
        background: '#0a0a0a',
        border: '1px solid #1a1a1a',
        borderRadius: '10px',
        padding: '14px 16px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: '14px' }}>👑</span>
        <div>
          <div style={{ fontSize: '11px', color: '#444', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>
            Current Owner
          </div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12.5px', color: '#888', wordBreak: 'break-all' }}>
            {ownerAddress || '—'}
          </div>
        </div>
      </div>

      {/* Transfer Ownership */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '6px' }}>Transfer Ownership</div>
        <div style={{ fontSize: '12px', color: '#555', marginBottom: '14px' }}>
          Assign contract ownership to a new address. The new owner will have full control.
        </div>
        <form onSubmit={handleTransferOwnership} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input
            className="btc-input btc-input-mono"
            type="text"
            placeholder="0x... (new owner address)"
            value={newOwner}
            onChange={e => setNewOwner(e.target.value)}
            disabled={!isConnected || loadingTransfer}
            style={{ flex: 1, minWidth: '240px' }}
          />
          <button
            type="submit"
            className="btn-outline"
            disabled={!isConnected || loadingTransfer || !newOwner}
            style={{ padding: '10px 18px', fontSize: '13px', flexShrink: 0 }}
          >
            {loadingTransfer ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="spinner" style={{ width: '13px', height: '13px' }} />
                Transferring...
              </span>
            ) : '⚙ Transfer'}
          </button>
        </form>
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px solid #141414', marginBottom: '24px' }} />

      {/* Renounce Ownership */}
      <div>
        <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '6px', color: '#ef4444' }}>
          Renounce Ownership
        </div>
        <div style={{ fontSize: '12px', color: '#555', marginBottom: '14px', lineHeight: 1.7 }}>
          Permanently remove the owner. The contract will have no owner and owner-only functions (like minting) will be permanently disabled. <strong style={{ color: '#ef4444' }}>This action is irreversible.</strong>
        </div>

        <button
          type="button"
          className="btn-danger"
          onClick={handleRenounce}
          disabled={!isConnected || loadingRenounce}
          style={{ padding: '11px 20px', fontSize: '13px' }}
        >
          {loadingRenounce ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="spinner" style={{ width: '14px', height: '14px', borderTopColor: '#ef4444', borderColor: 'rgba(239,68,68,0.2)' }} />
              Renouncing...
            </span>
          ) : confirmRenounce ? (
            '⚠ Confirm Renounce (Irreversible)'
          ) : (
            '⚠ Renounce Ownership'
          )}
        </button>

        {confirmRenounce && (
          <div style={{
            marginTop: '10px',
            background: 'rgba(239,68,68,0.06)',
            border: '1px solid rgba(239,68,68,0.15)',
            borderRadius: '8px',
            padding: '10px 12px',
            fontSize: '12px',
            color: '#ef4444',
          }}>
            Click the button again within 8 seconds to confirm. This will permanently disable all owner-only functions.
          </div>
        )}
      </div>
    </div>
  );
}
