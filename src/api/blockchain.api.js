import client from './client';
import ENDPOINTS from './endpoints';

export const fetchChain = () => client.get(ENDPOINTS.CHAIN);

export const fetchChainValidity = () => client.get(ENDPOINTS.CHAIN_VALID);

export const fetchStats = () => client.get(ENDPOINTS.STATS);

export const fetchPendingTransactions = () =>
  client.get(ENDPOINTS.TRANSACTIONS_PENDING);

export const fetchAllTransactions = () =>
  client.get(ENDPOINTS.TRANSACTIONS_ALL);

export const addTransaction = (fromAddress, toAddress, amount) =>
  client.post(ENDPOINTS.TRANSACTIONS, { fromAddress, toAddress, amount });

export const mineBlock = (miningRewardAddress = 'miner1') =>
  client.post(ENDPOINTS.MINE, { miningRewardAddress });

export const fetchBalance = (address) =>
  client.get(ENDPOINTS.balance(address));

/**
 * Generate a new cryptographic wallet (secp256k1 key pair)
 * @returns {Promise} Response with { publicKey, privateKey } in hex format
 */
export const generateWallet = () =>
  client.post(ENDPOINTS.WALLETS);

/**
 * Sign and submit a transaction with a private key
 * @param {string} fromAddress - Public key (wallet address)
 * @param {string} toAddress - Recipient wallet address
 * @param {number} amount - Transaction amount
 * @param {string} privateKeyHex - Private key in hex format
 * @returns {Promise} Response with signed transaction details
 */
export const signTransaction = (fromAddress, toAddress, amount, privateKeyHex) =>
  client.post(ENDPOINTS.SIGN, { fromAddress, toAddress, amount, privateKeyHex });

export const fetchDashboard = () =>
  Promise.all([fetchChain(), fetchStats()]).then(([chainData, statsData]) => ({
    chainData,
    statsData,
  }));
