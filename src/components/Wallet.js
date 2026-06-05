import React, { useState, useEffect, useRef, useCallback } from 'react';
import './Wallet.css';
import { generateWallet, fetchBalance } from '../api/blockchain.api';
import { truncateHash } from '../utils/formatters';
import { POLL_INTERVAL_MS } from '../constants';

const Wallet = ({ onWalletCreated }) => {
  const [wallet, setWallet] = useState(null);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const balanceIntervalRef = useRef(null);

  const handleGenerateWallet = async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await generateWallet();
      setWallet(response);
      setMessage('Wallet created successfully!');
      // Fetch initial balance
      const balanceResponse = await fetchBalance(response.publicKey);
      setBalance(balanceResponse.balance);
      if (onWalletCreated) {
        onWalletCreated(response);
      }
    } catch (err) {
      setMessage(err.message || 'Failed to generate wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefreshBalance = useCallback(async () => {
    if (!wallet) return;
    try {
      const response = await fetchBalance(wallet.publicKey);
      setBalance(response.balance);
    } catch (err) {
      console.error('Failed to fetch balance:', err);
    }
  }, [wallet]);

  // Poll balance every POLL_INTERVAL_MS when wallet exists
  useEffect(() => {
    if (!wallet) {
      if (balanceIntervalRef.current) {
        clearInterval(balanceIntervalRef.current);
        balanceIntervalRef.current = null;
      }
      return;
    }

    // Fetch balance immediately
    handleRefreshBalance();

    // Set up polling interval
    balanceIntervalRef.current = setInterval(() => {
      handleRefreshBalance();
    }, POLL_INTERVAL_MS);

    return () => {
      if (balanceIntervalRef.current) {
        clearInterval(balanceIntervalRef.current);
        balanceIntervalRef.current = null;
      }
    };
  }, [wallet, handleRefreshBalance]);

  const handleImportWallet = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (!imported.publicKey || !imported.privateKey) {
          setMessage('Invalid wallet file format');
          return;
        }
        setWallet(imported);
        setMessage('Wallet imported successfully!');
        setTimeout(() => {
          handleRefreshBalance();
          if (onWalletCreated) {
            onWalletCreated(imported);
          }
        }, 100);
      } catch (err) {
        setMessage('Failed to import wallet: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleExportWallet = () => {
    if (!wallet) return;
    const dataStr = JSON.stringify(wallet, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'wallet.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="wallet-container">
      <div className="wallet-panel">
        <h2 className="wallet-title">Cryptographic Wallet</h2>

        {!wallet ? (
          <div className="wallet-setup">
            <p className="wallet-description">
              Generate a new secp256k1 key pair for transaction signing.
            </p>
            <button
              onClick={handleGenerateWallet}
              disabled={loading}
              className="generate-button"
            >
              {loading ? 'Generating...' : 'Generate Wallet'}
            </button>
          </div>
        ) : (
          <div className="wallet-display">
            <div className="key-section">
              <label className="key-label">Public Key (Wallet Address)</label>
              <div className="key-display">
                <code className="key-value">{truncateHash(wallet.publicKey, 16)}</code>
                <button
                  onClick={() => handleCopyToClipboard(wallet.publicKey, 'public')}
                  className="copy-button"
                  title="Copy full key"
                >
                  {copied ? '✓' : '📋'}
                </button>
              </div>
              <div className="full-key">
                <small>{wallet.publicKey}</small>
              </div>
            </div>

            <div className="key-section">
              <label className="key-label">Private Key</label>
              <div className="key-warning">
                ⚠️ Never share your private key with anyone!
              </div>
              <button
                onClick={() => setShowPrivateKey(!showPrivateKey)}
                className="toggle-key-button"
              >
                {showPrivateKey ? 'Hide' : 'Show'} Private Key
              </button>
              {showPrivateKey && (
                <div className="key-display">
                  <code className="key-value private-key">
                    {truncateHash(wallet.privateKey, 16)}
                  </code>
                  <button
                    onClick={() => handleCopyToClipboard(wallet.privateKey, 'private')}
                    className="copy-button"
                    title="Copy full key"
                  >
                    {copied ? '✓' : '📋'}
                  </button>
                </div>
              )}
              {showPrivateKey && (
                <div className="full-key">
                  <small>{wallet.privateKey}</small>
                </div>
              )}
            </div>

            <div className="balance-section">
              <div className="balance-display">
                <label className="balance-label">Balance</label>
                <div className="balance-amount">
                  {balance !== null ? `${balance} units` : 'Loading...'}
                </div>
              </div>
              <button
                onClick={handleRefreshBalance}
                className="refresh-button"
              >
                🔄 Refresh
              </button>
            </div>

            <div className="wallet-actions">
              <button
                onClick={handleExportWallet}
                className="action-button export-button"
              >
                📥 Export Wallet
              </button>
              <label className="action-button import-button">
                📤 Import Wallet
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportWallet}
                  style={{ display: 'none' }}
                />
              </label>
              <button
                onClick={() => {
                  setWallet(null);
                  setBalance(null);
                  setShowPrivateKey(false);
                }}
                className="action-button reset-button"
              >
                🔄 New Wallet
              </button>
            </div>
          </div>
        )}

        {message && (
          <div className={`wallet-message ${message.includes('success') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wallet;