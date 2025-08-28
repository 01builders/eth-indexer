import { ponder } from "ponder:registry";
import schema from "ponder:schema";

// Index all blocks and their transactions
ponder.on("AllTransactions:block", async ({ event, context }) => {
  const { block } = event;

  // First, insert the block data
  await context.db
    .insert(schema.blocks)
    .values({
      hash: block.hash,
      number: block.number,
      timestamp: block.timestamp,
      parentHash: block.parentHash,
      gasUsed: block.gasUsed,
      gasLimit: block.gasLimit,
      transactionCount: 0, // Will be calculated from actual transactions
    })
    .onConflictDoNothing();

  // Fetch the full block with transactions using the client
  const fullBlock = await context.client.getBlock({
    blockHash: block.hash,
    includeTransactions: true,
  });

  let transactionCount = 0;

  // Index all transactions in this block
  if (fullBlock.transactions && Array.isArray(fullBlock.transactions)) {
    for (const transaction of fullBlock.transactions) {
      // Skip if transaction is just a hash (shouldn't happen with includeTransactions: true)
      if (typeof transaction === 'string') continue;

      transactionCount++;

      // Get transaction receipt for gas used and status
      let gasUsed = 0n;
      let status = 1;
      try {
        const receipt = await context.client.getTransactionReceipt({
          hash: transaction.hash,
        });
        gasUsed = receipt.gasUsed;
        status = receipt.status === 'success' ? 1 : 0;
      } catch (error) {
        console.warn(`Could not get receipt for transaction ${transaction.hash}:`, error);
      }

      await context.db
        .insert(schema.transactions)
        .values({
          hash: transaction.hash,
          blockNumber: block.number,
          blockHash: block.hash,
          transactionIndex: transaction.transactionIndex,
          from: transaction.from,
          to: transaction.to,
          value: transaction.value,
          gasPrice: transaction.gasPrice || 0n,
          gasUsed: gasUsed,
          gasLimit: transaction.gas,
          input: transaction.input,
          nonce: transaction.nonce,
          timestamp: block.timestamp,
          status: status,
        })
        .onConflictDoNothing();
    }
  }

  // Update block with actual transaction count
  await context.db
    .update(schema.blocks, { hash: block.hash })
    .set({ transactionCount });

  console.log(`Indexed block ${block.number} with ${transactionCount} transactions`);
});
