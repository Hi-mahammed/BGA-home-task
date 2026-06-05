const { Router } = require('express');
const { signAndAddTransaction } = require('../controllers/signing.controller');
const { validateBody } = require('../middleware/validateRequest.middleware');
const { writeLimiter } = require('../middleware/rateLimit.middleware');

const router = Router();

/**
 * POST /api/sign - Sign and add a transaction with a private key
 * Required fields: fromAddress, toAddress, amount, privateKeyHex
 */
router.post(
  '/',
  writeLimiter,
  validateBody(['fromAddress', 'toAddress', 'amount', 'privateKeyHex']),
  signAndAddTransaction
);

module.exports = router;
