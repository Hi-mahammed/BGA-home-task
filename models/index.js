const config = require('../config');
const logger = require('../utils/logger');
const { Blockchain, Block, Transaction } = require('./blockchain');
const persistenceService = require('../services/persistence.service');

let blockchain;

const initializeBlockchain = () => {
  // Try to load saved state first
  const saved = persistenceService.load({ Blockchain, Block, Transaction });

  if (saved) {
    blockchain = saved;
    return;
  }

  // No saved state, create fresh blockchain
  blockchain = new Blockchain(
    config.blockchain.difficulty,
    config.blockchain.miningReward
  );

  seedDemoData();
};

const seedDemoData = () => {
  if (!config.demoData.enabled) {
    return;
  }

  // Try to add demo transactions (will fail if not properly signed)
  for (const { from, to, amount } of config.demoData.transactions) {
    try {
      blockchain.addTransaction(new Transaction(from, to, amount));
    } catch (err) {
      // Demo transactions without valid signatures are skipped
      logger.debug(`Skipped demo transaction: ${err.message}`);
    }
  }

  if (blockchain.pendingTransactions.length > 0) {
    blockchain.minePendingTransactions(config.blockchain.initialMinerAddress);
    persistenceService.save(blockchain);
    logger.info('Seeded demo blockchain data and persisted');
  }
};

initializeBlockchain();

module.exports = {
  blockchain,
  Blockchain,
  Block,
  Transaction,
  persistenceService,
};
