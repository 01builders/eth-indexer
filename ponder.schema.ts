import { onchainTable } from "ponder";

export const transactions = onchainTable("transactions", (t) => ({
  hash: t.hex().primaryKey(),
  blockNumber: t.bigint().notNull(),
  blockHash: t.hex().notNull(),
  transactionIndex: t.integer().notNull(),
  from: t.hex().notNull(),
  to: t.hex(),
  value: t.bigint().notNull(),
  gasPrice: t.bigint(),
  gasUsed: t.bigint(),
  gasLimit: t.bigint().notNull(),
  input: t.hex().notNull(),
  nonce: t.integer().notNull(),
  timestamp: t.bigint().notNull(),
  status: t.integer(),
}));

export const blocks = onchainTable("blocks", (t) => ({
  hash: t.hex().primaryKey(),
  number: t.bigint().notNull(),
  timestamp: t.bigint().notNull(),
  parentHash: t.hex().notNull(),
  gasUsed: t.bigint().notNull(),
  gasLimit: t.bigint().notNull(),
  transactionCount: t.integer().notNull(),
}));
