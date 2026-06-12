import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

function fmtBalance(val, decimals = 18) {
  try {
    const n = parseFloat(ethers.formatUnits(val, decimals));
    if (n >= 1e6) return (n / 1e6).toFixed(3) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(3) + 'K';
    return n.toFixed(4);
  } catch { return '—'; }
}

// ── Transfer (direct) ──
function DirectTransfer({ writeContract, readContract, account, isConnected, addToast }) {
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(null);
  const [decimals, setDecimals] = useState(18);
  const [symbol, setSymbol] = useState('BTCS');

  useEffect(() => {
    if (!readContract || !account) return;
    readContract.decimals?.().then(d => setDecimals(Number(d))).catch(() => {});
    readContract.symbol?.().then(s => setSymbol(s)).catch(() => {});
    readContract.balanceOf?.(account).then(b => setBalance(b)).catch(() => {});
  }, [readContract, account]);

  const setMax = () => {
    if (balance !== null) setAmount(ethers.formatUnits(balance, decimals));
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!writeContract || !isConnected) return;
    if (!ethers.isAddress(to)) { addToast('Invalid recipient address.', 'error'); return; }
    if (!amount || isNaN(amount) || Number(amount) <= 0) { addToast('Enter a valid amount.', 'error'); return; }
    setLoading(true);
    try {
      const amountWei = ethers.parseUnits(amount, decimals);
      const tx = await writeContract.transfer(to, amountWei);
      addToast('Transfer submitted! Waiting for confirmation...', 'info', tx.hash);
      await tx.wait();
      addToast(`✓ Transferred ${amount} ${symbol} to ${to.slice(0, 10)}...`, 'success', tx.hash);
      setTo('');
      setAmount('');
      // Refresh balance
      readContract.balanceOf?.(account).then(b => setBalance(b)).catch(() => {});
    } catch (err) {
      const msg = err?.reason || err?.shortMessage || err?.message || 'Transfer failed.';
      addToast(msg.slice(0, 120), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
        <span style={{ fontSize: '20px', color: '#f7931a' }}>⇢</span>
        <div>
          <div style={{ fontWeight: 600, fontSize: '15px' }}>Send BTCS Tokens</div>
          <div style={{ fontSize: '12px', color: '#555' }}>Transfer tokens directly to another address</div>
        </div>
        {balance !== null && (
          <div style={{ marginLeft: 'auto', fontSize: '12px', color: '#444' }}>
            Balance: <span style={{ color: '#888', fontFamily: 'JetBrains Mono, monospace' }}>{fmtBalance(balance, decimals)} {symbol}</span>
          </div>
        )}
      </div>

      <form onSubmit={handleTransfer} style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '520px' }}>
        <div>
          <div className="section-label" style={{ marginBottom: '6px' }}>Recipient Address</div>
          <input
            className="btc-input btc-input-mono"
            type="text"
            placeholder="0x..."
            value={to}
            onChange={e => setTo(e.target.value)}
            disabled={!isConnected || loading}
          />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <div className="section-label">Amount ({symbol})</div>
            {balance !== null && (
              <button
                type="button"
                className="btn-ghost"
                onClick={setMax}
                style={{ fontSize: '11px', padding: '3px 10px' }}
              >
                Max
              </button>
            )}
          </div>
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

        <button
          type="submit"
          className="btn-btc"
          disabled={!isConnected || loading || !to || !amount}
          style={{ padding: '12px', maxWidth: '200px' }}
        >
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <span className="spinner" style={{ width: '15px', height: '15px', borderTopColor: '#000', borderColor: 'rgba(0,0,0,0.2)' }} />
              Sending...
            </span>
          ) : `⇢ Send ${symbol}`}
        </button>
      </form>
    </div>
  );
}

// ── Transfer From ──
function TransferFromSection({ writeContract, readContract, account, isConnected, addToast }) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [decimals, setDecimals] = useState(18);
  const [symbol, setSymbol] = useState('BTCS');

  useEffect(() => {
    if (!readContract) return;
    readContract.decimals?.().then(d => setDecimals(Number(d))).catch(() => {});
    readContract.symbol?.().then(s => setSymbol(s)).catch(() => {});
  }, [readContract]);

  const handleTransferFrom = async (e) => {
    e.preventDefault();
    if (!writeContract || !isConnected) return;
    if (!ethers.isAddress(from)) { addToast('Invalid "from" address.', 'error'); return; }
    if (!ethers.isAddress(to)) { addToast('Invalid "to" address.', 'error'); return; }
    if (!amount || isNaN(amount) || Number(amount) <= 0) { addToast('Enter a valid amount.', 'error'); return; }
    setLoading(true);
    try {
      const amountWei = ethers.parseUnits(amount, decimals);
      const tx = await writeContract.transferFrom(from, to, amountWei);
      addToast('transferFrom submitted! Waiting...', 'info', tx.hash);
      await tx.wait();
      addToast(`✓ Transferred ${amount} ${symbol} from ${from.slice(0, 10)}... to ${to.slice(0, 10)}...`, 'success', tx.hash);
      setFrom('');
      setTo('');
      setAmount('');
    } catch (err) {
      const msg = err?.reason || err?.shortMessage || err?.message || 'transferFrom failed.';
      addToast(msg.slice(0, 120), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: '28px', paddingTop: '24px', borderTop: '1px solid #141414' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
        <span style={{ fontSize: '18px', color: '#3b82f6' }}>⇄</span>
        <div>
          <div style={{ fontWeight: 600, fontSize: '14px' }}>Transfer From (Delegated)</div>
          <div style={{ fontSize: '12px', color: '#555' }}>Use pre-approved allowance to transfer on behalf of another</div>
        </div>
      </div>

      <form onSubmit={handleTransferFrom} style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '520px' }}>
        <div>
          <div className="section-label" style={{ marginBottom: '6px' }}>From Address</div>
          <input
            className="btc-input btc-input-mono"
            type="text"
            placeholder="0x... (token holder who approved you)"
            value={from}
            onChange={e => setFrom(e.target.value)}
            disabled={!isConnected || loading}
          />
        </div>
        <div>
          <div className="section-label" style={{ marginBottom: '6px' }}>To Address</div>
          <input
            className="btc-input btc-input-mono"
            type="text"
            placeholder="0x... (recipient)"
            value={to}
            onChange={e => setTo(e.target.value)}
            disabled={!isConnected || loading}
          />
        </div>
        <div>
          <div className="section-label" style={{ marginBottom: '6px' }}>Amount ({symbol})</div>
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
        <button
          type="submit"
          className="btn-outline"
          disabled={!isConnected || loading || !from || !to || !amount}
          style={{ padding: '11px', maxWidth: '200px' }}
        >
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <span className="spinner" style={{ width: '14px', height: '14px' }} />
              Sending...
            </span>
          ) : '⇄ Transfer From'}
        </button>
      </form>
    </div>
  );
}

export default function TransferForm({ writeContract, readContract, account, isConnected, addToast }) {
  return (
    <div>
      <DirectTransfer
        writeContract={writeContract}
        readContract={readContract}
        account={account}
        isConnected={isConnected}
        addToast={addToast}
      />
      <TransferFromSection
        writeContract={writeContract}
        readContract={readContract}
        account={account}
        isConnected={isConnected}
        addToast={addToast}
      />
    </div>
  );
}
