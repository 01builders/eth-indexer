import { createConfig } from "ponder";

export default createConfig({
  chains: {
    mainnet: {
      id: 6666,
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
