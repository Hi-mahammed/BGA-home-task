# Blockchain HomeTask Project

A blockchain implementation with a layered Express backend and a React frontend.

> **For Applicants:** See [INSTRUCTIONS.md](./INSTRUCTIONS.md) for task requirements (2 tasks, 4–6 hours).
> See [SETUP.md](./SETUP.md) for a quick-start guide.

---

## Project Structure

```
hometask-blockchain/
│
├── config/
│   └── index.js                  # Environment config (port, CORS, blockchain settings)
│
├── models/
│   ├── blockchain.js             # Block, Transaction, Blockchain domain classes
│   └── index.js                  # Singleton instance + persistence + demo data seeding
│
├── services/
│   └── persistence.service.js    # Save/load/clear blockchain state to/from blockchain.json
│
├── utils/
│   ├── logger.js                 # Levelled logger (error / warn / info / debug)
│   ├── response.js               # Unified sendSuccess / sendCreated / sendError helpers
│   ├── validator.js              # isValidAddress, isValidAmount, sanitizers
│   └── persistence-helper.js     # Centralized saveBlockchainState() helper (DRY)
│
├── middleware/
│   ├── cors.middleware.js        # CORS policy
│   ├── logger.middleware.js      # Morgan HTTP request logger
│   ├── errorHandler.middleware.js# Centralised error handler (must be last)
│   ├── notFound.middleware.js    # 404 handler
│   ├── validateRequest.middleware.js  # validateBody / validateParams factories
│   └── rateLimit.middleware.js   # apiLimiter (100 req/min) + writeLimiter (20 req/min)
│
├── routes/
│   ├── index.js                  # Aggregates all /api sub-routes
│   ├── blockchain.routes.js      # /api/chain
│   ├── transaction.routes.js     # /api/transactions + /api/transactions/sign (consolidated)
│   ├── mining.routes.js          # /api/mine
│   ├── balance.routes.js         # /api/balance
│   ├── stats.routes.js           # /api/stats
│   ├── wallet.routes.js          # /api/wallets
│   └── health.routes.js          # /health (no rate limit)
│
├── controllers/
│   ├── blockchain.controller.js
│   ├── transaction.controller.js # Consolidated: unsigned + signed transaction handling + persistence
│   ├── mining.controller.js      # Updated: uses persistence-helper
│   ├── balance.controller.js
│   ├── stats.controller.js       # Updated: includes persistence file info
│   └── wallet.controller.js      # secp256k1 key pair generation
│
├── src/                          # React frontend
│   ├── api/
│   │   ├── client.js             # Axios instance with request/response interceptors
│   │   ├── endpoints.js          # All API URL constants (updated with wallets/sign)
│   │   └── blockchain.api.js     # Updated: added generateWallet(), signTransaction()
│   ├── hooks/
│   │   ├── useBlockchain.js      # Polls /api/chain + /api/stats, returns state
│   │   └── usePolling.js         # Reusable interval-based polling hook
│   ├── utils/
│   │   ├── formatters.js         # truncateHash, formatTimestamp, formatAmount
│   │   └── helpers.js            # isPositiveNumber, groupTransactionsByBlock, etc.
│   ├── constants/
│   │   └── index.js              # POLL_INTERVAL_MS, DEFAULT_MINER_ADDRESS, enums
│   ├── components/
│   │   ├── BlockchainViewer.js
│   │   ├── TransactionForm.js    # Updated: uses wallet signing instead of plain tx
│   │   ├── TransactionForm.css   # Updated: added no-wallet-message + form-hint styles
│   │   ├── Wallet.js             # NEW: wallet generation, display, export/import
│   │   ├── Wallet.css            # NEW: wallet panel and key management styles
│   │   ├── StatsPanel.js
│   │   ├── Header.js
│   │   └── ErrorBoundary.js      # React class error boundary
│   ├── App.js                    # Updated: integrated Wallet component + wallet state
│   └── index.js
│
├── blockchain.js                 # Backward-compat re-export → models/blockchain.js
├── .gitignore                    # NEW: ignore node_modules, blockchain.json, build/
├── server.js                     # Entry point — wires middleware, routes, starts server
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js v16 or higher
- npm

### Install & Configure

```bash
npm install
```

### Run in Development

```bash
# Terminal 1 — React dev server on http://localhost:3000
npm start

# Terminal 2 — API server on http://localhost:3002, with auto-reload
npm run dev
```

The React app proxies all `/api/*` requests to the API server automatically via `src/setupProxy.js`.

### Run in Production

```bash
npm run serve   # builds the React app, then serves everything from port 3002
```

---

## API Reference

All API responses share a common envelope:

```json
{ "success": true, ...payload }
{ "success": false, "error": "message" }
```

### Chain

| Method | Path | Description |
|---|---|---|
| GET | `/api/chain` | Full chain + length |
| GET | `/api/chain/valid` | `{ isValid: bool }` |

### Transactions

| Method | Path | Description |
|---|---|---|
| POST | `/api/transactions` | Add a pending transaction (requires valid signature for regular addresses) |
| POST | `/api/transactions/sign` | Sign and add transaction with private key (wallet-based) |
| GET | `/api/transactions/pending` | All pending transactions |
| GET | `/api/transactions/all` | All confirmed transactions |

**POST `/api/transactions` body:**
```json
{ "fromAddress": "address1", "toAddress": "address2", "amount": 100, "signature": "..." }
```

**Note:** Regular transactions must have a valid ECDSA signature. Unsigned transactions will be rejected.

### Mining

| Method | Path | Description |
|---|---|---|
| POST | `/api/mine` | Mine pending transactions into a new block |

**POST `/api/mine` body:**
```json
{ "miningRewardAddress": "miner1" }
```

### Balance

| Method | Path | Description |
|---|---|---|
| GET | `/api/balance/:address` | Confirmed balance of an address |

### Wallets

| Method | Path | Description |
|---|---|---|
| POST | `/api/wallets` | Generate a new secp256k1 key pair |

**POST `/api/wallets` response:**
```json
{
  "success": true,
  "message": "Wallet created successfully",
  "publicKey": "hex-encoded-spki-public-key",
  "privateKey": "hex-encoded-pkcs8-private-key"
}
```

**POST `/api/transactions/sign` body:**
```json
{
  "fromAddress": "public-key-hex",
  "toAddress": "recipient-public-key-hex",
  "amount": 100,
  "privateKeyHex": "private-key-hex"
}
```

**Response on success (201 Created):**
```json
{
  "success": true,
  "message": "Transaction signed and added to pending pool",
  "transaction": {
    "fromAddress": "public-key-hex",
    "toAddress": "recipient-public-key-hex",
    "amount": 100,
    "timestamp": 1234567890,
    "signature": "signature-hex"
  }
}
```

### Stats

| Method | Path | Description |
|---|---|---|
| GET | `/api/stats` | Chain length, difficulty, validity, pending count |

### Health

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Server uptime, env, timestamp — no rate limit |

---

## Frontend Architecture

The React app is organised into distinct concerns:

- **`src/api/`** — all network calls live here. Components never call `fetch`/`axios` directly.
- **`src/hooks/useBlockchain`** — single source of truth for chain + stats state; polls every 5 s.
- **`src/utils/formatters`** — pure formatting functions (hash truncation, timestamps, amounts).
- **`src/constants/`** — magic strings and numbers in one place.
- **`ErrorBoundary`** — catches any unhandled React render errors gracefully.

---

## Technologies

### Backend
- Node.js + Express
- `morgan` — HTTP request logging
- `dotenv` — environment variable loading
- `express-rate-limit` — API rate limiting
- `cors` — CORS policy middleware
- Node.js built-in `crypto` — SHA-256 hashing

### Frontend
- React 18
- Axios (with interceptors)
- CSS3 (glassmorphism, gradients, animations)

---

## Troubleshooting

**Port already in use**
```bash
# Use a different port
PORT=3003 npm run dev
```

**Frontend can't reach the API**
- Confirm `npm run dev` is running on port 3002
- Confirm `src/setupProxy.js` target matches `PORT`

**Chain resets on every restart**
- Blockchain state is persisted to `blockchain.json` after each transaction and mining operation
- On server restart, the previous state is loaded automatically
- If `blockchain.json` is missing or corrupted, a fresh blockchain starts with genesis block

---

## Changes

### Task 1: Cryptographic Wallet System

**Backend Implementation:**

1. **New/Enhanced Endpoints:**
   - `POST /api/wallets` — Generate a new secp256k1 EC key pair
     - Returns: `{ success, message, publicKey (hex), privateKey (hex) }`
     - Public key = wallet address, Private key = signing key (client-side only)
     - Rate-limited with `writeLimiter` middleware

   - `POST /api/transactions/sign` — Sign and submit a transaction with a private key
     - Requires: `fromAddress`, `toAddress`, `amount`, `privateKeyHex`
     - Handled by `controllers/transaction.controller.js::processTransaction()`
     - Reconstructs private key from hex, signs transaction, adds to pending
     - Rate-limited and request body validated

2. **Modified Cryptography (`models/blockchain.js`):**
   - `Transaction.signTransaction(signingKey)` — Signs transaction hash with ECDSA/secp256k1
     - Extracts public key from private key via `crypto.createPublicKey()`
     - Verifies public key matches `fromAddress`
     - Uses SHA-256 hashing + `crypto.sign()` for signature generation
     - Stores signature as hex string in transaction object
   - `Transaction.isValid()` — Validates ECDSA signature properly
     - Allows mining rewards (null `fromAddress`) without signatures
     - Rejects unsigned transactions from regular addresses (returns `false`)
     - Uses `crypto.verify()` with SHA-256 to confirm signature
     - Reconstructs public key from hex-encoded `fromAddress` for verification
   - `Blockchain.addTransaction()` — Enforces signature validation
     - Calls `isValid()` on every transaction before adding to pending pool
     - Throws descriptive error if signature is invalid or missing

3. **Backend Files (Task 1):**
   - `controllers/wallet.controller.js` — Key pair generation via `generateKeyPairSync('ec', { namedCurve: 'secp256k1' })`
   - `routes/wallet.routes.js` — Routes POST `/api/wallets` endpoint
   - `controllers/transaction.controller.js` — Single `processTransaction()` handler: processes both signed and unsigned transactions
   - `routes/transaction.routes.js` — Unified routes: POST `/transactions` and POST `/transactions/sign` (both use `processTransaction`)

**Frontend Implementation:**

4. **New Wallet Component:**
   - `src/components/Wallet.js` — Full wallet lifecycle management
     - Generate new wallet (calls `POST /api/wallets`)
     - Display public key with truncation + copy-to-clipboard
     - Show/hide private key with security warning
     - Fetch and display wallet balance (reads from `/api/balance/:address`)
     - Refresh balance on-demand
     - Export wallet to JSON file
     - Import wallet from JSON file

   - `src/components/Wallet.css` — Glassmorphic UI with:
     - Wallet setup panel (generate button)
     - Key display sections with copy functionality
     - Balance display with refresh button
     - Export/import/reset action buttons
     - Success/error message styling

5. **Modified TransactionForm:**
   - `src/components/TransactionForm.js` — Updated to require wallet for transaction signing
     - Accepts `wallet` prop from parent App
     - Auto-fills `fromAddress` from wallet's public key (disabled input)
     - Calls `POST /api/sign` instead of `POST /api/transactions`
     - Signs transaction with wallet's private key before submission
     - Shows wallet required warning if not available
   - `src/components/TransactionForm.css` — Enhanced with:
     - `.no-wallet-message` — Warning styling when no wallet selected
     - `.form-input-disabled` — Styling for auto-filled address field
     - `.form-hint` — Helper text styling for auto-filled fields

6. **Modified API Integration:**
   - `src/api/blockchain.api.js` — Added two new functions:
     - `generateWallet()` — Calls `POST /api/wallets`
     - `signTransaction()` — Calls `POST /api/transactions/sign` with signed data
   - `src/api/endpoints.js` — Added new endpoints:
     - `WALLETS: '/api/wallets'`
     - `TRANSACTIONS_SIGN: '/api/transactions/sign'`

7. **Modified App Integration (`src/App.js`):**
   - Added `useState(wallet)` to track active wallet
   - Integrated `<Wallet>` component at top of left panel
   - Pass `wallet` state to `<TransactionForm>`
   - Handle `onWalletCreated` callback to update wallet state

---

### Task 2: Blockchain Persistence

**Backend Implementation:**

1. **Persistence Service (`services/persistence.service.js`):**
   - `save(blockchain)` — Serializes blockchain to JSON, writes to `blockchain.json`
     - Catches all file I/O errors, returns boolean success status
     - Logs at debug level on success, error level on failure
     - Never throws — safe to call from anywhere

   - `load(classes)` — Deserializes `blockchain.json`, reconstructs blockchain state
     - Handles missing file gracefully (returns `null`)
     - Parses JSON, deserializes all blocks and transactions with signatures
     - Validates loaded chain with `isChainValid()` — discards if corrupt
     - Returns reconstructed `Blockchain` instance or `null` on failure

   - `clear()` — Deletes `blockchain.json` (for testing/reset)
     - Catches deletion errors, logs appropriately

2. **Modified Initialization (`models/index.js`):**
   - `initializeBlockchain()` — Startup sequence:
     1. Calls `persistenceService.load({ Blockchain, Block, Transaction })`
     2. If saved state exists and passes `isChainValid()`, uses restored blockchain
     3. Otherwise creates fresh `Blockchain` instance with config difficulty/reward
     4. Only seeds demo data if newly created (not loaded from disk)
   - `seedDemoData()` — Demo seeding with error handling:
     - Wraps demo transaction additions in try-catch
     - Skips transactions that fail signature validation
     - Mines pending transactions if any were added successfully
     - Calls `persistenceService.save()` after mining demo data

3. **Auto-Persistence & DRY Principle:**
   - `utils/persistence-helper.js` — New centralized helper function (eliminates code duplication):
     - `saveBlockchainState(blockchain, persistenceService, operation)`
     - Wraps `persistenceService.save()` with error handling and logging
     - Logs at debug level on success, error level on failure
     - Returns boolean success status, never throws
   - **Modified controllers using the helper:**
     - `controllers/mining.controller.js` — Calls helper after mining: `saveBlockchainState(..., 'mining')`
     - `controllers/transaction.controller.js` — Calls helper after adding unsigned tx: `saveBlockchainState(..., 'adding unsigned transaction')`
  
4. **Modified Monitoring (`controllers/stats.controller.js`):**
   - Enhanced `getStats()` with persistence file metadata:
     - `persistence.fileExists` — Boolean flag if blockchain.json exists
     - `persistence.lastUpdated` — ISO timestamp of last file modification
     - `persistence.fileSizeBytes` — Size of persisted blockchain.json file
   - Uses `fs.statSync()` to read file stats, catches errors gracefully

5. **Storage Format (blockchain.json):**
   - Location: Project root (e.g., `./blockchain.json`)
   - GitIgnore: Included in `.gitignore` to prevent committing persisted data
   - Structure:
     ```json
     {
       "chain": [
         { timestamp, transactions, previousHash, nonce, hash },
         ...
       ],
       "pendingTransactions": [
         { fromAddress, toAddress, amount, timestamp, signature },
         ...
       ],
       "difficulty": number,
       "miningReward": number
     }
     ```
   - All transactions preserve signatures on serialization/deserialization

**Backend Files Summary:**

6. **Files:**
   - `controllers/wallet.controller.js` — Wallet key pair generation
   - `routes/wallet.routes.js` — POST /api/wallets route
   - `services/persistence.service.js` — Full persistence logic: save/load/clear
   - `utils/persistence-helper.js` — DRY helper: saveBlockchainState() for controllers
   - `models/blockchain.js` — Enhanced Transaction.signTransaction() + Transaction.isValid()
   - `controllers/transaction.controller.js` — Unified handler: `processTransaction()` (handles both signed/unsigned)
   - `routes/transaction.routes.js` — Unified routes using single `processTransaction()` handler
   - `models/index.js` — Persistence.load() on startup, conditional seeding, save() after mining
   - `controllers/mining.controller.js` — Uses saveBlockchainState() helper after mining
   - `controllers/stats.controller.js` — Added persistence metadata (fileExists, lastUpdated, fileSizeBytes)
   - `routes/index.js` — Updated to use consolidated transaction routes
   - `config/index.js` — Demo data disabled by default (SEED_DEMO_DATA !== 'true')

**Frontend Files Summary:**

7. **Files:**
   - `src/components/Wallet.js` — Wallet UI component with polling
   - `src/components/Wallet.css` — Wallet component styles
   - `src/api/blockchain.api.js` — Added generateWallet(), signTransaction() functions
   - `src/api/endpoints.js` — Updated endpoints: TRANSACTIONS_SIGN
   - `src/components/TransactionForm.js` — Wallet-based signing
   - `src/components/TransactionForm.css` — Enhanced with form helpers
   - `src/App.js` — Added wallet state, integrated Wallet component 

---

### Architecture & Principles

**Layered Pattern:**
- Routes → Controllers → Models/Services
- All persistence calls centralized in `services/`, invoked via helper
- No persistence logic in `server.js` or directly in controllers
- Configuration in `config/`, utilities in `utils/`

**DRY Principle:**
- Single `processTransaction()` handler for both signed and unsigned transactions
- Single `saveBlockchainState()` helper used by mining and transaction controllers
- Unified route handlers: POST `/transactions` and POST `/transactions/sign` both call `processTransaction()`
- Centralized `persistenceService.save/load/clear()` — called from one place
- Shared error handling and logging via logger + helper
- No code duplication in transaction processing logic

**Cryptography:**
- ECDSA with secp256k1 curve (Node.js native `crypto` module)
- SHA-256 hashing for transaction digests
- Public key stored as hex-encoded SPKI DER bytes
- Private key stored as hex-encoded PKCS#8 DER bytes
- Signatures stored as hex-encoded raw signature bytes

**Error Handling:**
- All file I/O caught with try-catch
- No errors thrown from persistence layer — always logged + handled gracefully
- Validation of loaded state before restoration
- Corruption → graceful fallback to fresh blockchain
- Invalid signatures rejected at blockchain level

**Logging:**
- Save events: debug level (successful), error level (failures)
- Load events: debug (no file), info (successful restore), warn (corruption/errors)
- Clear events: debug (successful), error (failures)
- Operation descriptions logged for debugging

---

### Configuration & Environment

- **No new env vars required** — uses defaults
- **Persistence file**: `blockchain.json` in project root (auto-created on first operation)
- **Demo data**: Disabled by default (`SEED_DEMO_DATA !== 'true'`) — requires valid signatures
- **Blockchain settings**: Respects `BLOCKCHAIN_DIFFICULTY` + `BLOCKCHAIN_MINING_REWARD` from config

### Known Limitations & Trade-Offs

1. **Private key storage**: Client stores keys in component state. For production: use secure key management (HSM, vault).
2. **Single-server persistence**: File-based, not suitable for distributed deployments. Migrate to database for multi-instance.
3. **No backup/versioning**: `blockchain.json` is overwritten on each save — no automatic backups.
4. **Signature format**: Stored as hex strings (not DER). Deserialization reconstructs transaction state correctly.
5. **Educational use only**: Demo blockchain for learning. Not suitable for real financial transactions or production use.

---

## License

MIT — for learning and assessment purposes.
