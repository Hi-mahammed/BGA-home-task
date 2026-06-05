import React, { useState, useCallback } from 'react';
import './TransactionForm.css';
import { signTransaction, fetchBalance } from '../api/blockchain.api';

const TransactionForm = ({ wallet, onTransactionAdded }) => {
  const [formData, setFormData] = useState({
    toAddress: '',
    amount: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleTransactionSuccess = useCallback(async () => {
    setMessage('Transaction signed and submitted successfully!');
    setFormData({ toAddress: '', amount: '' });

    // Refresh wallet balance
    if (wallet?.publicKey) {
      try {
        await fetchBalance(wallet.publicKey);
      } catch (err) {
        console.error('Failed to refresh balance:', err);
      }
    }

    // Trigger parent refresh
    if (onTransactionAdded) {
      onTransactionAdded();
    }
  }, [wallet, onTransactionAdded]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (!wallet) {
      setMessage('No wallet available. Please create a wallet first.');
      setLoading(false);
      return;
    }

    if (!wallet.privateKey) {
      setMessage('Private key is not available. Please check your wallet.');
      setLoading(false);
      return;
    }

    try {
      await signTransaction(
        wallet.publicKey,
        formData.toAddress,
        formData.amount,
        wallet.privateKey
      );
      await handleTransactionSuccess();
    } catch (err) {
      setMessage(err.message || 'Failed to sign and submit transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="transaction-form">
      <h2 className="panel-title">Sign & Send Transaction</h2>

      {!wallet ? (
        <div className="no-wallet-message">
          <p>⚠️ No wallet available. Create a wallet first to sign transactions.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="fromAddress">From Address (Your Wallet)</label>
            <input
              type="text"
              id="fromAddress"
              disabled
              value={wallet.publicKey.slice(0, 32) + '...'}
              className="form-input-disabled"
            />
            <small className="form-hint">Automatically filled from your wallet</small>
          </div>

          <div className="form-group">
            <label htmlFor="toAddress">To Address</label>
            <input
              type="text"
              id="toAddress"
              name="toAddress"
              value={formData.toAddress}
              onChange={handleChange}
              placeholder="Enter recipient's public key"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="amount">Amount</label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="e.g., 100"
              step="0.01"
              min="0"
              required
            />
          </div>

          {message && (
            <div className={`form-message ${message.includes('success') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}

          <button type="submit" className="submit-button" disabled={loading || !wallet}>
            {loading ? 'Signing & Sending...' : 'Sign & Send Transaction'}
          </button>
        </form>
      )}
    </div>
  );
};

export default TransactionForm;
