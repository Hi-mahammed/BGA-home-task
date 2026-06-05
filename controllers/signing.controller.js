const crypto = require('crypto');
const { blockchain, Transaction, persistenceService } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');
const { isValidAddress, isValidAmount, sanitizeAddress, sanitizeAmount } = require('../utils/validator');
const { saveBlockchainState } = require('../utils/persistence-helper');
const logger = require('../utils/logger');

/**
 * Sign and add a transaction to the blockchain.
 * The client provides the transaction details and the private key to sign with.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
const signAndAddTransaction = (req, res, next) => {
  try {
    const { fromAddress, toAddress, amount, privateKeyHex } = req.body;

    // Validate input
    if (!isValidAddress(fromAddress) || !isValidAddress(toAddress)) {
      return sendError(res, 'Invalid wallet address format', 400);
    }

    if (!isValidAmount(amount)) {
      return sendError(res, 'Amount must be a positive number', 400);
    }

    if (!privateKeyHex || typeof privateKeyHex !== 'string') {
      return sendError(res, 'Private key is required', 400);
    }

    // Recreate the private key object from hex
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

    // Create transaction
    const transaction = new Transaction(
      sanitizeAddress(fromAddress),
      sanitizeAddress(toAddress),
      sanitizeAmount(amount)
    );

    // Sign the transaction
    try {
      transaction.signTransaction(privateKey);
    } catch (err) {
      return sendError(res, err.message, 400);
    }

    // Add to blockchain
    try {
      blockchain.addTransaction(transaction);
    } catch (err) {
      return sendError(res, err.message, 400);
    }

    // Persist blockchain state after adding signed transaction
    saveBlockchainState(blockchain, persistenceService, 'signing transaction');

    logger.info(`Transaction signed and added: ${transaction.calculateHash()}`);

    sendSuccess(res, {
      message: 'Transaction signed and added to pending pool',
      transaction: {
        fromAddress: transaction.fromAddress,
        toAddress: transaction.toAddress,
        amount: transaction.amount,
        timestamp: transaction.timestamp,
        signature: transaction.signature,
      },
    }, 201);
  } catch (err) {
    next(err);
  }
};

module.exports = { signAndAddTransaction };
