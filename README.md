# EV Chain Transaction Indexer

A comprehensive transaction indexer built with [Ponder.sh](https://ponder.sh) that indexes every transaction that has ever occurred on your private EV-compatible chain.

## Features

- **Complete Transaction Indexing**: Indexes every transaction from genesis block (block 0) onwards
- **Block Data**: Captures comprehensive block information including gas usage, timestamps, and transaction counts
- **Transaction Details**: Records all transaction data including gas prices, gas usage, input data, and execution status
- **REST API**: Provides easy-to-use REST endpoints for querying indexed data
- **GraphQL API**: Full GraphQL support for complex queries
- **Real-time Indexing**: Continuously indexes new blocks as they are mined

## Configuration

### Environment Variables

Set your RPC URL in your environment:

```bash
export PONDER_RPC_URL_1="http://your-private-chain-rpc-url:8545"
```

## Installation & Setup

1. Install dependencies:
```bash
npm install
```

2. Set your CHAIN ID and RPC URL :
```bash
export PONDER_CHAIN_ID_1="1234"
export PONDER_RPC_URL_1="http://your-chain-rpc:8545"
```

3. Start the indexer:
```bash
npm run dev
```

The indexer will start from block 0 and index every transaction on your chain.

## API Endpoints

### REST API

#### Get Transactions
```
GET /transactions?limit=100&offset=0
```
Returns paginated list of transactions.

#### Get Transaction by Hash
```
GET /transactions/{hash}
```
Returns specific transaction details.

#### Get Blocks
```
GET /blocks?limit=100&offset=0
```
Returns paginated list of blocks.

#### Get Block by Number
```
GET /blocks/{number}
```
Returns specific block details.

#### Get Statistics
```
GET /stats
```
Returns indexing statistics including total transactions, blocks, and latest block info.

### GraphQL API

Access the GraphQL playground at:
```
http://localhost:42069/graphql
```

Example GraphQL queries:

```graphql
# Get recent transactions
query {
  transactionss(limit: 10, orderBy: "timestamp", orderDirection: "desc") {
    items {
      hash
      from
      to
      value
      blockNumber
      timestamp
      gasPrice
      gasUsed
      gasLimit
      input
      nonce
      status
    }
  }
}

# Get blocks with transaction counts
query {
  blockss(limit: 10, orderBy: "number", orderDirection: "desc") {
    items {
      number
      hash
      timestamp
      parentHash
      transactionCount
      gasUsed
      gasLimit
    }
  }
}

# Get a specific transaction by hash
query {
  transactions(hash: "0xe4c10f3946e20156207b7215b03a62a130ef9e98e5ff7511153091f69b5f451e") {
    hash
    from
    to
    value
    blockNumber
    timestamp
    status
  }
}

# Get transactions from a specific block
query {
  transactionss(where: { blockNumber: "275" }) {
    items {
      hash
      from
      to
      value
      transactionIndex
    }
  }
}
```

## Database Schema

### Transactions Table
- `hash`: Transaction hash (primary key)
- `blockNumber`: Block number containing the transaction
- `blockHash`: Hash of the containing block
- `transactionIndex`: Position of transaction in block
- `from`: Sender address
- `to`: Recipient address (null for contract creation)
- `value`: ETH value transferred
- `gasPrice`: Gas price used
- `gasUsed`: Actual gas consumed
- `gasLimit`: Gas limit set
- `input`: Transaction input data
- `nonce`: Sender nonce
- `timestamp`: Block timestamp
- `status`: Transaction status (1 = success, 0 = failed)

### Blocks Table
- `hash`: Block hash (primary key)
- `number`: Block number
- `timestamp`: Block timestamp
- `parentHash`: Previous block hash
- `gasUsed`: Total gas used in block
- `gasLimit`: Block gas limit
- `transactionCount`: Number of transactions in block

## Performance Considerations

- **Initial Sync**: Indexing from genesis can take time depending on chain history
- **RPC Limits**: Ensure your RPC endpoint can handle the indexing load
- **Database**: Uses SQLite by default, consider PostgreSQL for production
- **Memory**: Transaction receipts are fetched for accurate gas usage data

## Monitoring

The indexer logs progress as it processes blocks:

```
Indexed block 1234 with 15 transactions
```

Monitor the `/stats` endpoint to track indexing progress.

## Customization

### Adding Custom Fields

To index additional transaction or block data, modify:

1. `ponder.schema.ts` - Add new columns
2. `src/index.ts` - Update indexing logic
3. `src/api/index.ts` - Update API responses

### Filtering Transactions

To index only specific types of transactions, add filtering logic in `src/index.ts`:

```typescript
// Example: Only index transactions with value > 0
if (transaction.value > 0n) {
  await context.db.insert(schema.transactions).values({
    // ... transaction data
  });
}
```

## Troubleshooting

### Common Issues

1. **RPC Connection**: Ensure your RPC URL is accessible and supports the required methods
2. **Chain ID Mismatch**: Verify the chain ID in config matches your network
3. **Memory Issues**: For large chains, consider increasing Node.js memory limit
4. **Rate Limiting**: Some RPC providers have rate limits that may slow indexing

### Logs

Check Ponder logs for detailed error information and indexing progress.

## Production Deployment

For production use:

1. Use PostgreSQL instead of SQLite
2. Set up proper monitoring and alerting
3. Configure backup strategies for indexed data
4. Consider horizontal scaling for high-throughput chains
5. Implement proper error handling and recovery mechanisms

## Contributing

Feel free to submit issues and enhancement requests!
