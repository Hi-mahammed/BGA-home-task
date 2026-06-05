const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

/**
 * Blockchain persistence service for saving and loading blockchain state to/from disk.
 * 
 * Storage format (blockchain.json):
 * {
 *   "chain": [
 *     {
 *       "timestamp": number,
 *       "transactions": [
 *         {
 *           "fromAddress": string,
 *           "toAddress": string,
 *           "amount": number,
 *           "timestamp": number,
 *           "signature": string
 *         }
 *       ],
 *       "previousHash": string,
 *       "nonce": number,
 *       "hash": string
 *     }
 *   ],
 *   "pendingTransactions": [transaction objects],
 *   "difficulty": number,
 *   "miningReward": number
 * }
 */

const PERSISTENCE_FILE = path.join(__dirname, '..', 'blockchain.json');

/**
 * Serialize blockchain to a JSON-compatible object.
 * @param {Blockchain} blockchain - The blockchain instance to serialize
 * @returns {Object} Serialized blockchain state
 */
const serializeBlockchain = (blockchain) => {
  return {
    chain: blockchain.chain.map((block) => ({
      timestamp: block.timestamp,
      transactions: block.transactions.map((tx) => ({
        fromAddress: tx.fromAddress,
        toAddress: tx.toAddress,
        amount: tx.amount,
        timestamp: tx.timestamp,
        signature: tx.signature,
      })),
      previousHash: block.previousHash,
      nonce: block.nonce,
      hash: block.hash,
    })),
    pendingTransactions: blockchain.pendingTransactions.map((tx) => ({
      fromAddress: tx.fromAddress,
      toAddress: tx.toAddress,
      amount: tx.amount,
      timestamp: tx.timestamp,
      signature: tx.signature,
    })),
    difficulty: blockchain.difficulty,
    miningReward: blockchain.miningReward,
  };
};

/**
 * Deserialize a blockchain from saved JSON state.
 * @param {Object} data - The parsed blockchain data
 * @param {Blockchain} blockchainClass - The Blockchain class
 * @param {Transaction} transactionClass - The Transaction class
 * @param {Block} blockClass - The Block class
 * @returns {Blockchain} Reconstructed blockchain instance
 */
const deserializeBlockchain = (data, { Blockchain, Block, Transaction }) => {
  const blockchain = new Blockchain(data.difficulty, data.miningReward);

  // Reconstruct chain (skip genesis, it's created in constructor)
  blockchain.chain = data.chain.map((blockData) => {
    const transactions = blockData.transactions.map((txData) => {
      const tx = new Transaction(txData.fromAddress, txData.toAddress, txData.amount);
      tx.timestamp = txData.timestamp;
      tx.signature = txData.signature;
      return tx;
    });

    const block = new Block(blockData.timestamp, transactions, blockData.previousHash);
    block.nonce = blockData.nonce;
    block.hash = blockData.hash;
    return block;
  });

  // Restore pending transactions
  blockchain.pendingTransactions = data.pendingTransactions.map((txData) => {
    const tx = new Transaction(txData.fromAddress, txData.toAddress, txData.amount);
    tx.timestamp = txData.timestamp;
    tx.signature = txData.signature;
    return tx;
  });

  return blockchain;
};

/**
 * Save blockchain state to disk as JSON.
 * @param {Blockchain} blockchain - The blockchain instance to save
 * @returns {boolean} True if save was successful, false otherwise
 */
const save = (blockchain) => {
  try {
    const data = serializeBlockchain(blockchain);
    fs.writeFileSync(PERSISTENCE_FILE, JSON.stringify(data, null, 2), 'utf8');
    logger.debug(`Blockchain persisted to disk (${blockchain.chain.length} blocks, ${blockchain.pendingTransactions.length} pending)`);
    return true;
  } catch (err) {
    logger.error(`Failed to persist blockchain: ${err.message}`);
    return false;
  }
};

/**
 * Load blockchain state from disk.
 * @param {Object} classes - Object containing Blockchain, Block, Transaction classes
 * @returns {Blockchain|null} Reconstructed blockchain instance, or null if load failed
 */
const load = (classes) => {
  try {
    if (!fs.existsSync(PERSISTENCE_FILE)) {
      logger.debug('No saved blockchain found on disk, will use fresh state');
      return null;
    }

    const data = JSON.parse(fs.readFileSync(PERSISTENCE_FILE, 'utf8'));
    const blockchain = deserializeBlockchain(data, classes);

    // Validate chain integrity
    if (!blockchain.isChainValid()) {
      logger.warn('Loaded blockchain failed validation, starting fresh');
      return null;
    }

    logger.info(`Blockchain restored from disk (${blockchain.chain.length} blocks, ${blockchain.pendingTransactions.length} pending)`);
    return blockchain;
  } catch (err) {
    if (err.code === 'ENOENT') {
      logger.debug('No saved blockchain found on disk');
    } else {
      logger.warn(`Failed to load blockchain: ${err.message}, starting fresh`);
    }
    return null;
  }
};

/**
 * Clear persisted blockchain state (for testing/reset).
 * @returns {boolean} True if clear was successful, false otherwise
 */
const clear = () => {
  try {
    if (fs.existsSync(PERSISTENCE_FILE)) {
      fs.unlinkSync(PERSISTENCE_FILE);
      logger.debug('Persisted blockchain state cleared');
    }
    return true;
  } catch (err) {
    logger.error(`Failed to clear persisted blockchain: ${err.message}`);
    return false;
  }
};

module.exports = { save, load, clear };
