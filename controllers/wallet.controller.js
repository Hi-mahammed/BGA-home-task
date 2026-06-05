const crypto = require('crypto');
const { sendCreated, sendError } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Generate a new cryptographic key pair for wallet creation.
 * Uses secp256k1 curve for Ethereum-compatible key generation.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
const generateWallet = (req, res, next) => {
  try {
    // Generate EC key pair with secp256k1 curve
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
      namedCurve: 'secp256k1',
      publicKeyEncoding: {
        type: 'spki',
        format: 'der',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'der',
      },
    });

    // Convert keys to hex strings for serialization
    const publicKeyHex = publicKey.toString('hex');
    const privateKeyHex = privateKey.toString('hex');

    logger.debug(`Generated new wallet with address: ${publicKeyHex.substring(0, 16)}...`);

    sendCreated(res, {
      message: 'Wallet created successfully',
      publicKey: publicKeyHex,
      privateKey: privateKeyHex,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { generateWallet };
