const { Router } = require('express');
const { generateWallet } = require('../controllers/wallet.controller');
const { writeLimiter } = require('../middleware/rateLimit.middleware');

const router = Router();

/**
 * POST /api/wallets - Generate a new EC key pair (secp256k1)
 * Rate limited to protect key generation endpoint
 */
router.post('/', writeLimiter, generateWallet);

module.exports = router;
