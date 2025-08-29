import { createConfig } from "ponder";

// Validate required environment variables
if (!process.env.PONDER_CHAIN_ID_1) {
  throw new Error("PONDER_CHAIN_ID_1 environment variable is required");
}
if (!process.env.PONDER_RPC_URL_1) {
  throw new Error("PONDER_RPC_URL_1 environment variable is required");
}

// Parse and validate chain ID
const chainId = parseInt(process.env.PONDER_CHAIN_ID_1, 10);
if (isNaN(chainId)) {
  throw new Error(`Invalid PONDER_CHAIN_ID_1: ${process.env.PONDER_CHAIN_ID_1}. Must be a valid number.`);
}

export default createConfig({
  chains: {
    mainnet: {
      id: chainId,
      rpc: process.env.PONDER_RPC_URL_1,
    },
  },
  blocks: {
    AllTransactions: {
      chain: "mainnet",
      startBlock: 0, // Start from genesis block
      interval: 1, // Index every block
    },
  },
});
