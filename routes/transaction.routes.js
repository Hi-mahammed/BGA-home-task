const { Router } = require('express');
const {
  processTransaction,
  getPendingTransactions,
  getAllTransactions,
} = require('../controllers/transaction.controller');
const { validateBody } = require('../middleware/validateRequest.middleware');
const { writeLimiter } = require('../middleware/rateLimit.middleware');

const router = Router();

router.post('/', writeLimiter, validateBody(['fromAddress', 'toAddress', 'amount']), processTransaction);
router.post('/sign', writeLimiter, validateBody(['fromAddress', 'toAddress', 'amount', 'privateKeyHex']), processTransaction);
router.get('/pending', getPendingTransactions);
router.get('/all', getAllTransactions);

module.exports = router;
