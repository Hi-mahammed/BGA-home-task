const fs = require('fs');
const path = require('path');
const { blockchain } = require('../models');
const { sendSuccess } = require('../utils/response');

const getStats = (req, res) => {
  const allTransactions = blockchain.getAllTransactions();

  // Check persistence file existence and last update
  const persistenceFile = path.join(__dirname, '..', 'blockchain.json');
  let persistenceInfo = {
    fileExists: false,
    lastUpdated: null,
  };

  try {
    if (fs.existsSync(persistenceFile)) {
      const stats = fs.statSync(persistenceFile);
      persistenceInfo.fileExists = true;
      persistenceInfo.lastUpdated = stats.mtime.toISOString();
      persistenceInfo.fileSizeBytes = stats.size;
    }
  } catch (err) {
    // Silently ignore stat errors
  }

  sendSuccess(res, {
    chainLength: blockchain.chain.length,
    pendingTransactions: blockchain.pendingTransactions.length,
    totalTransactions: allTransactions.length,
    difficulty: blockchain.difficulty,
    miningReward: blockchain.miningReward,
    isValid: blockchain.isChainValid(),
    latestBlockHash: blockchain.getLatestBlock().hash,
    persistence: persistenceInfo,
  });
};

module.exports = { getStats };
