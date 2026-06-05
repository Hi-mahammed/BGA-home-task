const logger = require('./logger');

/**
 * Safely persist blockchain state after operations.
 * Catches all errors to prevent controller crashes.
 * @param {Blockchain} blockchain - The blockchain instance
 * @param {Object} persistenceService - The persistence service
 * @param {string} operation - Description of the operation (for logging)
 * @returns {boolean} True if save successful, false otherwise
 */
const saveBlockchainState = (blockchain, persistenceService, operation = 'blockchain operation') => {
  try {
    const success = persistenceService.save(blockchain);
    if (success) {
      logger.debug(`Persisted blockchain after ${operation}`);
    }
    return success;
  } catch (err) {
    logger.error(`Failed to persist blockchain after ${operation}: ${err.message}`);
    return false;
  }
};

module.exports = { saveBlockchainState };
