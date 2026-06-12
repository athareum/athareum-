import React, { useState, useRef, useCallback } from 'react';
import { ethers } from 'ethers';
import Header from 'components/Header.jsx';
import TokenStats from 'components/TokenStats.jsx';
import TransferForm from 'components/TransferForm.jsx';
import ApproveForm from 'components/ApproveForm.jsx';
import AllowanceChecker from 'components/AllowanceChecker.jsx';
import MintSection from 'components/MintSection.jsx';
import OwnershipPanel from 'components/OwnershipPanel.jsx';
import Toast from 'components/Toast.jsx';

const CONTRACT_ADDRESS = '0x11eBbdF5637B40B2345Dde1FD44fAa068ff23027';
const TARGET_CHAIN_ID = 11155111;

const ABI = [
  { inputs: [], stateMutability: 'nonpayable', type: 'constructor' },
  { inputs: [{ internalType: 'address', name: 'owner', type: 'address' }, { internalType: 'address', name: 'spender', type: 'address' }], name: 'allowance', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ internalType: 'address', name: 'spender', type: 'address' }, { internalType: 'uint256', name: 'value', type: 'uint256' }], name: 'approve', outputs: [{ internalType: 'bool', name: '', type: 'bool' }], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ internalType: 'address', name: 'account', type: 'address' }], name: 'balanceOf', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'decimals', outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'getLatestBTCPrice', outputs: [{ internalType: 'int256', name: '', type: 'int256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ internalType: 'uint256', name: 'amount', type: 'uint256' }], name: 'getValueInUSD', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ internalType: 'address', name: 'to', type: 'address' }, { internalType: 'uint256', name: 'amount', type: 'uint256' }], name: 'mint', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [], name: 'name', outputs: [{ internalType: 'string', name: '', type: 'string' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'owner', outputs: [{ internalType: 'address', name: '', type: 'address' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'renounceOwnership', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [], name: 'symbol', outputs: [{ internalType: 'string', name: '', type: 'string' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'totalSupply', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ internalType: 'address', name: 'to', type: 'address' }, { internalType: 'uint256', name: 'value', type: 'uint256' }], name: 'transfer', outputs: [{ internalType: 'bool', name: '', type: 'bool' }], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ internalType: 'address', name: 'from', type: 'address' }, { internalType: 'address', name: 'to', type: 'address' }, { internalType: 'uint256', name: 'value', type: 'uint256' }], name: 'transferFrom', outputs: [{ internalType: 'bool', name: '', type: 'bool' }], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ internalType: 'address', name: 'newOwner', type: 'address' }], name: 'transferOwnership', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { anonymous: false, inputs: [{ indexed: true, internalType: 'address', name: 'owner', type: 'address' }, { indexed: true, internalType: 'address', name: 'spender', type: 'address' }, { indexed: false, internalType: 'uint256', name: 'value', type: 'uint256' }], name: 'Approval', type: 'event' },
  { anonymous: false, inputs: [{ indexed: true, internalType: 'address', name: 'previousOwner', type: 'address' }, { indexed: true, internalType: 'address', name: 'newOwner', type: 'address' }], name: 'OwnershipTransferred', type: 'event' },
  { anonymous: false, inputs: [{ indexed: true, internalType: 'address', name: 'from', type: 'address' }, { indexed: true, internalType: 'address', name: 'to', type: 'address' }, { indexed: false, internalType: 'uint256', name: 'value', type: 'uint256' }], name: 'Transfer', type: 'event' },
];

let toastIdCounter = 0;

// ── Tab definitions ──
const TABS = [
  { id: 'transfer',  label: 'Transfer',   icon: '⇢' },
  { id: 'approve',   label: 'Approve',    icon: '✓' },
  { id: 'allowance', label: 'Allowance',  icon: '⊙' },
];

export default function App() {
  const config = window.__QUICK_DAPP_CONFIG__ || {};

  const [account, setAccount]           = useState(null);
  const [chainId, setChainId]           = useState(null);
  const [readContract, setReadContract] = useState(null);
  const [writeContract, setWriteContract] = useState(null);
  const [isOwner, setIsOwner]           = useState(false);
  const [ownerAddress, setOwnerAddress] = useState('');
  const [toasts, setToasts]             = useState([]);
  const [connecting, setConnecting]     = useState(false);
  const [activeTab, setActiveTab]       = useState('transfer');
  const rawProviderRef = useRef(null);

  const addToast = useCallback((message, type = 'info', txHash = null) => {
    const id = ++toastIdCounter;
    setToasts(prev => [...prev, { id, message, type, txHash }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const setupContracts = useCallback(async (ethersProvider, userAccount) => {
    try {
      const readC = new ethers.Contract(CONTRACT_ADDRESS, ABI, ethersProvider);
      setReadContract(readC);
      const signer = await ethersProvider.getSigner();
      const writeC = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
      setWriteContract(writeC);
      try {
        const ownerAddr = await readC.owner();
        setOwnerAddress(ownerAddr);
        setIsOwner(ownerAddr.toLowerCase() === userAccount.toLowerCase());
      } catch {
        setOwnerAddress('');
        setIsOwner(false);
      }
    } catch {
      addToast('Failed to setup contract connection.', 'error');
    }
  }, [addToast]);

  const connectWallet = async () => {
    setConnecting(true);
    try {
      const rawProvider = window.__qdapp_getProvider
        ? await window.__qdapp_getProvider()
        : window.ethereum;

      if (!rawProvider) {
        addToast('No wallet detected. Please install MetaMask or Brave Wallet.', 'error');
        return;
      }
      rawProviderRef.current = rawProvider;

      const accounts = await rawProvider.request({ method: 'eth_requestAccounts' });
      if (!accounts?.length) { addToast('No accounts found.', 'error'); return; }

      const userAccount = accounts[0];
      const chainHex = await rawProvider.request({ method: 'eth_chainId' });
      const currentChainId = parseInt(chainHex, 16);

      setAccount(userAccount);
      setChainId(currentChainId);

      if (currentChainId !== TARGET_CHAIN_ID) {
        addToast('Wrong network! Switching to Sepolia...', 'warning');
        try {
          await rawProvider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xaa36a7' }],
          });
        } catch (switchErr) {
          if (switchErr.code === 4902) {
            addToast('Please add Sepolia network to your wallet.', 'error');
          } else {
            addToast('Failed to switch network. Please switch to Sepolia manually.', 'error');
          }
          return;
        }
      }

      const ethersProvider = new ethers.BrowserProvider(rawProvider);
      await setupContracts(ethersProvider, userAccount);
      addToast('Wallet connected!', 'success');

      rawProvider.on('accountsChanged', (newAccounts) => {
        if (!newAccounts.length) {
          handleDisconnect();
        } else {
          setAccount(newAccounts[0]);
          const p = new ethers.BrowserProvider(rawProvider);
          setupContracts(p, newAccounts[0]);
        }
      });

      rawProvider.on('chainChanged', (newChainHex) => {
        const newChain = parseInt(newChainHex, 16);
        setChainId(newChain);
        if (newChain !== TARGET_CHAIN_ID) {
          addToast('Network changed. Please switch back to Sepolia.', 'warning');
          setReadContract(null);
          setWriteContract(null);
        } else {
          const p = new ethers.BrowserProvider(rawProvider);
          setupContracts(p, userAccount);
        }
      });
    } catch (err) {
      if (err.code === 4001) {
        addToast('Connection rejected.', 'error');
      } else {
        addToast(err.message || 'Failed to connect wallet.', 'error');
      }
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setAccount(null);
    setChainId(null);
    setReadContract(null);
    setWriteContract(null);
    setIsOwner(false);
    setOwnerAddress('');
    if (rawProviderRef.current?.removeAllListeners) {
      rawProviderRef.current.removeAllListeners();
    }
    addToast('Wallet disconnected.', 'info');
  };

  const handleSwitchNetwork = async () => {
    const rawProvider = rawProviderRef.current;
    if (!rawProvider) return;
    try {
      await rawProvider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }],
      });
    } catch (err) {
      addToast('Failed to switch network.', 'error');
    }
  };

  const isConnected = !!account && chainId === TARGET_CHAIN_ID;
  const isWrongNetwork = !!account && chainId !== TARGET_CHAIN_ID;

  // ── Tab content renderer ──
  const renderTabContent = () => {
    switch (activeTab) {
      case 'transfer':
        return (
          <TransferForm
            writeContract={writeContract}
            readContract={readContract}
            account={account}
            isConnected={isConnected}
            addToast={addToast}
          />
        );
      case 'approve':
        return (
          <ApproveForm
            writeContract={writeContract}
            isConnected={isConnected}
            addToast={addToast}
          />
        );
      case 'allowance':
        return (
          <AllowanceChecker
            readContract={readContract}
            account={account}
            isConnected={isConnected}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#080808' }}>
      <Header
        account={account}
        chainId={chainId}
        targetChainId={TARGET_CHAIN_ID}
        onConnect={connectWallet}
        onDisconnect={handleDisconnect}
        onSwitchNetwork={handleSwitchNetwork}
        connecting={connecting}
        config={config}
      />

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '28px 20px 80px' }}>

        {/* ── Wrong Network Banner ── */}
        {isWrongNetwork && (
          <div style={{
            background: 'rgba(245,158,11,0.06)',
            border: '1px solid rgba(245,158,11,0.15)',
            borderRadius: '12px',
            padding: '14px 18px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
          }}>
            <span style={{ fontSize: '13.5px', color: '#f59e0b' }}>
              ⚠ You're on the wrong network. Please switch to Sepolia testnet.
            </span>
            <button
              className="btn-btc"
              onClick={handleSwitchNetwork}
              style={{ padding: '8px 16px', fontSize: '12.5px' }}
            >
              Switch to Sepolia
            </button>
          </div>
        )}

        {/* ── Connect Prompt ── */}
        {!account && (
          <div style={{
            background: '#0d0d0d',
            border: '1px solid #181818',
            borderRadius: '16px',
            padding: '48px 32px',
            textAlign: 'center',
            marginBottom: '28px',
          }}>
            <div style={{
              width: '64px', height: '64px',
              background: 'linear-gradient(135deg, #f7931a, #e07b0a)',
              borderRadius: '18px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '30px', fontWeight: 900, color: '#000',
              margin: '0 auto 20px',
              boxShadow: '0 0 40px rgba(247,147,26,0.2)',
            }}>₿</div>
            <div style={{ fontSize: '22px', fontWeight: 700, marginBottom: '10px', letterSpacing: '-0.02em' }}>
              <span className="btc-gradient">BTCS Token Dashboard</span>
            </div>
            <div style={{ fontSize: '14px', color: '#555', marginBottom: '28px', maxWidth: '380px', margin: '0 auto 28px', lineHeight: 1.7 }}>
              A Bitcoin-pegged ERC20 token with live Chainlink price feeds on Sepolia testnet.
            </div>
            <button
              className="btn-btc"
              onClick={connectWallet}
              disabled={connecting}
              style={{ padding: '12px 28px', fontSize: '14px' }}
            >
              {connecting ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="spinner" style={{ width: '15px', height: '15px', borderTopColor: '#000', borderColor: 'rgba(0,0,0,0.2)' }} />
                  Connecting...
                </span>
              ) : '🔗 Connect Wallet'}
            </button>
            <div style={{ marginTop: '14px', fontSize: '12px', color: '#2a2a2a' }}>
              Sepolia Testnet · Chain ID 11155111
            </div>
          </div>
        )}

        {/* ── Stats Section ── */}
        <TokenStats
          readContract={readContract}
          account={account}
          isConnected={isConnected}
        />

        {/* ── Main Action Panel ── */}
        {isConnected && (
          <div className="glass-card" style={{ marginTop: '20px', overflow: 'hidden' }}>
            {/* Tab Bar */}
            <div style={{
              display: 'flex',
              borderBottom: '1px solid #141414',
              padding: '0 4px',
            }}>
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    borderBottom: activeTab === tab.id ? '2px solid #f7931a' : '2px solid transparent',
                    color: activeTab === tab.id ? '#f7931a' : '#444',
                    fontWeight: activeTab === tab.id ? 600 : 400,
                    fontSize: '13.5px',
                    padding: '14px 20px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                    transition: 'color 0.2s',
                    fontFamily: 'Inter, sans-serif',
                    marginBottom: '-1px',
                  }}
                  onMouseEnter={e => { if (activeTab !== tab.id) e.currentTarget.style.color = '#888'; }}
                  onMouseLeave={e => { if (activeTab !== tab.id) e.currentTarget.style.color = '#444'; }}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div style={{ padding: '24px' }}>
              {renderTabContent()}
            </div>
          </div>
        )}

        {/* ── Owner Panel ── */}
        {isConnected && isOwner && (
          <div className="glass-card owner-panel" style={{ marginTop: '20px', overflow: 'hidden' }}>
            {/* Owner Badge Header */}
            <div style={{
              padding: '16px 24px',
              borderBottom: '1px solid rgba(247,147,26,0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              <span style={{ fontSize: '16px' }}>👑</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '15px', color: '#f7931a' }}>Owner Controls</div>
                <div style={{ fontSize: '12px', color: '#444' }}>You are the contract owner — exclusive functions below</div>
              </div>
              <span className="badge badge-btc" style={{ marginLeft: 'auto' }}>OWNER</span>
            </div>

            {/* Owner Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #141414', padding: '0 4px' }}>
              {[
                { id: 'mint', label: 'Mint', icon: '⊕' },
                { id: 'ownership', label: 'Ownership', icon: '⚙' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    borderBottom: activeTab === tab.id ? '2px solid #f7931a' : '2px solid transparent',
                    color: activeTab === tab.id ? '#f7931a' : '#444',
                    fontWeight: activeTab === tab.id ? 600 : 400,
                    fontSize: '13.5px',
                    padding: '12px 18px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                    transition: 'color 0.2s',
                    fontFamily: 'Inter, sans-serif',
                    marginBottom: '-1px',
                  }}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            <div style={{ padding: '24px' }}>
              {activeTab === 'mint' && (
                <MintSection
                  writeContract={writeContract}
                  isConnected={isConnected}
                  addToast={addToast}
                />
              )}
              {activeTab === 'ownership' && (
                <OwnershipPanel
                  writeContract={writeContract}
                  isConnected={isConnected}
                  ownerAddress={ownerAddress}
                  addToast={addToast}
                />
              )}
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <div style={{
          marginTop: '40px',
          textAlign: 'center',
          fontSize: '12px',
          color: '#222',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          flexWrap: 'wrap',
        }}>
          <span>BTCS Token</span>
          <span>·</span>
          <a
            href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#333', textDecoration: 'none' }}
            onMouseEnter={e => e.target.style.color = '#f7931a'}
            onMouseLeave={e => e.target.style.color = '#333'}
          >
            View on Etherscan ↗
          </a>
          <span>·</span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            {CONTRACT_ADDRESS.slice(0, 10)}...{CONTRACT_ADDRESS.slice(-6)}
          </span>
        </div>
      </main>

      {/* ── Toast Notifications ── */}
      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
