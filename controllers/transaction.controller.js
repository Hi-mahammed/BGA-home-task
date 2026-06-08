const crypto = require('crypto');
const { blockchain, Transaction, persistenceService } = require('../models');
const { sendSuccess, sendCreated, sendError } = require('../utils/response');
const { isValidAddress, isValidAmount, sanitizeAddress, sanitizeAmount } = require('../utils/validator');
const { saveBlockchainState } = require('../utils/persistence-helper');
const logger = require('../utils/logger');

/**
 * Process a transaction: add unsigned or sign and add with private key.
 * If privateKeyHex is provided, signs the transaction before adding.
 * If not provided, adds the unsigned transaction (will be validated on chain).
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
const processTransaction = (req, res, next) => {
  try {
    const { fromAddress, toAddress, amount, privateKeyHex } = req.body;

    // Validate addresses and amount
    if (!isValidAddress(fromAddress) || !isValidAddress(toAddress)) {
      return sendError(res, 'Invalid wallet address format', 400);
    }

    if (!isValidAmount(amount)) {
      return sendError(res, 'Amount must be a positive number', 400);
    }

    // Create transaction
    const transaction = new Transaction(
      sanitizeAddress(fromAddress),
      sanitizeAddress(toAddress),
      sanitizeAmount(amount)
    );

    // Sign if private key provided
    if (privateKeyHex) {
      if (typeof privateKeyHex !== 'string') {
        return sendError(res, 'Private key must be a string', 400);
      }

      // Recreate private key from hex
      let privateKey;
      try {
        const privateKeyBuffer = Buffer.from(privateKeyHex, 'hex');
        privateKey = crypto.createPrivateKey({
          key: privateKeyBuffer,
          format: 'der',
          type: 'pkcs8',
        });
      } catch (err) {
        return sendError(res, 'Invalid private key format', 400);
      }

      // Sign the transaction
      try {
        transaction.signTransaction(privateKey);
        logger.info(`Transaction signed: ${transaction.calculateHash()}`);
      } catch (err) {
        return sendError(res, err.message, 400);
      }
    }

    // Add to blockchain
    try {
      blockchain.addTransaction(transaction);
    } catch (err) {
      return sendError(res, err.message, 400);
    }

    // Persist state
    const operation = privateKeyHex ? 'signing transaction' : 'adding transaction';
    saveBlockchainState(blockchain, persistenceService, operation);

    // Return response
    const statusCode = privateKeyHex ? 201 : 201;
    const message = privateKeyHex
      ? 'Transaction signed and added to pending pool'
      : 'Transaction added to pending pool';

    const txResponse = privateKeyHex
      ? {
          fromAddress: transaction.fromAddress,
          toAddress: transaction.toAddress,
          amount: transaction.amount,
          timestamp: transaction.timestamp,
          signature: transaction.signature,
        }
      : transaction;

    sendSuccess(res, { message, transaction: txResponse }, statusCode);
  } catch (err) {
    next(err);
  }
};

const getPendingTransactions = (req, res) => {
  sendSuccess(res, {
    pendingTransactions: blockchain.pendingTransactions,
    count: blockchain.pendingTransactions.length,
  });
};

const getAllTransactions = (req, res) => {
  const transactions = blockchain.getAllTransactions();
  sendSuccess(res, { transactions, count: transactions.length });
};

module.exports = { processTransaction, getPendingTransactions, getAllTransactions };
