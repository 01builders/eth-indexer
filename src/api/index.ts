import { db } from "ponder:api";
import schema from "ponder:schema";
import { Hono } from "hono";
import { graphql } from "ponder";

const app = new Hono();

// Custom REST endpoints for transaction data
app.get("/transactions", async (c) => {
  const limit = parseInt(c.req.query("limit") || "100", 10);
  const offset = parseInt(c.req.query("offset") || "0", 10);

  const transactions = await db
    .select()
    .from(schema.transactions)
    .limit(limit)
    .offset(offset);

  return c.json({
    transactions: transactions.map(tx => ({
      hash: tx.hash,
      blockNumber: tx.blockNumber.toString(),
      blockHash: tx.blockHash,
      transactionIndex: tx.transactionIndex,
      from: tx.from,
      to: tx.to,
      value: tx.value.toString(),
      gasPrice: tx.gasPrice?.toString() || "0",
      gasUsed: tx.gasUsed?.toString() || "0",
      gasLimit: tx.gasLimit.toString(),
      input: tx.input,
      nonce: tx.nonce,
      timestamp: tx.timestamp.toString(),
      status: tx.status,
    })),
    pagination: {
      limit,
      offset,
      hasMore: transactions.length === limit,
    },
  });
});

app.get("/transactions/:hash", async (c) => {
  const hash = c.req.param("hash") as `0x${string}`;

  const transactions = await db
    .select()
    .from(schema.transactions);

  const tx = transactions.find(t => t.hash === hash);

  if (!tx) {
    return c.json({ error: "Transaction not found" }, 404);
  }

  return c.json({
    hash: tx.hash,
    blockNumber: tx.blockNumber.toString(),
    blockHash: tx.blockHash,
    transactionIndex: tx.transactionIndex,
    from: tx.from,
    to: tx.to,
    value: tx.value.toString(),
    gasPrice: tx.gasPrice?.toString() || "0",
    gasUsed: tx.gasUsed?.toString() || "0",
    gasLimit: tx.gasLimit.toString(),
    input: tx.input,
    nonce: tx.nonce,
    timestamp: tx.timestamp.toString(),
    status: tx.status,
  });
});

app.get("/blocks", async (c) => {
  const limit = parseInt(c.req.query("limit") || "100", 10);
  const offset = parseInt(c.req.query("offset") || "0", 10);

  const blocks = await db
    .select()
    .from(schema.blocks)
    .limit(limit)
    .offset(offset);

  return c.json({
    blocks: blocks.map(block => ({
      hash: block.hash,
      number: block.number.toString(),
      timestamp: block.timestamp.toString(),
      parentHash: block.parentHash,
      gasUsed: block.gasUsed.toString(),
      gasLimit: block.gasLimit.toString(),
      transactionCount: block.transactionCount,
    })),
    pagination: {
      limit,
      offset,
      hasMore: blocks.length === limit,
    },
  });
});

app.get("/blocks/:number", async (c) => {
  const number = BigInt(c.req.param("number"));

  const blocks = await db
    .select()
    .from(schema.blocks);

  const block = blocks.find(b => b.number === number);

  if (!block) {
    return c.json({ error: "Block not found" }, 404);
  }

  return c.json({
    hash: block.hash,
    number: block.number.toString(),
    timestamp: block.timestamp.toString(),
    parentHash: block.parentHash,
    gasUsed: block.gasUsed.toString(),
    gasLimit: block.gasLimit.toString(),
    transactionCount: block.transactionCount,
  });
});

app.get("/stats", async (c) => {
  try {
    const [transactions, blocks] = await Promise.all([
      db.select().from(schema.transactions),
      db.select().from(schema.blocks),
    ]);

    const latestBlock = blocks.length > 0
      ? blocks.reduce((latest, current) =>
          current.number > latest.number ? current : latest
        )
      : null;

    return c.json({
      totalTransactions: transactions.length,
      totalBlocks: blocks.length,
      latestBlock: latestBlock ? {
        hash: latestBlock.hash,
        number: latestBlock.number.toString(),
        timestamp: latestBlock.timestamp.toString(),
        parentHash: latestBlock.parentHash,
        gasUsed: latestBlock.gasUsed.toString(),
        gasLimit: latestBlock.gasLimit.toString(),
        transactionCount: latestBlock.transactionCount,
      } : null,
    });
  } catch (error) {
    console.error("Failed to fetch stats:", error);
    return c.json({ error: "Failed to fetch stats" }, 500);
  }
});

// GraphQL API - accessible at /graphql with GraphiQL interface
app.use("/graphql", graphql({ db, schema }));

export default app;
